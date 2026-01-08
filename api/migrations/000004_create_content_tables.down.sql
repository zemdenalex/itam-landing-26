DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
DROP TRIGGER IF EXISTS update_news_updated_at ON news;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

DROP TABLE IF EXISTS stats;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS club_images;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS project_tags;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS tags;
