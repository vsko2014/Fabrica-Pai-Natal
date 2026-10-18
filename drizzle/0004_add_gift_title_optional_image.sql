ALTER TABLE "gifts" ALTER COLUMN "image_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "title" varchar(120);--> statement-breakpoint
UPDATE "gifts" SET "title" = LEFT("description", 120) WHERE "title" IS NULL;--> statement-breakpoint
ALTER TABLE "gifts" ALTER COLUMN "title" SET NOT NULL;