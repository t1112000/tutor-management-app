import type { MigrationFn } from "umzug";
import type { Sequelize } from "sequelize";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("bills", "deletedAt", {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("bills", "deletedAt");
};
