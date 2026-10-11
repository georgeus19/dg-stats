import { Hono } from "hono";
import { Pool } from "pg";

type SyncJob = {
  id: string;
  provider: "pdga" | "udisc" | "native";
  kind: string;
  payload: Record<string, unknown>;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5
});

const app = new Hono();

async function claimNextJob(): Promise<SyncJob | null> {
  const result = await pool.query<SyncJob>(`
    with next_job as (
      select id
      from sync_job
      where status = 'queued' and run_after <= now()
      order by run_after asc, created_at asc
      for update skip locked
      limit 1
    )
    update sync_job
    set status = 'running', locked_at = now(), attempts = attempts + 1
    from next_job
    where sync_job.id = next_job.id
    returning sync_job.id, sync_job.provider, sync_job.kind, sync_job.payload
  `);

  return result.rows[0] ?? null;
}

async function finishJob(jobId: string): Promise<void> {
  await pool.query(
    "update sync_job set status = 'succeeded', completed_at = now() where id = $1",
    [jobId]
  );
}

async function failJob(jobId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : "Unknown sync failure";
  await pool.query(
    "update sync_job set status = 'failed', last_error = $2 where id = $1",
    [jobId, message]
  );
}

async function processJob(job: SyncJob): Promise<void> {
  // This is intentionally a policy gate, not an undocumented provider client.
  // Add a provider adapter only after its access and retention terms are approved.
  if (job.provider === "udisc") {
    throw new Error("No automated UDisc adapter is enabled.");
  }

  if (job.provider === "pdga") {
    throw new Error("PDGA adapter is not enabled until authorized access is configured.");
  }

  // Native round-entry jobs will be implemented with the scorecard feature.
}

app.get("/", (context) => context.json({ ok: true, service: "dg-stats-sync" }));

app.post("/", async (context) => {
  const isNeonTrigger = Boolean(context.req.header("x-neon-trigger-invocation-id"));
  const isLocalInvocation = context.req.header("x-sync-worker-token") === process.env.SYNC_WORKER_TOKEN;

  if (!isNeonTrigger && !isLocalInvocation) {
    return context.json({ error: "Scheduled invocation required." }, 403);
  }

  const job = await claimNextJob();
  if (!job) {
    return context.json({ ok: true, processed: false, reason: "no-queued-job" });
  }

  try {
    await processJob(job);
    await finishJob(job.id);
    return context.json({ ok: true, processed: true, jobId: job.id });
  } catch (error) {
    await failJob(job.id, error);
    return context.json({ ok: false, processed: true, jobId: job.id }, 500);
  }
});

export default app;
