import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Order } from "./Order";
import type { OrderLineAssignment } from "./OrderLineAssignment";
import type { WarrantyType } from "@/lib/orderWarranty";

export class OrderLine extends Model<
  InferAttributes<OrderLine>,
  InferCreationAttributes<OrderLine>
> {
  declare id: CreationOptional<number>;
  declare orderId: ForeignKey<Order["id"]>;
  declare warrantyType: WarrantyType;
  declare warrantyUntil: string | null;
  declare warrantyDays: number | null;
  declare price: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare order?: NonAttribute<Order>;
  declare assignments?: NonAttribute<OrderLineAssignment[]>;
}

export function initOrderLine(sequelize: Sequelize) {
  OrderLine.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      warrantyType: { type: DataTypes.ENUM("kbh", "bhf", "days"), allowNull: false },
      warrantyUntil: { type: DataTypes.DATEONLY, allowNull: true },
      warrantyDays: { type: DataTypes.INTEGER, allowNull: true },
      price: { type: DataTypes.DECIMAL(15, 0), allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "order_lines" }
  );
}
