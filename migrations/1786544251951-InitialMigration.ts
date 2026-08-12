import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1786544251951 implements MigrationInterface {
  name = 'InitialMigration1786544251951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ingredient_mutations_type_enum" RENAME TO "ingredient_mutations_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ingredient_mutations_type_enum" AS ENUM('RESTOCK_IN', 'USAGE_OUT', 'LOSS', 'ADJUSTMENT', 'CANCEL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ALTER COLUMN "type" TYPE "public"."ingredient_mutations_type_enum" USING "type"::"text"::"public"."ingredient_mutations_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ingredient_mutations_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ingredient_mutations_type_enum_old" AS ENUM('RESTOCK_IN', 'USAGE_OUT', 'LOSS', 'ADJUSTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredient_mutations" ALTER COLUMN "type" TYPE "public"."ingredient_mutations_type_enum_old" USING "type"::"text"::"public"."ingredient_mutations_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ingredient_mutations_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ingredient_mutations_type_enum_old" RENAME TO "ingredient_mutations_type_enum"`,
    );
  }
}
