import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ago, fdate, isIsoDate, label } from "@/lib/format";
import { radius, space, useTheme, type Theme } from "@/lib/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export const Icon = ({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) => {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.text} />;
};

/** Website icon names (lucide) → app icons */
const SITE_ICONS: Record<string, IconName> = {
  award: "ribbon-outline", "brain-circuit": "hardware-chip-outline", "building-2": "business-outline", clapperboard: "film-outline",
  cloud: "cloud-outline", "code-xml": "code-slash-outline", factory: "construct-outline", gem: "diamond-outline", globe: "globe-outline",
  "graduation-cap": "school-outline", handshake: "people-outline", headset: "headset-outline", "heart-pulse": "pulse-outline",
  layers: "layers-outline", "layout-dashboard": "grid-outline", lightbulb: "bulb-outline", megaphone: "megaphone-outline",
  network: "git-network-outline", palette: "color-palette-outline", puzzle: "extension-puzzle-outline", rocket: "rocket-outline",
  server: "server-outline", "shield-check": "shield-checkmark-outline", "shopping-cart": "cart-outline",
  smartphone: "phone-portrait-outline", sparkles: "sparkles-outline", store: "storefront-outline", utensils: "restaurant-outline",
  wrench: "build-outline",
};
export const siteIcon = (n: string): IconName => SITE_ICONS[n] ?? "cube-outline";

// ---------------------------------------------------------------- text
type Variant = "display" | "h1" | "h2" | "h3" | "body" | "small" | "tiny" | "label" | "eyebrow";
const SIZES: Record<Variant, TextStyle> = {
  display: { fontSize: 32, lineHeight: 37, fontWeight: "800", letterSpacing: -0.6 },
  h1: { fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 25, fontWeight: "700", letterSpacing: -0.2 },
  h3: { fontSize: 16, lineHeight: 21, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  tiny: { fontSize: 11.5, lineHeight: 15 },
  label: { fontSize: 13, lineHeight: 17, fontWeight: "600" },
  eyebrow: { fontSize: 11.5, lineHeight: 15, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
};
export function T({ v = "body", muted, faint, brand, center, style, children, numberOfLines, selectable }: {
  v?: Variant; muted?: boolean; faint?: boolean; brand?: boolean; center?: boolean; style?: StyleProp<TextStyle>;
  children: ReactNode; numberOfLines?: number; selectable?: boolean;
}) {
  const t = useTheme();
  const color = brand ? t.brandText : faint ? t.faint : muted ? t.soft : t.text;
  return <Text selectable={selectable} numberOfLines={numberOfLines} style={[SIZES[v], { color }, center && { textAlign: "center" }, style]}>{children}</Text>;
}

// ---------------------------------------------------------------- layout
export function Screen({ children, refreshing, onRefresh, padded = true, scroll = true, style, footer }: {
  children: ReactNode; refreshing?: boolean; onRefresh?: () => void; padded?: boolean; scroll?: boolean;
  style?: StyleProp<ViewStyle>; footer?: ReactNode;
}) {
  const t = useTheme();
  const inset = useSafeAreaInsets();
  const content = [padded && { padding: space.lg }, { gap: space.lg, paddingBottom: space.xxl + (footer ? 0 : inset.bottom) }, style];
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.brand} colors={[t.brand]} /> : undefined}>
          {children}
        </ScrollView>
      ) : <View style={[{ flex: 1 }, content]}>{children}</View>}
      {footer && <View style={{ padding: space.lg, paddingBottom: space.lg + inset.bottom, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line, backgroundColor: t.card }}>{footer}</View>}
    </View>
  );
}

export function Card({ children, style, onPress, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean }) {
  const t = useTheme();
  const base: StyleProp<ViewStyle> = [{ backgroundColor: t.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.line }, padded && { padding: space.lg, gap: space.sm }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.75 }]}>{children}</Pressable>;
}

