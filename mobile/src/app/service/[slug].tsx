import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Button, Card, Empty, Icon, Row, Screen, Section, T } from "@/components/ui";
import { photo, serviceDetail, services } from "@/lib/content";
import { radius, space, useTheme } from "@/lib/theme";

export default function ServicePage() {
  const t = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const s = services.find((x) => x.slug === slug);
  const d = slug ? serviceDetail(slug) : undefined;
  if (!s) return <Screen><Empty title="Service not found" /></Screen>;
  return (
    <Screen footer={<Button title="Get a quote for this" icon="arrow-forward" onPress={() => router.push({ pathname: "/contact", params: { service: s.title } })} />}>
      <Stack.Screen options={{ title: s.title }} />
      <Image source={{ uri: photo(slug!, 1000) }} style={{ height: 190, borderRadius: radius.lg }} contentFit="cover" transition={250} />
      <View style={{ gap: 6 }}>
        <T v="eyebrow" brand>{s.tier}</T>
        <T v="h1">{s.title}</T>
        <T muted>{d?.overview ?? s.short}</T>
      </View>
      <Section title="What's included">
        <Card style={{ gap: 10 }}>
          {s.points.map((p) => <Row key={p} style={{ alignItems: "flex-start" }}><Icon name="checkmark-circle" size={19} color={t.brand} /><T style={{ flex: 1 }}>{p}</T></Row>)}
        </Card>
      </Section>
      {d?.benefits?.length ? (
        <Section title="Why it matters">
          <View style={{ gap: space.sm }}>
            {d.benefits.map(([title, text]) => <Card key={title}><T v="h3">{title}</T><T v="small" muted>{text}</T></Card>)}
          </View>
        </Section>
      ) : null}
      {d?.tech?.length ? (
        <Section title="Technology">
          <Row wrap>{d.tech.map((x) => <View key={x} style={{ backgroundColor: t.cardAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}><T v="small">{x}</T></View>)}</Row>
        </Section>
      ) : null}
      {d?.faqs?.length ? (
        <Section title="Questions">
          <View style={{ gap: space.sm }}>{d.faqs.map(([q, a]) => <Card key={q}><T v="h3">{q}</T><T v="small" muted>{a}</T></Card>)}</View>
        </Section>
      ) : null}
    </Screen>
  );
}
