import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { CacheTTL } from '@nestjs/cache-manager';
import { HttpCacheInterceptor } from 'src/auth/http-cache.interceptor';

@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @HttpCode(HttpStatus.OK)
  @Get('top-referrers')
  @CacheTTL(30) // 30 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getTopReferrers() {
    return this.statisticService.getTopReferrers();
  }

  @HttpCode(HttpStatus.OK)
  @Get('top-levels')
  @CacheTTL(30) // 30 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getTopLevels() {
    return this.statisticService.getTopLevels();
  }

  @HttpCode(HttpStatus.OK)
  @Get('top-crafted-pairs')
  @CacheTTL(30) // 30 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getTopCrafedPairsUsers() {
    return this.statisticService.getTopCrafedPairsUsers();
  }
}
