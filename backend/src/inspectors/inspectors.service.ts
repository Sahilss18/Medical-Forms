import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspector } from './entities/inspector.entity';
import { User } from '../users/entities/user.entity';
import { LicensingOffice, OfficeType } from '../offices/entities/office.entity';

@Injectable()
export class InspectorsService {
  constructor(
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LicensingOffice)
    private readonly officeRepository: Repository<LicensingOffice>,
  ) {}

  async getMyAvailability(userId: string) {
    let inspector = await this.inspectorRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'office'],
    });

    // Auto-create inspector profile if it doesn't exist
    if (!inspector) {
      inspector = await this.createInspectorProfile(userId);
    }

    return {
      available: inspector.active,
      inspectorId: inspector.id,
      employeeCode: inspector.employee_code,
    };
  }

  private async createInspectorProfile(userId: string): Promise<Inspector> {
    // Get user details
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create default office
    let office = await this.officeRepository.findOne({
      where: { office_name: 'State Licensing Authority' },
    });

    if (!office) {
      // Create default office if it doesn't exist
      office = await this.officeRepository.save({
        office_name: 'State Licensing Authority',
        office_type: OfficeType.STATE,
        state: user.district || 'Maharashtra',
        district: user.district || 'Mumbai',
      });
    }

    // Create inspector profile
    const inspector = await this.inspectorRepository.save({
      user_id: userId,
      office_id: office.id,
      employee_code: `INSP-${userId.slice(0, 8).toUpperCase()}`,
      active: true,
    });

    console.log(`✅ Auto-created inspector profile for user ${user.email}`);

    // Return with relations
    const createdInspector = await this.inspectorRepository.findOne({
      where: { id: inspector.id },
      relations: ['user', 'office'],
    });

    if (!createdInspector) {
      throw new NotFoundException('Failed to create inspector profile');
    }

    return createdInspector;
  }

  async updateMyAvailability(userId: string, available: boolean) {
    let inspector = await this.inspectorRepository.findOne({
      where: { user_id: userId },
    });

    // Auto-create inspector profile if it doesn't exist
    if (!inspector) {
      inspector = await this.createInspectorProfile(userId);
    }

    inspector.active = available;
    const savedInspector = await this.inspectorRepository.save(inspector);

    return {
      available: savedInspector.active,
      inspectorId: savedInspector.id,
      employeeCode: savedInspector.employee_code,
    };
  }

  async findOrCreateInspectorProfile(userId: string): Promise<Inspector> {
    let inspector = await this.inspectorRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'office'],
    });

    if (!inspector) {
      inspector = await this.createInspectorProfile(userId);
    }

    return inspector;
  }
}
