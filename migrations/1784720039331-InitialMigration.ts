import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784720039331 implements MigrationInterface {
  name = 'InitialMigration1784720039331';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" ADD "planId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" ADD CONSTRAINT "FK_a07eeedde68dafcc91d551ba4b5" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" DROP CONSTRAINT "FK_a07eeedde68dafcc91d551ba4b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" DROP COLUMN "planId"`,
    );
  }
}
