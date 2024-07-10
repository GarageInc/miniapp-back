import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.schema';

const YESCOIN_SOURCE = 'b2d1';

@Injectable()
export class AnalyticsService {
  constructor(private readonly configService: ConfigService) {}

  async newUserRegistrationEvent(user: User) {
    if (user.source === YESCOIN_SOURCE) {
      try {
        const apiUrl = this.configService.get<string>('YESCOIN_API_URL');
        const apiToken = this.configService.get<string>('YESCOIN_API_TOKEN');

        if (apiUrl && apiToken) {
          const result = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${apiToken}`,
            },
            body: JSON.stringify({
              playerId: user.telegramId,
              taskSlug: 'tonchemy-signup',
            }),
          });

          console.log(
            'New user registration event sent to Yescoin',
            await result.json(),
          );
        } else {
          console.log('API URL or API Token is not set');
        }
      } catch (e) {
        console.log(
          'Error in sending new user registration event to Yescoin',
          e,
        );
      }
    }

    return true;
  }
}
