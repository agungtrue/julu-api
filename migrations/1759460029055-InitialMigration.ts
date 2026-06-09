import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1759460029055 implements MigrationInterface {
    name = 'InitialMigration1759460029055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ADD "appliedPromoCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "appliedPromoCount"`);
    }

}
