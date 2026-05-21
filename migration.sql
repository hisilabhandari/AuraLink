ALTER TABLE profiles ADD COLUMN font_color TEXT DEFAULT '#ffffff';
ALTER TABLE profiles ADD COLUMN seo_title TEXT;
ALTER TABLE profiles ADD COLUMN seo_description TEXT;
ALTER TABLE profiles ADD COLUMN allow_indexing INTEGER DEFAULT 1;

ALTER TABLE links ADD COLUMN image_url TEXT;
ALTER TABLE links ADD COLUMN icon_name TEXT;
ALTER TABLE links ADD COLUMN link_type TEXT DEFAULT 'link';
ALTER TABLE links ADD COLUMN price REAL;
ALTER TABLE links ADD COLUMN currency TEXT DEFAULT 'USD';
