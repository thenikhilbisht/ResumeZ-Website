import { ResumeContent, Plan } from '../types';

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Career Tier',
    monthly_credits: 10,
    price_inr: 0,
    features: [
      '10 AI Credits per month',
      'AI ATS Resume Analyzer',
      'Interactive Resume Builder',
      'Public GitHub Portfolio Analyzer',
      'LeetCode Readiness Insights',
      'Standard PDF Export',
    ],
    is_active: true,
  },
  {
    id: 'pro',
    name: 'Pro Career Accelerator',
    monthly_credits: 50,
    price_inr: 499,
    popular: true,
    features: [
      '50 AI Credits per month',
      'Deep ATS Job Tailoring & Match Scoring',
      'Unlimited Bullet Point AI Rewrites (Google XYZ Formula)',
      'Advanced Multi-Repo GitHub Code Quality Insights',
      'Targeted FAANG LeetCode Practice Roadmaps',
      'Priority AI Processing & Zero Latency',
      'Custom Templates & Unbranded Exports',
    ],
    is_active: true,
  },
  {
    id: 'unlimited',
    name: 'Executive & Recruiter',
    monthly_credits: 200,
    price_inr: 1299,
    features: [
      '200 AI Credits per month',
      'Multi-Resume Variant Manager',
      'Target Recruiter Keyword Extraction Engine',
      'Interview Readiness Mock Questions Generator',
      'Direct Support & Custom Prompt Tuning',
    ],
    is_active: true,
  },
];

