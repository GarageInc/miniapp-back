import { Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Web3Service, extractNameFromUri } from 'src/web3/web3.service';
import { BURN_STATUS, LockedBurn } from 'src/user/user.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { LockedBurnsService } from './../locked-burns.service';
import { ConfigService } from '@nestjs/config';
import { Address } from '@ton/core';
import { Queue } from 'bull';
import { APP_CONFIGS } from 'src/utils/app-configs';

export class BurnsBaseProcessor {
  protected readonly logger = new Logger(BurnsBaseProcessor.name);
  ownerBurnAddress: string;

  constructor(
    protected readonly lockedBurnsService: LockedBurnsService,
    protected readonly usersService: UserService,
    protected readonly web3Service: Web3Service,
    protected readonly artifactService: ArtifactService,
    protected readonly configService: ConfigService,
    protected burnsQueue: Queue,
  ) {
    this.ownerBurnAddress = Address.parse(
      this.configService.get<string>('OWNER_BURN_ADDRESS'),
    ).toRawString();
  }

  getArtifactId = async (
    burnModel: LockedBurn,
  ): Promise<{
    artifactId: string;
    owner_address: string;
  }> => {
    const data = await this.web3Service.getNftData(burnModel.nftIndex);

    if (data) {
      return {
        artifactId: data.id,
        owner_address: data.owner,
      };
    }

    const burningNft = await this.web3Service.getBurningNft(burnModel);

    if (burningNft) {
      return {
        artifactId: extractNameFromUri(burningNft.content.uri),
        owner_address: burningNft.owner_address,
      };
    }
  };

  handleBurn = async (burn: LockedBurn) => {
    const burnModel = await this.lockedBurnsService.getBurn(burn);

    if (burnModel.status === BURN_STATUS.SUCCESS) {
      return;
    }

    await this.lockedBurnsService.markAs([burnModel], BURN_STATUS.PROCESSING);

    try {
      // try to get nft data
      const { artifactId, owner_address } = await this.getArtifactId(burnModel);

      const wasBurned =
        owner_address &&
        Address.parse(owner_address).toRawString() === this.ownerBurnAddress;

      if (wasBurned) {
        await this.artifactService.returnBurnedArtifactToUser(
          burnModel,
          artifactId,
        );

        await this.lockedBurnsService.markAs([burnModel], BURN_STATUS.SUCCESS);

        await this.usersService.updateUserInCache(burnModel.user);
      } else {
        await this.lockedBurnsService.markAs([burnModel], BURN_STATUS.FAILED);
      }
    } catch (e) {
      await this.burnsQueue.add('burn', burn, {
        delay: APP_CONFIGS.TIME_OF_NFT_BURN_WAITING_TASK,
      });

      console.log('Burning error', e);
      await this.lockedBurnsService.markAs([burnModel], BURN_STATUS.PENDING);
    }
  };
}
