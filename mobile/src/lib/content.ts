import site from "../content/site.json";

/** Same content as the website (copied from frontend/content/site.json). */
export type Service = { slug: string; icon: string; title: string; short: string; points: string[] };
export type Tier = { key: string; level: string; name: string; intro: string; services: Service[] };
export type ServiceDetail = { art: string; overview: string; benefits: [string, string][]; tech: string[]; faqs: [string, string][] };
export type Work = {
  slug: string; title: string; category: string; sample: boolean; client: string; year: string; url: string; images: string[];
  summary: string; challenge: string; solution: string; features: string[]; results: string[]; tech: string[];
};
export type Brand = { slug: string; name: string; industry: string; icon: string; status: string; url: string; tagline: string; text: string; features: string[] };
export type Item = { icon: string; title: string; text: string };

const s = site as unknown as {
  COMPANY: { name: string; tagline: string; domain: string; founded: number; ceo: string; email: string; phone: string;
    phone_raw: string; whatsapp: string; address: string; hours: string };
  SERVICE_TIERS: Tier[]; SERVICE_DETAILS: Record<string, ServiceDetail>; FAQS: [string, string][]; PROCESS: [string, string][];
  TECH: string[]; WHY_US: Item[]; VALUES: Item[]; BRANDS: Brand[]; PORTFOLIO: Work[]; PORTFOLIO_CATEGORIES: string[];
  PHOTOS: Record<string, string>; QUOTE: string;
};

export const company = s.COMPANY;
export const tiers = s.SERVICE_TIERS;
export const services = s.SERVICE_TIERS.flatMap((t) => t.services.map((x) => ({ ...x, tier: t.name })));
export const serviceDetail = (slug: string) => s.SERVICE_DETAILS[slug];
export const faqs = s.FAQS;
export const processSteps = s.PROCESS;
export const tech = s.TECH;
export const whyUs = s.WHY_US;
export const brands = s.BRANDS;
export const portfolio = s.PORTFOLIO;
export const portfolioCategories = s.PORTFOLIO_CATEGORIES;
export const ceoQuote = s.QUOTE;
export const years = new Date().getFullYear() - s.COMPANY.founded;

/** Free stock photo for a service / page (Unsplash, same as the website). */
export function photo(key: string, w = 900) {
  const base = s.PHOTOS[key] ?? s.PHOTOS.hero;
  return `${base}${base.includes("?") ? "&" : "?"}auto=format&fit=crop&w=${w}&q=70`;
}
