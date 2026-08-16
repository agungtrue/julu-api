import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1786874869959 implements MigrationInterface {
    name = 'InitialMigration1786874869959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f06330d9c435905f797cfe9be5"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "cogs_at_purchase" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_9263386c35b6b242540f9493b0" ON "order_items" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_145532db85752b29c57d2b7b1f" ON "order_items" ("order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb05416a8d5f1c8830d5031d78" ON "orders" ("tenantId", "created_at", "status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_cb05416a8d5f1c8830d5031d78"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_145532db85752b29c57d2b7b1f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9263386c35b6b242540f9493b0"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "cogs_at_purchase"`);
        await queryRunner.query(`CREATE INDEX "IDX_f06330d9c435905f797cfe9be5" ON "orders" ("id", "tenantId") `);
    }

}
