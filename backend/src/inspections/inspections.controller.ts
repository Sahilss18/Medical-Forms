import { Body, Controller, Get, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSPECTOR)
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get('assigned')
  getAssignedInspections(@Req() req: any) {
    return this.inspectionsService.getAssignedInspections(req.user.userId);
  }

  @Get(':id')
  getInspectionById(@Param('id') id: string, @Req() req: any) {
    return this.inspectionsService.getInspectionById(id, req.user.userId);
  }

  @Post(':id/start')
  startInspection(@Param('id') id: string, @Req() req: any) {
    console.log(`🚀 Starting inspection ${id}`);
    return this.inspectionsService.startInspection(id, req.user.userId);
  }

  @Post(':id/report')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }], {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads', 'inspection-photos'),
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|heic|webp)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  submitReport(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    body: {
      checklistItems: string;
      observations: string;
      recommendation: 'approve' | 'reject' | 'clarification';
      inspectionDate?: string;
    },
    @UploadedFiles() files: { photos?: any[] },
  ) {
    console.log('📸 Received report submission with files:', files?.photos?.length || 0);
    
    // Parse checklistItems if it's a string (from multipart form data)
    let checklistItems: any = [];
    try {
      checklistItems = typeof body.checklistItems === 'string'
        ? JSON.parse(body.checklistItems)
        : body.checklistItems;
    } catch (error) {
      checklistItems = [];
    }

    const normalizedChecklistItems = Array.isArray(checklistItems) ? checklistItems : [];
    const normalizedRecommendation =
      body.recommendation === 'approve' ||
      body.recommendation === 'reject' ||
      body.recommendation === 'clarification'
        ? body.recommendation
        : 'clarification';

    // Build photos metadata
    const photos = files?.photos?.map(file => ({
      name: file.originalname,
      url: `/uploads/inspection-photos/${file.filename}`,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    })) || [];

    console.log(`✅ Processed ${photos.length} photos`);

    return this.inspectionsService.submitInspectionReport(id, req.user.userId, {
      checklistItems: normalizedChecklistItems,
      observations: body.observations,
      recommendation: normalizedRecommendation,
      inspectionDate: body.inspectionDate,
      photos,
    });
  }

  @Get(':id/report')
  getReport(@Param('id') id: string, @Req() req: any) {
    return this.inspectionsService.getInspectionReport(id, req.user.userId);
  }
}
