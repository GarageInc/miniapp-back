import { Test, TestingModule } from '@nestjs/testing';
import { UserUpgradesService } from './user-upgrades.service';

describe('UserUpgradesService', () => {
  let service: UserUpgradesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserUpgradesService],
    }).compile();

    service = module.get<UserUpgradesService>(UserUpgradesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
