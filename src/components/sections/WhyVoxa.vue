<template>
  <section id="why-voxa" class="why-section landing-section">
    <div class="why-container">
      <header class="section-header">
        <div class="header-title">
          <span class="section-badge">Why Woxza</span>
          <h2 class="display-heading">Beyond the <span>conversation</span></h2>
        </div>
        <div class="header-bottom">
          <p>See how Woxza understands every caller, responds naturally, and completes the real work behind the call.</p>
        </div>
      </header>

      <article class="featured-card">
        <div class="featured-live">
          <ConversationAnimation embedded @capability-active="activeCapability = $event" />
        </div>

        <div class="featured-copy">
          <span class="must-read">LIVE PROOF</span>
          <div class="active-capability-copy">
            <span class="active-icon"><component :is="activeItem.icon" /></span>
            <h3>{{ activeItem.title }}</h3>
            <p>{{ activeItem.longDescription }}</p>
          </div>
          <button class="featured-waitlist" type="button" @click="emit('join-waitlist')">Join the waitlist <ArrowUpRight /></button>
          <div class="featured-footer">
            <span>Woxza is handling this now</span>
            <span class="category-pill" :style="{ backgroundColor:activeItem.color }">{{ activeItem.category }}</span>
          </div>
        </div>
      </article>

      <div class="capability-grid">
        <article
          v-for="(item,index) in capabilities"
          :key="item.title"
          class="capability-card"
          :class="{ active:index === activeCapability }"
        >
          <div class="capability-card-top">
            <span class="capability-icon" :style="{ '--accent':item.color }"><component :is="item.icon" /></span>
            <Transition name="live-chip">
              <span v-if="index === activeCapability" class="live-chip"><i></i> ACTIVE NOW</span>
            </Transition>
          </div>
          <div class="capability-copy">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
          <footer><span class="category-pill" :style="{ backgroundColor:item.color }">{{ item.category }}</span><i></i></footer>
        </article>
      </div>

      <footer class="trust-footer">
        <div><span><LockKeyhole /> Encrypted</span><span><ShieldCheck /> DPDP compliant</span><span><Network /> Isolated data</span></div>
        <p><i></i> Proven across 1,500+ products with zero missed calls.</p>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed,ref } from "vue"
import { ArrowUpRight,Boxes,ChartNoAxesCombined,LockKeyhole,Network,PhoneCall,RefreshCw,ShieldCheck,Workflow } from "lucide-vue-next"
import ConversationAnimation from "./ConversationAnimation.vue"

const emit = defineEmits(["join-waitlist"])
const activeCapability = ref(3)

const capabilities = [
  { title:"Build agents without developers",description:"Launch specialised agents yourself.",longDescription:"Build, launch and edit specialised voice agents without code or a vendor queue. Go live the same day and create as many agents as your operation needs.",category:"Setup",color:"#2457a6",icon:Boxes },
  { title:"Real-time business data",description:"Every answer uses what is true now.",longDescription:"Woxza reads live availability, pricing, and customer context during the call, so every answer reflects what is true at that exact moment.",category:"Live data",color:"#2c6854",icon:RefreshCw },
  { title:"Fits your existing systems",description:"Your stack stays connected.",longDescription:"Calendars, CRMs, databases, email, and messaging work as one connected system. Woxza updates each tool without forcing you to replace anything.",category:"Integrations",color:"#3157a3",icon:Network },
  { title:"No missed calls or follow-ups",description:"Every caller keeps moving.",longDescription:"Every inbound call is answered instantly. Requests, confirmations and follow-ups keep moving without hold music or forgotten notes.",category:"Availability",color:"#1f6773",icon:PhoneCall },
  { title:"Acts during the call",description:"The next step happens immediately.",longDescription:"Woxza books appointments, updates records, and triggers the next workflow while the customer is still speaking—not hours after the call ends.",category:"Automation",color:"#3752a4",icon:Workflow },
  { title:"Gets smarter with every miss",description:"Gaps become permanent improvements.",longDescription:"When Woxza needs help, it hands off cleanly and flags the missing knowledge. Fix it once, and the improvement becomes part of every future call.",category:"Learning",color:"#415a84",icon:ChartNoAxesCombined }
]

const activeItem = computed(() => capabilities[activeCapability.value] || capabilities[0])
</script>

