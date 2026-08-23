import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable("customers", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
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
  await qi.addIndex("customers", ["createdBy"]);

  await qi.createTable("customer_contacts", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "customers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("facebook", "zalo", "discord", "telegram"),
      allowNull: false,
    },
    value: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  await qi.addIndex("customer_contacts", ["customerId", "type"], {
    unique: true,
    name: "customer_contacts_customer_id_type",
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("customer_contacts");
  await qi.dropTable("customers");
};
