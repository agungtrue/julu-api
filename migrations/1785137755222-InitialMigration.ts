import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1785137755222 implements MigrationInterface {
  name = 'InitialMigration1785137755222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7346b08032078107fce81e014f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7346b08032078107fce81e014f" ON "users" ("tenantId", "email") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7346b08032078107fce81e014f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7346b08032078107fce81e014f" ON "users" ("email", "tenantId") `,
    );
  }
}
