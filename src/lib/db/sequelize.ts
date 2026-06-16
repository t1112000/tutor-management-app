import { Sequelize } from "sequelize";

const g = globalThis as any;

export const sequelize: Sequelize =
  g.__seq ??
  new Sequelize(process.env.DATABASE_URL!, {
    dialect: "postgres",
    logging: false,
    pool: { max: 5, min: 0, idle: 10_000 },
  });

if (process.env.NODE_ENV !== "production") g.__seq = sequelize;
