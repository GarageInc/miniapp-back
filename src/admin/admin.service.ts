import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { BotService } from 'src/bot/bot.service';
import { QUEUE_NAMES } from 'src/queue';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UserService,
    private readonly botService: BotService,
    @InjectQueue(QUEUE_NAMES.FOLLOWERS) private followersQueue: Queue,
  ) {}

  getUsers(): string[] {
    return [];
  }

  async notifyUpdates() {
    const users = await this.usersService.getUsers();

    console.log('Notify users about new version:', users.length);

    await this.botService.notifyUsersAboutNewVersion(users);

    return true;
  }

  async recalculateReferrals() {
    const users = await this.usersService.getUsers();

    for (const user of users) {
      try {
        await this.followersQueue.add('followers', {
          telegramId: user.telegramId,
        });
      } catch (e) {
        console.log(e);
      }
    }

    return true;
  }
}
