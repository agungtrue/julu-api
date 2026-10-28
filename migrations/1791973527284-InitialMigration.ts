import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1791973527284 implements MigrationInterface {
  name = 'InitialMigration1791973527284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "store_special_days" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "date" date NOT NULL, "isOpen" boolean NOT NULL, "reason" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" uuid, CONSTRAINT "UQ_0eb085e72ecc8777bb05a578aae" UNIQUE ("tenantId", "date"), CONSTRAINT "PK_bcb3de51ce2d9d5159becfd3418" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_special_days" ADD CONSTRAINT "FK_3c2dc3ff52a22be94f17569f343" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_special_days" ADD CONSTRAINT "FK_4b7889258851775ce20c6f1309a" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_special_days" DROP CONSTRAINT "FK_4b7889258851775ce20c6f1309a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_special_days" DROP CONSTRAINT "FK_3c2dc3ff52a22be94f17569f343"`,
    );
    await queryRunner.query(`DROP TABLE "store_special_days"`);
  }
}
