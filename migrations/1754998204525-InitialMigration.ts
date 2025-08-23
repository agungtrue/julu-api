import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1754998204525 implements MigrationInterface {
    name = 'InitialMigration1754998204525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('coffee', 'non_coffee', 'snacks')`);
        await queryRunner.query(`ALTER TABLE "products" ADD "type" "public"."products_type_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."products_size_enum" AS ENUM('small', 'regular', 'large')`);
        await queryRunner.query(`ALTER TABLE "products" ADD "size" "public"."products_size_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "size"`);
        await queryRunner.query(`DROP TYPE "public"."products_size_enum"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
    }

}
