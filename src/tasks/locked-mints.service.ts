import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artifact } from 'src/artifact/artifact.schema';
import { LockedMint, MINT_STATUS, User } from 'src/user/user.schema';
import { APP_CONFIGS } from 'src/utils/app-configs';

@Injectable()
export class LockedMintsService {
  constructor(
    @InjectModel(LockedMint.name) private lockedMint: Model<LockedMint>,
  ) {}

  async getMint(mint: LockedMint) {
    return this.lockedMint
      .findById(mint._id)
      .populate('user', null, User.name)
      .populate('artifact', null, Artifact.name);
  }

  async getExpiredMints() {
    const checkingTimeMs = APP_CONFIGS.TIME_OF_NFT_MINT_WAITING_TASK;

    const now = new Date();
    const expired = new Date(now.getTime() - checkingTimeMs);

    return this.lockedMint
      .find({
        createdAt: { $lte: expired },
        status: MINT_STATUS.PENDING,
      })
      .populate('user', null, User.name)
      .populate('artifact', null, Artifact.name)
      .limit(10);
  }

  async getStackedMints() {
    const now = new Date();
    const expired = new Date(
      now.getTime() - APP_CONFIGS.TIME_OF_NFT_MINT_WAITING_TASK * 3,
    );

    return this.lockedMint
      .find({
        createdAt: { $lte: expired },
        status: {
          $in: [MINT_STATUS.PENDING, MINT_STATUS.PROCESSING],
        },
      })
      .populate('user', null, User.name)
      .populate('artifact', null, Artifact.name)
      .limit(10);
  }

  async markAs(mints: LockedMint[], status: MINT_STATUS) {
    await this.lockedMint.updateMany(
      { _id: { $in: mints.map((mint) => mint._id) } },
      { $set: { status: status } },
    );
  }
}
