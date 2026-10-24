"use client";

/** Everything the browser can tell us about the device — sent with login so the audit trail is never hand-typed. */
export type DeviceInfo = {
  ip_address: string | null;
  device_id: string;
  device_type: "web" | "mobile" | "tablet";
  device_name: string;
  os: string;
  browser: string;
  user_agent: string;
  screen: string;
  timezone: string;
  language: string;
};

const ID_KEY = "amber-device-id";

function deviceId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = `web-${crypto.randomUUID()}`;
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return `web-${crypto.randomUUID()}`;
  }
}

function detect(ua: string) {
  const os = /Windows/i.test(ua) ? "Windows" : /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS" : /Mac OS X/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Unknown";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown";
  const type: DeviceInfo["device_type"] = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|iPhone|Android/i.test(ua) ? "mobile" : "web";
  return { os, browser, type };
}

/** Public IP as seen by the internet; `null` if it cannot be resolved (offline, blocked). */
async function publicIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(4000) });
    const { ip } = (await res.json()) as { ip?: string };
    return ip ?? null;
  } catch {
    return null;
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const { os, browser, type } = detect(ua);
  return {
    ip_address: await publicIp(),
    device_id: deviceId(),
    device_type: type,
    device_name: `${browser} on ${os}`,
    os,
    browser,
    user_agent: ua,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}
