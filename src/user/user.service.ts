import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  FailedCrafts,
  OpenedArtifact,
  User,
  getCurrentTimePlusCooldown,
} from './user.schema';
import { Pair } from 'src/pair/pair.schema';
import { Artifact } from 'src/artifact/artifact.schema';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { fromUri, upload } from './file';
import { ConfigService } from '@nestjs/config';
import { BatchRewards, mapBatchReward } from './batch-rewards.schema';
import { ClaimableArtifact } from './claimable-artifact.schema';
import { REWARDS_RULES } from 'src/referrals/referrals-service/reward-rules';
import { RefCode } from 'src/referrals/refCodes.schema';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { APP_CONFIGS } from 'src/utils/app-configs';
import { mapOpenedArtifactToDto } from 'src/utils/dto';
import { UserBalances } from './user-balances.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,

    @InjectModel(FailedCrafts.name) private failedCrafts: Model<FailedCrafts>,

    @InjectModel(BatchRewards.name) private batchRewards: Model<BatchRewards>,

    @InjectModel(RefCode.name) private refCodeModel: Model<RefCode>,

    @InjectModel(UserBalances.name)
    private userBalancesModel: Model<UserBalances>,

    private appCacheService: AppCacheService,
    private configService: ConfigService,
    private analyticsService: AnalyticsService,
  ) {}

  async getUsers() {
    return await this.userModel.find();
  }

  async getUserBalances(user: User) {
    const data = await this.userBalancesModel.findOne({ user: user._id });

    return {
      updatedAt: data.updatedAt,
      balance: data.balance,
    };
  }

  async getInventory(user: User) {
    return {
      inventory: user.inventory.map(mapOpenedArtifactToDto),
      inventorySize: user.inventory.length,
    };
  }

  async getRefCodeUsers(user: User) {
    const userRefCodes = await this.refCodeModel.find({ author: user._id });
    const codesList = userRefCodes.map((code) => code.code);
    const friends = await this.usersByRefCodes(codesList);
    return friends;
  }

  async changeLanguage(user: User, language: string) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { language },
    );

    await this.updateUserInCache(user);

    return true;
  }

  async getUserCrafts(user: User) {
    return (
      await this.userModel.findById(user._id).populate({
        path: 'craftedHistory',
        model: Pair.name,
        populate: [
          { path: 'matchResult', model: Artifact.name },
          { path: 'first', model: Artifact.name },
          { path: 'second', model: Artifact.name },
        ],
      })
    ).craftedHistory;
  }
  async markAsClaimed(batch: BatchRewards) {
    await this.batchRewards.updateOne({ _id: batch._id }, { isClaimed: true });
  }

  async setRefCode(user: User, refCode: string) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { referredByCode: refCode },
    );

    await this.updateUserInCache(user);
  }

  updateClaimableRewardsAmount = async (user: User) => {
    const amount = await this.getNotClaimedRewardsAmount(user);

    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { claimableRewardsAmount: amount },
    );

    await this.updateUserInCache(user);
  };

  async setNotifiedAboutGifts(user: User, value = true) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { notifiedAboutGifts: value },
    );

    await this.updateUserInCache(user);
  }

  async hasBatchReward(user: User, batchId: string) {
    const foundUser = await this.userModel
      .findById(user._id)
      .populate('batchRewards', null, BatchRewards.name);

    return foundUser.batchRewards.some(
      (batch) => batch._id.toString() === batchId,
    );
  }

  async getBatchRewardById(id: string) {
    return await this.batchRewards.findById(id).populate({
      path: 'claimableArtifacts',
      model: ClaimableArtifact.name,
      populate: { path: 'artifact', model: Artifact.name },
    });
  }

  async attachNewBatchReward(user: User, newBatch: BatchRewards) {
    const updated = await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { $push: { batchRewards: newBatch._id } },
    );

    await this.updateUserInCache(user);

    return updated;
  }

  async getNotClaimedBatchRewards(user: User) {
    return (
      await this.batchRewards
        .find({
          _id: { $in: user.batchRewards },
          isClaimed: false,
        })
        .populate({
          path: 'claimableArtifacts',
          model: ClaimableArtifact.name,
          populate: { path: 'artifact', model: Artifact.name },
        })
        .populate({
          path: 'triggeredByUser',
          model: User.name,
        })
        .sort({
          level: 1,
        })
    ).map((batch) => mapBatchReward(user, batch));
  }

  async getNotClaimedRewardsAmount(user: User) {
    return await this.batchRewards.countDocuments({
      _id: { $in: user.batchRewards },
      isClaimed: false,
    });
  }

  async increaseCounter(user: User, counter: number) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      {
        invitedUsersAmount: counter,
      },
    );

    await this.updateUserInCache(user);
  }

  async getUsersWithSlots() {
    return await this.userModel.find({
      $or: [
        { notifiedAboutGifts: { $exists: false } },
        { notifiedAboutGifts: false },
      ],
    });
  }

  async saveUser(user: User) {
    const saved = await user.save();

    await this.updateUserInCache(user);

    return saved;
  }

  async attachNewInventoryItem(user: User, newPaired: OpenedArtifact) {
    const updated = await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { $push: { inventory: newPaired._id } },
    );

    await this.updateUserInCache(user);

    return updated;
  }

  async attachNewClaimableArtifact(
    br: BatchRewards,
    newClaimable: ClaimableArtifact,
  ) {
    const updated = await this.batchRewards.updateOne(
      { _id: br._id },
      { $push: { claimableArtifacts: newClaimable._id } },
    );

    return updated;
  }

  async updateClaimableSlots(user: User, newSlots: Date[]) {
    const updated = await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { claimableSlots: newSlots },
    );

    await this.updateUserInCache(user);

    return updated;
  }

  async countUsersByRefCodes(refCodes: string[]) {
    return await this.userModel.countDocuments({
      referredByCode: { $in: refCodes },
    });
  }

  async usersByRefCodes(refCodes: string[]) {
    return await this.userModel
      .find({
        referredByCode: { $in: refCodes },
      })
      .sort({ _id: 1 })
      .limit(REWARDS_RULES.length);
  }

  async attachNewCraftedPair(user: User, newPair: Pair) {
    const hasCraftForPair = await this.userModel.exists({
      telegramId: user.telegramId,
      craftedHistory: newPair._id,
    });

    if (!hasCraftForPair) {
      await this.userModel.updateOne(
        { telegramId: user.telegramId },
        {
          level: Math.max(user.level, newPair.matchResult.level),
          $push: { craftedHistory: newPair._id },
        },
      );

      await this.updateUserInCache(user);
    }
  }

  async hasFailedCraftsForUser(user: User, a: Artifact, b: Artifact) {
    return await this.failedCrafts.exists({
      user: user._id,
      $or: [
        { artifactFirst: a._id, artifactSecond: b._id },
        { artifactFirst: b._id, artifactSecond: a._id },
      ],
    });
  }

  async attachNewFailedPair(user: User, a: Artifact, b: Artifact) {
    const hasFailed = await this.hasFailedCraftsForUser(user, a, b);

    if (!hasFailed) {
      const craft = await this.failedCrafts.create({
        user: user._id,
        artifactFirst: a._id,
        artifactSecond: b._id,
      });

      await craft.save();
    }
  }

  async attachTonAddress(user: User, tonAddress: string) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { tonAddress: tonAddress },
    );

    await this.updateUserInCache(user);
  }

  async getOrCreateUser(
    {
      id,
      first_name,
      last_name,
      username,
      language_code,
      is_bot = false,
    }: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
      language_code: string;
      is_premium: boolean;
      allows_write_to_pm: boolean;
      is_bot?: boolean;
    },
    update = false,
    fileUrl?: string,
    createNew = false,
    refCode?: string,
    src?: string,
  ) {
    const userExsisted = await this.getCachedUser(id);

    if (!userExsisted) {
      if (!createNew) {
        return {
          user: null,
          isNew: false,
        };
      }

      const newUser = new this.userModel({
        telegramId: id,
        username: username,
        first_name: first_name,
        last_name: last_name,
        language: APP_CONFIGS.DEFAULT_LANGUAGE, // language_code, default language is en
        is_bot: is_bot,
        referredByCode: refCode,
        source: src,
        claimableSlots: [
          getCurrentTimePlusCooldown(1),
          getCurrentTimePlusCooldown(2),
          getCurrentTimePlusCooldown(3),
        ],
      });

      newUser.photoUrl = await this.uploadPhoto(newUser, fileUrl);

      await this.saveUser(newUser);

      await this.analyticsService.newUserRegistrationEvent(newUser);

      return {
        user: newUser,
        isNew: true,
      };
    }

    if (userExsisted && update) {
      userExsisted.username = username;
      userExsisted.first_name = first_name;
      userExsisted.last_name = last_name;
      userExsisted.language = language_code;
      userExsisted.is_bot = is_bot;
      userExsisted.photoUrl = await this.uploadPhoto(userExsisted, fileUrl);

      await this.saveUser(userExsisted);
    }

    return {
      user: userExsisted,
      isNew: false,
    };
  }

  async getCachedUser(telegramId: string | number): Promise<User> {
    const cachedUser = await this.appCacheService.getUser(telegramId);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await this._getUserModel(telegramId);

    if (user) {
      await this.appCacheService.setUser(user);
    }

    return user;
  }

  private async _getUserModel(telegramId: string | number) {
    const user = await this.userModel
      .findOne({
        telegramId: telegramId,
      })
      .populate({
        path: 'inventory',
        model: OpenedArtifact.name,
        populate: { path: 'artifact', model: Artifact.name },
      });

    return user;
  }

  // "rel_92619408-5c3e9a7866a8", "rel_92619408-a26a0d738229", "rel_92619408-530ff3df04b1", "rel_92619408-243a6b1b26e5", "rel_92619408-9ef0bef5513f", "rel_92619408-68ec106ef3cd", "rel_92619408-43caf2661499"
  // {referredByCode: {$in: ["rel_92619408-5c3e9a7866a8", "rel_92619408-a26a0d738229", "rel_92619408-530ff3df04b1", "rel_92619408-243a6b1b26e5", "rel_92619408-9ef0bef5513f", "rel_92619408-68ec106ef3cd", "rel_92619408-43caf2661499"]}}
  async updateUserInCache(user: User) {
    const dbUser = await this._getUserModel(user.telegramId);

    if (dbUser) {
      await this.appCacheService.setUser(dbUser);
    }

    return dbUser;
  }

  async findUsersByRefCodes(
    refCodes: string[],
    cursor,
    limit,
  ): Promise<User[]> {
    const props = cursor ? { _id: { $gt: cursor } } : {};

    return await this.userModel
      .find({ referredByCode: { $in: refCodes }, ...props })
      // sort by id from lowest to highest
      .sort({ _id: 1, level: -1 })
      .limit(limit)
      .populate({
        path: 'inventory',
        model: OpenedArtifact.name,
        populate: { path: 'artifact', model: Artifact.name },
      });
  }

  async uploadPhoto(user: User, fileUrl: string) {
    if (!fileUrl) {
      return null;
    }

    try {
      const img = await fromUri(fileUrl);

      const extension = fileUrl.split('.').pop();

      const result: any = await upload(
        `${user.telegramId.toString()}.${extension}`,
        img,
        'avatars',
        this.configService.get<string>('IS_TON_PRODUCTION'),
      );

      return result?.publicUrl || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async updateLastCheckedAmount(user: User, amountFriends: number) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      { lastFriendsClaimedAmount: amountFriends },
    );
  }

  async updateUserTimers(
    user: User,
    slots: Date[],
    userItemsRegenerationTime: number,
  ) {
    await this.userModel.updateOne(
      { telegramId: user.telegramId },
      {
        claimableSlots: slots,
        itemRegenerationTime: userItemsRegenerationTime,
      },
    );
  }

  async getTopReferrers() {
    return await this.userModel
      .find()
      .sort({ invitedUsersAmount: -1 })
      .limit(100);
  }

  async getTopLevelUsers() {
    return await this.userModel.find().sort({ level: -1 }).limit(100);
  }

  async getTopCraftedPairs() {
    // each user has array of invetory items
    // return list of users sorted by invenory items count and limit to 100

    const ids = await this.userModel
      //.aggregate([{ $unwind: '$inventory' }, { $sortByCount: '$inventory' }])

      .aggregate([
        {
          $unwind: {
            path: '$inventory',
          },
        },
        {
          $group: {
            _id: '$_id',
            craftedAmount: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            craftedAmount: -1,
          },
        },
        /*{
          $addFields: {
            id: '$_id',
          },
        },*/
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
      ])
      .limit(100);

    return ids;
  }
}
