import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1758101788880 implements MigrationInterface {
    name = 'InitialMigration1758101788880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "outletId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_44557630e787a2fc078722b3351" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_44557630e787a2fc078722b3351"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "outletId"`);
    }

}
