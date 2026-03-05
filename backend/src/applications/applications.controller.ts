import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './entities/application.entity';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  private normalizeStatus(value: string): ApplicationStatus | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toUpperCase();
    const aliasMap: Record<string, ApplicationStatus> = {
      UNDER_SCRUTINY: ApplicationStatus.SCRUTINY,
      CLARIFICATION_REQUESTED: ApplicationStatus.CLARIFICATION,
      CLARIFICATION_REQUIRED: ApplicationStatus.CLARIFICATION,
    };

    const mapped = aliasMap[normalized] ?? normalized;

    return Object.values(ApplicationStatus).includes(mapped as ApplicationStatus)
      ? (mapped as ApplicationStatus)
      : null;
  }

  @Get()
  async findAll(
    @Query('status') status?: string | string[],
    @Query('institutionId') institutionId?: string,
    @Req() req?: any,
  ) {
    // Convert status query param to array
    const statusArray = status
      ? Array.isArray(status)
        ? status
        : [status]
      : undefined;

    const query: any = {};

    if (statusArray) {
      const normalizedStatuses = statusArray
        .map((s) => this.normalizeStatus(s))
        .filter((s): s is ApplicationStatus => Boolean(s));

      if (normalizedStatuses.length > 0) {
        query.status = normalizedStatuses;
      }
    }

    if (institutionId) {
      query.institutionId = institutionId;
    }

    // If user is an applicant, only show their institution's applications
    if (req?.user?.role === 'APPLICANT' && req?.user?.institutionId) {
      query.institutionId = req.user.institutionId;
    }

    // If user is an officer, only show applications for their office
    if (req?.user?.role === 'OFFICER' && req?.user?.officeId) {
      query.officeId = req.user.officeId;
    }

    return this.applicationsService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getStats(@Req() req: any) {
    const filters: any = {};

    if (req?.user?.role === 'OFFICER' && req?.user?.officeId) {
      filters.officeId = req.user.officeId;
    }

    return this.applicationsService.getStats(filters);
  }

  @Get('inspectors/available')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getAvailableInspectors() {
    console.log('🔎 GET /applications/inspectors/available endpoint called');
    const inspectors = await this.applicationsService.getAvailableInspectors();
    console.log('📤 Returning inspectors:', inspectors.length);
    return inspectors;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const application = await this.applicationsService.findOne(id);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    console.log('🔍 Loading application:', id);
    console.log('📊 Values array length:', application.values?.length || 0);
    console.log('📄 Documents array length:', application.documents?.length || 0);

    // Transform form data from values array
    const formData = (application.values || []).reduce((acc, val) => {
      acc[val.field_id] = val.value;
      return acc;
    }, {} as Record<string, any>);

    console.log('🔄 Transformed formData keys:', Object.keys(formData).length);

    // Get timeline events from audit logs
    const timeline = await this.applicationsService.getTimeline(id);
    console.log('📅 Timeline events:', timeline.length);

    // Transform documents to match frontend format
    const transformedApplication = {
      ...application,
      formData,
      timeline,
      documents: (application.documents || []).map(doc => ({
        id: doc.id,
        name: doc.document_type || 'Document',
        type: doc.mime_type || 'application/pdf',
        size: doc.file_size || 0,
        url: doc.file_url,
        uploadedAt: doc.uploaded_at || doc.created_at,
        uploadedBy: 'Applicant',
      })),
    };

    return transformedApplication;
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(__dirname, '..', '..', 'uploads', 'documents');
          
          // Create directory if it doesn't exist
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/)) {
          return cb(new Error('Only PDF, JPG, PNG, DOC, DOCX files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @Param('id') applicationId: string,
    @UploadedFile() file: any,
    @Body() body: { documentType?: string },
  ) {
    try {
      if (!file) {
        throw new NotFoundException('No file uploaded');
      }

      console.log('📎 File uploaded:', file.originalname, 'Size:', file.size, 'bytes');
      console.log('📁 File path:', file.path);

      const fileUrl = `/uploads/documents/${file.filename}`;
      const documentType = body.documentType || file.originalname;

      const document = await this.applicationsService.addDocument(
        applicationId,
        documentType,
        fileUrl,
        file.size,
        file.mimetype,
      );

      console.log('✅ Document saved to DB:', document.id);

      return {
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      };
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') applicationId: string) {
    const documents = await this.applicationsService.getDocuments(applicationId);
    
    return documents.map(doc => ({
      id: doc.id,
      name: doc.document_type || 'Document',
      type: doc.mime_type || 'application/pdf',
      size: doc.file_size || 0,
      url: doc.file_url,
      uploadedAt: doc.uploaded_at || doc.created_at,
      uploadedBy: 'Applicant',
    }));
  }

  @Post()
  @Roles(UserRole.APPLICANT)
  async create(@Body() createDto: CreateApplicationDto, @Req() req: any) {
    const userId = req.user?.userId;
    const institutionId = req.user?.institutionId;

    return this.applicationsService.create(createDto, userId, institutionId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, updateDto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submit(@Param('id') id: string) {
    return this.applicationsService.submit(id);
  }

  @Post(':id/clarification')
  @Roles(UserRole.OFFICER)
  @HttpCode(HttpStatus.OK)
  async requestClarification(
    @Param('id') id: string,
    @Body('remarks') remarks: string,
  ) {
    return this.applicationsService.requestClarification(id, remarks);
  }

  @Post(':id/clarification-response')
  @Roles(UserRole.APPLICANT)
  @HttpCode(HttpStatus.OK)
  async respondToClarification(
    @Param('id') id: string,
    @Body('response') response: string,
    @Req() req: any,
  ) {
    return this.applicationsService.respondToClarification(
      id,
      response,
      req.user?.userId,
    );
  }

  @Post(':id/assign-inspector')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async assignInspector(
    @Param('id') id: string,
    @Body('inspectorId') inspectorId: string,
    @Body('scheduledDate') scheduledDate: string,
    @Body('specialInstructions') specialInstructions: string,
    @Body('documentsToVerify') documentsToVerify: Array<{ id: string; name: string; url: string; type: string }>,
    @Req() req: any,
  ) {
    console.log('📋 Inspector assignment request:', {
      applicationId: id,
      inspectorId,
      scheduledDate,
      hasInstructions: !!specialInstructions,
      documentsCount: documentsToVerify?.length || 0,
    });

    return this.applicationsService.assignInspector(
      id,
      inspectorId,
      scheduledDate,
      req.user?.userId,
      specialInstructions,
      documentsToVerify,
    );
  }

  @Post(':id/decision')
  @Roles(UserRole.OFFICER)
  @HttpCode(HttpStatus.OK)
  async makeDecision(
    @Param('id') id: string,
    @Body('decision') decision: 'approved' | 'rejected',
    @Body('remarks') remarks: string,
    @Req() req: any,
  ) {
    return this.applicationsService.makeDecision(
      id,
      decision,
      remarks,
      req.user?.userId,
    );
  }

  @Patch(':id/draft')
  @Roles(UserRole.APPLICANT)
  @HttpCode(HttpStatus.OK)
  async saveDraft(
    @Param('id') id: string,
    @Body() payload: Record<string, any>,
  ) {
    return this.applicationsService.saveDraft(id, payload?.formData ?? payload);
  }

  @Delete(':id')
  @Roles(UserRole.APPLICANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApplication(
    @Param('id') id: string,
    @Req() req?: any,
  ) {
    const application = await this.applicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only allow deleting draft applications
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new NotFoundException('Only draft applications can be deleted');
    }

    // Ensure applicant can only delete their own institution's applications
    if (req?.user?.role === 'APPLICANT' && req?.user?.institutionId !== application.institution_id) {
      throw new NotFoundException('Application not found');
    }

    await this.applicationsService.deleteApplication(id);
  }
}
