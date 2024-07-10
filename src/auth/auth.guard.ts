import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyInitData } from 'src/utils/verifyInitData';
import { ConfigService } from '@nestjs/config';
import { ArtifactService } from 'src/artifact/artifact.service';
import { ReferralsService } from 'src/referrals/referrals-service/referrals.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private referralsService: ReferralsService,
    private configService: ConfigService,
    private artifactsService: ArtifactService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(token);
    }
    try {
      const { isValid, data } = verifyInitData(
        token,
        this.configService.get<string>('TELEGRAM_BOT_TOKEN'),
      );

      if (!isValid) {
        throw new UnauthorizedException(token);
      }

      const refCode = this.extractRefCodeFromHeader(request);
      const src = this.extractSrcFromHeader(request);

      const { user } = data;

      const { user: payload, isNew } = await this.userService.getOrCreateUser(
        user,
        undefined,
        undefined,
        !!refCode,
        refCode,
        src,
      );

      if (!payload) {
        throw new UnauthorizedException(`${token} - ${refCode} - ${src}`);
      }

      if (isNew) {
        await this.referralsService.countReferrals(refCode, payload);
      }

      if (isNew && !payload.inventory.length) {
        await this.artifactsService.generateInitialArtifacts(payload);

        await payload.save();

        request['user'] = await this.userService.getCachedUser(
          payload.telegramId,
        );
      } else {
        // 💡 We're assigning the payload to the request object here
        // so that we can access it in our route handlers
        request['user'] = payload;
      }
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException(`${token} - ${e}`);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'TelegramAuth' ? token : undefined;
  }

  private extractRefCodeFromHeader(request: Request): string | undefined {
    return request.headers['tonchemyref'];
  }

  private extractSrcFromHeader(request: Request): string | undefined {
    return request.headers['tonchemysrc'];
  }
}
