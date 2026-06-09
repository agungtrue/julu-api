import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1758093487318 implements MigrationInterface {
    name = 'InitialMigration1758093487318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
    }

}
