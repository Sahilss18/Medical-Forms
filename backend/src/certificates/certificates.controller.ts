import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  @Roles(UserRole.APPLICANT)
  getMyCertificates(@Req() req: any) {
    return this.certificatesService.getMyCertificates(req.user.userId);
  }

  @Get(':id/download-link')
  @Roles(UserRole.APPLICANT, UserRole.ADMIN, UserRole.OFFICER)
  async getDownloadLink(@Param('id') id: string, @Req() req: any) {
    const certs = await this.certificatesService.getMyCertificates(req.user.userId);
    const certificate = certs.find((item) => item.id === id);
    if (!certificate) {
      return { id, found: false, downloadUrl: null };
    }

    return {
      id: certificate.id,
      found: true,
      downloadUrl: certificate.downloadUrl,
    };
  }
}
