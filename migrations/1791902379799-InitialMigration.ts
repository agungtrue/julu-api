import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1791902379799 implements MigrationInterface {
  name = 'InitialMigration1791902379799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "operating_days" integer array NOT NULL DEFAULT '{1,2,3,4,5,6,0}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "operating_days"`,
    );
  }
}
