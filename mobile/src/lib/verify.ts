import type { VerifyState } from "@/components/VerifyResult";
import { api, ApiError } from "./api";
import type { PublicCert } from "./types";

export async function verifyCode(code: string): Promise<VerifyState> {
  try {
    const cert = await api<PublicCert>(`public/verify/${encodeURIComponent(code)}`, { auth: false });
    return { kind: "found", cert };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return { kind: "missing", code };
    throw e;
  }
}
