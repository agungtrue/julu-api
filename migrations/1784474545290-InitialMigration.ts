import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784474545290 implements MigrationInterface {
  name = 'InitialMigration1784474545290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."opex_category_enum" AS ENUM('UTILITIES', 'SALARY', 'RENT', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'OTHERS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."opex_type_enum" AS ENUM('FIXED', 'ONE_TIME')`,
    );
    await queryRunner.query(
      `CREATE TABLE "opex" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "title" character varying(150) NOT NULL, "category" "public"."opex_category_enum" NOT NULL DEFAULT 'OTHERS', "amount" integer NOT NULL DEFAULT '0', "expense_date" TIMESTAMP NOT NULL DEFAULT now(), "notes" text, "createdById" uuid, "type" "public"."opex_type_enum" NOT NULL DEFAULT 'ONE_TIME', "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8199bf0f6a189d56fda0c87787a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3e945b8739c51fd7307ca6a67" ON "opex" ("tenantId", "expense_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64c8191cd0af8a7be2e63e8421" ON "opex" ("tenantId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "opex" ADD CONSTRAINT "FK_64c8191cd0af8a7be2e63e8421b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "opex" ADD CONSTRAINT "FK_52232d658bac94c141b0c1fc845" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opex" DROP CONSTRAINT "FK_52232d658bac94c141b0c1fc845"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opex" DROP CONSTRAINT "FK_64c8191cd0af8a7be2e63e8421b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64c8191cd0af8a7be2e63e8421"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3e945b8739c51fd7307ca6a67"`,
    );
    await queryRunner.query(`DROP TABLE "opex"`);
    await queryRunner.query(`DROP TYPE "public"."opex_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."opex_category_enum"`);
  }
}
