import { LockedMintsService } from '../locked-mints.service';
import { UserService } from 'src/user/user.service';
import { Web3Service } from 'src/web3/web3.service';
import { LockedMint } from 'src/user/user.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { QUEUE_NAMES } from 'src/queue';
import { MintsBaseProcessor } from './mints-base.processor';

@Processor(QUEUE_NAMES.MINTS)
export class MintsProcessor extends MintsBaseProcessor {
  ownerBurnAddress: string;

  constructor(
    protected readonly lockedMintsService: LockedMintsService,
    protected readonly usersService: UserService,
    protected readonly web3Service: Web3Service,
    protected readonly artifactService: ArtifactService,
    protected readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.MINTS) protected mintsQueue: Queue,
  ) {
    console.log('MintsProcessor created');
    super(
      lockedMintsService,
      usersService,
      web3Service,
      artifactService,
      configService,
      mintsQueue,
    );
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @Process('mint')
  async transcode(job: Job<LockedMint>) {
    await this.handleMint(job.data);
  }
}
