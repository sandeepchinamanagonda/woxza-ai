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
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");
  if (iso(dateFrom)) add("c.started_at >= ?", iso(dateFrom));
  if (iso(dateTo)) {
    // Date inputs are date-only values; include the entire selected end date.
    const inclusiveTo = /^\d{4}-\d{2}-\d{2}$/.test(dateTo)
      ? new Date(`${dateTo}T23:59:59.999Z`).toISOString()
      : iso(dateTo);
    add("c.started_at <= ?", inclusiveTo);
  }
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
    `SELECT c.call_id,c.org_id,c.phone_number_masked,c.provider,c.status,c.started_at,c.ended_at,c.total_latency_ms,c.turn_count,c.error_count,c.agent_id,c.trace_id,c.deploy_version,c.instance_id,c.input_tokens,c.output_tokens,c.total_tokens
     FROM calls c LEFT JOIN demo_calls d ON d.id=c.demo_call_id ${where}
     ORDER BY c.started_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, (page - 1) * pageSize]
  );
  return { items:result.rows, page, pageSize, total:count.rows[0].total };
}

export async function debugCallSummary(db, url) {
  const { where, values } = callFilters(url);
  const summary = await db.query(
    `SELECT count(*)::int AS total,
      count(*) FILTER (WHERE c.status='completed')::int AS answered,
      count(*) FILTER (WHERE c.status='failed')::int AS missed,
      COALESCE(avg(c.total_latency_ms) FILTER (WHERE c.status='completed' AND c.total_latency_ms IS NOT NULL),0)::int AS average_duration_ms
     FROM calls c LEFT JOIN demo_calls d ON d.id=c.demo_call_id ${where}`,
    values
  );
  const heatmap = await db.query(
    `SELECT EXTRACT(DOW FROM c.started_at)::int AS day, EXTRACT(HOUR FROM c.started_at)::int AS hour,
      count(*)::int AS calls, count(*) FILTER (WHERE c.status='failed' OR c.error_count>0)::int AS failures
     FROM calls c LEFT JOIN demo_calls d ON d.id=c.demo_call_id ${where}
     GROUP BY 1,2 ORDER BY 1,2`, values
  );
  return { ...summary.rows[0], heatmap:heatmap.rows };
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
  return { call, transcript:turns.rows, events:events.rows, timeline, audit:buildCallAudit(call, turns.rows, events.rows) };
}

const textOf = value => String(value || "").trim();
const payloadOf = event => event?.payload && typeof event.payload === "object" ? event.payload : {};
const firstValue = (items, keys) => {
  for (const item of items) for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && textOf(value)) return value;
  }
  return null;
};

function buildCallAudit(call, transcript, events) {
  const ordered = [...events].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  const payloads = ordered.map(payloadOf);
  const lifecycleStart = ordered.find(event => event.event_type === "call_started")?.created_at || call.started_at;
  const lifecycleEnd = ordered.find(event => event.event_type === "call_ended")?.created_at || call.ended_at;
  const questions = [];
  transcript.filter(turn => !["system","agent","assistant","ai"].includes(textOf(turn.speaker).toLowerCase()) && textOf(turn.text)).forEach((question, index, source) => {
    if (!/[?؟]$/.test(textOf(question.text)) && !/^(what|how|why|when|where|can|could|do|does|is|are|tell me|i want)/i.test(textOf(question.text))) return;
    const response = source.slice(index + 1).find(turn => ["agent","assistant","ai"].includes(textOf(turn.speaker).toLowerCase()));
    const latency = response ? Math.max(0, new Date(response.created_at) - new Date(question.created_at)) : null;
    questions.push({ question:textOf(question.text), askedAt:question.created_at, response:response?.text || null, responded:Boolean(response), resolved:Boolean(response), responseLatencyMs:latency });
  });
  const business = firstValue(payloads, ["business_label","business_name","company_name","industry","business_category"]) || firstValue(payloads.map(item => item.business_profile || {}), ["business_label","business_name","company_name","business_category"]);
  const scenario = firstValue(payloads, ["scenario","demo_scenario","triggered_demo","selected_experience"]);
  const pitchEvents = ordered.filter(event => /pitch|value_offer|deliver_pitch/i.test(`${event.event_type} ${JSON.stringify(payloadOf(event))}`));
  const toolCalls = ordered.filter(event => /tool_call|api_call|workflow|state|turn_start|turn_end|tts_start|llm_response/i.test(event.event_type));
  const errors = ordered.filter(event => event.severity === "error");
  return {
    lifecycle:{ startedAt:lifecycleStart, endedAt:lifecycleEnd, durationMs:lifecycleStart && lifecycleEnd ? Math.max(0,new Date(lifecycleEnd)-new Date(lifecycleStart)) : call.total_latency_ms, status:call.status, eventCount:ordered.length, errorCount:errors.length, reconnects:ordered.filter(event=>/reconnect/i.test(event.event_type)).length },
    questions,
    business:{ mentionedBusiness:business, triggeredDemoScenario:scenario, alignment:business && scenario ? "Review required" : "Insufficient evidence" },
    pitch:{ triggered:pitchEvents.length > 0, eventCount:pitchEvents.length, relevant:business ? "Review required" : "Insufficient evidence", valuePropositions: firstValue(payloads,["value_propositions","approved_relevant_capabilities","pitch_points"]), cta:firstValue(payloads,["cta","call_to_action","next_step"]) },
    execution:{ workflows:toolCalls.map(event=>({ time:event.created_at, name:event.event_type, trigger:payloadOf(event).trigger || payloadOf(event).source || "Event bus", status:event.severity === "error" ? "failed" : "success", durationMs:event.latency_ms, payload:payloadOf(event) })), errors:errors.map(event=>({ time:event.created_at, name:event.event_type, message:payloadOf(event).message || payloadOf(event).error || "Error" })), fallbackCount:ordered.filter(event=>/fallback|unclear|correction|retry/i.test(`${event.event_type} ${JSON.stringify(payloadOf(event))}`)).length }
  };
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

const range = url => {
  const from = iso(url.searchParams.get("from"));
  const to = iso(url.searchParams.get("to"));
  return { from, to, values:[from, to] };
};

export async function growthMetrics(db, url) {
  const period = range(url);
  const where = "WHERE ($1::timestamptz IS NULL OR created_at >= $1) AND ($2::timestamptz IS NULL OR created_at <= $2)";
  const [waitlist, demo, submissions, sales, waitlistTrend, demoTrend] = await Promise.all([
    db.query(`SELECT count(*)::int AS total FROM waitlist_registrations ${where}`, period.values),
    db.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status='completed')::int AS completed, COALESCE(avg(call_duration_seconds),0)::int AS average_duration_seconds FROM demo_calls ${where}`, period.values),
    db.query(`SELECT count(*)::int AS total FROM demo_submissions ${where}`, period.values),
    db.query(`SELECT count(*)::int AS total FROM sales_inquiries ${where}`, period.values),
    db.query(`SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS day,count(*)::int AS count FROM waitlist_registrations ${where} GROUP BY 1 ORDER BY 1`, period.values),
    db.query(`SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS day,count(*)::int AS count FROM demo_calls ${where} GROUP BY 1 ORDER BY 1`, period.values)
  ]);
  const languages = await db.query(`SELECT language,count(*)::int AS count, count(*) FILTER (WHERE status='completed')::int AS completed FROM demo_calls ${where} GROUP BY language ORDER BY count DESC`, period.values);
  const repeats = await db.query(`SELECT count(*)::int AS total FROM (SELECT phone FROM demo_calls ${where} GROUP BY phone HAVING count(*) > 1) callers`, period.values);
  const demoModes = await db.query(`SELECT COALESCE(entry_hint, use_case, 'unknown') AS mode,count(*)::int AS count FROM demo_calls ${where} GROUP BY 1 ORDER BY count DESC`, period.values);
  let comparison = null;
  if (period.from && period.to) {
    const duration = new Date(period.to).getTime() - new Date(period.from).getTime();
    if (duration > 0) {
      const prior = [new Date(new Date(period.from).getTime() - duration).toISOString(), period.from];
      const priorCounts = await Promise.all([
        db.query(`SELECT count(*)::int AS total FROM waitlist_registrations ${where}`, prior),
        db.query(`SELECT count(*)::int AS total FROM demo_calls ${where}`, prior),
        db.query(`SELECT count(*)::int AS total FROM demo_submissions ${where}`, prior),
        db.query(`SELECT count(*)::int AS total FROM sales_inquiries ${where}`, prior)
      ]);
      comparison = { waitlistTotal:priorCounts[0].rows[0].total, demoSessions:priorCounts[1].rows[0].total, demoRequests:priorCounts[2].rows[0].total, salesRequests:priorCounts[3].rows[0].total };
    }
  }
  return {
    waitlistTotal:waitlist.rows[0].total, demoSessions:demo.rows[0].total, demoCompleted:demo.rows[0].completed,
    demoRequests:submissions.rows[0].total, salesRequests:sales.rows[0].total, languages:languages.rows,
    funnel:[{ label:"Demo requested", count:submissions.rows[0].total }, { label:"Demo started", count:demo.rows[0].total }, { label:"Waitlist signup", count:waitlist.rows[0].total }],
    trends:{ waitlist:waitlistTrend.rows, demos:demoTrend.rows }, averageDurationSeconds:demo.rows[0].average_duration_seconds, repeatCallers:repeats.rows[0].total, demoModes:demoModes.rows, comparison
  };
}

