import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1785519605950 implements MigrationInterface {
  name = 'InitialMigration1785519605950';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "code" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "UQ_3021c18db2b363ae9324c826c5a" UNIQUE ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "UQ_3021c18db2b363ae9324c826c5a"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "code"`);
  }
}
