import { Test, TestingModule } from '@nestjs/testing';
import { IngredientMutationsService } from './ingredient-mutations.service';

describe('IngredientMutationsService', () => {
  let service: IngredientMutationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngredientMutationsService],
    }).compile();

    service = module.get<IngredientMutationsService>(IngredientMutationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
