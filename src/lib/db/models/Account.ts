import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { User } from "./User";

export type InventoryAccountType = "netflix" | "gpt_plus";
export type InventoryAccountStatus = "available" | "sold";

export class Account extends Model<
  InferAttributes<Account>,
  InferCreationAttributes<Account>
> {
  declare id: CreationOptional<number>;
  declare type: InventoryAccountType;
  declare email: string;
  declare passwordEncrypted: string;
  declare twoFactorSecretEncrypted: string | null;
  declare expiryDate: string; // DATEONLY
  declare quotaPercent: number | null;
  declare status: CreationOptional<InventoryAccountStatus>;
  declare notes: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: Date | null;
  declare creator?: NonAttribute<User>;
}

export function initAccount(sequelize: Sequelize) {
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      type: { type: DataTypes.ENUM("netflix", "gpt_plus"), allowNull: false },
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
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: "accounts" }
  );
}
