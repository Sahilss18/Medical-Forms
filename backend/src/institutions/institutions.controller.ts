import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InstitutionsService } from './institutions.service';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Controller('institutions')
@UseGuards(JwtAuthGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('me')
  async getMyInstitution(@Req() req: any) {
    return this.institutionsService.findByUserId(req.user.userId);
  }

  @Put('me')
  async updateMyInstitution(@Req() req: any, @Body() dto: UpdateInstitutionDto) {
    return this.institutionsService.upsertByUserId(req.user.userId, dto);
  }
}
