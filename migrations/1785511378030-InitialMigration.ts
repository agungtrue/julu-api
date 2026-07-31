import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1785511378030 implements MigrationInterface {
  name = 'InitialMigration1785511378030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "note" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "invoiceNo" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "UQ_9db6621577f0ebac1d156badcf4" UNIQUE ("invoiceNo")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_ordertype_enum" AS ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "orderType" "public"."orders_ordertype_enum" NOT NULL DEFAULT 'DINE_IN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "paidAmount" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "changeAmount" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address" text`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "phone" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "receiptFooter" character varying(255) DEFAULT 'Terima kasih atas kunjungan Anda!'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "receiptFooter"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "changeAmount"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paidAmount"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "orderType"`);
    await queryRunner.query(`DROP TYPE "public"."orders_ordertype_enum"`);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "UQ_9db6621577f0ebac1d156badcf4"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "invoiceNo"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "note"`);
  }
}
