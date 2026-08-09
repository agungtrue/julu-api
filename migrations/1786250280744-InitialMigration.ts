import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1786250280744 implements MigrationInterface {
  name = 'InitialMigration1786250280744';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" DROP COLUMN "cost_per_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ADD "cost_per_unit" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" DROP COLUMN "totalCost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ADD "totalCost" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ADD CONSTRAINT "FK_ec0e6df05c197bd09f1be5f0ebc" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" DROP CONSTRAINT "FK_ec0e6df05c197bd09f1be5f0ebc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" DROP COLUMN "totalCost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ADD "totalCost" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" DROP COLUMN "cost_per_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ADD "cost_per_unit" bigint NOT NULL DEFAULT '0'`,
    );
  }
}
