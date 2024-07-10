import { Injectable } from '@nestjs/common';
import { Artifact } from './artifact.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  BURN_STATUS,
  LockedBurn,
  LockedMint,
  MINT_STATUS,
  OpenedArtifact,
  User,
} from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { APP_CONFIGS } from 'src/utils/app-configs';
import { writeFileSync } from 'fs';
import { OLD_CDN, fromUri, getBucketName, upload } from 'src/user/file';
import { ConfigService } from '@nestjs/config';
import { BatchRewards } from 'src/user/batch-rewards.schema';
import { ClaimableArtifact } from 'src/user/claimable-artifact.schema';
import { TransactionService } from 'src/database/transaction.service';
import { UserBalancesService } from 'src/user/user-balances.service';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function replaceEmptyPlaceWith_(s: string) {
  return s.replace(/\s/g, '_');
}

@Injectable()
export class ArtifactService {
  constructor(
    @InjectModel(Artifact.name) private artifactModel: Model<Artifact>,
    @InjectModel(OpenedArtifact.name)
    private openedArtifact: Model<OpenedArtifact>,

    @InjectModel(ClaimableArtifact.name)
    private claimableArtifact: Model<ClaimableArtifact>,

    @InjectModel(LockedMint.name)
    private lockedMint: Model<LockedMint>,
    @InjectModel(LockedBurn.name)
    private lockedBurn: Model<LockedBurn>,

    @InjectModel(BatchRewards.name)
    private batchRewards: Model<BatchRewards>,

    private userService: UserService,
    private appCacheService: AppCacheService,

    private configService: ConfigService,

    private transactionService: TransactionService,

    private userBalancesService: UserBalancesService,
  ) {}

  async getFirstLevelArtifacts() {
    return this.artifactModel.find({
      level: 1,
    });
  }

  async createBatchRewards(
    level: number,
    userSlotsAmount: number,
    userItemsRegenerationTime: number,
    itemRegenerationTimeDelta: number,
    canSeeFailedCrafts: boolean,
    friend: User,
  ) {
    const batchRewards = new this.batchRewards({
      level: +level,
      claimableArtifacts: [],
      isClaimed: false,
      giftSlotsAmount: userSlotsAmount,
      itemRegenerationTime: userItemsRegenerationTime,
      itemRegenerationTimeDelta: itemRegenerationTimeDelta,
      triggeredByUser: friend?._id,
      canSeeFailedCrafts: canSeeFailedCrafts,
    });

    await batchRewards.save();

    return batchRewards;
  }

  async getAll() {
    return this.artifactModel.find();
  }

  async hasPendingBurn(user: User, nftIndex: string) {
    return await this.lockedBurn.findOne({
      user: user._id,
      nftIndex: nftIndex,
      status: BURN_STATUS.PENDING,
    });
  }

  async hasPendingMint(user: User, nftIndex: string) {
    return await this.lockedMint.findOne({
      user: user._id,
      nftIndex: nftIndex,
      status: MINT_STATUS.PENDING,
    });
  }

  async createBurnRecord(user: User, nftIndex: string, targetAddress: string) {
    const burnedItem = new this.lockedBurn({
      status: BURN_STATUS.PENDING,
      user: user._id,
      nftIndex: nftIndex,
      targetAddress: targetAddress,
    });

    await burnedItem.save();

    return burnedItem;
  }

  async lockUserArtifact(
    user: User,
    artifactId: string,
    mintTxHash: string,
    nftIndex: string,
    targetAddress: string,
  ) {
    const inventoryItem = user.inventory.find(
      (item) => item.artifact.id === artifactId,
    );

    await this.incrDecrementCraftedAmount(inventoryItem, false);

    const lockedItem = new this.lockedMint({
      artifact: inventoryItem.artifact._id,
      txHash: mintTxHash,
      status: MINT_STATUS.PENDING,
      user: user._id,
      nftIndex: nftIndex,
      targetAddress: targetAddress,
    });

    await lockedItem.save();

    return lockedItem;
  }

