<template>
  <article v-if="selected" class="call-inspector">
    <header class="detail-head">
      <div>
        <p class="mono">{{ selected.call.call_id }}</p>
        <h2>{{ selected.call.phone_number_masked || 'Unknown phone' }} <small>· {{ selected.call.provider }}</small></h2>
      </div>
      <button class="export" @click="$emit('export')">Export JSON</button>
    </header>

    <div class="meta">
      <span>Deploy {{ selected.call.deploy_version || '—' }}</span>
      <span>Started {{ time(selected.call.started_at) }}</span>
      <span>Tokens {{ number(selected.call.total_tokens) }}</span>
    </div>

    <nav class="detail-tabs" aria-label="Call detail views">
      <button v-for="item in tabs" :key="item.id" :class="{ active: detailTab === item.id }" @click="$emit('update:detail-tab', item.id)">{{ item.label }}</button>
    </nav>

    <section v-if="detailTab === 'timeline'" class="timeline">
      <div v-for="item in selected.timeline || []" :key="item.id" :class="['event', item.severity || 'info']">
        <small>{{ time(item.created_at) }}</small>
        <b>{{ item.kind === 'transcript' ? speaker(item) : item.event_type }}</b>
        <span>{{ item.kind === 'transcript' ? item.text : (item.payload?.message || item.payload?.component || 'Event') }}</span>
      </div>
    </section>

    <section v-else-if="detailTab === 'transcript'" class="chat">
      <div v-for="item in transcript" :key="item.id" :class="['bubble', speaker(item).toLowerCase()]">
        <small>{{ speaker(item) }}</small><p>{{ item.text }}</p><time>{{ time(item.created_at) }}</time>
      </div>
      <p v-if="!transcript.length" class="empty">No transcript was saved for this call.</p>
    </section>

    <section v-else-if="detailTab === 'graphical'" class="workflow-card">
      <h3>Graphical workflow</h3>
      <div class="workflow-path"><span>Caller</span><i>→</i><span>STT</span><i>→</i><span>LLM</span><i>→</i><span>TTS</span><i>→</i><span>Caller</span></div>
      <p>{{ events.length }} recorded events · {{ transcript.length }} saved conversation turns</p>
    </section>

    <section v-else-if="detailTab === 'workflow'" class="workflow-list">
      <div class="workflow-head"><span>Time</span><span>Event</span><span>Source</span><span>Latency</span></div>
      <div v-for="item in events" :key="item.id" class="workflow-row"><span>{{ time(item.created_at) }}</span><b>{{ item.event_type }}</b><span>{{ item.payload?.component || item.payload?.source || 'Event bus' }}</span><span>{{ item.latency_ms ? `${item.latency_ms} ms` : '—' }}</span></div>
    </section>

    <section v-else class="usage-panel">
      <header><div><p class="kicker">PER-CALL USAGE</p><h3>Recorded usage and estimated cost</h3></div><small>{{ selected.call.cost_estimation_version || 'No cost version recorded' }}</small></header>
      <p class="usage-notice">Estimated from Woxza’s recorded units for this call. Provider invoices remain authoritative.</p>
      <div class="usage-grid">
        <div v-for="item in usage" :key="item.label"><small>{{ item.label }}</small><strong>{{ item.value }}</strong></div>
      </div>
    </section>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ selected: { type: Object, default: null }, detailTab: { type: String, default: 'timeline' } })
