import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InspectorsService } from './inspectors.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('inspectors')
@UseGuards(JwtAuthGuard)
export class InspectorsController {
  constructor(private readonly inspectorsService: InspectorsService) {}

  @Get('me/availability')
  async getMyAvailability(@Req() req: any) {
    if (req?.user?.role !== 'INSPECTOR') {
      throw new ForbiddenException('Only inspectors can access availability');
    }

    return this.inspectorsService.getMyAvailability(req.user.userId);
  }

  @Patch('me/availability')
  async updateMyAvailability(
    @Req() req: any,
    @Body() body: UpdateAvailabilityDto,
  ) {
    if (req?.user?.role !== 'INSPECTOR') {
      throw new ForbiddenException('Only inspectors can update availability');
    }

    return this.inspectorsService.updateMyAvailability(req.user.userId, body.available);
  }
}
