import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Customer } from "./Customer";

export type CustomerContactType = "facebook" | "zalo" | "discord" | "telegram";

export class CustomerContact extends Model<
  InferAttributes<CustomerContact>,
  InferCreationAttributes<CustomerContact>
> {
  declare id: CreationOptional<number>;
  declare customerId: ForeignKey<Customer["id"]>;
  declare type: CustomerContactType;
  declare value: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare customer?: NonAttribute<Customer>;
}

export function initCustomerContact(sequelize: Sequelize) {
  CustomerContact.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      type: {
        type: DataTypes.ENUM("facebook", "zalo", "discord", "telegram"),
        allowNull: false,
      },
      value: { type: DataTypes.STRING, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "customer_contacts" }
  );
}
