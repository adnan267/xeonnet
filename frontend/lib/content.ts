// Website text lives in content/site.json — edit it there.
import raw from "@/content/site.json";

export type Service = { slug: string; icon: string; title: string; short: string; points: string[] };
export type Tier = { key: string; level: string; name: string; intro: string; services: Service[] };
export type ServiceDetail = { art?: string; overview: string; benefits: [string, string][]; tech: string[]; faqs: [string, string][] };
export type Brand = { slug: string; name: string; industry: string; icon: string; status: string; url: string; tagline: string; text: string; features: string[] };
export type Project = { slug: string; title: string; category: string; sample?: boolean; client: string; year: string | number; url: string; images: string[]; summary: string; challenge: string; solution: string; results?: string[]; tech?: string[]; services?: string[] };

const site = raw as unknown as {
  COMPANY: { name: string; tagline: string; domain: string; founded: number; ceo: string; email: string; phone: string; phone_raw: string; whatsapp: string; address: string; hours: string; social: Record<string, string> };
  JOURNEY: { year: number; title: string; text: string; tags: string[] }[];
  SERVICE_TIERS: Tier[];
  SERVICE_DETAILS: Record<string, ServiceDetail>;
  FAQS: [string, string][];
  PROCESS: [string, string][];
  PROCESS_DETAIL: [string, string][];
  TECH: string[];
  VALUES: { icon: string; title: string; text: string }[];
  BRANDS: Brand[];
  CLIENT_INDUSTRIES: { icon: string; title: string; text: string }[];
  TEAM: { name: string; role: string; photo: string; bio: string; links: Record<string, string> }[];
  DEPARTMENTS: { icon: string; title: string; text: string }[];
  WHY_US: { icon: string; title: string; text: string }[];
  PORTFOLIO: Project[];
  PORTFOLIO_CATEGORIES: string[];
  STATS_EXTRA: [string, string][];
  PHOTOS: Record<string, string>;
  QUOTE: string;
};

export const company = site.COMPANY;
export const years = new Date().getFullYear() - company.founded;
export const tiers = site.SERVICE_TIERS;
export const allServices = tiers.flatMap((t) => t.services.map((s) => ({ ...s, tier: t })));
export const serviceDetails = site.SERVICE_DETAILS;
export const faqs = site.FAQS;
export const processSteps = site.PROCESS;
export const processDetail = site.PROCESS_DETAIL;
export const tech = site.TECH;
export const values = site.VALUES;
export const brands = site.BRANDS;
export const industries = site.CLIENT_INDUSTRIES;
export const team = site.TEAM;
export const departments = site.DEPARTMENTS;
export const whyUs = site.WHY_US;
export const journey = site.JOURNEY;
export const portfolio = site.PORTFOLIO;
export const portfolioCategories = site.PORTFOLIO_CATEGORIES;
export const ceoQuote = site.QUOTE;

/** Free stock photo for a key (service slug, brand slug, "hero", ...). */
export function photo(key: string, w = 1200) {
  const base = site.PHOTOS[key] || site.PHOTOS.hero;
  return `${base}?auto=format&fit=crop&w=${w}&q=75`;
}

export const nav: [string, string][] = [
  ["/", "Home"], ["/about", "About"], ["/services", "Services"], ["/portfolio", "Portfolio"],
  ["/brands", "Our Brands"], ["/clients", "Clients"], ["/team", "Team"], ["/reviews", "Reviews"], ["/courses", "Courses"], ["/careers", "Careers"], ["/contact", "Contact"],
];

/** Photo key for a portfolio category. */
export const catPhoto = (c: string) =>
  ({ "E-commerce": "ecommerce", Mobile: "mobile-apps", Web: "web-development", Software: "software", Marketing: "digital-marketing", Networking: "networking" } as Record<string, string>)[c] || "web-development";
