import { sequelize } from "./sequelize";
import { User, initUser } from "./models/User";
import { Student, initStudent } from "./models/Student";
import { StudentSchedule, initStudentSchedule } from "./models/StudentSchedule";
import { Bill, initBill } from "./models/Bill";
import { BillSession, initBillSession } from "./models/BillSession";

const g = globalThis as any;

if (!g.__modelsReady) {
  initUser(sequelize);
  initStudent(sequelize);
  initStudentSchedule(sequelize);
  initBill(sequelize);
  initBillSession(sequelize);

  // Associations
  User.hasMany(Student, { foreignKey: "createdBy", as: "students" });
  Student.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

  Student.hasMany(StudentSchedule, { foreignKey: "studentId", as: "schedules" });
  StudentSchedule.belongsTo(Student, { foreignKey: "studentId", as: "student" });

  Student.hasMany(Bill, { foreignKey: "studentId", as: "bills" });
  Bill.belongsTo(Student, { foreignKey: "studentId", as: "student" });
  Bill.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

  Bill.hasMany(BillSession, { foreignKey: "billId", as: "sessions" });
  BillSession.belongsTo(Bill, { foreignKey: "billId", as: "bill" });

  g.__modelsReady = true;
}

export { sequelize, User, Student, StudentSchedule, Bill, BillSession };
