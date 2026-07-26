import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1785089846520 implements MigrationInterface {
  name = 'InitialMigration1785089846520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "mustChangePassword" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "mustChangePassword"`,
    );
  }
}
