-- Step 1: Drop the constraint
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_github_id_unique";

-- Step 2: Add new columns as nullable
ALTER TABLE "user" ADD COLUMN "google" text;
ALTER TABLE "user" ADD COLUMN "email" text;

-- Step 3: Update existing rows (you might want to customize this part)
UPDATE "user" SET google = '', email = '';

-- Step 4: Alter columns to NOT NULL
ALTER TABLE "user" ALTER COLUMN "google" SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE "user" DROP COLUMN IF EXISTS "github_id";
ALTER TABLE "user" DROP COLUMN IF EXISTS "username";

-- Step 6: Add unique constraint
ALTER TABLE "user" ADD CONSTRAINT "user_google_unique" UNIQUE("google");