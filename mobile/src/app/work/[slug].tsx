import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Linking, View } from "react-native";
import { Alert, Button, Card, Empty, Icon, Row, Screen, Section, T } from "@/components/ui";
import { photo, portfolio } from "@/lib/content";
import { radius, space, useTheme } from "@/lib/theme";

export default function WorkPage() {
  const t = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const p = portfolio.find((x) => x.slug === slug);
  if (!p) return <Screen><Empty title="Project not found" /></Screen>;
  const list = (title: string, items: string[]) => items.length ? (
    <Section title={title}><Card style={{ gap: 10 }}>{items.map((x) => <Row key={x} style={{ alignItems: "flex-start" }}><Icon name="checkmark-circle" size={19} color={t.brand} /><T style={{ flex: 1 }}>{x}</T></Row>)}</Card></Section>
  ) : null;
  return (
    <Screen footer={<Button title="Start a similar project" icon="arrow-forward" onPress={() => router.push({ pathname: "/contact", params: { service: p.category } })} />}>
      <Stack.Screen options={{ title: p.title }} />
      <Image source={{ uri: p.images[0] ?? photo("software", 1000) }} style={{ height: 200, borderRadius: radius.lg }} contentFit="cover" />
      {p.sample && <Alert kind="info" text="Sample project: shows the kind of work we do. Client details are not shown." />}
      <View style={{ gap: 6 }}>
        <T v="eyebrow" brand>{p.category}{p.year ? ` · ${p.year}` : ""}</T>
        <T v="h1">{p.title}</T>
        <T muted>{p.summary}</T>
      </View>
      {p.challenge ? <Section title="The challenge"><T>{p.challenge}</T></Section> : null}
      {p.solution ? <Section title="What we built"><T>{p.solution}</T></Section> : null}
      {list("Features", p.features)}
      {list("Results", p.results)}
      {p.tech.length ? <Section title="Technology"><Row wrap>{p.tech.map((x) => <View key={x} style={{ backgroundColor: t.cardAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}><T v="small">{x}</T></View>)}</Row></Section> : null}
      {p.url ? <Button title="Visit live site" kind="ghost" icon="open-outline" onPress={() => Linking.openURL(p.url)} /> : null}
      <View style={{ height: space.sm }} />
    </Screen>
  );
}
