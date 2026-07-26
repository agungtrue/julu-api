import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784639531319 implements MigrationInterface {
  name = 'InitialMigration1784639531319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_cycle_enum" AS ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'YEARLY', 'CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "price" numeric(12,2) NOT NULL DEFAULT '0', "cycle" "public"."subscription_plans_cycle_enum" NOT NULL DEFAULT 'MONTHLY', "monthsCount" integer NOT NULL DEFAULT '1', "durationDays" integer NOT NULL DEFAULT '30', "features" jsonb, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "planId" uuid NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'TRIALING', "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "trialEndsAt" TIMESTAMP, "autoRenew" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a624398899f3b73f3c12f9955" ON "subscriptions" ("tenantId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_invoices_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_invoices_paymentmethod_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'QRIS', 'MIDTRANS')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying(50) NOT NULL, "tenantId" uuid NOT NULL, "subscriptionId" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."subscription_invoices_status_enum" NOT NULL DEFAULT 'PENDING', "paymentMethod" "public"."subscription_invoices_paymentmethod_enum" NOT NULL DEFAULT 'CASH', "paymentUrl" character varying(255), "paidAt" TIMESTAMP, "dueDate" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_175b54e075e19f701ed4546542d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_7050ae7d81f0f0207b8f1cd2efc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" ADD CONSTRAINT "FK_ae24b16ec4f236af1d40f35bf55" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" ADD CONSTRAINT "FK_9c3813f2a99935850b2f2210191" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" DROP CONSTRAINT "FK_9c3813f2a99935850b2f2210191"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_invoices" DROP CONSTRAINT "FK_ae24b16ec4f236af1d40f35bf55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_invoices"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_invoices_paymentmethod_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_invoices_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a624398899f3b73f3c12f9955"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_cycle_enum"`,
    );
  }
}
