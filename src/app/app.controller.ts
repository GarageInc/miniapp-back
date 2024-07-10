/* eslint-disable prettier/prettier */
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '../auth/auth.guard';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @HttpCode(HttpStatus.OK)
  @Get('status')
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }
}
