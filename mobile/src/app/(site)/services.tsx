import { router } from "expo-router";
import { View } from "react-native";
import { Card, Icon, Row, Screen, Section, T, siteIcon } from "@/components/ui";
import { tiers } from "@/lib/content";
import { space, useTheme } from "@/lib/theme";

export default function Services() {
  const t = useTheme();
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T v="h1">Services</T>
        <T muted>From the basics every business depends on to advanced software, cloud and AI.</T>
      </View>
      {tiers.map((tier) => (
        <Section key={tier.key} title={`${tier.level} · ${tier.name}`}>
          <T v="small" muted>{tier.intro}</T>
          <View style={{ gap: space.sm }}>
            {tier.services.map((s) => (
              <Card key={s.slug} onPress={() => router.push(`/service/${s.slug}`)}>
                <Row gap={space.md} style={{ alignItems: "flex-start" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={siteIcon(s.icon)} color={t.brandText} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <T v="h3">{s.title}</T>
                    <T v="small" muted>{s.short}</T>
                  </View>
                  <Icon name="chevron-forward" size={18} color={t.faint} />
                </Row>
              </Card>
            ))}
          </View>
        </Section>
      ))}
    </Screen>
  );
}
