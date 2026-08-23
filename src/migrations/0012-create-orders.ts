import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable("orders", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "customers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex("orders", ["createdBy"]);
  await qi.addIndex("orders", ["customerId"]);

  await qi.createTable("order_lines", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "orders", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    warrantyType: {
      type: DataTypes.ENUM("kbh", "bhf", "days"),
      allowNull: false,
    },
    warrantyUntil: { type: DataTypes.DATEONLY, allowNull: true },
    warrantyDays: { type: DataTypes.INTEGER, allowNull: true },
    price: { type: DataTypes.DECIMAL(15, 0), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await qi.addIndex("order_lines", ["orderId"]);

  await qi.createTable("order_line_assignments", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderLineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "order_lines", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "accounts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    assignedAt: { type: DataTypes.DATE, allowNull: false },
    replacedAt: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex("order_line_assignments", ["orderLineId"]);
  await qi.addIndex("order_line_assignments", ["accountId"]);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("order_line_assignments");
  await qi.dropTable("order_lines");
  await qi.dropTable("orders");
};
