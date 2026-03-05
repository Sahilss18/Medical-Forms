import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class CreateApplicationDto {
  @IsString()
  formId: string;

  @IsObject()
  formData: Record<string, any>;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
