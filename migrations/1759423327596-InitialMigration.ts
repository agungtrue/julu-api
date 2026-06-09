import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1759423327596 implements MigrationInterface {
    name = 'InitialMigration1759423327596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" ADD "maxItem" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "maxItem"`);
    }

}
