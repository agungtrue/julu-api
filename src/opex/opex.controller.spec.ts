import { Test, TestingModule } from '@nestjs/testing';
import { OpexController } from './opex.controller';

describe('OpexController', () => {
  let controller: OpexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpexController],
    }).compile();

    controller = module.get<OpexController>(OpexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