const maskEmail = email => {
  const [local, domain] = String(email || "").split("@");
  return !domain ? "—" : `${local.slice(0, 1)}•••@${domain}`;
};

export async function growthRecords(db, url) {
  const kind = url.searchParams.get("kind");
  const { values } = range(url);
  const where = "WHERE ($1::timestamptz IS NULL OR created_at >= $1) AND ($2::timestamptz IS NULL OR created_at <= $2)";
  const limit = Math.min(250, Math.max(1, Number(url.searchParams.get("limit")) || 100));
  const queries = {
    waitlist: `SELECT id,email,business_name,business_type,created_at FROM waitlist_registrations ${where} ORDER BY created_at DESC LIMIT $3`,
    demo_sessions: `SELECT id AS call_id,language,entry_hint,use_case,status,call_duration_seconds,created_at FROM demo_calls ${where} ORDER BY created_at DESC LIMIT $3`,
    demo_requests: `SELECT id,name,email,language,use_case,status,failure_reason,created_at FROM demo_submissions ${where} ORDER BY created_at DESC LIMIT $3`,
    sales_requests: `SELECT id,email,business_name,business_type,created_at FROM sales_inquiries ${where} ORDER BY created_at DESC LIMIT $3`
  };
  if (!queries[kind]) return null;
  const result = await db.query(queries[kind], [...values, limit]);
  return { kind, items:result.rows.map(row => ({ ...row, ...(row.email ? { email:maskEmail(row.email) } : {}) })) };
}

