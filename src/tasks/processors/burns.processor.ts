import { UserService } from 'src/user/user.service';
import { Web3Service } from 'src/web3/web3.service';
import { LockedBurn } from 'src/user/user.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { LockedBurnsService } from './../locked-burns.service';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from 'src/queue';
import { InjectQueue, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { BurnsBaseProcessor } from './burns-base.processor';

@Processor(QUEUE_NAMES.BURNS)
export class BurnsProcessor extends BurnsBaseProcessor {
  ownerBurnAddress: string;

  constructor(
    protected readonly lockedBurnsService: LockedBurnsService,
    protected readonly usersService: UserService,
    protected readonly web3Service: Web3Service,
    protected readonly artifactService: ArtifactService,
    protected readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.BURNS) protected burnsQueue: Queue,
  ) {
    console.log('BurnsProcessor created');
    super(
      lockedBurnsService,
      usersService,
      web3Service,
      artifactService,
      configService,
      burnsQueue,
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

  @Process('burn')
  async transcode(job: Job<LockedBurn>) {
    await this.handleBurn(job.data);
  }
}