defineEmits(['update:detail-tab', 'export'])
const tabs = [
  { id: 'timeline', label: 'Timeline' }, { id: 'transcript', label: 'Transcript' },
  { id: 'graphical', label: 'Graphical Workflow' }, { id: 'workflow', label: 'Conversational Workflow' },
  { id: 'usage', label: 'Usage' },
]
const number = value => Number(value || 0).toLocaleString()
const money = value => `₹${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const minutes = value => (Number(value || 0) / 60).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const time = value => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const speaker = item => ['agent', 'assistant', 'ai'].includes(String(item.speaker || '').toLowerCase()) ? 'Agent' : 'Caller'
const transcript = computed(() => (props.selected?.transcript || []).filter(item => String(item.speaker).toLowerCase() !== 'system'))
const events = computed(() => props.selected?.events || [])
const usage = computed(() => {
  const call = props.selected?.call || {}
  return [
    ['Caller audio', `${minutes(call.stt_audio_seconds)} min`], ['TTS characters', number(call.tts_characters)],
    ['Input tokens', number(call.input_tokens)], ['Cached input', number(call.llm_cached_input_tokens)],
    ['Output tokens', number(call.output_tokens)], ['Total tokens', number(call.total_tokens)],
    ['Gemini brain', money(call.estimated_gemini_inr)], ['STT', money(call.estimated_stt_inr)],
    ['TTS', money(call.estimated_tts_inr)], ['LLM total', money(call.estimated_llm_inr)], ['Call total', money(call.estimated_total_inr)],
  ].map(([label, value]) => ({ label, value }))
})
</script>

<style scoped>
.call-inspector{padding:18px;min-width:0;border:1px solid #e2e8f0;border-radius:9px;background:#fff}.detail-head{display:flex;justify-content:space-between;gap:12px}.detail-head h2{margin:3px 0 6px;font-size:20px}.detail-head h2 small,.meta,.usage-panel header small{color:#64748b;font-size:12px}.mono{margin:0;font:11px ui-monospace,monospace;color:#64748b;overflow-wrap:anywhere}.export{border:0;border-radius:7px;padding:9px 14px;background:#2563eb;color:#fff;cursor:pointer}.meta{display:flex;gap:14px;flex-wrap:wrap;margin:15px 0;font:11px ui-monospace,monospace}.detail-tabs{display:flex;gap:6px;overflow:auto;margin:14px 0 12px;border-bottom:1px solid #e2e8f0}.detail-tabs button{flex:none;border:0;border-radius:6px 6px 0 0;padding:8px 10px;background:transparent;color:#64748b;cursor:pointer;white-space:nowrap}.detail-tabs button.active{background:#2563eb;color:#fff}.timeline .event{display:grid;grid-template-columns:110px 120px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid #eef2f7;border-left:3px solid #2563eb;padding-left:10px}.timeline small,.timeline span{color:#64748b;font-size:12px}.chat{display:grid;gap:12px}.bubble{max-width:76%;padding:13px 15px;border:1px solid #dbe5f1;border-radius:10px;background:#eff6ff}.bubble.agent{justify-self:end;background:#f8fafc}.bubble p{margin:5px 0;color:#334155;line-height:1.55;white-space:pre-wrap}.bubble small,.bubble time{color:#64748b;font-size:11px}.workflow-card{padding:18px;border:1px solid #dbe5f1;border-radius:8px;background:#f8fafc}.workflow-card h3,.usage-panel h3{margin:3px 0 0;color:#0f172a}.workflow-card p{margin:18px 0 0;color:#64748b;font-size:12px}.workflow-path{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:20px}.workflow-path span{padding:8px 10px;border:1px solid #bfdbfe;border-radius:7px;background:#fff;color:#1d4ed8;font-size:12px}.workflow-path i{color:#94a3b8}.workflow-list{border:1px solid #e2e8f0;border-radius:8px;overflow:auto}.workflow-head,.workflow-row{display:grid;grid-template-columns:100px minmax(120px,1.2fr) minmax(100px,1fr) 70px;gap:10px;min-width:610px;padding:11px 10px;border-bottom:1px solid #eef2f7;color:#475569;font-size:11px}.workflow-head{background:#f8fafc;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase}.workflow-row b{color:#0f172a}.usage-panel header{display:flex;justify-content:space-between;gap:12px}.kicker{margin:0;color:#2563eb;font:700 11px ui-monospace,monospace;letter-spacing:.12em}.usage-notice{margin:12px 0;color:#64748b;font-size:12px;line-height:1.5}.usage-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.usage-grid div{padding:10px;border:1px solid #e2e8f0;border-radius:7px;background:#f8fafc}.usage-grid small{display:block;color:#64748b;font-size:10px}.usage-grid strong{display:block;margin-top:4px;color:#0f172a;font-size:14px;font-variant-numeric:tabular-nums}.empty{padding:24px;color:#64748b;text-align:center}@media(max-width:700px){.timeline .event{grid-template-columns:1fr}.usage-grid{grid-template-columns:1fr 1fr}.workflow-path{flex-wrap:wrap}.workflow-path i{display:none}}@media(max-width:460px){.usage-grid{grid-template-columns:1fr}}
</style>
