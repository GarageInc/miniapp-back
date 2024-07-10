import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Queue } from 'bull';
import { UserNotificationsService } from 'src/user/user-notifications.service';
import { UserNotifications } from 'src/user/user-notifications.schema';

@Injectable()
export class LastLoginNotificationsCronService {
  constructor(
    private readonly userNotsService: UserNotificationsService,
    @InjectQueue(QUEUE_NAMES.LOGIN_NOTIFICATIONS)
    private loginNotificationsQueue: Queue,
  ) {
    console.log('LastLoginNotificationsCronService created');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cron() {
    const notifications: UserNotifications[] =
      await this.userNotsService.getExpiredNotifications();

    for (let i = 0; i < notifications.length; i++) {
      try {
        const n = notifications[i];

        await this.loginNotificationsQueue.add('login-notifications', {
          telegramId: n.user.telegramId,
        });

        await this.userNotsService.markAsNotified(n);
      } catch (e) {
        console.error(
          'Error in LastLoginNotificationsCronService',
          e,
          notifications[i],
        );
      }
    }
  }
}
