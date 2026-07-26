import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784818661645 implements MigrationInterface {
  name = 'InitialMigration1784818661645';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "expiredAt"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "packageType"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "packageType" character varying(30) NOT NULL DEFAULT '1_MONTH'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "expiredAt" TIMESTAMP NOT NULL`,
    );
  }
}
