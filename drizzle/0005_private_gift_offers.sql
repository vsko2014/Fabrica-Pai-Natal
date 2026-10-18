ALTER TABLE "gifts" ADD COLUMN "list_type" varchar(20) NOT NULL DEFAULT 'wish';--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "recipient_user_id" text;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_list_type_check" CHECK ("list_type" IN ('wish', 'offer'));--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_recipient_list_type_check" CHECK ("list_type" <> 'wish' OR "recipient_user_id" IS NULL);--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_recipient_not_owner_check" CHECK ("recipient_user_id" IS NULL OR "recipient_user_id" <> "user_id");--> statement-breakpoint
CREATE INDEX "gifts_list_type_user_created_at_idx" ON "gifts" USING btree ("list_type", "user_id", "created_at");
