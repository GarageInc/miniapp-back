import { User } from 'src/user/user.schema';

export const FRIENDS_AMOUNT_FOR_FAILED_CRAFTS = 2;

export const canSeeFailedCrafts = (user: User) => {
  return user.lastFriendsClaimedAmount >= FRIENDS_AMOUNT_FOR_FAILED_CRAFTS;
};

export const remainingFriendsForFailedCrafts = (user: User) => {
  return FRIENDS_AMOUNT_FOR_FAILED_CRAFTS - user.lastFriendsClaimedAmount;
};
