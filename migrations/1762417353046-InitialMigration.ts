import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1762417353046 implements MigrationInterface {
    name = 'InitialMigration1762417353046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."products_type_enum" RENAME TO "products_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('coffee', 'non_coffee', 'snacks', 'topping')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "type" TYPE "public"."products_type_enum" USING "type"::"text"::"public"."products_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."products_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_type_enum_old" AS ENUM('coffee', 'non_coffee', 'snacks')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "type" TYPE "public"."products_type_enum_old" USING "type"::"text"::"public"."products_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."products_type_enum_old" RENAME TO "products_type_enum"`);
    }

}
