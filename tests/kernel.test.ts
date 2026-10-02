import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";

const operator = "11111111-1111-4111-8111-111111111111";
const stranger = "22222222-2222-4222-8222-222222222222";
const postgresUrl = process.env.TEST_DATABASE_URL;
if (
  postgresUrl &&
  !["localhost", "127.0.0.1"].includes(new URL(postgresUrl).hostname)
)
  throw new Error("Database tests require a disposable localhost database");
const pool = postgresUrl ? new Pool({ connectionString: postgresUrl }) : null;
let lite: PGlite;
type Query = (
  sql: string,
  params?: unknown[],
) => Promise<{ rows: Record<string, unknown>[] }>;
const admin: Query = async (sql, params) =>
  pool ? pool.query(sql, params) : lite.query(sql, params);
async function asUser<T>(
  user: string | null,
  fn: (query: Query) => Promise<T>,
) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        user ? "set local role authenticated" : "set local role anon",
      );
      await client.query(
        "select set_config('request.jwt.claim.sub', $1, true)",
        [user ?? ""],
      );
      const value = await fn((sql, params) => client.query(sql, params));
      await client.query("commit");
      return value;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  return lite.transaction(async (tx) => {
    await tx.exec(
      user ? "set local role authenticated" : "set local role anon",
    );
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
      user ?? "",
    ]);
    return fn((sql, params) => tx.query(sql, params));
  });
}
type Command = {
  id?: string;
  kind?: string;
  experiment?: string | null;
  version?: number | null;
  next?: string | null;
  reason?: string;
  minutes?: number | null;
};
async function command(input: Command = {}, user: string | null = operator) {
  return asUser(user, async (query) => {
    const result = await query(
      "select public.experiment_command($1,$2,$3,$4,$5,$6,$7) as result",
      [
        input.id ?? randomUUID(),
        input.kind ?? "START",
        input.experiment ?? null,
        input.version ?? null,
        input.next ?? null,
        input.reason ?? "Testing a real problem",
        input.minutes ?? null,
      ],
    );
    return result.rows[0].result as {
      id: string;
      status: string;
      stage: string;
      version: number;
      deadline_at: string;
      started_at: string;
    };
  });
}

