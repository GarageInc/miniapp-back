import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { UserBalances } from './user-balances.schema';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { TransactionService } from 'src/database/transaction.service';

@Injectable()
export class UserBalancesService {
  constructor(
    @InjectModel(UserBalances.name)
    private userBalancesModel: Model<UserBalances>,

    private appCacheService: AppCacheService,
    private transactionService: TransactionService,
  ) {}

  async increaseBalance(user: User, amount: number) {
    try {
      const userBalances = await this.getOrCreateUserBalances(user);

      if (userBalances) {
        userBalances.balance += amount;
        userBalances.updatedAt = new Date();

        await userBalances.save();

        await this.updateBalanceInCache(user);

        return userBalances;
      }
    } catch (error) {
      console.error('Error in updateBalance', error);
    }
  }

  async getOrCreateUserBalances(user: User) {
    try {
      const userBalances = await this.getCachedBalance(user);

      if (userBalances) {
        return userBalances;
      } else {
        const newUserBalances = new this.userBalancesModel({
          user: user._id,
          balance: 0,
        });

        await newUserBalances.save();

        await this.updateBalanceInCache(user);

        return newUserBalances;
      }
    } catch (error) {
      console.error('Error in getOrCreateUserBalances', error);
    }
  }

  async updateBalanceInCache(userInput: User) {
    const balance = await this.userBalancesModel
      .findOne({
        user: userInput._id,
      })
      .populate({
        path: 'user',
        model: User.name,
      });

    if (balance) {
      await this.appCacheService.setBalance(balance);
    }

    return balance;
  }

  async getCachedBalance(userInput: User): Promise<UserBalances> {
    const cachedBalance = await this.appCacheService.getBalance(userInput);

    if (cachedBalance) {
      return cachedBalance;
    }

    return await this.updateBalanceInCache(userInput);
  }
}
