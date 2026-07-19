<template>
  <div ref="root" class="form-dropdown">
    <button
      ref="trigger"
      class="form-dropdown__trigger"
      :class="{ selected: modelValue }"
      type="button"
      :aria-expanded="isOpen"
      :aria-label="label"
      @click="toggle"
      @keydown.esc.stop="isOpen = false"
      @keydown.down.prevent="openAndFocusFirst"
    >
      <span :class="{ placeholder: !modelValue }">{{ selectedLabel }}</span>
      <b v-if="modelValue" class="form-dropdown__selected-check" aria-hidden="true">✓</b>
      <i v-else aria-hidden="true"></i>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" ref="menu" class="form-dropdown__menu" :class="{ 'form-dropdown__menu--dark': dark }" :style="menuStyle" role="listbox" :aria-label="label" @wheel.stop>
      <label v-if="searchable" class="form-dropdown__search">
        <span class="sr-only">Search {{ label }}</span>
        <input ref="searchInput" v-model="search" type="search" :placeholder="`Search ${label.toLowerCase()}`" @keydown.esc.stop="isOpen = false">
      </label>
      <button
        v-for="option in visibleOptions"
        :key="option.value"
        type="button"
        role="option"
        :aria-selected="modelValue === option.value"
        @click="select(option.value)"
      >
        <span>{{ option.label }}</span>
        <b v-if="modelValue === option.value" aria-hidden="true">✓</b>
      </button>
      <p v-if="searchable && !visibleOptions.length" class="form-dropdown__empty">No matching options</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue"

const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array, required: true },
  searchable: { type: Boolean, default: false },
  placeholder: { type: String, required: true },
  label: { type: String, required: true },
  dark: { type: Boolean, default: false }
})

const emit = defineEmits(["update:modelValue"])
const isOpen = ref(false)
const menu = ref(null)
const trigger = ref(null)
const root = ref(null)
const searchInput = ref(null)
const menuStyle = ref({})
const search = ref("")

const selectedLabel = computed(() =>
  props.options.find((option) => option.value === props.modelValue)?.label || props.placeholder
)

const visibleOptions = computed(() => {
  const query = search.value.trim().toLowerCase()
  return query ? props.options.filter((option) => option.label.toLowerCase().includes(query)) : props.options
})

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
  search.value = ""
  isOpen.value = true
  await nextTick()
  if (props.searchable) searchInput.value?.focus()
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
  min-height:48px;
  grid-template-columns:minmax(0, 1fr) auto;
  align-items:center;
  gap:12px;
  padding:10px 13px;
  border:1px solid rgba(15,23,42,.10);
  border-radius:8px;
  color:var(--lead-accent, var(--woxza-blue));
  background:#fff;
  font:inherit;
  font-size:17px;
  font-weight:400;
  text-align:left;
  cursor:pointer;
}
.form-dropdown__trigger span { overflow:hidden; font-weight:400; text-overflow:ellipsis; white-space:nowrap; }
.form-dropdown__trigger .placeholder { color:#94a3b8; font-weight:400; }
.form-dropdown__trigger i {
  width:8px;
  height:8px;
  margin-right:3px;
  border-right:2px solid currentColor;
  border-bottom:2px solid currentColor;
  transform:rotate(45deg) translateY(-2px);
}
.form-dropdown__trigger:focus { border-color:var(--lead-accent, var(--woxza-accent)); box-shadow:0 0 0 4px rgba(var(--lead-accent-rgb, var(--woxza-accent-rgb)),.1); outline:none; }
.form-dropdown__trigger.selected { color:#fff; border-color:var(--lead-accent, var(--woxza-blue)); background:var(--lead-accent, var(--woxza-blue)); }
.form-dropdown__selected-check { font-size:16px; font-weight:700; line-height:1; }

.form-dropdown__menu {
  overflow-y:auto;
  overscroll-behavior:contain;
  padding:6px;
  border:1px solid rgba(15,23,42,.12);
  border-radius:10px;
  background:#fff;
  box-shadow:0 18px 44px rgba(15,23,42,.18);
  font-family:var(--font-primary);
}
.form-dropdown__search { display:block; padding:2px 2px 7px; }
.form-dropdown__search input { width:100%; min-height:40px; padding:0 10px; border:1px solid #d7deea; border-radius:7px; color:#14264d; background:#f8fafc; font:inherit; font-size:15px; outline:none; }
.form-dropdown__search input:focus { border-color:#5b8cff; box-shadow:0 0 0 3px rgba(91,140,255,.12); }
.form-dropdown__empty { margin:8px 10px; color:#64748b; font-size:15px; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.form-dropdown__menu button {
  display:grid;
  width:100%;
  min-height:46px;
  grid-template-columns:minmax(0, 1fr) auto;
  align-items:center;
  gap:12px;
  padding:0 10px;
  border:0;
  border-radius:7px;
  color:#475569;
  background:#fff;
  font:inherit;
  font-size:17px;
  font-weight:400;
  text-align:left;
  cursor:pointer;
}
.form-dropdown__menu button:hover,
.form-dropdown__menu button:focus { color:#14264d; background:#eef2f8; outline:none; }
.form-dropdown__menu button[aria-selected="true"] { color:#fff; background:var(--lead-accent, var(--woxza-blue)); }
.form-dropdown__menu b { color:currentColor; font-size:16px; font-weight:700; }

/* Menus are teleported to body, so the modal's dark surface must be opt-in here. */
.form-dropdown__menu--dark { border-color:rgba(147,197,253,.28); background:#081a34; box-shadow:0 18px 44px rgba(0,0,0,.38); }
.form-dropdown__menu--dark button { color:#e8f1ff; background:transparent; }
.form-dropdown__menu--dark button:hover,
.form-dropdown__menu--dark button:focus { color:#fff; background:rgba(255,255,255,.10); }
.form-dropdown__menu--dark button[aria-selected="true"] { color:#fff; background:var(--woxza-accent); }
.form-dropdown__menu--dark .form-dropdown__search input { border-color:rgba(147,197,253,.28); color:#fff; background:rgba(255,255,255,.07); }
.form-dropdown__menu--dark .form-dropdown__search input::placeholder,
.form-dropdown__menu--dark .form-dropdown__empty { color:#b8c7dd; }
</style>
