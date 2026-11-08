import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as LocalAuthentication from "expo-local-authentication";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { api, clearUserCache, onSessionExpired, secure, setSession } from "./api";

export type Modules = Record<string, { read: boolean; write: boolean }>;
export type User = {
  id: number; email: string; name: string; first_name: string; last_name: string; role: string; phone: string;
  job_title: string; is_client: boolean; modules?: Modules; client?: { id: number; name: string; company: string } | null;
};

type Auth = {
  status: "loading" | "out" | "in";
  user: User | null;
  /** biometric lock is on and the app is waiting for fingerprint / Face ID */
  locked: boolean;
  lockEnabled: boolean;
  biometricLabel: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  unlock: () => Promise<boolean>;
  setLockEnabled: (on: boolean) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  can: (module: string, write?: boolean) => boolean;
};

const Ctx = createContext<Auth | null>(null);
const LOCK_AFTER_MS = 60_000;   // ask again after the app was in the background for a minute

export async function biometricInfo() {
  if (Platform.OS === "web") return null;
  const [hw, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  if (!hw || !enrolled) return null;
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return Platform.OS === "ios" ? "Face ID" : "Face unlock";
  return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Auth["status"]>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [locked, setLocked] = useState(false);
  const [lockEnabled, setLockState] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const backgroundAt = useRef<number | null>(null);

  const signOutLocal = useCallback(async () => {
    setSession(null);
    await Promise.all([secure.del("xn_token"), AsyncStorage.removeItem("xn_user"), clearUserCache()]);
    setUser(null); setLocked(false); setStatus("out");
  }, []);

  useEffect(() => {
    onSessionExpired(() => { signOutLocal(); });
    (async () => {
      const [tok, saved, lock, label] = await Promise.all([
        secure.get("xn_token"), AsyncStorage.getItem("xn_user"), AsyncStorage.getItem("xn_lock"), biometricInfo().catch(() => null),
      ]);
      setBiometricLabel(label);
      if (tok && saved) {
        const u = JSON.parse(saved) as User;
        setSession(tok, u.id); setUser(u);
        const lockOn = lock === "1" && !!label;
        setLockState(lockOn); setLocked(lockOn); setStatus("in");
        api<User>("auth/me").then((fresh) => { setUser(fresh); AsyncStorage.setItem("xn_user", JSON.stringify(fresh)); }).catch(() => {});
      } else setStatus("out");
    })();
  }, [signOutLocal]);

  // lock again when coming back after a while
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background") backgroundAt.current = Date.now();
      if (s === "active" && backgroundAt.current && lockEnabled && user && Date.now() - backgroundAt.current > LOCK_AFTER_MS) setLocked(true);
      if (s === "active") backgroundAt.current = null;
    });
    return () => sub.remove();
  }, [lockEnabled, user]);

  const login = useCallback(async (email: string, password: string) => {
    const deviceName = Device.deviceName || Device.modelName || `${Platform.OS} phone`;
    const r = await api<{ token: string; user: User }>("auth/app/login", {
      body: { email: email.trim(), password, device_name: deviceName, platform: Platform.OS, app_version: Application.nativeApplicationVersion },
      auth: false,
    });
    await secure.set("xn_token", r.token);
    await AsyncStorage.setItem("xn_user", JSON.stringify(r.user));
    setSession(r.token, r.user.id); setUser(r.user); setLocked(false); setStatus("in");
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api("auth/app/logout", { body: {} }); } catch { /* offline: forget locally anyway */ }
    await signOutLocal();
  }, [signOutLocal]);

  const unlock = useCallback(async () => {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Xeon Net", cancelLabel: "Cancel", disableDeviceFallback: false });
    if (r.success) setLocked(false);
    return r.success;
  }, []);

  const setLockEnabled = useCallback(async (on: boolean) => {
    if (on) {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm to turn on app lock" });
      if (!r.success) return false;
    }
    await AsyncStorage.setItem("xn_lock", on ? "1" : "0");
    setLockState(on);
    return true;
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await api<User>("auth/me");
    setUser(fresh); await AsyncStorage.setItem("xn_user", JSON.stringify(fresh));
  }, []);

  const can = useCallback((module: string, write = false) => {
    const m = user?.modules?.[module];
    return !!m && (write ? m.write : m.read);
  }, [user]);

  const value = useMemo<Auth>(() => ({ status, user, locked, lockEnabled, biometricLabel, login, logout, unlock, setLockEnabled, refreshUser, can }),
    [status, user, locked, lockEnabled, biometricLabel, login, logout, unlock, setLockEnabled, refreshUser, can]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
