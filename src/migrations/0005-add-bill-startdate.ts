import { DataTypes, QueryInterface } from "sequelize";
import { MigrationFn } from "umzug";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("bills", "startDate", {
    type: DataTypes.DATEONLY,
    allowNull: true,
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("bills", "startDate");
};
