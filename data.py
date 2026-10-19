"""
Xeon Net — website content (English).
Edit everything from this one file. No need to touch the HTML.
Items marked TODO are placeholders: replace them with your real details.
"""
import os
from datetime import date

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

COMPANY = {
    "name": "Xeon Net",
    "tagline": "Full Stack Development & Digital Solution",
    "domain": "xeonnet.site",
    "founded": 2007,
    "ceo": "Muhammad Adnan",
    "email": "info@xeonnet.site",                 # TODO: confirm your real email
    "phone": "+92 300 6666190",
    "phone_raw": "+923006666190",
    "whatsapp": "923006666190",                   # digits only, with country code
    "address": "Pakistan",                        # TODO: add your full office address
    "hours": "Mon – Sat, 10:00 AM – 7:00 PM",
    "social": {                                   # TODO: add your real links
        "facebook": "",
        "instagram": "",
        "linkedin": "",
    },
}

YEARS = date.today().year - COMPANY["founded"]

NAV = [
    ("home", "Home"),
    ("about", "About"),
    ("services", "Services"),
    ("portfolio", "Portfolio"),
    ("clients", "Clients"),
    ("team", "Team"),
    ("reviews", "Reviews"),
    ("contact", "Contact"),
]

# ------------------------------------------------------------------ journey
JOURNEY = [
    {"year": 2007, "title": "The Beginning",
     "text": "Xeon Net starts with computer hardware, repairs, networking and everyday IT support.",
     "tags": ["Hardware", "Networking", "IT Support"]},
    {"year": 2010, "title": "Into the Web",
     "text": "Websites, domain names, hosting and business email take our clients online.",
     "tags": ["Web Design", "Hosting", "Domains"]},
    {"year": 2013, "title": "Custom Software",
     "text": "POS, inventory, ERP and custom desktop and web software built around each business.",
     "tags": ["POS", "ERP", "Databases"]},
    {"year": 2016, "title": "Mobile & E-commerce",
     "text": "Online stores, marketplaces and Android / iOS apps put clients in every pocket.",
     "tags": ["E-commerce", "Android", "iOS"]},
    {"year": 2019, "title": "Cloud & Growth",
     "text": "Cloud deployment, SEO, social media and digital marketing drive brand growth.",
     "tags": ["Cloud", "SEO", "Digital Marketing"]},
    {"year": 2022, "title": "Full Stack Engineering",
     "text": "Scalable full stack systems, APIs, DevOps and cyber security.",
     "tags": ["Full Stack", "APIs", "DevOps", "Security"]},
    {"year": date.today().year, "title": "AI & Automation",
     "text": "AI solutions, chatbots, business automation and 2D / 3D animation: today's advanced technology.",
     "tags": ["AI", "Automation", "Animation"]},
]

