import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Bill } from "./Bill";

export class BillSession extends Model<
  InferAttributes<BillSession>,
  InferCreationAttributes<BillSession>
> {
  declare id: CreationOptional<number>;
  declare billId: ForeignKey<Bill["id"]>;
  declare scheduledDate: string; // DATEONLY YYYY-MM-DD
  declare startTime: string;     // HH:mm
  declare endTime: string;       // HH:mm
  declare isAttended: CreationOptional<boolean>;
  declare notes: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare bill?: NonAttribute<Bill>;
}

export function initBillSession(sequelize: Sequelize) {
  BillSession.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      billId: { type: DataTypes.INTEGER, allowNull: false },
      scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
      startTime: { type: DataTypes.STRING(5), allowNull: false },
      endTime: { type: DataTypes.STRING(5), allowNull: false },
      isAttended: { type: DataTypes.BOOLEAN, defaultValue: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "bill_sessions" }
  );
}