export const INITIAL_RESUME_CONTENT: ResumeContent = {
  meta: {
    title: 'Software Engineer Resume',
    template_id: 'modern_clean',
    typography: {
      font_family: 'inter',
      font_size_pt: 10,
      line_spacing: 1.4,
    },
    margins_mm: {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15,
    },
    accent_color: '#0284c7', // Sky-600
  },
  personal_info: {
    full_name: 'Alex Rivera',
    headline: 'Senior Full-Stack Engineer | Distributed Systems & React',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    website_url: 'https://alexrivera.dev',
    linkedin_url: 'https://linkedin.com/in/alexrivera-dev',
    github_url: 'https://github.com/alexrivera',
  },
  summary: {
    enabled: true,
    body: 'Product-focused Senior Full-Stack Engineer with 5+ years of experience architecting high-throughput cloud microservices and responsive web applications. Proven track record of reducing system latency by 35% and mentoring engineering squads in clean architecture and automated testing.',
  },
  experience: [
    {
      id: 'exp-1',
      job_title: 'Senior Software Engineer',
      company_name: 'Apex Cloud Solutions',
      location: 'San Francisco, CA',
      start_date: '2022-03',
      end_date: 'Present',
      is_current: true,
      bullet_points: [
        'Spearheaded the migration of monolithic checkout service to Node.js / Go event-driven microservices, handling 15,000+ RPS with 99.99% uptime.',
        'Architected real-time WebSocket notifications engine serving 250k daily active users with sub-50ms message delivery latency.',
        'Refactored legacy React frontend to Next.js with Server Components, improving Core Web Vitals (LCP from 3.2s to 1.1s) and lifting conversion by 14%.',
        'Implemented end-to-end CI/CD test pipelines in GitHub Actions, slashing deploy cycle time from 45 minutes to 8 minutes.',
      ],
    },
    {
      id: 'exp-2',
      job_title: 'Full-Stack Developer',
      company_name: 'Nova Dynamics',
      location: 'Austin, TX',
      start_date: '2020-01',
      end_date: '2022-02',
      is_current: false,
      bullet_points: [
        'Built automated analytics dashboard using React, Tailwind CSS, and D3.js utilized by 40+ enterprise client organizations.',
        'Designed secure PostgreSQL schemas with Row-Level Security and optimized queries to reduce database CPU spikes by 40%.',
        'Integrated Stripe Billing & tiered subscriptions for SaaS product generating $1.2M in annual recurring revenue.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      location: 'Berkeley, CA',
      start_date: '2016-08',
      end_date: '2020-05',
      gpa: '3.82',
      highlights: ['Dean’s Honors List (6 Semesters)', 'Teaching Assistant for CS61B: Data Structures & Algorithms'],
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category_name: 'Languages & Core',
      skills_list: ['TypeScript', 'JavaScript (ESNext)', 'Go', 'Python', 'SQL', 'HTML5/CSS3'],
    },
    {
      id: 'skill-2',
      category_name: 'Frameworks & Libraries',
      skills_list: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'GraphQL', 'Zustand', 'Prisma / Drizzle'],
    },
    {
      id: 'skill-3',
      category_name: 'Cloud & Infrastructure',
      skills_list: ['PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS (ECS, S3, Lambda)', 'Supabase', 'CI/CD Pipelines'],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'DevPulse — Real-Time Developer Activity Monitor',
      subtitle: 'Open Source Developer Tool',
      live_url: 'https://devpulse.io',
      github_url: 'https://github.com/alexrivera/devpulse',
      tech_stack: ['TypeScript', 'React', 'Go', 'Redis', 'Tailwind CSS'],
      bullet_points: [
        'Engineered an open-source dashboard aggregating GitHub PR reviews, issue velocity, and build statuses across 50+ repositories.',
        'Acquired 1,200+ GitHub Stars and 3,000 monthly active developers worldwide.',
      ],
    },
    {
      id: 'proj-2',
      title: 'EchoStream — Distributed Audio Transcoding Pipeline',
      subtitle: 'Cloud Microservice',
      github_url: 'https://github.com/alexrivera/echostream',
      tech_stack: ['Go', 'Docker', 'AWS SQS', 'FFmpeg', 'PostgreSQL'],
      bullet_points: [
        'Developed a concurrent distributed worker pool processing 500+ audio transcoding jobs concurrently with zero dropped packets.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'AWS Certified Solutions Architect – Associate',
      issuing_organization: 'Amazon Web Services',
      issue_date: '2023-04',
      credential_url: 'https://aws.amazon.com/verification',
    },
  ],
};

export const SAMPLE_JOB_DESCRIPTIONS = [
  {
    id: 'ai-engineer',
    title: 'AI Engineer / Machine Learning & GenAI Specialist',
    roleCategory: 'AI / Machine Learning',
    company: 'NeuralFlow AI Labs',
    badge: 'AI Engineer',
    text: `We are looking for an AI Engineer / Machine Learning Specialist to architect and deploy generative AI solutions, agentic workflows, and LLM-powered enterprise features.

Key Responsibilities:
- Build and optimize Retrieval-Augmented Generation (RAG) pipelines and multi-agent reasoning architectures using Gemini, Claude, and OpenAI APIs.
- Fine-tune and evaluate open-source foundation models (Llama, Mistral) for custom enterprise tasks using LoRA/QLoRA and PEFT techniques.
- Design high-throughput vector database search systems (Pinecone, Weaviate, Qdrant, ChromaDB) with hybrid semantic reranking.
- Implement guardrails, prompt evaluation frameworks, and latency optimization (vLLM, Ollama, TensorRT-LLM).
- Collaborate with full-stack teams to expose scalable AI microservices via FastAPI / Node.js and gRPC endpoints.

Requirements & Skills:
- 3+ years in AI/ML software development with strong proficiency in Python, PyTorch, LangChain, LlamaIndex, or Hugging Face.
- Hands-on experience with Vector Embeddings, RAG architectures, prompt engineering, and LLM fine-tuning.
- Familiarity with MLOps pipelines (Docker, Kubernetes, MLflow, Weights & Biases, Triton Inference Server).
- Solid grasp of computer science fundamentals: data structures, distributed systems, and API design.`,
  },
  {
    id: 'frontend-web',
    title: 'Frontend Web Developer (React, Next.js, TypeScript)',
    roleCategory: 'Frontend Development',
    company: 'PixelCraft Digital',
    badge: 'Frontend Web Dev',
    text: `We are looking for a skilled Frontend Web Developer to build high-performance, accessible, and pixel-perfect web applications using modern React and TypeScript.

Key Responsibilities:
- Develop modular, reusable UI components using React 19, Next.js (App Router, Server Components), and TypeScript.
- Build responsive, mobile-first styling systems with Tailwind CSS, CSS Grid/Flexbox, and smooth animation libraries (Motion/Framer).
- Optimize Core Web Vitals (LCP, FID/INP, CLS) to ensure sub-second page loads, minimal layout shifts, and high SEO scores.
- Integrate RESTful and GraphQL backend APIs with efficient client-side caching (TanStack React Query, SWR, Zustand).
- Write comprehensive unit and component tests with Vitest, Jest, and React Testing Library.

Requirements & Skills:
- 3+ years of frontend web engineering experience with React, TypeScript, HTML5, and CSS3/Tailwind CSS.
- Strong mastery of modern JavaScript (ES6+), async programming, DOM manipulation, and responsive web design.
- Experience with Next.js, state management (Redux Toolkit, Zustand, Context API), and bundlers (Vite, Webpack).
- Deep understanding of web accessibility (WCAG AA), cross-browser compatibility, and performance profiling.`,
  },
  {
    id: 'fullstack-dev',
    title: 'Senior Full-Stack Developer (React, Node.js, TypeScript, PostgreSQL)',
    roleCategory: 'Full-Stack Development',
    company: 'Fintech Scaleup',
    badge: 'Full-Stack Developer',
    text: `We are looking for a Senior Full-Stack Developer to lead frontend architecture and backend API integrations for our core payments and financial transactions platform.

Key Responsibilities:
- Design, build, and maintain high-performance React web applications using modern TypeScript and modular state management.
- Collaborate with cross-functional squads to design RESTful & GraphQL APIs with high reliability and sub-100ms response times.
- Model scalable database schemas and write optimized queries/indexes in PostgreSQL and Redis.
- Improve Core Web Vitals, accessibility (WCAG AA), and end-to-end performance across desktop and mobile devices.
- Mentor junior engineers, conduct code reviews, and champion clean architecture and testing standards.

Requirements & Skills:
- 4+ years of professional software engineering experience with React, TypeScript, and modern CSS/Tailwind.
- Strong knowledge of backend technologies (Node.js, Express, Go, or Python) and relational databases (PostgreSQL).
- Demonstrated experience with CI/CD pipelines, Docker, automated unit & integration testing.
- Strong problem-solving skills, algorithmic proficiency, and familiarity with distributed microservice patterns.`,
  },
  {
    id: 'backend-engineer',
    title: 'Backend / Cloud Platform Engineer (Go, Node.js, Distributed Systems)',
    roleCategory: 'Backend Development',
    company: 'NextGen Cloud AI',
    badge: 'Backend Engineer',
    text: `Join our Cloud Platform Engineering team to scale our microservices infrastructure, data pipelines, and developer tooling.

Responsibilities:
- Build fault-tolerant microservices in Go and Node.js/TypeScript running on Kubernetes and AWS cloud infrastructure.
- Design real-time data pipelines using Kafka, RabbitMQ, Redis streams, and PostgreSQL with strict SLA guarantees.
- Optimize database queries, connection pooling, indexing, and multi-tier caching layers for 50k+ QPS workloads.
- Secure infrastructure and data privacy using Row Level Security (RLS), role-based access control (RBAC), and JWT authentication.
- Implement robust telemetry, tracing, and health monitoring (Prometheus, Grafana, OpenTelemetry).

Qualifications:
- 3+ years experience building backend microservices in Go, Node.js, Python, or Java.
- Deep understanding of database internals (PostgreSQL indexes, transactions, locking, partitioning).
- Experience with containerization (Docker, Kubernetes) and AWS/GCP cloud infrastructure.
- Strong knowledge of distributed systems, message queues, and API protocol design (REST, gRPC, WebSockets).`,
  },
  {
    id: 'devops-cloud',
    title: 'DevOps & Cloud Infrastructure Engineer (AWS, Kubernetes, Terraform)',
    roleCategory: 'DevOps & Cloud',
    company: 'SkyScale Infrastructure',
    badge: 'DevOps / Cloud',
    text: `We are looking for a DevOps & Cloud Engineer to design, automate, and maintain our multi-region cloud infrastructure and continuous deployment pipelines.

Key Responsibilities:
- Author and maintain Infrastructure as Code (IaC) with Terraform, CloudFormation, and Ansible across AWS/GCP.
- Manage Kubernetes (EKS/GKE) clusters, Helm charts, ingress controllers, and service meshes (Istio).
- Build and maintain automated CI/CD workflows using GitHub Actions, GitLab CI, or ArgoCD.
- Implement security best practices: VPC peering, IAM least-privilege policies, secrets management (Vault, AWS Secrets Manager), and vulnerability scanning.
- Set up proactive alerting, APM dashboards, and incident response automation with Datadog, Prometheus, and Grafana.

Requirements:
- 3+ years experience in DevOps, SRE, or Cloud Infrastructure roles.
- Expert-level knowledge of AWS or GCP cloud services and Linux server administration.
- Strong hands-on experience with Docker containerization, Kubernetes orchestration, and Terraform.
- Scripting proficiency in Bash, Python, or Go for infrastructure automation.`,
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist & Machine Learning Engineer (Python, SQL, Predictive Analytics)',
    roleCategory: 'Data Science',
    company: 'DataVantage Analytics',
    badge: 'Data Science',
    text: `We are seeking a Data Scientist to build predictive models, extract actionable business intelligence, and deploy production ML algorithms.

Key Responsibilities:
- Develop supervised and unsupervised machine learning models (XGBoost, Random Forest, Scikit-Learn, LightGBM, Neural Networks) for customer forecasting and churn prediction.
- Perform exploratory data analysis (EDA), statistical hypothesis testing, and feature engineering on massive multi-terabyte datasets.
- Write high-performance SQL queries, data transformations, and ETL/ELT pipelines in Snowflake, BigQuery, or dbt.
- Build interactive data visualization dashboards in Tableau, PowerBI, or Streamlit for stakeholder reporting.
- Deploy models as REST microservice APIs with FastAPI, Docker, and MLflow tracking.

Requirements:
- 3+ years of experience in Data Science, Predictive Modeling, or Quantitative Analytics.
- Advanced proficiency in Python (NumPy, Pandas, Scikit-Learn, Matplotlib/Seaborn) and SQL.
- Strong mathematical background in statistics, probability, regression, and optimization algorithms.`,
  },
  {
    id: 'mobile-app',
    title: 'Mobile App Developer (React Native, Flutter, iOS & Android)',
    roleCategory: 'Mobile Development',
    company: 'AppVibe Studios',
    badge: 'Mobile App Dev',
    text: `We are looking for a talented Mobile App Developer to build beautiful, fast, and intuitive cross-platform mobile apps for millions of users worldwide.

Key Responsibilities:
- Build and maintain high-quality cross-platform mobile applications using React Native or Flutter.
- Integrate native device modules: camera, push notifications, biometrics, offline SQLite storage, and deep linking.
- Connect mobile interfaces to GraphQL and RESTful backend APIs with offline sync capabilities.
- Manage App Store (iOS) and Google Play Store (Android) release pipelines, certificates, and beta testing (TestFlight).
- Optimize app launch performance, memory footprints, 60fps UI animations, and battery efficiency.

Requirements:
- 3+ years of mobile application development experience with React Native, Flutter, Swift, or Kotlin.
- Experience publishing and maintaining live apps on the Apple App Store and Google Play Store.
- Strong understanding of mobile UI/UX guidelines (Material 3, iOS Human Interface Guidelines).`,
  },
  {
    id: 'qa-automation',
    title: 'QA Automation Engineer (Cypress, Playwright, Selenium, API Testing)',
    roleCategory: 'Quality Assurance',
    company: 'VerifyIQ Quality Labs',
    badge: 'QA Automation',
    text: `We are looking for a QA Automation Engineer to ensure top-tier product reliability and automate end-to-end testing across web and API suites.

Key Responsibilities:
- Design, develop, and execute automated test frameworks using Playwright, Cypress, Selenium, and TypeScript.
- Build automated API integration tests using Postman, Newman, and Jest for backend microservices.
- Integrate automated regression suites into CI/CD pipelines (GitHub Actions) for zero-defect production releases.
- Perform performance and load testing using k6, JMeter, or Locust to identify system bottlenecks.
- Collaborate with engineering and product squads to define test strategies, acceptance criteria, and edge cases.

Requirements:
- 3+ years experience in automated software testing and QA engineering.
- Strong coding skills in JavaScript/TypeScript or Python.
- Proven experience with Playwright, Cypress, or Selenium Webdriver and REST API testing.`,
  },
];
