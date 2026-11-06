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
    "address": "Business Hub Workspace, Faisalabad, Pakistan",
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
    ("brands", "Our Brands"),
    ("clients", "Clients"),
    ("team", "Team"),
    ("reviews", "Reviews"),
    ("contact_page", "Contact"),
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
# Each project gets its own case-study page: /portfolio/<slug>
# TODO: replace these SAMPLE projects with your real work. For each real project:
#   - set "sample": False (this hides the "Sample project" badge)
#   - put screenshots in static/img/portfolio/ and list file names in "images"
#     (the first image is used as the cover)
#   - fill client, year, challenge, solution, features, results, tech, url
PORTFOLIO_CATEGORIES = ["Web", "E-commerce", "Mobile", "Software", "Marketing", "Networking"]
CATEGORY_ART = {"Web": "web", "E-commerce": "ecommerce", "Mobile": "mobile",
                "Software": "software", "Marketing": "marketing", "Networking": "network"}

PORTFOLIO = [
    {"slug": "multi-vendor-marketplace", "title": "Multi-vendor Marketplace", "category": "E-commerce",
     "sample": True, "client": "", "year": "", "url": "", "images": [],
     "summary": "A marketplace where many vendors sell, with payments, order tracking and admin controls.",
     "challenge": "The client needed one platform where independent vendors could list products, manage orders and get paid, without the owner handling every sale by hand.",
     "solution": "We built a web marketplace with vendor dashboards, a customer storefront, a secure checkout and an admin panel to manage vendors, commissions and orders.",
     "features": ["Vendor registration and dashboards", "Product catalogue with search and filters",
                  "Cart, checkout and payment gateway", "Order tracking and notifications",
                  "Commission and payout management", "Admin panel with reports"],
     "results": ["One platform for all vendors, orders and payouts", "Less manual work for the owner",
                 "Ready to grow into native mobile apps"],
     "tech": ["Python", "MySQL", "Payments", "REST API"]},
    {"slug": "corporate-business-website", "title": "Corporate Business Website", "category": "Web",
     "sample": True, "client": "", "year": "", "url": "", "images": [],
     "summary": "A fast, responsive company website with a content manager and lead capture forms.",
     "challenge": "The business had no professional online presence and was losing enquiries to competitors with better websites.",
     "solution": "We designed a modern responsive website with clear service pages, a portfolio, SEO foundations and contact forms that save every enquiry to an admin dashboard.",
     "features": ["Responsive design for phones and desktops", "Service and portfolio pages",
                  "Contact and quote forms", "Basic SEO and fast loading", "Easy content updates"],
     "results": ["A professional first impression", "Every enquiry captured in one place",
                 "A solid base for SEO and marketing"],
     "tech": ["Responsive", "SEO", "CMS", "Flask"]},
    {"slug": "delivery-shopping-app", "title": "Delivery & Shopping App", "category": "Mobile",
     "sample": True, "client": "", "year": "", "url": "", "images": [],
     "summary": "Android and iOS app with live orders, push notifications and secure checkout.",
     "challenge": "Customers wanted to order from their phones, and the business wanted to reach them directly instead of relying on third-party apps.",
     "solution": "We built native-feeling Android and iOS apps connected to a central API, with product browsing, ordering, order status updates and push notifications.",
     "features": ["Android and iOS apps", "Product browsing and search", "Secure checkout",
                  "Live order status", "Push notifications", "Admin and vendor dashboards"],
     "results": ["Direct customer channel on every phone", "Faster ordering", "One backend for web and apps"],
     "tech": ["Android", "iOS", "REST API", "Push"]},
    {"slug": "pos-inventory-system", "title": "POS & Inventory System", "category": "Software",
     "sample": True, "client": "", "year": "", "url": "", "images": [],
     "summary": "Point of sale with stock control, invoicing and branch-wise reports.",
     "challenge": "Stock and sales were tracked on paper and spreadsheets, causing mistakes, stock-outs and slow month-end reporting.",
     "solution": "We delivered a point-of-sale and inventory system with barcode-ready billing, stock alerts, purchase tracking and reports for every branch.",
     "features": ["Fast billing and invoicing", "Stock tracking and low-stock alerts", "Purchase and supplier records",
                  "Multi-branch support", "Daily and monthly reports", "User roles and permissions"],
     "results": ["Accurate, real-time stock", "Reports in seconds instead of days", "Fewer billing errors"],
     "tech": ["POS", "Reports", "Cloud", "Database"]},
    {"slug": "brand-social-campaign", "title": "Brand & Social Campaign", "category": "Marketing",
     "sample": True, "client": "", "year": "", "url": "", "images": [],
     "summary": "Brand identity, social media content and ad campaigns that grow reach.",
     "challenge": "The brand was invisible online and had no consistent look, voice or content plan.",
     "solution": "We created a brand identity, a monthly content calendar, designed posts and reels, and ran targeted ad campaigns with regular performance reports.",
     "features": ["Logo and brand guidelines", "Monthly content calendar", "Post, story and reel design",
                  "Google and Meta ad campaigns", "Monthly performance reports"],
     "results": ["A consistent, recognisable brand", "Regular, planned content", "Measurable ad performance"],
     "tech": ["Branding", "Ads", "Social", "SEO"]},
    {"slug": "office-network-cctv", "title": "Office Network & CCTV", "category": "Networking",
     "sample": True, "client": "", "year": "", "url": "", "images": [],
     "summary": "Structured cabling, Wi-Fi, firewall and CCTV for a multi-floor office.",
     "challenge": "The office had unreliable Wi-Fi, loose cabling and no surveillance, making work slow and the premises hard to secure.",
     "solution": "We designed and installed structured cabling, managed Wi-Fi on every floor, a firewall for protection and a CCTV system with remote viewing.",
     "features": ["Structured cabling and racks", "Wi-Fi coverage on every floor", "Firewall and access control",
                  "CCTV with remote viewing", "Documentation and handover"],
     "results": ["Stable, fast network", "Secure premises", "Easy to maintain and expand"],
     "tech": ["Networking", "CCTV", "Security", "Wi-Fi"]},
]


