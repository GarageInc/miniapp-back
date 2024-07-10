/* eslint-disable prettier/prettier */
// user/user.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { ArtifactService } from 'src/artifact/artifact.service';
import { Public } from 'src/auth/auth.guard';
import { RequestInterface } from 'src/dto/UserRequestDto';
import { UserService } from './user.service';
import { mapUserToDto } from 'src/utils/dto';
import { Throttle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Queue } from 'bull';

@Controller('users')
export class UserController {
  constructor(
    private readonly artifactsService: ArtifactService,
    private readonly userService: UserService,
    @InjectQueue(QUEUE_NAMES.USER_CREATION) private userCreationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.FOLLOWERS) private followersQueue: Queue,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get('current')
  async getUserWithArtifacts(@Request() req: RequestInterface) {
    return mapUserToDto(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('inventory')
  async getInventory(@Request() req: RequestInterface) {
    return this.userService.getInventory(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-language')
  async changeLanguage(
    @Request() req: RequestInterface,
    @Body() { language }: { language: string },
  ) {
    return await this.userService.changeLanguage(req.user, language);
  }

  @HttpCode(HttpStatus.OK)
  @Post('claim/first-gift-box')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async claimFirstGiftBox(@Request() req: RequestInterface) {
    const results = await this.artifactsService.claimFirstRemainingArtifact(
      req.user,
    );
    return {
      user: mapUserToDto(results.user),
      gifts: results.gifts,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get('balances')
  async getUserBalances(@Request() req: RequestInterface) {
    return await this.userService.getUserBalances(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('recalculate-bonuses/:telegramId') // https://api.tonchemy.com/users/recalculate-bonuses/450376825
  @Public()
  async recalculateBonuses(@Param('telegramId') telegramId: string) {
    return await this.followersQueue.add('followers', {
      telegramId: telegramId,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('attach-ton-address')
  @Throttle({
    default: {
      ttl: 3000, // 3 seconds
      limit: 1,
    },
  })
  async attachTonAddress(
    @Request() req: RequestInterface,
    @Body() data: { tonAddress: string },
  ) {
    return await this.userService.attachTonAddress(req.user, data.tonAddress);
  }

  @HttpCode(HttpStatus.OK)
  @Get('crafts')
  async getUserCrafts(@Request() req: RequestInterface) {
    return await this.userService.getUserCrafts(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('add-from-bot')
  @Public()
  async addFromBot(@Body() data) {
    try {
      await this.userCreationQueue.add('creation', data);
    } catch (e) {
      console.error('error', e);
    }
    return true;
  }

  @HttpCode(HttpStatus.OK)
  @Get('ref-code-users')
  async getRefCodeUsers(@Request() req: RequestInterface) {
    return await this.userService.getRefCodeUsers(req.user);
  }
}
