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
import { ReferralsService } from '../referrals-service/referrals.service';
import { RequestInterface } from 'src/dto/UserRequestDto';
import { BotService } from 'src/bot/bot.service';
import { CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/auth/auth.guard';
import { HttpCacheInterceptor } from 'src/auth/http-cache.interceptor';

@Controller('referrals')
export class ReferralsController {
  // write nest api method add referral code for user

  constructor(
    private readonly referralsService: ReferralsService,
    private readonly botService: BotService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('generate')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async getUserReferralCode(@Request() req: RequestInterface) {
    const code = await this.referralsService.generateReferralCode(req.user);

    if (code) {
      await this.botService.sendSharedLinkToBot(req.user, code);
    }

    return code;
  }

  @HttpCode(HttpStatus.OK)
  @Get('claimable-bonuses')
  @CacheTTL(10) // 10 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getClaimableBonuses(@Request() req: RequestInterface) {
    return this.referralsService.getClaimableBonuses(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('claim-bonuses')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async claimBonuses(
    @Request() req: RequestInterface,
    @Body() { batchId }: { batchId: string },
  ) {
    return this.referralsService.claimBonuses(req.user, batchId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('claim-batch-bonuses')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async claimBatchBonuses(
    @Request() req: RequestInterface,
    @Body() { batchIds }: { batchIds: string[] },
  ) {
    return this.referralsService.claimBatchBonuses(req.user, batchIds);
  }

  @HttpCode(HttpStatus.OK)
  @Get('codes')
  @CacheTTL(10) // 10 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getUserReferralCodes(@Request() req: RequestInterface) {
    return this.referralsService.getUserReferralCodes(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('friends')
  async getUserReferralCodesById(
    @Request() req: RequestInterface,
    @Query() { cursor, limit }: { cursor: string; limit: number },
  ) {
    return this.referralsService.getReferredFriends(req.user, cursor, limit);
  }

  @HttpCode(HttpStatus.OK)
  @Get('friends-amount')
  async getFriendsAmount(@Request() req: RequestInterface) {
    return {
      amount: await this.referralsService.getFriendsAmount(req.user),
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('friend/inventory/:friendId')
  async getFriendInventory(
    @Request() req: RequestInterface,
    @Param('friendId') friendId: string,
  ) {
    return this.referralsService.getFriendInventory(req.user, friendId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('save-rewards')
  @Public()
  async saveFriendsRewardsJson() {
    return this.referralsService.saveFriendsRewardsJson();
  }
}
