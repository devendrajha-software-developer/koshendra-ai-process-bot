<template>
  <Transition name="rln-slide">
    <div v-if="isRateLimited" class="rln-toast" role="alert" aria-live="assertive">
      <div class="rln-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div class="rln-body">
        <p class="rln-title">Token limit reached</p>
        <p class="rln-sub">Retrying automatically in <strong>{{ countdown }}s</strong>…</p>

        <!-- Progress bar -->
        <div class="rln-bar-track">
          <div
            class="rln-bar-fill"
            :style="{ width: `${(countdown / totalSeconds) * 100}%` }"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRateLimit } from '../composables/useRateLimit';

const { isRateLimited, countdown } = useRateLimit();

// Capture the initial countdown value as "total" when notification appears
const totalSeconds = ref(15);
watch(isRateLimited, (val) => {
  if (val) totalSeconds.value = countdown.value;
});
</script>

<style scoped>
.rln-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #1e1e2e;
  border: 1px solid #f59e0b;
  border-left: 4px solid #f59e0b;
  color: #f1f5f9;
  padding: 14px 18px;
  border-radius: 10px;
  min-width: 280px;
  max-width: 360px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
}

.rln-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.rln-body {
  flex: 1;
}

.rln-title {
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 3px;
}

.rln-sub {
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.rln-sub strong {
  color: #fff;
}

.rln-bar-track {
  height: 4px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.rln-bar-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 4px;
  transition: width 1s linear;
}

/* Slide-in / slide-out transition */
.rln-slide-enter-active {
  transition: all 0.3s ease-out;
}
.rln-slide-leave-active {
  transition: all 0.25s ease-in;
}
.rln-slide-enter-from,
.rln-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
