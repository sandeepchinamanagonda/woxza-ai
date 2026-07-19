<template>
  <Teleport to="body">
    <transition name="popup-fade">
      <div v-if="isOpen" class="waitlist-overlay" @click.self="close">
        <section class="waitlist-popup" role="dialog" aria-modal="true" aria-labelledby="waitlist-popup-title">
          <button class="close-button" type="button" aria-label="Close waitlist popup" @click="close">
            <X :size="20" />
          </button>

          <form class="popup-content" @submit.prevent="joinWaitlist">
            <span class="eyebrow">JOIN THE WOXZA WAITLIST</span>
            <h2 id="waitlist-popup-title">Be first to put every call to work.</h2>
            <p>Get early access to Woxza and product updates as we open the platform.</p>
            <label>
              <span class="sr-only">Email address</span>
              <input v-model.trim="email" type="email" autocomplete="email" placeholder="Enter your email" required>
            </label>
            <button class="join-button" type="submit">Join the waitlist <ArrowRight :size="17" /></button>
            <small>By joining, you agree to receive occasional Woxza updates. You can unsubscribe anytime.</small>
          </form>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref } from "vue"
import { ArrowRight, X } from "lucide-vue-next"

defineProps({ isOpen: Boolean })
const emit = defineEmits(["close", "join"])
const email = ref("")

const close = () => emit("close")
const joinWaitlist = () => emit("join", email.value)
</script>

<style scoped>
.waitlist-overlay{position:fixed;inset:0;z-index:11000;display:grid;place-items:center;padding:24px;background:rgba(9,18,36,.64);backdrop-filter:blur(5px)}
.waitlist-popup{position:relative;width:min(430px,100%);min-height:0;padding:0;overflow:hidden;border:1px solid rgba(var(--woxza-accent-rgb),.26);border-radius:18px;background:var(--woxza-accent-soft);box-shadow:0 32px 100px rgba(4,12,29,.36)}
.close-button{position:absolute;z-index:2;top:15px;right:15px;width:34px;height:34px;display:grid;place-items:center;border:1px solid rgba(var(--woxza-accent-rgb),.2);border-radius:50%;color:var(--woxza-heading);background:var(--woxza-white);cursor:pointer;transition:transform .2s,background .2s}.close-button:hover{background:#f1f5fb;transform:rotate(90deg)}
.popup-content{display:grid;gap:16px;padding:46px 32px 30px;color:var(--woxza-heading)}.eyebrow{color:var(--woxza-accent);font-size:12px;font-weight:800;letter-spacing:.16em}.popup-content h2{max-width:380px;margin:0;color:var(--woxza-heading)!important;-webkit-text-fill-color:var(--woxza-heading);font-size:clamp(31px,4vw,38px);line-height:1.06;letter-spacing:-.045em}.popup-content>p{max-width:380px;margin:0;color:#475569;font-size:17px;line-height:1.6}.popup-content input{width:100%;min-height:54px;padding:0 15px;border:1px solid rgba(var(--woxza-accent-rgb),.26);border-radius:9px;color:var(--woxza-heading);background:var(--woxza-white);font:inherit;font-size:17px;outline:none}.popup-content input::placeholder{color:#64748b}.popup-content input:focus{border-color:var(--woxza-accent);box-shadow:0 0 0 4px rgba(var(--woxza-accent-rgb),.14)}.join-button{min-height:54px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:9px;color:var(--woxza-white);background:var(--woxza-accent);font:inherit;font-size:17px;font-weight:800;cursor:pointer;transition:background .2s,transform .2s}.join-button:hover{background:#1d4ed8;transform:translateY(-1px)}.popup-content small{color:#475569;font-size:12px;line-height:1.45}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.popup-fade-enter-active,.popup-fade-leave-active{transition:opacity .24s ease}.popup-fade-enter-active .waitlist-popup,.popup-fade-leave-active .waitlist-popup{transition:transform .24s ease}.popup-fade-enter-from,.popup-fade-leave-to{opacity:0}.popup-fade-enter-from .waitlist-popup,.popup-fade-leave-to .waitlist-popup{transform:translateY(14px) scale(.98)}

/* Match the dark navy grid surface used by the primary lead-flow modal. */
.waitlist-popup{border-color:rgba(147,197,253,.28);background:linear-gradient(rgba(147,197,253,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(147,197,253,.035) 1px,transparent 1px),#06142a;background-size:64px 64px}.close-button{color:var(--woxza-white);border-color:rgba(147,197,253,.28);background:#081a34}.popup-content{color:var(--woxza-white)}.popup-content h2{color:var(--woxza-white)!important;-webkit-text-fill-color:var(--woxza-white)}.popup-content>p,.popup-content small{color:#b8c7dd}.popup-content input{color:var(--woxza-white);border-color:rgba(147,197,253,.28);background:rgba(255,255,255,.07)}.popup-content input::placeholder{color:#b8c7dd}.join-button{color:#06142a;background:var(--woxza-white)}.join-button:hover{background:#e8f1ff}
@media(max-width:650px){.waitlist-overlay{padding:16px}.popup-content{padding:44px 25px 28px}.popup-content h2{font-size:29px}.close-button{top:12px;right:12px}}
</style>
