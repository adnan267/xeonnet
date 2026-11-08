import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Badge, Card, Row, Screen, Segmented, T } from "@/components/ui";
import { photo, portfolio, portfolioCategories } from "@/lib/content";
import { radius, space } from "@/lib/theme";

const CAT_PHOTO: Record<string, string> = { Web: "web-development", "E-commerce": "ecommerce", Mobile: "mobile-apps", Software: "software", Marketing: "digital-marketing", Networking: "networking" };

export default function Work() {
  const [cat, setCat] = useState("All");
  const items = portfolio.filter((p) => cat === "All" || p.category === cat);
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T v="h1">Portfolio</T>
        <T muted>Websites, apps, software and campaigns we have delivered.</T>
      </View>
      <Segmented value={cat} onChange={setCat} options={["All", ...portfolioCategories].map((c) => ({ value: c, label: c }))} />
      <View style={{ gap: space.md }}>
        {items.map((p) => (
          <Card key={p.slug} padded={false} onPress={() => router.push(`/work/${p.slug}`)} style={{ overflow: "hidden" }}>
            <Image source={{ uri: p.images[0] ?? photo(CAT_PHOTO[p.category] ?? "software", 900) }} style={{ height: 150, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }} contentFit="cover" transition={250} />
            <View style={{ padding: space.lg, gap: 6 }}>
              <Row style={{ justifyContent: "space-between" }}><T v="eyebrow" brand>{p.category}</T>{p.sample ? <Badge status="draft" text="Sample" /> : null}</Row>
              <T v="h3">{p.title}</T>
              <T v="small" muted numberOfLines={2}>{p.summary}</T>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
