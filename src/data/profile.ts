export type ExperienceItem = {
  company: string;
  role: string;
  location: string;
  period: string;
  highlights: string[];
};

export type ProjectItem = {
  name: string;
  context: string;
  description: string;
  highlights: string[];
  technologies: string[];
  /** Screenshot under /public/images/projects/. Omit → cover art fallback. */
  preview?: string;
  /** Live deployment, if public. */
  url?: string;
  /** Source, if public. */
  repo?: string;
  /**
   * Set false when the site refuses framing (X-Frame-Options /
   * CSP frame-ancestors) — the expanded card then stays on the screenshot
   * instead of offering a live preview that would render a blank frame.
   */
  embeddable?: boolean;
};

export type CertificateItem = {
  title: string;
  level: string;
  issuer: string;
  url: string;
};

export const certificates: CertificateItem[] = [
  {
    title: "Python",
    level: "Basic",
    issuer: "HackerRank",
    url: "https://www.hackerrank.com/certificates/6b362b2a87c1",
  },
  {
    title: "SQL",
    level: "Basic",
    issuer: "HackerRank",
    url: "/dev_certificate/sql_basic%20certificate.pdf",
  },
  {
    title: "Problem Solving",
    level: "Intermediate",
    issuer: "HackerRank",
    url: "/dev_certificate/problem_solving_intermediate%20certificate.pdf",
  },
  {
    title: "REST API",
    level: "Intermediate",
    issuer: "HackerRank",
    url: "/dev_certificate/rest_api_intermediate%20certificate.pdf",
  },
];

export const profile = {
  name: "Ajas Mohammed",
  role: "Python Backend Engineer",
  location: "Kochi, India",
  email: "ajasmohammed09@gmail.com",
  phone: "+919567987785",
  resumeUrl: "/ajasmohammed-python-developer.pdf",
  social: {
    githubUser: "AjasMohammed",
    githubUrl: "https://github.com/AjasMohammed",
    linkedinHandle: "ajasmohammed",
    linkedinUrl: "https://www.linkedin.com/in/ajasmohammed",
    twitterUrl: "",
  },
  summary:
    "Two years writing python that ages well — primary backend maintainer of an e-learning platform: rest apis, celery pipelines, postgres performance, deploys. Lately llm and retrieval services with langchain, langgraph and pgvector. Small careful changes over heroic rewrites.",
  headline:
    "Patient backends, honest interfaces. Python by trade, react by curiosity.",
  capabilities: [
    "Full-stack web apps",
    "REST APIs & backends",
    "Static sites",
    "Desktop apps",
    "LLM-powered tools",
    "RAG & retrieval services",
    "Payments & subscriptions",
    "Automation & agentic workflows",
    "Containerized deploys",
  ],
  education: [
    {
      degree: "Diploma in Electrical and Electronic Engineering",
      institution: "Government Polytechnic College Punalur",
      location: "Punalur, Kollam, Kerala",
      period: "Jul 2020 - Jul 2023",
      grade: "GPA: 7.79",
    },
    {
      degree: "Higher Secondary · Biology Science",
      institution: "Jawahar Higher Secondary School",
      location: "Ayoor, Kollam, Kerala",
      period: "",
      grade: "",
    },
    {
      degree: "SSLC · 10th",
      institution: "Government Higher Secondary School Anchal West",
      location: "Anchal, Kollam, Kerala",
      period: "",
      grade: "",
    },
  ],
  skills: {
    languages: ["Python", "SQL", "JavaScript", "TypeScript"],
    frameworks: [
      "Django",
      "Django REST Framework",
      "FastAPI",
      "Celery",
      "Django Channels",
      "LangChain",
      "LangGraph",
      "SQLAlchemy",
      "ReactJS",
      "Next.js",
    ],
    databases: [
      "PostgreSQL",
      "pgvector",
      "Redis",
      "Elasticsearch",
      "Qdrant",
      "MySQL",
      "SQLite",
    ],
    tools: [
      "Docker",
      "Docker Compose",
      "GitHub Actions",
      "Ansible",
      "nginx",
      "Linux",
      "Git",
      "uv",
      "Claude Code",
      "Cursor",
    ],
  },
};

