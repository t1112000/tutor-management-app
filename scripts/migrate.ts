import { Sequelize } from "sequelize";
import { Umzug, SequelizeStorage } from "umzug";
import path from "path";

async function main() {
  const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: "postgres",
    logging: false,
  });

  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, "../src/migrations/*.ts"),
      resolve: ({ name, path: migPath, context }) => {
        const migration = require(migPath!);
        return {
          name,
          up: async () => migration.up({ context }),
          down: async () => migration.down({ context }),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  const command = process.argv[2];
  if (command === "undo") {
    await umzug.down();
  } else {
    await umzug.up();
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
