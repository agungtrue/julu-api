import { Test, TestingModule } from '@nestjs/testing';
import { OpexService } from './opex.service';

describe('OpexService', () => {
  let service: OpexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpexService],
    }).compile();

    service = module.get<OpexService>(OpexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
