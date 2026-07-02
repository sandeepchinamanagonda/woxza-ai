<template>
  <div class="call-overlay">
    <div class="transcript-card">
      <div class="card-header">
        <div class="status-dot"></div>

        <div>
          <strong>Live Voxa call</strong>
          <small>Transcript and actions</small>
        </div>
      </div>

      <div class="transcript">
        <div
          v-for="line in lines"
          :key="line.text"
          class="line"
          :class="line.speaker.toLowerCase()"
        >
          <span>{{ line.speaker }}</span>
          <p>{{ line.text }}</p>
        </div>
      </div>

      <div class="actions">
        <span>Booked appointment</span>
        <span>CRM updated</span>
        <span>Follow-up sent</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const lines = [
  {
    speaker: "Person",
    text: "Can you answer customer calls after hours?"
  },
  {
    speaker: "Voxa",
    text: "Yes. I answer, qualify, book and sync the CRM."
  },
  {
    speaker: "Person",
    text: "Can you send a summary?"
  },
  {
    speaker: "Voxa",
    text: "Done. The appointment and follow-up are ready."
  }
]
</script>

<style scoped>
.call-overlay{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:50;
}

.transcript-card{
  position:absolute;
  right:5%;
  top:13%;
  width:min(430px,78%);
  padding:24px;
  border-radius:22px;
  background:#ffffff;
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 34px 90px rgba(15,23,42,.14);
}

.transcript-card::before{
  content:"";
  position:absolute;
  inset:-18px;
  z-index:-1;
  border-radius:30px;
  background:rgba(255,255,255,.88);
}

.card-header{
  display:flex;
  align-items:center;
  gap:13px;
  padding-bottom:18px;
  border-bottom:1px solid rgba(15,23,42,.08);
}

.status-dot{
  width:13px;
  height:13px;
  border-radius:50%;
  background:var(--voxa-accent);
  box-shadow:0 0 0 9px rgba(var(--voxa-accent-rgb),.10);
  flex-shrink:0;
}

.card-header strong{
  display:block;
  font-size:18px;
  line-height:1.15;
  font-weight:800;
  color:var(--voxa-blue);
}

.card-header small{
  display:block;
  margin-top:5px;
  font-size:13px;
  color:#64748b;
}

.transcript{
  display:grid;
  gap:10px;
  margin:20px 0;
}

.line{
  display:grid;
  grid-template-columns:88px 1fr;
  gap:14px;
  align-items:start;
  padding:14px 15px;
  border-radius:16px;
  background:#f8fbff;
  border:1px solid rgba(15,23,42,.04);
}

.line span{
  color:#64748b;
  font-size:12px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
  white-space:nowrap;
}

.line p{
  margin:0;
  color:#334155;
  font-size:15px;
  line-height:1.5;
}

.line.voxa{
  background:rgba(var(--voxa-accent-rgb),.08);
}

.line.voxa span{
  color:var(--voxa-accent);
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.actions span{
  display:inline-flex;
  padding:8px 10px;
  border-radius:999px;
  background:#f8fbff;
  border:1px solid rgba(15,23,42,.06);
  color:#475569;
  font-size:12px;
  font-weight:800;
}

@media(max-width:1100px){
  .transcript-card{
    left:50%;
    right:auto;
    top:10%;
    transform:translateX(-50%);
    width:min(430px,84%);
  }
}

@media(max-width:600px){
  .transcript-card{
    top:18px;
    width:calc(100% - 28px);
    padding:18px;
  }

  .line{
    grid-template-columns:1fr;
    gap:5px;
  }
}
</style>
