import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';

const envFile = `.env.${process.env.NODE_ENV || 'local'}`;
config({ path: envFile });

const env = process.env.NODE_ENV || 'local';
const isSsl = env === 'production' || env === 'development'

export const envMode = env;

export const dbConfig = (): TypeOrmModuleOptions => {

  const configMode = isSsl ? {
    port: Number(process.env.PORT),
    url: `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(join(process.cwd(), 'ca-certificate.crt')).toString(),
    },
    timezone: 'UTC',
  } : {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    timezone: 'UTC',
  }

  console.log('DEBUG DB...', {
    configMode, isSsl, envMode, envFile, DB_PORT: process.env.DB_PORT
  })

  return {
    type: 'postgres',
    ...configMode,
    entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  };
};

// make working on local and staging first. (done)
// then study the flow how thats works on local and staging. (done)
// make another sub domain for staging, and set up staging/nginx server (done)
// make new migration, test on local (done) and staging (done)

// todo list:
// - cicd first (migration run manually on localStorage, to avoid server error)
// - store env variale and secret key on somewhere (do not just static value on compose file) 



//  so in prod should be easy if can manage staging successfully
