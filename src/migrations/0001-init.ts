import type { MigrationFn } from "umzug";
import type { Sequelize } from "sequelize";
import { DataTypes, QueryInterface } from "sequelize";

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  // Create users table
  await qi.createTable("users", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true },
    pushSubscription: { type: DataTypes.JSONB, allowNull: true },
    notificationEmail: { type: DataTypes.STRING, allowNull: true },
    pushEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    emailEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  // Create students table
  await qi.createTable("students", {
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
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  // Create student_schedules table
  await qi.createTable("student_schedules", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "students", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    dayOfWeek: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.STRING(5), allowNull: false },
    endTime: { type: DataTypes.STRING(5), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  // Create bills table
  await qi.createTable("bills", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "students", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    sessionCount: { type: DataTypes.INTEGER, allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(15, 0), allowNull: false },
    status: {
      type: DataTypes.ENUM("unpaid", "paid"),
      allowNull: false,
      defaultValue: "unpaid",
    },
    paidAt: { type: DataTypes.DATE, allowNull: true },
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
  });

  // Create bill_sessions table
  await qi.createTable("bill_sessions", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    billId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "bills", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.STRING(5), allowNull: false },
    endTime: { type: DataTypes.STRING(5), allowNull: false },
    isAttended: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  // Add indexes
  await qi.addIndex("students", ["createdBy"]);
  await qi.addIndex("student_schedules", ["studentId"]);
  await qi.addIndex("bills", ["studentId"]);
  await qi.addIndex("bills", ["status"]);
  await qi.addIndex("bill_sessions", ["billId"]);
  await qi.addIndex("bill_sessions", ["scheduledDate"]);
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.dropTable("bill_sessions");
  await qi.dropTable("bills");
  await qi.dropTable("student_schedules");
  await qi.dropTable("students");
  await qi.dropTable("users");
};
