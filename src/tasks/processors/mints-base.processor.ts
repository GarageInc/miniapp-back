import { Logger } from '@nestjs/common';
import { LockedMintsService } from './../locked-mints.service';
import { UserService } from 'src/user/user.service';
import { Web3Service } from 'src/web3/web3.service';
import { LockedMint, MINT_STATUS } from 'src/user/user.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { ConfigService } from '@nestjs/config';
import { Address } from '@ton/core';
import { Queue } from 'bull';
import { APP_CONFIGS } from 'src/utils/app-configs';

export class MintsBaseProcessor {
  protected readonly logger = new Logger(MintsBaseProcessor.name);

  constructor(
    protected readonly lockedMintsService: LockedMintsService,
    protected readonly usersService: UserService,
    protected readonly web3Service: Web3Service,
    protected readonly artifactService: ArtifactService,
    protected readonly configService: ConfigService,
    protected mintsQueue: Queue,
  ) {}

  handleMint = async (mint: LockedMint) => {
    const mintModel = await this.lockedMintsService.getMint(mint);

    if (mintModel.status === MINT_STATUS.SUCCESS) {
      return;
    }

    this.logger.debug(`Processing mint ${mintModel._id}`, mintModel.nftIndex);

    await this.lockedMintsService.markAs([mintModel], MINT_STATUS.PROCESSING);

    try {
      const data = await this.web3Service.getNftData(mintModel.nftIndex);

      if (
        data
          ? data.owner === Address.parse(mintModel.targetAddress).toRawString()
          : !!(await this.web3Service.wasMinted(mintModel))
      ) {
        await this.lockedMintsService.markAs([mintModel], MINT_STATUS.SUCCESS);
      } else {
        await this.artifactService.returnArtifactToUser(mintModel);

        await this.lockedMintsService.markAs([mintModel], MINT_STATUS.FAILED);

        await this.usersService.updateUserInCache(mintModel.user);
      }
    } catch (e) {
      console.log('error', e);
      await this.mintsQueue.add('mint', mint, {
        delay: APP_CONFIGS.TIME_OF_NFT_MINT_WAITING_TASK,
      });

      await this.lockedMintsService.markAs([mintModel], MINT_STATUS.PENDING);
    }
  };
}
