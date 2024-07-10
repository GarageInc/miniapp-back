/* eslint-disable prettier/prettier */
// database.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseProviders } from './database.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const DB_CONFIGS = {
  useNewUrlParser: true,
  dbName: 'tonchemy',
  useUnifiedTopology: true,
  retryDelay: 500,
  retryAttempts: 3,
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          ...DB_CONFIGS,
          uri: configService.get('DATABASE_CONNECTION_STRING'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [...databaseProviders],
  exports: [MongooseModule], // Export MongooseModule for use in other modules
})
export class DatabaseModule {}
