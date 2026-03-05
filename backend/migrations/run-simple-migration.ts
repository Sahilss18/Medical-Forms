/**
 * Simple Migration Runner - Inspector System
 * Executes essential migrations one by one
 * Run with: npx ts-node migrations/run-simple-migration.ts
 */

import { DataSource } from 'typeorm';

const runMigration = async () => {
  console.log('🚀 Starting Inspector System Migration...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Sahil18&',
    database: 'medical_forms',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Step 1: Add IN_PROGRESS to enum
    console.log('⚙️  Step 1: Adding IN_PROGRESS to inspection_status enum...');
    try {
      await dataSource.query(`ALTER TYPE inspection_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`);
      console.log('   ✅ IN_PROGRESS added to enum\n');
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('IF NOT EXISTS')) {
        console.log('   ℹ️  IN_PROGRESS already exists\n');
      } else {
        console.error('   ❌ Error:', error.message, '\n');
      }
    }

    // Step 2: Add columns to inspection_reports
    console.log('⚙️  Step 2: Adding columns to inspection_reports table...');
    
    const columns = [
      { name: 'checklist_items', type: 'JSONB NULL' },
      { name: 'observations', type: 'TEXT NULL' },
      { name: 'recommendation', type: 'VARCHAR(50) NULL' },
      { name: 'inspection_date', type: 'DATE NULL' },
      { name: 'photos', type: 'JSONB NULL' },
    ];

    for (const col of columns) {
      try {
        await dataSource.query(
          `ALTER TABLE inspection_reports ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
        );
        console.log(`   ✅ Added column: ${col.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`   ℹ️  Column ${col.name} already exists`);
        } else {
          console.error(`   ❌ Error adding ${col.name}:`, error.message);
        }
      }
    }
    console.log();

    // Step 3: Verify enum values
    console.log('🔍 Step 3: Verifying enum values...');
    const enumCheck = await dataSource.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'inspection_status')
      ORDER BY enumsortorder
    `);
    console.log('   Current enum values:', enumCheck.map((r: any) => r.enumlabel).join(', '));
    console.log();

    // Step 4: Verify columns
    console.log('🔍 Step 4: Verifying table columns...');
    const columnCheck = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inspection_reports' 
      AND column_name IN ('checklist_items', 'observations', 'recommendation', 'inspection_date', 'photos')
    `);
    console.log('   New columns found:', columnCheck.length);
    columnCheck.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log();

    console.log('🎉 Migration completed successfully!');
    console.log('✅ Inspector Field Verification Officer system is ready.\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
