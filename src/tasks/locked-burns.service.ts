import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BURN_STATUS, LockedBurn, User } from 'src/user/user.schema';
import { APP_CONFIGS } from 'src/utils/app-configs';

@Injectable()
export class LockedBurnsService {
  constructor(
    @InjectModel(LockedBurn.name) private lockedBurn: Model<LockedBurn>,
  ) {}

  async getBurn(burn: LockedBurn) {
    return this.lockedBurn.findById(burn._id).populate('user', null, User.name);
  }

  async getExpiredBurns() {
    const checkingTimeMs = APP_CONFIGS.TIME_OF_NFT_BURN_WAITING_TASK;

    const now = new Date();
    const expired = new Date(now.getTime() - checkingTimeMs);

    return this.lockedBurn
      .find({
        createdAt: { $lte: expired },
        status: BURN_STATUS.PENDING,
      })
      .populate('user', null, User.name)
      .limit(10);
  }

  async getStackedBurns() {
    const now = new Date();
    const expired = new Date(
      now.getTime() - APP_CONFIGS.TIME_OF_NFT_BURN_WAITING_TASK * 3,
    );

    return this.lockedBurn
      .find({
        createdAt: { $lte: expired },
        status: {
          $in: [BURN_STATUS.PROCESSING, BURN_STATUS.PENDING],
        },
      })
      .populate('user', null, User.name)
      .limit(10);
  }

  async markAs(burns: LockedBurn[], status: BURN_STATUS) {
    await this.lockedBurn.updateMany(
      { _id: { $in: burns.map((mint) => mint._id) } },
      { $set: { status: status } },
    );
  }
}
