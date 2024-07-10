import { Test, TestingModule } from '@nestjs/testing';
import { LockedMintsService } from './locked-mints.service';

describe('LockedMintsService', () => {
  let service: LockedMintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LockedMintsService],
    }).compile();

    service = module.get<LockedMintsService>(LockedMintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
