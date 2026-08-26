-- Makes the "More" info list admin-manageable: icon + section (which list
-- it renders under) + position (display order), instead of the frontend
-- hardcoding an icon/label per known slug.
ALTER TABLE content_pages ADD COLUMN icon TEXT NOT NULL DEFAULT 'doc';
ALTER TABLE content_pages ADD COLUMN section TEXT NOT NULL DEFAULT 'info' CHECK (section IN ('info', 'legal'));
ALTER TABLE content_pages ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE content_pages ADD COLUMN visible BOOLEAN NOT NULL DEFAULT true;

UPDATE content_pages SET icon = 'info', section = 'info', position = 1 WHERE slug = 'about';
UPDATE content_pages SET icon = 'building', section = 'info', position = 2 WHERE slug = 'venue';
UPDATE content_pages SET icon = 'location', section = 'info', position = 3 WHERE slug = 'directions';
UPDATE content_pages SET icon = 'car', section = 'info', position = 4 WHERE slug = 'parking';
UPDATE content_pages SET icon = 'bed', section = 'info', position = 5 WHERE slug = 'accommodation';
UPDATE content_pages SET icon = 'food', section = 'info', position = 6 WHERE slug = 'food';
UPDATE content_pages SET icon = 'heart', section = 'info', position = 7 WHERE slug = 'sponsors';
UPDATE content_pages SET icon = 'user', section = 'info', position = 8 WHERE slug = 'committee';
UPDATE content_pages SET icon = 'contact', section = 'info', position = 9 WHERE slug = 'contacts';
UPDATE content_pages SET icon = 'shield', section = 'legal', position = 1 WHERE slug = 'privacy';
UPDATE content_pages SET icon = 'doc', section = 'legal', position = 2 WHERE slug = 'terms';
