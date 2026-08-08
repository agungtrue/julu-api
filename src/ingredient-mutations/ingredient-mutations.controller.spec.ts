import { Test, TestingModule } from '@nestjs/testing';
import { IngredientMutationsController } from './ingredient-mutations.controller';

describe('IngredientMutationsController', () => {
  let controller: IngredientMutationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientMutationsController],
    }).compile();

    controller = module.get<IngredientMutationsController>(IngredientMutationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