export const Row = ({ children, gap = space.sm, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) =>
  <View style={[{ flexDirection: "row", alignItems: "center", gap }, wrap && { flexWrap: "wrap" }, style]}>{children}</View>;

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Row style={{ justifyContent: "space-between" }}><T v="eyebrow" faint>{title}</T>{action}</Row>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------- buttons
export function Button({ title, onPress, kind = "primary", icon, loading, disabled, small, style }: {
  title: string; onPress?: () => void; kind?: "primary" | "ghost" | "danger" | "soft" | "dark"; icon?: IconName;
  loading?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = { primary: t.brand, ghost: "transparent", danger: t.badSoft, soft: t.brandSoft, dark: t.mode === "dark" ? t.text : t.ink }[kind];
  const fg = { primary: t.onBrand, ghost: t.text, danger: t.bad, soft: t.brandText, dark: t.mode === "dark" ? t.bg : "#fff" }[kind];
  return (
    <Pressable disabled={disabled || loading} accessibilityRole="button"
      onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {}); onPress?.(); }}
      style={({ pressed }) => [{
        backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: small ? 14 : 20, minHeight: small ? 36 : 50,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        borderWidth: kind === "ghost" ? 1 : 0, borderColor: t.line, opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
      }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <>{icon && <Ionicons name={icon} size={small ? 16 : 19} color={fg} />}<Text style={{ color: fg, fontWeight: "700", fontSize: small ? 13.5 : 15.5 }}>{title}</Text></>}
    </Pressable>
  );
}

export function IconButton({ name, onPress, label: a11y, tone }: { name: IconName; onPress: () => void; label: string; tone?: "brand" }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={a11y} hitSlop={8}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: tone === "brand" ? t.brandSoft : t.cardAlt, opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name={name} size={20} color={tone === "brand" ? t.brandText : t.text} />
    </Pressable>
  );
}

/** Round action under a header, e.g. Call · WhatsApp · Email */
export function Action({ icon, title, onPress }: { icon: IconName; title: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ alignItems: "center", gap: 6, flex: 1, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={21} color={t.brandText} />
      </View>
      <T v="tiny" muted>{title}</T>
    </Pressable>
  );
}

// ---------------------------------------------------------------- inputs
export function Field({ label: l, error, hint, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      <T v="label" muted>{l}</T>
      <TextInput placeholderTextColor={t.faint} {...props}
        onFocus={(e) => { setFocus(true); props.onFocus?.(e); }} onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
        style={[{
          backgroundColor: t.cardAlt, color: t.text, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: props.multiline ? 12 : 0,
          minHeight: props.multiline ? 96 : 50, fontSize: 15.5, borderWidth: 1.5, borderColor: error ? t.bad : focus ? t.brand : "transparent",
          textAlignVertical: props.multiline ? "top" : "center",
        }]} />
      {error ? <T v="small" style={{ color: t.bad }}>{error}</T> : hint ? <T v="small" faint>{hint}</T> : null}
    </View>
  );
}

function toDate(v: string) { return isIsoDate(v) ? new Date(v + "T00:00:00") : new Date(); }
function iso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