beforeAll(async () => {
  if (!pool) lite = await PGlite.create();
  // This harness runs ONLY on disposable databases. Supabase supplies auth in production.
  const bootstrap = `create schema auth;
    create table auth.users(id uuid primary key);
    create role anon nologin;
    create role authenticated nologin;
    grant usage on schema public, auth to anon, authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    insert into auth.users values ('${operator}'),('${stranger}');`;
  if (pool) await pool.query(bootstrap);
  else await lite.exec(bootstrap);
  for (const file of readdirSync("supabase/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    if (pool) await pool.query(sql);
    else await lite.exec(sql);
  }
  await admin("insert into private.operators(user_id) values ($1)", [operator]);
}, 30000);
beforeEach(async () => {
  await admin(
    "truncate private.commands, public.interventions, public.approvals, public.events, public.experiments restart identity cascade",
  );
});
afterAll(async () => {
  if (pool) await pool.end();
  else await lite.close();
});

describe("transactional experiment kernel", () => {
  it("starts with an exact 168-hour deadline, ordered events and one intervention", async () => {
    const exp = await command({ minutes: 2 });
    expect(exp.status).toBe("ACTIVE");
    expect(exp.stage).toBe("DISCOVERING");
    expect(Date.parse(exp.deadline_at) - Date.parse(exp.started_at)).toBe(
      168 * 3600000,
    );
    const events = await admin(
      "select sequence,type from public.events order by sequence",
    );
    expect(events.rows.map((row) => row.type)).toEqual([
      "experiment.created",
      "experiment.started",
      "intervention.logged",
    ]);
    expect(events.rows.map((row) => row.sequence)).toEqual([1, 2, 3]);
    const interventions = await admin(
      "select minutes_estimate from public.interventions",
    );
    expect(Number(interventions.rows[0].minutes_estimate)).toBe(2);
  });
  it("replays an identical command without new records and rejects ID reuse", async () => {
    const id = randomUUID();
    const a = await command({ id });
    const b = await command({ id });
    expect(a).toEqual(b);
    expect(
      (await admin("select * from public.interventions")).rows,
    ).toHaveLength(1);
    await expect(command({ id, reason: "Changed payload" })).rejects.toThrow(
      /different request/,
    );
  });
  it("keeps the single active slot while paused, and resumes without extending time", async () => {
    const exp = await command();
    const paused = await command({
      kind: "PAUSE",
      experiment: exp.id,
      version: 1,
    });
    await expect(command()).rejects.toThrow(/already active/);
    const resumed = await command({
      kind: "RESUME",
      experiment: exp.id,
      version: paused.version,
    });
    expect(resumed.deadline_at).toBe(exp.deadline_at);
    expect(resumed.stage).toBe(exp.stage);
    expect(resumed.version).toBe(3);
  });
  it("rejects skipped stages, stale writes, null versions and post-kill changes", async () => {
    const exp = await command();
    await expect(
      command({
        kind: "ADVANCE",
        experiment: exp.id,
        version: 1,
        next: "BUILDING",
      }),
    ).rejects.toThrow(/Invalid stage/);
    await expect(
      command({ kind: "PAUSE", experiment: exp.id }),
    ).rejects.toThrow(/Stale/);
    const killed = await command({
      kind: "KILL",
      experiment: exp.id,
      version: 1,
    });
    await expect(
      command({ kind: "PAUSE", experiment: exp.id, version: 1 }),
    ).rejects.toThrow(/Stale/);
    await expect(
      command({ kind: "RESUME", experiment: exp.id, version: killed.version }),
    ).rejects.toThrow(/terminal/);
    await expect(command()).resolves.toMatchObject({ status: "ACTIVE" });
  });
  it("allows the complete ordered lifecycle and preserves audit order", async () => {
    let exp = await command();
    for (const next of [
      "CHALLENGING",
      "SELECTING",
      "PLANNING",
      "BUILDING",
      "TESTING",
      "DECIDING",
    ]) {
      exp = await command({
        kind: "ADVANCE",
        experiment: exp.id,
        version: exp.version,
        next,
      });
    }
    exp = await command({
      kind: "COMPLETE",
      experiment: exp.id,
      version: exp.version,
    });
    expect(exp.status).toBe("COMPLETED");
    const events = await admin(
      "select sequence from public.events order by sequence",
    );
    expect(events.rows.map((row) => row.sequence)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1),
    );
  });
  it("blocks work/resume after expiry but permits final analysis and kill", async () => {
    const exp = await command();
    await command({ kind: "PAUSE", experiment: exp.id, version: 1 });
    await admin(
      "update public.experiments set started_at=now()-interval '8 days',deadline_at=now()-interval '1 day' where id=$1",
      [exp.id],
    );
    await expect(
      command({ kind: "RESUME", experiment: exp.id, version: 2 }),
    ).rejects.toThrow(/deadline/);
    await expect(
      command({
        kind: "ADVANCE",
        experiment: exp.id,
        version: 2,
        next: "CHALLENGING",
      }),
    ).rejects.toThrow(/Deadline/);
    const analysis = await command({
      kind: "ADVANCE",
      experiment: exp.id,
      version: 2,
      next: "DECIDING",
    });
    expect(analysis.stage).toBe("DECIDING");
    await expect(
      command({ kind: "KILL", experiment: exp.id, version: analysis.version }),
    ).resolves.toMatchObject({ status: "KILLED" });
  });
  it("rolls back state and ledger if intervention persistence fails", async () => {
    await admin(
      "alter table public.interventions add constraint test_failure check (reason <> 'force failure')",
    );
    try {
      await expect(command({ reason: "force failure" })).rejects.toThrow();
      for (const table of ["experiments", "events", "interventions"])
        expect(
          (await admin(`select * from public.${table}`)).rows,
        ).toHaveLength(0);
      expect((await admin("select * from private.commands")).rows).toHaveLength(
        0,
      );
    } finally {
      await admin(
        "alter table public.interventions drop constraint test_failure",
      );
    }
  });
  it("retains original replay result after later state changes", async () => {
    const id = randomUUID();
    const exp = await command({ id });
    await command({ kind: "PAUSE", experiment: exp.id, version: 1 });
    expect(await command({ id })).toEqual(exp);
    expect(
      (await admin("select status from public.experiments")).rows[0].status,
    ).toBe("PAUSED");
  });
  it("can reopen paused final analysis after expiry without resuming venture work", async () => {
    const exp = await command();
    await admin(
      "update public.experiments set stage='DECIDING',status='PAUSED',started_at=now()-interval '8 days',deadline_at=now()-interval '1 day' where id=$1",
      [exp.id],
    );
    const deciding = await command({
      kind: "ADVANCE",
      experiment: exp.id,
      version: 1,
      next: "DECIDING",
    });
    await expect(
      command({
        kind: "COMPLETE",
        experiment: exp.id,
        version: deciding.version,
      }),
    ).resolves.toMatchObject({ status: "COMPLETED" });
  });
});

