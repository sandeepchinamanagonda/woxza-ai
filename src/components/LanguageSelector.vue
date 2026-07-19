<template>
  <div ref="menuRoot" class="language-menu" data-no-translate>
    <button ref="trigger" class="language-selector" type="button" :title="`Language: ${languageName}`" aria-label="Choose website language" :aria-expanded="open" @click="toggle">
      <Languages :size="20" stroke-width="2.2" aria-hidden="true" />
    </button>
    <Teleport to="body">
      <Transition name="language-popover">
        <div v-if="open" ref="popover" class="language-popover" :class="{ 'is-dark': darkPopover }" :style="popoverPosition" role="menu" aria-label="Choose website language">
          <button v-for="item in languages" :key="item.code" type="button" :class="{ active: language === item.code }" role="menuitemradio" :aria-checked="language === item.code" @click="chooseLanguage(item.code)">
            <span>{{ item.nativeLabel }}</span><span v-if="language === item.code" aria-hidden="true">✓</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "@/composables/useI18n"
import { Languages } from "lucide-vue-next"
defineProps({ darkPopover: { type:Boolean, default:false } })
const { language, languageName, languages, setLanguage } = useI18n()
const open = ref(false)
const menuRoot = ref(null)
const trigger = ref(null)
const popover = ref(null)
const popoverPosition = ref({})
const positionPopover = () => {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  popoverPosition.value = { top:`${rect.bottom + 10}px`, right:`${Math.max(12, window.innerWidth - rect.right)}px` }
}
const toggle = async () => { open.value = !open.value; if (open.value) { await nextTick(); positionPopover() } }
const chooseLanguage = (code) => { setLanguage(code); open.value = false }
const closeOnOutsideClick = (event) => { if (!menuRoot.value?.contains(event.target) && !popover.value?.contains(event.target)) open.value = false }
onMounted(() => { document.addEventListener("click", closeOnOutsideClick); window.addEventListener("resize", positionPopover); window.addEventListener("scroll", positionPopover, true) })
onBeforeUnmount(() => { document.removeEventListener("click", closeOnOutsideClick); window.removeEventListener("resize", positionPopover); window.removeEventListener("scroll", positionPopover, true) })
</script>

<style scoped>
.language-menu { position:relative; flex:0 0 42px; width:42px; height:42px; }
.language-selector { display:grid !important; width:42px; height:42px; place-items:center; color:#14264d; border:0; border-radius:50%; background:#fff; box-shadow:0 10px 28px rgba(0,0,0,.18); cursor:pointer; transition:background .2s ease, transform .2s ease, box-shadow .2s ease; }
.language-selector:hover, .language-selector:focus-visible { background:#eef4ff; box-shadow:0 12px 24px rgba(0,0,0,.22); transform:translateY(-1px); outline:none; }
.language-popover { position:fixed; z-index:20000; display:grid; min-width:142px; padding:6px; border:1px solid rgba(20,38,77,.13); border-radius:14px; background:#fff; box-shadow:0 18px 42px rgba(15,23,42,.2); }
.language-popover button { display:flex; align-items:center; justify-content:space-between; gap:18px; width:100%; padding:9px 10px; color:#14264d; border:0; border-radius:9px; background:transparent; font:600 13px/1.2 var(--font-primary); text-align:left; cursor:pointer; }
.language-popover button:hover, .language-popover button.active { color:#fff; background:#2563eb; }
.language-popover.is-dark { border-color:rgba(255,255,255,.16); background:#14264d; box-shadow:0 18px 42px rgba(15,23,42,.35); }
.language-popover.is-dark button { color:#fff; }
.language-popover.is-dark button:hover, .language-popover.is-dark button.active { background:#2866da; }
.language-popover button span:last-child { font-weight:800; }
.language-popover-enter-active, .language-popover-leave-active { transition:opacity .16s ease, transform .16s ease; }
.language-popover-enter-from, .language-popover-leave-to { opacity:0; transform:translateY(-6px) scale(.97); }
@media (max-width: 700px) { .language-selector { width:38px; height:38px; flex-basis:38px; } }
</style>
