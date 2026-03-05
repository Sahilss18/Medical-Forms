import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { Application } from '../applications/entities/application.entity';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
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

  async issueForApplication(application: Application) {
    const existing = await this.certificateRepository.findOne({
      where: { application_id: application.id },
    });

    if (existing) {
      return existing;
    }

    const certificateNumber = `MIR/${new Date().getFullYear()}/${application.id
      .slice(0, 8)
      .toUpperCase()}`;

    const certificatesDir = join(process.cwd(), 'uploads', 'certificates');
    mkdirSync(certificatesDir, { recursive: true });

    const filename = `${certificateNumber.replace(/[^A-Z0-9/]/gi, '').replace(/\//g, '-')}.pdf`;
    const pdfPath = join(certificatesDir, filename);
    const pdfUrl = `/uploads/certificates/${filename}`;

    writeFileSync(
      pdfPath,
      this.generateSimpleCertificatePdf(certificateNumber, application.id),
    );

    return this.issue(application.id, certificateNumber, pdfUrl);
  }

  async getMyCertificates(userId: string) {
    const certificates = await this.certificateRepository
      .createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.application', 'application')
      .leftJoinAndSelect('application.institution', 'institution')
      .leftJoinAndSelect('application.form', 'form')
      .where('institution.user_id = :userId', { userId })
      .orderBy('certificate.issue_date', 'DESC')
      .getMany();

    return certificates.map((cert) => {
      const issuedDate = cert.issue_date;
      const expiryDate = cert.expiry_date;
      const now = new Date();
      const status = expiryDate && new Date(expiryDate) < now ? 'expired' : 'active';

      return {
        id: cert.id,
        applicationId: cert.application_id,
        certificateNumber: cert.certificate_number,
        formType: cert.application?.form?.title || cert.application?.form?.form_code || 'Form',
        institutionName: cert.application?.institution?.name || 'Institution',
        issuedDate,
        validUntil: expiryDate,
        status,
        downloadUrl: cert.pdf_url,
      };
    });
  }

  private generateSimpleCertificatePdf(
    certificateNumber: string,
    applicationId: string,
  ): Buffer {
    const safeCertificateNumber = certificateNumber.replace(/[()\\]/g, '');
    const safeApplicationId = applicationId.replace(/[()\\]/g, '');
    const issueDate = new Date().toISOString().slice(0, 10);

    const content = `BT
/F1 18 Tf
70 760 Td
(Medical License Certificate) Tj
0 -40 Td
/F1 12 Tf
(Certificate Number: ${safeCertificateNumber}) Tj
0 -24 Td
(Application ID: ${safeApplicationId}) Tj
0 -24 Td
(Issue Date: ${issueDate}) Tj
0 -24 Td
(Issued by: Medical Licensing Portal) Tj
ET`;

    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${content.length} >>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000243 00000 n 
0000000313 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
${313 + content.length + 35}
%%EOF`;

    return Buffer.from(pdf, 'utf-8');
  }
}
