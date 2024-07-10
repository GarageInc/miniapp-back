// admin.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from 'src/auth/auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('notify-updates')
  @Public()
  notifyUpdates() {
    return this.adminService.notifyUpdates();
  }

  //https://api.tonchemy.com/admin/recalculate-referrals
  @Get('recalculate-referrals')
  @Public()
  recalculateReferrals() {
    return this.adminService.recalculateReferrals();
  }
}
