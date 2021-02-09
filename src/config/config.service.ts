import * as dotenv from 'dotenv';
import * as Joi from '@hapi/joi';
import * as fs from 'fs';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface EnvConfig {
  [key: string]: string;
}

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
    Logger.log(`running in ${filePath}`);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid(['development', 'production', 'test', 'provision'])
        .default('development'),
      LIVESYNC_PORT: Joi.number().default(4777),
      STATS_RABBITMQ_URI: Joi.string().default(
        'amqp://guest:guest@localhost:5672/spot',
      ),
      STATS_RABBITMQ_EXCHANGE: Joi.string().default('stats.exchange'),
      STATS_RABBITMQ_EXCHANGE_TYPE: Joi.string().default('direct'),
      STATS_RABBITMQ_ROUTES: Joi.string().default(
        'manifest.route|stats.route|metric.route|indicator.route',
      ),
      GLOBE_RABBITMQ_URI: Joi.string().default(
        'amqp://guest:guest@localhost:5672/spot',
      ),
      GLOBE_RABBITMQ_EXCHANGE: Joi.string().default('globe.exchange'),
      GLOBE_RABBITMQ_EXCHANGE_TYPE: Joi.string().default('direct'),
      GLOBE_RABBITMQ_ROUTE: Joi.string().default(
        'practice.route|practice.queue',
      ),
      LIVESYNC_DB_TYPE: Joi.string().default('mssql'),
      LIVESYNC_DB_HOST: Joi.string().default('localhost'),
      LIVESYNC_DB_PORT: Joi.number().default(1433),
      LIVESYNC_DB_USER: Joi.string().default('sa'),
      LIVESYNC_DB_PASS: Joi.string().default('M@un1983'),
      LIVESYNC_DB_NAME: Joi.string().default('livesync'),
      LIVESYNC_ENTITIES: Joi.string().default('dist/**/*.entity{.ts,.js}'),
      LIVESYNC_DB_SYNC: Joi.boolean().default(true),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get Port(): number {
    return Number(this.envConfig.LIVESYNC_PORT);
  }

  get QueueStatsUri(): string {
    return String(this.envConfig.STATS_RABBITMQ_URI);
  }

  get QueueStatsExchange(): string {
    return String(this.envConfig.STATS_RABBITMQ_EXCHANGE);
  }

  get QueueStatsExchangeType(): string {
    return String(this.envConfig.STATS_RABBITMQ_EXCHANGE_TYPE);
  }

  get QueueStatsRoutes(): string[] {
    return this.envConfig.STATS_RABBITMQ_ROUTES.split('|');
  }

  get QueueGlobeUri(): string {
    return String(this.envConfig.GLOBE_RABBITMQ_URI);
  }

  get QueueGlobeExchange(): string {
    return String(this.envConfig.GLOBE_RABBITMQ_EXCHANGE);
  }

  get QueueGlobeExchangeType(): string {
    return String(this.envConfig.GLOBE_RABBITMQ_EXCHANGE_TYPE);
  }

  get QueueGlobeRoute(): string {
    return String(this.envConfig.GLOBE_RABBITMQ_ROUTE);
  }

  get DatabaseType(): string {
    return String(this.envConfig.LIVESYNC_DB_TYPE);
  }

  get DatabaseHost(): string {
    return String(this.envConfig.LIVESYNC_DB_HOST);
  }

  get DatabasePort(): number {
    return Number(this.envConfig.LIVESYNC_DB_PORT);
  }

  get DatabaseUser(): string {
    return String(this.envConfig.LIVESYNC_DB_USER);
  }

  get DatabasePass(): string {
    return String(this.envConfig.LIVESYNC_DB_PASS);
  }

  get DatabaseName(): string {
    return String(this.envConfig.LIVESYNC_DB_NAME);
  }

  get DatabaseEntities(): string {
    return String(this.envConfig.LIVESYNC_ENTITIES);
  }

  get DatabaseSync(): boolean {
    return Boolean(this.envConfig.LIVESYNC_DB_SYNC);
  }

  get Database(): string {
    return String(this.envConfig.LIVESYNC_MONGODB_URI);
  }

  getRoute(name: string): string {
    return this.QueueStatsRoutes.find((c) => c.includes(name));
  }
}
