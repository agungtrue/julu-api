import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1785950771985 implements MigrationInterface {
  name = 'InitialMigration1785950771985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ingredient_mutations_type_enum" AS ENUM('RESTOCK_IN', 'USAGE_OUT', 'LOSS', 'ADJUSTMENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ingredient_mutations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "ingredientId" uuid NOT NULL, "type" "public"."ingredient_mutations_type_enum" NOT NULL, "quantity" numeric(12,2) NOT NULL, "previousStock" numeric(12,2) NOT NULL, "currentStock" numeric(12,2) NOT NULL, "cost_per_unit" bigint NOT NULL DEFAULT '0', "totalCost" bigint NOT NULL DEFAULT '0', "referenceId" character varying(100), "notes" text, "createdById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_07bd75acb4b68f7bd48be7f4fb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2986a411b88e81b1701152c645" ON "ingredient_mutations" ("tenantId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_965b31b79880d79ec101cfb9d9" ON "ingredient_mutations" ("tenantId", "ingredientId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ADD CONSTRAINT "FK_f492ca49bbc7404cb9b5cea4c16" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" DROP CONSTRAINT "FK_f492ca49bbc7404cb9b5cea4c16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_965b31b79880d79ec101cfb9d9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2986a411b88e81b1701152c645"`,
    );
    await queryRunner.query(`DROP TABLE "ingredient_mutations"`);
    await queryRunner.query(
      `DROP TYPE "public"."ingredient_mutations_type_enum"`,
    );
  }
}
