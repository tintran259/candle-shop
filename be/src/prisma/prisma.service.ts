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
      // Giới hạn thời gian một giao dịch (mặc định 5 giây). CI chạy ở Mỹ, DB ở Singapore (~200 ms mỗi truy vấn) nên đặt DB_TX_TIMEOUT_MS lớn hơn
      transactionOptions: { timeout: Number(process.env.DB_TX_TIMEOUT_MS) || 5000, maxWait: Number(process.env.DB_TX_TIMEOUT_MS) || 2000 },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
