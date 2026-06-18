import { DataTypes, QueryInterface } from "sequelize";
import { MigrationFn } from "umzug";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("users", "passwordHash", {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("users", "passwordHash");
};
