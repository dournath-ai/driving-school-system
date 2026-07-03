-- AlterTable: make series nullable for theme-only questions
ALTER TABLE "Question" ALTER COLUMN "series" DROP NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "series" DROP DEFAULT;

-- AlterTable: add image to Theme
ALTER TABLE "Theme" ADD COLUMN "image" TEXT;

-- AlterTable: add themeId to QuizAttempt
ALTER TABLE "QuizAttempt" ADD COLUMN "themeId" TEXT;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing theme-linked questions: remove series association
UPDATE "Question" SET "series" = NULL WHERE "themeId" IS NOT NULL;

-- Drop and recreate theme FK with cascade delete for theme questions
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_themeId_fkey";
ALTER TABLE "Question" ADD CONSTRAINT "Question_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
