DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TABLE IF EXISTS users;
-- Note: keeping update_updated_at_column() function as it may be used by other tables
