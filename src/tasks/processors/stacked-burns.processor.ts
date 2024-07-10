import { LockedBurnsService } from './../locked-burns.service';
import { QUEUE_NAMES } from 'src/queue';
import { InjectQueue, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';

@Processor(QUEUE_NAMES.STACKED_BURNS)
export class StackedBurnsProcessor {
  constructor(
    protected readonly lockedBurnsService: LockedBurnsService,
    @InjectQueue(QUEUE_NAMES.BURNS) protected burnsQueue: Queue,
  ) {
    console.log('StackedBurnsProcessor created');
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @Process('burns')
  async transcode(
    job: Job<{
      type: string;
    }>,
  ) {
    console.log('Stacked burns start checking');
    const burns = await this.lockedBurnsService.getStackedBurns();

    console.log('Stacked burns', burns.length);

    for (let i = 0; i < burns.length; i++) {
      await this.burnsQueue.add('burn', burns[i]);
    }
  }
}
