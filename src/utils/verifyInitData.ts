import { createHmac } from 'crypto';

export const verifyInitData = (telegramInitData: string, token: string) => {
  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  urlParams.sort();
  let dataCheckString = '';
  for (const [key, value] of urlParams.entries()) {
    dataCheckString += `${key}=${value}\n`;
  }
  dataCheckString = dataCheckString.slice(0, -1);
  const secret = createHmac('sha256', 'WebAppData').update(token || '');
  const calculatedHash = createHmac('sha256', secret.digest())
    .update(dataCheckString)
    .digest('hex');

  const parsed = JSON.parse(
    '{"' + telegramInitData.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    function (key, value) {
      return key === '' ? value : decodeURIComponent(value);
    },
  );

  return {
    isValid: calculatedHash === hash,
    data: {
      ...parsed,
      user: JSON.parse(parsed.user),
    },
  };
};
