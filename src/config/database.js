// src/config/database.js
import mysql from 'mysql2';
import { db_credentials } from './envs.js';

export const createConnection = () => {
  return mysql.createConnection({
    host: db_credentials.dbHost,
    port: db_credentials.dbPort,
    user: db_credentials.dbUser,
    password: db_credentials.dbPassword,
    database: db_credentials.dbName,
  });
};
