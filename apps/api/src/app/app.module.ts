import { Module } from '@nestjs/common';
import { PrismaModule } from 'data-access';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { InvoicesModule } from './invoices/invoices.module';
import { OffersModule } from './offers/offers.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    AuthModule,
    HealthModule,
    CatalogueModule,
    OffersModule,
    InvoicesModule,
    AiModule,
  ],
})
export class AppModule {}
