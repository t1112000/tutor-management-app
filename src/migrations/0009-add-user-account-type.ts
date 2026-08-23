import { DataTypes, QueryInterface } from "sequelize";
import { MigrationFn } from "umzug";

/**
 * Chosen once at signup, fixed for the lifetime of the account: "tutor" gets the
 * existing teaching workflow, "reseller" gets the subscription-account-selling
 * workflow. Existing rows default to "tutor" so the current single user keeps
 * working without a separate data migration.
 */
export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.addColumn("users", "accountType", {
    type: DataTypes.ENUM("tutor", "reseller"),
    allowNull: false,
    defaultValue: "tutor",
  });
};

export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  await qi.removeColumn("users", "accountType");
};
