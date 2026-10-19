"""
Xeon Net — website content.
Saari text/content yahan se edit karein. HTML chhedne ki zaroorat nahi.
"""
from datetime import date

COMPANY = {
    "name": "Xeon Net",
    "tagline": "Full Stack Development & Digital Solution",
    "domain": "xeonnet.site",
    "founded": 2007,
    # TODO: apni asli details yahan likhein
    "email": "info@xeonnet.site",
    "phone": "+92 300 0000000",
    "whatsapp": "923000000000",          # sirf digits, country code ke saath
    "address": "Faisalabad, Punjab, Pakistan",
    "hours": "Mon – Sat, 10:00 AM – 7:00 PM",
    "social": {
        "facebook": "#",
        "instagram": "#",
        "linkedin": "#",
    },
}

YEARS = date.today().year - COMPANY["founded"]

# Safar: 2007 ki basic IT services se aaj ki advance services tak.
# TODO: saal aur milestones apni company ki asli history ke mutabiq badal lein.
JOURNEY = [
    {"year": 2007, "title": "The Beginning",
     "text": "Computer hardware, repair, networking aur basic IT support se Xeon Net ka aaghaz.",
     "tags": ["Hardware", "Networking", "IT Support"]},
    {"year": 2010, "title": "Into the Web",
     "text": "Websites, domains, hosting aur business email ke saath online duniya mein qadam.",
     "tags": ["Web Design", "Hosting", "Domains"]},
    {"year": 2013, "title": "Custom Software",
     "text": "Businesses ke liye POS, inventory, ERP aur custom desktop/web software.",
     "tags": ["POS", "ERP", "Databases"]},
    {"year": 2016, "title": "Mobile & E-commerce",
     "text": "Online stores, marketplaces aur Android/iOS apps ke zariye clients ko mobile par laya.",
     "tags": ["E-commerce", "Android", "iOS"]},
    {"year": 2019, "title": "Cloud & Growth",
     "text": "Cloud deployment, SEO, social media aur digital marketing se brands ki growth.",
     "tags": ["Cloud", "SEO", "Digital Marketing"]},
    {"year": 2022, "title": "Full Stack Engineering",
     "text": "Scalable full stack systems, APIs, DevOps aur cyber security.",
     "tags": ["Full Stack", "APIs", "DevOps", "Security"]},
    {"year": date.today().year, "title": "AI & Automation",
     "text": "AI solutions, chatbots, business automation aur 2D/3D animation — aaj ki advance technology.",
     "tags": ["AI", "Automation", "Animation"]},
]

