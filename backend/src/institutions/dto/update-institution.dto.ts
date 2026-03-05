import { IsOptional, IsString } from 'class-validator';

export class UpdateInstitutionDto {
  @IsString()
  institutionName: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  pincode: string;

  @IsString()
  contactPerson: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  institutionType?: string;

  @IsOptional()
  @IsString()
  establishedYear?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}
