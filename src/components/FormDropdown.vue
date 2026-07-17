<template>
  <div ref="root" class="form-dropdown">
    <button
      ref="trigger"
      class="form-dropdown__trigger"
      type="button"
      :aria-expanded="isOpen"
      :aria-label="label"
      @click="toggle"
      @keydown.esc.stop="isOpen = false"
      @keydown.down.prevent="openAndFocusFirst"
    >
      <span :class="{ placeholder: !modelValue }">{{ selectedLabel }}</span>
      <i aria-hidden="true"></i>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" ref="menu" class="form-dropdown__menu" :style="menuStyle" role="listbox" :aria-label="label" @wheel.stop>
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="option"
        :aria-selected="modelValue === option.value"
        @click="select(option.value)"
      >
        <span>{{ option.label }}</span>
        <b v-if="modelValue === option.value" aria-hidden="true">✓</b>
      </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue"

const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array, required: true },
  placeholder: { type: String, required: true },
  label: { type: String, required: true }
})

const emit = defineEmits(["update:modelValue"])
const isOpen = ref(false)
const menu = ref(null)
const trigger = ref(null)
const root = ref(null)
const menuStyle = ref({})

const selectedLabel = computed(() =>
  props.options.find((option) => option.value === props.modelValue)?.label || props.placeholder
)

const select = (value) => {
  emit("update:modelValue", value)
  isOpen.value = false
}

const open = async () => {
  const bounds = trigger.value?.getBoundingClientRect()
  if (bounds) {
    const desiredHeight = Math.min(320, props.options.length * 40 + 12)
    const spaceBelow = window.innerHeight - bounds.bottom - 12
    const spaceAbove = bounds.top - 12
    const opensUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow
    const availableHeight = Math.max(120, Math.min(desiredHeight, opensUp ? spaceAbove : spaceBelow))
    menuStyle.value = {
      position: "fixed",
      zIndex: 10100,
      left: `${bounds.left}px`,
      width: `${bounds.width}px`,
      maxHeight: `${availableHeight}px`,
      top: opensUp ? "auto" : `${bounds.bottom + 6}px`,
      bottom: opensUp ? `${window.innerHeight - bounds.top + 6}px` : "auto"
    }
  }
  isOpen.value = true
  await nextTick()
}

const toggle = () => {
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  open()
}

const closeWhenClickingOutside = (event) => {
  if (!root.value?.contains(event.target) && !menu.value?.contains(event.target)) isOpen.value = false
}

const openAndFocusFirst = async () => {
  await open()
  menu.value?.querySelector("button")?.focus()
}

onMounted(() => document.addEventListener("pointerdown", closeWhenClickingOutside, true))
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeWhenClickingOutside, true))
</script>

<style scoped>
.form-dropdown { position:relative; z-index:1; min-width:0; }

.form-dropdown__trigger {
  display:grid;
  width:100%;
  min-height:44px;
  grid-template-columns:minmax(0, 1fr) auto;
  align-items:center;
  gap:12px;
  padding:10px 13px;
  border:1px solid rgba(15,23,42,.10);
  border-radius:8px;
  color:var(--lead-accent, var(--woxza-blue));
  background:#fff;
  font:inherit;
  text-align:left;
  cursor:pointer;
}
.form-dropdown__trigger span { overflow:hidden; font-weight:500; text-overflow:ellipsis; white-space:nowrap; }
.form-dropdown__trigger span:not(.placeholder) { font-weight:700; }
.form-dropdown__trigger .placeholder { color:#94a3b8; }
.form-dropdown__trigger i {
  width:8px;
  height:8px;
  margin-right:3px;
  border-right:2px solid currentColor;
  border-bottom:2px solid currentColor;
  transform:rotate(45deg) translateY(-2px);
}
.form-dropdown__trigger:focus { border-color:var(--lead-accent, var(--woxza-accent)); box-shadow:0 0 0 4px rgba(var(--lead-accent-rgb, var(--woxza-accent-rgb)),.1); outline:none; }

.form-dropdown__menu {
  overflow-y:auto;
  overscroll-behavior:contain;
  padding:6px;
  border:1px solid rgba(15,23,42,.12);
  border-radius:10px;
  background:#fff;
  box-shadow:0 18px 44px rgba(15,23,42,.18);
}
.form-dropdown__menu button {
  display:grid;
  width:100%;
  min-height:40px;
  grid-template-columns:minmax(0, 1fr) auto;
  align-items:center;
  gap:12px;
  padding:0 10px;
  border:0;
  border-radius:7px;
  color:#475569;
  background:#fff;
  font:inherit;
  font-size:13px;
  font-weight:700;
  text-align:left;
  cursor:pointer;
}
.form-dropdown__menu button:hover,
.form-dropdown__menu button:focus,
.form-dropdown__menu button[aria-selected="true"] { color:#14264d; background:#eef2f8; outline:none; }
.form-dropdown__menu b { color:#14264d; }
</style>
