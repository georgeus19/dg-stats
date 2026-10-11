CREATE TYPE "public"."round_coverage" AS ENUM('scores_only', 'aggregate_stats', 'throw_timeline', 'partial', 'complete');--> statement-breakpoint
CREATE TYPE "public"."source_provider" AS ENUM('pdga', 'udisc', 'native');--> statement-breakpoint
CREATE TYPE "public"."sync_job_status" AS ENUM('queued', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "source_provider" NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hole_score" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"hole_number" integer NOT NULL,
	"score" integer NOT NULL,
	"par" integer,
	"length_meters" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "source_provider" NOT NULL,
	"source_locator" text NOT NULL,
	"fingerprint" text NOT NULL,
	"raw_payload" jsonb,
	"raw_payload_retention_approved" boolean DEFAULT false NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layout_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"provider_layout_id" text,
	"name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"pdga_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_identity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"provider" "source_provider" NOT NULL,
	"external_id" text NOT NULL,
	"consent_granted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "source_provider" NOT NULL,
	"external_id" text NOT NULL,
	"player_id" uuid NOT NULL,
	"event_id" uuid,
	"layout_version_id" uuid,
	"round_number" integer,
	"played_on" date,
	"score" integer,
	"par" integer,
	"rating" real,
	"coverage" "round_coverage" DEFAULT 'scores_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stat_observation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"provider" "source_provider" NOT NULL,
	"metric_code" text NOT NULL,
	"metric_version" text NOT NULL,
	"count" integer,
	"opportunity_count" integer,
	"value" real,
	"raw_value" jsonb,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "source_provider" NOT NULL,
	"kind" text NOT NULL,
	"status" "sync_job_status" DEFAULT 'queued' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "throw_fact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"hole_number" integer NOT NULL,
	"ordinal" integer NOT NULL,
	"raw_zone" text,
	"normalized_zone" text,
	"distance_to_target_meters" real,
	"penalty_strokes" integer DEFAULT 0 NOT NULL,
	"next_lie" text,
	"raw_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hole_score" ADD CONSTRAINT "hole_score_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layout_version" ADD CONSTRAINT "layout_version_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_identity" ADD CONSTRAINT "player_identity_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_layout_version_id_layout_version_id_fk" FOREIGN KEY ("layout_version_id") REFERENCES "public"."layout_version"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stat_observation" ADD CONSTRAINT "stat_observation_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "throw_fact" ADD CONSTRAINT "throw_fact_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_provider_external_id_unique" ON "event" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hole_score_round_hole_unique" ON "hole_score" USING btree ("round_id","hole_number");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batch_provider_fingerprint_unique" ON "import_batch" USING btree ("provider","fingerprint");--> statement-breakpoint
CREATE INDEX "layout_version_event_id_idx" ON "layout_version" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_pdga_number_unique" ON "player" USING btree ("pdga_number");--> statement-breakpoint
CREATE UNIQUE INDEX "player_identity_provider_external_id_unique" ON "player_identity" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "player_identity_player_id_idx" ON "player_identity" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "round_provider_external_id_unique" ON "round" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "round_player_played_on_idx" ON "round" USING btree ("player_id","played_on");--> statement-breakpoint
CREATE INDEX "round_event_id_idx" ON "round" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stat_observation_round_metric_unique" ON "stat_observation" USING btree ("round_id","metric_code","metric_version");--> statement-breakpoint
CREATE INDEX "stat_observation_metric_idx" ON "stat_observation" USING btree ("metric_code");--> statement-breakpoint
CREATE INDEX "sync_job_next_idx" ON "sync_job" USING btree ("status","run_after");--> statement-breakpoint
CREATE UNIQUE INDEX "throw_fact_round_hole_ordinal_unique" ON "throw_fact" USING btree ("round_id","hole_number","ordinal");--> statement-breakpoint
CREATE INDEX "throw_fact_round_id_idx" ON "throw_fact" USING btree ("round_id");