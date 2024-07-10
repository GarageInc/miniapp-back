import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Artifact } from 'src/artifact/artifact.schema';
import { Pair } from 'src/pair/pair.schema';
import { ClaimableArtifact } from 'src/user/claimable-artifact.schema';
import { UserBalances } from 'src/user/user-balances.schema';
import { UserNotifications } from 'src/user/user-notifications.schema';
import { OpenedArtifact, User } from 'src/user/user.schema';

@Injectable()
export class AppCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheService: Cache,

    private configService: ConfigService,
  ) {}

  async setUser(user: User) {
    return this.cacheService.set(
      this._getCacheKey(user.telegramId, 'user'),
      user,
    );
  }

  async getUser(telegramId: string | number) {
    return this.cacheService.get<User>(this._getCacheKey(telegramId, 'user'));
  }

  async setNotificationInfo(user: User, notification: UserNotifications) {
    return this.cacheService.set(
      this._getCacheKey(user.telegramId, 'notification'),
      notification,
    );
  }

  async getNotificationInfo(user: User) {
    return this.cacheService.get<UserNotifications>(
      this._getCacheKey(user.telegramId, 'notification'),
    );
  }

  async setBalance(balance: UserBalances) {
    return this.cacheService.set(
      this._getCacheKey(balance._id, 'balance'),
      balance,
    );
  }

  async getBalance(user: User) {
    return this.cacheService.get<UserBalances>(
      this._getCacheKey(user.telegramId, 'balance'),
    );
  }

  private _getCacheKey(key: string | number | any, prefix: string) {
    return `${this.configService.get<string>(
      'TELEGRAM_BOT_NAME',
    )}_${prefix}_${key.toString()}`.toLowerCase();
  }

  async setArtifact(artifactId: any, artifact: any) {
    return this.cacheService.set(
      this._getCacheKey(artifactId, 'artifact'),
      artifact,
    );
  }

  async getArtifact(artifactId: string) {
    return this.cacheService.get<Artifact>(
      this._getCacheKey(artifactId, 'artifact'),
    );
  }

  async setOpenedArtifact(id: any, artifact: OpenedArtifact) {
    return this.cacheService.set(this._getCacheKey(id, 'opened_a'), artifact);
  }

  async getOpenedArtifact(id: any) {
    return this.cacheService.get<OpenedArtifact>(
      this._getCacheKey(id, 'opened_a'),
    );
  }

  async setClaimableArtifact(id: any, artifact: ClaimableArtifact) {
    return this.cacheService.set(
      this._getCacheKey(id, 'claimable_a'),
      artifact,
    );
  }

  async getClaimableArtifact(id: any) {
    return this.cacheService.get<ClaimableArtifact>(
      this._getCacheKey(id, 'claimable_a'),
    );
  }

  async setPair(pair: Pair) {
    return this.cacheService.set(this._getCacheKey(pair._id, 'pair'), pair);
  }

  async getPair(id: string) {
    return this.cacheService.get<Pair>(this._getCacheKey(id, 'pair'));
  }
}
