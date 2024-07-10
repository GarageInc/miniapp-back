import { Injectable } from '@nestjs/common';
import { UserBalancesService } from 'src/user/user-balances.service';
import { UserNotificationsService } from 'src/user/user-notifications.service';
import { User } from 'src/user/user.schema';

@Injectable()
export class UserUpgradesService {
  constructor(
    private userNotificationsService: UserNotificationsService,
    private userBalancesService: UserBalancesService,
  ) {}

  async upgradeUser(user: User) {
    await this.userNotificationsService.getOrCreateUserNotification(user);

    await this.userBalancesService.getOrCreateUserBalances(user);
  }
}
