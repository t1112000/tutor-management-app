import { sequelize } from "./sequelize";
import { User, initUser } from "./models/User";
import { Student, initStudent } from "./models/Student";
import { StudentSchedule, initStudentSchedule } from "./models/StudentSchedule";
import { Bill, initBill } from "./models/Bill";
import { BillSession, initBillSession } from "./models/BillSession";
import { Account, initAccount } from "./models/Account";
import { Customer, initCustomer } from "./models/Customer";
import { CustomerContact, initCustomerContact } from "./models/CustomerContact";
import { Order, initOrder } from "./models/Order";
import { OrderLine, initOrderLine } from "./models/OrderLine";
import { OrderLineAssignment, initOrderLineAssignment } from "./models/OrderLineAssignment";

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
  initAccount(sequelize);
  initCustomer(sequelize);
  initCustomerContact(sequelize);
  initOrder(sequelize);
  initOrderLine(sequelize);
  initOrderLineAssignment(sequelize);

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

    User.hasMany(Account, { foreignKey: "createdBy", as: "accounts" });
    Account.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

    User.hasMany(Customer, { foreignKey: "createdBy", as: "customers" });
    Customer.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
    Customer.hasMany(CustomerContact, { foreignKey: "customerId", as: "contacts" });
    CustomerContact.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

    Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });
    Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
    Order.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
    Order.hasMany(OrderLine, { foreignKey: "orderId", as: "lines" });
    OrderLine.belongsTo(Order, { foreignKey: "orderId", as: "order" });
    OrderLine.hasMany(OrderLineAssignment, { foreignKey: "orderLineId", as: "assignments" });
    OrderLineAssignment.belongsTo(OrderLine, { foreignKey: "orderLineId", as: "line" });
    OrderLineAssignment.belongsTo(Account, { foreignKey: "accountId", as: "account" });
  } catch {
    // already associated (HMR reload) — safe to ignore
  }
}

export { sequelize, User, Student, StudentSchedule, Bill, BillSession, Account, Customer, CustomerContact, Order, OrderLine, OrderLineAssignment };
