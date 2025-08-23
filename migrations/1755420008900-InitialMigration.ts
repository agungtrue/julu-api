import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1755420008900 implements MigrationInterface {
    name = 'InitialMigration1755420008900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outlets" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "branch" character varying NOT NULL, "address" character varying NOT NULL, "pic" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_4f218ad1778c5c01d7bf77bab02" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "outlets"`);
    }

}
