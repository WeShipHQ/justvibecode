CREATE TABLE "Command" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandboxId" uuid NOT NULL,
	"cmdId" varchar(128),
	"command" text NOT NULL,
	"args" jsonb,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"exitCode" varchar(16),
	"background" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"startedAt" timestamp,
	"finishedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "CommandLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commandId" uuid NOT NULL,
	"stream" varchar NOT NULL,
	"data" text NOT NULL,
	"sequence" varchar(32) DEFAULT '0' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Sandbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandboxId" varchar(128) NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"status" varchar DEFAULT 'running' NOT NULL,
	"url" text,
	"metadata" jsonb,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastActiveAt" timestamp DEFAULT now() NOT NULL,
	"stoppedAt" timestamp,
	CONSTRAINT "Sandbox_sandboxId_unique" UNIQUE("sandboxId")
);
--> statement-breakpoint
CREATE TABLE "SandboxFile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandboxId" uuid NOT NULL,
	"path" text NOT NULL,
	"content" text NOT NULL,
	"contentHash" varchar(64),
	"isGenerated" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Command" ADD CONSTRAINT "Command_sandboxId_Sandbox_id_fk" FOREIGN KEY ("sandboxId") REFERENCES "public"."Sandbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CommandLog" ADD CONSTRAINT "CommandLog_commandId_Command_id_fk" FOREIGN KEY ("commandId") REFERENCES "public"."Command"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SandboxFile" ADD CONSTRAINT "SandboxFile_sandboxId_Sandbox_id_fk" FOREIGN KEY ("sandboxId") REFERENCES "public"."Sandbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "command_sandbox_id_idx" ON "Command" USING btree ("sandboxId");--> statement-breakpoint
CREATE INDEX "command_cmd_id_idx" ON "Command" USING btree ("cmdId");--> statement-breakpoint
CREATE INDEX "command_status_idx" ON "Command" USING btree ("status");--> statement-breakpoint
CREATE INDEX "command_created_at_idx" ON "Command" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "command_log_command_id_idx" ON "CommandLog" USING btree ("commandId");--> statement-breakpoint
CREATE INDEX "command_log_stream_idx" ON "CommandLog" USING btree ("stream");--> statement-breakpoint
CREATE INDEX "command_log_timestamp_idx" ON "CommandLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "command_log_command_sequence_idx" ON "CommandLog" USING btree ("commandId","sequence");--> statement-breakpoint
CREATE INDEX "sandbox_sandbox_id_idx" ON "Sandbox" USING btree ("sandboxId");--> statement-breakpoint
CREATE INDEX "sandbox_user_id_idx" ON "Sandbox" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sandbox_chat_id_idx" ON "Sandbox" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "sandbox_status_idx" ON "Sandbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sandbox_created_at_idx" ON "Sandbox" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "sandbox_file_sandbox_id_idx" ON "SandboxFile" USING btree ("sandboxId");--> statement-breakpoint
CREATE INDEX "sandbox_file_path_idx" ON "SandboxFile" USING btree ("path");--> statement-breakpoint
CREATE INDEX "sandbox_file_is_generated_idx" ON "SandboxFile" USING btree ("isGenerated");--> statement-breakpoint
CREATE INDEX "sandbox_file_created_at_idx" ON "SandboxFile" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "sandbox_file_sandbox_path_idx" ON "SandboxFile" USING btree ("sandboxId","path");