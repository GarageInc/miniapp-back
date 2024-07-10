import { User } from 'src/user/user.schema';

interface IRewardsModel {
  'Invited Friends': number;
  'Item regeneration time (min)': number;
  'Opened cells in Gift-box': number;
  'lvl 1': number | string;
  'lvl 2': number | string;
  SUM: number;
  'Cumulative SUM': number;
}

export const usersLeftToNewSlot = (user: User) => {
  const lastFriendsClaimedAmount = user.lastFriendsClaimedAmount;

  if (lastFriendsClaimedAmount >= REWARDS_RULES.length) {
    return 0;
  }

  const nextSlot = BORDERS.find(
    (border) =>
      border.invited > lastFriendsClaimedAmount &&
      border.slots > user.claimableSlots.length,
  );

  if (!nextSlot) {
    return 0;
  }

  return nextSlot.invited - lastFriendsClaimedAmount;
};

const BORDERS = [
  {
    invited: 5,
    slots: 4,
  },
  {
    invited: 10,
    slots: 5,
  },
  {
    invited: 20,
    slots: 6,
  },
];

export const REWARDS_RULES: IRewardsModel[] = [
  {
    'Invited Friends': 0,
    'Item regeneration time (min)': 60,
    'Opened cells in Gift-box': 3,
    'lvl 1': 0,
    'lvl 2': 0,
    SUM: 0,
    'Cumulative SUM': 0,
  },
  {
    'Invited Friends': 1,
    'Item regeneration time (min)': 55,
    'Opened cells in Gift-box': 3,
    'lvl 1': 1,
    'lvl 2': '',
    SUM: 1,
    'Cumulative SUM': 1,
  },
  {
    'Invited Friends': 2,
    'Item regeneration time (min)': 53,
    'Opened cells in Gift-box': 3,
    'lvl 1': 2,
    'lvl 2': '',
    SUM: 2,
    'Cumulative SUM': 3,
  },
  {
    'Invited Friends': 3,
    'Item regeneration time (min)': 51,
    'Opened cells in Gift-box': 3,
    'lvl 1': 2,
    'lvl 2': '',
    SUM: 2,
    'Cumulative SUM': 5,
  },
  {
    'Invited Friends': 4,
    'Item regeneration time (min)': 49,
    'Opened cells in Gift-box': 3,
    'lvl 1': 2,
    'lvl 2': '',
    SUM: 2,
    'Cumulative SUM': 7,
  },
  {
    'Invited Friends': 5,
    'Item regeneration time (min)': 47,
    'Opened cells in Gift-box': 4,
    'lvl 1': '',
    'lvl 2': 1,
    SUM: 2,
    'Cumulative SUM': 9,
  },
  {
    'Invited Friends': 6,
    'Item regeneration time (min)': 45,
    'Opened cells in Gift-box': 4,
    'lvl 1': '',
    'lvl 2': 2,
    SUM: 4,
    'Cumulative SUM': 13,
  },
  {
    'Invited Friends': 7,
    'Item regeneration time (min)': 43,
    'Opened cells in Gift-box': 4,
    'lvl 1': '',
    'lvl 2': 2,
    SUM: 4,
    'Cumulative SUM': 17,
  },
  {
    'Invited Friends': 8,
    'Item regeneration time (min)': 41,
    'Opened cells in Gift-box': 4,
    'lvl 1': '',
    'lvl 2': 2,
    SUM: 4,
    'Cumulative SUM': 21,
  },
  {
    'Invited Friends': 9,
    'Item regeneration time (min)': 39,
    'Opened cells in Gift-box': 4,
    'lvl 1': 2,
    'lvl 2': 2,
    SUM: 6,
    'Cumulative SUM': 27,
  },
  {
    'Invited Friends': 10,
    'Item regeneration time (min)': 37,
    'Opened cells in Gift-box': 5,
    'lvl 1': 1,
    'lvl 2': 3,
    SUM: 7,
    'Cumulative SUM': 34,
  },
  {
    'Invited Friends': 11,
    'Item regeneration time (min)': 35,
    'Opened cells in Gift-box': 5,
    'lvl 1': 2,
    'lvl 2': 3,
    SUM: 8,
    'Cumulative SUM': 42,
  },
  {
    'Invited Friends': 12,
    'Item regeneration time (min)': 34,
    'Opened cells in Gift-box': 5,
    'lvl 1': 1,
    'lvl 2': 3,
    SUM: 7,
    'Cumulative SUM': 49,
  },
  {
    'Invited Friends': 13,
    'Item regeneration time (min)': 33,
    'Opened cells in Gift-box': 5,
    'lvl 1': 4,
    'lvl 2': 3,
    SUM: 10,
    'Cumulative SUM': 59,
  },
  {
    'Invited Friends': 14,
    'Item regeneration time (min)': 32,
    'Opened cells in Gift-box': 5,
    'lvl 1': 5,
    'lvl 2': 3,
    SUM: 11,
    'Cumulative SUM': 70,
  },
  {
    'Invited Friends': 15,
    'Item regeneration time (min)': 31,
    'Opened cells in Gift-box': 5,
    'lvl 1': '',
    'lvl 2': 3,
    SUM: 6,
    'Cumulative SUM': 76,
  },
  {
    'Invited Friends': 16,
    'Item regeneration time (min)': 30,
    'Opened cells in Gift-box': 5,
    'lvl 1': '',
    'lvl 2': 3,
    SUM: 6,
    'Cumulative SUM': 82,
  },
  {
    'Invited Friends': 17,
    'Item regeneration time (min)': 29,
    'Opened cells in Gift-box': 5,
    'lvl 1': 1,
    'lvl 2': 3,
    SUM: 7,
    'Cumulative SUM': 89,
  },
  {
    'Invited Friends': 18,
    'Item regeneration time (min)': 28,
    'Opened cells in Gift-box': 5,
    'lvl 1': 1,
    'lvl 2': 3,
    SUM: 7,
    'Cumulative SUM': 96,
  },
  {
    'Invited Friends': 19,
    'Item regeneration time (min)': 27,
    'Opened cells in Gift-box': 5,
    'lvl 1': 1,
    'lvl 2': 3,
    SUM: 7,
    'Cumulative SUM': 103,
  },
  {
    'Invited Friends': 20,
    'Item regeneration time (min)': 26,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 4,
    SUM: 8,
    'Cumulative SUM': 111,
  },
  {
    'Invited Friends': 21,
    'Item regeneration time (min)': 25,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 121,
  },
  {
    'Invited Friends': 22,
    'Item regeneration time (min)': 24,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 131,
  },
  {
    'Invited Friends': 23,
    'Item regeneration time (min)': 23,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 141,
  },
  {
    'Invited Friends': 24,
    'Item regeneration time (min)': 22,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 151,
  },
  {
    'Invited Friends': 25,
    'Item regeneration time (min)': 21,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 161,
  },
  {
    'Invited Friends': 26,
    'Item regeneration time (min)': 20,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 171,
  },
  {
    'Invited Friends': 27,
    'Item regeneration time (min)': 19,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 181,
  },
  {
    'Invited Friends': 28,
    'Item regeneration time (min)': 18,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 191,
  },
  {
    'Invited Friends': 29,
    'Item regeneration time (min)': 17,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 5,
    SUM: 10,
    'Cumulative SUM': 201,
  },
  {
    'Invited Friends': 30,
    'Item regeneration time (min)': 16,
    'Opened cells in Gift-box': 6,
    'lvl 1': '',
    'lvl 2': 10,
    SUM: 20,
    'Cumulative SUM': 221,
  },
];
