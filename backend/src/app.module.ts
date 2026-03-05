import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedService } from './seed.service';

// Entities
import { User } from './users/entities/user.entity';
import { Institution } from './institutions/entities/institution.entity';
import { LicensingOffice } from './offices/entities/office.entity';
import { LicensingOfficer } from './offices/entities/officer.entity';
import { Inspector } from './inspectors/entities/inspector.entity';
import { InspectorJurisdiction } from './inspectors/entities/jurisdiction.entity';
import { Form } from './forms/entities/form.entity';
import { FormField } from './forms/entities/field.entity';
import { Application } from './applications/entities/application.entity';
import { ApplicationValue } from './applications/entities/value.entity';
import { Document } from './applications/entities/document.entity';
import { Query } from './applications/entities/query.entity';
import { InspectionAssignment } from './inspections/entities/assignment.entity';
import { InspectionReport } from './inspections/entities/report.entity';
import { Decision } from './decisions/entities/decision.entity';
import { Certificate } from './certificates/entities/certificate.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Payment } from './payments/entities/payment.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { OfficesModule } from './offices/offices.module';
import { InspectorsModule } from './inspectors/inspectors.module';
import { FormsModule } from './forms/forms.module';
import { ApplicationsModule } from './applications/applications.module';
import { InspectionsModule } from './inspections/inspections.module';
import { DecisionsModule } from './decisions/decisions.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [
          User, Institution, LicensingOffice, LicensingOfficer, 
          Inspector, InspectorJurisdiction, Form, FormField, 
          Application, ApplicationValue, Document, Query,
          InspectionAssignment, InspectionReport, Decision, 
          Certificate, AuditLog, Payment
        ],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Form,
      FormField,
      LicensingOffice,
      Institution,
      Inspector,
    ]),
    AuthModule,
    UsersModule,
    InstitutionsModule,
    OfficesModule,
    InspectorsModule,
    FormsModule,
    ApplicationsModule,
    InspectionsModule,
    DecisionsModule,
    CertificatesModule,
    NotificationsModule,
    AuditModule,
    CommonModule,
    AdminModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
