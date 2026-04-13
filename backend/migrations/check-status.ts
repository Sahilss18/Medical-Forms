/**
 * Check Status Column Type
 */
import { DataSource } from 'typeorm';

type StatusColumnRow = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

type EnumTypeRow = {
  typname: string;
};

type EnumValueRow = {
  enumlabel: string;
};

const check = async () => {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Sahil18&',
    database: 'medical_forms',
  });

  await ds.initialize();

  const result = await ds.query<StatusColumnRow[]>(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'inspection_assignments' 
    AND column_name = 'status'
  `);

  console.log('Status column info:', result);

  // Check if enum type exists
  const enumCheck = await ds.query<EnumTypeRow[]>(`
    SELECT typname FROM pg_type WHERE typname LIKE '%status%'
  `);

  console.log('Enum types with status:', enumCheck);

  const enumValues = await ds.query<EnumValueRow[]>(`
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = (
      SELECT oid
      FROM pg_type
      WHERE typname = 'inspection_assignments_status_enum'
    )
    ORDER BY enumsortorder
  `);

  console.log('inspection_assignments_status_enum values:', enumValues);

  await ds.destroy();
};

check().catch(console.error);
