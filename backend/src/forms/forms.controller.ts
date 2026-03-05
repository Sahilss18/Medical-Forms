import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FormsService } from './forms.service';

@Controller('forms')
@UseGuards(JwtAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  async findAll() {
    return this.formsService.findAll();
  }

  @Get(':identifier')
  async findOne(@Param('identifier') identifier: string) {
    return this.formsService.findByIdentifier(identifier);
  }
}
