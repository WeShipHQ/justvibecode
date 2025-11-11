ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_Chat_id_fk";
--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "parts" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "Message" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "modelId" varchar(64);--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "sandboxId" varchar(128);--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "isDeleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_user_id_idx" ON "Chat" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_updated_at_idx" ON "Chat" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "chat_is_deleted_idx" ON "Chat" USING btree ("isDeleted");--> statement-breakpoint
CREATE INDEX "message_chat_id_idx" ON "Message" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "message_payment_id_idx" ON "Message" USING btree ("paymentId");--> statement-breakpoint
CREATE INDEX "message_created_at_idx" ON "Message" USING btree ("createdAt");