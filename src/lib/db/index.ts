import { sequelize } from "./sequelize";
import { User, initUser } from "./models/User";
import { Student, initStudent } from "./models/Student";
import { StudentSchedule, initStudentSchedule } from "./models/StudentSchedule";
import { Bill, initBill } from "./models/Bill";
import { BillSession, initBillSession } from "./models/BillSession";

// Guard per class instance, not per global flag.
// Next.js can produce multiple webpack chunks each with a fresh class but the
// same globalThis, so a boolean flag would prevent initialization of the new
// class while the old one lives in a different chunk.
if (!(User as any).sequelize) {
  initUser(sequelize);
  initStudent(sequelize);
  initStudentSchedule(sequelize);
  initBill(sequelize);
  initBillSession(sequelize);

  // Associations — wrapped to tolerate duplicate calls across HMR reloads
  try {
    User.hasMany(Student, { foreignKey: "createdBy", as: "students" });
    Student.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    Student.hasMany(StudentSchedule, { foreignKey: "studentId", as: "schedules" });
    StudentSchedule.belongsTo(Student, { foreignKey: "studentId", as: "student" });

    Student.hasMany(Bill, { foreignKey: "studentId", as: "bills" });
    Bill.belongsTo(Student, { foreignKey: "studentId", as: "student" });
    Bill.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    Bill.hasMany(BillSession, { foreignKey: "billId", as: "sessions" });
    BillSession.belongsTo(Bill, { foreignKey: "billId", as: "bill" });
  } catch {
    // already associated (HMR reload) — safe to ignore
  }
}

export { sequelize, User, Student, StudentSchedule, Bill, BillSession };