/** Date field: native calendar on phones, typed yyyy-mm-dd on the web preview. */
export function DateField({ label: l, value, onChange, error, optional }: { label: string; value: string; onChange: (v: string) => void; error?: string; optional?: boolean }) {
  const t = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  if (Platform.OS === "web") return <Field label={l} value={value} onChangeText={onChange} placeholder="yyyy-mm-dd" error={error} autoCapitalize="none" />;
  const open = () => {
    if (Platform.OS === "android") DateTimePickerAndroid.open({ value: toDate(value), mode: "date", onChange: (e, d) => { if (e.type === "set" && d) onChange(iso(d)); } });
    else setIosOpen(true);
  };
  return (
    <View style={{ gap: 6 }}>
      <T v="label" muted>{l}</T>
      <Pressable onPress={open} style={{ backgroundColor: t.cardAlt, borderRadius: radius.md, minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: error ? t.bad : "transparent" }}>
        <T style={!value ? { color: t.faint } : undefined}>{value ? fdate(value) : "Choose a date"}</T>
        <Row>
          {optional && value ? <Pressable hitSlop={10} onPress={() => onChange("")}><Ionicons name="close-circle" size={18} color={t.faint} /></Pressable> : null}
          <Ionicons name="calendar-outline" size={19} color={t.soft} />
        </Row>
      </Pressable>
      {error ? <T v="small" style={{ color: t.bad }}>{error}</T> : null}
      {Platform.OS === "ios" && (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,.4)", justifyContent: "flex-end" }} onPress={() => setIosOpen(false)}>
            <View style={{ backgroundColor: t.card, padding: space.lg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
              <DateTimePicker value={toDate(value)} mode="date" display="inline" themeVariant={t.mode} accentColor={t.brand}
                onChange={(_, d) => { if (d) onChange(iso(d)); }} />
              <Button title="Done" onPress={() => setIosOpen(false)} />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)}
            style={{ paddingHorizontal: 14, height: 36, borderRadius: radius.pill, justifyContent: "center", backgroundColor: on ? t.brand : t.card, borderWidth: on ? 0 : 1, borderColor: t.line }}>
            <Text style={{ color: on ? t.onBrand : t.text, fontWeight: "600", fontSize: 13.5 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Toggle({ value, onChange, title, sub }: { value: boolean; onChange: (v: boolean) => void; title: string; sub?: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6 }}>
      <View style={{ flex: 1 }}><T v="h3" style={{ fontWeight: "600" }}>{title}</T>{sub ? <T v="small" muted>{sub}</T> : null}</View>
      <View style={{ width: 48, height: 28, borderRadius: 14, padding: 3, backgroundColor: value ? t.brand : t.line, alignItems: value ? "flex-end" : "flex-start" }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" }} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------- status & feedback
function tone(t: Theme, s: string) {
  if (["paid", "accepted", "valid", "done", "active"].includes(s)) return [t.okSoft, t.ok];
  if (["overdue", "rejected", "cancelled", "revoked", "expired"].includes(s)) return [t.badSoft, t.bad];
  if (["sent", "doing"].includes(s)) return [t.infoSoft, t.info];
  if (["partial", "on_hold", "hold", "planning", "review"].includes(s)) return [t.warnSoft, t.warn];
  return [t.cardAlt, t.soft];
}
export function Badge({ status, text }: { status: string; text?: string }) {
  const t = useTheme();
  const [bg, fg] = tone(t, status);
  return <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" }}><Text style={{ color: fg, fontSize: 12, fontWeight: "700" }}>{text ?? label(status)}</Text></View>;
}

export function Stat({ title, value, icon, tone: tn = "plain", onPress }: { title: string; value: string; icon?: IconName; tone?: "plain" | "good" | "bad" | "brand"; onPress?: () => void }) {
  const t = useTheme();
  const color = { plain: t.text, good: t.ok, bad: t.bad, brand: t.brandText }[tn];
  return (
    <Card onPress={onPress} style={{ flex: 1, minWidth: 140, gap: 6 }}>
      <Row style={{ justifyContent: "space-between" }}><T v="small" muted>{title}</T>{icon && <Icon name={icon} size={17} color={t.faint} />}</Row>
      <T v="h2" style={{ color }} numberOfLines={1}>{value}</T>
    </Card>
  );
}

export function ListItem({ title, sub, right, onPress, icon, left }: { title: string; sub?: string; right?: ReactNode; onPress?: () => void; icon?: IconName; left?: ReactNode }) {
  const t = useTheme();
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 12, opacity: pressed ? 0.65 : 1 })}>
      {left ?? (icon ? <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}><Ionicons name={icon} size={19} color={t.brandText} /></View> : null)}
      <View style={{ flex: 1, gap: 2 }}>
        <T v="h3" style={{ fontWeight: "600" }} numberOfLines={1}>{title}</T>
        {sub ? <T v="small" muted numberOfLines={2}>{sub}</T> : null}
      </View>
      {right}
      {onPress && <Ionicons name="chevron-forward" size={18} color={t.faint} />}
    </Pressable>
  );
}

export const Divider = () => { const t = useTheme(); return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />; };

/** A card holding list rows separated by thin lines. */
export function ListCard({ children }: { children: ReactNode[] | ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return <Card style={{ paddingVertical: 4, gap: 0 }}>{items.map((c, i) => <View key={i}>{i > 0 && <Divider />}{c}</View>)}</Card>;
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  const t = useTheme();
  return <View style={{ padding: space.xxl, alignItems: "center", gap: space.md }}><ActivityIndicator color={t.brand} /><T v="small" muted>{text}</T></View>;
}

export function Empty({ icon = "file-tray-outline", title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", padding: space.xl, gap: space.sm }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.cardAlt, alignItems: "center", justifyContent: "center" }}><Ionicons name={icon} size={28} color={t.faint} /></View>
      <T v="h3" center>{title}</T>
      {text ? <T v="small" muted center>{text}</T> : null}
      {action}
    </View>
  );
}

export function Alert({ kind = "bad", text, onRetry }: { kind?: "bad" | "ok" | "info" | "warn"; text: string; onRetry?: () => void }) {
  const t = useTheme();
  const [bg, fg, icon] = ({ bad: [t.badSoft, t.bad, "alert-circle-outline"], ok: [t.okSoft, t.ok, "checkmark-circle-outline"], info: [t.infoSoft, t.info, "information-circle-outline"], warn: [t.warnSoft, t.warn, "warning-outline"] } as const)[kind];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.md, padding: space.md, flexDirection: "row", gap: space.sm, alignItems: "center" }}>
      <Ionicons name={icon} size={20} color={fg} />
      <Text style={{ color: fg, flex: 1, fontSize: 14, lineHeight: 19 }}>{text}</Text>
      {onRetry && <Pressable onPress={onRetry} hitSlop={8}><Text style={{ color: fg, fontWeight: "700" }}>Retry</Text></Pressable>}
    </View>
  );
}

