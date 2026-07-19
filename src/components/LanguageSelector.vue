<template>
  <div ref="menuRoot" class="language-menu" data-no-translate>
    <button class="language-selector" type="button" :title="`Language: ${languageName}`" aria-label="Choose website language" :aria-expanded="open" @click="open = !open">
      <Languages :size="20" stroke-width="2.2" aria-hidden="true" />
    </button>
    <Transition name="language-popover">
      <div v-if="open" class="language-popover" role="menu" aria-label="Choose website language">
        <button v-for="item in languages" :key="item.code" type="button" :class="{ active: language === item.code }" role="menuitemradio" :aria-checked="language === item.code" @click="chooseLanguage(item.code)">
          <span>{{ item.nativeLabel }}</span><span v-if="language === item.code" aria-hidden="true">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "@/composables/useI18n"
import { Languages } from "lucide-vue-next"
const { language, languageName, languages, setLanguage } = useI18n()
const open = ref(false)
const menuRoot = ref(null)
const chooseLanguage = (code) => { setLanguage(code); open.value = false }
const closeOnOutsideClick = (event) => { if (!menuRoot.value?.contains(event.target)) open.value = false }
onMounted(() => document.addEventListener("click", closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener("click", closeOnOutsideClick))
</script>

<style scoped>
.language-menu { position:relative; flex:0 0 42px; width:42px; height:42px; }
.language-selector { display:grid !important; width:42px; height:42px; place-items:center; color:#14264d; border:0; border-radius:50%; background:#fff; box-shadow:0 10px 28px rgba(0,0,0,.18); cursor:pointer; transition:background .2s ease, transform .2s ease, box-shadow .2s ease; }
.language-selector:hover, .language-selector:focus-visible { background:#eef4ff; box-shadow:0 12px 24px rgba(0,0,0,.22); transform:translateY(-1px); outline:none; }
.language-popover { position:absolute; z-index:10010; top:calc(100% + 10px); right:0; display:grid; min-width:142px; padding:6px; border:1px solid rgba(20,38,77,.13); border-radius:14px; background:#fff; box-shadow:0 18px 42px rgba(15,23,42,.2); }
.language-popover button { display:flex; align-items:center; justify-content:space-between; gap:18px; width:100%; padding:9px 10px; color:#14264d; border:0; border-radius:9px; background:transparent; font:600 13px/1.2 var(--font-primary); text-align:left; cursor:pointer; }
.language-popover button:hover, .language-popover button.active { color:#fff; background:#2563eb; }
.language-popover button span:last-child { font-weight:800; }
.language-popover-enter-active, .language-popover-leave-active { transition:opacity .16s ease, transform .16s ease; }
.language-popover-enter-from, .language-popover-leave-to { opacity:0; transform:translateY(-6px) scale(.97); }
@media (max-width: 700px) { .language-selector { width:38px; height:38px; flex-basis:38px; } }
</style>
