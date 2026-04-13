import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto';
import { ApplicationValue } from './entities/value.entity';
import { Document } from './entities/document.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { LicensingOffice } from '../offices/entities/office.entity';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/field.entity';
import { InspectionAssignment, InspectionStatus } from '../inspections/entities/assignment.entity';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Decision, DecisionStatus } from '../decisions/entities/decision.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    @InjectRepository(ApplicationValue)
    private applicationValueRepository: Repository<ApplicationValue>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(LicensingOffice)
    private officeRepository: Repository<LicensingOffice>,
    @InjectRepository(Form)
    private formRepository: Repository<Form>,
    @InjectRepository(FormField)
    private formFieldRepository: Repository<FormField>,
    @InjectRepository(InspectionAssignment)
    private assignmentRepository: Repository<InspectionAssignment>,
    @InjectRepository(Inspector)
    private inspectorRepository: Repository<Inspector>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Decision)
    private decisionRepository: Repository<Decision>,
  ) {}

  private generateApplicationNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `APP-${timestamp}-${random}`;
  }

  private normalizeStatus(status: any): ApplicationStatus {
    if (!status) return ApplicationStatus.SUBMITTED;
    
    const statusStr = String(status).toUpperCase();
    
    // Map common variations
    if (statusStr === 'DRAFT') return ApplicationStatus.DRAFT;
    if (statusStr === 'SUBMITTED') return ApplicationStatus.SUBMITTED;
    if (statusStr === 'SCRUTINY'|| statusStr === 'UNDER_SCRUTINY') return ApplicationStatus.SCRUTINY;
    if (statusStr === 'CLARIFICATION' || statusStr === 'CLARIFICATION_REQUESTED') return ApplicationStatus.CLARIFICATION;
    if (statusStr === 'INSPECTION_ASSIGNED') return ApplicationStatus.INSPECTION_ASSIGNED;
    if (statusStr === 'INSPECTION_COMPLETED') return ApplicationStatus.INSPECTION_COMPLETED;
    if (statusStr === 'DECISION_PENDING') return ApplicationStatus.DECISION_PENDING;
    if (statusStr === 'APPROVED') return ApplicationStatus.APPROVED;
    if (statusStr === 'REJECTED') return ApplicationStatus.REJECTED;
    
    return ApplicationStatus.SUBMITTED;
  }

  async create(
    createDto: CreateApplicationDto,
    userId: string,
    institutionId?: string,
  ): Promise<Application> {
    let resolvedInstitutionId = institutionId;

    if (!resolvedInstitutionId && userId) {
      const institution = await this.institutionRepository.findOne({
        where: { user_id: userId },
      });
      resolvedInstitutionId = institution?.id;
    }

    if (!resolvedInstitutionId) {
      throw new NotFoundException('Institution not found for user');
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        createDto.formId,
      );

    const form = isUuid
      ? await this.formRepository.findOne({
          where: { id: createDto.formId },
        })
      : await this.formRepository.findOne({
          where: { form_code: createDto.formId, active: true },
        });

    if (!form) {
      throw new NotFoundException(
        `Form not found for id/code: ${createDto.formId}`,
      );
    }

    const institution = await this.institutionRepository.findOne({
      where: { id: resolvedInstitutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institution details not found');
    }

    // Assign office dynamically by district first, otherwise fallback to first office
    let assignedOffice = await this.officeRepository.findOne({
      where: { district: institution.district },
      order: { created_at: 'ASC' },
    });

    if (!assignedOffice) {
      assignedOffice = await this.officeRepository.findOne({
        order: { created_at: 'ASC' },
      });
    }

    if (!assignedOffice) {
      throw new NotFoundException('No licensing office configured in system');
    }

    const application = this.applicationsRepository.create({
      application_number: this.generateApplicationNumber(),
      form_id: form.id,
      institution_id: resolvedInstitutionId,
      office_id: assignedOffice.id,
      status: this.normalizeStatus(createDto.status) || ApplicationStatus.SUBMITTED,
      submitted_at: new Date(),
    });

    const savedApplication =
      await this.applicationsRepository.save(application);

    // Save form data as application values
    console.log('📝 Creating application - formData received:', createDto.formData ? Object.keys(createDto.formData).length + ' fields' : 'NO FORMDATA');
    
    if (createDto.formData && Object.keys(createDto.formData).length > 0) {
      // Fetch all fields for this form to map field_name to field_id (UUID)
      const formFields = await this.formFieldRepository.find({
        where: { form_id: form.id },
      });
      
      // Create a map: field_name => field.id
      const fieldMap = new Map<string, string>();
      formFields.forEach(field => {
        fieldMap.set(field.field_name, field.id);
      });
      
      console.log('📋 Found', formFields.length, 'fields in form. Field names:', Array.from(fieldMap.keys()));
      
      const values = Object.entries(createDto.formData)
        .map(([fieldName, value]) => {
          const fieldId = fieldMap.get(fieldName);
          
          if (!fieldId) {
            console.warn(`⚠️ Field "${fieldName}" not found in form fields. Skipping.`);
            return null;
          }
          
          return this.applicationValueRepository.create({
            application_id: savedApplication.id,
            field_id: fieldId, // Use the UUID instead of field_name
            value_text: typeof value === 'object' ? JSON.stringify(value) : String(value),
          });
        })
        .filter(v => v !== null); // Remove null entries
      
      console.log('💾 Saving', values.length, 'application values for application:', savedApplication.id);
      await this.applicationValueRepository.save(values);
      console.log('✅ Successfully saved application values');
    } else {
      console.warn('⚠️ No formData provided in createDto');
    }

    // Create initial timeline event
    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: savedApplication.id,
      action: 'created',
      performed_by: userId,
      changes: {
        status: createDto.status || ApplicationStatus.SUBMITTED,
        formId: createDto.formId,
      },
      ip_address: '127.0.0.1',
    });

    return this.findOne(savedApplication.id) as Promise<Application>;
  }

  async update(
    id: string,
    updateDto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.findOne(id);
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    if (updateDto.status) {
      application.status = updateDto.status;
    }

    // TODO: Update form data values when form field IDs are available

    await this.applicationsRepository.save(application);
    return this.findOne(id) as Promise<Application>;
  }

  async submit(id: string): Promise<Application> {
    const application = await this.findOne(id);
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    application.status = ApplicationStatus.SUBMITTED;
    application.submitted_at = new Date();

    await this.applicationsRepository.save(application);
    
    // Create timeline event for submission
    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: id,
      action: 'submitted',
      performed_by: application.institution_id,
      changes: {
        status: ApplicationStatus.SUBMITTED,
      },
      ip_address: '127.0.0.1',
    });
    
    return this.findOne(id) as Promise<Application>;
  }

  async findAll(query?: {
    status?: ApplicationStatus[];
    institutionId?: string;
    officeId?: string;
  }): Promise<Application[]> {
    const queryBuilder = this.applicationsRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.institution', 'institution')
      .leftJoinAndSelect('application.form', 'form')
      .leftJoinAndSelect('application.office', 'office')
      .leftJoinAndSelect('application.values', 'values')
      .orderBy('application.submitted_at', 'DESC');

    if (query?.status && query.status.length > 0) {
      queryBuilder.andWhere('application.status IN (:...statuses)', {
        statuses: query.status,
      });
    }

    if (query?.institutionId) {
      queryBuilder.andWhere('application.institution_id = :institutionId', {
        institutionId: query.institutionId,
      });
    }

    if (query?.officeId) {
      queryBuilder.andWhere('application.office_id = :officeId', {
        officeId: query.officeId,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Application | null> {
    return this.applicationsRepository.findOne({
      where: { id },
      relations: ['institution', 'form', 'office', 'values', 'documents'],
    });
  }

  async getLatestInspectionDetails(applicationId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { application_id: applicationId },
      relations: ['inspector', 'inspector.user', 'report'],
      order: { assigned_at: 'DESC' },
    });

    if (!assignment) {
      return null;
    }

    const report = assignment.report;

    return {
      assignmentId: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assigned_at,
      dueDate: assignment.due_date,
      specialInstructions: assignment.special_instructions,
      inspector: {
        id: assignment.inspector?.id,
        userId: assignment.inspector?.user_id,
        name: assignment.inspector?.user?.name || null,
        employeeCode: assignment.inspector?.employee_code || null,
      },
      report: report
        ? {
            id: report.id,
            checklistItems: report.checklist_items || [],
            observations: report.observations || '',
            recommendation: report.recommendation || null,
            complianceStatus: report.compliance_status || null,
            inspectionDate: report.inspection_date,
            submittedAt: report.submitted_at,
            photos: report.photos || [],
          }
        : null,
    };
  }

  async getStats(filters?: { officeId?: string }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const queryBuilder =
      this.applicationsRepository.createQueryBuilder('application');

    if (filters?.officeId) {
      queryBuilder.where('application.office_id = :officeId', {
        officeId: filters.officeId,
      });
    }

    const [total, pending, approved, rejected] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('application.status IN (:...statuses)', {
          statuses: [
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.SCRUTINY,
            ApplicationStatus.CLARIFICATION,
            ApplicationStatus.INSPECTION_ASSIGNED,
            ApplicationStatus.INSPECTION_COMPLETED,
            ApplicationStatus.DECISION_PENDING,
          ],
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('application.status = :status', {
          status: ApplicationStatus.APPROVED,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('application.status = :status', {
          status: ApplicationStatus.REJECTED,
        })
        .getCount(),
    ]);

    return { total, pending, approved, rejected };
  }

  async requestClarification(
    id: string,
    remarks: string,
  ): Promise<Application> {
    const application = await this.findOne(id);
    if (!application) {
      throw new Error(`Application with ID ${id} not found`);
    }
    application.status = ApplicationStatus.CLARIFICATION;
    application.current_stage = remarks || 'Clarification requested';
    
    await this.applicationsRepository.save(application);
    
    // Create timeline event
    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: id,
      action: 'clarification_requested',
      performed_by: application.office_id,
      changes: {
        remarks,
        status: ApplicationStatus.CLARIFICATION,
      },
      ip_address: '127.0.0.1',
    });
    
    return application;
  }

  async respondToClarification(
    id: string,
    response: string,
    performedBy?: string,
  ): Promise<Application> {
    const application = await this.findOne(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    application.status = ApplicationStatus.SUBMITTED;
    application.current_stage = response || 'Clarification submitted';

    const updated = await this.applicationsRepository.save(application);

    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: id,
      action: 'clarification_responded',
      performed_by: performedBy || 'UNKNOWN',
      changes: {
        response,
        status: ApplicationStatus.SUBMITTED,
      },
      ip_address: '127.0.0.1',
    });

    return updated;
  }

  async assignInspector(
    id: string,
    inspectorId: string,
    scheduledDate: string,
    performedBy?: string,
    specialInstructions?: string,
    documentsToVerify?: Array<{ id: string; name: string; url: string; type: string; needsVerification?: boolean }>,
  ): Promise<Application> {
    const application = await this.findOne(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    const inspector = await this.inspectorRepository.findOne({
      where: { id: inspectorId },
      relations: ['user'],
    });

    if (!inspector) {
      throw new NotFoundException(`Inspector with ID ${inspectorId} not found`);
    }

    // Get all documents if documents to verify are specified
    const allDocuments = application.documents || [];
    const rawDocumentsForInspector = documentsToVerify && documentsToVerify.length > 0
      ? documentsToVerify
      : allDocuments.map(doc => ({
          id: doc.id,
          name: doc.document_type,
          url: doc.file_url,
          type: doc.mime_type,
          needsVerification: false,
        }));

    const documentsForInspector = rawDocumentsForInspector
      .map((doc: any) => ({
        id: doc.id,
        name: doc.name || doc.document_type || 'Document',
        url: doc.url || doc.file_url || '',
        type: doc.type || doc.mime_type || 'application/octet-stream',
        needsVerification: !!doc.needsVerification,
      }))
      .filter((doc) => !!doc.url);

    const existingAssignment = await this.assignmentRepository.findOne({
      where: { application_id: id },
    });

    const dueDate = scheduledDate ? new Date(scheduledDate) : undefined;

    if (existingAssignment) {
      existingAssignment.inspector_id = inspectorId;
      if (dueDate) {
        existingAssignment.due_date = dueDate;
      }
      existingAssignment.status = InspectionStatus.PENDING;
      existingAssignment.special_instructions = specialInstructions || '';
      existingAssignment.documents_to_verify = documentsForInspector;
      await this.assignmentRepository.save(existingAssignment);
      console.log('✅ Updated existing assignment with documents:', documentsForInspector.length);
    } else {
      const assignment = this.assignmentRepository.create({
        application_id: id,
        inspector_id: inspectorId,
        ...(dueDate ? { due_date: dueDate } : {}),
        status: InspectionStatus.PENDING,
        special_instructions: specialInstructions || '',
        documents_to_verify: documentsForInspector,
      });

      await this.assignmentRepository.save(assignment);
      console.log('✅ Created new assignment with documents:', documentsForInspector.length);
    }

    application.status = ApplicationStatus.INSPECTION_ASSIGNED;
    application.current_stage = `Inspector assigned: ${inspector.user?.name || inspector.employee_code}`;

    const updated = await this.applicationsRepository.save(application);

    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: id,
      action: 'inspection_assigned',
      performed_by: performedBy || 'UNKNOWN',
      changes: {
        inspectorId,
        inspectorName: inspector.user?.name || inspector.employee_code,
        scheduledDate,
        status: ApplicationStatus.INSPECTION_ASSIGNED,
        documentsCount: documentsForInspector.length,
        hasSpecialInstructions: !!specialInstructions,
      },
      ip_address: '127.0.0.1',
    });

    console.log('📧 Inspector assignment completed:', {
      inspector: inspector.user?.name || inspector.employee_code,
      documents: documentsForInspector.length,
      dueDate: scheduledDate,
    });

    return updated;
  }

  async makeDecision(
    id: string,
    decision: 'approved' | 'rejected',
    remarks: string,
    performedBy?: string,
  ): Promise<Application> {
    const application = await this.findOne(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    const decisionEnum =
      decision === 'approved' ? DecisionStatus.APPROVED : DecisionStatus.REJECTED;

    await this.decisionRepository.save(
      this.decisionRepository.create({
        application_id: id,
        decision: decisionEnum,
        remarks: remarks || '',
        decided_by: performedBy || 'UNKNOWN',
      }),
    );

    application.status =
      decision === 'approved'
        ? ApplicationStatus.APPROVED
        : ApplicationStatus.REJECTED;
    application.current_stage = remarks || `Application ${decision}`;

    const updated = await this.applicationsRepository.save(application);

    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: id,
      action: decision === 'approved' ? 'approved' : 'rejected',
      performed_by: performedBy || 'UNKNOWN',
      changes: {
        decision,
        remarks,
        status: application.status,
      },
      ip_address: '127.0.0.1',
    });

    return updated;
  }

  async saveDraft(id: string, formData: Record<string, any>): Promise<Application> {
    const application = await this.findOne(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    application.status = ApplicationStatus.SUBMITTED;
    application.current_stage = formData
      ? `Draft saved with ${Object.keys(formData).length} fields`
      : 'Draft saved';

    return this.applicationsRepository.save(application);
  }

  async deleteApplication(id: string): Promise<void> {
    const application = await this.findOne(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Only allow deleting draft applications
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new Error('Only draft applications can be deleted');
    }

    await this.applicationsRepository.delete(id);
  }

  async getAvailableInspectors() {
    const inspectors = await this.inspectorRepository.find({
      where: { active: true },
      relations: ['user', 'jurisdictions'],
      order: { created_at: 'DESC' },
    });

    console.log('🔍 Found inspectors:', inspectors.length);
    inspectors.forEach(i => {
      console.log(`  - ${i.id}: ${i.user?.name || i.employee_code} (active: ${i.active})`);
    });

    const withWorkload = await Promise.all(
      inspectors.map(async (inspector) => {
        const workload = await this.assignmentRepository.count({
          where: {
            inspector_id: inspector.id,
            status: InspectionStatus.PENDING,
          },
        });

        return {
          id: inspector.id,
          name: inspector.user?.name || inspector.employee_code,
          district:
            inspector.jurisdictions?.[0]?.district ||
            inspector.user?.district ||
            '',
          workload,
        };
      }),
    );

    console.log('📊 Inspectors with workload:', withWorkload);
    return withWorkload;
  }

  /**
   * Add document to application
   */
  async addDocument(
    applicationId: string,
    documentType: string,
    fileUrl: string,
    fileSize?: number,
    mimeType?: string,
  ): Promise<Document> {
    const application = await this.findOne(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const document = this.documentRepository.create({
      application_id: applicationId,
      document_type: documentType,
      file_url: fileUrl,
      file_size: fileSize,
      mime_type: mimeType,
      uploaded_at: new Date(),
    });

    return await this.documentRepository.save(document);
  }

  /**
   * Get all documents for an application
   */
  async getDocuments(applicationId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { application_id: applicationId },
      order: { uploaded_at: 'DESC' },
    });
  }

  /**
   * Get timeline events for an application
   */
  async getTimeline(applicationId: string): Promise<any[]> {
    const auditLogs = await this.auditLogRepository.find({
      where: { 
        entity_type: 'application',
        entity_id: applicationId 
      },
      order: { created_at: 'ASC' },
    });

    return auditLogs.map(log => ({
      id: log.id,
      title: this.formatTimelineTitle(log.action),
      description: this.formatTimelineDescription(log.action, log.changes),
      status: this.mapActionToStatus(log.action),
      timestamp: log.created_at,
      actor: {
        name: 'System User',
        role: 'system',
      },
      metadata: log.changes,
    }));
  }

  private formatTimelineTitle(action: string): string {
    const titles: Record<string, string> = {
      'created': 'Application Created',
      'submitted': 'Application Submitted',
      'under_scrutiny': 'Under Review',
      'clarification_requested': 'Clarification Requested',
      'inspection_assigned': 'Inspector Assigned',
      'inspection_completed': 'Inspection Completed',
      'approved': 'Application Approved',
      'rejected': 'Application Rejected',
    };
    return titles[action] || action.replace(/_/g, ' ').toUpperCase();
  }

  private formatTimelineDescription(action: string, changes: any): string {
    const descriptions: Record<string, string> = {
      'created': 'Application draft created',
      'submitted': 'Application submitted for review',
      'under_scrutiny': 'Application is being reviewed by licensing officer',
      'clarification_requested': 'Officer has requested additional information',
      'inspection_assigned': 'Inspector assigned for site visit',
      'inspection_completed': 'Site inspection completed',
      'approved': 'Application has been approved',
      'rejected': 'Application has been rejected',
    };
    return descriptions[action] || `Status changed to ${action}`;
  }

  private mapActionToStatus(action: string): string {
    const statusMap: Record<string, string> = {
      'created': 'draft',
      'submitted': 'submitted',
      'under_scrutiny': 'under_scrutiny',
      'clarification_requested': 'clarification_requested',
      'inspection_assigned': 'inspection_assigned',
      'inspection_completed': 'inspection_completed',
      'approved': 'approved',
      'rejected': 'rejected',
    };
    return statusMap[action] || 'submitted';
  }
}
