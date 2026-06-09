import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1757423030174 implements MigrationInterface {
    name = 'InitialMigration1757423030174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "is_revoked" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "is_revoked"`);
    }

}