  async returnArtifactToUser(mint: LockedMint) {
    const artifact = await this.getArtifactById(mint.artifact.id);
    const user = await this.userService.getCachedUser(mint.user.telegramId);
    const openedArtifact = user.inventory.find(
      (item) => item.artifact.id === artifact.id,
    );

    return await this.incrDecrementCraftedAmount(openedArtifact, true);
  }

  async returnBurnedArtifactToUser(burn: LockedBurn, artifactId: string) {
    const artifact = await this.getArtifactById(artifactId);

    const user = await this.userService.getCachedUser(burn.user.telegramId);

    await this.createOrAddArtifact(
      user,
      artifact,
      APP_CONFIGS.AMOUNT_RETURN_FOR_BURN,
    );
  }

  async addClaimableSlots(
    batchRewards: BatchRewards,
    amount: number,
    level: number,
  ) {
    const artifacts = await this.artifactModel.find({
      level: level,
    });

    for (let i = 0; i < amount; i++) {
      const randowArtifact = this.getRandomArtifactFromList(artifacts);

      await this.createOrAddClaimableArtifact(batchRewards, randowArtifact);
    }
  }

  getRandomArtifactFromList(artifacts: Artifact[]) {
    return artifacts[this._getRandomId(0, artifacts.length)];
  }

  async claimFirstRemainingArtifact(incomingUser: User) {
    return await this.transactionService.runTransaction(
      incomingUser,
      async () => {
        const user = await this.userService.getCachedUser(
          incomingUser.telegramId,
        );

        const currentTime = new Date();

        const slots = user.claimableSlots;

        const earliestSlot = slots
          .filter((item) => {
            return currentTime.getTime() > item.getTime();
          })
          .sort((a, b) => a.getTime() - b.getTime())[0];

        const gifts = [];

        const firstLevelArtifacts = await this.getFirstLevelArtifacts();

        let coinRewards = 0;
        if (earliestSlot) {
          const indexOrEarliestSlot = slots.findIndex(
            (s) => s.getTime() === earliestSlot.getTime(),
          );

          if (currentTime.getTime() > earliestSlot.getTime()) {
            const newRandomArtifact =
              this.getRandomArtifactFromList(firstLevelArtifacts);

            await this.createOrAddArtifact(user, newRandomArtifact);

            gifts.push(newRandomArtifact);

            coinRewards += APP_CONFIGS.COIN_REWARDS.getRandomForCreation();
            await this.userBalancesService.increaseBalance(user, coinRewards);

            const oldestSlot =
              slots
                .filter((item) => item.getTime() > currentTime.getTime())
                .sort((a, b) => b.getTime() - a.getTime())?.[0] || currentTime;

            slots[indexOrEarliestSlot] = new Date(
              oldestSlot.getTime() +
                (user.itemRegenerationTime ||
                  APP_CONFIGS.DEFAULT_COOLDOWN_GIFT_ARTIFACT),
            );

            await this.userService.updateClaimableSlots(user, slots);

            await this.userService.setNotifiedAboutGifts(user, false);
          }
        }

        return {
          user: await this.userService.getCachedUser(incomingUser.telegramId),
          gifts,
          newCoinsReceived: coinRewards,
        };
      },
    );
  }

  async incrDecrementCraftedAmount(
    item: OpenedArtifact,
    positive: boolean,
    amount = 1,
  ) {
    const cached = await this.appCacheService.getOpenedArtifact(item._id);

    const found =
      cached || (await this.openedArtifact.findOne({ _id: item._id }));

    if (positive) {
      found.count = Math.min(
        +APP_CONFIGS.MAX_ITEMS_AMOUNT,
        found.count + amount,
      );
    } else {
      found.count = Math.max(0, found.count - amount);
    }

    return await this.updateCount(found);
  }

  async incrDecrementClaimableAmount(
    item: ClaimableArtifact,
    positive: boolean,
  ) {
    const cached = await this.appCacheService.getClaimableArtifact(item._id);

    const found =
      cached || (await this.claimableArtifact.findOne({ _id: item._id }));

    if (positive) {
      found.count = found.count + 1;
    } else {
      found.count = found.count - 1;
    }

    return await this.updateClaimableCount(found);
  }

