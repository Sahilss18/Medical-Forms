/**
 * Add IN_PROGRESS to enum
 */
import { DataSource } from 'typeorm';

const addEnumValue = async () => {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Sahil18&',
    database: 'medical_forms'
  });

  try {
    await ds.initialize();
    console.log('✅ Connected to database\n');

    // Check current enum values
    console.log('📋 Current enum values:');
    const currentValues = await ds.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'inspection_assignments_status_enum'
      )
      ORDER BY enumsortorder
    `);
    currentValues.forEach((v: any) => console.log(`   - ${v.enumlabel}`));
    console.log();

    // Check if IN_PROGRESS already exists
    const hasInProgress = currentValues.some((v: any) => v.enumlabel === 'IN_PROGRESS');
    
    if (hasInProgress) {
      console.log('ℹ️  IN_PROGRESS already exists in enum\n');
    } else {
      console.log('⚙️  Adding IN_PROGRESS to enum...');
      await ds.query(`ALTER TYPE inspection_assignments_status_enum ADD VALUE 'IN_PROGRESS'`);
      console.log('✅ IN_PROGRESS added successfully\n');
    }

    // Verify
    console.log('📋 Updated enum values:');
    const updatedValues = await ds.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'inspection_assignments_status_enum'
      )
      ORDER BY enumsortorder
    `);
    updatedValues.forEach((v: any) => console.log(`   - ${v.enumlabel}`));
    console.log();

    console.log('🎉 Migration completed!');

    await ds.destroy();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};

addEnumValue().catch(console.error);
