import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, ForeignKey, NonAttribute, Sequelize,
} from "sequelize";
import type { Student } from "./Student";

export class StudentSchedule extends Model<
  InferAttributes<StudentSchedule>,
  InferCreationAttributes<StudentSchedule>
> {
  declare id: CreationOptional<number>;
  declare studentId: ForeignKey<Student["id"]>;
  declare dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  declare startTime: string; // HH:mm
  declare endTime: string;   // HH:mm
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare student?: NonAttribute<Student>;
}

export function initStudentSchedule(sequelize: Sequelize) {
  StudentSchedule.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: { type: DataTypes.INTEGER, allowNull: false },
      dayOfWeek: { type: DataTypes.INTEGER, allowNull: false },
      startTime: { type: DataTypes.STRING(5), allowNull: false },
      endTime: { type: DataTypes.STRING(5), allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "student_schedules" }
  );
}
