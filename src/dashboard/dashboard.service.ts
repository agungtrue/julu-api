import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetSummaryDashboardDto } from './dto/get-summary-dashboard.dto';
import { dashboardSummaryQuery } from './repository/dashboardSummary';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(dto: GetSummaryDashboardDto, user: any) {
    const tenantId = user?.tenantId;

    const todayStr = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });
    const startDateStr = dto.startDate || todayStr;
    const endDateStr = dto.endDate || todayStr;

    const startDate = `${startDateStr} 00:00:00`;
    const endDate = `${endDateStr} 23:59:59`;

    // Hitung durasi hari filter (min 1 hari)
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
      1,
    );

    try {
      const rawResult = await this.dataSource.query(dashboardSummaryQuery, [
        tenantId,
        startDate,
        endDate,
      ]);

      const row = rawResult[0] || {};

      const round2 = (num: number) => parseFloat(Number(num || 0).toFixed(2));

      // Core Financial Data
      const totalRevenue = parseFloat(row.totalRevenue || 0);
      const totalCogs = parseFloat(row.totalCogs || 0);
      const grossProfit = parseFloat(row.grossProfit || 0);

      const baseDailyOpex = parseFloat(row.totalOpex || 0);
      const cumulativeTotalOpex = baseDailyOpex * daysCount;

      const totalOpex = parseFloat(row.totalOpex || 0);
      const totalLossNominal = parseFloat(row.totalLossNominal || 0);
      const netProfit = grossProfit - totalLossNominal - cumulativeTotalOpex;

      const totalItemsSold = parseInt(row.totalItemsSold || 0, 10);
      const totalConfirmedOrders = parseInt(row.totalConfirmedOrders || 0, 10);
      const coffeeCups = parseInt(row.coffeeCups || 0, 10);
      const nonCoffeeCups = parseInt(row.nonCoffeeCups || 0, 10);
      const totalCups = coffeeCups + nonCoffeeCups;
      const snacks = parseInt(row.totalSnacks || 0, 10);

      // Opex Breakdown
      const opexRatioPercentage =
        totalRevenue > 0 ? (cumulativeTotalOpex / totalRevenue) * 100 : 0;
      const opexPerTransactionAmount =
        totalConfirmedOrders > 0
          ? cumulativeTotalOpex / totalConfirmedOrders
          : 0;
      const opexCoverageRatio =
        cumulativeTotalOpex > 0
          ? (totalRevenue / cumulativeTotalOpex) * 100
          : 0;

      // Profitability Index
      const profitabilityIndex =
        cumulativeTotalOpex > 0 ? (netProfit / cumulativeTotalOpex) * 100 : 0;

      // Cups Metrics Breakdown
      const arcpAmount =
        totalItemsSold > 0 ? Math.round(totalRevenue / totalItemsSold) : 0;
      const avgGrossItemAmount =
        totalItemsSold > 0 ? Math.round(grossProfit / totalItemsSold) : 0;
      const avgNetItemAmount =
        totalItemsSold > 0 ? Math.round(netProfit / totalItemsSold) : 0;
      const cupsPerTransaction =
        totalConfirmedOrders > 0 ? totalCups / totalConfirmedOrders : 0;

      // Margin Percentages
      const cogsMargin =
        totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0;
      const grossMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Transaction Metrics
      const avgTransactionValue =
        totalConfirmedOrders > 0
          ? Math.round(totalRevenue / totalConfirmedOrders)
          : 0;
      const avgRevenuePerDay = Math.round(totalRevenue / daysCount);
      const avgTransactionsPerDay = parseFloat(
        (totalConfirmedOrders / daysCount).toFixed(1),
      );

      // BEP Metrics
      const grossMarginRatio =
        totalRevenue > 0 ? grossProfit / totalRevenue : 0;
      const targetBEPRevenue =
        grossMarginRatio > 0 ? cumulativeTotalOpex / grossMarginRatio : 0;
      const actualVsTargetPercentage =
        targetBEPRevenue > 0
          ? parseFloat(((totalRevenue / targetBEPRevenue) * 100).toFixed(2))
          : 0;
      const excessRevenueAmount = totalRevenue - targetBEPRevenue;
      const excessRevenuePercentage =
        targetBEPRevenue > 0
          ? parseFloat(
              ((excessRevenueAmount / targetBEPRevenue) * 100).toFixed(2),
            )
          : -100;
      const avgPricePerItem =
        totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0;
      const targetTransactionsCount =
        avgTransactionValue > 0
          ? round2(targetBEPRevenue / avgTransactionValue)
          : 0;
      const targetItemsCount =
        avgPricePerItem > 0 ? round2(targetBEPRevenue / avgPricePerItem) : 0;

      const bepCoverageRatio =
        targetBEPRevenue > 0 ? round2(totalRevenue / targetBEPRevenue) : 0;

      const opexEfficiencyRatio = bepCoverageRatio;

      const categorySales = row?.productCategories || [];

      return {
        tenantSubscription: user?.subscription || null,
        transactions: totalConfirmedOrders,
        revenues: totalRevenue,
        grossIncomes: grossProfit,
        totalItemsSold,
        totalCogs,
        totalOpex: cumulativeTotalOpex,
        netIncomes: netProfit,
        totalOrders: {
          totalConfirmedOrders,
        },
        totalPendingOrders: parseInt(row.totalPendingOrders || 0, 10),
        totalCancelledOrders: parseInt(row.totalCancelledOrders || 0, 10),
        lossMutation: {
          totalNominal: String(totalLossNominal),
          count: String(parseInt(row.totalLossCount || 0, 10)),
        },
        paymentMethods: {
          qrisCount: parseInt(row.qrisCount || 0, 10),
          cashCount: parseInt(row.cashCount || 0, 10),
          amounts: {
            qris: parseFloat(row.qrisAmount || 0),
            cash: parseFloat(row.cashAmount || 0),
          },
        },
        opex: {
          dateRangeCount: daysCount,
          dailyAmount: baseDailyOpex,
          ratioPercentage: round2(opexRatioPercentage),
          opexPerTransactionAmount: Math.round(opexPerTransactionAmount),
          opexCoverageRatio: round2(opexCoverageRatio),
        },
        profitabilityIndex: round2(profitabilityIndex),
        cups: {
          total: totalCups,
          coffee: coffeeCups,
          nonCoffee: nonCoffeeCups,
          arcpAmount, // Rata-rata pendapatan per item
          avgGrossCupAmount: avgGrossItemAmount,
          cupsPerTransaction: round2(cupsPerTransaction),
          avgNetCupRevenuesAmount: avgNetItemAmount,
        },
        marginPercentages: {
          cogsMargin: round2(cogsMargin),
          grossMargin: round2(grossMargin),
          netMargin: round2(netMargin),
          isNetProfitable: netProfit > 0,
        },
        snacks,
        categorySales,
        transactionMetrics: {
          avgTransactionValue,
          avgRevenuePerDay,
          avgTransactionsPerDay,
          avgRevPerDay: avgRevenuePerDay,
        },
        bestSellers: row.bestSellers || [],
        performances: {
          users: row.userPerformances || [],
        },
        stockAlerts: row.stockAlerts || [],
        breakEvenRevenue: {
          targetAmount: round2(targetBEPRevenue),
          actualVsTargetPercentage: round2(actualVsTargetPercentage),
          targetTransactionsCount,
          targetItemsCount,
          excessRevenueAmount: round2(excessRevenueAmount),
          excessRevenuePercentage: round2(excessRevenuePercentage),
          isProfitable: totalRevenue >= targetBEPRevenue && totalRevenue > 0,
        },
        efficiencySummary: {
          bepCoverageRatio,
          opexEfficiencyRatio,
        },
        filter: {
          startDate: startDateStr,
          endDate: endDateStr,
          daysCount,
        },
        debug: {
          todayStr,
        },
      };
    } catch (error) {
      console.error('Error fetching refactored summary dashboard:', error);
      throw new InternalServerErrorException(
        'Gagal mengambil data summary dashboard',
      );
    }
  }
}
