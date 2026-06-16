import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Student } from "./Student";
import type { User } from "./User";

export class Bill extends Model<
  InferAttributes<Bill>,
  InferCreationAttributes<Bill>
> {
  declare id: CreationOptional<number>;
  declare studentId: ForeignKey<Student["id"]>;
  declare sessionCount: number;
  declare totalAmount: number;
  declare status: "unpaid" | "paid";
  declare paidAt: Date | null;
  declare notes: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare student?: NonAttribute<Student>;
  declare creator?: NonAttribute<User>;
}

export function initBill(sequelize: Sequelize) {
  Bill.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: { type: DataTypes.INTEGER, allowNull: false },
      sessionCount: { type: DataTypes.INTEGER, allowNull: false },
      totalAmount: { type: DataTypes.DECIMAL(15, 0), allowNull: false },
      status: {
        type: DataTypes.ENUM("unpaid", "paid"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "bills" }
  );
}
