import { Module } from '@nestjs/common';
import { OffersModule } from '../offers/offers.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

/** Invoice domain. Imports OffersModule to reuse offer lookup for generation. */
@Module({
  imports: [OffersModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
