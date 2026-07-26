<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="app-modal-mask" @click.self="close">
        <div class="app-modal" :style="{ width }">
          <div class="app-modal-header">
            <span>{{ title }}</span>
            <button class="close-btn" @click="close">×</button>
          </div>
          <div class="app-modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="app-modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '提示' },
  width: { type: String, default: '480px' },
  closeOnClickMask: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  if (!props.closeOnClickMask && arguments[0]?.target) return
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.app-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}
.app-modal {
  background: #fff;
  border-radius: 12px;
  max-width: 92vw;
  max-height: 85vh;
  overflow: auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
}
.app-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #333;
}
.close-btn {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}
.close-btn:hover { color: #e02e24; }
.app-modal-body { padding: 18px; color: #333; }
.app-modal-footer {
  padding: 12px 18px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