# Services teen levels mein: Foundation (basic) -> Growth -> Advanced
SERVICE_TIERS = [
    {
        "key": "foundation", "level": "01", "name": "Foundation",
        "intro": "Jahan se humne shuru kiya — har business ki buniyad.",
        "services": [
            {"slug": "it-support", "icon": "wrench", "title": "IT Support & Maintenance",
             "short": "Computers, laptops aur office systems ki repair, upgrade aur AMC.",
             "points": ["Hardware repair & upgrades", "OS / software installation",
                        "Annual maintenance contracts", "On-site & remote support"]},
            {"slug": "networking", "icon": "network", "title": "Networking & CCTV",
             "short": "Office LAN/Wi-Fi, servers, CCTV aur structured cabling.",
             "points": ["LAN / Wi-Fi setup", "Router & firewall configuration",
                        "CCTV installation", "Server rooms & cabling"]},
            {"slug": "hosting", "icon": "server", "title": "Domain, Hosting & Email",
             "short": "Domain registration, fast hosting aur professional business email.",
             "points": ["Domain registration", "Shared / VPS hosting",
                        "Business email setup", "SSL & backups"]},
        ],
    },
    {
        "key": "growth", "level": "02", "name": "Growth",
        "intro": "Business ko online la kar aage barhane wali services.",
        "services": [
            {"slug": "web-development", "icon": "globe", "title": "Website Development",
             "short": "Fast, responsive aur SEO-friendly business websites.",
             "points": ["Corporate & portfolio sites", "CMS / admin panels",
                        "Landing pages", "Speed & SEO optimization"]},
            {"slug": "ecommerce", "icon": "shopping-cart", "title": "E-commerce & Marketplaces",
             "short": "Online stores aur multi-vendor marketplaces, payment gateways ke saath.",
             "points": ["Single & multi-vendor stores", "Payment & courier integration",
                        "Inventory & order management", "Vendor dashboards"]},
            {"slug": "software", "icon": "layout-dashboard", "title": "Custom Software",
             "short": "POS, ERP, CRM aur aapke workflow ke mutabiq software.",
             "points": ["POS & inventory", "ERP / CRM systems",
                        "Reports & analytics", "Cloud-based access"]},
            {"slug": "digital-marketing", "icon": "megaphone", "title": "Digital Marketing",
             "short": "SEO, social media, ads aur branding se zyada customers.",
             "points": ["SEO", "Social media management",
                        "Google & Meta ads", "Branding & graphics"]},
        ],
    },
    {
        "key": "advanced", "level": "03", "name": "Advanced",
        "intro": "Aaj ki nayi aur advance technologies.",
        "services": [
            {"slug": "full-stack", "icon": "layers", "title": "Full Stack Development",
             "short": "Scalable web apps, APIs aur SaaS products — frontend se backend tak.",
             "points": ["Python, PHP, JavaScript stacks", "REST / GraphQL APIs",
                        "SaaS platforms", "Microservices"]},
            {"slug": "mobile-apps", "icon": "smartphone", "title": "Mobile App Development",
             "short": "Android aur iOS apps — native aur cross-platform.",
             "points": ["Android & iOS", "Flutter / React Native",
                        "App Store / Play Store publishing", "Push notifications"]},
            {"slug": "ai-solutions", "icon": "brain-circuit", "title": "AI & Automation",
             "short": "AI chatbots, smart automation aur data-driven solutions.",
             "points": ["AI chatbots & assistants", "Workflow automation",
                        "Data analysis & dashboards", "AI integration in apps"]},
            {"slug": "cloud-devops", "icon": "cloud", "title": "Cloud & DevOps",
             "short": "Cloud deployment, CI/CD, monitoring aur scaling.",
             "points": ["AWS / GCP / VPS setup", "CI/CD pipelines",
                        "Docker deployments", "Monitoring & backups"]},
            {"slug": "cyber-security", "icon": "shield-check", "title": "Cyber Security",
             "short": "Websites aur networks ki security audit aur protection.",
             "points": ["Security audits", "Malware cleanup",
                        "Firewall & access control", "Data backup & recovery"]},
            {"slug": "animation", "icon": "clapperboard", "title": "2D / 3D Animation",
             "short": "Explainer videos, product animations aur motion graphics.",
             "points": ["Explainer videos", "Logo & product animation",
                        "Motion graphics", "Social media reels"]},
        ],
    },
]

WHY_US = [
    {"icon": "award", "title": f"{YEARS}+ saal ka tajurba", "text": "2007 se clients ke saath, har technology shift ke saath barhte hue."},
    {"icon": "puzzle", "title": "Sab kuch ek jagah", "text": "Hardware se AI tak — aapko alag alag vendors dhoondne ki zaroorat nahi."},
    {"icon": "headset", "title": "Reliable support", "text": "Project ke baad bhi saath — maintenance aur support jaari rehti hai."},
    {"icon": "rocket", "title": "Modern technology", "text": "Har project mein latest, secure aur scalable tools."},
]

PROCESS = [
    ("Discuss", "Aapki zaroorat aur goals samajhna"),
    ("Plan", "Scope, timeline aur budget tay karna"),
    ("Build", "Design, development aur testing"),
    ("Launch & Support", "Live karna aur aage maintain karna"),
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
