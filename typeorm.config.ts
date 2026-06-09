import { DataSource } from 'typeorm';
import { dbConfig } from './db.config'
// import { config } from 'dotenv';
// config(); // Load .env

export default new DataSource(dbConfig() as any);