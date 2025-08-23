import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1754988429998 implements MigrationInterface {
    name = 'InitialMigration1754988429998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "ubtotal"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "subtotal" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "price" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "price" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "subtotal"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "ubtotal" numeric(10,2) NOT NULL`);
    }

}
