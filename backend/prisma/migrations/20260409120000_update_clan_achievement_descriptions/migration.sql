-- Update achievement descriptions: club → clan
-- Part of #P1-rename series. See seed.js commit ad635c6.
-- Rollback:
--   UPDATE "Achievement" SET description = 'Joined a club' WHERE type = 'PROJECT_MAYHEM';
--   UPDATE "Achievement" SET description = 'Created a club' WHERE type = 'PAPER_STREET';

UPDATE "Achievement" SET description = 'Joined a clan' WHERE type = 'PROJECT_MAYHEM';
UPDATE "Achievement" SET description = 'Created a clan' WHERE type = 'PAPER_STREET';