export async function websiteMetrics(db, url) {
  const { from, to, values } = range(url);
  const where = "WHERE landing_page NOT LIKE '/admin%' AND ($1::timestamptz IS NULL OR created_at >= $1) AND ($2::timestamptz IS NULL OR created_at <= $2)";
  const [summary, referrers, landingPages, rows] = await Promise.all([
    db.query(`SELECT count(*)::int AS sessions, COALESCE(avg(total_seconds),0)::int AS average_seconds FROM (SELECT session_id,SUM(total_seconds)::int AS total_seconds FROM page_engagement ${where} GROUP BY session_id) sessions`, values),
    db.query(`SELECT COALESCE(NULLIF(referrer,''),'Direct') AS name,count(DISTINCT session_id)::int AS count FROM page_engagement ${where} GROUP BY 1 ORDER BY count DESC LIMIT 12`, values),
    db.query(`SELECT landing_page AS name,count(DISTINCT session_id)::int AS count FROM page_engagement ${where} GROUP BY 1 ORDER BY count DESC LIMIT 12`, values),
    db.query(`SELECT section_breakdown FROM page_engagement ${where}`, values)
  ]);
  const totals = new Map();
  for (const row of rows.rows) for (const section of row.section_breakdown || []) {
    if (!section?.name || !Number.isFinite(Number(section.seconds))) continue;
    const current = totals.get(section.name) || { name:section.name, seconds:0, reached:0 };
    current.seconds += Number(section.seconds); if (Number(section.seconds) > 0) current.reached += 1; totals.set(section.name, current);
  }
  const sessions = summary.rows[0].sessions || 0;
  return { sessions, averageSeconds:summary.rows[0].average_seconds, referrers:referrers.rows, landingPages:landingPages.rows, sections:[...totals.values()].map(item => ({ ...item, averageSeconds:sessions ? Math.round(item.seconds / sessions) : 0, reachPercent:sessions ? Math.round(item.reached / sessions * 100) : 0 })).sort((a,b)=>b.averageSeconds-a.averageSeconds), from, to };
}
