import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { Certificate } from './entities/certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate])],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
