import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // DB_SCHEMA: schema Postgres (trống = public). Test dùng bo_test, tách khỏi dữ liệu thật
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }, process.env.DB_SCHEMA ? { schema: process.env.DB_SCHEMA } : undefined),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
