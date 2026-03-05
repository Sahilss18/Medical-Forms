import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { InspectorJurisdiction } from '../inspectors/entities/jurisdiction.entity';
import { InspectionAssignment } from '../inspections/entities/assignment.entity';
import { LicensingOffice } from '../offices/entities/office.entity';
import { LicensingOfficer } from '../offices/entities/officer.entity';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/field.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Application } from '../applications/entities/application.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [
    CertificatesModule,
    TypeOrmModule.forFeature([
      User,
      Inspector,
      InspectorJurisdiction,
      InspectionAssignment,
      LicensingOffice,
      LicensingOfficer,
      Form,
      FormField,
      Application,
      Certificate,
      AuditLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
