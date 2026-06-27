import { Global, Module } from '@nestjs/common';
import { LineItemsService } from './line-items.service';

/** Cross-cutting helpers shared by feature modules. */
@Global()
@Module({
  providers: [LineItemsService],
  exports: [LineItemsService],
})
export class CommonModule {}
