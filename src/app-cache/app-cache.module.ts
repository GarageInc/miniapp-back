import { Module } from '@nestjs/common';
import { AppCacheService } from './app-cache.service';

@Module({
  providers: [AppCacheService],
})
export class AppCacheModule {}
