import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1755420265002 implements MigrationInterface {
    name = 'InitialMigration1755420265002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "outletId" integer`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_62fa9ea07b0707f52b2a006e623" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_62fa9ea07b0707f52b2a006e623"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "outletId"`);
    }

}
