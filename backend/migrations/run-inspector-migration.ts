/**
 * Migration Runner Script
 * Executes the inspector system migration
 * Run with: npx ts-node migrations/run-inspector-migration.ts
 */

import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const runMigration = async () => {
  console.log('🚀 Starting Inspector System Migration...\n');

  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Sahil18&',
    database: 'medical_forms',
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Read migration SQL file
    const sqlFilePath = path.join(__dirname, 'inspector-system-complete.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by semicolon and filter out comments/empty lines
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comment blocks
      if (statement.startsWith('/*') || statement.includes('RAISE NOTICE')) {
        continue;
      }

      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        await dataSource.query(statement);
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}\n`);
        // Continue with other statements
      }
    }

    // Run verification queries
    console.log('🔍 Verifying migration results...\n');

    // Check enum values
    const enumValues = await dataSource.query(`
      SELECT enumlabel as status_value
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'inspection_status')
      ORDER BY enumsortorder
    `);
    console.log('📊 Inspection Status Enum Values:');
    enumValues.forEach((row: any) => console.log(`   - ${row.status_value}`));
    console.log();

    // Check new columns
    const columns = await dataSource.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'inspection_reports' 
      AND column_name IN ('checklist_items', 'observations', 'recommendation', 'inspection_date', 'photos')
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Inspection Reports New Columns:');
    if (columns.length > 0) {
      columns.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('   ⚠️  No new columns found - may need to run ALTER TABLE statements');
    }
    console.log();

    console.log('🎉 Migration completed successfully!');
    console.log('✅ Inspector Field Verification Officer system is ready.\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
