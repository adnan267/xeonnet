import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Icon, Row, Screen, Section, T, siteIcon } from "@/components/ui";
import { brands, ceoQuote, company, photo, processSteps, services, whyUs, years } from "@/lib/content";
import { radius, space, useTheme } from "@/lib/theme";

export default function Home() {
  const t = useTheme();
  return (
    <Screen padded={false}>
      {/* hero */}
      <View style={{ height: 360 }}>
        <Image source={{ uri: photo("hero", 1200) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient colors={["rgba(15,15,16,.25)", "rgba(15,15,16,.92)"]} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, justifyContent: "flex-end", padding: space.lg, gap: space.md }}>
          <T v="eyebrow" style={{ color: "#F6A266" }}>IT services since {company.founded}</T>
          <T v="display" style={{ color: "#fff" }}>Technology that keeps your business moving.</T>
          <T style={{ color: "rgba(255,255,255,.82)" }}>{company.tagline}. From IT support and networking to websites, apps, software and AI.</T>
          <Row>
            <Button title="Get a quote" icon="arrow-forward" onPress={() => router.push("/contact")} style={{ flex: 1 }} />
            <Button title="Call us" kind="dark" icon="call" onPress={() => Linking.openURL(`tel:${company.phone_raw}`)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,.14)" }} />
          </Row>
        </View>
      </View>

      <View style={{ padding: space.lg, gap: space.xl }}>
        <Row gap={space.md}>
          {[[`${years}+`, "Years"], ["12", "Services"], ["100%", "Written quotes"]].map(([v, l]) => (
            <Card key={l} style={{ flex: 1, alignItems: "center", gap: 2 }}><T v="h1" brand>{v}</T><T v="tiny" muted center>{l}</T></Card>
          ))}
        </Row>

        <Section title="What we do" action={<Pressable onPress={() => router.push("/services")}><T v="label" brand>All services</T></Pressable>}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
            {services.slice(3, 9).map((s) => (
              <Card key={s.slug} onPress={() => router.push(`/service/${s.slug}`)} style={{ width: "47%", flexGrow: 1, gap: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={siteIcon(s.icon)} color={t.brandText} />
                </View>
                <T v="h3" numberOfLines={2}>{s.title}</T>
                <T v="small" muted numberOfLines={3}>{s.short}</T>
              </Card>
            ))}
          </View>
        </Section>

        <Section title="Why Xeon Net">
          <Card style={{ gap: space.md }}>
            {whyUs.slice(0, 4).map((w) => (
              <Row key={w.title} style={{ alignItems: "flex-start" }} gap={space.md}>
                <Icon name={siteIcon(w.icon)} color={t.brandText} />
                <View style={{ flex: 1 }}><T v="h3">{w.title}</T><T v="small" muted>{w.text}</T></View>
              </Row>
            ))}
          </Card>
        </Section>

        <Section title="How we work">
          <View style={{ gap: space.sm }}>
            {processSteps.map(([title, text], i) => (
              <Row key={title} gap={space.md}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.ink, alignItems: "center", justifyContent: "center" }}><T v="label" style={{ color: "#fff" }}>{i + 1}</T></View>
                <View style={{ flex: 1 }}><T v="h3">{title}</T><T v="small" muted>{text}</T></View>
              </Row>
            ))}
          </View>
        </Section>

        <Card style={{ backgroundColor: t.ink, borderColor: t.ink, gap: space.md }}>
          <Icon name="chatbox-ellipses-outline" color="#F6A266" size={26} />
          <T style={{ color: "#fff", fontSize: 18, lineHeight: 27, fontStyle: "italic" }}>“{ceoQuote}”</T>
          <View><T v="h3" style={{ color: "#fff" }}>{company.ceo}</T><T v="small" style={{ color: "rgba(255,255,255,.65)" }}>CEO, {company.name}</T></View>
        </Card>

        <Section title="Our brands">
          <View style={{ gap: space.sm }}>
            {brands.map((b) => (
              <Card key={b.slug} onPress={b.url ? () => Linking.openURL(b.url) : undefined} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: t.cardAlt, alignItems: "center", justifyContent: "center" }}><Icon name={siteIcon(b.icon)} color={t.brandText} /></View>
                <View style={{ flex: 1 }}><T v="h3">{b.name}</T><T v="small" muted numberOfLines={2}>{b.tagline || b.industry}</T></View>
                {b.url ? <Icon name="open-outline" size={18} color={t.faint} /> : null}
              </Card>
            ))}
          </View>
        </Section>

        <Card style={{ backgroundColor: t.brand, borderColor: t.brand, gap: space.md }}>
          <T v="h2" style={{ color: t.onBrand }}>Have a project in mind?</T>
          <T style={{ color: t.onBrand, opacity: 0.9 }}>Free consultation and a clear written quote. No hidden charges.</T>
          <Row>
            <Button title="Request a quote" kind="dark" onPress={() => router.push("/contact")} style={{ flex: 1 }} />
            <Button title="WhatsApp" kind="dark" icon="logo-whatsapp" onPress={() => Linking.openURL(`https://wa.me/${company.whatsapp}`)} style={{ flex: 1 }} />
          </Row>
        </Card>
      </View>
    </Screen>
  );
}
