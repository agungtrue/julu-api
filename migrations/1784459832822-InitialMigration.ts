import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784459832822 implements MigrationInterface {
  name = 'InitialMigration1784459832822';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "outlets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "branch" character varying NOT NULL, "address" character varying NOT NULL, "pic" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_4f218ad1778c5c01d7bf77bab02" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "subdomain" character varying(50) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "packageType" character varying(30) NOT NULL DEFAULT '1_MONTH', "daily_opex" integer NOT NULL DEFAULT '0', "expiredAt" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_21bb89e012fa5b58532009c1601" UNIQUE ("subdomain"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );

    // update defaultTenantId for special case
    const defaultTenantId = 'b5ef7f5a-0364-4db6-b50f-5fa08fe63bac';

    await queryRunner.query(`
        INSERT INTO "tenants" ("id", "name", "subdomain", "expiredAt") 
        VALUES ('${defaultTenantId}', 'Julu Coffee & Snacks', 'julu-pos', '2026-09-29 05:31:44.406655')
    `);
    // update tenant column

    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "phone" character varying NOT NULL, "tenantId" uuid, "isActive" boolean NOT NULL DEFAULT true, "role" character varying(20) NOT NULL DEFAULT 'EMPLOYEE', "last_login" TIMESTAMP, "pin" character varying(6), "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "outletId" uuid, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7346b08032078107fce81e014f" ON "users" ("tenantId", "email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_type" character varying NOT NULL, "refresh_token" text NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "customer_id" uuid, CONSTRAINT "UQ_068c1346f603dca1702fb893c01" UNIQUE ("refresh_token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying, "password_hash" character varying NOT NULL, "phone" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ingredients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "purchase_cost" numeric(12,2) NOT NULL DEFAULT '0', "conversion_factor" numeric(10,2) NOT NULL DEFAULT '1', "cost_per_unit" numeric(12,2) NOT NULL DEFAULT '0', "unit" character varying(20) NOT NULL DEFAULT 'GRAM', "tenantId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9240185c8a5507251c9f15e0649" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23d31ec333c1305523fc420c3b" ON "ingredients" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_ingredients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "qty_used" numeric(10,2) NOT NULL, "sub_total_cost" numeric(12,2) NOT NULL DEFAULT '0', "tenantId" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_82b8cf241e3716a8d4682e79190" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_53bfde6fd7f26082d763663366" ON "product_ingredients" ("tenantId", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_type_enum" AS ENUM('coffee', 'non_coffee', 'snacks', 'topping')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_size_enum" AS ENUM('small', 'regular', 'large')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "price" integer NOT NULL, "type" "public"."products_type_enum" NOT NULL, "size" "public"."products_size_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "cogs" integer, "tenantId" uuid NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6739a1757449f723ff6ae692e7" ON "products" ("tenantId", "id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6804855ba1a19523ea57e0769b" ON "products" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "qty" integer NOT NULL, "price" integer NOT NULL, "adjustedPrice" integer, "subtotal" integer NOT NULL, "hasPromo" boolean NOT NULL DEFAULT false, "appliedPromoCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "order_id" uuid, "product_id" uuid, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ada63158a19f87d472a346c5f" ON "order_items" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('draft', 'init', 'payment_pending', 'confirmed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "customerId" uuid, "tenantId" uuid NOT NULL, "outletId" uuid, "promoId" uuid, "total" integer NOT NULL, "payment_method" character varying(30) NOT NULL DEFAULT 'cash', "status" "public"."orders_status_enum" NOT NULL DEFAULT 'init', "uuid" uuid NOT NULL, "customer_name" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_04a64e7c04376e27182f8c0fa17" UNIQUE ("uuid"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f06330d9c435905f797cfe9be5" ON "orders" ("tenantId", "id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_208a358e9fe8abe6e1d8245980" ON "orders" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."promotions_type_enum" AS ENUM('discount', 'free', 'bundle')`,
    );
    await queryRunner.query(
      `CREATE TABLE "promotions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "value" integer NOT NULL, "type" "public"."promotions_type_enum" NOT NULL, "quota" integer NOT NULL, "maxItem" integer, "code" character varying, "isActive" boolean NOT NULL DEFAULT true, "startDate" TIMESTAMP NOT NULL DEFAULT now(), "endDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_44557630e787a2fc078722b3351" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_12a025ac183513a2688c77cef43" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredients" ADD CONSTRAINT "FK_23d31ec333c1305523fc420c3bb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" ADD CONSTRAINT "FK_76ec2c8048b68986aff66496251" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" ADD CONSTRAINT "FK_04c6e59f037eb2a72ca672d44f5" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" ADD CONSTRAINT "FK_2da52a63061f2c51bb4dacb4ef5" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_6804855ba1a19523ea57e0769b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_5ada63158a19f87d472a346c5f2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_208a358e9fe8abe6e1d82459804" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_62fa9ea07b0707f52b2a006e623" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_acfda253a0d05ff3dbbe1e6eb58" FOREIGN KEY ("promoId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_acfda253a0d05ff3dbbe1e6eb58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_62fa9ea07b0707f52b2a006e623"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_208a358e9fe8abe6e1d82459804"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_5ada63158a19f87d472a346c5f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_6804855ba1a19523ea57e0769b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" DROP CONSTRAINT "FK_2da52a63061f2c51bb4dacb4ef5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" DROP CONSTRAINT "FK_04c6e59f037eb2a72ca672d44f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" DROP CONSTRAINT "FK_76ec2c8048b68986aff66496251"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ingredients" DROP CONSTRAINT "FK_23d31ec333c1305523fc420c3bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_12a025ac183513a2688c77cef43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_44557630e787a2fc078722b3351"`,
    );
    await queryRunner.query(`DROP TABLE "promotions"`);
    await queryRunner.query(`DROP TYPE "public"."promotions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_208a358e9fe8abe6e1d8245980"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f06330d9c435905f797cfe9be5"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ada63158a19f87d472a346c5f"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6804855ba1a19523ea57e0769b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6739a1757449f723ff6ae692e7"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_size_enum"`);
    await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_53bfde6fd7f26082d763663366"`,
    );
    await queryRunner.query(`DROP TABLE "product_ingredients"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23d31ec333c1305523fc420c3b"`,
    );
    await queryRunner.query(`DROP TABLE "ingredients"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7346b08032078107fce81e014f"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "outlets"`);
  }
}
