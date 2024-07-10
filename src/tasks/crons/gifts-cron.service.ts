import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from 'src/user/user.service';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Queue } from 'bull';

@Injectable()
export class GiftsCronService {
  constructor(
    private readonly userService: UserService,
    @InjectQueue(QUEUE_NAMES.GIFTS_FILLED) private giftsFilledQueue: Queue,
  ) {
    console.log('GiftsCronService created');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async informUsersAboutGiftBoxes() {
    const users = await this.userService.getUsersWithSlots();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const now = new Date();

      const slots = user.claimableSlots;

      const isAllSlotsFilled = slots.every(
        (slot) => slot.getTime() < now.getTime(),
      );

      if (isAllSlotsFilled) {
        await this.userService.setNotifiedAboutGifts(user, true);

        await this.giftsFilledQueue.add('giftsfilled', {
          telegramId: user.telegramId,
        });
      }
    }
  }
}
