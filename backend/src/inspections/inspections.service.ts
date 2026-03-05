import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { InspectionAssignment, InspectionStatus } from './entities/assignment.entity';
import {
  ComplianceStatus,
  InspectionReport,
} from './entities/report.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { InspectorsService } from '../inspectors/inspectors.service';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionAssignment)
    private assignmentRepository: Repository<InspectionAssignment>,
    @InjectRepository(InspectionReport)
    private reportRepository: Repository<InspectionReport>,
    @InjectRepository(Inspector)
    private inspectorRepository: Repository<Inspector>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private inspectorsService: InspectorsService,
  ) {}

  private async getInspectorByUserId(userId: string): Promise<Inspector> {
    // Use InspectorsService to find or create inspector profile
    const inspector = await this.inspectorsService.findOrCreateInspectorProfile(userId);
    return inspector;
  }

  private mapAssignmentStatus(
    assignment: InspectionAssignment,
  ): 'assigned' | 'in_progress' | 'completed' {
    if (assignment.status === InspectionStatus.COMPLETED) {
      return 'completed';
    }

    if (assignment.status === InspectionStatus.IN_PROGRESS) {
      return 'in_progress';
    }

    return 'assigned';
  }

  async getAssignedInspections(userId: string) {
    const inspector = await this.getInspectorByUserId(userId);

    const assignments = await this.assignmentRepository.find({
      where: { inspector_id: inspector.id },
      relations: ['application', 'application.institution', 'report'],
      order: { assigned_at: 'DESC' },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      applicationId:
        assignment.application?.application_number || assignment.application?.id,
      inspectorId: inspector.id,
      inspectorName: inspector.user?.name || 'Inspector',
      institutionName:
        assignment.application?.institution?.name || 'Unknown',
      district: assignment.application?.institution?.district || '',
      scheduledDate: assignment.due_date || assignment.assigned_at,
      completedDate: assignment.report?.submitted_at,
      status: this.mapAssignmentStatus(assignment),
    }));
  }

  async getInspectionById(id: string, userId: string) {
    const inspector = await this.getInspectorByUserId(userId);

    const assignment = await this.assignmentRepository.findOne({
      where: { id, inspector_id: inspector.id },
      relations: ['application', 'application.institution', 'application.documents', 'report'],
    });

    if (!assignment) {
      throw new NotFoundException('Inspection assignment not found');
    }

    const assignmentDocuments = Array.isArray(assignment.documents_to_verify)
      ? assignment.documents_to_verify
      : [];

    const fallbackDocuments = Array.isArray(assignment.application?.documents)
      ? assignment.application.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.document_type,
          url: doc.file_url,
          type: doc.mime_type || 'application/octet-stream',
          needsVerification: false,
        }))
      : [];

    const documentsToVerify = (assignmentDocuments.length > 0
      ? assignmentDocuments
      : fallbackDocuments).filter((doc: any) => !!doc?.url);

    return {
      id: assignment.id,
      applicationId:
        assignment.application?.application_number || assignment.application?.id,
      inspectorId: inspector.id,
      inspectorName: inspector.user?.name || 'Inspector',
      institutionName:
        assignment.application?.institution?.name || 'Unknown',
      district: assignment.application?.institution?.district || '',
      scheduledDate: assignment.due_date || assignment.assigned_at,
      completedDate: assignment.report?.submitted_at,
      status: this.mapAssignmentStatus(assignment),
      contactPerson:
        assignment.application?.institution?.contact_person ||
        'N/A',
      contactPhone: assignment.application?.institution?.contact_phone || 'N/A',
      specialInstructions: assignment.special_instructions || null,
      documentsToVerify,
    };
  }

  async submitInspectionReport(
    id: string,
    userId: string,
    payload: {
      checklistItems: Array<{
        id: string;
        label: string;
        status: 'compliant' | 'non_compliant' | 'not_applicable';
        remarks?: string;
      }>;
      observations: string;
      recommendation: 'approve' | 'reject' | 'clarification';
      inspectionDate?: string;
      photos?: Array<{
        name: string;
        url: string;
        size: number;
        uploadedAt: string;
        description?: string;
      }>;
    },
  ) {
    const inspector = await this.getInspectorByUserId(userId);

    const assignment = await this.assignmentRepository.findOne({
      where: { id, inspector_id: inspector.id },
      relations: ['application'],
    });

    if (!assignment) {
      throw new NotFoundException('Inspection assignment not found');
    }

    const complianceStatusMap: Record<
      'approve' | 'reject' | 'clarification',
      ComplianceStatus
    > = {
      approve: ComplianceStatus.COMPLIANT,
      reject: ComplianceStatus.NON_COMPLIANT,
      clarification: ComplianceStatus.PARTIALLY_COMPLIANT,
    };

    const normalizedRecommendation =
      payload.recommendation === 'approve' ||
      payload.recommendation === 'reject' ||
      payload.recommendation === 'clarification'
        ? payload.recommendation
        : 'clarification';

    const reportPayload = {
      checklistItems: payload.checklistItems,
      observations: payload.observations,
      recommendation: normalizedRecommendation,
    };

    let report = await this.reportRepository.findOne({
      where: { inspection_id: assignment.id },
    });

    if (!report) {
      report = this.reportRepository.create({
        inspection_id: assignment.id,
        checklist_items: payload.checklistItems,
        observations: payload.observations,
        recommendation: normalizedRecommendation,
        inspection_date: payload.inspectionDate ? new Date(payload.inspectionDate) : new Date(),
        compliance_status: complianceStatusMap[normalizedRecommendation],
        photos: payload.photos || [],
        report_text: JSON.stringify(reportPayload), // Keep for backward compatibility
        photos_url: '',
      } as Partial<InspectionReport>);
      console.log('✅ Created new inspection report with structured data');
    } else {
      report.checklist_items = payload.checklistItems;
      report.observations = payload.observations;
      report.recommendation = normalizedRecommendation;
      report.inspection_date = payload.inspectionDate ? new Date(payload.inspectionDate) : report.inspection_date;
      report.compliance_status = complianceStatusMap[normalizedRecommendation];
      if (payload.photos) {
        report.photos = payload.photos;
      }
      report.report_text = JSON.stringify(reportPayload); // Keep for backward compatibility
      console.log('✅ Updated inspection report with structured data');
    }

    const savedReport = await this.reportRepository.save(report);
    console.log(`📊 Report saved with ${payload.checklistItems.length} checklist items`);

    assignment.status = InspectionStatus.COMPLETED;
    await this.assignmentRepository.save(assignment);

    if (assignment.application) {
      assignment.application.status = ApplicationStatus.INSPECTION_COMPLETED;
      await this.applicationRepository.save(assignment.application);
      console.log(`✅ Application ${assignment.application_id} marked as INSPECTION_COMPLETED`);
    }

    await this.auditLogRepository.save({
      application_id: assignment.application_id,
      action: 'INSPECTION_REPORT_SUBMITTED',
      performed_by: userId,
      remarks: `Inspection report submitted for assignment ${assignment.id}`,
      metadata: reportPayload,
    });

    return {
      id: savedReport.id,
      inspectionId: assignment.id,
      checklistItems: savedReport.checklist_items || payload.checklistItems,
      observations: savedReport.observations,
      recommendation: savedReport.recommendation || normalizedRecommendation,
      inspectionDate: savedReport.inspection_date,
      photos: savedReport.photos || [],
      submittedAt: savedReport.submitted_at,
    };
  }

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

  async getInspectionReport(inspectionId: string, userId: string) {
    const inspector = await this.getInspectorByUserId(userId);

    const assignment = await this.assignmentRepository.findOne({
      where: { id: inspectionId, inspector_id: inspector.id },
      relations: ['application', 'application.institution'],
    });

    if (!assignment) {
      throw new NotFoundException('Inspection assignment not found');
    }

    const report = await this.reportRepository.findOne({
      where: { inspection_id: assignment.id },
    });

    if (!report) {
      return {
        inspectionId: assignment.id,
        applicationId: assignment.application_id,
        institutionName: assignment.application.institution.name,
        checklistItems: [],
        observations: '',
        recommendation: 'clarification',
        inspectionDate: null,
        complianceStatus: null,
        photos: [],
        submittedAt: null,
      };
    }

    return {
      id: report.id,
      inspectionId: assignment.id,
      applicationId: assignment.application_id,
      institutionName: assignment.application.institution.name,
      checklistItems: report.checklist_items || [],
      observations: report.observations,
      recommendation: report.recommendation,
      inspectionDate: report.inspection_date,
      complianceStatus: report.compliance_status,
      photos: report.photos || [],
      submittedAt: report.submitted_at,
    };
  }

  async startInspection(id: string, userId: string) {
    const inspector = await this.getInspectorByUserId(userId);

    const assignment = await this.assignmentRepository.findOne({
      where: { id, inspector_id: inspector.id },
      relations: ['application'],
    });

    if (!assignment) {
      throw new NotFoundException('Inspection assignment not found');
    }

    if (assignment.status !== InspectionStatus.PENDING) {
      throw new BadRequestException(
        `Inspection is already ${assignment.status.toLowerCase()}`
      );
    }

    assignment.status = InspectionStatus.IN_PROGRESS;
    await this.assignmentRepository.save(assignment);

    await this.auditLogRepository.save({
      application_id: assignment.application_id,
      action: 'INSPECTION_STARTED',
      performed_by: userId,
      remarks: `Inspector started field inspection for assignment ${assignment.id}`,
    });

    console.log(`✅ Inspection ${id} started by inspector ${inspector.employee_code}`);

    return {
      id: assignment.id,
      status: 'in_progress',
      message: 'Inspection started successfully',
    };
  }
}
