import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Queue } from 'bull';

@Injectable()
export class StackedNftsCronService {
  constructor(
    @InjectQueue(QUEUE_NAMES.STACKED_BURNS) private stakedBurns: Queue,
    @InjectQueue(QUEUE_NAMES.STACKED_MINTS) private stakedMints: Queue,
  ) {
    console.log('StackedNftsCronService created');
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async stakedNftsCron() {
    console.log('StackedNftsCronService start checking');

    await this.stakedMints.add('mints');
    await this.stakedBurns.add('burns');

    console.log('StackedNftsCronService end checking');
  }
}
