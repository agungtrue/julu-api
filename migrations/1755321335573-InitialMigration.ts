import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1755321335573 implements MigrationInterface {
    name = 'InitialMigration1755321335573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "first_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "last_name" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "name" character varying NOT NULL`);
    }

}
