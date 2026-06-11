import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProvidersService } from '../providers/providers.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@ApiTags('discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly providers: ProvidersService) {}

  /** Approved + available providers near the given point, sorted by distance. */
  @Get('nearby')
  nearby(@Query() query: NearbyQueryDto) {
    return this.providers.findNearby(
      query.lat,
      query.lng,
      query.radius,
      query.skill,
    );
  }

  /** Public detail for one approved provider. */
  @Get('providers/:id')
  providerDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.providers.getPublicProfile(id);
  }
}
