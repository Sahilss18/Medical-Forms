import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { InspectionAssignment, InspectionStatus } from './entities/assignment.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionAssignment)
    private assignmentRepository: Repository<InspectionAssignment>,
    @InjectRepository(Inspector)
    private inspectorRepository: Repository<Inspector>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async autoAssignInspector(applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['institution'],
    });

    if (!application) throw new NotFoundException('Application not found');

    const district = application.institution.district;

    // Find active inspectors mapped to the institution's district
    const availableInspectors = await this.inspectorRepository
      .createQueryBuilder('inspector')
      .leftJoinAndSelect('inspector.jurisdictions', 'jurisdiction')
      .where('inspector.active = :active', { active: true })
      .andWhere('jurisdiction.district = :district', { district })
      .getMany();

    if (availableInspectors.length === 0) {
      throw new BadRequestException(`No active inspectors found for district: ${district}`);
    }

    // Round-robin or least workload: Find inspector with least pending assignments
    const inspectorWorkloads = await Promise.all(
      availableInspectors.map(async (inspector) => {
        const count = await this.assignmentRepository.count({
          where: { inspector_id: inspector.id, status: InspectionStatus.PENDING },
        });
        return { inspector, count };
      }),
    );

    const bestInspector = inspectorWorkloads.sort((a, b) => a.count - b.count)[0].inspector;

    const assignment = this.assignmentRepository.create({
      application_id: applicationId,
      inspector_id: bestInspector.id,
      status: InspectionStatus.PENDING,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    await this.assignmentRepository.save(assignment);

    // Update Application Status
    application.status = ApplicationStatus.INSPECTION_ASSIGNED;
    await this.applicationRepository.save(application);

    // Audit Log
    await this.auditLogRepository.save({
      application_id: applicationId,
      action: 'INSPECTOR_AUTO_ASSIGNED',
      performed_by: 'SYSTEM',
      remarks: `Assigned to ${bestInspector.employee_code} based on workload`,
    });

    return assignment;
  }
}
