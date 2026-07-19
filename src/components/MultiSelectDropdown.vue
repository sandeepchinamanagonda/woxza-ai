<template>
  <div ref="root" class="multi-select">
    <button ref="trigger" class="multi-select__trigger" type="button" :aria-expanded="isOpen" :aria-label="label" @click="toggleMenu">
      <span :class="{ placeholder: !modelValue.length }">{{ selectedSummary }}</span>
      <i aria-hidden="true"></i>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" ref="menu" class="multi-select__menu" :class="{ 'multi-select__menu--dark': dark }" :style="menuStyle" role="group" :aria-label="label" @wheel.stop>
        <button v-for="option in options" :key="option.value" type="button" :class="{ selected: draftValues.includes(option.value), disabled: isDisabled(option.value) }" :disabled="isDisabled(option.value)" @click="toggle(option.value)">
          <span>{{ option.label }}</span>
          <b v-if="draftValues.includes(option.value)" aria-hidden="true">✓</b>
        </button>
        <button class="multi-select__done" type="button" @click="applySelection">Done</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, onMounted } from "vue"

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, required: true },
  placeholder: { type: String, required: true },
  label: { type: String, required: true },
  max: { type: Number, default: Infinity },
  dark: { type: Boolean, default: false }
})
const emit = defineEmits(["update:modelValue"])
const isOpen = ref(false)
const root = ref(null)
const trigger = ref(null)
const menu = ref(null)
const menuStyle = ref({})
const draftValues = ref([])

const selectedSummary = computed(() => {
  const selected = props.options.filter((option) => props.modelValue.includes(option.value))
  if (!selected.length) return props.placeholder
  if (selected.length <= 2) return selected.map((option) => option.label).join(", ")
  return `${selected.length} selected`
})

const isDisabled = (value) => !draftValues.value.includes(value) && draftValues.value.length >= props.max
const toggle = (value) => {
  const selected = draftValues.value.includes(value)
    ? draftValues.value.filter((item) => item !== value)
    : [...draftValues.value, value]
  draftValues.value = selected
  // Persist each click immediately so switching to another dropdown never loses it.
  emit("update:modelValue", selected)
}

const openMenu = () => {
  draftValues.value = [...props.modelValue]
  const bounds = trigger.value?.getBoundingClientRect()
  if (bounds) {
    const desiredHeight = Math.min(360, props.options.length * 44 + 58)
    const below = window.innerHeight - bounds.bottom - 12
    const above = bounds.top - 12
    const opensUp = below < desiredHeight && above > below
    menuStyle.value = {
      position: "fixed", zIndex: 10100, left: `${bounds.left}px`, width: `${bounds.width}px`,
      maxHeight: `${Math.max(140, Math.min(desiredHeight, opensUp ? above : below))}px`,
      top: opensUp ? "auto" : `${bounds.bottom + 6}px`,
      bottom: opensUp ? `${window.innerHeight - bounds.top + 6}px` : "auto"
    }
  }
  isOpen.value = true
}
const toggleMenu = () => { if (isOpen.value) isOpen.value = false; else openMenu() }
const applySelection = () => {
  isOpen.value = false
}
const closeOutside = (event) => {
  if (!root.value?.contains(event.target) && !menu.value?.contains(event.target)) isOpen.value = false
}
onMounted(() => document.addEventListener("pointerdown", closeOutside, true))
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeOutside, true))
</script>

<style scoped>
.multi-select__trigger{display:grid;width:100%;min-height:44px;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 13px;border:1px solid rgba(15,23,42,.10);border-radius:8px;color:var(--lead-accent,var(--woxza-blue));background:#fff;font:inherit;font-size:14px;font-weight:400;text-align:left;cursor:pointer}.multi-select__trigger span{overflow:hidden;font-weight:400;text-overflow:ellipsis;white-space:nowrap}.multi-select__trigger .placeholder{color:#94a3b8;font-weight:400}.multi-select__trigger i{width:8px;height:8px;margin-right:3px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px)}.multi-select__trigger:focus{border-color:var(--lead-accent,var(--woxza-accent));box-shadow:0 0 0 4px rgba(var(--lead-accent-rgb,var(--woxza-accent-rgb)),.1);outline:none}
.multi-select__menu{overflow-y:auto;overscroll-behavior:contain;padding:6px;border:1px solid rgba(15,23,42,.12);border-radius:10px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.18);font-family:var(--font-primary)}.multi-select__menu button{display:grid;width:100%;min-height:42px;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:0 10px;border:0;border-radius:7px;color:#475569;background:#fff;font:inherit;font-size:14px;font-weight:400;text-align:left;cursor:pointer}.multi-select__menu button:hover,.multi-select__menu button.selected{color:#14264d;background:#eef2f8}.multi-select__menu button.disabled{opacity:.45;cursor:not-allowed}.multi-select__menu button b{font-weight:800}.multi-select__done{display:block!important;width:100%;min-height:38px;margin-top:6px;border:0!important;border-radius:7px!important;color:#fff!important;background:var(--lead-accent,var(--woxza-blue))!important;font:inherit!important;font-weight:700!important;text-align:center!important;cursor:pointer}
.multi-select__menu--dark{border-color:rgba(147,197,253,.28);background:#081a34;box-shadow:0 18px 44px rgba(0,0,0,.38)}.multi-select__menu--dark button{color:#e8f1ff;background:transparent}.multi-select__menu--dark button:hover{color:#fff;background:rgba(255,255,255,.10)}.multi-select__menu--dark button.selected{color:#06142a;background:#fff}.multi-select__menu--dark .multi-select__done{background:var(--woxza-accent)!important}
</style>
