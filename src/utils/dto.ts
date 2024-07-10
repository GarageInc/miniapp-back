import { usersLeftToNewSlot } from 'src/referrals/referrals-service/reward-rules';
import { type OpenedArtifact, type User } from '../user/user.schema';
import { canSeeFailedCrafts } from './canSeeFailedCrafts';
import { APP_CONFIGS } from './app-configs';

export interface IUserDto {
  readonly _id: any;
  readonly telegramId: number;
  readonly username: string;
  readonly language: string;
  readonly is_bot: boolean;
  readonly first_name: string;
  readonly last_name: string;
  readonly referredByCode: string;
  readonly photoUrl: string;
  readonly tonAddress: string;
  readonly claimableSlots: Date[];
  readonly inventory: IOpenedArtifactDto[];
  readonly level: number;
  readonly maxInventorySize: number;
  readonly currentElementsCount: number;
  readonly claimableRewardsAmount: number;
  readonly itemRegenerationTime: number;
  readonly canSeeFailedCrafts: boolean;
  readonly amountUsersLeftToNewSlot: number;
  readonly inventorySize: number;
}

export interface IFriendDto {
  readonly _id: any;
  readonly telegramId: number;
  readonly username: string;
  readonly language: string;
  readonly is_bot: boolean;
  readonly first_name: string;
  readonly last_name: string;
  readonly referredByCode: string;
  readonly photoUrl: string;
  readonly tonAddress: string;
  readonly level: number;
  readonly maxInventorySize: number;
  readonly currentElementsCount: number;
  readonly inventory: OpenedArtifact[];
}

export interface IOpenedArtifactDto {
  _id: any;
  artifact: any;
  count: number;
  maxAmount: number;
}

export const mapOpenedArtifactToDto = (
  artifact: OpenedArtifact,
): IOpenedArtifactDto => {
  return {
    _id: artifact._id,
    artifact: artifact.artifact,
    count: artifact.count,
    maxAmount: APP_CONFIGS.MAX_ITEMS_AMOUNT,
  };
};

export const mapFriendToDto = (friend: User): IFriendDto => {
  return {
    _id: friend._id,
    telegramId: friend.telegramId,
    username: friend.username,
    language: friend.language,
    is_bot: friend.is_bot,
    first_name: friend.first_name,
    last_name: friend.last_name,
    referredByCode: friend.referredByCode,
    photoUrl: friend.photoUrl,
    tonAddress: friend.tonAddress,
    level: friend.level,
    maxInventorySize: friend.maxInventorySize,
    currentElementsCount: friend.inventory.length,
    inventory: friend.inventory,
  };
};

export const mapUserToDto = (user: User): IUserDto => {
  return {
    _id: user._id,
    telegramId: user.telegramId,
    username: user.username,
    language: user.language,
    is_bot: user.is_bot,
    first_name: user.first_name,
    last_name: user.last_name,
    referredByCode: user.referredByCode,
    photoUrl: user.photoUrl,
    tonAddress: user.tonAddress,
    claimableSlots: user.claimableSlots,
    inventory: user.inventory.map(mapOpenedArtifactToDto),
    inventorySize: user.inventory.length,
    level: user.level,
    maxInventorySize: user.maxInventorySize,
    currentElementsCount: user.inventory.reduce(
      (acc, item) => acc + item.count,
      0,
    ),
    claimableRewardsAmount: user.claimableRewardsAmount,
    itemRegenerationTime: user.itemRegenerationTime,
    canSeeFailedCrafts: canSeeFailedCrafts(user),
    amountUsersLeftToNewSlot: usersLeftToNewSlot(user),
  };
};
