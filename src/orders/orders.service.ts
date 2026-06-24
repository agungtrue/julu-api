import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './orders.entity';
import { OrderItem } from 'src/order_items/order_items.entity';
import { Product } from 'src/products/products.entity';
import { Promotion } from 'src/promotions/promotions.entity';
import { StatusType } from './enums/status.enum';
import { response } from '../utils/response';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Promotion) private promotionRepo: Repository<Promotion>,
    private dataSource: DataSource,
  ) {}

  async create(data: Partial<Order>) {
    // static handler on new branch
    const customUserId = '07f59d84-d642-4913-a28d-85e2161e70f1';
    // @ts-ignore
    if (data.userId === customUserId) {
      data.userId = customUserId;
      data.outletId = 2;
    }

    const order = this.orderRepo.create(data);
    return this.orderRepo.save(order);
  }

  async validate(uuid: any) {
    const order = await this.orderRepo.findOne({
      where: {
        uuid,
        status: StatusType.INIT,
      },
    });

    return !!order;
  }

  async confirm(data: any) {
    const { uuid, items } = data;

    return await this.dataSource.transaction(async (manager) => {
      let existingOrder = await manager.findOne(Order, {
        where: { uuid },
      });

      let calculatedTotal = 0;
      let totalAppliedPromoCount = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        const product = await manager.findOneOrFail(Product, {
          where: { id: item.product_id },
        });
        const subTotal = product.price * item.qty;
        calculatedTotal += subTotal;

        // console.log({ existingOrder: JSON.stringify(existingOrder), item })

        // default is normal
        let adjustedPrice = product.price;
        let appliedPromoCount = 0;

        if (item.hasPromo) {
          // later make a guard for quota check
          const promo = await manager.findOneOrFail(Promotion, {
            where: { id: existingOrder.promoId },
          });
          let maxItem = item.qty <= promo.maxItem ? item.qty : promo.maxItem;

          if (promo.type === 'free') {
            // console.log({ promo, maxItem, item })

            // first check
            if (item.qty > maxItem) {
              throw new HttpException(
                `Promo has exceeded, Expected ${promo.maxItem} promo, but got ${item.qty}!`,
                HttpStatus.BAD_REQUEST,
              );
            }

            adjustedPrice = promo.value;
            appliedPromoCount = maxItem;
          } else if (promo.type === 'discount') {
            // console.log({ promo, maxItem, item })
            maxItem = item.dcAmount / promo.value;
            // console.log('after...', { promo, maxItem, item })

            adjustedPrice = subTotal - promo.value * maxItem;
            appliedPromoCount = maxItem;

            totalAppliedPromoCount += appliedPromoCount;

            // check limit
            if (totalAppliedPromoCount > promo.maxItem) {
              throw new HttpException(
                `Promo has exceeded, Expected ${promo.maxItem} promo, but got ${totalAppliedPromoCount}!`,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
        }

        const payload = {
          qty: item.qty,
          order: existingOrder,
          product,
          price: product.price,
          adjustedPrice,
          subtotal: subTotal,
          hasPromo: !!item.hasPromo,
          appliedPromoCount,
        };

        // console.log({ payload })
        orderItems.push(manager.create(OrderItem, payload));
      }

      if (existingOrder.total !== calculatedTotal) {
        throw new HttpException(
          `Order total mismatch. Expected ${existingOrder.total}, but got ${calculatedTotal}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // return {testing: true}

      await manager.save(orderItems);

      existingOrder.status = StatusType.CONFIRMED;
      return await manager.save(existingOrder);
    });
  }

  async findAll(search: any, req: any, status: any) {
    const outletId = req.user.outletId;

    const page = 1;
    const limit = 100;
    const skip = (page - 1) * limit;
    const query = this.orderRepo
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('orders.customer', 'customer')
      .leftJoinAndSelect('orders.user', 'user')
      .leftJoinAndSelect('orders.outlet', 'outlet')
      .select([
        'orders.id',
        'orders.total',
        'orders.createdAt',
        'orders.status',
        'orders.payment_method',
        'items.qty',
        'items.price',
        'items.subtotal',
        'items.hasPromo',
        'items.adjustedPrice',
        'product.name',
        'product.type',
        'product.size',
        'customer.first_name',
        'customer.last_name',
        'customer.phone',
        'user.name',
        'outlet.name',
        'outlet.branch',
      ])
      .addSelect(
        `orders.createdAt AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'`,
        'createdAtJakarta',
      )
      .orderBy('orders.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    // day js
    dayjs.extend(utc);
    dayjs.extend(timezone);

    if (search === 'today') {
      const startDate: Dayjs = dayjs().tz('Asia/Jakarta').startOf('day').utc();
      const endDate: Dayjs = dayjs().tz('Asia/Jakarta').endOf('day').utc();

      query
        .where('orders.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .andWhere('orders.outlet = :outletId', { outletId });
    } else if (search) {
      query.where(
        'customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR orders.status::text ILIKE :search',
        { search: `%${search}%` },
      );
    }

    // switch (query.search) {
    //   case 'currentMonth':
    //     start = dayjs().tz('Asia/Jakarta').startOf('month').format();
    //     end = dayjs().tz('Asia/Jakarta').endOf('month').format();
    //     break;

    //   case 'today':
    //     start = dayjs().tz('Asia/Jakarta').startOf('day').format();
    //     end = dayjs().tz('Asia/Jakarta').endOf('day').format();
    //     break;

    //   default:
    //     if (query.startDate && query.endDate) {
    //       start = dayjs(query.startDate).tz('Asia/Jakarta').startOf('day').format();
    //       end = dayjs(query.endDate).tz('Asia/Jakarta').endOf('day').format();
    //     } else if (query.startDate) {
    //       start = dayjs(query.startDate).tz('Asia/Jakarta').startOf('day').format();
    //       end = dayjs(query.startDate).tz('Asia/Jakarta').endOf('day').format();
    //     } else {
    //       // Default to today
    //       start = dayjs().tz('Asia/Jakarta').startOf('day').format();
    //       end = dayjs().tz('Asia/Jakarta').endOf('day').format();
    //     }
    // }

    const mapPayload = (payload) => {
      // so far handling adjustedPrice on order detail
      let itemPrice = payload.total;

      if (
        payload.items.some((data) => data.hasPromo && data.adjustedPrice === 0)
      ) {
        itemPrice = payload.items.reduce((acc, curr) => {
          return acc + curr.adjustedPrice * curr.qty;
        }, 0);
      } else if (payload.items.some((data) => data.hasPromo)) {
        itemPrice = payload.items.reduce((acc, curr) => {
          return acc + curr.adjustedPrice;
        }, 0);
      }

      const totalAdjustedPrice = itemPrice;
      payload.totalAdjustedPrice = totalAdjustedPrice;

      return payload;
    };

    const orders = await query.getMany();
    const result = orders.map((order) =>
      mapPayload({
        ...order,
        createdAt: dayjs(order.createdAt).tz('Asia/Jakarta').format(),
      }),
    );

    return response(200, 'OK', result);
  }

  async getSummary(startDateParam: any, endDateParam: any, all: any, req: any) {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    // let startDate = dayjs().tz('Asia/Jakarta').startOf('day').toDate();
    // let endDate = dayjs().tz('Asia/Jakarta').endOf('day').toDate();

    let startDate: Dayjs = dayjs().tz('Asia/Jakarta').startOf('day').utc();
    let endDate: Dayjs = dayjs().tz('Asia/Jakarta').endOf('day').utc();
    let dayDiff = 1;
    const status = 'confirmed';
    const outletId = req.user.outletId;

    // so far commonOpex dibagi 2 cabang (based on total cabang)
    const commonOpex = {
      gopaySpeker: 1000,
      gasElpiji: 734,
      galonWater: 500,
      galonWaterCleo: 1667,
      tissue: 750,
      plasticTrash: 500,
      floorCleaner: 650,
      cookingOil: 1334,
      domain: 556,
      systemFee: 7500, // vps & db
    };

    const operational01 = {
      // employee: 33400,
      employee: 80000, // new
      managerialFee: 120000,
      propertyRent: 70000, // vamos
      propertyRent2: 40000, // buffer for pay a rent full on next contract
      prepaidElectricityToken1: 3500,
      prepaidElectricityToken2: 0,
      wifi: 0,
      lostIceCalculated: 0,
      bazar01: 0,
      ...commonOpex,
    };
    const operational02 = {
      // employee: 27000,
      employee: 30000,
      managerialFee: 30000,
      propertyRent: 0,
      propertyRent2: 0,
      prepaidElectricityToken1: 0,
      prepaidElectricityToken2: 0,
      wifi: 0,
      lostIceCalculated: 3000,
      bazar01: 3000,
      ...commonOpex,
    };

    let operational = {
      // later on can add more payload data, based on a day operational
      ...operational01,
    };

    // to track fee staff for better saving from revenue
    const feeStaff01 = {
      staff: operational01.employee,
      managerial: operational01.managerialFee,
    };

    const feeStaff02 = {
      staff: operational02.employee,
      managerial: operational02.managerialFee,
    };

    let feeStaff = {
      ...feeStaff01,
    };

    // static handler on new branch, later on based on client payload
    const customUserId = '07f59d84-d642-4913-a28d-85e2161e70f1';
    // @ts-ignore
    if (req.user.id === customUserId) {
      operational = {
        ...operational02,
      };

      feeStaff = {
        ...feeStaff02,
      };
    }

    // console.log({ user: req.user, operational })

    if (startDateParam && endDateParam) {
      startDate = dayjs.tz(startDateParam, 'Asia/Jakarta').startOf('day').utc();
      endDate = dayjs.tz(endDateParam, 'Asia/Jakarta').endOf('day').utc();
      dayDiff = endDate.diff(startDate, 'day') + 1;
    }

    // make generic date, for report purpose
    // const resultx = await this.orderRepo
    // .createQueryBuilder('orders')
    // .leftJoin('orders.items', 'items')
    // .leftJoin('items.product', 'product')
    // .select('COUNT(DISTINCT orders.id)', 'transactions')
    // .addSelect('COALESCE(SUM(items.subtotal), 0)', 'revenues')
    // .addSelect('COALESCE(SUM(items.subtotal) - SUM(product.cogs * items.qty), 0)', 'grossIncomes')
    // .addSelect(`COALESCE(SUM(CASE WHEN product.type IN ('coffee','non_coffee') THEN items.qty ELSE 0 END), 0)`, 'cups')
    // .addSelect(`COALESCE(SUM(CASE WHEN product.type = 'snacks' THEN items.qty ELSE 0 END), 0)`, 'snacks')
    // .where('orders.createdAt BETWEEN :start AND :end', {
    //   start: startDate.toDate(),
    //   end: endDate.toDate(),
    // })
    // .andWhere('orders.status = :status', { status })
    // .getRawOne();

    // manual count at code level
    const query = this.orderRepo
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('orders.promo', 'promo')
      .leftJoinAndSelect('orders.user', 'users')
      .leftJoinAndSelect('orders.outlet', 'outlet')
      .where('orders.createdAt BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .andWhere('orders.status = :status', { status })
      .select([
        'orders.id',
        'orders.total',
        'orders.createdAt',
        'orders.status',
        'orders.payment_method',
        'items.qty',
        'items.hasPromo',
        'items.price',
        'items.adjustedPrice',
        'items.appliedPromoCount',
        'items.subtotal',
        'product.id',
        'product.name',
        'product.type',
        'product.size',
        'product.cogs',
        'promo.type',
        'promo.maxItem',
        'promo.code',
        'users.id',
        'users.name',
      ]);

    if (!all) {
      query.andWhere('orders.outlet = :outletId', { outletId });
    } else {
      const allOpex = this.sumOperationalCosts([operational01, operational02]);
      operational = allOpex;

      const allFeePassed = this.sumOperationalCosts([feeStaff01, feeStaff02]);
      feeStaff = allFeePassed;
    }

    const orders = await query.getMany();
    const allItems = orders.flatMap((o) => o.items);

    const qrisPayment = orders?.filter(
      (order) => order?.payment_method === 'qris',
    ).length;

    const cashPayment = orders?.filter(
      (order) => order?.payment_method === 'cash',
    ).length;

    // cash and qris amount
    const cashAmount = orders
      ?.filter((order) => order?.payment_method === 'cash')
      .reduce((acc, curr) => {
        const totalAdjustedPrice = curr.items.reduce((itemAcc, itemCurr) => {
          let total = itemCurr.subtotal;

          if (itemCurr.hasPromo && itemCurr.adjustedPrice === 0) {
            total = itemCurr.adjustedPrice * itemCurr.qty;
          } else if (itemCurr.hasPromo) {
            total = itemCurr.adjustedPrice;
          }

          return itemAcc + total;
        }, 0);

        return acc + totalAdjustedPrice;
      }, 0);

    const qrisAmount = orders
      ?.filter((order) => order?.payment_method === 'qris')
      .reduce((acc, curr) => {
        const totalAdjustedPrice = curr.items.reduce((itemAcc, itemCurr) => {
          let total = itemCurr.subtotal;

          if (itemCurr.hasPromo && itemCurr.adjustedPrice === 0) {
            total = itemCurr.adjustedPrice * itemCurr.qty;
          } else if (itemCurr.hasPromo) {
            total = itemCurr.adjustedPrice;
          }

          return itemAcc + total;
        }, 0);

        return acc + totalAdjustedPrice;
      }, 0);

    // later on make constant data
    const promoCode = {
      B2G1: 'B2G1',
      DC2K: 'DC2K',
      DC3K: 'DC3K',
    };

    // later get by promo service
    const promoList = await this.promotionRepo
      .createQueryBuilder('promotions')
      .select(['promotions.code', 'promotions.quota'])
      .getMany();

    const promoB2G1 = promoList?.find((data) => data.code === promoCode.B2G1);
    const promoDC2K = promoList?.find((data) => data.code === promoCode.DC2K);
    const promoDC3K = promoList?.find((data) => data.code === promoCode.DC3K);

    const promoDiscount = orders
      .flatMap((o) => o.items)
      ?.filter((item) => item?.hasPromo && item.adjustedPrice !== 0)
      ?.reduce((acc, curr) => acc + curr.appliedPromoCount, 0);

    const promoDiscount2k = orders?.reduce((acc, curr) => {
      const promo = curr.promo;
      const items = curr.items
        .filter((item) => item?.hasPromo && promo.code === promoCode.DC2K)
        ?.reduce((acc, curr) => acc + curr.appliedPromoCount, 0);

      return acc + items;
    }, 0);

    const promoDiscount3k = orders?.reduce((acc, curr) => {
      const promo = curr.promo;
      const items = curr.items
        .filter((item) => item?.hasPromo && promo.code === promoCode.DC3K)
        ?.reduce((acc, curr) => acc + curr.appliedPromoCount, 0);

      return acc + items;
    }, 0);

    const promoFree = orders
      .flatMap((o) => o.promo)
      ?.filter((promo) => promo?.type === 'free').length;

    const discountAmount = orders.reduce((acc, curr) => {
      const promo = curr.promo;
      const allItems = curr.items.filter((item) => item.hasPromo);

      if (allItems?.length) {
        const itemDiscount = allItems.reduce((acc1, curr1) => {
          if (promo.type === 'discount') {
            acc1 += curr1.subtotal - curr1.adjustedPrice;
          }

          return acc1;
        }, 0);

        return acc + itemDiscount;
      }
      return acc;
    }, 0);

    const freeAmount = orders.reduce((acc, curr) => {
      const promo = curr.promo;
      const allItems = curr.items.filter((item) => item.hasPromo);

      if (allItems?.length) {
        const itemDiscount = allItems.reduce((acc1, curr1) => {
          if (promo.type === 'free') {
            // acc1 += (curr1.subtotal - (curr1.adjustedPrice * promo.maxItem))
            acc1 += curr1.product.cogs;
          }

          return acc1;
        }, 0);

        return acc + itemDiscount;
      }
      return acc;
    }, 0);

    // refactor code
    const totalDiscountAmount = discountAmount + freeAmount;
    const totalCOGS = allItems.reduce(
      (acc, curr) => acc + curr.product.cogs * curr.qty,
      0,
    );
    const operationalAmout = Object.values(operational).reduce(
      (acc, curr) => acc + curr,
      0,
    );

    const feeStaffAmout = Object.values(feeStaff).reduce(
      (acc, curr) => acc + curr,
      0,
    );

    const freeItemAmount = orders.reduce((acc, curr) => {
      const isFree = curr.items.find(
        (data) => data.adjustedPrice === 0 && data.hasPromo,
      );
      if (isFree) {
        acc += isFree.price;
      }
      return acc;
    }, 0);
    const grossRevenues = orders.reduce((acc, curr) => acc + curr.total, 0);
    const revenues = grossRevenues - freeItemAmount - discountAmount;
    const grossIncomes = revenues - totalCOGS;
    const netIncomes = grossIncomes - operationalAmout * dayDiff;

    // console.log({ grossRevenues, freeItemAmount, discountAmount })

    const cups = allItems.filter((item) =>
      ['coffee', 'non_coffee'].includes(item.product.type),
    );

    const totalCups = cups.reduce((acc, curr) => acc + curr.qty, 0);

    const totalCoffee = cups
      .filter((item) => item.product.type === 'coffee')
      .reduce((acc, curr) => acc + curr.qty, 0);

    const totalNonCoffee = cups
      .filter((item) => item.product.type === 'non_coffee')
      .reduce((acc, curr) => acc + curr.qty, 0);

    const snacks = allItems
      .filter((item) => item.product.type === 'snacks')
      .reduce((acc, curr) => acc + curr.qty, 0);

    const itemsPerUsers = orders.reduce((acc, curr) => {
      const key = curr.user.id;

      if (!acc[key]) {
        acc[key] = {
          transactions: 0,
          name: curr.user.name,
          items: {
            cups: 0,
            snacks: 0,
          },
        };
      }

      const itemCups = curr.items.reduce((acc1, curr1) => {
        if (['coffee', 'non_coffee'].includes(curr1.product.type)) {
          acc1 += curr1.qty;
        }

        return acc1;
      }, 0);

      const itemSnacks = curr.items.reduce((acc1, curr1) => {
        if (['snacks'].includes(curr1.product.type)) {
          acc1 += curr1.qty;
        }

        return acc1;
      }, 0);

      acc[key].transactions += 1;
      acc[key].items.cups += itemCups;
      acc[key].items.snacks += itemSnacks;

      return acc;
    }, {});

    interface BestSellerItem {
      name: string;
      count: number;
      percentage: number;
    }

    const bestSellers: Record<number, BestSellerItem> = allItems.reduce(
      (acc, curr) => {
        const key = curr.product.id;

        if (!acc[key]) {
          acc[key] = {
            name: `${curr.product.name} ${curr.product.size}`,
            count: 0,
            percentage: 0,
          };
        }

        acc[key].count += curr.qty;
        acc[key].percentage += (curr.qty / (totalCups + snacks)) * 100;

        return acc;
      },
      {} as Record<number, BestSellerItem>,
    );

    // sort the count
    let sortBestSellers: BestSellerItem[] = Object.values(bestSellers);
    sortBestSellers = sortBestSellers.sort((a, b) => b.count - a.count);

    // later make a constant/var for reusable number/var
    const result = {
      transactions: orders.length,
      revenues,
      // revenuesConsistencyIndex
      grossIncomes,
      breakEvenRevenue: {
        targetAmount:
          (operationalAmout * dayDiff) /
          (((grossIncomes / revenues) * 100) / 100),
        actualVsTargetPercentage:
          (revenues /
            ((operationalAmout * dayDiff) /
              (((grossIncomes / revenues) * 100) / 100))) *
          100,
        targetCupsCount:
          (operationalAmout * dayDiff) /
          (((grossIncomes / revenues) * 100) / 100) /
          (revenues / totalCups),
        excessRevenueAmount:
          revenues -
          (operationalAmout * dayDiff) /
            (((grossIncomes / revenues) * 100) / 100),
        excessRevenuePercentage:
          (revenues /
            ((operationalAmout * dayDiff) /
              (((grossIncomes / revenues) * 100) / 100))) *
            100 -
          100,
        isProfitable:
          revenues -
            (operationalAmout * dayDiff) /
              (((grossIncomes / revenues) * 100) / 100) >
          0,
      },
      efficiencySummary: {
        bepCoverageRatio:
          revenues /
          ((operationalAmout * dayDiff) /
            (((grossIncomes / revenues) * 100) / 100)),
        opexEfficiencyRatio: grossIncomes / (operationalAmout * dayDiff),
      },
      opex: {
        dateRangeCount: dayDiff,
        dailyAmount: operationalAmout * dayDiff, // calculate by dayDiff
        ratioPercentage: ((operationalAmout * dayDiff) / revenues) * 100,
        opexPerTransactionAmount: (operationalAmout * dayDiff) / orders.length,
        opexCoverageRatio: (revenues / (operationalAmout * dayDiff)) * 100,
      },
      netIncomes,
      marginPercentages: {
        cogsMargin: 100 - (grossIncomes / revenues) * 100,
        grossMargin: (grossIncomes / revenues) * 100,
        netMargin: (netIncomes / revenues) * 100,
        isNetProfitable:
          revenues -
            (operationalAmout * dayDiff) /
              (((grossIncomes / revenues) * 100) / 100) && netIncomes > 0,
      },
      profitabilityIndex: (netIncomes / (operationalAmout * dayDiff)) * 100,
      cups: {
        total: totalCups,
        coffee: totalCoffee,
        nonCoffee: totalNonCoffee,
        arcpAmount: revenues / totalCups,
        avgGrossCupAmount: grossIncomes / totalCups,
        cupsPerTransaction: totalCups / orders.length,
        avgNetCupRevenuesAmount: netIncomes / totalCups,
        profitabilityIndex:
          (netIncomes / totalCups / (grossIncomes / totalCups)) * 100,
      },
      snacks,
      promo: {
        totalUsedAmount: totalDiscountAmount,
        components: {
          totalUsedDiscountCount: promoDiscount,
          usedDiscount2kCount: promoDiscount2k,
          usedDiscount3kCount: promoDiscount3k,
          usedFreeCount: promoFree,

          // new
          DC2K: {
            quota: (promoDC2K?.quota || 0) * dayDiff,
            used: promoDiscount2k,
          },
          DC3K: {
            quota: (promoDC3K?.quota || 0) * dayDiff,
            used: promoDiscount3k,
          },
          B2G1: {
            quota: (promoB2G1?.quota || 0) * dayDiff,
            used: promoFree,
          },
        },
        marketingCostRatio: (totalDiscountAmount / revenues) * 100,
      },
      paymentMethods: {
        qrisCount: qrisPayment,
        cashCount: cashPayment,
        amounts: {
          qris: qrisAmount,
          cash: cashAmount,
        },
      },
      performances: {
        users: Object.values(itemsPerUsers),
      },
      feePassed: {
        staff: feeStaffAmout * dayDiff,
        cup: 0,
        domain: 0,
      },
      bestSellers: sortBestSellers,
      transactionMetrics: {
        avgTransactionValue: revenues / orders.length, // revenues / transactions
        avgRevenuePerDay: revenues / dayDiff, // revenues / dateRangeCount
        avgTransactionsPerDay: orders.length / dayDiff,
        avgRevPerDay: revenues / dayDiff,
      },
      // debug: allItems,
      // dbLevel: resultx
    };

    return response(200, 'OK', [result]);
  }

  async applyPromo(payload: any) {
    return await this.dataSource.transaction(async (manager) => {
      const promo = await manager.findOneOrFail(Promotion, {
        where: { id: payload.promoId },
      });
      let results = [];

      // console.log({ promo });

      if (promo.code === 'B2G1') {
        results = await this.getB2G1Promo(payload.items, promo);
      } else if (
        ['DC1K', 'DC2K', 'DC3K', 'DC5K', 'DC8K', 'DC1SHT'].includes(promo.code)
      ) {
        results = await this.getDCXKPromo(payload.items, promo);
      }

      return {
        data: results,
      };
    });
  }

  async getB2G1Promo(items: any, promo) {
    const guard = items.reduce((acc, curr) => acc + curr.qty, 0);

    if (guard <= 2) {
      throw new HttpException(
        `QTY is mismatch. Expected more than 2, but got ${guard}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let results = [];
    return await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const product = await manager.findOneOrFail(Product, {
          where: { id: item.product_id },
        });
        item.detail = product;

        if (item.qty > 1) {
          const fillValue = 1;
          const result1 = Array.from({ length: item.qty }, () => fillValue);

          const filtered = result1.map((data) => {
            item.qty = fillValue;
            data = item;
            return data;
          });

          results.push(...filtered);
        } else {
          results.push(item);
        }
      }

      // check only regular and large
      // if (results.some(data => {
      //   console.log({ data })
      //   return data.detail.size === 'small'
      // })) {
      //   throw new HttpException(
      //     'Invalid Size: Promo is valid for Regular and Large sizes only.',
      //     HttpStatus.BAD_REQUEST
      //   )
      // }

      // sort based lowest price
      results = results.sort(
        (a, b) => parseInt(a.detail.price) - parseInt(b.detail.price),
      );

      // apply for lowest price
      results = results.map((data, index) => {
        const newItem = { ...data };

        // so far has static check
        if (index === 0) {
          newItem.hasPromo = true;
          newItem.adjusted = {
            price: 0,
            label: 'this item is FREE!',
          };
        }
        return newItem;
      });

      // mergeDuplicateItems
      const copyPromo = JSON.parse(JSON.stringify(results));
      const promoItem = copyPromo.find((item) => item.hasPromo === true);
      const nonPromoItems = copyPromo.filter((item) => !item.hasPromo);

      // console.log({ promoItem, nonPromoItems })

      const mergedItemsMap = nonPromoItems.reduce((acc, item) => {
        const key = item.product_id;

        if (!acc[key]) {
          acc[key] = { ...item };
        } else {
          const newItem = { ...item };
          acc[key].qty += newItem.qty;
          acc[key].detail.price += newItem.detail.price;
        }

        return acc;
      }, {});

      const finalMergedArray = Object.values(mergedItemsMap);

      if (promoItem) {
        finalMergedArray.unshift(promoItem);
        results = finalMergedArray;
      }

      return results;
    });
  }

  async getDCXKPromo(items: any, promo: any) {
    let results = [];
    return await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const product = await manager.findOneOrFail(Product, {
          where: { id: item.product_id },
        });
        item.detail = product;
        results.push(item);
      }

      // check only regular and large
      if (results.some((data) => data.detail.size === 'small')) {
        throw new HttpException(
          'Invalid Size: Promo is valid for Regular and Large sizes only.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // sort based lowest price
      results = results.sort(
        (a, b) => parseInt(a.detail.price) - parseInt(b.detail.price),
      );

      // check if there is qty more than 1
      const isOrderMin2Cup = results.filter((data) => data.qty > 1);
      let isOrderMin2CupsEachItemIs1 = false;

      if (isOrderMin2Cup?.length) {
        const isOrder1Cup = results.filter((data) => data.qty === 1);

        results = [...isOrderMin2Cup, ...isOrder1Cup];
      } else if (
        results.length > 1 &&
        results.every((data) => data.qty === 1)
      ) {
        isOrderMin2CupsEachItemIs1 = true;
      }

      // apply for lowest price
      results = results.map((data, index) => {
        const newItem = { ...data };

        // so far has static check
        if (index === 0) {
          const price = parseInt(newItem.detail.price) * parseInt(newItem.qty);
          let discount = parseInt(promo.value) * parseInt(newItem.qty);

          if (isOrderMin2CupsEachItemIs1 || newItem.qty > promo.maxItem) {
            discount = parseInt(promo.value) * parseInt(promo.maxItem);
          }

          newItem.hasPromo = true;
          newItem.detail.price = price;
          newItem.adjusted = {
            price: price - discount,
            discount,
            label: `this item DC ${String(discount)[0]}K!`,
          };
        } else {
          const price = parseInt(newItem.detail.price) * parseInt(newItem.qty);
          newItem.detail.price = price;
        }
        return newItem;
      });

      // mergeDuplicateItems
      const copyPromo = JSON.parse(JSON.stringify(results));
      const promoItems = copyPromo.filter((item) => item.hasPromo === true);
      const nonPromoItems = copyPromo.filter((item) => !item.hasPromo);
      // console.log({ promoItem, nonPromoItems })

      const mergedItemsMap = nonPromoItems.reduce((acc, item) => {
        const key = item.product_id;

        if (!acc[key]) {
          acc[key] = { ...item };
        } else {
          const newItem = { ...item };
          acc[key].qty += newItem.qty;
          acc[key].detail.price += newItem.detail.price;
        }

        return acc;
      }, {});

      const finalMergedArray = Object.values(mergedItemsMap);

      if (promoItems?.length) {
        results = [...promoItems, ...finalMergedArray];
      }

      return results;
    });
  }

  sumOperationalCosts(operationalCosts: any) {
    if (!operationalCosts || operationalCosts.length === 0) {
      return {};
    }
    return operationalCosts.reduce((acc, curr) => {
      for (const key of Object.keys(curr)) {
        acc[key] = (acc[key] || 0) + curr[key];
      }

      return acc;
    }, {});
  }
}
