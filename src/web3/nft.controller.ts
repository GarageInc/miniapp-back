import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { RequestInterface } from 'src/dto/UserRequestDto';
import { Web3Service } from './web3.service';
import { CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/auth/auth.guard';
import { HttpCacheInterceptor } from 'src/auth/http-cache.interceptor';

@Controller('nft')
export class NftController {
  constructor(private readonly web3Service: Web3Service) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('props-qweasdasdad')
  async getProps() {
    return this.web3Service.getProps();
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('force-mints-check')
  async forceMintsCheck() {
    return this.web3Service.forceMintsCheck();
  }

  @HttpCode(HttpStatus.OK)
  @Post('signature')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async signature(
    @Request() req: RequestInterface,
    @Body()
    { artifactId, ownerAddress }: { artifactId: string; ownerAddress: string },
  ) {
    return this.web3Service.generateNftMintSignature(
      req.user,
      artifactId,
      ownerAddress,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('register-burn')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async burn(
    @Request() req: RequestInterface,
    @Body()
    { nftIndex, ownerAddress }: { nftIndex: string; ownerAddress: string },
  ) {
    return this.web3Service.generateBurnSignature(
      req.user,
      nftIndex,
      ownerAddress,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('list/:userAddress/:limit/:offset')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @CacheTTL(60) // 60 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async listNftsForUser(
    @Param('userAddress') userAddress: string,
    @Param('limit') limit: number,
    @Param('offset') offset: number,
  ) {
    return this.web3Service.listNftsForUser(userAddress, limit, offset);
  }

  @HttpCode(HttpStatus.OK)
  @Get('exists/:nftIndex')
  async checkNftExists(@Param('nftIndex') nftIndex: string) {
    return this.web3Service.checkNftExists(nftIndex);
  }

  @HttpCode(HttpStatus.OK)
  @Get('data/:nftIndex')
  @Public()
  async getNftData(@Param('nftIndex') nftIndex: string) {
    return this.web3Service.getNftData(nftIndex);
  }
}
