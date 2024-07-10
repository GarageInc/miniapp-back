import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ArtifactService } from 'src/artifact/artifact.service';
import { Pair } from './pair.schema';
import { Model } from 'mongoose';
import { PairDto } from './dto';
import { User } from 'src/user/user.schema';
import { readFileSync } from 'fs';
import { parse } from 'papaparse';
import { Artifact } from 'src/artifact/artifact.schema';
import { UserService } from 'src/user/user.service';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { mapUserToDto } from 'src/utils/dto';
import { createHash } from 'crypto';
import { remainingFriendsForFailedCrafts } from 'src/utils/canSeeFailedCrafts';
import { TransactionService } from 'src/database/transaction.service';
import { toArtifactDto } from 'src/artifact/dto';
import { UserBalancesService } from 'src/user/user-balances.service';
import { APP_CONFIGS } from 'src/utils/app-configs';

const SALT = 'AWESOME_SALT';

const createIdHash = (name: string) =>
  createHash('md5')
    .update(name + SALT)
    .digest('hex')
    .toString();

class Entity {
  '0': string;
  '321': string;
  ' ': string;
  'Item name': string;
  LVL: string;
  'Minting price, TON': string;
  'Background Color': string;
  'Stroke': string;
  'Design description': string;
  'R.1 Parent 1': string;
  'r1p1 ID': string;
  'R.1 Parent 2': string;
  'r1p2 ID': string;
  'R.2 Parent 1': string;
  'r2p1 ID': string;
  'R.2 Parent 2': string;
  'r2p2 ID': string;
  'R.3 Parent 1': string;
  'r3p1 ID': string;
  'R.3 Parent 2': string;
  'r3p2 ID': string;
  'Old Description': string;
  'New Description': string;
  'Количество символов': string;
}

@Injectable()
export class PairService {
  constructor(
    @InjectModel(Pair.name) private pairModel: Model<Pair>,
    private readonly artifactService: ArtifactService,
    private readonly userService: UserService,
    private readonly appCacheService: AppCacheService,
    private readonly transactionService: TransactionService,
    private readonly userBalancesService: UserBalancesService,
  ) {}

  async createPairModel(first: Artifact, second: Artifact, result: Artifact) {
    const item = await this.pairModel.create({
      first,
      second,
      matchResult: result,
    });

    await item.save();

    await this.appCacheService.setPair(item);

    return item;
  }

  generatePairs = async () => {
    // Create stream from file (or get it from S3)
    const filePath = __dirname + '/../../Crafttree - Elements.csv';

    const items: Entity[] = [];

    const content = await readFileSync(filePath, 'utf8');

    const data = await parse(content, {
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

    // Save artifacts to DB
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item['Item name'];
      const id = item[' '];
      const level = item['LVL'];

      if (name && id) {
        const idHash = createIdHash(id);
        await this.artifactService.createOrUpdate({
          id: idHash,
          name: name,
          level: level,
          mintingPrice: `${(+level * 0.1).toFixed(1)}`, // item['Minting price, TON'],
          designDescription: item['New Description'] || item['Old Description'],
          backgroundColor: item['Background Color']?.trim(),
          strokeColor: item['Stroke']?.trim(),
        });
      }
    }

    // Save pairs to DB
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const id = createIdHash(item[' ']);

      await this.createPairFromEntity(item, id, 'r1p1 ID', 'r1p2 ID');
      await this.createPairFromEntity(item, id, 'r2p1 ID', 'r2p2 ID');
      await this.createPairFromEntity(item, id, 'r3p1 ID', 'r3p2 ID');
    }

    return { items, data };
  };

  async isFailedCraft(user: User, firstId: string, secondId: string) {
    const a = await this.artifactService.getArtifactById(firstId);
    const b = await this.artifactService.getArtifactById(secondId);

    return await this.userService.hasFailedCraftsForUser(user, a, b);
  }

  private async createPairFromEntity(
    item: Entity,
    artifactId: string,
    parent1Id: string,
    parent2Id: string,
  ) {
    const resultItem = await this.artifactService.getArtifactById(artifactId);

    const firstItem = await this.artifactService.getArtifactById(
      createIdHash(item[parent1Id]),
    );
    const secondItem = await this.artifactService.getArtifactById(
      createIdHash(item[parent2Id]),
    );

    if (firstItem && secondItem && resultItem) {
      if (
        !(await this.pairModel.findOne({
          first: firstItem._id,
          second: secondItem._id,
          matchResult: resultItem._id,
        }))
      ) {
        await this.createPairModel(firstItem, secondItem, resultItem);
      }
    }
  }

  async getPairByArtifacts(first: Artifact, second: Artifact) {
    const id = `${first._id}-${second._id}`;

    const cachedPair = await this.appCacheService.getPair(id);

    if (cachedPair) {
      return cachedPair;
    }

    const pair = await this.pairModel
      .findOne({
        first: first._id,
        second: second._id,
      })
      .populate('first second matchResult', null, Artifact.name);

    if (pair) {
      await this.appCacheService.setPair(pair);
    }

    return pair;
  }

