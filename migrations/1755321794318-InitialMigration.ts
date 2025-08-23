import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1755321794318 implements MigrationInterface {
    name = 'InitialMigration1755321794318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "isActive" boolean NOT NULL DEFAULT true`);
    }

}
