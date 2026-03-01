import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision, DecisionStatus } from './entities/decision.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(Decision)
    private decisionRepository: Repository<Decision>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async approve(applicationId: string, officerId: string, remarks: string) {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('Application not found');

    const decision = this.decisionRepository.create({
      application_id: applicationId,
      decision: DecisionStatus.APPROVED,
      remarks,
      decided_by: officerId,
    });

    await this.decisionRepository.save(decision);

    application.status = ApplicationStatus.APPROVED;
    await this.applicationRepository.save(application);

    await this.auditLogRepository.save({
      application_id: applicationId,
      action: 'APPLICATION_APPROVED',
      performed_by: officerId,
      remarks,
    });

    return decision;
  }
}
