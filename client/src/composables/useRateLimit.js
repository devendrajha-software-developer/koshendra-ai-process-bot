import { ref } from 'vue';

// Singleton reactive state shared between api.js and the notification component
const isRateLimited = ref(false);
const countdown = ref(0);
const message = ref('');

let countdownInterval = null;

/**
 * Called by api.js when a 429 response is received.
 * Starts a visible countdown and resolves after `waitSeconds`.
 */
export function triggerRateLimit(waitSeconds = 15) {
  return new Promise((resolve) => {
    isRateLimited.value = true;
    countdown.value = waitSeconds;
    message.value = `API token limit reached. Retrying in ${waitSeconds}s…`;

    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      countdown.value -= 1;
      message.value = `API token limit reached. Retrying in ${countdown.value}s…`;

      if (countdown.value <= 0) {
        clearInterval(countdownInterval);
        isRateLimited.value = false;
        message.value = '';
        resolve();
      }
    }, 1000);
  });
}

export function useRateLimit() {
  return { isRateLimited, countdown, message };
}
