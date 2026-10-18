ALTER TABLE "gifts" ADD COLUMN "price_cents" integer;--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "status" varchar(20) DEFAULT 'available' NOT NULL;