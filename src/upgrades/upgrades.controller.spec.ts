import { Test, TestingModule } from '@nestjs/testing';
import { UpgradesController } from './upgrades.controller';

describe('UpgradesController', () => {
  let controller: UpgradesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpgradesController],
    }).compile();

    controller = module.get<UpgradesController>(UpgradesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