# ----------------------------------------------------------------- services
SERVICE_TIERS = [
    {
        "key": "foundation", "level": "01", "name": "Foundation",
        "intro": "Where we started: the basics every business depends on.",
        "services": [
            {"slug": "it-support", "icon": "wrench", "title": "IT Support & Maintenance",
             "short": "Repair, upgrades and maintenance contracts for computers and office systems.",
             "points": ["Hardware repair & upgrades", "OS and software installation",
                        "Annual maintenance contracts", "On-site and remote support"]},
            {"slug": "networking", "icon": "network", "title": "Networking & CCTV",
             "short": "Office LAN and Wi-Fi, servers, CCTV and structured cabling.",
             "points": ["LAN / Wi-Fi setup", "Router and firewall configuration",
                        "CCTV installation", "Server rooms and cabling"]},
            {"slug": "hosting", "icon": "server", "title": "Domain, Hosting & Email",
             "short": "Domain registration, fast hosting and professional business email.",
             "points": ["Domain registration", "Shared and VPS hosting",
                        "Business email setup", "SSL and backups"]},
        ],
    },
    {
        "key": "growth", "level": "02", "name": "Growth",
        "intro": "Services that take your business online and help it grow.",
        "services": [
            {"slug": "web-development", "icon": "globe", "title": "Website Development",
             "short": "Fast, responsive and SEO-friendly business websites.",
             "points": ["Corporate and portfolio sites", "CMS and admin panels",
                        "Landing pages", "Speed and SEO optimization"]},
            {"slug": "ecommerce", "icon": "shopping-cart", "title": "E-commerce & Marketplaces",
             "short": "Online stores and multi-vendor marketplaces with payment gateways.",
             "points": ["Single and multi-vendor stores", "Payment and courier integration",
                        "Inventory and order management", "Vendor dashboards"]},
            {"slug": "software", "icon": "layout-dashboard", "title": "Custom Software",
             "short": "POS, ERP, CRM and software shaped around your workflow.",
             "points": ["POS and inventory", "ERP / CRM systems",
                        "Reports and analytics", "Cloud-based access"]},
            {"slug": "digital-marketing", "icon": "megaphone", "title": "Digital Marketing",
             "short": "SEO, social media, ads and branding that bring in more customers.",
             "points": ["Search engine optimization", "Social media management",
                        "Google and Meta ads", "Branding and graphic design"]},
        ],
    },
    {
        "key": "advanced", "level": "03", "name": "Advanced",
        "intro": "Today's most modern technologies.",
        "services": [
            {"slug": "full-stack", "icon": "layers", "title": "Full Stack Development",
             "short": "Scalable web apps, APIs and SaaS products, from frontend to backend.",
             "points": ["Python, PHP and JavaScript stacks", "REST and GraphQL APIs",
                        "SaaS platforms", "Microservices"]},
            {"slug": "mobile-apps", "icon": "smartphone", "title": "Mobile App Development",
             "short": "Android and iOS apps, native and cross-platform.",
             "points": ["Android and iOS", "Flutter / React Native",
                        "App Store and Play Store publishing", "Push notifications"]},
            {"slug": "ai-solutions", "icon": "brain-circuit", "title": "AI & Automation",
             "short": "AI chatbots, smart automation and data-driven solutions.",
             "points": ["AI chatbots and assistants", "Workflow automation",
                        "Data analysis and dashboards", "AI integration in apps"]},
            {"slug": "cloud-devops", "icon": "cloud", "title": "Cloud & DevOps",
             "short": "Cloud deployment, CI/CD, monitoring and scaling.",
             "points": ["AWS / GCP / VPS setup", "CI/CD pipelines",
                        "Docker deployments", "Monitoring and backups"]},
            {"slug": "cyber-security", "icon": "shield-check", "title": "Cyber Security",
             "short": "Security audits and protection for websites and networks.",
             "points": ["Security audits", "Malware cleanup",
                        "Firewall and access control", "Data backup and recovery"]},
            {"slug": "animation", "icon": "clapperboard", "title": "2D / 3D Animation",
             "short": "Explainer videos, product animations and motion graphics.",
             "points": ["Explainer videos", "Logo and product animation",
                        "Motion graphics", "Social media reels"]},
        ],
    },
]

WHY_US = [
    {"icon": "award", "title": f"{YEARS}+ years of experience",
     "text": "With clients since 2007, we have grown through every major technology shift."},
    {"icon": "puzzle", "title": "Everything in one place",
     "text": "From hardware to AI, there is no need to hunt for separate vendors."},
    {"icon": "headset", "title": "Reliable support",
     "text": "We stay with you after launch with maintenance and ongoing support."},
    {"icon": "rocket", "title": "Modern technology",
     "text": "Every project is built with current, secure and scalable tools."},
]

PROCESS = [
    ("Discuss", "We learn about your needs and goals."),
    ("Plan", "We agree scope, timeline and budget."),
    ("Build", "Design, development and thorough testing."),
    ("Launch & Support", "We go live and keep it running."),
]

TECH = ["Python", "Flask", "Django", "PHP", "MySQL", "PostgreSQL", "JavaScript", "React",
        "Flutter", "Android", "iOS", "WordPress", "Docker", "AWS", "Linux", "Cisco", "Git"]

# ------------------------------------------------------------------- about
VALUES = [
    {"icon": "shield-check", "title": "Integrity", "text": "Honest advice, clear pricing and promises we keep."},
    {"icon": "lightbulb", "title": "Innovation", "text": "We keep learning so our clients always get what is current."},
    {"icon": "handshake", "title": "Partnership", "text": "Your success is our success: we work as part of your team."},
    {"icon": "gem", "title": "Quality", "text": "Clean work, careful testing and attention to detail."},
]

