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
import { CurrentOrg, CurrentUser } from '../auth/current-user.decorator';
import {
  CreateInvoiceDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

/** All routes are scoped to the caller's organisation (multi-tenancy). */
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@CurrentOrg() organisationId: string) {
    return this.invoices.list(organisationId);
  }

  @Get(':id')
  get(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.invoices.get(organisationId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user.organisationId, user.id, dto);
  }

  /** Generate a draft invoice from an existing offer. */
  @Post('from-offer/:offerId')
  generate(
    @CurrentUser() user: AuthUser,
    @Param('offerId') offerId: string,
    @Body() dto: GenerateInvoiceDto,
  ) {
    return this.invoices.generateFromOffer(
      user.organisationId,
      user.id,
      offerId,
      dto,
    );
  }

  @Patch(':id')
  update(
    @CurrentOrg() organisationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(organisationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.invoices.remove(organisationId, id);
  }
}
