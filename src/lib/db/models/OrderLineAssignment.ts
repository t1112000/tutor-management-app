import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { OrderLine } from "./OrderLine";
import type { Account } from "./Account";

export class OrderLineAssignment extends Model<
  InferAttributes<OrderLineAssignment>,
  InferCreationAttributes<OrderLineAssignment>
> {
  declare id: CreationOptional<number>;
  declare orderLineId: ForeignKey<OrderLine["id"]>;
  declare accountId: ForeignKey<Account["id"]>;
  declare assignedAt: Date;
  declare replacedAt: Date | null;
  declare line?: NonAttribute<OrderLine>;
  declare account?: NonAttribute<Account>;
}

export function initOrderLineAssignment(sequelize: Sequelize) {
  OrderLineAssignment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderLineId: { type: DataTypes.INTEGER, allowNull: false },
      accountId: { type: DataTypes.INTEGER, allowNull: false },
      assignedAt: { type: DataTypes.DATE, allowNull: false },
      replacedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: "order_line_assignments", timestamps: false }
  );
}
