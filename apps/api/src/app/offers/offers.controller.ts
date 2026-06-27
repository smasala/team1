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
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OffersService } from './offers.service';

/** All routes are scoped to the caller's organisation (multi-tenancy). */
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list(@CurrentOrg() organisationId: string) {
    return this.offers.list(organisationId);
  }

  @Get(':id')
  get(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.offers.get(organisationId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOfferDto) {
    return this.offers.create(user.organisationId, user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentOrg() organisationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offers.update(organisationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentOrg() organisationId: string, @Param('id') id: string) {
    return this.offers.remove(organisationId, id);
  }
}
