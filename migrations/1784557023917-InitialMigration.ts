import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784557023917 implements MigrationInterface {
  name = 'InitialMigration1784557023917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingredients" ADD "stock" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredients" ADD "minimumStock" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingredients" DROP COLUMN "minimumStock"`,
    );
    await queryRunner.query(`ALTER TABLE "ingredients" DROP COLUMN "stock"`);
  }
}