export const experiences: ExperienceItem[] = [
  {
    company: "Neumeral Technologies",
    role: "Software Developer",
    location: "Kochi",
    period: "Apr 2024 - Present",
    highlights: [
      "Primary backend maintainer of Learnabble, a Django and DRF e-learning platform, owning its core, accounts, and portal apps.",
      "Built the mock-interview pipeline end to end — data model, audio-format validation, scoring, and Celery workers so 3–5 min of transcription and grading runs off the request cycle.",
      "Shipped subscriptions and payments with Razorpay and RevenueCat, reworking the Android-only purchase API into a multi-platform mobile endpoint.",
      "Cut course-page latency from 800ms to 200ms with cursor pagination, an index-backed completion check, and cached course-item lookups.",
      "Set up Pactflow contract tests with PostgreSQL and Redis service containers in GitHub Actions, and deploy tagged releases to Hetzner with Ansible, nginx, and Docker.",
      "Sole author of Learnabble Agents, a FastAPI and LangGraph assistant routing messages over WebSockets with PostgreSQL checkpointing, interrupt/resume mid-chat verification, and Langfuse tracing.",
    ],
  },
  {
    company: "CloudToBuild",
    role: "Software Developer · Contract",
    location: "Remote",
    period: "Jun 2025 - Present",
    highlights: [
      "Built the checkout and payments API and its admin surface on FastAPI with SQLAlchemy and Alembic migrations.",
      "Shipped through GitHub Actions CI and scripted deploys.",
      "Also worked on an e-commerce storefront and an AI-assisted site builder.",
      "Use agentic coding tools daily — Claude Code, Cursor, Antigravity, plus self-built MCP servers.",
    ],
  },
  {
    company: "Allwin Technologies",
    role: "Backend Developer",
    location: "India",
    period: "Jan 2024 - Mar 2024",
    highlights: [
      "Designed scalable RESTful APIs with Django and Django REST Framework.",
      "Improved backend reliability through troubleshooting and cross-functional collaboration.",
      "Managed database models and optimized queries for stronger API performance.",
    ],
  },
  {
    company: "Imiot TechnoLabs LLP Ltd. · Internship",
    role: "Python Django Developer",
    location: "Thalassery, Kerala, India · Remote",
    period: "Oct 2023 - Dec 2023",
    highlights: [
      "Built Django backends and REST endpoints during a 3-month internship.",
      "Collaborated remotely with the team on feature delivery and bug fixes.",
    ],
  },
];

/* Freelance builds only — client sites that are live and public. Employer work
   (Learnabble, Neusler) stays described in `experiences`. */
export const projects: ProjectItem[] = [
  {
    name: "Zacmount",
    context: "Shilajit brand storefront, freelance",
    description:
      "A single-product storefront for a Himalayan shilajit brand, built around long-form editorial and buyer trust.",
    highlights: [
      "Built the storefront and ordering flow with the Next.js App Router.",
      "Structured product, offer, and return-policy JSON-LD for rich results.",
      "Shipped supporting routes for lab results, process, journal, and policies.",
      "Deployed on Cloudflare with static caching for the editorial pages.",
    ],
    technologies: ["Next.js", "React", "Tailwind CSS", "Cloudflare"],
    preview: "/images/projects/zacmount.webp",
    url: "https://zacmount.com/",
    // Serves `x-frame-options: SAMEORIGIN` — drop that header on the site to
    // turn the live preview on here.
    embeddable: false,
  },
  {
    name: "BA-BU Family Salon",
    context: "Salon site, North Paravur · freelance",
    description:
      "A multi-page salon site with per-service pages, gallery, and WhatsApp-first appointment booking.",
    highlights: [
      "Built service routes for hair care, skin and body care, and weddings.",
      "Wired enquiries to WhatsApp and a contact form for walk-in bookings.",
      "Added BeautySalon, Service, and FAQ schema for local search.",
      "Tuned image-heavy gallery pages to stay fast on mobile data.",
    ],
    technologies: ["Next.js", "React", "Tailwind CSS", "Cloudflare"],
    preview: "/images/projects/babu-family-salon.webp",
    url: "https://babufamilysalon.com/",
  },
  {
    name: "SkyGym",
    context: "Gym landing site, Alappuzha · freelance",
    description:
      "A single-page site for a two-branch gym, built to convert launch-offer traffic into WhatsApp enquiries.",
    highlights: [
      "Laid out programs, transformations, and member testimonials in one scroll.",
      "Split launch offers by plan so pricing reads at a glance.",
      "Made branch selection the first choice in the hero.",
      "Routed every call-to-action to WhatsApp for instant enquiries.",
    ],
    technologies: ["Next.js", "React", "Tailwind CSS", "Cloudflare"],
    preview: "/images/projects/skygym.webp",
    url: "https://skygym.in/",
  },
  {
    name: "Aurora Salon",
    context: "Concept build · demo",
    description:
      "A salon site concept built as a pitch template — same structure as a client build, with placeholder content.",
    highlights: [
      "Designed a dark, editorial hero for a bridal and makeover studio.",
      "Covered services, gallery, and contact as a reusable salon layout.",
      "Deployed to Cloudflare Workers as a shareable preview link.",
    ],
    technologies: ["Next.js", "React", "Tailwind CSS", "Cloudflare Workers"],
    preview: "/images/projects/aurora-salon.webp",
    url: "https://seoul-salon.ajasmohammed33.workers.dev/",
  },
];
