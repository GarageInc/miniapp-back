import { Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ReferralsService } from 'src/referrals/referrals-service/referrals.service';
import { BotService } from 'src/bot/bot.service';
import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Job } from 'bull';
import { UserBalancesService } from 'src/user/user-balances.service';
import { APP_CONFIGS } from 'src/utils/app-configs';
import { TransactionService } from 'src/database/transaction.service';

@Processor(QUEUE_NAMES.FOLLOWERS)
export class BonusesProcessor {
  private readonly logger = new Logger(BonusesProcessor.name);

  constructor(
    private readonly userService: UserService,
    private readonly referralsService: ReferralsService,
    private readonly botService: BotService,
    private readonly userBalancesService: UserBalancesService,
    private readonly transactionService: TransactionService,
  ) {
    console.log('Bonuses processor initialized');
  }

  handleBonuses = async (telegramId: string) => {
    const user = await this.userService.getCachedUser(telegramId);

    return await this.transactionService.runTransaction(user, async () => {
      const count = await this.referralsService.getFriendsAmount(user);

      const newFriendsAmount = count - user.invitedUsersAmount;

      await this.userBalancesService.increaseBalance(
        user,
        newFriendsAmount * APP_CONFIGS.COIN_REWARDS.INVITE_FRIEND,
      );
      await this.userService.increaseCounter(user, count);

      this.logger.debug(
        `Recalculating bonuses for user ${user._id} (${user.username})`,
      );

      const hasRewards = await this.referralsService.calculateReferralBonuses(
        user,
      );

      if (hasRewards) {
        const newUser = await this.userService.getCachedUser(telegramId);

        await this.userService.updateClaimableRewardsAmount(newUser);

        await this.botService.sendBonusesNotification(newUser);
      }
    });
  };

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @Process('followers')
  async transcode(
    job: Job<{
      telegramId: string;
    }>,
  ) {
    await this.handleBonuses(job.data.telegramId);
  }
}
