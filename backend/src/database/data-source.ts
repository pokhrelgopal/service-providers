import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';

// Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
// The Nest runtime configures TypeORM separately in DatabaseModule via
// ConfigService — this file only loads .env directly for CLI use.
loadEnv();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
};

// Single DataSource export (default) — the TypeORM CLI requires exactly one.
const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
