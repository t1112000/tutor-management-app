import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

/**
 * Deleting a student used to hard-destroy every invoice and session belonging to
 * them, permanently erasing paid financial records. Soft-delete instead so the
 * billing history survives and a mistake is recoverable.
 */
export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("students", "deletedAt", {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("students", "deletedAt");
};
