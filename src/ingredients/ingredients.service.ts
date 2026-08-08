import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { ProductIngredient } from './entities/product-ingredient.entity';
import { Product } from '../products/products.entity';
import { response } from '../utils/response';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private ingredientRepo: Repository<Ingredient>,

    @InjectRepository(ProductIngredient)
    private productIngredientRepo: Repository<ProductIngredient>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async createIngredient(
    data: {
      name: string;
      purchase_cost: number;
      conversion_factor: number;
      unit: string;
    },
    user: any,
  ) {
    if (data.conversion_factor <= 0)
      throw new BadRequestException('Faktor konversi harus lebih dari 0');

    // Hitung otomatis modal per unit takaran terkecil (gram/ml)
    const cost_per_unit = data.purchase_cost / data.conversion_factor;

    const tenantId = user.tenantId;
    const newIngredient = this.ingredientRepo.create({
      ...data,
      cost_per_unit,
      tenantId,
    });
    return await this.ingredientRepo.save(newIngredient);
  }

  async findAllIngredients(user) {
    // Math.round(purchase_cost).toLocaleString('id-ID');
    // return await this.ingredientRepo.find({ orderBy: { name: 'ASC' } });
    const tenantId = user.tenantId;
    const data = await this.ingredientRepo.find({
      where: {
        tenantId,
      },
    });
    return response(200, 'OK', [data]);
  }

  async updateIngredient(
    id: string,
    data: {
      name?: string;
      purchase_cost?: number;
      conversion_factor?: number;
      stock?: number;
      minimumStock?: number;
    },
  ) {
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    if (data?.name) ingredient.name = data.name;

    if (data?.stock) ingredient.stock = data.stock;
    if (data?.minimumStock) ingredient.minimumStock = data.minimumStock;

    // Jika ada perubahan harga beli atau faktor konversi, hitung ulang cost_per_unit
    if (
      data.purchase_cost !== undefined ||
      data.conversion_factor !== undefined
    ) {
      const cost = data.purchase_cost ?? ingredient.purchase_cost;
      const factor = data.conversion_factor ?? ingredient.conversion_factor;

      if (factor <= 0)
        throw new BadRequestException('Faktor should greater than 0');

      ingredient.purchase_cost = cost;
      ingredient.conversion_factor = factor;
      ingredient.cost_per_unit = cost / factor;
    }

    const updatedIngredient = await this.ingredientRepo.save(ingredient);

    // KUNCI OTOMATISASI: Jika harga bahan berubah, cari semua resep yang pakai bahan ini,
    // hitung ulang sub_total_cost resepnya, lalu sync ke products.cogs
    if (
      data.purchase_cost !== undefined ||
      data.conversion_factor !== undefined
    ) {
      await this.triggerGlobalCogsRecalculation(id);
    }

    return updatedIngredient;
  }

  async removeIngredient(id: string) {
    // Keblokir otomatis oleh RESTRICT rule jika bahan masih dipakai di resep aktif
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Bahan baku tidak ditemukan');
    return await this.ingredientRepo.remove(ingredient);
  }

  // === 2. MESIN HITUNG FORMULA RESEP (SUBMIT HANDLER) ===

  async getRecipeByProduct(product_id: string) {
    const data = await this.productIngredientRepo.find({
      where: { product_id },
      relations: ['ingredient'],
    });
    return response(200, 'OK', [data]);
  }

  async saveProductRecipe(
    productId: string,
    ingredientsPayload: { ingredient_id: string; qty_used: number }[],
    user: any,
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    // console.log({ product, user });

    if (!product) throw new NotFoundException('Product not found');

    // 2. Hapus susunan resep lama untuk produk ini (Overwriting system)
    await this.productIngredientRepo.delete({ product_id: productId });

    // 3. Loop dan rakit komposisi resep baru jika payload tidak kosong
    if (ingredientsPayload && ingredientsPayload.length > 0) {
      const newItems: ProductIngredient[] = [];

      for (const item of ingredientsPayload) {
        const targetIngredient = await this.ingredientRepo.findOne({
          where: { id: item.ingredient_id },
        });
        if (!targetIngredient)
          throw new NotFoundException(
            `ingredient ID ${item.ingredient_id} not found`,
          );

        // Rumus subtotal: takaran * harga per unit terkecil
        const sub_total_cost = item.qty_used * targetIngredient.cost_per_unit;

        const recipeItem = this.productIngredientRepo.create({
          product_id: productId,
          ingredient_id: item.ingredient_id,
          qty_used: item.qty_used,
          sub_total_cost: sub_total_cost,
          tenantId: product.tenantId,
        });

        newItems.push(recipeItem);
      }

      // Simpan bulk baris komposisi resep baru ke DB
      await this.productIngredientRepo.save(newItems);
    }

    // 4. Hitung SUM total akhir resep dan update ke kolom products.cogs Anda
    await this.syncSingleProductCogs(productId);

    return {
      success: true,
      message: 'Recipe & COGS update successfully',
    };
  }

  public async syncSingleProductCogs(
    productId: string,
    manager?: EntityManager,
  ) {
    const recipeRepo = manager
      ? manager.getRepository(ProductIngredient)
      : this.productIngredientRepo;

    const productRepo = manager
      ? manager.getRepository(Product)
      : this.productRepo;

    const currentRecipeItems = await recipeRepo.find({
      where: { product_id: productId },
    });

    // console.log({ currentRecipeItems });

    const finalCogs = currentRecipeItems.reduce(
      (acc, item) => acc + Number(item.sub_total_cost || 0),
      0,
    );

    // console.log({ finalCogs });

    await productRepo.update(productId, { cogs: Math.ceil(finalCogs) });
  }

  // Fungsi pengunci skala besar jika ada kenaikan harga bahan supplier
  public async triggerGlobalCogsRecalculation(
    ingredientId: string,
    newWacCostPerUnit?: number,
    manager?: EntityManager,
  ) {
    const recipeRepo = manager
      ? manager.getRepository(ProductIngredient)
      : this.productIngredientRepo;

    const affectedRecipes = await recipeRepo.find({
      where: { ingredient_id: ingredientId },
      relations: ['ingredient'],
    });

    // console.log({ ingredientId, affectedRecipes, newWacCostPerUnit });

    if (affectedRecipes.length === 0) return;

    for (const item of affectedRecipes) {
      // console.log({ item });
      const costPerUnit =
        newWacCostPerUnit !== undefined
          ? newWacCostPerUnit
          : Number(item.ingredient.cost_per_unit || 0);
      // item.sub_total_cost = item.qty_used * item.ingredient.cost_per_unit;
      item.sub_total_cost = Math.round(Number(item.qty_used) * costPerUnit);
      await recipeRepo.save(item);

      // const newSubTotalCost = Math.round(Number(item.qty_used) * costPerUnit);
      // await recipeRepo.update(item.id, {
      //   sub_total_cost: newSubTotalCost,
      // });
    }

    const uniqueProductIds = Array.from(
      new Set(affectedRecipes.map((r) => r.product_id)),
    );

    for (const productId of uniqueProductIds) {
      await this.syncSingleProductCogs(productId, manager);
    }
  }
}
