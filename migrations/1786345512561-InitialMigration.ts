import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1786345512561 implements MigrationInterface {
  name = 'InitialMigration1786345512561';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "metadata" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "metadata"`);
  }
}
