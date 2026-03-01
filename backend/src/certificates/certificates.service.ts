import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
  ) {}

  async issue(applicationId: string, certificateNumber: string, pdfUrl: string) {
    const certificate = this.certificateRepository.create({
      application_id: applicationId,
      certificate_number: certificateNumber,
      issue_date: new Date(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      pdf_url: pdfUrl,
    });

    return this.certificateRepository.save(certificate);
  }
}
