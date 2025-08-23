import { Body, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'
import { Order } from './orders.entity'
// import { Customer } from 'src/customers/customers.entity';
import { OrderItem } from 'src/order_items/order_items.entity';
import { Product } from 'src/products/products.entity';
import { StatusType } from './enums/status.enum';
import { response } from '../utils/response'

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
    private dataSource: DataSource
  ) {}

  async create(data: Partial<Order>) {
    const order = this.repo.create(data);
    return this.repo.save(order);
  }

  async validate(uuid: any) {
    const order = await this.repo.findOne({
      where: {
        uuid,
        status: StatusType.INIT,
      }
    });

    return !!order;
  }

  async confirm(data: any) {

    const { uuid, items } = data

    return await this.dataSource.transaction(async (manager) => {
      let existingOrder = await manager.findOne(Order, {
        where: { uuid },
      });

      if (!existingOrder) {
        throw new Error("Order not found!");
      }

      let calculatedTotal = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        const product = await manager.findOneOrFail(Product, { where: { id: item.product_id } });
        const subTotal = product.price * item.qty
        calculatedTotal += subTotal;

        const payload = {
          qty: item.qty,
          order: existingOrder,
          product,
          price: product.price,
          subtotal: subTotal
        }

        orderItems.push(manager.create(OrderItem, payload));
      }

      if (existingOrder.total !== calculatedTotal) {
        throw new Error(
          `Order total mismatch. Expected ${existingOrder.total}, but got ${calculatedTotal}`
        );
      }

      await manager.save(orderItems);

      existingOrder.status = StatusType.CONFIRMED
      return await manager.save(existingOrder);
    })
  }

  async findAll(search: any, status: any) {
    const query = this.repo.createQueryBuilder('orders')
    .leftJoinAndSelect('orders.items', 'items')
    .leftJoinAndSelect('items.product', 'product')
    .leftJoinAndSelect('orders.customer', 'customer')
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
      'product.name',
      'product.type',
      'product.size',
      'customer.first_name',
      'customer.last_name',
      'customer.phone',
      'outlet.name',
      'outlet.branch',
    ]);

    if (search) {
      query.where(
        'customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR orders.status::text ILIKE :search',
        { search: `%${search}%` },
      );
    }

    // if (status) {
    //   query.where(
    //     'order.status ILIKE :search',
    //     { search: `%${search}%` },
    //   );
    // }

    const result = await query.getMany();

    return response(200, 'OK', result)
  }
}
