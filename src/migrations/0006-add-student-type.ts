import { DataTypes, QueryInterface } from "sequelize";
import { MigrationFn } from "umzug";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("students", "type", {
    type: DataTypes.ENUM("offline", "online"),
    allowNull: false,
    defaultValue: "offline",
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("students", "type");
};
