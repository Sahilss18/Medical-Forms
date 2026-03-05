-- Combined Migration Script
-- Date: 2024-03-02
-- Description: Complete migration for Inspector Field Verification Officer system
-- Run this script with: npx typeorm query --config ormconfig.ts -f <this-file>
-- Or manually through PostgreSQL admin tools

-- ============================================
-- PART 1: Add IN_PROGRESS status to enum
-- ============================================

DO $$
BEGIN
    -- Check if inspection_status enum exists and add IN_PROGRESS
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'IN_PROGRESS' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'inspection_status')
        ) THEN
            ALTER TYPE inspection_status ADD VALUE 'IN_PROGRESS';
            RAISE NOTICE '✅ Added IN_PROGRESS value to inspection_status enum';
        ELSE
            RAISE NOTICE 'ℹ️  IN_PROGRESS already exists in inspection_status enum';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  inspection_status enum does not exist';
    END IF;
END$$;

-- ============================================
-- PART 2: Enhance inspection_reports table
-- ============================================

-- Add new columns for structured reporting
ALTER TABLE inspection_reports 
ADD COLUMN IF NOT EXISTS checklist_items JSONB NULL,
ADD COLUMN IF NOT EXISTS observations TEXT NULL,
ADD COLUMN IF NOT EXISTS recommendation VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS inspection_date DATE NULL,
ADD COLUMN IF NOT EXISTS photos JSONB NULL;

-- Add column comments for documentation
COMMENT ON COLUMN inspection_reports.checklist_items IS 'Structured compliance checklist: [{id, label, status, remarks}]';
COMMENT ON COLUMN inspection_reports.observations IS 'Detailed field notes and findings from physical inspection';
COMMENT ON COLUMN inspection_reports.recommendation IS 'Inspector recommendation: approve | reject | clarification';
COMMENT ON COLUMN inspection_reports.inspection_date IS 'Date of physical site visit';
COMMENT ON COLUMN inspection_reports.photos IS 'Photo evidence: [{name, url, size, uploadedAt, description}]';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify inspection_status enum values
SELECT 'Inspection Status Enum Values:' as info;
SELECT enumlabel as status_value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'inspection_status')
ORDER BY enumsortorder;

-- Verify inspection_reports columns
SELECT 'Inspection Reports New Columns:' as info;
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'inspection_reports' 
AND column_name IN ('checklist_items', 'observations', 'recommendation', 'inspection_date', 'photos')
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration completed successfully!';
    RAISE NOTICE 'Inspector Field Verification Officer system is ready.';
END$$;
