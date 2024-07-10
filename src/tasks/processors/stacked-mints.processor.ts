import { LockedMintsService } from './../locked-mints.service';
import { InjectQueue, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { QUEUE_NAMES } from 'src/queue';

@Processor(QUEUE_NAMES.STACKED_MINTS)
export class StackedMintsProcessor {
  constructor(
    protected readonly lockedMintsService: LockedMintsService,
    @InjectQueue(QUEUE_NAMES.MINTS) protected mintsQueue: Queue,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @Process('mints')
  async transcode(
    job: Job<{
      type: string;
    }>,
  ) {
    console.log('Stacked mints start checking');
    const stacked = await this.lockedMintsService.getStackedMints();

    console.log('Stacked mints', stacked.length);

    for (let i = 0; i < stacked.length; i++) {
      await this.mintsQueue.add('mint', stacked[i]);
    }
  }
}
