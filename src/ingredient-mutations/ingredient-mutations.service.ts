import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { IngredientMutation } from './entities/ingredient-mutation.entity';
import { Order } from '../orders/orders.entity';
import { StockMutationType } from './stock-mutation-type.enum';
import { RestockIngredientDto } from './dto/restock-ingredient.dto';
import { RecordLossDto } from './dto/record-loss.dto';
import { StockOpnameDto } from './dto/stock-opname.dto';
import { IngredientsService } from '../ingredients/ingredients.service';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

@Injectable()
export class IngredientMutationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ingredientsService: IngredientsService,
  ) {}

  /**
   * 1. RESTOCK IN (Barang Masuk & Hitung Ulang HPP)
   */
  async restock(tenantId: string, userId: string, dto: RestockIngredientDto) {
    // console.log({ tenantId, userId, dto });
    //  return true
    return await this.dataSource.transaction(async (manager) => {
      const ingredient = await manager.findOne(Ingredient, {
        where: { id: dto.ingredientId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ingredient)
        throw new NotFoundException('Bahan baku tidak ditemukan.');

      const previousStock = Number(ingredient.stock);
      const addedQty = Number(dto.quantity);
      const currentStock = previousStock + addedQty;

      // Hitung HPP Baru via Weighted Average Cost (WAC)
      let updatedUnitPrice = Number(ingredient.cost_per_unit || 0);
      if (dto.cost_per_unit && dto.cost_per_unit > 0) {
        const oldTotalValue = previousStock * updatedUnitPrice;
        const newTotalValue = addedQty * Number(dto.cost_per_unit);
        updatedUnitPrice = Math.round(
          (oldTotalValue + newTotalValue) / currentStock,
        );
      }

      // console.log({ updatedUnitPrice });

      // Update Table Master Ingredient
      ingredient.stock = currentStock;
      ingredient.purchase_cost = Number(dto.purchase_cost);
      ingredient.cost_per_unit = updatedUnitPrice;
      await manager.save(ingredient);

      // Record Log Mutasi
      const mutation = manager.create(IngredientMutation, {
        tenantId,
        ingredientId: ingredient.id,
        type: StockMutationType.RESTOCK_IN,
        quantity: addedQty,
        previousStock,
        currentStock,
        cost_per_unit: dto.cost_per_unit || updatedUnitPrice,
        totalCost: addedQty * (dto.cost_per_unit || updatedUnitPrice),
        referenceId: dto.referenceId,
        notes: dto.notes || 'Restock Bahan Baku',
        createdById: userId,
      });

      await manager.save(mutation);

      await this.ingredientsService.triggerGlobalCogsRecalculation(
        ingredient.id,
        updatedUnitPrice,
        manager,
      );

      return {
        message: 'Restock berhasil dicatat',
        currentStock,
        updatedUnitPrice,
      };
    });
  }

  /**
   * 2. RECORD LOSS (Barang Basi, Tumpah, Rusak)
   */
  async recordLoss(tenantId: string, userId: string, dto: RecordLossDto) {
    // console.log({ tenantId, userId, dto });
    return await this.dataSource.transaction(async (manager) => {
      const ingredient = await manager.findOne(Ingredient, {
        where: { id: dto.ingredientId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ingredient)
        throw new NotFoundException('Bahan baku tidak ditemukan.');

      const previousStock = Number(ingredient.stock);
      const lossQty = Number(dto.quantity);

      if (previousStock < lossQty) {
        throw new BadRequestException(
          `Jumlah loss (${lossQty}) melebihi stok saat ini (${previousStock}).`,
        );
      }

      const currentStock = previousStock - lossQty;

      // Update Table Master Ingredient
      ingredient.stock = currentStock;
      await manager.save(ingredient);

      // Record Log Mutasi (Kuantitas Disimpan Negatif)
      const mutation = manager.create(IngredientMutation, {
        tenantId,
        ingredientId: ingredient.id,
        type: StockMutationType.LOSS,
        quantity: -lossQty,
        previousStock,
        currentStock,
        cost_per_unit: ingredient.cost_per_unit,
        totalCost: lossQty * Number(ingredient.cost_per_unit || 0),
        notes: dto.notes,
        createdById: userId,
      });

      await manager.save(mutation);

      return { message: 'Loss berhasil dicatat', currentStock };
    });
  }

  /**
   * 3. STOCK OPNAME / ADJUSTMENT
   */
  async adjustStockOpname(
    tenantId: string,
    userId: string,
    dto: StockOpnameDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const ingredient = await manager.findOne(Ingredient, {
        where: { id: dto.ingredientId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ingredient)
        throw new NotFoundException('Bahan baku tidak ditemukan.');

      const previousStock = Number(ingredient.stock);
      const actualStock = Number(dto.actualPhysicalStock);
      const diffQuantity = actualStock - previousStock;

      if (diffQuantity === 0) {
        return {
          message: 'Stok fisik sama dengan stok sistem. Tidak ada perubahan.',
          currentStock: actualStock,
        };
      }

      // Update Table Master Ingredient
      ingredient.stock = actualStock;
      await manager.save(ingredient);

      // Record Log Mutasi
      const mutation = manager.create(IngredientMutation, {
        tenantId,
        ingredientId: ingredient.id,
        type: StockMutationType.ADJUSTMENT,
        quantity: diffQuantity, // BISA POSITIF (+ SELISIH LEBIH) ATAU NEGATIF (- SELISIH KURANG)
        previousStock,
        currentStock: actualStock,
        cost_per_unit: ingredient.cost_per_unit,
        totalCost:
          Math.abs(diffQuantity) * Number(ingredient.cost_per_unit || 0),
        notes: dto.notes || 'Penyesuaian Stock Opname',
        createdById: userId,
      });

      await manager.save(mutation);

      return {
        message: 'Stock Opname berhasil diperbarui',
        currentStock: actualStock,
        diffQuantity,
      };
    });
  }

  /**
   * 4. USAGE OUT (METHOD KHUSUS UNTUK DIPANGGIL OLEH ORDER / PRODUCT MODULE)
   * Method ini bisa menerima `transactionalEntityManager` opsional jika order checkout memakai DB Transaction sendiri.
   */
  async recordUsageOut(
    tenantId: string,
    userId: string,
    ingredientId: string,
    quantityToDeduct: number,
    orderReferenceId: string,
    externalManager?: EntityManager,
  ) {
    // console.log({
    //   tenantId,
    //   userId,
    //   ingredientId,
    //   quantityToDeduct,
    //   orderReferenceId,
    //   externalManager,
    // });

    // return true
    const execute = async (manager: EntityManager) => {
      const ingredient = await manager.findOne(Ingredient, {
        where: { id: ingredientId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ingredient)
        throw new NotFoundException(
          `Bahan baku ${ingredientId} tidak ditemukan.`,
        );

      const previousStock = Number(ingredient.stock);
      const deductQty = Number(quantityToDeduct);
      const currentStock = previousStock - deductQty;

      // Update Table Master Ingredient
      ingredient.stock = currentStock;
      await manager.save(ingredient);

      const order = await manager.findOne(Order, {
        where: { id: orderReferenceId },
      });

      if (!order) throw new NotFoundException('Order tidak ditemukan!');

      // Record Log Mutasi
      const mutation = manager.create(IngredientMutation, {
        tenantId,
        ingredientId: ingredient.id,
        type: StockMutationType.USAGE_OUT,
        quantity: deductQty,
        previousStock,
        currentStock,
        cost_per_unit: ingredient.cost_per_unit,
        totalCost: deductQty * Number(ingredient.cost_per_unit || 0),
        referenceId: orderReferenceId,
        notes: `Otomatis dari Order #${order.invoiceNo}`,
        createdById: userId,
      });

      await manager.save(mutation);
    };

    if (externalManager) {
      await execute(externalManager);
    } else {
      await this.dataSource.transaction(
        async (manager) => await execute(manager),
      );
    }
  }

  /**
   * 5. GET MUTATION LOGS (Untuk Tabel Frontend)
   */
  async getLogs(
    tenantId: string,
    ingredientId?: string,
    type?: StockMutationType,
  ) {
    // console.log({ tenantId, ingredientId, type });
    const query = this.dataSource
      .getRepository(IngredientMutation)
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.ingredient', 'ingredient')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC')
      .take(50);

    if (ingredientId) {
      query.andWhere('log.ingredientId = :ingredientId', { ingredientId });
    }

    if (type) {
      query.andWhere('log.type = :type', { type });
    }

    return await query.getMany();
  }

  public async getLossMutation(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    from?: string,
  ) {
    // console.log({ tenantId, startDate, endDate, from });
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const query = this.dataSource
      .createQueryBuilder(IngredientMutation, 'm')
      .select('COALESCE(SUM(m.quantity * m.cost_per_unit), 0)', 'totalNominal')
      .addSelect('COUNT(m.id)', 'count')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.type = :type', { type: StockMutationType.LOSS });

    if (from === 'dashboard') {
      const finalStartDate = startDate
        ? dayjs.tz(startDate, 'Asia/Jakarta').startOf('day').utc().toDate()
        : dayjs().tz('Asia/Jakarta').startOf('day').utc().toDate();

      const finalEndDate = endDate
        ? dayjs.tz(endDate, 'Asia/Jakarta').endOf('day').utc().toDate()
        : dayjs().tz('Asia/Jakarta').endOf('day').utc().toDate();

      query.andWhere('m.createdAt BETWEEN :startDate AND :endDate', {
        startDate: finalStartDate,
        endDate: finalEndDate,
      });
    } else {
      query.andWhere('m.createdAt >= :startOfMonth', { startOfMonth });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await query.getRawOne();
  }

  async getSummaryStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Agregasi RESTOCK Bulan Ini via DataSource
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const restockQuery = await this.dataSource
      .createQueryBuilder(IngredientMutation, 'm')
      .select('SUM(m.quantity * m.cost_per_unit)', 'totalNominal')
      .addSelect('COUNT(m.id)', 'count')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.type = :type', { type: StockMutationType.RESTOCK_IN })
      .andWhere('m.createdAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    // 2. Agregasi OPERATIONAL LOSS Bulan Ini via DataSource

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lossQuery = await this.getLossMutation(tenantId);

    // 3. Total Aktivitas via DataSource Repository
    const totalActivityCount = await this.dataSource
      .getRepository(IngredientMutation)
      .count({
        where: { tenantId },
      });

    return {
      restock: {
        totalAmount: Math.round(Number(restockQuery?.totalNominal || 0)),
        count: Number(restockQuery?.count || 0),
      },
      loss: {
        totalAmount: Math.round(Number(lossQuery?.totalNominal || 0)),
        count: Number(lossQuery?.count || 0),
      },
      totalActivityCount,
    };
  }
}
