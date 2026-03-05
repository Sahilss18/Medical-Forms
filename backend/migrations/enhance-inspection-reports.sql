-- Migration: Enhance inspection reports schema
-- Date: 2024-03-02
-- Description: Adds structured fields for comprehensive inspection reporting

-- Add new columns to inspection_reports table
ALTER TABLE inspection_reports 
ADD COLUMN IF NOT EXISTS checklist_items JSONB NULL,
ADD COLUMN IF NOT EXISTS observations TEXT NULL,
ADD COLUMN IF NOT EXISTS recommendation VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS inspection_date DATE NULL,
ADD COLUMN IF NOT EXISTS photos JSONB NULL;

-- Add comments for documentation
COMMENT ON COLUMN inspection_reports.checklist_items IS 'Structured compliance checklist with status and remarks for each item';
COMMENT ON COLUMN inspection_reports.observations IS 'Detailed field notes from the inspector';
COMMENT ON COLUMN inspection_reports.recommendation IS 'Inspector recommendation: approve, reject, or clarification';
COMMENT ON COLUMN inspection_reports.inspection_date IS 'Date when the physical inspection was conducted';
COMMENT ON COLUMN inspection_reports.photos IS 'Array of photo metadata: [{name, url, size, uploadedAt, description}]';

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inspection_reports' 
AND column_name IN ('checklist_items', 'observations', 'recommendation', 'inspection_date', 'photos')
ORDER BY ordinal_position;

RAISE NOTICE 'Inspection reports schema enhanced successfully';
