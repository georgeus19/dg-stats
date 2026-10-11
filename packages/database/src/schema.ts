import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const sourceProvider = pgEnum("source_provider", ["pdga", "udisc", "native"]);
export const roundCoverage = pgEnum("round_coverage", [
  "scores_only",
  "aggregate_stats",
  "throw_timeline",
  "partial",
  "complete"
]);
export const syncJobStatus = pgEnum("sync_job_status", ["queued", "running", "succeeded", "failed"]);

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const player = pgTable("player", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  pdgaNumber: integer("pdga_number"),
  createdAt
}, (table) => [
  uniqueIndex("player_pdga_number_unique").on(table.pdgaNumber)
]);

export const playerIdentity = pgTable("player_identity", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id").notNull().references(() => player.id, { onDelete: "cascade" }),
  provider: sourceProvider("provider").notNull(),
  externalId: text("external_id").notNull(),
  consentGrantedAt: timestamp("consent_granted_at", { withTimezone: true }),
  createdAt
}, (table) => [
  uniqueIndex("player_identity_provider_external_id_unique").on(table.provider, table.externalId),
  index("player_identity_player_id_idx").on(table.playerId)
]);

export const event = pgTable("event", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: sourceProvider("provider").notNull(),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  startsOn: date("starts_on"),
  endsOn: date("ends_on"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt
}, (table) => [
  uniqueIndex("event_provider_external_id_unique").on(table.provider, table.externalId)
]);

export const layoutVersion = pgTable("layout_version", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => event.id, { onDelete: "set null" }),
  providerLayoutId: text("provider_layout_id"),
  name: text("name").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt
}, (table) => [index("layout_version_event_id_idx").on(table.eventId)]);

export const round = pgTable("round", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: sourceProvider("provider").notNull(),
  externalId: text("external_id").notNull(),
  playerId: uuid("player_id").notNull().references(() => player.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => event.id, { onDelete: "set null" }),
  layoutVersionId: uuid("layout_version_id").references(() => layoutVersion.id, { onDelete: "set null" }),
  roundNumber: integer("round_number"),
  playedOn: date("played_on"),
  score: integer("score"),
  par: integer("par"),
  rating: real("rating"),
  coverage: roundCoverage("coverage").notNull().default("scores_only"),
  createdAt,
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("round_provider_external_id_unique").on(table.provider, table.externalId),
  index("round_player_played_on_idx").on(table.playerId, table.playedOn),
  index("round_event_id_idx").on(table.eventId)
]);

export const holeScore = pgTable("hole_score", {
  id: uuid("id").defaultRandom().primaryKey(),
  roundId: uuid("round_id").notNull().references(() => round.id, { onDelete: "cascade" }),
  holeNumber: integer("hole_number").notNull(),
  score: integer("score").notNull(),
  par: integer("par"),
  lengthMeters: integer("length_meters"),
  createdAt
}, (table) => [
  uniqueIndex("hole_score_round_hole_unique").on(table.roundId, table.holeNumber)
]);

export const statObservation = pgTable("stat_observation", {
  id: uuid("id").defaultRandom().primaryKey(),
  roundId: uuid("round_id").notNull().references(() => round.id, { onDelete: "cascade" }),
  provider: sourceProvider("provider").notNull(),
  metricCode: text("metric_code").notNull(),
  metricVersion: text("metric_version").notNull(),
  count: integer("count"),
  opportunityCount: integer("opportunity_count"),
  value: real("value"),
  rawValue: jsonb("raw_value").$type<Record<string, unknown>>(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("stat_observation_round_metric_unique").on(table.roundId, table.metricCode, table.metricVersion),
  index("stat_observation_metric_idx").on(table.metricCode)
]);

export const throwFact = pgTable("throw_fact", {
  id: uuid("id").defaultRandom().primaryKey(),
  roundId: uuid("round_id").notNull().references(() => round.id, { onDelete: "cascade" }),
  holeNumber: integer("hole_number").notNull(),
  ordinal: integer("ordinal").notNull(),
  rawZone: text("raw_zone"),
  normalizedZone: text("normalized_zone"),
  distanceToTargetMeters: real("distance_to_target_meters"),
  penaltyStrokes: integer("penalty_strokes").notNull().default(0),
  nextLie: text("next_lie"),
  rawValue: jsonb("raw_value").$type<Record<string, unknown>>(),
  createdAt
}, (table) => [
  uniqueIndex("throw_fact_round_hole_ordinal_unique").on(table.roundId, table.holeNumber, table.ordinal),
  index("throw_fact_round_id_idx").on(table.roundId)
]);

export const importBatch = pgTable("import_batch", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: sourceProvider("provider").notNull(),
  sourceLocator: text("source_locator").notNull(),
  fingerprint: text("fingerprint").notNull(),
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
  rawPayloadRetentionApproved: boolean("raw_payload_retention_approved").notNull().default(false),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("import_batch_provider_fingerprint_unique").on(table.provider, table.fingerprint)
]);

export const syncJob = pgTable("sync_job", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: sourceProvider("provider").notNull(),
  kind: text("kind").notNull(),
  status: syncJobStatus("status").notNull().default("queued"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  attempts: integer("attempts").notNull().default(0),
  runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt
}, (table) => [
  index("sync_job_next_idx").on(table.status, table.runAfter)
]);
