import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.schema';
import { APP_CONFIGS } from 'src/utils/app-configs';

const mediaReferalsCount = 11;
const mediaGiftBoxCount = 16;
const getRandomMediaIdByLimit = (n) => Math.floor(Math.random() * n) + 1;

const getRandomMediaUrlReferal = () =>
  `https://storage.googleapis.com/cdn.tonchemy.com/bot-gifs/referrals/${getRandomMediaIdByLimit(
    mediaReferalsCount,
  )}.mp4`;

const getRandomMediaUrlGiftBox = () =>
  `https://storage.googleapis.com/cdn.tonchemy.com/bot-gifs/gift_box/${getRandomMediaIdByLimit(
    mediaGiftBoxCount,
  )}.mp4`;

const TRANSLATIONS = {
  en: {
    bonusesNotification: `You have received new referal bonuses!`,
    filledBoxesNotification: `You have filled all gift boxes!`,
    longTimeNoSeeNotification: `You've been gone for so long! Time to craft new elements! 🌋`,
    sharedLink: `Play the First Tonchemy GameFi on Ton with me! 🌋`,
    share: 'Share',
    backToGame: 'Back to game',
    craftNewElements: 'Craft new elements! 🌋',
    releasedNewVersion: `⭐️⭐️⭐️⭐️⚡️⚡️⚡️⚡️

Thank you for waiting 🤝 New update is out 😄
- New elements 🖼
- New super simple design!
- Unlimited amount of each element and Special game points 💎

We've started a new episode of regular updates, and already working on new cool mechanics and special events 🤫 

Invite your friends now (you'll benefit from it in future) and stay tuned  🤗
`,
  },
  ru: {
    bonusesNotification: `Вы получили новые бонусы за рефералов!`,
    filledBoxesNotification: `Вы заполнили все подарочные боксы!`,
    longTimeNoSeeNotification: `Вас не было так долго! Пора создавать новые элементы! 🌋`,
    sharedLink: `Играй в первую Tonchemy GameFi на Ton со мной! 🌋`,
    share: 'Поделиться',
    backToGame: 'Вернуться в игру',
    craftNewElements: 'Создавайте новые элементы! 🌋',
    releasedNewVersion: `⭐️⭐️⭐️⭐️⚡️⚡️⚡️⚡️

Спасибо тебе за терпение 🤝 Новый апдейт выпущен 😄
- Новые элементы 🖼
- Новый супер простой дизайн!
- Неограниченное кол-во каждого элемента и специальные игровые поинты 💎

Мы начали новый эпизод регулярных обновлений и уже работаем нам новыми крутыми механиками и уникальными ивентами 🤫 

Приглашай друзей уже сейчас (в будущем это тебе поможет) и следи за обновлениями  🤗`,
  },
};

const getTranslations = (user: User, key: string) => {
  const language = user.language || APP_CONFIGS.DEFAULT_LANGUAGE;
  return (
    TRANSLATIONS[language][key] ||
    TRANSLATIONS[APP_CONFIGS.DEFAULT_LANGUAGE][key]
  );
};

@Injectable()
export class BotService {
  constructor(private configService: ConfigService) {}

  async sendBonusesNotification(user: User) {
    const message = getTranslations(user, 'bonusesNotification');

    const chatId = user.chatId || user.telegramId;

    // sendAnimation to telegram bot

    return await fetch(
      'https://api.telegram.org/bot' +
        this.configService.get<string>('TELEGRAM_BOT_TOKEN') +
        '/sendAnimation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          caption: message,
          parse_mode: 'HTML',
          animation: getRandomMediaUrlReferal(),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: getTranslations(user, 'backToGame'),
                  web_app: {
                    url: this.configService.get<string>('TELEGRAM_WEB_VIEW'),
                  },
                },
              ],
            ],
          },
        }),
      },
    )
      .then((a) => a.json())
      .catch(console.error);
  }

  async informUserAboutFilledBoxes(user: User) {
    const message = getTranslations(user, 'filledBoxesNotification');

    const chatId = user.chatId || user.telegramId;

    fetch(
      'https://api.telegram.org/bot' +
        this.configService.get<string>('TELEGRAM_BOT_TOKEN') +
        '/sendAnimation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          animation: getRandomMediaUrlGiftBox(),
          caption: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: getTranslations(user, 'backToGame'),
                  web_app: {
                    url: this.configService.get<string>('TELEGRAM_WEB_VIEW'),
                  },
                },
              ],
            ],
          },
        }),
      },
    );
  }

  async informUserAboutLastLogin(user: User) {
    const telegramLink = `https://t.me/${this.configService.get<string>(
      'TELEGRAM_BOT_NAME',
    )}/${this.configService.get<string>('TELEGRAM_APP_NAME')}`;

    const message = `${getTranslations(
      user,
      'longTimeNoSeeNotification',
    )} 🌋 <a href="${telegramLink}">${telegramLink}</a>`;

    const chatId = user.chatId || user.telegramId;

    fetch(
      'https://api.telegram.org/bot' +
        this.configService.get<string>('TELEGRAM_BOT_TOKEN') +
        '/sendMessage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: getTranslations(user, 'craftNewElements'),
                  web_app: {
                    url: this.configService.get<string>('TELEGRAM_WEB_VIEW'),
                  },
                },
              ],
            ],
          },
        }),
      },
    );
  }

  async sendSharedLinkToBot(user: User, code: string) {
    const telegramLink = `https://t.me/${this.configService.get<string>(
      'TELEGRAM_BOT_NAME',
    )}/${this.configService.get<string>('TELEGRAM_APP_NAME')}?startapp=${code}`;

    const telegramShareLink = `https://t.me/share/url?url=${telegramLink}&text=${encodeURIComponent(
      getTranslations(user, 'sharedLink'),
    )}`;

    const message = `${getTranslations(
      user,
      'sharedLink',
    )} <a href="${telegramLink}">${telegramLink}</a>`;

    const chatId = user.chatId || user.telegramId;

    fetch(
      'https://api.telegram.org/bot' +
        this.configService.get<string>('TELEGRAM_BOT_TOKEN') +
        '/sendMessage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: getTranslations(user, 'share'),
                  url: telegramShareLink,
                },
              ],
              [
                {
                  text: getTranslations(user, 'backToGame'),
                  web_app: {
                    url: this.configService.get<string>('TELEGRAM_WEB_VIEW'),
                  },
                },
              ],
            ],
          },
        }),
      },
    );
  }

  async notifyUsersAboutNewVersion(users: User[]) {
    for (const user of users) {
      try {
        console.log('Sending new version notification to', user.username);
        const message = getTranslations(user, 'releasedNewVersion');

        const chatId = user.chatId || user.telegramId;

        await fetch(
          'https://api.telegram.org/bot' +
            this.configService.get<string>('TELEGRAM_BOT_TOKEN') +
            '/sendMessage',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: getTranslations(user, 'backToGame'),
                      web_app: {
                        url: this.configService.get<string>(
                          'TELEGRAM_WEB_VIEW',
                        ),
                      },
                    },
                  ],
                ],
              },
            }),
          },
        )
          .then((a) => {
            console.log('-> Sent new version notification to', user.username);
            return a.json();
          })
          .catch(console.error);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
