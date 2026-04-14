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

    // Ensure Form 19B exists - Homoeopathic Medicine Sale
    let form19B = await this.formRepository.findOne({
      where: { form_code: '19B' },
    });

    if (!form19B) {
      form19B = await this.formRepository.save({
        form_code: '19B',
        title: 'Homoeopathic Medicine Sale',
        requires_inspection: true,
      });
      console.log('✓ Created Form 19B');
    }

    const form19BFields = [
      // Step 1: Licence Type
      {
        label: 'Licence Type',
        field_name: 'licence_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: {
          options: ['Retail', 'Wholesale', 'Retail and Wholesale'],
        },
      },

      // Step 2: Applicant Details
      {
        label: 'Applicant Name',
        field_name: 'applicant_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Applicant Address',
        field_name: 'applicant_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
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

      // Step 3: Premises Details
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
        label: 'Premises Type',
        field_name: 'premises_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 8,
        validation_rules: {
          options: ['Owned', 'Rented', 'Leased'],
        },
      },
      {
        label: 'Storage Facility Details',
        field_name: 'storage_facility_details',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },

      // Step 4: Competent Person Details (Retail only)
      {
        label: 'Competent Person Name',
        field_name: 'competent_person_name',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 10,
        validation_rules: {
          conditional: { field: 'licence_type', value: 'Retail' },
        },
      },
      {
        label: 'In-charge / Designation',
        field_name: 'incharge_designation',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 11,
        validation_rules: {
          conditional: { field: 'licence_type', value: 'Retail' },
        },
      },
      {
        label: 'Competent Person Qualification',
        field_name: 'competent_person_qualification',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 12,
        validation_rules: {
          conditional: { field: 'licence_type', value: 'Retail' },
        },
      },

      // Step 6: Declaration & Digital Signature
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 13,
        validation_rules: {
          options: ['Yes, I declare that the above information is true'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 14,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 15,
      },
    ];

    const existingForm19BFields = await this.fieldRepository.find({
      where: { form_id: form19B.id },
      order: { created_at: 'ASC' },
    });

    const form19BFieldsMap = new Map(
      form19BFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm19BFields = existingForm19BFields.filter(
      (field) => !form19BFieldsMap.has(field.field_name),
    );

    if (obsoleteForm19BFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm19BFields);
      console.log(`✓ Removed ${obsoleteForm19BFields.length} obsolete Form 19B fields`);
    }

    const existingForm19BFieldNames = new Set(
      existingForm19BFields.map((field) => field.field_name),
    );

    const missingForm19BFields = form19BFields.filter(
      (field) => !existingForm19BFieldNames.has(field.field_name),
    );

    if (missingForm19BFields.length > 0) {
      await this.fieldRepository.save(
        missingForm19BFields.map((field) => ({
          form: form19B as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm19BFields.length} missing Form 19B fields`);
    }

    // Ensure Form 19C exists - Schedule X Drug Sale
    let form19C = await this.formRepository.findOne({
      where: { form_code: '19C' },
    });

    if (!form19C) {
      form19C = await this.formRepository.save({
        form_code: '19C',
        title: 'Schedule X Drug Sale',
        requires_inspection: true,
      });
      console.log('✓ Created Form 19C');
    }

    const form19CFields = [
      // Step 1: Licence Type
      {
        label: 'Licence Type',
        field_name: 'licence_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: {
          options: ['Retail', 'Wholesale'],
        },
      },

      // Step 2: Applicant Details
      {
        label: 'Applicant Name',
        field_name: 'applicant_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Applicant Address',
        field_name: 'applicant_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
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

      // Step 3: Pharmacy / Premises Address
      {
        label: 'Pharmacy Name',
        field_name: 'pharmacy_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 6,
      },
      {
        label: 'Premises Address',
        field_name: 'premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Premises Area (sq ft)',
        field_name: 'premises_area',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 8,
      },

      // Step 4: Qualified Person Details (Retail only)
      {
        label: 'Qualified Person Name',
        field_name: 'qualified_person_name',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 9,
        validation_rules: {
          conditional: { field: 'licence_type', value: 'Retail' },
        },
      },
      {
        label: 'Qualified Person Qualification',
        field_name: 'qualified_person_qualification',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 10,
        validation_rules: {
          conditional: { field: 'licence_type', value: 'Retail' },
        },
      },
      {
        label: 'Qualified Person Registration Number',
        field_name: 'qualified_person_registration',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 11,
        validation_rules: {
          conditional: { field: 'licence_type', value: 'Retail' },
        },
      },

      // Step 5: Schedule X Drug Details
      {
        label: 'Schedule X Drug Names',
        field_name: 'schedule_x_drug_names',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 12,
      },
      {
        label: 'Expected Quantity to be Sold',
        field_name: 'schedule_x_quantity',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 13,
      },
      {
        label: 'Supplier / Source Details',
        field_name: 'schedule_x_source_details',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 14,
      },

      // Step 6: Special Storage Details
      {
        label: 'Special Storage Required',
        field_name: 'special_storage_required',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 15,
        validation_rules: {
          options: ['Yes', 'No'],
        },
      },
      {
        label: 'Storage Details',
        field_name: 'special_storage_details',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 16,
        validation_rules: {
          conditional: { field: 'special_storage_required', value: 'Yes' },
        },
      },
      {
        label: 'Storage Accommodation Information',
        field_name: 'storage_accommodation_info',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 17,
        validation_rules: {
          conditional: { field: 'special_storage_required', value: 'Yes' },
        },
      },

      // Step 8: Declaration & Submit
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 18,
        validation_rules: {
          options: ['Yes, I confirm all details are accurate'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 19,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 20,
      },
    ];

    const existingForm19CFields = await this.fieldRepository.find({
      where: { form_id: form19C.id },
      order: { created_at: 'ASC' },
    });

    const form19CFieldsMap = new Map(
      form19CFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm19CFields = existingForm19CFields.filter(
      (field) => !form19CFieldsMap.has(field.field_name),
    );

    if (obsoleteForm19CFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm19CFields);
      console.log(`✓ Removed ${obsoleteForm19CFields.length} obsolete Form 19C fields`);
    }

    const existingForm19CFieldNames = new Set(
      existingForm19CFields.map((field) => field.field_name),
    );

    const missingForm19CFields = form19CFields.filter(
      (field) => !existingForm19CFieldNames.has(field.field_name),
    );

    if (missingForm19CFields.length > 0) {
      await this.fieldRepository.save(
        missingForm19CFields.map((field) => ({
          form: form19C as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm19CFields.length} missing Form 19C fields`);
    }

    // Ensure Form 24 exists - Drug Manufacturing (General)
    let form24 = await this.formRepository.findOne({
      where: { form_code: '24' },
    });

    if (!form24) {
      form24 = await this.formRepository.save({
        form_code: '24',
        title: 'Drug Manufacturing (General)',
        requires_inspection: true,
      });
      console.log('✓ Created Form 24');
    }

    const form24Fields = [
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

      // Step 2: Manufacturing Premises Details
      {
        label: 'Manufacturing Premises Address',
        field_name: 'manufacturing_premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },
      {
        label: 'Premises Area (sq ft)',
        field_name: 'premises_area',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 6,
      },
      {
        label: 'Premises Layout Details',
        field_name: 'premises_layout_details',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Application Type',
        field_name: 'application_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 8,
        validation_rules: {
          options: ['Grant', 'Renewal'],
        },
      },

      // Step 3: Drug Details
      {
        label: 'Drug Names (Schedule M)',
        field_name: 'drug_names_schedule_m',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },
      {
        label: 'Drug Categories',
        field_name: 'drug_categories',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 10,
      },
      {
        label: 'Dosage Forms',
        field_name: 'dosage_forms',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 11,
      },
      {
        label: 'Manufacturing Capacity',
        field_name: 'manufacturing_capacity',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 12,
      },

      // Step 4: Technical Staff Details
      {
        label: 'Technical Staff Name',
        field_name: 'technical_staff_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 13,
      },
      {
        label: 'Technical Staff Qualification',
        field_name: 'technical_staff_qualification',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 14,
      },
      {
        label: 'Technical Staff Experience (Years)',
        field_name: 'technical_staff_experience',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 15,
      },
      {
        label: 'Supervising Pharmacist Registration Number',
        field_name: 'supervising_pharmacist_registration',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 16,
      },

      // Step 6: Declaration & Submit
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 17,
        validation_rules: {
          options: ['Yes, I confirm all details are accurate'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 18,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 19,
      },
    ];

    const existingForm24Fields = await this.fieldRepository.find({
      where: { form_id: form24.id },
      order: { created_at: 'ASC' },
    });

    const form24FieldsMap = new Map(
      form24Fields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm24Fields = existingForm24Fields.filter(
      (field) => !form24FieldsMap.has(field.field_name),
    );

    if (obsoleteForm24Fields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm24Fields);
      console.log(`✓ Removed ${obsoleteForm24Fields.length} obsolete Form 24 fields`);
    }

    const existingForm24FieldNames = new Set(
      existingForm24Fields.map((field) => field.field_name),
    );

    const missingForm24Fields = form24Fields.filter(
      (field) => !existingForm24FieldNames.has(field.field_name),
    );

    if (missingForm24Fields.length > 0) {
      await this.fieldRepository.save(
        missingForm24Fields.map((field) => ({
          form: form24 as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm24Fields.length} missing Form 24 fields`);
    }

    // Ensure Form 24A exists - Loan Manufacturing Licence
    let form24A = await this.formRepository.findOne({
      where: { form_code: '24A' },
    });

    if (!form24A) {
      form24A = await this.formRepository.save({
        form_code: '24A',
        title: 'Loan Manufacturing Licence',
        requires_inspection: true,
      });
      console.log('✓ Created Form 24A');
    }

    const form24AFields = [
      // Step 1: Loan Licensee Information
      {
        label: 'Loan Licensee Name',
        field_name: 'loan_licensee_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Loan Licensee Address',
        field_name: 'loan_licensee_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Loan Licensee Contact Number',
        field_name: 'loan_licensee_contact',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
      },
      {
        label: 'Loan Licensee Email',
        field_name: 'loan_licensee_email',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },

      // Step 2: Manufacturing Concern Details (Principal/Licensor)
      {
        label: 'Manufacturing Concern Unit Name',
        field_name: 'manufacturing_concern_unit_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },
      {
        label: 'Manufacturing Concern Address',
        field_name: 'manufacturing_concern_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 6,
      },
      {
        label: 'Manufacturing Concern Existing Licence Number',
        field_name: 'manufacturing_concern_licence_number',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },

      // Step 3: Drugs to be Manufactured
      {
        label: 'Drug Names to be Manufactured',
        field_name: 'drug_names_loan_manufacturing',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 8,
      },
      {
        label: 'Drug Categories',
        field_name: 'drug_categories_loan',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },
      {
        label: 'Dosage Forms',
        field_name: 'dosage_forms_loan',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 10,
      },
      {
        label: 'Manufacturing Capacity',
        field_name: 'manufacturing_capacity_loan',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 11,
      },

      // Step 4: Expert Staff Qualifications
      {
        label: 'Expert Staff Member Name',
        field_name: 'expert_staff_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 12,
      },
      {
        label: 'Expert Staff Qualification',
        field_name: 'expert_staff_qualification',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 13,
      },
      {
        label: 'Expert Staff Experience (Years)',
        field_name: 'expert_staff_experience',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 14,
      },
      {
        label: 'Expert Staff Registration Number',
        field_name: 'expert_staff_registration',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 15,
      },

      // Step 6: Declaration & Confirmation
      {
        label: 'Declaration Accepted',
        field_name: 'loan_declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 16,
        validation_rules: {
          options: ['Yes, I confirm all details are accurate and legally binding'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'loan_digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 17,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'loan_digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 18,
      },
    ];

    const existingForm24AFields = await this.fieldRepository.find({
      where: { form_id: form24A.id },
      order: { created_at: 'ASC' },
    });

    const form24AFieldsMap = new Map(
      form24AFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm24AFields = existingForm24AFields.filter(
      (field) => !form24AFieldsMap.has(field.field_name),
    );

    if (obsoleteForm24AFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm24AFields);
      console.log(`✓ Removed ${obsoleteForm24AFields.length} obsolete Form 24A fields`);
    }

    const existingForm24AFieldNames = new Set(
      existingForm24AFields.map((field) => field.field_name),
    );

    const missingForm24AFields = form24AFields.filter(
      (field) => !existingForm24AFieldNames.has(field.field_name),
    );

    if (missingForm24AFields.length > 0) {
      await this.fieldRepository.save(
        missingForm24AFields.map((field) => ({
          form: form24A as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm24AFields.length} missing Form 24A fields`);
    }

    // Ensure Form 24B exists - Drug Repacking Licence
    let form24B = await this.formRepository.findOne({
      where: { form_code: '24B' },
    });

    if (!form24B) {
      form24B = await this.formRepository.save({
        form_code: '24B',
        title: 'Drug Repacking Licence',
        requires_inspection: true,
      });
      console.log('✓ Created Form 24B');
    }

    const form24BFields = [
      // Step 1: Drug + Premises Details
      {
        label: 'Applicant / Firm Name',
        field_name: 'repacking_firm_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Applicant / Firm Address',
        field_name: 'repacking_firm_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Contact Number',
        field_name: 'repacking_contact_number',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
      },
      {
        label: 'Email Address',
        field_name: 'repacking_email',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },
      {
        label: 'Premises Address',
        field_name: 'repacking_premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },
      {
        label: 'Premises Area (sq ft)',
        field_name: 'repacking_premises_area',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 6,
      },
      {
        label: 'Drug Names for Repacking',
        field_name: 'repacking_drug_names',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Drug Categories',
        field_name: 'repacking_drug_categories',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 8,
      },
      {
        label: 'Source Manufacturer Name',
        field_name: 'source_manufacturer_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },
      {
        label: 'Source Authorization Reference',
        field_name: 'source_authorization_reference',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 10,
      },

      // Step 3: Declaration & Submit
      {
        label: 'Declaration Accepted',
        field_name: 'repacking_declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: {
          options: ['Yes, I confirm all details are accurate'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'repacking_digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 12,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'repacking_digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 13,
      },
    ];

    const existingForm24BFields = await this.fieldRepository.find({
      where: { form_id: form24B.id },
      order: { created_at: 'ASC' },
    });

    const form24BFieldsMap = new Map(
      form24BFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm24BFields = existingForm24BFields.filter(
      (field) => !form24BFieldsMap.has(field.field_name),
    );

    if (obsoleteForm24BFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm24BFields);
      console.log(`✓ Removed ${obsoleteForm24BFields.length} obsolete Form 24B fields`);
    }

    const existingForm24BFieldNames = new Set(
      existingForm24BFields.map((field) => field.field_name),
    );

    const missingForm24BFields = form24BFields.filter(
      (field) => !existingForm24BFieldNames.has(field.field_name),
    );

    if (missingForm24BFields.length > 0) {
      await this.fieldRepository.save(
        missingForm24BFields.map((field) => ({
          form: form24B as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm24BFields.length} missing Form 24B fields`);
    }

    // Ensure Form 24C exists - Homoeopathic Manufacturing Licence
    let form24C = await this.formRepository.findOne({
      where: { form_code: '24C' },
    });

    if (!form24C) {
      form24C = await this.formRepository.save({
        form_code: '24C',
        title: 'Homoeopathic Manufacturing Licence',
        requires_inspection: true,
      });
      console.log('✓ Created Form 24C');
    }

    const form24CFields = [
      // Step 1: Product + Staff Details
      {
        label: 'Applicant / Firm Name',
        field_name: 'homoeopathy_firm_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Applicant / Firm Address',
        field_name: 'homoeopathy_firm_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Product Names',
        field_name: 'homoeopathy_product_names',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
      },
      {
        label: 'Product Categories',
        field_name: 'homoeopathy_product_categories',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },
      {
        label: 'Mother Tincture Source Details',
        field_name: 'homoeopathy_source_details',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },
      {
        label: 'Manufacturing Premises Address',
        field_name: 'homoeopathy_premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 6,
      },
      {
        label: 'Expert Staff Name',
        field_name: 'homoeopathy_staff_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Expert Staff Qualification',
        field_name: 'homoeopathy_staff_qualification',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 8,
      },
      {
        label: 'Expert Staff Experience (Years)',
        field_name: 'homoeopathy_staff_experience',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 9,
      },
      {
        label: 'Supervising Qualification Reference',
        field_name: 'homoeopathy_supervising_reference',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 10,
      },

      // Step 3: Declaration & Submit
      {
        label: 'Declaration Accepted',
        field_name: 'homoeopathy_declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: {
          options: ['Yes, I confirm all details are accurate'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'homoeopathy_digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 12,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'homoeopathy_digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 13,
      },
    ];

    const existingForm24CFields = await this.fieldRepository.find({
      where: { form_id: form24C.id },
      order: { created_at: 'ASC' },
    });

    const form24CFieldsMap = new Map(
      form24CFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm24CFields = existingForm24CFields.filter(
      (field) => !form24CFieldsMap.has(field.field_name),
    );

    if (obsoleteForm24CFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm24CFields);
      console.log(`✓ Removed ${obsoleteForm24CFields.length} obsolete Form 24C fields`);
    }

    const existingForm24CFieldNames = new Set(
      existingForm24CFields.map((field) => field.field_name),
    );

    const missingForm24CFields = form24CFields.filter(
      (field) => !existingForm24CFieldNames.has(field.field_name),
    );

    if (missingForm24CFields.length > 0) {
      await this.fieldRepository.save(
        missingForm24CFields.map((field) => ({
          form: form24C as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm24CFields.length} missing Form 24C fields`);
    }

    // Ensure Form 24F exists - Schedule X Manufacturing Licence
    let form24F = await this.formRepository.findOne({
      where: { form_code: '24F' },
    });

    if (!form24F) {
      form24F = await this.formRepository.save({
        form_code: '24F',
        title: 'Schedule X Manufacturing Licence',
        requires_inspection: true,
      });
      console.log('✓ Created Form 24F');
    }

    const form24FFields = [
      // Step 1: Drug + Premises Details
      {
        label: 'Applicant / Firm Name',
        field_name: 'schedulex_firm_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 1,
      },
      {
        label: 'Applicant / Firm Address',
        field_name: 'schedulex_firm_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 2,
      },
      {
        label: 'Contact Number',
        field_name: 'schedulex_contact_number',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 3,
      },
      {
        label: 'Email Address',
        field_name: 'schedulex_email',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 4,
      },
      {
        label: 'Manufacturing Premises Address',
        field_name: 'schedulex_premises_address',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 5,
      },
      {
        label: 'Premises Area (sq ft)',
        field_name: 'schedulex_premises_area',
        field_type: FieldType.NUMBER,
        required: true,
        order_index: 6,
      },
      {
        label: 'Schedule X Drug Names',
        field_name: 'schedulex_drug_names',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 7,
      },
      {
        label: 'Schedule X Drug Categories',
        field_name: 'schedulex_drug_categories',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 8,
      },
      {
        label: 'Manufacturing Capacity',
        field_name: 'schedulex_manufacturing_capacity',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 9,
      },
      {
        label: 'Special Storage Available',
        field_name: 'schedulex_special_storage_available',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 10,
        validation_rules: {
          options: ['Yes', 'No'],
        },
      },
      {
        label: 'Security Measures Details',
        field_name: 'schedulex_security_measures',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 11,
      },
      {
        label: 'Qualified Supervisory Staff Details',
        field_name: 'schedulex_supervisory_staff',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 12,
      },

      // Step 3: Declaration & Submit
      {
        label: 'Declaration Accepted',
        field_name: 'schedulex_declaration_accepted',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 13,
        validation_rules: {
          options: ['Yes, I confirm all details are accurate'],
        },
      },
      {
        label: 'Digital Signature Name',
        field_name: 'schedulex_digital_signature_name',
        field_type: FieldType.TEXT,
        required: true,
        order_index: 14,
      },
      {
        label: 'Digital Signature Date',
        field_name: 'schedulex_digital_signature_date',
        field_type: FieldType.DATE,
        required: true,
        order_index: 15,
      },
    ];

    const existingForm24FFields = await this.fieldRepository.find({
      where: { form_id: form24F.id },
      order: { created_at: 'ASC' },
    });

    const form24FFieldsMap = new Map(
      form24FFields.map((field) => [field.field_name, field]),
    );

    const obsoleteForm24FFields = existingForm24FFields.filter(
      (field) => !form24FFieldsMap.has(field.field_name),
    );

    if (obsoleteForm24FFields.length > 0) {
      await this.fieldRepository.remove(obsoleteForm24FFields);
      console.log(`✓ Removed ${obsoleteForm24FFields.length} obsolete Form 24F fields`);
    }

    const existingForm24FFieldNames = new Set(
      existingForm24FFields.map((field) => field.field_name),
    );

    const missingForm24FFields = form24FFields.filter(
      (field) => !existingForm24FFieldNames.has(field.field_name),
    );

    if (missingForm24FFields.length > 0) {
      await this.fieldRepository.save(
        missingForm24FFields.map((field) => ({
          form: form24F as Form,
          ...field,
        })),
      );
      console.log(`✓ Added ${missingForm24FFields.length} missing Form 24F fields`);
    }

    type WorkflowField = {
      label: string;
      field_name: string;
      field_type: FieldType;
      required: boolean;
      order_index: number;
      validation_rules?: Record<string, any>;
    };

    const seedWorkflowForm = async (
      formCode: string,
      title: string,
      fields: WorkflowField[],
    ) => {
      let workflowForm = await this.formRepository.findOne({
        where: { form_code: formCode },
      });

      if (!workflowForm) {
        workflowForm = await this.formRepository.save({
          form_code: formCode,
          title,
          requires_inspection: true,
        });
        console.log(`✓ Created Form ${formCode}`);
      }

      const existingFields = await this.fieldRepository.find({
        where: { form_id: workflowForm.id },
        order: { created_at: 'ASC' },
      });

      const fieldsMap = new Map(fields.map((field) => [field.field_name, field]));

      const obsoleteFields = existingFields.filter(
        (field) => !fieldsMap.has(field.field_name),
      );

      if (obsoleteFields.length > 0) {
        await this.fieldRepository.remove(obsoleteFields);
        console.log(`✓ Removed ${obsoleteFields.length} obsolete Form ${formCode} fields`);
      }

      const existingFieldNames = new Set(
        existingFields.map((field) => field.field_name),
      );

      const missingFields = fields.filter(
        (field) => !existingFieldNames.has(field.field_name),
      );

      if (missingFields.length > 0) {
        await this.fieldRepository.save(
          missingFields.map((field) => ({
            form: workflowForm as Form,
            ...field,
          })),
        );
        console.log(`✓ Added ${missingFields.length} missing Form ${formCode} fields`);
      }
    };

    await seedWorkflowForm('27', 'Generic Manufacturing Licence Application', [
      {
        label: 'Application Type',
        field_name: 'application_type',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type', value: 'Renewal' } },
      },
      { label: 'Applicant Name', field_name: 'applicant_name_27', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Applicant Address', field_name: 'applicant_address_27', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Manufacturing Premises Location', field_name: 'manufacturing_premises_location_27', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Drug Details', field_name: 'drug_details_27', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Testing Staff Details', field_name: 'testing_staff_details_27', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Manufacturing Staff Details', field_name: 'manufacturing_staff_details_27', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Inspection Readiness Date', field_name: 'inspection_readiness_date_27', field_type: FieldType.DATE, required: true, order_index: 10 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27', field_type: FieldType.DATE, required: true, order_index: 13 },
    ]);

    await seedWorkflowForm('27A', 'Loan Licence (Schedule C & C(1) Drugs)', [
      {
        label: 'Application Type',
        field_name: 'application_type_27a',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_27a',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_27a', value: 'Renewal' } },
      },
      { label: 'Proprietor / Managing Director', field_name: 'proprietor_or_md_27a', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Firm Name', field_name: 'firm_name_27a', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Firm Address', field_name: 'firm_address_27a', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Principal Place of Business', field_name: 'principal_place_business_27a', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Manufacturing Unit Name', field_name: 'manufacturing_unit_name_27a', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Manufacturing Unit Address', field_name: 'manufacturing_unit_address_27a', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Manufacturing Unit Existing Licence Number', field_name: 'manufacturing_unit_licence_number_27a', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Schedule C & C(1) Drug List', field_name: 'schedule_c_c1_drug_list_27a', field_type: FieldType.TEXT, required: true, order_index: 10 },
      { label: 'Manufacturing Staff Details', field_name: 'manufacturing_staff_details_27a', field_type: FieldType.TEXT, required: true, order_index: 11 },
      { label: 'Testing Staff Details', field_name: 'testing_staff_details_27a', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27a', field_type: FieldType.TEXT, required: true, order_index: 13 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27a',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 14,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27a', field_type: FieldType.TEXT, required: true, order_index: 15 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27a', field_type: FieldType.DATE, required: true, order_index: 16 },
    ]);

    await seedWorkflowForm('27B', 'Application (Schedule C, C(1) & X Drugs)', [
      {
        label: 'Application Type',
        field_name: 'application_type_27b',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_27b',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_27b', value: 'Renewal' } },
      },
      { label: 'Applicant Name', field_name: 'applicant_name_27b', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Applicant Address', field_name: 'applicant_address_27b', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Manufacturing Premises Location', field_name: 'manufacturing_premises_location_27b', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Schedule C, C(1) & X Drugs List', field_name: 'schedule_c_c1_x_drugs_27b', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Testing Staff Details', field_name: 'testing_staff_details_27b', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Manufacturing Staff Details', field_name: 'manufacturing_staff_details_27b', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27b', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Inspection Readiness Date', field_name: 'inspection_readiness_date_27b', field_type: FieldType.DATE, required: true, order_index: 10 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27b',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27b', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27b', field_type: FieldType.DATE, required: true, order_index: 13 },
    ]);

    await seedWorkflowForm('27C', 'Blood Bank Licence Application', [
      {
        label: 'Application Type',
        field_name: 'application_type_27c',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_27c',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_27c', value: 'Renewal' } },
      },
      { label: 'Blood Bank Name', field_name: 'blood_bank_name_27c', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Firm / Hospital Name', field_name: 'firm_or_hospital_name_27c', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Organization Address', field_name: 'organization_address_27c', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Whole Blood Processing Details', field_name: 'whole_blood_processing_27c', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Blood Component Preparation Details', field_name: 'blood_component_preparation_27c', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Medical Officer Details', field_name: 'medical_officer_details_27c', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Technical Supervisor Details', field_name: 'technical_supervisor_details_27c', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Registered Nurse Details', field_name: 'registered_nurse_details_27c', field_type: FieldType.TEXT, required: true, order_index: 10 },
      { label: 'Blood Bank Technician Details', field_name: 'blood_bank_technician_details_27c', field_type: FieldType.TEXT, required: true, order_index: 11 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27c', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Premises & Plant Inspection Readiness Date', field_name: 'inspection_readiness_date_27c', field_type: FieldType.DATE, required: true, order_index: 13 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27c',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 14,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27c', field_type: FieldType.TEXT, required: true, order_index: 15 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27c', field_type: FieldType.DATE, required: true, order_index: 16 },
    ]);

    await seedWorkflowForm('27D', 'Manufacturing Licence (LVP, Sera, Vaccines)', [
      {
        label: 'Application Type',
        field_name: 'application_type_27d',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_27d',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_27d', value: 'Renewal' } },
      },
      { label: 'Applicant / Firm Name', field_name: 'firm_name_27d', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Applicant Address', field_name: 'firm_address_27d', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Manufacturing Location', field_name: 'manufacturing_location_27d', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Drug Details (LVP, Sera, Vaccines)', field_name: 'drug_details_27d', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Testing Staff Details', field_name: 'testing_staff_details_27d', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Manufacturing Staff Details', field_name: 'manufacturing_staff_details_27d', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27d', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Premises & Plant Inspection Readiness Date', field_name: 'inspection_readiness_date_27d', field_type: FieldType.DATE, required: true, order_index: 10 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27d',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27d', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27d', field_type: FieldType.DATE, required: true, order_index: 13 },
    ]);

    await seedWorkflowForm('27DA', 'Loan Licence (LVP, Sera, Vaccines, r-DNA)', [
      {
        label: 'Application Type',
        field_name: 'application_type_27da',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_27da',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_27da', value: 'Renewal' } },
      },
      { label: 'Applicant Name', field_name: 'applicant_name_27da', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Firm Name', field_name: 'firm_name_27da', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Firm Address', field_name: 'firm_address_27da', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Principal Place of Business', field_name: 'principal_place_business_27da', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Manufacturing Concern Unit Name', field_name: 'manufacturing_concern_name_27da', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Manufacturing Concern Address', field_name: 'manufacturing_concern_address_27da', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Manufacturing Concern Existing Licence Number', field_name: 'manufacturing_concern_licence_number_27da', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Drug Details (LVP, Sera, Vaccines, r-DNA)', field_name: 'drug_details_27da', field_type: FieldType.TEXT, required: true, order_index: 10 },
      { label: 'Testing Staff Details', field_name: 'testing_staff_details_27da', field_type: FieldType.TEXT, required: true, order_index: 11 },
      { label: 'Manufacturing Staff Details', field_name: 'manufacturing_staff_details_27da', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27da', field_type: FieldType.TEXT, required: true, order_index: 13 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27da',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 14,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27da', field_type: FieldType.TEXT, required: true, order_index: 15 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27da', field_type: FieldType.DATE, required: true, order_index: 16 },
    ]);

    await seedWorkflowForm('27F', 'Blood Products Manufacturing Licence', [
      {
        label: 'Application Type',
        field_name: 'application_type_27f',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_27f',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_27f', value: 'Renewal' } },
      },
      { label: 'Organization / Firm Name', field_name: 'organization_name_27f', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Blood Product Unit Name', field_name: 'blood_product_unit_name_27f', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Organization Address', field_name: 'organization_address_27f', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Blood Products Details (including cord blood)', field_name: 'blood_products_details_27f', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Medical Director Details', field_name: 'medical_director_details_27f', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Laboratory In-charge Details', field_name: 'laboratory_incharge_details_27f', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Technical Supervisor Details', field_name: 'technical_supervisor_details_27f', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Cord Blood Bank Technician Details', field_name: 'cord_blood_technicians_27f', field_type: FieldType.TEXT, required: true, order_index: 10 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_27f', field_type: FieldType.TEXT, required: true, order_index: 11 },
      { label: 'Premises & Plant Inspection Readiness Date', field_name: 'inspection_readiness_date_27f', field_type: FieldType.DATE, required: true, order_index: 12 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_27f',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 13,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_27f', field_type: FieldType.TEXT, required: true, order_index: 14 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_27f', field_type: FieldType.DATE, required: true, order_index: 15 },
    ]);

    await seedWorkflowForm('30', 'Test / Analysis Manufacturing Licence', [
      { label: 'Applicant Name', field_name: 'applicant_name_30', field_type: FieldType.TEXT, required: true, order_index: 1 },
      { label: 'Applicant Address', field_name: 'applicant_address_30', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Occupation', field_name: 'occupation_30', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Testing / Analysis Location Details', field_name: 'testing_location_details_30', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Drug Names for Examination/Test/Analysis', field_name: 'drug_names_for_analysis_30', field_type: FieldType.TEXT, required: true, order_index: 5 },
      {
        label: 'Undertaking Accepted',
        field_name: 'undertaking_accepted_30',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 6,
        validation_rules: { options: ['Yes, I accept the undertaking/declaration'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_30', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_30', field_type: FieldType.DATE, required: true, order_index: 8 },
    ]);

    await seedWorkflowForm('31', 'Cosmetics Manufacturing Licence', [
      {
        label: 'Application Type',
        field_name: 'application_type_31',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      {
        label: 'Existing Licence Number (for Renewal)',
        field_name: 'existing_licence_number_31',
        field_type: FieldType.TEXT,
        required: false,
        order_index: 2,
        validation_rules: { conditional: { field: 'application_type_31', value: 'Renewal' } },
      },
      { label: 'Applicant / Firm Name', field_name: 'firm_name_31', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Applicant / Firm Address', field_name: 'firm_address_31', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Manufacturing Premises Location', field_name: 'manufacturing_premises_location_31', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Cosmetics Product Names', field_name: 'cosmetics_product_names_31', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Manufacturing Staff Details', field_name: 'manufacturing_staff_details_31', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Testing Staff Details', field_name: 'testing_staff_details_31', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Staff Qualifications & Experience', field_name: 'staff_qualification_experience_31', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Premises Inspection Readiness Date', field_name: 'inspection_readiness_date_31', field_type: FieldType.DATE, required: true, order_index: 10 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_31',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_31', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_31', field_type: FieldType.DATE, required: true, order_index: 13 },
    ]);

    await seedWorkflowForm('31A', 'Loan Licence (Cosmetics)', [
      { label: 'Applicant Name', field_name: 'applicant_name_31a', field_type: FieldType.TEXT, required: true, order_index: 1 },
      { label: 'Applicant Address', field_name: 'applicant_address_31a', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Premises Details', field_name: 'premises_details_31a', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Cosmetics Details', field_name: 'cosmetics_details_31a', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Technical Staff Information', field_name: 'technical_staff_info_31a', field_type: FieldType.TEXT, required: true, order_index: 5 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_31a',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 6,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_31a', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_31a', field_type: FieldType.DATE, required: true, order_index: 8 },
    ]);

    await seedWorkflowForm('36', 'Test Approval (Drug / Cosmetic Testing Lab)', [
      { label: 'Laboratory Name', field_name: 'laboratory_name_36', field_type: FieldType.TEXT, required: true, order_index: 1 },
      { label: 'Laboratory Address', field_name: 'laboratory_address_36', field_type: FieldType.TEXT, required: true, order_index: 2 },
      {
        label: 'Request Type',
        field_name: 'request_type_36',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 3,
        validation_rules: { options: ['Grant', 'Renewal'] },
      },
      { label: 'Drug/Cosmetic Categories', field_name: 'drug_cosmetic_categories_36', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Expert Staff Details', field_name: 'expert_staff_details_36', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Person In-charge Details', field_name: 'person_incharge_details_36', field_type: FieldType.TEXT, required: true, order_index: 6 },
      { label: 'Testing Equipment List', field_name: 'testing_equipment_list_36', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Inspection Readiness Date', field_name: 'inspection_readiness_date_36', field_type: FieldType.DATE, required: true, order_index: 8 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_36',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 9,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_36', field_type: FieldType.TEXT, required: true, order_index: 10 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_36', field_type: FieldType.DATE, required: true, order_index: 11 },
    ]);

    await seedWorkflowForm('20', 'General Drug Sale Licence (Retail)', [
      {
        label: 'Application Type',
        field_name: 'application_type_20',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      { label: 'Applicant Name', field_name: 'applicant_name_20', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Applicant Address', field_name: 'applicant_address_20', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Constitution of Business', field_name: 'constitution_of_business_20', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Premises Address', field_name: 'premises_address_20', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Premises Area (sq ft)', field_name: 'premises_area_20', field_type: FieldType.NUMBER, required: true, order_index: 6 },
      { label: 'Storage Details', field_name: 'storage_details_20', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Drug Categories', field_name: 'drug_categories_20', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Qualified Pharmacist Name', field_name: 'qualified_pharmacist_name_20', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Pharmacist Registration Number', field_name: 'pharmacist_registration_number_20', field_type: FieldType.TEXT, required: true, order_index: 10 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_20',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_20', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_20', field_type: FieldType.DATE, required: true, order_index: 13 },
    ]);

    await seedWorkflowForm('21', 'General Drug Sale Licence (Wholesale)', [
      {
        label: 'Application Type',
        field_name: 'application_type_21',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['New Licence', 'Renewal'] },
      },
      { label: 'Applicant Name', field_name: 'applicant_name_21', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Applicant Address', field_name: 'applicant_address_21', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Constitution of Business', field_name: 'constitution_of_business_21', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Premises Address', field_name: 'premises_address_21', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Premises Area (sq ft)', field_name: 'premises_area_21', field_type: FieldType.NUMBER, required: true, order_index: 6 },
      { label: 'Storage Details', field_name: 'storage_details_21', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Drug Categories', field_name: 'drug_categories_21', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Qualified Person Name', field_name: 'qualified_person_name_21', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Qualified Person Registration Number', field_name: 'qualified_person_registration_21', field_type: FieldType.TEXT, required: true, order_index: 10 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_21',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 11,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_21', field_type: FieldType.TEXT, required: true, order_index: 12 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_21', field_type: FieldType.DATE, required: true, order_index: 13 },
    ]);

    await seedWorkflowForm('BSC', 'Blood Storage Centre Grant / Renewal', [
      {
        label: 'Application Type',
        field_name: 'application_type_bsc',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 1,
        validation_rules: { options: ['Grant', 'Renewal'] },
      },
      { label: 'Hospital Name', field_name: 'hospital_name_bsc', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Hospital Address', field_name: 'hospital_address_bsc', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Staff Qualification Details', field_name: 'staff_qualification_details_bsc', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Storage Facilities Information', field_name: 'storage_facilities_info_bsc', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Equipment Details', field_name: 'equipment_details_bsc', field_type: FieldType.TEXT, required: true, order_index: 6 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_bsc',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 7,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_bsc', field_type: FieldType.TEXT, required: true, order_index: 8 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_bsc', field_type: FieldType.DATE, required: true, order_index: 9 },
    ]);

    await seedWorkflowForm('14A', 'Test / Analysis Request (Government Lab)', [
      { label: 'Applicant Name', field_name: 'applicant_name_14a', field_type: FieldType.TEXT, required: true, order_index: 1 },
      { label: 'Applicant Address', field_name: 'applicant_address_14a', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Drug Details', field_name: 'drug_details_14a', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Purchase Details', field_name: 'purchase_details_14a', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Reason for Test', field_name: 'reason_for_test_14a', field_type: FieldType.TEXT, required: true, order_index: 5 },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_14a',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 6,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_14a', field_type: FieldType.TEXT, required: true, order_index: 7 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_14a', field_type: FieldType.DATE, required: true, order_index: 8 },
    ]);

    await seedWorkflowForm('44', 'New Drug / Clinical Trial / Import / Manufacture', [
      { label: 'Drug Name', field_name: 'drug_name_44', field_type: FieldType.TEXT, required: true, order_index: 1 },
      { label: 'Dosage Form', field_name: 'dosage_form_44', field_type: FieldType.TEXT, required: true, order_index: 2 },
      { label: 'Pharmacological Classification', field_name: 'pharmacological_classification_44', field_type: FieldType.TEXT, required: true, order_index: 3 },
      { label: 'Indications', field_name: 'indications_44', field_type: FieldType.TEXT, required: true, order_index: 4 },
      { label: 'Raw Materials', field_name: 'raw_materials_44', field_type: FieldType.TEXT, required: true, order_index: 5 },
      { label: 'Patent Status', field_name: 'patent_status_44', field_type: FieldType.TEXT, required: true, order_index: 6 },
      {
        label: 'Application Type',
        field_name: 'application_type_44',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 7,
        validation_rules: {
          options: [
            'New Drug Market',
            'Clinical Trial',
            'Manufacture Approved Drug',
            'Fixed Dose Combination',
            'New Indication/Dosage',
          ],
        },
      },
      {
        label: 'Declaration Accepted',
        field_name: 'declaration_accepted_44',
        field_type: FieldType.SELECT,
        required: true,
        order_index: 8,
        validation_rules: { options: ['Yes, I declare the information is true and complete'] },
      },
      { label: 'Digital Signature Name', field_name: 'digital_signature_name_44', field_type: FieldType.TEXT, required: true, order_index: 9 },
      { label: 'Digital Signature Date', field_name: 'digital_signature_date_44', field_type: FieldType.DATE, required: true, order_index: 10 },
    ]);

    console.log('Seed check complete.');
  }
}
