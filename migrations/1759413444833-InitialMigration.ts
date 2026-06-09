import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1759413444833 implements MigrationInterface {
    name = 'InitialMigration1759413444833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."promotions_type_enum" AS ENUM('discount', 'free', 'bundle')`);
        await queryRunner.query(`CREATE TABLE "promotions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "value" integer NOT NULL, "type" "public"."promotions_type_enum" NOT NULL, "quota" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "startDate" TIMESTAMP NOT NULL DEFAULT now(), "endDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "cogs" integer`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "adjustedPrice" integer`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "hasPromo" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "promoId" integer`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_acfda253a0d05ff3dbbe1e6eb58" FOREIGN KEY ("promoId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_acfda253a0d05ff3dbbe1e6eb58"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "promoId"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "hasPromo"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "adjustedPrice"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "cogs"`);
        await queryRunner.query(`DROP TABLE "promotions"`);
        await queryRunner.query(`DROP TYPE "public"."promotions_type_enum"`);
    }

}
