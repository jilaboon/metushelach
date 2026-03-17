import { Settings } from "../types/game";

function vibrate(settings: Settings, pattern: number | number[]) {
  if (!settings.vibrationEnabled || typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  navigator.vibrate(pattern);
}

export async function triggerTapFeedback(settings: Settings) {
  vibrate(settings, 12);
}

export async function triggerMergeFeedback(settings: Settings) {
  vibrate(settings, [18, 12, 18]);
}

export async function triggerInvalidFeedback(settings: Settings) {
  vibrate(settings, [14, 20, 14]);
}

export async function triggerPerfectFeedback(settings: Settings) {
  vibrate(settings, [20, 20, 20, 20, 26]);
}
