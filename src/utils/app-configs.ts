export const APP_CONFIGS = {
  DEFAULT_AMOUNT_ARTIFACTS_ON_INIT: 10,
  DEFAULT_COOLDOWN_GIFT_ARTIFACT: 1000 * 60 * 60, // 60 minutes
  TIME_OF_NFT_WAITING: 60 * 15, // 15 minutes
  TIME_OF_NFT_MINT_WAITING_TASK: 60 * 1000 * 5, // 5 minutes
  TIME_OF_NFT_BURN_WAITING_TASK: 60 * 1000 * 5, // 5 minuts
  CODES_LIMIT: 15,
  AMOUNT_RETURN_FOR_BURN: 10,
  DEFAULT_LANGUAGE: 'en',
  MAX_ITEMS_AMOUNT: 65535,

  COIN_REWARDS: {
    CRAFT_SUCCESS: 10,
    CRAFT_FAIL: 1,
    NEW_ITEM: 50,
    LEVEL_UP: 60,
    INVITE_FRIEND: 100,
    getRandomForCreation: () => Math.floor(Math.random() * 3) + 3,
  },
};