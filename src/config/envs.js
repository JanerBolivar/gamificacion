import { configDotenv } from "dotenv";
configDotenv();

export const db_credentials = {
  dbHost: process.env.GAMIFICATION_DB_HOST,
  dbPort: process.env.GAMIFICATION_DB_PORT,
  dbUser: process.env.GAMIFICATION_DB_USER,
  dbPassword: process.env.GAMIFICATION_DB_PASSWORD,
  dbName: process.env.GAMIFICATION_DB_NAME,
};
