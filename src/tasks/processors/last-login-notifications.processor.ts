import { UserService } from 'src/user/user.service';
import { QUEUE_NAMES } from 'src/queue';
import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { BotService } from 'src/bot/bot.service';

@Processor(QUEUE_NAMES.LOGIN_NOTIFICATIONS)
export class LastLoginNotificationsProcessor {
  constructor(
    private readonly botService: BotService,
    private readonly userService: UserService,
  ) {
    console.log('LastLoginNotificationsProcessor created');
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @Process('login-notifications')
  async transcode(
    job: Job<{
      telegramId: string;
    }>,
  ) {
    console.log('LastLoginNotificationsProcessor transcode', job.data);
    const user = await this.userService.getCachedUser(job.data.telegramId);
    await this.botService.informUserAboutLastLogin(user);
  }
}
