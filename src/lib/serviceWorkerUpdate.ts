import { dlog } from "./debug";

const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

let refreshing = false;

function activateWaitingWorker(registration: ServiceWorkerRegistration, hadController: boolean) {
  const waiting = registration.waiting;
  if (!waiting || !hadController) return;

  dlog("info", "Service worker update waiting — activating");
  waiting.postMessage("SKIP_WAITING");
}

function watchInstallingWorker(registration: ServiceWorkerRegistration, hadController: boolean) {
  const worker = registration.installing;
  if (!worker) return;

  worker.addEventListener("statechange", () => {
    if (worker.state === "installed") {
      activateWaitingWorker(registration, hadController);
    }
  });
}

export async function setupServiceWorkerUpdates(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    dlog("info", "Service worker updated — reloading app");
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    dlog("info", "Service worker registered");

    registration.addEventListener("updatefound", () => {
      dlog("info", "Service worker update found");
      watchInstallingWorker(registration, hadController);
    });

    activateWaitingWorker(registration, hadController);
    watchInstallingWorker(registration, hadController);

    await registration.update();
  } catch (err) {
    dlog("warn", "Service worker registration failed", err);
  }
}
