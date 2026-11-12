import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { IdempotencyInterceptor } from './common/idempotency.interceptor.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { DiscountsModule } from './discounts/discounts.module.js';
import { MaterialsModule } from './materials/materials.module.js';
import { CraftModule } from './craft/craft.module.js';
import { CancelledModule } from './cancelled/cancelled.module.js';
import { DraftsModule } from './drafts/drafts.module.js';
import { ResetModule } from './reset/reset.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { NewsletterModule } from './newsletter/newsletter.module.js';
import { ShopModule } from './shop/shop.module.js';
import { ConceptsModule } from './concepts/concepts.module.js';
import { SiteThemeModule } from './site-theme/site-theme.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    UsersModule,
    AuthModule,
    SettingsModule,
    CustomersModule,
    DiscountsModule,
    MaterialsModule,
    CraftModule,
    CancelledModule,
    DraftsModule,
    ResetModule,
    UploadsModule,
    PaymentsModule,
    ReviewsModule,
    NewsletterModule,
    ShopModule,
    ConceptsModule,
    SiteThemeModule,
  ],
  controllers: [AppController],
  // Gửi lại cùng Idempotency-Key thì trả kết quả lần đầu (BO tự gửi lại khi mất mạng)
  providers: [{ provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor }],
})
export class AppModule {}
