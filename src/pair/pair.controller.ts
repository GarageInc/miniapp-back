import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { PairService } from './pair.service';
import { PairDto } from './dto';
import { RequestInterface } from 'src/dto/UserRequestDto';
import { Public } from 'src/auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { canSeeFailedCrafts } from 'src/utils/canSeeFailedCrafts';
import { HttpCacheInterceptor } from 'src/auth/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('pair')
export class PairController {
  constructor(private readonly pairService: PairService) {}

  @HttpCode(HttpStatus.OK)
  @Post('match')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async createPairFrom(
    @Request() req: RequestInterface,
    @Body() pair: PairDto,
  ) {
    return await this.pairService.createPair(req.user, pair);
  }

  @HttpCode(HttpStatus.OK)
  @Post('estimate-loss')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async estimateLoss(@Body() pair: PairDto) {
    return await this.pairService.estimateLoss(pair);
  }

  @HttpCode(HttpStatus.OK)
  @Get('is-failed-craft')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async isFailedCrafts(
    @Request() req: RequestInterface,
    @Query() { first, second }: { first: string; second: string },
  ) {
    return {
      isFailedInPast:
        canSeeFailedCrafts(req.user) &&
        (await this.pairService.isFailedCraft(req.user, first, second)),
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('generate-test')
  @Public()
  async generate() {
    return await this.pairService.generatePairs();
  }

  @HttpCode(HttpStatus.OK)
  @Get('crafts/:artifactId')
  @CacheTTL(3600) // 3600 seconds
  @UseInterceptors(HttpCacheInterceptor)
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async getAllCraftsFor(@Param('artifactId') artifactId: string) {
    return this.pairService.getAllCraftsFor(artifactId);
  }
}