<style scoped>
.why-section{padding-inline:20px;background:#fff;color:#101828}.why-container{width:min(1200px,100%);margin:auto}.section-header{margin-bottom:46px}.section-badge{display:inline-block;padding:7px 12px;border-radius:8px;color:#666;background:#f4f4f4;font-size:11px;font-weight:600}.header-title h2{margin:18px 0 0;font-size:clamp(48px,5.3vw,64px);font-weight:560;line-height:1;letter-spacing:-2.5px}.header-bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:45px;margin-top:25px}.header-bottom p{max-width:570px;margin:0;color:#666;font-size:17px;font-weight:500;line-height:1.55;opacity:.82}.header-bottom button{display:inline-flex;align-items:center;gap:9px;padding:13px 19px;border:0;border-radius:40px;color:#fff;background:#0a0a0a;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:transform .25s}.header-bottom svg{width:15px}
.featured-card{display:grid;grid-template-columns:1.12fr .88fr;min-height:640px;overflow:hidden;border:1px solid #e9edf3;border-radius:20px;background:#fcfcfc}.featured-live{min-width:0;padding:14px;background:linear-gradient(145deg,#07172f,#0b2853)}.featured-copy{display:flex;min-width:0;flex-direction:column;padding:54px}.must-read{align-self:flex-start;padding:7px 12px;border-radius:20px;color:#fff;background:#0b0b0b;font-size:10px;font-weight:700;letter-spacing:.08em}.active-capability-copy{margin-top:48px}.active-icon{display:grid;width:46px;height:46px;place-items:center;border-radius:14px;color:#fff;background:#102b58}.active-icon svg{width:20px;height:20px;stroke-width:2}.featured-copy h3{margin:24px 0 0;font-size:clamp(35px,3.4vw,48px);font-weight:560;line-height:1.04;letter-spacing:-1.5px}.featured-copy p{margin:20px 0 0;color:#666;font-size:16px;line-height:1.7}.featured-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:auto;padding-top:35px;border-top:1px solid #e8e8e8;color:#4e5968;font-size:11px}.category-pill{display:inline-flex;align-items:center;justify-content:center;padding:5px 12px;border-radius:20px;color:#fff;font-size:10px;font-weight:650;text-transform:capitalize}.active-copy-enter-active,.active-copy-leave-active{transition:.32s cubic-bezier(.33,1,.68,1)}.active-copy-enter-from{opacity:0;transform:translateY(12px)}.active-copy-leave-to{opacity:0;transform:translateY(-8px)}
.capability-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-top:32px}.capability-card{min-width:0;padding-bottom:10px;border-radius:20px;transition:transform .4s cubic-bezier(.33,1,.68,1),box-shadow .4s}.capability-card.active{box-shadow:0 22px 45px rgba(18,50,96,.13);transform:translateY(-9px)}.visual-panel{position:relative;display:grid;aspect-ratio:16/10;overflow:hidden;place-items:center;border-radius:20px;background:radial-gradient(circle at 50% 42%,#244a82,#0b1f3e 68%)}.visual-orb{display:grid;width:82px;height:82px;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:50%;color:#fff;background:color-mix(in srgb,var(--accent) 75%,transparent);box-shadow:0 15px 45px color-mix(in srgb,var(--accent) 38%,transparent);transition:transform .5s cubic-bezier(.33,1,.68,1)}.visual-orb svg{width:31px}.hover-overlay{position:absolute;inset:0;background:rgba(0,0,0,.25);opacity:0;transition:opacity .4s}.plus-icon{position:absolute;display:grid;width:70px;height:70px;place-items:center;border:1px solid rgba(255,255,255,.25);border-radius:50%;color:#fff;background:rgba(255,255,255,.2);font-size:27px;font-weight:300;opacity:0;transform:scale(.7);transition:opacity .3s,transform .3s}.visual-panel:hover .visual-orb{transform:scale(1.08)}.visual-panel:hover .hover-overlay,.visual-panel:hover .plus-icon{opacity:1}.visual-panel:hover .plus-icon{transform:scale(1)}.corner{position:absolute;width:12px;height:12px}.top-left{top:15px;left:15px;border-top:1.5px solid #fff;border-left:1.5px solid #fff}.top-right{top:15px;right:15px;border-top:1.5px solid #fff;border-right:1.5px solid #fff}.bottom-left{bottom:15px;left:15px;border-bottom:1.5px solid #fff;border-left:1.5px solid #fff}.bottom-right{right:15px;bottom:15px;border-right:1.5px solid #fff;border-bottom:1.5px solid #fff}.live-chip{position:absolute;top:15px;right:15px;display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;color:#0d2a52;background:#fff;font-size:7px;font-weight:800;letter-spacing:.08em}.live-chip i{width:5px;height:5px;border-radius:50%;background:#22c55e}.capability-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-top:15px}.capability-meta h3{max-width:260px;margin:0;font-size:16px;font-weight:650;line-height:1.3;letter-spacing:-.02em}.capability-card>p{margin:8px 0 0;color:#7a8491;font-size:11px}.live-chip-enter-active,.live-chip-leave-active{transition:.25s}.live-chip-enter-from,.live-chip-leave-to{opacity:0;transform:scale(.8)}
.trust-footer{display:flex;align-items:center;justify-content:space-between;gap:25px;margin-top:42px;padding-top:25px;border-top:1px solid #e6ebf2}.trust-footer>div{display:flex;flex-wrap:wrap;gap:8px}.trust-footer span{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #e1e6ed;border-radius:999px;color:#596779;background:#fafbfd;font-size:9px}.trust-footer svg{width:13px;color:#3377dc}.trust-footer p{display:flex;align-items:center;gap:8px;margin:0;color:#7f8997;font-size:9px}.trust-footer p i{width:6px;height:6px;border-radius:50%;background:#3179e2}
.header-title h2{color:#0b1f3f}.header-title h2 span{color:#2563eb;background:linear-gradient(100deg,#2563eb,#4f8df7 58%,#1e4f9f);background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}.active-capability-copy,.active-capability-copy>*{opacity:1!important;visibility:visible!important}.featured-copy .active-capability-copy h3{display:block!important;color:#0b1f3f!important;-webkit-text-fill-color:#0b1f3f!important}.featured-copy .active-capability-copy p{display:block!important;color:#526174!important;opacity:1!important}.why-container{width:min(1480px,calc(100vw - 32px));max-width:none}.featured-card{grid-template-columns:minmax(0,1.25fr) minmax(400px,.75fr);height:760px;min-height:760px}.featured-live{display:flex;min-height:0}.featured-copy{min-height:0}.active-capability-copy{min-height:390px}
.featured-waitlist{display:inline-flex;align-self:flex-start;align-items:center;gap:9px;margin-top:25px;padding:13px 18px;border:0;border-radius:40px;color:#fff;background:#0b1f3f;font:inherit;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 10px 25px rgba(11,31,63,.16);transition:transform .25s,background .25s}.featured-waitlist svg{width:15px}.featured-waitlist:hover{background:#2563eb;transform:translateY(-2px)}
.capability-grid{gap:16px;margin-top:34px}.capability-grid .capability-card{position:relative;display:flex;min-height:210px;flex-direction:column;padding:24px;overflow:hidden;border:1px solid #dfe7f1;border-radius:20px;background:linear-gradient(145deg,#fff,#f7faff);box-shadow:0 10px 28px rgba(18,45,82,.055);transform:none;transition:transform .35s cubic-bezier(.33,1,.68,1),border-color .3s,box-shadow .3s}.capability-grid .capability-card::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,#6da5f5,transparent);opacity:0;transition:opacity .3s}.capability-grid .capability-card:hover{border-color:#b5cff3;box-shadow:0 18px 38px rgba(37,99,235,.1);transform:translateY(-5px)}.capability-grid .capability-card.active{border-color:#76a8ee;background:linear-gradient(145deg,#eef6ff,#fff);box-shadow:0 20px 42px rgba(37,99,235,.16);transform:translateY(-7px)}.capability-grid .capability-card.active::before{opacity:1}.capability-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.capability-icon{display:grid;width:46px;height:46px;place-items:center;border-radius:14px;color:#fff;background:var(--accent);box-shadow:0 10px 24px color-mix(in srgb,var(--accent) 25%,transparent)}.capability-icon svg{width:20px}.capability-grid .live-chip{position:static;flex:0 0 auto;color:#1f5d3d;background:#eafaf1;border:1px solid #c8efd8}.capability-copy{margin-top:26px}.capability-grid .capability-copy h3{display:block!important;margin:0;color:#0b1f3f!important;font-size:18px;font-weight:700;line-height:1.2;letter-spacing:-.025em;opacity:1!important;visibility:visible!important;-webkit-text-fill-color:#0b1f3f!important}.capability-grid .capability-copy p{display:block!important;margin:10px 0 0;color:#66758a!important;font-size:12px;line-height:1.55;opacity:1!important;visibility:visible!important}.capability-card footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:20px}.capability-card footer>i{width:28px;height:1px;background:#cbd8e9;transition:width .3s,background .3s}.capability-card:hover footer>i,.capability-card.active footer>i{width:46px;background:#4e8de8}
@media(max-width:1024px){.why-container{width:min(100%,900px)}.featured-card{grid-template-columns:1fr;height:auto;min-height:0}.featured-copy{padding:40px}.active-capability-copy{min-height:0}.capability-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:768px){.why-section{padding-inline:16px}.header-title h2{font-size:48px;letter-spacing:-2px}.header-bottom{align-items:flex-start;flex-direction:column}.featured-copy h3{font-size:32px}.capability-grid{grid-template-columns:1fr}.trust-footer{align-items:flex-start;flex-direction:column}.featured-live{padding:8px}}
@media(prefers-reduced-motion:reduce){.capability-card,.visual-orb,.hover-overlay,.plus-icon,.active-copy-enter-active,.active-copy-leave-active{transition:none}}
</style>
