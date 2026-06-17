import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize,
} from "sequelize";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare name: string | null;
  declare image: string | null;
  declare passwordHash: string | null;
  declare pushSubscription: object | null;
  declare notificationEmail: string | null;
  declare pushEnabled: CreationOptional<boolean>;
  declare emailEnabled: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUser(sequelize: Sequelize) {
  User.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: true },
      image: { type: DataTypes.STRING, allowNull: true },
      passwordHash: { type: DataTypes.STRING, allowNull: true },
      pushSubscription: { type: DataTypes.JSONB, allowNull: true },
      notificationEmail: { type: DataTypes.STRING, allowNull: true },
      pushEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      emailEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "users" }
  );
}
