import { DataTypes, QueryInterface } from "sequelize";
import { MigrationFn } from "umzug";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("users", "googleId");
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("users", "googleId", {
    type: DataTypes.STRING,
    allowNull: true,
  });
};
