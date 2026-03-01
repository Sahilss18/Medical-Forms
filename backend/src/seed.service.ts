import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './users/entities/user.entity';
import { Form } from './forms/entities/form.entity';
import { FormField, FieldType } from './forms/entities/field.entity';
import { LicensingOffice, OfficeType } from './offices/entities/office.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Form) private formRepository: Repository<Form>,
    @InjectRepository(FormField) private fieldRepository: Repository<FormField>,
    @InjectRepository(LicensingOffice) private officeRepository: Repository<LicensingOffice>,
  ) {}

  async onApplicationBootstrap() {
    const userCount = await this.userRepository.count();
    if (userCount > 0) return;

    console.log('Seeding data...');

    // 1. Create Admin & Officers
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await this.userRepository.save({
      name: 'System Admin',
      email: 'admin@gov.in',
      phone: '9999999999',
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
      is_active: true,
    });

    const officer = await this.userRepository.save({
      name: 'Licensing Officer',
      email: 'officer@gov.in',
      phone: '8888888888',
      password_hash: hashedPassword,
      role: UserRole.OFFICER,
      district: 'Mumbai',
      is_active: true,
    });

    const inspector = await this.userRepository.save({
      name: 'Field Inspector',
      email: 'inspector@gov.in',
      phone: '7777777777',
      password_hash: hashedPassword,
      role: UserRole.INSPECTOR,
      district: 'Mumbai',
      is_active: true,
    });

    // 2. Create Offices
    const stateOffice = await this.officeRepository.save({
      office_name: 'State Licensing Authority',
      office_type: OfficeType.STATE,
      state: 'Maharashtra',
      district: 'Mumbai',
    });

    // 3. Create Forms (Form 3F)
    const form3F = await this.formRepository.save({
      form_code: 'FORM_3F',
      title: 'Recognition of Medical Institution (Narcotic Drugs)',
      requires_inspection: true,
    });

    await this.fieldRepository.save([
      {
        form: form3F,
        label: 'Institution Name',
        field_name: 'inst_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        form: form3F,
        label: 'Address',
        field_name: 'address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        form: form3F,
        label: 'Copy of Registration',
        field_name: 'reg_doc',
        field_type: FieldType.FILE,
        required: true,
        order_index: 3,
      },
    ]);

    console.log('Seeding complete.');
  }
}
