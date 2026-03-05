import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Inspector } from '../inspectors/entities/inspector.entity';
import { InspectorJurisdiction } from '../inspectors/entities/jurisdiction.entity';
import {
  InspectionAssignment,
  InspectionStatus,
} from '../inspections/entities/assignment.entity';
import { LicensingOffice, OfficeType } from '../offices/entities/office.entity';
import { ApprovalLevel, LicensingOfficer } from '../offices/entities/officer.entity';
import { Form } from '../forms/entities/form.entity';
import { FieldType, FormField } from '../forms/entities/field.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
    @InjectRepository(InspectorJurisdiction)
    private readonly jurisdictionRepository: Repository<InspectorJurisdiction>,
    @InjectRepository(InspectionAssignment)
    private readonly assignmentRepository: Repository<InspectionAssignment>,
    @InjectRepository(LicensingOffice)
    private readonly officeRepository: Repository<LicensingOffice>,
    @InjectRepository(LicensingOfficer)
    private readonly officerRepository: Repository<LicensingOfficer>,
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly certificatesService: CertificatesService,
  ) {}

  async getDashboardStats() {
    const [activeInspectors, licensingOffices, activeForms, pendingAssignments] =
      await Promise.all([
        this.inspectorRepository.count({ where: { active: true } }),
        this.officeRepository.count(),
        this.formRepository.count({ where: { active: true } }),
        this.assignmentRepository.count({
          where: { status: InspectionStatus.PENDING },
        }),
      ]);

    return {
      activeInspectors,
      licensingOffices,
      activeForms,
      pendingAssignments,
    };
  }

  async getInspectors() {
    const inspectors = await this.inspectorRepository.find({
      relations: ['user', 'jurisdictions'],
      order: { created_at: 'DESC' },
    });

    const inspectorsWithAssignments = await Promise.all(
      inspectors.map(async (inspector) => {
        const assignedCount = await this.assignmentRepository.count({
          where: {
            inspector_id: inspector.id,
            status: InspectionStatus.PENDING,
          },
        });

        return {
          id: inspector.id,
          name: inspector.user?.name || 'Unknown',
          email: inspector.user?.email || '',
          phone: inspector.user?.phone || '',
          district: inspector.user?.district || '',
          jurisdictions:
            inspector.jurisdictions?.map((j) => ({
              state: j.state,
              district: j.district,
              taluk: j.taluk,
            })) || [],
          assignedCount,
          isActive: inspector.active,
          employeeCode: inspector.employee_code,
        };
      }),
    );

    return inspectorsWithAssignments;
  }

  async toggleInspectorStatus(id: string) {
    const inspector = await this.inspectorRepository.findOne({ where: { id } });
    if (!inspector) {
      throw new NotFoundException('Inspector not found');
    }

    inspector.active = !inspector.active;
    const savedInspector = await this.inspectorRepository.save(inspector);

    return {
      id: savedInspector.id,
      isActive: savedInspector.active,
    };
  }

  async getUsers(role?: UserRole) {
    const where = role ? { role } : {};
    const users = await this.userRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      district: user.district,
      isActive: user.is_active,
      createdAt: user.created_at,
    }));
  }

  async createUser(payload: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    district?: string;
    password?: string;
    officeId?: string;
    employeeCode?: string;
    approvalLevel?: ApprovalLevel;
  }) {
    const existing = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const password = payload.password || 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      district: payload.district || '',
      is_active: true,
      password_hash: passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    if (payload.role === UserRole.INSPECTOR && payload.officeId) {
      await this.inspectorRepository.save(
        this.inspectorRepository.create({
          user_id: savedUser.id,
          office_id: payload.officeId,
          employee_code:
            payload.employeeCode || `INSP-${savedUser.id.slice(0, 6).toUpperCase()}`,
          active: true,
        }),
      );
    }

    if (payload.role === UserRole.OFFICER && payload.officeId) {
      await this.officerRepository.save(
        this.officerRepository.create({
          user_id: savedUser.id,
          office_id: payload.officeId,
          approval_level: payload.approvalLevel || ApprovalLevel.SCRUTINY,
          active: true,
        }),
      );
    }

    await this.auditLogRepository.save({
      entity_type: 'admin',
      entity_id: savedUser.id,
      action: 'ADMIN_USER_CREATED',
      performed_by: 'ADMIN',
      changes: { role: payload.role, email: payload.email },
      ip_address: '127.0.0.1',
    });

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      temporaryPassword: password,
    };
  }

  async setUserActiveStatus(id: string, isActive: boolean) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.is_active = isActive;
    await this.userRepository.save(user);

    return { id: user.id, isActive: user.is_active };
  }

  async resetUserPassword(id: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { id: user.id, message: 'Password reset successfully' };
  }

  async assignUserRole(id: string, role: UserRole) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.role = role;
    await this.userRepository.save(user);

    return { id: user.id, role: user.role };
  }

  async getInspectorJurisdictions() {
    const inspectors = await this.inspectorRepository.find({
      relations: ['user', 'jurisdictions'],
      order: { created_at: 'DESC' },
    });

    return inspectors.map((inspector) => ({
      inspectorId: inspector.id,
      inspectorName: inspector.user?.name || inspector.employee_code,
      employeeCode: inspector.employee_code,
      jurisdictions:
        inspector.jurisdictions?.map((item) => ({
          id: item.id,
          state: item.state,
          district: item.district,
          taluk: item.taluk,
        })) || [],
    }));
  }

  async updateInspectorJurisdictions(
    inspectorId: string,
    jurisdictions: Array<{ state: string; district: string; taluk?: string }>,
  ) {
    const inspector = await this.inspectorRepository.findOne({
      where: { id: inspectorId },
      relations: ['user'],
    });
    if (!inspector) throw new NotFoundException('Inspector not found');

    await this.jurisdictionRepository.delete({ inspector_id: inspectorId });

    const rows = jurisdictions.map((j) =>
      this.jurisdictionRepository.create({
        inspector_id: inspectorId,
        state: j.state,
        district: j.district,
        taluk: j.taluk || '',
      }),
    );

    await this.jurisdictionRepository.save(rows);

    return {
      inspectorId,
      inspectorName: inspector.user?.name || inspector.employee_code,
      jurisdictionsCount: rows.length,
    };
  }

  async getLicensingOffices() {
    const offices = await this.officeRepository.find({
      order: { office_name: 'ASC' },
    });

    return offices.map((office) => ({
      id: office.id,
      name: office.office_name,
      district: office.district,
      address: `${office.district}, ${office.state}`,
      contactNumber: '',
      email: '',
      officerId: '',
      officeType: office.office_type,
      state: office.state,
    }));
  }

  async createLicensingOffice(data: {
    name: string;
    district: string;
    state?: string;
    officeType?: OfficeType;
    parentOfficeId?: string;
  }) {
    const office = this.officeRepository.create({
      office_name: data.name,
      district: data.district,
      state: data.state || 'Maharashtra',
      office_type: data.officeType || OfficeType.DISTRICT,
      parent_office_id: data.parentOfficeId,
    });

    const savedOffice = await this.officeRepository.save(office);

    return {
      id: savedOffice.id,
      name: savedOffice.office_name,
      district: savedOffice.district,
      state: savedOffice.state,
      officeType: savedOffice.office_type,
    };
  }

  async updateLicensingOffice(
    id: string,
    data: {
      name?: string;
      district?: string;
      state?: string;
      officeType?: OfficeType;
      parentOfficeId?: string;
    },
  ) {
    const office = await this.officeRepository.findOne({ where: { id } });
    if (!office) throw new NotFoundException('Office not found');

    if (data.name) office.office_name = data.name;
    if (data.district) office.district = data.district;
    if (data.state) office.state = data.state;
    if (data.officeType) office.office_type = data.officeType;
    if (typeof data.parentOfficeId !== 'undefined') {
      office.parent_office_id = data.parentOfficeId;
    }

    const saved = await this.officeRepository.save(office);
    return {
      id: saved.id,
      name: saved.office_name,
      district: saved.district,
      state: saved.state,
      officeType: saved.office_type,
      parentOfficeId: saved.parent_office_id,
    };
  }

  async deleteLicensingOffice(id: string) {
    const office = await this.officeRepository.findOne({ where: { id } });
    if (!office) throw new NotFoundException('Office not found');
    await this.officeRepository.delete({ id });
    return { id, deleted: true };
  }

  async getForms() {
    const forms = await this.formRepository.find({
      relations: ['fields'],
      order: { form_code: 'ASC' },
    });

    return forms.map((form) => ({
      id: form.id,
      code: form.form_code,
      title: form.title,
      active: form.active,
      requiresInspection: form.requires_inspection,
      fieldCount: form.fields?.length || 0,
      updatedAt: form.updated_at,
    }));
  }

  async createForm(payload: {
    code: string;
    title: string;
    requiresInspection?: boolean;
    active?: boolean;
    fields?: Array<{
      label: string;
      fieldName: string;
      fieldType: FieldType;
      required?: boolean;
      validationRules?: any;
      orderIndex?: number;
    }>;
  }) {
    const form = this.formRepository.create({
      form_code: payload.code,
      title: payload.title,
      requires_inspection: payload.requiresInspection ?? false,
      active: payload.active ?? true,
    });

    const savedForm = await this.formRepository.save(form);

    if (payload.fields?.length) {
      const fields = payload.fields.map((f, idx) =>
        this.formFieldRepository.create({
          form_id: savedForm.id,
          label: f.label,
          field_name: f.fieldName,
          field_type: f.fieldType,
          required: f.required ?? false,
          validation_rules: f.validationRules || {},
          order_index: f.orderIndex ?? idx,
        }),
      );
      await this.formFieldRepository.save(fields);
    }

    return {
      id: savedForm.id,
      code: savedForm.form_code,
      title: savedForm.title,
      active: savedForm.active,
    };
  }

  async addFormField(
    formId: string,
    payload: {
      label: string;
      fieldName: string;
      fieldType: FieldType;
      required?: boolean;
      validationRules?: any;
      orderIndex?: number;
    },
  ) {
    const form = await this.formRepository.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');

    const field = this.formFieldRepository.create({
      form_id: formId,
      label: payload.label,
      field_name: payload.fieldName,
      field_type: payload.fieldType,
      required: payload.required ?? false,
      validation_rules: payload.validationRules || {},
      order_index: payload.orderIndex ?? 0,
    });

    const saved = await this.formFieldRepository.save(field);
    return {
      id: saved.id,
      formId: saved.form_id,
      label: saved.label,
      fieldName: saved.field_name,
      fieldType: saved.field_type,
      required: saved.required,
      validationRules: saved.validation_rules,
      orderIndex: saved.order_index,
    };
  }

  async updateFormField(
    fieldId: string,
    payload: {
      label?: string;
      required?: boolean;
      validationRules?: any;
      orderIndex?: number;
      fieldType?: FieldType;
    },
  ) {
    const field = await this.formFieldRepository.findOne({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Field not found');

    if (payload.label) field.label = payload.label;
    if (typeof payload.required !== 'undefined') field.required = payload.required;
    if (typeof payload.validationRules !== 'undefined') {
      field.validation_rules = payload.validationRules;
    }
    if (typeof payload.orderIndex !== 'undefined') field.order_index = payload.orderIndex;
    if (payload.fieldType) field.field_type = payload.fieldType;

    const saved = await this.formFieldRepository.save(field);
    return {
      id: saved.id,
      label: saved.label,
      required: saved.required,
      validationRules: saved.validation_rules,
      orderIndex: saved.order_index,
      fieldType: saved.field_type,
    };
  }

  async toggleFormActive(id: string) {
    const form = await this.formRepository.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    form.active = !form.active;
    const saved = await this.formRepository.save(form);
    return { id: saved.id, active: saved.active };
  }

  async getApplicationsForAdmin() {
    const applications = await this.applicationRepository.find({
      relations: ['institution', 'form'],
      order: { submitted_at: 'DESC' },
      take: 200,
    });

    return Promise.all(
      applications.map(async (application) => {
        const certificate = await this.certificateRepository.findOne({
          where: { application_id: application.id },
        });
        return {
          id: application.id,
          applicationNumber: application.application_number,
          institutionName: application.institution?.name || 'Unknown',
          formCode: application.form?.form_code || '',
          status: application.status,
          submittedAt: application.submitted_at,
          hasCertificate: !!certificate,
          certificateNumber: certificate?.certificate_number || null,
        };
      }),
    );
  }

  async approveAndIssueCertificate(applicationId: string, adminUserId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['institution', 'form'],
    });
    if (!application) throw new NotFoundException('Application not found');

    application.status = ApplicationStatus.APPROVED;
    application.current_stage = 'Approved by admin and certificate issued';
    await this.applicationRepository.save(application);

    const certificate = await this.certificatesService.issueForApplication(application);

    await this.auditLogRepository.save({
      entity_type: 'application',
      entity_id: application.id,
      action: 'ADMIN_APPROVED_AND_CERTIFICATE_ISSUED',
      performed_by: adminUserId,
      changes: {
        status: ApplicationStatus.APPROVED,
        certificateNumber: certificate.certificate_number,
      },
      ip_address: '127.0.0.1',
    });

    return {
      applicationId: application.id,
      status: application.status,
      certificateNumber: certificate.certificate_number,
      certificateUrl: certificate.pdf_url,
    };
  }

  async getComplianceOverview() {
    const now = new Date();

    const [
      totalApplications,
      pendingInspection,
      completedInspection,
      decisionPending,
      approvedApplications,
      overdueInspections,
    ] = await Promise.all([
      this.applicationRepository.count(),
      this.assignmentRepository.count({ where: { status: InspectionStatus.PENDING } }),
      this.assignmentRepository.count({ where: { status: InspectionStatus.COMPLETED } }),
      this.applicationRepository.count({
        where: { status: ApplicationStatus.DECISION_PENDING },
      }),
      this.applicationRepository.count({ where: { status: ApplicationStatus.APPROVED } }),
      this.assignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.status = :status', { status: InspectionStatus.PENDING })
        .andWhere('assignment.due_date IS NOT NULL')
        .andWhere('assignment.due_date < :now', { now })
        .getCount(),
    ]);

    return {
      totalApplications,
      pendingInspection,
      completedInspection,
      decisionPending,
      approvedApplications,
      overdueInspections,
    };
  }

  async getSystemLogs(page = 1, limit = 20) {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = logs.map((log) => ({
      id: log.id,
      userId: log.performed_by,
      userName: log.performed_by,
      action: log.action,
      module: log.action.split('_')[0]?.toLowerCase() || 'system',
      timestamp: log.created_at,
      ipAddress: '',
      details: log.metadata || {},
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
