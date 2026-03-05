import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { InspectionAssignment } from './entities/assignment.entity';
import { InspectionReport } from './entities/report.entity';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { InspectorsModule } from '../inspectors/inspectors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionAssignment, 
      InspectionReport, 
      Inspector, 
      Application, 
      AuditLog
    ]),
    InspectorsModule,
  ],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