/** Shown when a screen is showing the copy saved on the phone. */
export function OfflineNote({ savedAt }: { savedAt: number | null }) {
  return <Alert kind="warn" text={`Offline: showing what was saved ${savedAt ? ago(savedAt) : "earlier"}. Pull down to refresh.`} />;
}

/** Standard top-of-screen state: error / offline / loading. Returns true when the caller should render nothing else. */
export function QueryState({ q, empty }: { q: { loading: boolean; error: string; data: unknown; offline: boolean; savedAt: number | null; refresh: () => void }; empty?: boolean }) {
  if (q.loading && !q.data) return <Loading />;
  if (q.error && !q.data) return <Alert text={q.error} onRetry={q.refresh} />;
  if (q.offline) return <OfflineNote savedAt={q.savedAt} />;
  if (q.error) return <Alert text={q.error} onRetry={q.refresh} />;
  return empty ? null : null;
}

/** Small key → value row used on detail screens. */
export function KV({ k, v, strong }: { k: string; v?: ReactNode; strong?: boolean }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 4 }}>
      <T v="small" muted>{k}</T>
      {typeof v === "string" ? <T v="small" style={{ fontWeight: strong ? "800" : "600", flexShrink: 1, textAlign: "right" }} selectable>{v}</T> : v}
    </Row>
  );
}

export function BottomSheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const t = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" }}>
          <Row style={{ justifyContent: "space-between", padding: space.lg, paddingBottom: space.sm }}>
            <T v="h2">{title}</T>
            <IconButton name="close" label="Close" onPress={onClose} />
          </Row>
          <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.lg, paddingBottom: space.xl + inset.bottom }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
