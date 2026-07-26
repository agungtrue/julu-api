import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opex, OpexType } from './opex.entity';
import { Tenant } from '../tenants/tenants.entity';
import { CreateOpexDto } from './dto/create-opex.dto';
import { UpdateOpexDto } from './dto/update-opex.dto';
import { response } from '../utils/response';

@Injectable()
export class OpexService {
  constructor(
    @InjectRepository(Opex)
    private readonly opexRepo: Repository<Opex>,

    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  /**
   * 1. CREATE OPEX
   * Menyimpan pengeluaran baru. Sesuai konsep daily-basis, baik FIXED maupun ONE_TIME (later)
   * hanya disimpan sebagai 1 baris data tunggal untuk menghemat storage.
   */
  async createOpex(createOpexDto: CreateOpexDto, user): Promise<object> {
    const tenantId = user?.tenantId;
    const userId = user?.id;
    const newOpex = this.opexRepo.create({
      ...createOpexDto,
      tenantId,
      createdById: userId,
    });

    const savedOpex = await this.opexRepo.save(newOpex);

    await this.syncDailyOpex(tenantId);

    return savedOpex;
  }

  /**
   * 2. GET OPEX SUMMARY BY RANGE (Bulanan / Rentang Waktu)
   * Menggunakan rumus akumulasi amortisasi khusus agar ONE_TIME tidak terkena multiplier disaster.
   */
  async getOpexSummaryByRange(user: any, startDate: Date, endDate: Date) {
    const tenantId = user?.tenantId;
    const start = new Date(startDate.setHours(0, 0, 0, 0));
    const end = new Date(endDate.setHours(23, 59, 59, 999));

    // Hitung selisih hari
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const dateDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // A. Ambil akumulasi biaya FIXED harian yang saat ini sedang aktif
    const fixedResult = await this.opexRepo
      .createQueryBuilder('opex')
      .select('SUM(opex.amount)', 'total')
      .where('opex.tenantId = :tenantId', { tenantId })
      .andWhere('opex.type = :type', { type: OpexType.FIXED })
      .andWhere('opex.isActive = :isActive', { isActive: true })
      .getRawOne();

    const totalFixedDaily = Number(fixedResult.total) || 0;
    const totalFixedForRange = totalFixedDaily * dateDiff; // Dikali date_diff

    // B. Ambil total ONE_TIME murni yang terjadi di dalam rentang waktu tersebut
    const oneTimeResult = await this.opexRepo
      .createQueryBuilder('opex')
      .select('SUM(opex.amount)', 'total')
      .where('opex.tenantId = :tenantId', { tenantId })
      .andWhere('opex.type = :type', { type: OpexType.ONE_TIME })
      .andWhere('opex.expense_date BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const totalOneTimeForRange = Number(oneTimeResult.total) || 0;
    const grandTotalOpex = totalFixedForRange + totalOneTimeForRange;

    return {
      dateDiff,
      totalFixedOpex: totalFixedForRange,
      totalOneTimeOpex: totalOneTimeForRange,
      grandTotalOpex: grandTotalOpex, // Angka ini yang dikirim ke grafik/summary
    };
  }

  /**
   * 3. FIND ALL OPEX
   * Mengambil semua daftar pengeluaran milik tenant bersangkutan, diurutkan dari yang terbaru.
   */
  async findAll(user: any): Promise<object> {
    const tenantId = user?.tenantId;
    const data = await this.opexRepo.find({
      where: { tenantId },
      order: { expense_date: 'DESC', createdAt: 'DESC' },
      // relations: ['createdBy'],
    });

    return response(200, 'OK', data);
  }

  /**
   * 4. FIND ONE OPEX DETAIL
   * Mengambil 1 detail data pengeluaran dengan proteksi tenantId yang ketat.
   */
  async findOne(id: string, user: any): Promise<Opex> {
    const tenantId = user?.tenantId;
    const opex = await this.opexRepo.findOne({
      where: { id, tenantId },
      // relations: ['createdBy'],
    });

    if (!opex) {
      throw new NotFoundException(
        `Data OPEX dengan ID tersebut tidak ditemukan.`,
      );
    }

    return opex;
  }

  /**
   * 5. UPDATE OPEX
   * Mengubah data OPEX (Misal ganti nominal, judul, atau mematikan status FIXED via isActive).
   */
  async update(
    id: string,
    updateOpexDto: UpdateOpexDto,
    user: any,
  ): Promise<Opex> {
    const tenantId = user?.tenantId;
    // Pastikan data tersebut ada dan benar milik tenant yang merequest
    const opex = await this.findOne(id, tenantId);

    // Gabungkan data lama dengan data baru yang di-update
    const updatedOpex = this.opexRepo.merge(opex, updateOpexDto);
    const savedOpex = await this.opexRepo.save(updatedOpex);

    await this.syncDailyOpex(tenantId);
    return savedOpex;
  }

  /**
   * 6. REMOVE OPEX
   * Menghapus catatan pengeluaran dari database.
   */
  async remove(id: string, user: any): Promise<{ message: string }> {
    const tenantId = user?.tenantId;
    const opex = await this.findOne(id, tenantId);
    await this.opexRepo.remove(opex);
    await this.syncDailyOpex(tenantId);

    return response(200, 'Catatan OPEX berhasil dihapus.', []);
  }

  private async syncDailyOpex(tenantId): Promise<void> {
    const result = await this.opexRepo
      .createQueryBuilder('opex')
      .select('SUM(opex.amount)', 'total')
      .where('opex.tenantId = :tenantId', { tenantId })
      .andWhere('opex.type = :type', { type: OpexType.FIXED })
      .andWhere('opex.isActive = :isActive', { isActive: true })
      .getRawOne();

    const totalFixedDaily = Number(result?.total) || 0;

    // Update nilai daily_opex langsung ke baris tenant terkait
    // Sesuaikan properti 'dailyOpex' dengan kolom asli di Tenant entity Anda (camelCase/snake_case)
    await this.tenantRepo.update(tenantId, {
      daily_opex: totalFixedDaily,
    });
  }
}
