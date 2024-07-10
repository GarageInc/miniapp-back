import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from 'src/user/user.service';
import { RefCode } from '../refCodes.schema';
import { User } from 'src/user/user.schema';
import { mapFriendToDto } from 'src/utils/dto';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'papaparse';
import { APP_CONFIGS } from 'src/utils/app-configs';
import { ArtifactService } from 'src/artifact/artifact.service';
import { BatchRewards } from 'src/user/batch-rewards.schema';
import { REWARDS_RULES } from './reward-rules';
import { FRIENDS_AMOUNT_FOR_FAILED_CRAFTS } from 'src/utils/canSeeFailedCrafts';
import { TransactionService } from 'src/database/transaction.service';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Queue } from 'bull';

interface Entity {
  some: string;
}

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(RefCode.name) private refCodeModel: Model<RefCode>,

    @InjectQueue(QUEUE_NAMES.FOLLOWERS) private followersQueue: Queue,

    private userService: UserService,
    private artifactService: ArtifactService,
    private transactionService: TransactionService,
  ) {}

  async saveFriendsRewardsJson() {
    const filePath = __dirname + '/../../../MATH - Friends Rewards.csv';

    const items: Entity[] = [];

    const content = await readFileSync(filePath, 'utf8');

    await parse(content, {
      delimiter: ',',
      header: true,
      download: false,

      step: function (row: any) {
        items.push(row.data);

        return row.data;
      },
      complete: function (data) {
        console.log('All done!', data);
      },
    });

    await writeFileSync(
      __dirname + '/../../../' + `rewards.json`,
      JSON.stringify(items),
      'utf8',
    );

    return true;
  }

  async calculateReferralBonuses(user: User): Promise<boolean> {
    try {
      const userRefCodes = await this.refCodeModel.find({ author: user._id });
      const codesList = userRefCodes.map((code) => code.code);
      const friends = await this.userService.usersByRefCodes(codesList);

      const friendsAmount = friends.length;

      const lastCheckedUsersAmount = user.lastFriendsClaimedAmount || 0;
      let lastCheckedLevel = 0;
      let hasRewards = false;

      console.log(
        'friendsList for user ',
        friends.map((f) => f.username),
      );

      for (const rule of REWARDS_RULES) {
        const invitedFriendsAmount = parseInt(
          rule['Invited Friends']?.toString(),
          10,
        );

        if (friendsAmount < invitedFriendsAmount) {
          break;
        }

        if (invitedFriendsAmount <= lastCheckedUsersAmount) {
          continue;
        }

        const userSlotsAmount = parseInt(
          rule['Opened cells in Gift-box']?.toString(),
          10,
        );
        const userItemsRegenerationTime =
          parseInt(rule['Item regeneration time (min)']?.toString(), 10) *
          1000 *
          60;
        const firstLvlCount = parseInt(rule['lvl 1']?.toString(), 10);
        const secondLvlCount = parseInt(rule['lvl 2']?.toString(), 10);

        if (firstLvlCount || secondLvlCount) {
          hasRewards = true;

          const level = invitedFriendsAmount;
          lastCheckedLevel = level;

          const itemRegenerationTimeDelta =
            user.itemRegenerationTime - userItemsRegenerationTime;

          const batchRewards = await this.artifactService.createBatchRewards(
            level,
            userSlotsAmount,
            userItemsRegenerationTime,
            itemRegenerationTimeDelta,
            level === FRIENDS_AMOUNT_FOR_FAILED_CRAFTS,
            friends[level - 1],
          );

          if (firstLvlCount) {
            await this.artifactService.addClaimableSlots(
              batchRewards,
              firstLvlCount,
              1,
            );
          }

          if (secondLvlCount) {
            await this.artifactService.addClaimableSlots(
              batchRewards,
              secondLvlCount,
              2,
            );
          }

          await this.userService.attachNewBatchReward(user, batchRewards);
        }
      }

      await this.userService.updateLastCheckedAmount(
        user,
        lastCheckedLevel || friendsAmount,
      );

      return hasRewards;
    } catch (error) {
      console.error('Error calculating referral bonuses:', error);
      throw new Error('Error calculating referral bonuses');
    }
  }

  async getClaimableBonuses(user: User) {
    const batchRewards = await this.userService.getNotClaimedBatchRewards(user);

    return {
      batchRewards,
    };
  }

  private async getClaimableTimeBonuses(user: User, rewards: BatchRewards) {
    const userRefCodes = await this.refCodeModel.find({ author: user._id });

    const codesList = userRefCodes.map((code) => code.code);

    const friendsAmount = await this.userService.countUsersByRefCodes(
      codesList,
    );

    let userSlotsAmount = user.claimableSlots.length;
    let userItemsRegenerationTime = user.itemRegenerationTime;

    userSlotsAmount = Math.max(userSlotsAmount, rewards.giftSlotsAmount);

    userItemsRegenerationTime = Math.min(
      userItemsRegenerationTime,
      rewards.itemRegenerationTime,
    );

    const slots = [...user.claimableSlots];
    let counter = 0;

    for (let i = 0; i < userSlotsAmount; i++) {
      const currentTime = new Date();

      if (!slots[i]) {
        counter++;
        slots[i] = new Date(
          currentTime.getTime() +
            (userItemsRegenerationTime ||
              APP_CONFIGS.DEFAULT_COOLDOWN_GIFT_ARTIFACT) *
              counter,
        );
      }
    }

    return {
      slots,
      userItemsRegenerationTime: userItemsRegenerationTime,
      friendsAmount,
    };
  }

  async claimBonuses(
    user: User,
    batchId: string,
    updateUserRewardsAmount = true,
  ) {
    return await this.transactionService.runTransaction(user, async () => {
      if (!(await this.userService.hasBatchReward(user, batchId))) {
        throw new Error('Batch reward not found');
      }

      const claimableBatch = await this.userService.getBatchRewardById(batchId);

      if (!claimableBatch) {
        throw new Error('Batch reward not found by id');
      }

      await this.claimArtifactBonuses(user, claimableBatch);

      const { slots, userItemsRegenerationTime } =
        await this.getClaimableTimeBonuses(user, claimableBatch);

      await this.userService.updateUserTimers(
        user,
        slots,
        userItemsRegenerationTime,
      );

      await this.userService.markAsClaimed(claimableBatch);

      if (updateUserRewardsAmount) {
        await this.userService.updateClaimableRewardsAmount(user);
      }

      return true;
    });
  }

  async claimBatchBonuses(user: User, batchIds: string[]) {
    for (let i = 0; i < batchIds.length; i++) {
      const batchId = batchIds[i];
      await this.claimBonuses(user, batchId, false);
    }

    await this.userService.updateClaimableRewardsAmount(user);

    return {
      user: await this.userService.getCachedUser(user.telegramId),
    };
  }

  async claimArtifactBonuses(userIncoming: User, batch: BatchRewards) {
    for (const item of batch.claimableArtifacts) {
      const user = await this.userService.getCachedUser(
        userIncoming.telegramId,
      );

      const artifact = await this.artifactService.getArtifactById(
        item.artifact.id,
      );

      await this.artifactService.createOrAddArtifact(
        user,
        artifact,
        item.count,
      );

      await this.userService.updateUserInCache(user);
    }
  }

  async generateReferralCode(user: User) {
    const countUserCodes = await this.refCodeModel.countDocuments({
      author: user._id,
    });

    if (countUserCodes >= APP_CONFIGS.CODES_LIMIT) {
      const lastGenerated = await this.refCodeModel
        .find({ author: user._id })
        .sort({ createdAt: -1 })
        .limit(1);

      if (lastGenerated.length) {
        return lastGenerated[0].code;
      } else {
        return null;
      }
    }

    while (true) {
      const uids = uuidv4().split('-');
      const newRefcodeUid = 'rel_' + uids[uids.length - 1];

      if (!(await this.isRefCodeExists(newRefcodeUid))) {
        await this.refCodeModel.create({
          code: newRefcodeUid,
          author: user,
        });

        return newRefcodeUid;
      }
    }
  }

  async isRefCodeExists(refCode: string) {
    return await this.refCodeModel.exists({
      code: refCode,
    });
  }

  async getUserReferralCodes(user: User) {
    const userRefCodes = await this.refCodeModel.find({ author: user._id });

    return userRefCodes;
  }

  async getRefCodeOwner(refCode: string) {
    const refCodeDoc = await this.refCodeModel
      .findOne({ code: refCode })
      .populate('author', null, User.name);

    if (!refCodeDoc) {
      return null;
    }

    return this.userService.getCachedUser(refCodeDoc.author.telegramId);
  }

  async getFriendsAmount(user: User) {
    const userRefCodes = await this.refCodeModel.find({ author: user._id });

    const codesList = userRefCodes.map((code) => code.code);

    return await this.userService.countUsersByRefCodes(codesList);
  }

  async getReferredFriends(user: User, cursor: string, limit: number) {
    const userRefCodes = await this.refCodeModel.find({ author: user._id });

    const codesList = userRefCodes.map((code) => code.code);

    if (!codesList.length) {
      return [];
    }

    const list = await this.userService.findUsersByRefCodes(
      codesList,
      cursor,
      limit,
    );

    /*
    if (user.referredByCode) {
      const referredByUser = await this.getUserByRefCode(user.referredByCode);

      return referredByUser ? [referredByUser, ...list] : list;
    }

    */
    return list.map(mapFriendToDto);
  }

  async isUserFriend(user: User, friendId: string) {
    const friend = await this.userService.getCachedUser(friendId);

    const hasRefCode = await this.isRefCodeBelongsToUser(
      user,
      friend.referredByCode,
    );

    return hasRefCode;
  }

  async isRefCodeBelongsToUser(user: User, refCode: string) {
    return await this.refCodeModel.exists({
      code: refCode,
      author: user._id,
    });
  }

  async getFriendInventory(user: User, friendId: string) {
    if (!(await this.isUserFriend(user, friendId))) {
      throw new Error('User is not your friend');
    }

    const friend = await this.userService.getCachedUser(friendId);

    return mapFriendToDto(friend);
  }

  handleReferral = async (
    refCode: string,
    src: string,
    fromUser: any,
    fileUrl: string,
  ) => {
    console.log('User creation processor', refCode);

    if (!refCode) {
      return false;
    }

    const { user, isNew } = await this.userService.getOrCreateUser(
      fromUser,
      true,
      fileUrl,
      true,
      undefined, // We set ref code in next step
      src,
    );

    if (isNew && !user.inventory?.length) {
      await this.artifactService.generateInitialArtifacts(user);
    }

    isNew && (await this.countReferrals(refCode, user));
  };

  async countReferrals(refCode: string, user: User) {
    if (refCode) {
      const owner = await this.getRefCodeOwner(refCode);

      if (!user.referredByCode) {
        const isExist = await this.isRefCodeExists(refCode);

        if (isExist) {
          await this.userService.setRefCode(user, refCode);
        }
      }

      await this.followersQueue.add('followers', {
        telegramId: owner.telegramId,
      });
    }
  }
}
