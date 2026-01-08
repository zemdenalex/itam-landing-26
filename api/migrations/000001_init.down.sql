-- Extensions usually don't need to be dropped, but for consistency:
-- DROP EXTENSION IF EXISTS "citext";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Nothing to rollback in init migration
SELECT 1;