describe("database security boundaries", () => {
  it("reads a consistent private Control Room snapshot", async () => {
    const exp = await command();
    const snapshot = await asUser(operator, (query) =>
      query("select public.control_room() as data"),
    );
    const data = snapshot.rows[0].data as {
      experiment: { id: string };
      events: unknown[];
      approvals: unknown[];
      interventions: unknown[];
    };
    expect(data.experiment.id).toBe(exp.id);
    expect(data.events).toHaveLength(3);
    expect(data.interventions).toHaveLength(1);
    expect(data.approvals).toEqual([]);
    const hidden = await asUser(stranger, (query) =>
      query("select public.control_room() as data"),
    );
    expect(hidden.rows[0].data).toMatchObject({
      experiment: null,
      events: [],
      approvals: [],
      interventions: [],
    });
    await expect(
      asUser(null, (query) => query("select public.control_room()")),
    ).rejects.toThrow(/permission denied/);
  });

  it("denies anonymous and non-operator commands and hides records from other users", async () => {
    const exp = await command();
    await expect(command({}, null)).rejects.toThrow(/permission denied/);
    await expect(command({}, stranger)).rejects.toThrow(/Operator access/);
    for (const table of [
      "experiments",
      "events",
      "approvals",
      "interventions",
    ]) {
      const rows = await asUser(stranger, (query) =>
        query(`select * from public.${table}`),
      );
      expect(rows.rows).toHaveLength(0);
      await expect(
        asUser(null, (query) => query(`select * from public.${table}`)),
      ).rejects.toThrow(/permission denied/);
    }
    expect(
      (
        await asUser(operator, (query) =>
          query("select id from public.experiments"),
        )
      ).rows[0].id,
    ).toBe(exp.id);
  });
  it("denies direct writes even from operator and protects private helpers", async () => {
    await command();
    for (const statement of [
      "update public.experiments set status='PAUSED'",
      "delete from public.events",
      "update public.events set type='rewritten'",
      "delete from public.interventions",
      "insert into private.operators(user_id) values ('22222222-2222-4222-8222-222222222222')",
      "select private.append_event(gen_random_uuid(),'fake',gen_random_uuid(),'{}')",
      "truncate public.events cascade",
      "select * from private.commands",
    ]) {
      await expect(
        asUser(operator, (query) => query(statement)),
      ).rejects.toThrow(/permission denied/);
    }
    await expect(
      admin("update public.events set type='rewritten'"),
    ).rejects.toThrow(/append-only/);
  });
  it("cannot mint or approve an external action through the API", async () => {
    await command();
    await expect(
      asUser(operator, (query) =>
        query("insert into public.approvals default values"),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(operator, (query) =>
        query("update public.approvals set status='APPROVED'"),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(command({ kind: "DEPLOY" })).rejects.toThrow(
      /Invalid command/,
    );
  });
  it("revokes access immediately when operator membership is removed", async () => {
    await command();
    await admin("delete from private.operators");
    try {
      await expect(command()).rejects.toThrow(/Operator access/);
      expect(
        (
          await asUser(operator, (query) =>
            query("select * from public.events"),
          )
        ).rows,
      ).toHaveLength(0);
    } finally {
      await admin("insert into private.operators(user_id) values ($1)", [
        operator,
      ]);
    }
  });
});

it.skipIf(!pool)(
  "serialises simultaneous independent PostgreSQL requests",
  async () => {
    const starts = await Promise.allSettled([command(), command()]);
    expect(
      starts.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const exp = (
      starts.find(
        (result) => result.status === "fulfilled",
      ) as PromiseFulfilledResult<Awaited<ReturnType<typeof command>>>
    ).value;
    const id = randomUUID();
    const replays = await Promise.all([
      command({ id, kind: "PAUSE", experiment: exp.id, version: 1 }),
      command({ id, kind: "PAUSE", experiment: exp.id, version: 1 }),
    ]);
    expect(replays[0]).toEqual(replays[1]);
    expect(
      (await admin("select * from public.interventions")).rows,
    ).toHaveLength(2);
  },
);
