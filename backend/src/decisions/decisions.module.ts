import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionsService } from './decisions.service';
import { Decision } from './entities/decision.entity';
import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision, Application, AuditLog])
  ],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