  async updateCount(item: OpenedArtifact) {
    await this.openedArtifact.updateOne(
      { _id: item._id },
      { count: item.count },
    );

    const found = await this.openedArtifact.findOne({ _id: item._id });

    await this.appCacheService.setOpenedArtifact(found._id, found);

    return found;
  }

  async updateClaimableCount(item: ClaimableArtifact) {
    await this.claimableArtifact.updateOne(
      { _id: item._id },
      { count: item.count },
    );

    const found = await this.claimableArtifact.findOne({ _id: item._id });

    await this.appCacheService.setClaimableArtifact(found._id, found);

    return found;
  }

  async createOrAddArtifact(user: User, artifact: Artifact, count = 1) {
    if (artifact) {
      const targetOpenedArtifact = user.inventory.find(
        (o) => o.artifact.id === artifact.id,
      );

      if (targetOpenedArtifact) {
        await this.incrDecrementCraftedAmount(
          targetOpenedArtifact,
          true,
          count,
        );

        return {
          isNew: false,
        };
      } else {
        const newOpened = await this.createOpenedArtifact(artifact, count);

        await this.userService.attachNewInventoryItem(user, newOpened);
      }
    }

    return {
      isNew: true,
    };
  }

  async createOrAddClaimableArtifact(batch: BatchRewards, artifact: Artifact) {
    if (artifact) {
      const targetOpenedArtifact = batch.claimableArtifacts.find(
        (o) => o.artifact.id === artifact.id,
      );

      if (targetOpenedArtifact) {
        await this.incrDecrementClaimableAmount(targetOpenedArtifact, true);

        return {
          isNew: false,
        };
      } else {
        const newClaimable = await this.createClaimableArtifact(artifact);

        await this.userService.attachNewClaimableArtifact(batch, newClaimable);
      }
    }

    return {
      isNew: true,
    };
  }

  async createOpenedArtifact(artifact: Artifact, count = 1) {
    const newOpened = new this.openedArtifact({
      artifact: artifact._id,
      count: count,
    });

    await newOpened.save();

    await this.appCacheService.setOpenedArtifact(artifact._id, newOpened);

    return newOpened;
  }

  async createClaimableArtifact(artifact: Artifact) {
    const newClaimable = new this.claimableArtifact({
      artifact: artifact._id,
      count: 1,
    });

    await newClaimable.save();

    await this.appCacheService.setClaimableArtifact(artifact._id, newClaimable);

    return newClaimable;
  }

  async generateInitialArtifacts(inputUser: User) {
    const firstLevelArtifacts = await this.getFirstLevelArtifacts();

    for (const artifact of firstLevelArtifacts) {
      const newArtifact = await this.getArtifactById(artifact.id);

      const user = await this.userService.getCachedUser(inputUser.telegramId);

      await this.createOrAddArtifact(
        user,
        newArtifact,
        APP_CONFIGS.DEFAULT_AMOUNT_ARTIFACTS_ON_INIT,
      );
    }
  }

  async getRandomArtifact(totalCount: number) {
    const newArtifact = await this.getArtifactById(
      `${this._getRandomId(0, totalCount) + 1}`,
    );

    return newArtifact;
  }

  async addBonusArtifacts() {
    const openedWithArtifactLevel1 = await this.openedArtifact
      .find()
      .populate('artifact', null, Artifact.name);

    const level1 = openedWithArtifactLevel1.filter(
      (item) => item.artifact?.level === 1,
    );

    for (const artifact of level1) {
      await this.incrDecrementCraftedAmount(artifact, true, 5);
    }

    return true;
  }

  async getArtifactById(id: string) {
    const cached = await this.appCacheService.getArtifact(id);

    if (cached) {
      return cached;
    }

    const item = await this.artifactModel.findOne({
      id,
    });

    await this.appCacheService.setArtifact(id, item);

    return item;
  }

  _getRandomId(from = 0, to: number) {
    return Math.floor(Math.random() * (to - from) + from);
  }

  async totalArtifactsCountFirstLevel() {
    return this.artifactModel.countDocuments({
      level: 1,
    });
  }

