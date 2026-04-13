import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './users/entities/user.entity';
import { Form } from './forms/entities/form.entity';
import { FormField, FieldType } from './forms/entities/field.entity';
import { LicensingOffice, OfficeType } from './offices/entities/office.entity';
import { Institution } from './institutions/entities/institution.entity';
import { Inspector } from './inspectors/entities/inspector.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Form) private formRepository: Repository<Form>,
    @InjectRepository(FormField) private fieldRepository: Repository<FormField>,
    @InjectRepository(LicensingOffice) private officeRepository: Repository<LicensingOffice>,
    @InjectRepository(Institution) private institutionRepository: Repository<Institution>,
    @InjectRepository(Inspector) private inspectorRepository: Repository<Inspector>,
  ) {}

  async onApplicationBootstrap() {
    console.log('Checking seed data...');

    // Check if default users exist, create them if not
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Admin if not exists
    const adminExists = await this.userRepository.findOne({ 
      where: { email: 'admin@gov.in' } 
    });
    if (!adminExists) {
      await this.userRepository.save({
        name: 'System Admin',
        email: 'admin@gov.in',
        phone: '9999999999',
        password_hash: hashedPassword,
        role: UserRole.ADMIN,
        is_active: true,
      });
      console.log('✓ Created admin user (admin@gov.in / password123)');
    }

    // Create Officer if not exists
    const officerExists = await this.userRepository.findOne({ 
      where: { email: 'officer@gov.in' } 
    });
    if (!officerExists) {
      await this.userRepository.save({
        name: 'Licensing Officer',
        email: 'officer@gov.in',
        phone: '8888888888',
        password_hash: hashedPassword,
        role: UserRole.OFFICER,
        district: 'Mumbai',
        is_active: true,
      });
      console.log('✓ Created officer user (officer@gov.in / password123)');
    }

    // Create Inspector if not exists
    const inspectorExists = await this.userRepository.findOne({ 
      where: { email: 'inspector@gov.in' } 
    });
    let inspectorUser = inspectorExists;
    if (!inspectorExists) {
      inspectorUser = await this.userRepository.save({
        name: 'Field Inspector',
        email: 'inspector@gov.in',
        phone: '7777777777',
        password_hash: hashedPassword,
        role: UserRole.INSPECTOR,
        district: 'Mumbai',
        is_active: true,
      });
      console.log('✓ Created inspector user (inspector@gov.in / password123)');
    }

    // Create Applicant user if not exists
    const applicantExists = await this.userRepository.findOne({ 
      where: { email: 'applicant@test.com' } 
    });
    let applicantUser = applicantExists;
    if (!applicantExists) {
      applicantUser = await this.userRepository.save({
        name: 'Test Applicant',
        email: 'applicant@test.com',
        phone: '9876543210',
        password_hash: hashedPassword,
        role: UserRole.APPLICANT,
        is_active: true,
      });
      console.log('✓ Created applicant user (applicant@test.com / password123)');
    }

    // Create Institution for applicant if not exists
    if (applicantUser) {
      const institutionExists = await this.institutionRepository.findOne({
        where: { user_id: applicantUser.id }
      });
      if (!institutionExists) {
        await this.institutionRepository.save({
          user_id: applicantUser.id,
          name: 'City General Hospital',
          registration_number: 'REG/2020/12345',
          institution_type: 'hospital',
          established_year: '1995',
          license_number: 'LIC/MH/2020/001',
          address: '123 Medical Street, Near Central Park, Mumbai, Maharashtra - 400001',
          address_line2: 'Near Central Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          district: 'Mumbai',
          contact_person: 'Dr. Rajesh Kumar',
          contact_phone: '9876543210',
          contact_email: 'admin@citygeneral.com',
        });
        console.log('✓ Created test institution for applicant');
      }
    }

    // Create Office if not exists
    const officeExists = await this.officeRepository.findOne({
      where: { office_name: 'State Licensing Authority' }
    });
    if (!officeExists) {
      await this.officeRepository.save({
        office_name: 'State Licensing Authority',
        office_type: OfficeType.STATE,
        state: 'Maharashtra',
        district: 'Mumbai',
      });
      console.log('✓ Created State Licensing Office');
    }

    const defaultOffice = await this.officeRepository.findOne({
      where: { office_name: 'State Licensing Authority' },
    });

    if (inspectorUser && defaultOffice) {
      const inspectorProfile = await this.inspectorRepository.findOne({
        where: { user_id: inspectorUser.id },
      });

      if (!inspectorProfile) {
        await this.inspectorRepository.save({
          user_id: inspectorUser.id,
          office_id: defaultOffice.id,
          employee_code: 'INSP-MUM-001',
          active: true,
        });
        console.log('✓ Created inspector profile for inspector@gov.in');
      }
    }

    // Migrate old FORM_3F to 3F if it exists
    const oldForm = await this.formRepository.findOne({
      where: { form_code: 'FORM_3F' }
    });
    if (oldForm) {
      oldForm.form_code = '3F';
      await this.formRepository.save(oldForm);
      console.log('✓ Migrated FORM_3F to 3F');
    }

    // Ensure Form 3F exists
    let form3F = await this.formRepository.findOne({
      where: { form_code: '3F' },
    });

    if (!form3F) {
      form3F = await this.formRepository.save({
        form_code: '3F',
        title: 'Recognition of Medical Institution (Narcotic Drugs)',
        requires_inspection: true,
      });
      console.log('✓ Created Form 3F');
    }

    // Ensure latest Form 3F fields exist (idempotent)
    const requiredFields = [
      // Step 1: Institution Details
      {
        label: 'Institution Name',
        field_name: 'institution_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Institution Address',
        field_name: 'institution_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Institution Contact Number',
        field_name: 'institution_contact',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
      },
      {
        label: 'Head / In-charge Name',
        field_name: 'head_incharge_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },
      {
        label: 'Staff Strength',
        field_name: 'staff_strength',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 5,
      },
      {
        label: 'Patient Statistics (Monthly)',
        field_name: 'patient_statistics',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 6,
      },

      // Step 2: Practitioner Details
      {
        label: 'Qualified Practitioners Details',
        field_name: 'qualified_practitioners',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Training Details',
        field_name: 'training_details',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 8,
      },
      {
        label: 'Overall In-charge Practitioner',
        field_name: 'overall_incharge_practitioner',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },

      // Step 3: Supporting Documents
      {
        label: 'Institutional Documents',
        field_name: 'institutional_documents',
        field_type: FieldType.FILE,
        required: true,
        order_index: 10,
      },
      {
        label: 'Previous Certificate / Withdrawal Details Document',
        field_name: 'previous_certificate_or_withdrawal_document',
        field_type: FieldType.FILE,
        required: false,
        order_index: 11,
      },
      {
        label: 'Previous Certificate / Withdrawal Remarks',
        field_name: 'previous_certificate_or_withdrawal_remarks',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 12,
      },
    ];

    const existingFields = await this.fieldRepository.find({
      where: { form_id: form3F.id },
      order: { created_at: 'ASC' },
    });

    const requiredFieldsMap = new Map(
      requiredFields.map((field) => [field.field_name, field]),
    );

    const obsoleteFields = existingFields.filter(
      (field) => !requiredFieldsMap.has(field.field_name),
    );

    if (obsoleteFields.length > 0) {
      await this.fieldRepository.remove(obsoleteFields);
      console.log(`✓ Removed ${obsoleteFields.length} obsolete Form 3F fields`);
    }

    const groupedFields = new Map<string, FormField[]>();
    existingFields
      .filter((field) => requiredFieldsMap.has(field.field_name))
      .forEach((field) => {
        const group = groupedFields.get(field.field_name) || [];
        group.push(field);
        groupedFields.set(field.field_name, group);
      });

    const duplicateFieldsToRemove: FormField[] = [];
    const fieldsToUpdate: FormField[] = [];
    const normalizedExistingFieldNames = new Set<string>();

    for (const [fieldName, group] of groupedFields.entries()) {
      const [primary, ...duplicates] = group;
      if (duplicates.length > 0) {
        duplicateFieldsToRemove.push(...duplicates);
      }

      const requiredField = requiredFieldsMap.get(fieldName)!;
      const needsUpdate =
        primary.label !== requiredField.label ||
        primary.field_type !== requiredField.field_type ||
        primary.required !== requiredField.required ||
        primary.order_index !== requiredField.order_index;

      if (needsUpdate) {
        primary.label = requiredField.label;
        primary.field_type = requiredField.field_type;
        primary.required = requiredField.required;
        primary.order_index = requiredField.order_index;
        fieldsToUpdate.push(primary);
      }

      normalizedExistingFieldNames.add(fieldName);
    }

    if (duplicateFieldsToRemove.length > 0) {
      await this.fieldRepository.remove(duplicateFieldsToRemove);
      console.log(
        `✓ Removed ${duplicateFieldsToRemove.length} duplicate Form 3F fields`,
      );
    }

    if (fieldsToUpdate.length > 0) {
      await this.fieldRepository.save(fieldsToUpdate);
      console.log(`✓ Updated ${fieldsToUpdate.length} Form 3F fields`);
    }

    const missingFields = requiredFields.filter(
      (field) => !normalizedExistingFieldNames.has(field.field_name),
    );

    if (missingFields.length > 0) {
      await this.fieldRepository.save(
        missingFields.map((field) => ({
          form: form3F as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingFields.length} missing Form 3F fields`);
    }

    // Ensure Form 19 exists - Drug Sale License (General)
    let form19 = await this.formRepository.findOne({
      where: { form_code: '19' },
    });

    if (!form19) {
      form19 = await this.formRepository.save({
        form_code: '19',
        title: 'Drug Sale License (General)',
        requires_inspection: true,
      });
      console.log('✓ Created Form 19');
    }

    // Form 19 fields following the workflow
    const form19Fields = [
      // Step 1: Applicant Details
      {
        label: 'Applicant Name',
        field_name: 'applicant_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Applicant Address',
        field_name: 'applicant_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Constitution of Business',
        field_name: 'constitution_of_business',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 3,
        validation_rules: {
          options: [
            'Proprietorship',
            'Partnership',
            'Private Limited Company',
            'Public Limited Company',
            'Limited Liability Partnership (LLP)',
            'Others',
          ],
        },
      },
      {
        label: 'Contact Number',
        field_name: 'applicant_contact',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },
      {
        label: 'Email Address',
        field_name: 'applicant_email',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },

      // Step 2: Premises Details
      {
        label: 'Premises Address',
        field_name: 'premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 6,
      },
      {
        label: 'Premises Area (sq ft)',
        field_name: 'premises_area',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 7,
      },
      {
        label: 'Storage Capacity',
        field_name: 'storage_capacity',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 8,
      },
      {
        label: 'Premises Type',
        field_name: 'premises_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 9,
        validation_rules: {
          options: ['Owned', 'Rented', 'Leased'],
        },
      },

      // Step 3: Drug Sale Details
      {
        label: 'License Type',
        field_name: 'license_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 10,
        validation_rules: {
          options: [
            'Wholesale',
            'Retail',
            'Wholesale and Retail',
          ],
        },
      },
      {
        label: 'Drug Categories',
        field_name: 'drug_categories',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: {
          options: [
            'Allopathic Medicines',
            'Ayurvedic Medicines',
            'Homeopathic Medicines',
            'Unani Medicines',
            'All Categories',
          ],
        },
      },
      {
        label: 'Narcotics/Psychotropic Drugs',
        field_name: 'narcotics_included',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 12,
        validation_rules: {
          options: ['Yes', 'No'],
        },
      },

      // Step 4: Qualified Person Details
      {
        label: 'Qualified Person Name',
        field_name: 'qualified_person_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 13,
      },
      {
        label: 'Pharmacist Registration Number',
        field_name: 'pharmacist_registration_number',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 14,
      },
      {
        label: 'Date of Registration',
        field_name: 'pharmacist_registration_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 15,
      },
      {
        label: 'Qualification',
        field_name: 'pharmacist_qualification',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 16,
      },
      {
        label: 'Experience (Years)',
        field_name: 'pharmacist_experience',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 17,
      },

      // Step 5: Document Uploads
      {
        label: 'Premises Ownership/Rent Proof',
        field_name: 'premises_proof_document',
        field_type: FieldType.FILE,
        required: true,
        order_index: 18,
      },
      {
        label: 'Pharmacist Registration Certificate',
        field_name: 'pharmacist_registration_certificate',
        field_type: FieldType.FILE,
        required: true,
        order_index: 19,
      },
      {
        label: 'Pharmacist Qualification Certificate',
        field_name: 'pharmacist_qualification_certificate',
        field_type: FieldType.FILE,
        required: true,
        order_index: 20,
      },
      {
        label: 'Constitution/Partnership Deed/MOA',
        field_name: 'constitution_document',
        field_type: FieldType.FILE,
        required: true,
        order_index: 21,
      },
      {
        label: 'Affidavit on Stamp Paper',
        field_name: 'affidavit_document',
        field_type: FieldType.FILE,
        required: true,
        order_index: 22,
      },
      {
        label: 'Site Plan/Layout',
        field_name: 'site_plan_document',
        field_type: FieldType.FILE,
        required: true,
        order_index: 23,
      },
      {
        label: 'ID Proof (Aadhaar/PAN)',
        field_name: 'id_proof_document',
        field_type: FieldType.FILE,
        required: true,
        order_index: 24,
      },
      {
        label: 'Passport Size Photograph',
        field_name: 'photograph_document',
        field_type: FieldType.FILE,
        required: true,
        order_index: 25,
      },
      {
        label: 'Drug List to be Dealt',
        field_name: 'drug_list_document',
        field_type: FieldType.FILE,
        required: false,
        order_index: 26,
      },
      {
        label: 'Previous License Copy (if renewal)',
        field_name: 'previous_license_document',
        field_type: FieldType.FILE,
        required: false,
        order_index: 27,
      },
    ];

    const existingForm19Fields = await this.fieldRepository.find({
      where: { form_id: form19.id },
      order: { created_at: 'ASC' },
    });

    const form19FieldsMap = new Map(
      form19Fields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm19Fields = existingForm19Fields.filter(
      (field) => !form19FieldsMap.has(field.field_name),
    );

    if (obsoleteForm19Fields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm19Fields);
      console.log(`✓ Removed ${obsoleteForm19Fields.length} obsolete Form 19 fields`);
    }

    const groupedForm19Fields = new Map<string, FormField[]>();
    existingForm19Fields
      .filter((field) => form19FieldsMap.has(field.field_name))
      .forEach((field) => {
        const group = groupedForm19Fields.get(field.field_name) || [];
        group.push(field);
        groupedForm19Fields.set(field.field_name, group);
      });

    const duplicateForm19FieldsToRemove: FormField[] = [];
    const form19FieldsToUpdate: FormField[] = [];
    const normalizedExistingForm19FieldNames = new Set<string>();

    for (const [fieldName, group] of groupedForm19Fields.entries()) {
      const [primary, ...duplicates] = group;
      if (duplicates.length > 0) {
        duplicateForm19FieldsToRemove.push(...duplicates);
      }

      const requiredField = form19FieldsMap.get(fieldName)!;
      const needsUpdate =
        primary.label !== requiredField.label ||
        primary.field_type !== requiredField.field_type ||
        primary.required !== requiredField.required ||
        primary.order_index !== requiredField.order_index ||
        JSON.stringify(primary.validation_rules) !== JSON.stringify(requiredField.validation_rules);

      if (needsUpdate) {
        primary.label = requiredField.label;
        primary.field_type = requiredField.field_type;
        primary.required = requiredField.required;
        primary.order_index = requiredField.order_index;
        primary.validation_rules = requiredField.validation_rules;
        form19FieldsToUpdate.push(primary);
      }

      normalizedExistingForm19FieldNames.add(fieldName);
    }

    if (duplicateForm19FieldsToRemove.length > 0) {
      await this.fieldRepository.remove(duplicateForm19FieldsToRemove);
      console.log(
        `✓ Removed ${duplicateForm19FieldsToRemove.length} duplicate Form 19 fields`,
      );
    }

    if (form19FieldsToUpdate.length > 0) {
      await this.fieldRepository.save(form19FieldsToUpdate);
      console.log(`✓ Updated ${form19FieldsToUpdate.length} Form 19 fields`);
    }

    const missingForm19Fields = form19Fields.filter(
      (field) => !normalizedExistingForm19FieldNames.has(field.field_name),
    );

    if (missingForm19Fields.length > 0) {
      await this.fieldRepository.save(
        missingForm19Fields.map((field) => ({
          form: form19 as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm19Fields.length} missing Form 19 fields`);
    }

    // Ensure Form 19A exists - Restricted Drug Sale License
    let form19A = await this.formRepository.findOne({
      where: { form_code: '19A' },
    });

    if (!form19A) {
      form19A = await this.formRepository.save({
        form_code: '19A',
        title: 'Restricted Drug Sale License',
        requires_inspection: true,
      });
      console.log('✓ Created Form 19A');
    }

    const form19AFields = [
      // Step 1: Applicant Details
      {
        label: 'Applicant Name',
        field_name: 'applicant_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Applicant Address',
        field_name: 'applicant_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Contact Number',
        field_name: 'applicant_contact',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
      },
      {
        label: 'Email Address',
        field_name: 'applicant_email',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },

      // Step 2: Drug Types & Area of Operation
      {
        label: 'Drug Type 1',
        field_name: 'drug_type_primary',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },
      {
        label: 'Drug Type 2',
        field_name: 'drug_type_secondary',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 6,
      },
      {
        label: 'Area of Operation',
        field_name: 'area_of_operation',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Licence Type',
        field_name: 'licence_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 8,
        validation_rules: {
          options: ['Retail', 'Wholesale', 'Retail and Wholesale'],
        },
      },

      // Step 3: Premises & Storage
      {
        label: 'Premises Address',
        field_name: 'premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },
      {
        label: 'Vendor Type',
        field_name: 'vendor_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 10,
        validation_rules: {
          options: ['Fixed', 'Itinerant'],
        },
      },
      {
        label: 'Drug Sale Information',
        field_name: 'drug_sale_information',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 11,
      },
      {
        label: 'Storage Check',
        field_name: 'storage_check',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 12,
        validation_rules: {
          options: ['Yes', 'No'],
        },
      },

      // Step 4: Storage / Supplier Details
      {
        label: 'Storage Details',
        field_name: 'storage_details',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 13,
        validation_rules: {
          conditional: { field: 'storage_check', value: 'Yes' },
        },
      },
      {
        label: 'Itinerant Vendor',
        field_name: 'itinerant_vendor',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 14,
        validation_rules: {
          options: ['Yes', 'No'],
        },
      },
      {
        label: 'Supplier Name',
        field_name: 'supplier_name',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 15,
        validation_rules: {
          conditional: { field: 'itinerant_vendor', value: 'Yes' },
        },
      },
      {
        label: 'Supplier Licence Number',
        field_name: 'supplier_licence_number',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 16,
        validation_rules: {
          conditional: { field: 'itinerant_vendor', value: 'Yes' },
        },
      },

      // Step 5: Declaration & Digital Signature
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 17,
        validation_rules: {
          options: ['Yes, I declare that the above information is true'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 18,
      },
    ];

    const existingForm19AFields = await this.fieldRepository.find({
      where: { form_id: form19A.id },
      order: { created_at: 'ASC' },
    });

    const form19AFieldsMap = new Map(
      form19AFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm19AFields = existingForm19AFields.filter(
      (field) => !form19AFieldsMap.has(field.field_name),
    );

    if (obsoleteForm19AFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm19AFields);
      console.log(`✓ Removed ${obsoleteForm19AFields.length} obsolete Form 19A fields`);
    }

    const existingForm19AFieldNames = new Set(
      existingForm19AFields.map((field) => field.field_name),
    );

    const missingForm19AFields = form19AFields.filter(
      (field) => !existingForm19AFieldNames.has(field.field_name),
    );

    if (missingForm19AFields.length > 0) {
      await this.fieldRepository.save(
        missingForm19AFields.map((field) => ({
          form: form19A as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm19AFields.length} missing Form 19A fields`);
    }

    console.log('Seed check complete.');
  }
}
