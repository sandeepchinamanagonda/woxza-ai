<template>
  <section class="waitlist-confirmation" role="status" aria-labelledby="waitlist-confirmation-title">
    <button class="waitlist-confirmation__close" type="button" aria-label="Close confirmation" @click="emit('close')">×</button>

    <p class="waitlist-confirmation__eyebrow">{{ eyebrow }}</p>
    <h2 id="waitlist-confirmation-title">{{ title }}</h2>
    <div class="waitlist-confirmation__divider"></div>
    <p class="waitlist-confirmation__body">{{ message }}</p>
  </section>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: "Status" },
  title: { type: String, default: "Confirmed" },
  message: {
    type: String,
    default: "You're on the Woxza waitlist. We'll reach out to the email you gave us as soon as your access is ready."
  }
})

const emit = defineEmits(["close"])
</script>

<style scoped>
.waitlist-confirmation{
  position:relative;
  width:min(420px,calc(100vw - 40px));
  padding:24px;
  border:1px solid rgba(255,255,255,.12);
  border-radius:12px;
  color:#f1f3fa;
  background-color:#0b1229;
  background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
  background-size:28px 28px;
  box-shadow:0 24px 64px rgba(0,0,0,.42);
  animation:confirmation-in 150ms ease-out both;
}
.waitlist-confirmation__close{
  position:absolute;
  top:12px;
  right:12px;
  display:grid;
  width:40px;
  height:40px;
  place-items:center;
  border:0;
  border-radius:50%;
  color:#f1f3fa;
  background:#081a34;
  font:inherit;
  font-size:24px;
  font-weight:700;
  line-height:1;
  cursor:pointer;
}
.waitlist-confirmation__close:hover{background:#102650}
.waitlist-confirmation__eyebrow{
  margin:0 0 8px;
  color:#6e85d6;
  font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  font-size:11px;
  font-weight:700;
  letter-spacing:.06em;
  line-height:1.2;
  text-transform:uppercase;
}
.waitlist-confirmation h2{
  margin:0;
  color:#f1f3fa;
  font:inherit;
  font-size:22px;
  font-weight:500;
  line-height:1.3;
}
.waitlist-confirmation__divider{height:.5px;margin:12px 0;background:rgba(255,255,255,.12)}
.waitlist-confirmation__body{margin:0;max-width:345px;color:#8c9bd6;font-size:13px;line-height:1.6}
@keyframes confirmation-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.waitlist-confirmation{animation:none}}
</style>
