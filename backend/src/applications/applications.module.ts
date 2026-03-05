import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { WorkflowService } from './workflow.service';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { Application } from './entities/application.entity';
import { ApplicationValue } from './entities/value.entity';
import { Document } from './entities/document.entity';
import { Query } from './entities/query.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { LicensingOffice } from '../offices/entities/office.entity';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/field.entity';
import { InspectionAssignment } from '../inspections/entities/assignment.entity';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Decision } from '../decisions/entities/decision.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      ApplicationValue,
      Document,
      Query,
      Institution,
      LicensingOffice,
      Form,
      FormField,
      InspectionAssignment,
      Inspector,
      AuditLog,
      Decision,
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [ApplicationsController],
  providers: [WorkflowService, ApplicationsService],
  exports: [WorkflowService, ApplicationsService],
})
export class ApplicationsModule {}
