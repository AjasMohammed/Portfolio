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
  role: "Python Developer",
  location: "Kochi, India",
  email: "ajasmohammed09@gmail.com",
  phone: "+919567987785",
  resumeUrl: "/resume-ajas-mohammed.pdf",
  social: {
    githubUser: "AjasMohammed",
    githubUrl: "https://github.com/AjasMohammed",
    linkedinHandle: "ajasmohammed",
    linkedinUrl: "https://www.linkedin.com/in/ajasmohammed",
    twitterUrl: "",
  },
  summary:
    "Two years writing python that ages well — django, fastapi, async pipelines under the hood, react and next.js on the surface. Small careful changes over heroic rewrites.",
  headline:
    "Patient backends, honest interfaces. Python by trade, react by curiosity.",
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
    languages: ["Python", "JavaScript", "HTML", "CSS"],
    frameworks: [
      "Django",
      "Django REST Framework",
      "Wagtail",
      "ReactJS",
      "Next.js",
      "FastAPI",
      "LangChain",
      "SQLAlchemy",
    ],
    databases: ["MySQL", "PostgreSQL", "SQLite"],
    tools: [
      "Docker",
      "Docker Compose",
      "Ansible",
      "Redis",
      "Celery",
      "Git",
      "Linux",
      "Cursor",
      "Claude Code",
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
      "Contribute across frontend and backend development for content publishing and learning platforms.",
      "Design and implement REST APIs using Django and Django REST Framework.",
      "Build asynchronous processing workflows with Celery and Redis.",
      "Refactor legacy codebases for maintainability, scalability, and performance.",
      "Containerize services with Docker and automate deployments using Ansible.",
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

export const projects: ProjectItem[] = [
  {
    name: "Learnabble",
    context: "Online Learning Portal, Neumeral Technologies",
    description:
      "A learning platform with course listing, enrollment, and learning workflows.",
    highlights: [
      "Built backend services and APIs with Django and Django REST Framework.",
      "Implemented optimized Django ORM queries, unit tests, and contract tests.",
      "Developed full-stack features using Django templates and React.",
      "Integrated YouTube API and Odoo for automated course data synchronization.",
    ],
    technologies: [
      "Django",
      "Django REST Framework",
      "React",
      "Docker",
      "Ansible",
      "YouTube API",
      "Odoo",
    ],
  },
  {
    name: "Neusler",
    context: "Publishing Platform, Neumeral Technologies",
    description:
      "A Django and Wagtail publishing product improved through dependency upgrades, API work, and CMS enhancements.",
    highlights: [
      "Refactored a legacy Django and Wagtail codebase.",
      "Implemented API endpoints and backend models for publishing workflows.",
      "Optimized database queries and caching strategies for better platform performance.",
      "Fixed CMS bugs and built custom content management functionality.",
    ],
    technologies: ["Django", "Wagtail", "REST APIs", "Caching", "PostgreSQL"],
  },
  {
    name: "GitAI",
    context: "Commit Message Generator",
    description:
      "A FastAPI application that generates structured Git commit messages using LLM-powered prompt pipelines.",
    highlights: [
      "Used GitPython to extract staged diffs for LLM processing.",
      "Built LangChain prompt workflows for commit message generation.",
      "Added persistence with SQLAlchemy, PostgreSQL, and SQLite support.",
      "Containerized the application with Docker and Docker Compose.",
    ],
    technologies: [
      "FastAPI",
      "LangChain",
      "GitPython",
      "SQLAlchemy",
      "PostgreSQL",
      "SQLite",
      "Docker",
    ],
  },
];