  async createPair(incomingUser: User, pair: PairDto) {
    return await this.transactionService.runTransaction(
      incomingUser,
      async () => {
        const user = await this.userService.getCachedUser(
          incomingUser.telegramId,
        );

        const first = user.inventory.find(
          (o) => o.artifact.id === pair.firstId && o.count > 0,
        );
        const second = user.inventory.find(
          (o) => o.artifact.id === pair.secondId && o.count > 0,
        );

        if (!first || !second) {
          return {
            error: 'Not enough items',
            user: mapUserToDto(user),
          };
        }

        const matchingPair1 = await this.getPairByArtifacts(
          first.artifact,
          second.artifact,
        );
        const matchingPair2 = await this.getPairByArtifacts(
          second.artifact,
          first.artifact,
        );

        const target = matchingPair1 || matchingPair2;

        if (target) {
          const { isNew } = await this.artifactService.createOrAddArtifact(
            user,
            target.matchResult,
          );

          await this.artifactService.incrDecrementCraftedAmount(first, false);
          await this.artifactService.incrDecrementCraftedAmount(second, false);

          await this.userService.attachNewCraftedPair(user, target);

          await this.userService.updateUserInCache(user);

          const newUser = await this.userService.getCachedUser(user.telegramId);

          const isLevelUp = user.level < newUser.level;

          const gifts = [];

          const coinRewards =
            (isNew ? APP_CONFIGS.COIN_REWARDS.NEW_ITEM : 0) +
            APP_CONFIGS.COIN_REWARDS.CRAFT_SUCCESS;

          if (isLevelUp) {
            const firstLevelArtifacts =
              await this.artifactService.getFirstLevelArtifacts();

            const randomArtifact1 =
              this.artifactService.getRandomArtifactFromList(
                firstLevelArtifacts,
              );

            await this.artifactService.createOrAddArtifact(
              user,
              randomArtifact1,
            );

            const randomArtifact2 =
              this.artifactService.getRandomArtifactFromList(
                firstLevelArtifacts,
              );

            await this.artifactService.createOrAddArtifact(
              user,
              randomArtifact2,
            );

            gifts.push(randomArtifact1);
            gifts.push(randomArtifact2);

            await this.userBalancesService.increaseBalance(
              user,
              coinRewards + APP_CONFIGS.COIN_REWARDS.LEVEL_UP,
            );

            await this.userService.updateUserInCache(user);
          } else {
            await this.userBalancesService.increaseBalance(user, coinRewards);
          }

          const responseUser = await this.userService.getCachedUser(
            user.telegramId,
          );
          return {
            gifts: gifts,
            isNewCraftedPair: isNew,
            remainingUsersForFailedCraftsView:
              remainingFriendsForFailedCrafts(responseUser),
            isLevelUp: isLevelUp,
            crafted: target.matchResult,
            user: mapUserToDto(responseUser),
          };
        } else {
          const estimatedLosses = await this.estimateLoss(pair);

          const firstLoss = estimatedLosses[pair.firstId].estimatedLoss;

          const randomZeroOne = Math.random();

          const looserWithHigherLoss =
            randomZeroOne < firstLoss ? first : second;

          const userArtifact = user.inventory.find(
            (o) => o.artifact.id === looserWithHigherLoss.artifact.id,
          );

          await this.artifactService.incrDecrementCraftedAmount(
            userArtifact,
            false,
          );

          await this.userService.attachNewFailedPair(
            user,
            first.artifact,
            second.artifact,
          );

          await this.userBalancesService.increaseBalance(
            user,
            APP_CONFIGS.COIN_REWARDS.CRAFT_FAIL,
          );

          const responseUser = await this.userService.updateUserInCache(user);

          return {
            remainingUsersForFailedCraftsView:
              remainingFriendsForFailedCrafts(responseUser),
            lost: userArtifact.artifact,
            user: mapUserToDto(responseUser),
          };
        }
      },
    );
  }

  async estimateLoss(pair: PairDto) {
    const artifactFirst = await this.artifactService.getArtifactById(
      pair.firstId.toString(),
    );
    const artifactSecond = await this.artifactService.getArtifactById(
      pair.secondId.toString(),
    );

    const expectToLoseFirst =
      artifactFirst.level / (artifactFirst.level + artifactSecond.level);
    const expectToLoseSecond =
      artifactSecond.level / (artifactFirst.level + artifactSecond.level);

    return {
      [artifactFirst.id]: {
        estimatedLoss: expectToLoseFirst,
      },
      [artifactSecond.id]: {
        estimatedLoss: expectToLoseSecond,
      },
    };
  }

  async getAllCraftsFor(artifactId: string) {
    const artifact = await this.artifactService.getArtifactById(artifactId);

    const pairs = await this.pairModel
      .find({
        matchResult: artifact._id,
      })
      .populate('first second matchResult', null, Artifact.name);

    return pairs.map((pair) => ({
      first: toArtifactDto(pair.first),
      second: toArtifactDto(pair.second),
      matchResult: toArtifactDto(pair.matchResult),
    }));
  }
}
