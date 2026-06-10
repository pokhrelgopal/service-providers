-- Runs once when the Postgres data dir is first initialised (against POSTGRES_DB).
-- Enables the extensions used for "providers around me" radius search in M6.
-- earthdistance depends on cube, so cube comes first. Idempotent.
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;
-- uuid_generate_v4() for entity primary keys.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
