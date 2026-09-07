<template>
  <section class="overall-usage">
    <div class="usage-head">
      <p>{{ usage.notice }}</p>
      <div class="usage-range">
        <label>From<input :value="filters.date_from" type="date" @input="set('date_from', $event.target.value)"></label>
        <label>To<input :value="filters.date_to" type="date" @input="set('date_to', $event.target.value)"></label>
        <button class="secondary" @click="$emit('range', 7)">7 days</button>
        <button class="secondary" @click="$emit('range', 30)">30 days</button>
        <button class="primary" @click="$emit('apply')">Apply</button>
      </div>
    </div>

    <div class="kpis">
      <article><small>Estimated spend</small><strong>{{ money(summary.total_inr) }}</strong><em>{{ summary.calls || 0 }} calls in range</em></article>
      <article><small>Estimated cost / call</small><strong>{{ money(summary.average_cost_inr) }}</strong><em>{{ summary.calls_with_recorded_cost || 0 }} calls with recorded cost</em></article>
      <article><small>Estimated cost / call minute</small><strong>{{ money(summary.cost_per_call_minute_inr) }}</strong><em>Uses recorded call elapsed time</em></article>
      <article><small>TTS spend</small><strong>{{ money(summary.tts_inr) }}</strong><em>{{ number(summary.tts_characters) }} generated characters</em></article>
    </div>

    <div class="usage-grid">
      <article class="panel"><h2>Spend breakdown</h2><div v-for="item in spend" :key="item.label" class="bar-row"><span>{{ item.label }}</span><i><em :style="{ width: `${share(item.value)}%` }"></em></i><strong>{{ money(item.value) }}</strong></div></article>
      <article class="panel"><h2>Recorded units</h2><dl><div><dt>Caller audio</dt><dd>{{ number(summary.stt_audio_seconds / 60, 1) }} min</dd></div><div><dt>Input tokens</dt><dd>{{ number(summary.input_tokens) }}</dd></div><div><dt>Cached input</dt><dd>{{ number(summary.cached_input_tokens) }}</dd></div><div><dt>Output tokens</dt><dd>{{ number(summary.output_tokens) }}</dd></div></dl></article>
      <article class="panel wide"><h2>Data sources and calculation</h2><div class="source-table"><div class="source-head"><span>Component</span><span>Provider</span><span>Recorded unit</span><span>Source</span></div><div v-for="item in usage.sources || []" :key="item.component"><b>{{ item.component }}</b><span>{{ item.provider }}</span><span>{{ item.unit }}</span><span>{{ item.source }}</span></div></div></article>
      <article class="panel wide"><h2>Per-call usage ledger</h2><div class="ledger"><div class="ledger-head"><span>Started</span><span>Model</span><span>STT min</span><span>TTS chars</span><span>Tokens</span><span>Total</span></div><div v-for="call in usage.calls || []" :key="call.call_id"><span>{{ time(call.started_at) }}</span><span>{{ call.llm_model || 'Not recorded' }}</span><span>{{ number(call.stt_audio_seconds / 60, 1) }}</span><span>{{ number(call.tts_characters) }}</span><span>{{ number(call.total_tokens) }}</span><strong>{{ money(call.estimated_total_inr) }}</strong></div></div></article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ usage: { type: Object, required: true }, filters: { type: Object, required: true } })
const emit = defineEmits(['update:filters', 'apply', 'range'])
const summary = computed(() => props.usage.summary || {})
const number = (value, precision = 0) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })
const money = value => `₹${number(value, 2)}`
const time = value => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const spend = computed(() => [{ label: 'Speech to text', value: summary.value.stt_inr }, { label: 'Text to speech', value: summary.value.tts_inr }, { label: 'LLM brain', value: summary.value.llm_inr }])
const share = value => { const total = Number(summary.value.total_inr || 0); return total ? Math.max(2, Math.min(100, Number(value || 0) / total * 100)) : 0 }
const set = (key, value) => emit('update:filters', { ...props.filters, [key]: value })
</script>

<style scoped>
.overall-usage{display:grid;gap:16px}.usage-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:14px 16px;border:1px solid #dbe5f1;border-radius:10px;background:#fff}.usage-head p{margin:0;color:#64748b;font-size:12px;line-height:1.5}.usage-range{display:flex;align-items:end;gap:8px;flex-wrap:wrap}.usage-range label{display:grid;gap:4px;color:#64748b;font-size:11px;font-weight:600}.usage-range input{min-height:38px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:7px;background:#fff!important;color:#0f172a!important;color-scheme:light}.primary,.secondary{min-height:38px;border-radius:7px;padding:8px 11px;cursor:pointer}.primary{border:0;background:#2563eb;color:#fff}.secondary{border:1px solid #cbd5e1;background:#fff;color:#2563eb}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.kpis article,.panel{padding:18px;border:1px solid #dbe5f1;border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.05)}.kpis small,.kpis em{display:block;color:#64748b;font-size:12px}.kpis strong{display:block;margin:7px 0 3px;color:#0f172a;font-size:27px}.kpis em{font-size:11px;font-style:normal}.usage-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:16px}.wide{grid-column:1/-1}.panel h2{margin:0 0 16px;color:#0f172a;font-size:16px}.bar-row{display:grid;grid-template-columns:110px 1fr 70px;gap:9px;align-items:center;margin:14px 0;color:#475569;font-size:12px}.bar-row i{display:block;height:9px;overflow:hidden;border-radius:999px;background:#e8edf5}.bar-row em{display:block;height:100%;border-radius:inherit;background:#2563eb}.bar-row:nth-child(3) em{background:#d97706}.bar-row:nth-child(4) em{background:#7c3aed}.bar-row strong{text-align:right;color:#0f172a}.panel dl{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0}.panel dl div{padding:10px;border-radius:7px;background:#f8fafc}.panel dt{color:#64748b;font-size:11px}.panel dd{margin:4px 0 0;color:#0f172a;font-weight:700}.source-table,.ledger{overflow:auto;border:1px solid #e2e8f0;border-radius:8px}.source-table>div{display:grid;grid-template-columns:130px 150px 180px minmax(260px,1fr);gap:10px;min-width:760px;padding:11px 12px;border-bottom:1px solid #eef2f7;color:#475569;font-size:12px}.source-head,.ledger-head{background:#f8fafc!important;color:#64748b!important;font-size:10px!important;font-weight:700;text-transform:uppercase}.ledger>div{display:grid;grid-template-columns:130px minmax(150px,1fr) repeat(4,90px);gap:10px;min-width:760px;padding:11px 12px;border-bottom:1px solid #eef2f7;color:#475569;font-size:12px}.ledger strong{color:#0f172a}@media(max-width:900px){.kpis,.usage-grid{grid-template-columns:repeat(2,1fr)}.wide{grid-column:1/-1}.usage-head{align-items:stretch;flex-direction:column}}@media(max-width:600px){.kpis,.usage-grid{grid-template-columns:1fr}.panel dl{grid-template-columns:1fr}.usage-range{align-items:stretch}.usage-range label{flex:1}.usage-range input,.usage-range button{width:100%}}
</style>
