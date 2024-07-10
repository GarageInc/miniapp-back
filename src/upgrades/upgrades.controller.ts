import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { UserUpgradesService } from './user-upgrades/user-upgrades.service';
import { RequestInterface } from 'src/dto/UserRequestDto';

@Controller('upgrade')
export class UpgradesController {
  constructor(private readonly userUpgradesService: UserUpgradesService) {}

  @HttpCode(HttpStatus.OK)
  @Post('user')
  async upgradeUser(@Request() req: RequestInterface) {
    return await this.userUpgradesService.upgradeUser(req.user);
  }
}