def find_project(slug):
    for i, p in enumerate(PORTFOLIO):
        if p["slug"] == slug:
            return p, PORTFOLIO[(i + 1) % len(PORTFOLIO)]
    return None, None


def project_cover(p):
    """Return ('image', filename) if a real screenshot exists, else ('art', scene)."""
    if p.get("images"):
        return "image", p["images"][0]
    return "art", CATEGORY_ART.get(p["category"], "web")



# -------------------------------------------------------------- own brands
# Businesses that Xeon Net itself has started and runs.
# TODO: add each brand's live website link in "url" (blank = no button shown),
#       and refine the descriptions/features with your real details.
BRANDS = [
    {"slug": "multi-vendor", "name": "Multi-vendor E-commerce", "industry": "E-commerce", "icon": "store",
     "art": "ecommerce", "status": "Own platform", "url": "",
     "tagline": "One marketplace, many sellers.",
     "text": "Our multi-vendor e-commerce platform lets many sellers open their own stores and sell to customers from one website, with orders, payments and payouts handled in a single system.",
     "features": ["Vendor stores and dashboards", "Product catalogue and search", "Orders, payments and payouts", "Admin control panel"]},
    {"slug": "360-consultancy", "name": "360 Consultancy", "industry": "Consultancy", "icon": "globe",
     "art": "consult", "status": "Live", "url": "https://360consultancy.pk",
     "tagline": "Visa, study abroad and travel guidance.",
     "text": "360 Consultancy helps people with visa consultancy, study abroad guidance and tour packages, with clear information and a simple online process.",
     "features": ["Visa consultancy", "Study abroad guidance", "Tour and travel packages", "Online enquiry and support"]},
    {"slug": "boom-glow", "name": "Boom Glow", "industry": "Cosmetics", "icon": "sparkles",
     "art": "beauty", "status": "Own brand", "url": "",
     "tagline": "Cosmetics and beauty, made to glow.",
     "text": "Boom Glow is our cosmetics brand and online store, bringing beauty and skincare products to customers with easy ordering.",
     "features": ["Cosmetics and beauty products", "Online store and ordering", "Brand design and marketing", "Customer support"]},
    {"slug": "ibrahim-real-estates", "name": "Ibrahim Real Estates", "industry": "Real Estate", "icon": "building-2",
     "art": "realestate", "status": "Own brand", "url": "",
     "tagline": "Find the right property.",
     "text": "Ibrahim Real Estates is our real estate business, helping buyers, sellers and renters find and list properties with clear details and easy enquiries.",
     "features": ["Property listings", "Search by location and type", "Buyer and seller enquiries", "Agent and admin dashboard"]},
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


# ------------------------------------------------------ service details
SERVICE_DETAILS = {
    "it-support": {"art": "support",
        "overview": "Computers that fail, slow systems and unreliable printers cost businesses money every day. Our support team keeps your equipment and software running, on-site or remotely, so your people can keep working.",
        "benefits": [("Fast response", "Quick diagnosis and repair so downtime stays short."),
                     ("Planned maintenance", "Regular checks catch problems before they stop work."),
                     ("One accountable partner", "A single team for hardware, software and users.")],
        "tech": ["Windows", "Linux", "macOS", "Microsoft 365", "Printers", "Backup"],
        "faqs": [("Do you offer annual maintenance contracts?", "Yes. An AMC covers regular visits, remote support and priority repairs for a fixed yearly fee."),
                 ("Can you support us remotely?", "Yes. Most software problems can be fixed remotely, and we visit on-site for hardware issues.")]},
    "networking": {"art": "network",
        "overview": "A strong network is the backbone of every office. We plan, install and secure wired and wireless networks and CCTV systems that stay fast, reliable and easy to expand.",
        "benefits": [("Reliable coverage", "Wi-Fi and wired connections that work on every floor."),
                     ("Secure by design", "Firewalls and access control from day one."),
                     ("Clean installation", "Neat cabling, labelled racks and full documentation.")],
        "tech": ["Cisco", "MikroTik", "Ubiquiti", "Structured cabling", "Firewalls", "CCTV / NVR"],
        "faqs": [("Can you install CCTV with remote viewing?", "Yes. We set up cameras and recorders so you can watch live and recorded video from your phone."),
                 ("Do you handle new office setups?", "Yes. From cabling to Wi-Fi, servers and CCTV, we can set up a complete office.")]},
    "hosting": {"art": "hosting",
        "overview": "Your website and email need a solid home. We register domains, host websites on fast, secure servers and set up professional email so your business always looks trustworthy.",
        "benefits": [("Fast and secure", "SSL certificates and regular backups are included."),
                     ("Professional email", "Email addresses on your own domain, set up properly."),
                     ("Hassle-free", "We handle renewals, DNS and technical setup for you.")],
        "tech": ["Domains", "DNS", "cPanel", "VPS", "SSL", "Business email"],
        "faqs": [("Can you move my existing website?", "Yes. We migrate websites and email to new hosting with minimal downtime."),
                 ("Do you help connect a domain to Vercel or other platforms?", "Yes. We configure DNS records and SSL for any platform.")]},
    "web-development": {"art": "web",
        "overview": "Your website is often the first thing a customer sees. We design and build fast, mobile-friendly websites that explain what you do clearly and turn visitors into enquiries.",
        "benefits": [("Mobile-first design", "Looks and works great on every screen size."),
                     ("Built for search", "Clean structure and speed that help you rank."),
                     ("Easy to manage", "Update content yourself through a simple admin panel.")],
        "tech": ["Python / Flask", "PHP", "JavaScript", "HTML & CSS", "MySQL", "SEO"],
        "faqs": [("How long does a website take?", "A typical business website takes two to four weeks, depending on the number of pages and features."),
                 ("Can I update the website myself?", "Yes. We can add an admin panel so you can edit content without a developer.")]},
    "ecommerce": {"art": "ecommerce",
        "overview": "Selling online needs more than a product page. We build online stores and multi-vendor marketplaces with secure payments, inventory, order management and the dashboards your team needs.",
        "benefits": [("Sell around the clock", "Orders and payments handled automatically."),
                     ("Scales with you", "From a single store to a marketplace with many vendors."),
                     ("Local integrations", "Payment gateways and couriers that work in Pakistan.")],
        "tech": ["Python", "PHP", "MySQL", "Payment gateways", "Courier APIs", "REST API"],
        "faqs": [("Can you build a multi-vendor marketplace?", "Yes. We build marketplaces with vendor dashboards, commissions, payouts and admin controls."),
                 ("Can the store also have a mobile app?", "Yes. We build Android and iOS apps that use the same backend as your website.")]},
    "software": {"art": "software",
        "overview": "Off-the-shelf software rarely fits how you really work. We build POS, ERP, CRM and other business systems around your workflow so your team spends less time on paperwork.",
        "benefits": [("Fits your process", "Built around how your business actually runs."),
                     ("Real-time reports", "See sales, stock and performance instantly."),
                     ("Access anywhere", "Cloud-based, so your team can work from any location.")],
        "tech": ["Python", "PHP", "MySQL", "PostgreSQL", "REST API", "Cloud"],
        "faqs": [("Can you replace our spreadsheets?", "Yes. We turn spreadsheet processes into a proper system with users, permissions and reports."),
                 ("Do you provide training and support?", "Yes. We train your team and stay available after launch.")]},
    "digital-marketing": {"art": "marketing",
        "overview": "Great products still need to be found. We combine SEO, social media, paid ads and branding into campaigns that reach the right people and report clearly on what works.",
        "benefits": [("Be found online", "SEO and ads that put you in front of buyers."),
                     ("Consistent brand", "A clear look and voice across every channel."),
                     ("Clear reporting", "Simple monthly reports on results and next steps.")],
        "tech": ["SEO", "Google Ads", "Meta Ads", "Analytics", "Canva / Adobe", "Content"],
        "faqs": [("Do you manage social media accounts?", "Yes. We plan, design and post content and respond to the audience on your behalf."),
                 ("How do you measure results?", "We track visits, leads and ad performance and share a clear monthly report.")]},
    "full-stack": {"art": "stack",
        "overview": "From interface to database to servers, we build complete web applications and SaaS products. One team owns the whole stack, so everything is designed to work together and scale.",
        "benefits": [("End-to-end ownership", "Frontend, backend, database and deployment in one team."),
                     ("Scalable architecture", "Built to handle growth in users and data."),
                     ("Clean APIs", "Easy to connect with mobile apps and other systems.")],
        "tech": ["Python", "Flask / Django", "JavaScript", "React", "PostgreSQL", "REST / GraphQL"],
        "faqs": [("Can you build a SaaS product?", "Yes. We handle accounts, subscriptions, dashboards and the infrastructure behind them."),
                 ("Which technologies do you use?", "Mainly Python, JavaScript and PHP with SQL databases, chosen to match your project.")]},
    "mobile-apps": {"art": "mobile",
        "overview": "Your customers live on their phones. We build Android and iOS apps that feel smooth, stay connected to your systems and are published on the App Store and Play Store.",
        "benefits": [("One team, both platforms", "Android and iOS from a single plan and design."),
                     ("Connected to your backend", "Orders, users and content stay in sync with your website."),
                     ("Store publishing", "We handle submission and approval for you.")],
        "tech": ["Flutter", "React Native", "Android", "iOS", "Firebase", "REST API"],
        "faqs": [("Do you publish the app to the stores?", "Yes. We prepare listings, build the release and submit to Google Play and the App Store."),
                 ("Can the app send push notifications?", "Yes. We set up notifications for orders, offers and reminders.")]},
    "ai-solutions": {"art": "ai",
        "overview": "AI can answer customers, sort documents and automate repetitive work. We add practical AI to your business: chatbots, workflow automation and smart dashboards that save real time.",
        "benefits": [("Save hours of manual work", "Automate repetitive tasks and replies."),
                     ("Practical, not hype", "We focus on use cases that pay for themselves."),
                     ("Fits your tools", "Integrated with your website, apps and data.")],
        "tech": ["Python", "LLM APIs", "Automation", "Chatbots", "Data analysis", "Dashboards"],
        "faqs": [("What can an AI chatbot do for my business?", "It can answer common questions, collect leads and hand over to your team when needed, around the clock."),
                 ("Is my data safe?", "We design with privacy in mind and only share the data a task needs.")]},
    "cloud-devops": {"art": "cloud",
        "overview": "Good software needs reliable infrastructure. We deploy applications to the cloud, automate releases and monitor them so your systems stay fast, available and easy to scale.",
        "benefits": [("Reliable uptime", "Monitoring and alerts catch problems early."),
                     ("Faster releases", "Automated pipelines deliver updates safely."),
                     ("Cost-aware scaling", "Pay for what you use and grow when you need to.")],
        "tech": ["AWS", "Google Cloud", "Docker", "Linux", "CI/CD", "Vercel"],
        "faqs": [("Can you move our system to the cloud?", "Yes. We plan and perform the migration with minimal downtime."),
                 ("Do you set up backups?", "Yes. Automated backups and a recovery plan are part of every deployment.")]},
    "cyber-security": {"art": "security",
        "overview": "One breach can cost more than years of security spending. We audit your websites, systems and networks, fix weak points and put protection in place so your data stays yours.",
        "benefits": [("Find weaknesses first", "Audits that uncover problems before attackers do."),
                     ("Clean-up and recovery", "Malware removal and restoring hacked sites."),
                     ("Ongoing protection", "Firewalls, access control and backups.")],
        "tech": ["Security audits", "Firewalls", "SSL / TLS", "Access control", "Backups", "Malware removal"],
        "faqs": [("My website was hacked. Can you help?", "Yes. We clean the malware, close the vulnerability and restore your site from a safe backup."),
                 ("Do you provide security audits?", "Yes. We review your site, servers and network and give you a clear list of fixes.")]},
    "animation": {"art": "animation",
        "overview": "A short animation explains what pages of text cannot. We create explainer videos, logo animations and motion graphics that make your brand memorable on social media and your website.",
        "benefits": [("Explain things simply", "Complex ideas become clear in under a minute."),
                     ("Stand out", "Motion grabs attention in busy feeds."),
                     ("Brand consistent", "Colors, fonts and style matched to your brand.")],
        "tech": ["2D animation", "3D animation", "Motion graphics", "After Effects", "Blender", "Video editing"],
        "faqs": [("How long does an explainer video take?", "Most one-minute videos take one to three weeks, depending on style and revisions."),
                 ("Can you animate our logo?", "Yes. Logo animations are a quick, affordable way to refresh your brand.")]},
}

PROCESS_DETAIL = [
    ("Discuss", "We listen to your goals, users and constraints."),
    ("Plan", "Scope, timeline and budget agreed in writing."),
    ("Build", "Design, development and testing in clear milestones."),
    ("Launch & Support", "Go-live, training and ongoing maintenance."),
]

FAQS = [
    ("How long has Xeon Net been in business?", f"Xeon Net was established in {COMPANY['founded']}, so we have more than {YEARS} years of experience helping businesses with technology."),
    ("What services do you offer?", "Everything from IT support, networking and hosting to websites, e-commerce, custom software, mobile apps, cloud, cyber security, AI and animation."),
    ("How do you price projects?", "After a free consultation we send a clear written quote with scope, timeline and cost. There are no hidden charges."),
    ("Do you provide support after launch?", "Yes. We offer maintenance and support plans so your website, app or system keeps running smoothly."),
    ("How can I contact you quickly?", f"Call or WhatsApp {COMPANY['phone']}, or use the contact form and we will reply promptly."),
]

STATS_EXTRA = [("Free", "Consultation"), ("100%", "Written quotes")]


def all_services():
    for tier in SERVICE_TIERS:
        for s in tier["services"]:
            yield tier, s


def find_service(slug):
    for tier, s in all_services():
        if s["slug"] == slug:
            return tier, {**s, **SERVICE_DETAILS.get(slug, {})}
    return None, None


def service_art(slug):
    return SERVICE_DETAILS.get(slug, {}).get("art", "web")


SERVICE_COUNT = sum(len(t["services"]) for t in SERVICE_TIERS)


# ---------------------------------------------------------------- billing
# Shown at the bottom of invoices / proposals. Leave a value empty to hide that line.
BANK = {
    "bank": "",              # TODO: e.g. "Meezan Bank"
    "account_title": "",     # TODO: account holder name
    "account_number": "",    # TODO
    "iban": "",              # TODO
    "other": "",             # TODO: e.g. "JazzCash / Easypaisa: 0300 6666190"
}

PAYMENT_METHODS = ["Bank transfer", "Cash", "Cheque", "JazzCash", "Easypaisa", "Card / Online", "Other"]

DOC_DEFAULTS = {
    "proposal_intro": ("Thank you for the opportunity to work with you. Based on our discussion, "
                       "this proposal outlines the scope, timeline and investment for your project."),
    "proposal_terms": ("50% advance to start the work, balance on delivery.\n"
                       "Prices are valid for the period shown on this proposal.\n"
                       "Changes outside the agreed scope are quoted separately.\n"
                       "Domain, hosting and third-party licences are billed at cost unless listed."),
    "invoice_terms": ("Payment is due by the due date shown above.\n"
                      "Please mention the invoice number with your payment.\n"
                      "Work remains the property of Xeon Net until the invoice is paid in full."),
}

# First number issued per document type (invoices and proposals start at 0335).
NUMBER_START = {"invoice": 335, "proposal": 335}

# ----------------------------------------------------------- verification
CREDENTIAL_TYPES = ["Internship Completion Certificate", "Experience Letter", "Appointment Letter",
                    "Course Certificate", "Recommendation Letter", "Other Document"]
