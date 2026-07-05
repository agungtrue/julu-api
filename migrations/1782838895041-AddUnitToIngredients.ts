import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnitToProductIngredients1719785268000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ingredients" ADD "unit" character varying(20) NOT NULL DEFAULT 'GRAM'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ingredients" DROP COLUMN "unit"`);
  }
}
