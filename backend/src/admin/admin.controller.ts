import {
  Body,
  Controller,
  Delete,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApprovalLevel } from '../offices/entities/officer.entity';
import { FieldType } from '../forms/entities/field.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OfficeType } from '../offices/entities/office.entity';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('inspectors')
  getInspectors() {
    return this.adminService.getInspectors();
  }

  @Get('users')
  getUsers(@Query('role') role?: UserRole) {
    return this.adminService.getUsers(role);
  }

  @Post('users')
  createUser(
    @Body()
    body: {
      name: string;
      email: string;
      phone: string;
      role: UserRole;
      district?: string;
      password?: string;
      officeId?: string;
      employeeCode?: string;
      approvalLevel?: ApprovalLevel;
    },
  ) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id/active')
  setUserActiveStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.setUserActiveStatus(id, isActive);
  }

  @Patch('users/:id/reset-password')
  resetUserPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.adminService.resetUserPassword(id, newPassword);
  }

  @Patch('users/:id/role')
  assignUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.assignUserRole(id, role);
  }

  @Get('jurisdictions/inspectors')
  getInspectorJurisdictions() {
    return this.adminService.getInspectorJurisdictions();
  }

  @Put('inspectors/:id/jurisdictions')
  updateInspectorJurisdictions(
    @Param('id') inspectorId: string,
    @Body('jurisdictions')
    jurisdictions: Array<{ state: string; district: string; taluk?: string }>,
  ) {
    return this.adminService.updateInspectorJurisdictions(
      inspectorId,
      jurisdictions || [],
    );
  }

  @Patch('inspectors/:id/toggle-status')
  toggleInspectorStatus(@Param('id') id: string) {
    return this.adminService.toggleInspectorStatus(id);
  }

  @Get('licensing-offices')
  getLicensingOffices() {
    return this.adminService.getLicensingOffices();
  }

  @Post('licensing-offices')
  createLicensingOffice(
    @Body()
    body: {
      name: string;
      district: string;
      state?: string;
      officeType?: OfficeType;
      parentOfficeId?: string;
    },
  ) {
    return this.adminService.createLicensingOffice(body);
  }

  @Put('licensing-offices/:id')
  updateLicensingOffice(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      district?: string;
      state?: string;
      officeType?: OfficeType;
      parentOfficeId?: string;
    },
  ) {
    return this.adminService.updateLicensingOffice(id, body);
  }

  @Delete('licensing-offices/:id')
  deleteLicensingOffice(@Param('id') id: string) {
    return this.adminService.deleteLicensingOffice(id);
  }

  @Get('forms')
  getForms() {
    return this.adminService.getForms();
  }

  @Post('forms')
  createForm(
    @Body()
    body: {
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
    },
  ) {
    return this.adminService.createForm(body);
  }

  @Post('forms/:id/fields')
  addFormField(
    @Param('id') formId: string,
    @Body()
    body: {
      label: string;
      fieldName: string;
      fieldType: FieldType;
      required?: boolean;
      validationRules?: any;
      orderIndex?: number;
    },
  ) {
    return this.adminService.addFormField(formId, body);
  }

  @Patch('forms/fields/:fieldId')
  updateFormField(
    @Param('fieldId') fieldId: string,
    @Body()
    body: {
      label?: string;
      required?: boolean;
      validationRules?: any;
      orderIndex?: number;
      fieldType?: FieldType;
    },
  ) {
    return this.adminService.updateFormField(fieldId, body);
  }

  @Patch('forms/:id/toggle-active')
  toggleFormActive(@Param('id') id: string) {
    return this.adminService.toggleFormActive(id);
  }

  @Get('applications')
  getApplicationsForAdmin() {
    return this.adminService.getApplicationsForAdmin();
  }

  @Post('applications/:id/approve-issue-certificate')
  approveAndIssueCertificate(@Param('id') id: string, @Req() req: any) {
    return this.adminService.approveAndIssueCertificate(id, req.user.userId);
  }

  @Get('compliance/overview')
  getComplianceOverview() {
    return this.adminService.getComplianceOverview();
  }

  @Get('logs')
  getSystemLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getSystemLogs(page, limit);
  }
}
