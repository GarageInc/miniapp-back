import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { CacheTTL } from '@nestjs/cache-manager';
import { HttpCacheInterceptor } from 'src/auth/http-cache.interceptor';
import { toArtifactDto } from './dto';

@Controller('artifact')
export class ArtifactController {
  constructor(private readonly artifactService: ArtifactService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/item/:artifactId')
  @CacheTTL(30000) // 30000 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getArtifactById(@Param('artifactId') artifactId: string) {
    return toArtifactDto(
      await this.artifactService.getArtifactById(artifactId),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('all')
  @CacheTTL(3600) // 3600 seconds
  @UseInterceptors(HttpCacheInterceptor)
  async getAll() {
    const artifacts = await this.artifactService.getAll();

    return artifacts.reduce((acc, item) => {
      acc[item.id] = toArtifactDto(item);
      return acc;
    }, {});
  }
}
