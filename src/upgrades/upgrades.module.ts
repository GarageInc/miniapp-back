import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UpgradesController } from './upgrades.controller';
import { UserNotificationsService } from 'src/user/user-notifications.service';
import { UserUpgradesService } from './user-upgrades/user-upgrades.service';
import {
  UserBalances,
  UserBalancesSchema,
} from 'src/user/user-balances.schema';
import {
  UserNotifications,
  UserNotificationsSchema,
} from 'src/user/user-notifications.schema';
import { UserBalancesService } from 'src/user/user-balances.service';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { TransactionService } from 'src/database/transaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserBalances.name, schema: UserBalancesSchema },

      {
        name: UserNotifications.name,
        schema: UserNotificationsSchema,
      },
    ]),
  ],
  controllers: [UpgradesController],
  providers: [
    UserNotificationsService,
    UserUpgradesService,
    UserBalancesService,
    AppCacheService,
    TransactionService,
  ],
})
export class UpgradesModule {}
