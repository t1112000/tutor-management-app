import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { User } from "./User";

export class Student extends Model<
  InferAttributes<Student>,
  InferCreationAttributes<Student>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare phone: string | null;
  declare birthday: string | null; // DATEONLY
  declare subject: "english" | "chinese";
  declare address: string | null;
  declare notes: string | null;
  declare parentName: string | null;
  declare parentPhone: string | null;
  declare color: string | null;
  declare createdBy: ForeignKey<User["id"]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare creator?: NonAttribute<User>;
}

export function initStudent(sequelize: Sequelize) {
  Student.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: true },
      birthday: { type: DataTypes.DATEONLY, allowNull: true },
      subject: {
        type: DataTypes.ENUM("english", "chinese"),
        allowNull: false,
        defaultValue: "english",
      },
      address: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      parentName: { type: DataTypes.STRING, allowNull: true },
      parentPhone: { type: DataTypes.STRING, allowNull: true },
      color: { type: DataTypes.STRING, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "students" }
  );
}
