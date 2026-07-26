import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784820784196 implements MigrationInterface {
  name = 'InitialMigration1784820784196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."subscription_plans_cycle_enum" RENAME TO "subscription_plans_cycle_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_cycle_enum" AS ENUM('TRIAL', 'DAILY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'YEARLY', 'CUSTOM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "cycle" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "cycle" TYPE "public"."subscription_plans_cycle_enum" USING "cycle"::"text"::"public"."subscription_plans_cycle_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "cycle" SET DEFAULT 'MONTHLY'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_cycle_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_cycle_enum_old" AS ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'YEARLY', 'CUSTOM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "cycle" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "cycle" TYPE "public"."subscription_plans_cycle_enum_old" USING "cycle"::"text"::"public"."subscription_plans_cycle_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "cycle" SET DEFAULT 'MONTHLY'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_cycle_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."subscription_plans_cycle_enum_old" RENAME TO "subscription_plans_cycle_enum"`,
    );
  }
}
