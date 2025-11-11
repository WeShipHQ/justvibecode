CREATE TABLE "FreeMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"walletAddress" varchar(64) NOT NULL,
	"messageCount" varchar(32) DEFAULT '0' NOT NULL,
	"limit" varchar(32) DEFAULT '1' NOT NULL,
	"firstMessageAt" timestamp DEFAULT now() NOT NULL,
	"lastMessageAt" timestamp,
	"resetAt" timestamp,
	CONSTRAINT "FreeMessage_walletAddress_unique" UNIQUE("walletAddress")
);
--> statement-breakpoint
CREATE TABLE "Payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"walletAddress" varchar(64) NOT NULL,
	"transactionSignature" varchar(128) NOT NULL,
	"network" varchar(32) NOT NULL,
	"token" varchar(16) NOT NULL,
	"amount" varchar(64) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"facilitatorResponse" jsonb,
	"resourceUrl" text,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"verifiedAt" timestamp,
	"settledAt" timestamp,
	CONSTRAINT "Payment_transactionSignature_unique" UNIQUE("transactionSignature")
);
--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "paymentId" uuid;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "free_message_wallet_address_idx" ON "FreeMessage" USING btree ("walletAddress");--> statement-breakpoint
CREATE INDEX "payment_transaction_signature_idx" ON "Payment" USING btree ("transactionSignature");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "Payment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "payment_wallet_address_idx" ON "Payment" USING btree ("walletAddress");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "Payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_created_at_idx" ON "Payment" USING btree ("createdAt");--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_paymentId_Payment_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE no action ON UPDATE no action;