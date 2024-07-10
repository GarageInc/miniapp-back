import { Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ReferralsService } from 'src/referrals/referrals-service/referrals.service';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Job, Queue } from 'bull';
import { ArtifactService } from 'src/artifact/artifact.service';

function extractObjectFromBase64(base64: string) {
  try {
    const buff = Buffer.from(base64, 'base64');
    const text = buff.toString('utf-8');
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}

function extractCmdArguments(text: string) {
  const parts = text.split(' ');
  if (parts.length < 2) {
    return '';
  }

  return parts[1];
}

function extractRefCode(text: string): string {
  const parts = text.split(' ');
  if (parts.length < 2) {
    return '';
  }

  const refCode = parts[1];

  return refCode;
}

const getRefCode = (text?: string) => {
  if (!text) {
    return {
      ref: '',
      src: '',
    };
  }

  const refCode = extractRefCode(text);

  const paramsBase64 = extractObjectFromBase64(extractCmdArguments(text));

  const params =
    refCode && Object.keys(paramsBase64).length === 0
      ? {
          ref: refCode,
        }
      : paramsBase64;

  return {
    ref: params.ref,
    src: params.source,
  };
};

@Processor(QUEUE_NAMES.USER_CREATION)
export class UserCreationProcessor {
  private readonly logger = new Logger(UserCreationProcessor.name);

  constructor(private readonly referralsService: ReferralsService) {
    console.log('User creation processor initialized');
  }

  handleUserCreation = async (data: any) => {
    const { ref: refCode, src } = getRefCode(data?.text);
    console.log('User creation processor', refCode);

    if (!refCode) {
      return false;
    }

    return await this.referralsService.handleReferral(
      refCode,
      src,
      data.from,
      data.fileUrl,
    );
  };

  @Process('creation')
  async transcode(job: Job) {
    await this.handleUserCreation(job.data);
  }
}
