import { app } from "electron";

let autoLaunchEnabled = false;

export function getAutoLaunchEnabled(): boolean {
  if (process.platform === "linux") {return autoLaunchEnabled;}
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch {
    return autoLaunchEnabled;
  }
}

export function setAutoLaunch(enabled: boolean) {
  autoLaunchEnabled = enabled;
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true,
    });
  } catch {
    // best-effort — may fail on some platforms
  }
}
