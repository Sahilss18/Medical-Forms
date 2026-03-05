-- Migration: Add IN_PROGRESS status to inspection_status enum
-- Date: 2024-03-02
-- Description: Adds IN_PROGRESS value to the InspectionStatus enum for tracking active inspections

-- Add IN_PROGRESS to the inspection_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'IN_PROGRESS' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'inspection_status')
    ) THEN
        ALTER TYPE inspection_status ADD VALUE 'IN_PROGRESS';
        RAISE NOTICE 'Added IN_PROGRESS value to inspection_status enum';
    ELSE
        RAISE NOTICE 'IN_PROGRESS already exists in inspection_status enum';
    END IF;
END$$;

-- Verify the enum values
SELECT enumlabel as "Status Values"
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'inspection_status')
ORDER BY enumsortorder;