MISSION = ("To make technology simple and dependable for every business, "
           "from a single office computer to a full digital platform.")
VISION = ("To be the most trusted full stack development and digital solutions partner "
          "for growing businesses.")

# --------------------------------------------------------------- portfolio
# TODO: replace these with your real projects. Add a screenshot at
# static/img/portfolio/<image>.jpg and set "image" to the file name.
PORTFOLIO_CATEGORIES = ["Web", "E-commerce", "Mobile", "Software", "Marketing"]
PORTFOLIO = [
    {"title": "Multi-vendor Marketplace", "category": "E-commerce", "image": "",
     "text": "Marketplace with vendor dashboards, payments, order tracking and admin controls.",
     "tags": ["Python", "MySQL", "Payments"], "url": ""},
    {"title": "Corporate Business Website", "category": "Web", "image": "",
     "text": "Fast, responsive company website with CMS and lead capture forms.",
     "tags": ["Responsive", "SEO", "CMS"], "url": ""},
    {"title": "Delivery & Shopping App", "category": "Mobile", "image": "",
     "text": "Android and iOS app with live orders, push notifications and secure checkout.",
     "tags": ["Android", "iOS", "API"], "url": ""},
    {"title": "POS & Inventory System", "category": "Software", "image": "",
     "text": "Point of sale with stock control, invoicing and branch-wise reports.",
     "tags": ["POS", "Reports", "Cloud"], "url": ""},
    {"title": "Brand & Social Campaign", "category": "Marketing", "image": "",
     "text": "Brand identity, social media content and ad campaigns that grow reach.",
     "tags": ["Branding", "Ads", "Social"], "url": ""},
    {"title": "Office Network & CCTV", "category": "Software", "image": "",
     "text": "Structured cabling, Wi-Fi, firewall and CCTV for a multi-floor office.",
     "tags": ["Networking", "CCTV", "Security"], "url": ""},
]

# ----------------------------------------------------------------- clients
# Drop client logos (PNG/SVG/JPG) in static/img/clients/ — they appear
# automatically on the Clients page. File name becomes the client name.
CLIENT_INDUSTRIES = [
    {"icon": "store", "title": "Retail & E-commerce", "text": "Online stores, POS and inventory."},
    {"icon": "graduation-cap", "title": "Education", "text": "School and institute systems, websites and networks."},
    {"icon": "heart-pulse", "title": "Healthcare", "text": "Clinic software, records and IT support."},
    {"icon": "factory", "title": "Manufacturing & Trade", "text": "ERP, reporting and infrastructure."},
    {"icon": "building-2", "title": "Offices & Startups", "text": "Networks, websites and cloud setup."},
    {"icon": "utensils", "title": "Food & Hospitality", "text": "Ordering systems, apps and marketing."},
]


def client_logos():
    folder = os.path.join(BASE_DIR, "static", "img", "clients")
    out = []
    if os.path.isdir(folder):
        for f in sorted(os.listdir(folder)):
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".svg", ".webp")):
                name = os.path.splitext(f)[0].replace("-", " ").replace("_", " ").title()
                out.append({"file": f, "name": name})
    return out


# -------------------------------------------------------------------- team
# TODO: add your team members. Optional photo: static/img/team/<photo>.jpg
TEAM = [
    {"name": "Muhammad Adnan", "role": "Chief Executive Officer (CEO)", "photo": "",
     "bio": f"Founder and CEO of Xeon Net. Leading the company since {COMPANY['founded']}, "
            "guiding it from basic IT services to full stack and AI solutions.",
     "links": {}},
]

DEPARTMENTS = [
    {"icon": "code-xml", "title": "Development", "text": "Full stack, mobile and software engineers."},
    {"icon": "palette", "title": "Design & Animation", "text": "UI / UX, branding and motion graphics."},
    {"icon": "network", "title": "Infrastructure", "text": "Networking, cloud, servers and security."},
    {"icon": "headset", "title": "Support & Marketing", "text": "Client care, SEO and digital campaigns."},
]


def all_services():
    for tier in SERVICE_TIERS:
        for s in tier["services"]:
            yield tier, s


def find_service(slug):
    for tier, s in all_services():
        if s["slug"] == slug:
            return tier, s
    return None, None


SERVICE_COUNT = sum(len(t["services"]) for t in SERVICE_TIERS)
