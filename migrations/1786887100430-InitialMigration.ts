import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1786887100430 implements MigrationInterface {
  name = 'InitialMigration1786887100430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2986a411b88e81b1701152c645"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f91b6f7abc50fc5e1af2b4ae3" ON "ingredient_mutations" ("tenantId", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f91b6f7abc50fc5e1af2b4ae3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2986a411b88e81b1701152c645" ON "ingredient_mutations" ("tenantId", "createdAt") `,
    );
  }
}
