import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1755335702904 implements MigrationInterface {
    name = 'InitialMigration1755335702904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_method" character varying NOT NULL DEFAULT 'cash'`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'init', 'payment_pending', 'confirmed')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "status" "public"."orders_status_enum" NOT NULL DEFAULT 'init'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "paymentMethod" character varying NOT NULL DEFAULT 'cash'`);
    }

}
