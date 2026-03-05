import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './entities/institution.entity';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
  ) {}

  async findByUserId(userId: string) {
    const institution = await this.institutionRepository.findOne({
      where: { user_id: userId },
    });

    if (!institution) {
      throw new NotFoundException('Institution profile not found for user');
    }

    return {
      id: institution.id,
      institutionName: institution.name,
      registrationNumber: institution.registration_number || '',
      addressLine1: institution.address || '',
      addressLine2: institution.address_line2 || '',
      city: institution.city || '',
      state: institution.state || '',
      pincode: institution.pincode || '',
      contactPerson: institution.contact_person || '',
      email: institution.contact_email || '',
      phone: institution.contact_phone || '',
      institutionType: institution.institution_type || 'hospital',
      establishedYear: institution.established_year || '',
      licenseNumber: institution.license_number || '',
    };
  }

  async upsertByUserId(userId: string, dto: UpdateInstitutionDto) {
    const existingInstitution = await this.institutionRepository.findOne({
      where: { user_id: userId },
    });

    const payload = {
      user_id: userId,
      name: dto.institutionName,
      registration_number: dto.registrationNumber || undefined,
      institution_type: dto.institutionType || undefined,
      established_year: dto.establishedYear || undefined,
      license_number: dto.licenseNumber || undefined,
      address: dto.addressLine1,
      address_line2: dto.addressLine2 || undefined,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      district: dto.city,
      contact_person: dto.contactPerson,
      contact_phone: dto.phone,
      contact_email: dto.email || undefined,
    };

    if (existingInstitution) {
      Object.assign(existingInstitution, payload);
      await this.institutionRepository.save(existingInstitution);
      return this.findByUserId(userId);
    }

    await this.institutionRepository.save(payload);
    return this.findByUserId(userId);
  }
}
