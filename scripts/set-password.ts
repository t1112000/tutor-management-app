import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

async function main() {
  const [, , email, password, name] = process.argv;
  if (!email || !password) {
    console.error("Usage: npm run set-password <email> <password> [name]");
    process.exit(1);
  }

  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: "postgres",
    logging: false,
  });

  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: true },
      passwordHash: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: "users", timestamps: true }
  );

  const hash = await bcrypt.hash(password, 12);

  const [user, created] = await User.upsert({ email, passwordHash: hash, ...(name ? { name } : {}) });
  console.log(created ? `Created user: ${email}` : `Updated password for: ${email}`);

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
