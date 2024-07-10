import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import Redlock from 'redlock';
import Client from 'ioredis';
import { User } from 'src/user/user.schema';
import { ConfigService } from '@nestjs/config';

let redlockClient: Redlock | null = null;

const getRedlockClient = (url: string, password: string) => {
  if (redlockClient) {
    return redlockClient;
  }

  const redisC = new Client({ host: url, password: password });

  const redlock = new Redlock(
    // You should have one client for each independent redis node
    // or cluster.
    [redisC],
    {
      // The expected clock drift; for more details see:
      // http://redis.io/topics/distlock
      driftFactor: 0.01, // multiplied by lock ttl to determine drift time

      // The max number of times Redlock will attempt to lock a resource
      // before erroring.
      retryCount: 10,

      // the time in ms between attempts
      retryDelay: 200, // time in ms

      // the max time in ms randomly added to retries
      // to improve performance under high contention
      // see https://www.awsarchitectureblog.com/2015/03/backoff.html
      retryJitter: 200, // time in ms

      // The minimum remaining time on a lock before an extension is automatically
      // attempted with the `using` API.
      automaticExtensionThreshold: 500, // time in ms
    },
  );

  redlockClient = redlock;

  return redlock;
};

@Injectable()
export class TransactionService {
  private redisUrl: string;
  private redisPwd: string;

  constructor(
    @InjectConnection() protected readonly connection: Connection,
    private configService: ConfigService,
  ) {
    this.redisUrl = this.configService
      .get('REDIS_URL')
      .split('//')[1]
      .split(':')[0];

    this.redisPwd = this.configService.get('REDIS_PASSWORD');
  }

  runTransaction = async (user: User, callback: () => Promise<any>) => {
    return await getRedlockClient(this.redisUrl, this.redisPwd).using(
      [`senderId:${user.telegramId}`, `recipientId:${user.telegramId}`],
      5000,
      async (signal) => {
        // Do something...
        try {
          return await callback();
        } catch (error) {
          // Handle error

          console.log('Error in transaction', error);
          throw error;
        }
      },
    );
  };
}