  async createOrUpdate(a: {
    id: string;
    name: string;
    level: string;
    mintingPrice: string;
    designDescription: string;
    backgroundColor: string;
    strokeColor: string;
  }) {
    const artifact = await this.getArtifactById(a.id);

    const CDN_URl = `https://${getBucketName(
      this.configService.get<string>('IS_TON_PRODUCTION'),
    )}/images/`;

    const logoUrl = `${CDN_URl}${a.id}.webp`;
    const gifUrl = `${CDN_URl}gifs/${a.id}.webp`;
    const thumbUrl = `${CDN_URl}thumb/${a.id}.webp`;

    if (artifact) {
      artifact.id = a.id;
      artifact.name = a.name;
      artifact.level = Number(a.level);
      artifact.mintingPrice = a.mintingPrice;
      artifact.description = a.designDescription;
      artifact.logoUrl = logoUrl;
      artifact.updatedAt = new Date();
      artifact.backgroundColor = a.backgroundColor;
      artifact.strokeColor = a.strokeColor;
      artifact.gifUrl = gifUrl;
      artifact.thumbnailUrl = thumbUrl;

      await this.createJsonFile(artifact);
      return artifact.save();
    }

    const newArtifact = new this.artifactModel({
      id: a.id,
      name: capitalize(a.name),
      level: Number(a.level),
      mintingPrice: a.mintingPrice,
      description: a.designDescription,
      logoUrl: logoUrl,
      gifUrl: gifUrl,
      thumbnailUrl: thumbUrl,
      backgroundColor: a.backgroundColor,
      strokeColor: a.strokeColor,
    });

    await this.createJsonFile(newArtifact);

    return newArtifact.save();
  }

  async createJsonFile(a: Artifact) {
    const OLD_CDN_URl_IMAGES = `https://${OLD_CDN}/images/`;
    const OLD_CDN_URl = `https://${OLD_CDN}/`;

    const oldHighQualityLogoUrl = `${OLD_CDN_URl}nfts/images/${replaceEmptyPlaceWith_(
      a.name.toLowerCase(),
    )}.png`;
    const oldLogoUrl = `${OLD_CDN_URl_IMAGES}${replaceEmptyPlaceWith_(
      a.name.toLowerCase(),
    )}.webp`;
    const oldGifUrl = `${OLD_CDN_URl_IMAGES}gifs/${capitalize(
      a.name.toLowerCase(),
    )}.webp`; // TODO: names was not changed in cdn!
    const oldThumbUrl = `${OLD_CDN_URl_IMAGES}thumb/${replaceEmptyPlaceWith_(
      a.name.toLowerCase(),
    )}.webp`;

    await this.uploadNewFiles(oldLogoUrl, a.id, 'images');

    await this.uploadNewFiles(oldGifUrl, a.id, 'images/gifs');

    await this.uploadNewFiles(oldThumbUrl, a.id, 'images/thumb');

    await this.uploadNewFiles(oldHighQualityLogoUrl, a.id, 'nfts/images');

    const hightQualityImage = `https://${getBucketName(
      this.configService.get<string>('IS_TON_PRODUCTION'),
    )}/nfts/images/${a.id}.png`;

    const data = {
      id: a.id,
      name: capitalize(a.name),
      description: a.description,
      image: hightQualityImage,
      banner_image: hightQualityImage,
      featured_image: hightQualityImage,
      external_link: `https://${getBucketName(
        this.configService.get<string>('IS_TON_PRODUCTION'),
      )}/nfts/${a.id}.json`,
    };

    await writeFileSync(
      __dirname + '/../../files/' + `${a.id}.json`,
      JSON.stringify(data),
      'utf8',
    );
  }

  async uploadNewFiles(fileUrl: string, name: string, prefix: string) {
    if (!fileUrl) {
      return null;
    }

    try {
      const img = await fromUri(fileUrl);

      const extension = fileUrl.split('.').pop();

      const result: any = await upload(
        `${name}.${extension}`,
        img,
        prefix,
        this.configService.get<string>('IS_TON_PRODUCTION'),
      );

      return result?.publicUrl || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
