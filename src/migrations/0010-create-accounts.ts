import type { MigrationFn } from "umzug";
import { DataTypes, QueryInterface } from "sequelize";

/**
 * Inventory of subscription accounts (Netflix, ChatGPT Plus) a reseller
 * account is selling. Independent of Student/Bill — a different business
 * entirely, sharing only the createdBy ownership pattern.
 */
export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.createTable("accounts", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: {
      type: DataTypes.ENUM("netflix", "gpt_plus"),
      allowNull: false,
    },
    email: { type: DataTypes.STRING, allowNull: false },
    passwordEncrypted: { type: DataTypes.TEXT, allowNull: false },
    twoFactorSecretEncrypted: { type: DataTypes.TEXT, allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
    quotaPercent: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("available", "sold"),
      allowNull: false,
      defaultValue: "available",
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

  await qi.addIndex("accounts", ["createdBy"]);
  await qi.addIndex("accounts", ["status"]);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("accounts");
};
