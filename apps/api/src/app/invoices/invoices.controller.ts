import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { AuthUser } from 'shared-types';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateInvoiceDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

/** All routes are scoped to the authenticated user. */
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.invoices.list(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user.id, dto);
  }

  /** Generate a draft invoice from an existing offer. */
  @Post('from-offer/:offerId')
  generate(
    @CurrentUser() user: AuthUser,
    @Param('offerId') offerId: string,
    @Body() dto: GenerateInvoiceDto,
  ) {
    return this.invoices.generateFromOffer(user.id, offerId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.remove(user.id, id);
  }
}
