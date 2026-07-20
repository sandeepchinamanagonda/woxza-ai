const pageOf = value => Math.max(1, Number.parseInt(value || "1", 10) || 1);
const pageSizeOf = value => Math.min(100, Math.max(1, Number.parseInt(value || "25", 10) || 25));
const iso = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;

function callFilters(url, { errorsOnly=false } = {}) {
  const where = [], values = [];
  const add = (sql, value) => { values.push(value); where.push(sql.replace("?", `$${values.length}`)); };
  if (errorsOnly) where.push("(c.status='failed' OR c.error_count > 0)");
  if (url.searchParams.get("org_id")) add("c.org_id=?", url.searchParams.get("org_id"));
  if (url.searchParams.get("provider")) add("c.provider=?", url.searchParams.get("provider"));
  if (url.searchParams.get("status")) add("c.status=?", url.searchParams.get("status"));
  if (iso(url.searchParams.get("date_from"))) add("c.started_at >= ?", iso(url.searchParams.get("date_from")));
  if (iso(url.searchParams.get("date_to"))) add("c.started_at <= ?", iso(url.searchParams.get("date_to")));
  if (url.searchParams.get("deploy_version")) add("c.deploy_version=?", url.searchParams.get("deploy_version"));
  if (url.searchParams.get("instance_id")) add("c.instance_id=?", url.searchParams.get("instance_id"));
  if (url.searchParams.get("min_latency_ms")) add("c.total_latency_ms >= ?", Number(url.searchParams.get("min_latency_ms")) || 0);
  if (url.searchParams.get("phone_search")) {
    values.push(`%${url.searchParams.get("phone_search").replace(/[%_]/g, "\\$&")}%`);
    where.push(`(c.phone_number_masked ILIKE $${values.length} ESCAPE '\\' OR d.phone ILIKE $${values.length} ESCAPE '\\')`);
  }
  return { where:where.length ? `WHERE ${where.join(" AND ")}` : "", values };
}

export async function listDebugCalls(db, url, { errorsOnly=false } = {}) {
  const { where, values } = callFilters(url, { errorsOnly });
  const page = pageOf(url.searchParams.get("page")), pageSize = pageSizeOf(url.searchParams.get("page_size"));
  const count = await db.query(`SELECT count(*)::int AS total FROM calls c LEFT JOIN demo_calls d ON d.id=c.demo_call_id ${where}`, values);
  const result = await db.query(
    `SELECT c.call_id,c.org_id,c.phone_number_masked,c.provider,c.status,c.started_at,c.ended_at,c.total_latency_ms,c.turn_count,c.error_count,c.agent_id,c.trace_id,c.deploy_version,c.instance_id
     FROM calls c LEFT JOIN demo_calls d ON d.id=c.demo_call_id ${where}
     ORDER BY c.started_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, (page - 1) * pageSize]
  );
  return { items:result.rows, page, pageSize, total:count.rows[0].total };
}

export async function getDebugCall(db, callId) {
  const summary = await db.query("SELECT * FROM calls WHERE call_id=$1", [callId]);
  if (!summary.rowCount) return null;
  const call = summary.rows[0];
  const [turns, events] = await Promise.all([
    db.query("SELECT id,speaker,text,created_at FROM call_transcript_turns WHERE demo_call_id=$1 ORDER BY created_at,id", [call.demo_call_id]),
    db.query("SELECT id,event_type,severity,payload,latency_ms,trace_id,deploy_version,instance_id,created_at FROM call_events WHERE call_id=$1 ORDER BY created_at,id", [callId])
  ]);
  const timeline = [
    ...turns.rows.map(turn => ({ kind:"transcript", ...turn })),
    ...events.rows.map(event => ({ kind:"event", ...event }))
  ].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  return { call, transcript:turns.rows, events:events.rows, timeline };
}

export async function searchDebugCalls(db, query) {
  const term = `%${String(query || "").trim().replace(/[%_]/g, "\\$&")}%`;
  if (term === "%%") return { items:[] };
  const result = await db.query(
    `SELECT DISTINCT ON (c.call_id) c.call_id,c.org_id,c.phone_number_masked,c.provider,c.status,c.started_at,c.total_latency_ms,c.turn_count,c.error_count,
      t.text AS matching_transcript
     FROM calls c LEFT JOIN demo_calls d ON d.id=c.demo_call_id LEFT JOIN call_transcript_turns t ON t.demo_call_id=c.demo_call_id
     WHERE c.call_id ILIKE $1 ESCAPE '\\' OR c.phone_number_masked ILIKE $1 ESCAPE '\\' OR d.phone ILIKE $1 ESCAPE '\\' OR t.text ILIKE $1 ESCAPE '\\'
     ORDER BY c.call_id,c.started_at DESC LIMIT 100`, [term]
  );
  return { items:result.rows };
}

export async function growthMetrics(db) {
  const [waitlist, demo, submissions, sales, waitlistTrend, demoTrend] = await Promise.all([
    db.query("SELECT count(*)::int AS total FROM waitlist_registrations"),
    db.query("SELECT count(*)::int AS total, count(*) FILTER (WHERE status='completed')::int AS completed FROM demo_calls"),
    db.query("SELECT count(*)::int AS total FROM demo_submissions"),
    db.query("SELECT count(*)::int AS total FROM sales_inquiries"),
    db.query("SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS day,count(*)::int AS count FROM waitlist_registrations WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY 1"),
    db.query("SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS day,count(*)::int AS count FROM demo_calls WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY 1")
  ]);
  const languages = await db.query("SELECT language,count(*)::int AS count FROM demo_calls GROUP BY language ORDER BY count DESC");
  return {
    waitlistTotal:waitlist.rows[0].total, demoSessions:demo.rows[0].total, demoCompleted:demo.rows[0].completed,
    demoRequests:submissions.rows[0].total, salesRequests:sales.rows[0].total, languages:languages.rows,
    funnel:[{ label:"Demo requested", count:submissions.rows[0].total }, { label:"Demo started", count:demo.rows[0].total }, { label:"Waitlist signup", count:waitlist.rows[0].total }],
    trends:{ waitlist:waitlistTrend.rows, demos:demoTrend.rows }, visitTrackingConnected:false
  };
}
