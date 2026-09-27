import type { FaqItem } from "@/components/Faq";

export const homeFaqs: FaqItem[] = [
  { question: "Who can join EduWrap courses?", answer: "Anyone who wants to learn can join. Our courses are for students, graduates, working professionals, and beginners. You can pick a course based on what you want to learn." },
  { question: "Do I need to know coding before joining?", answer: "No. You do not need coding for all courses. Some courses are made for beginners, so you can start without any coding background." },
  { question: "Will I work on real projects?", answer: "Yes. You will get projects and practice work during the course. This gives you a chance to use the skills you learn instead of only reading about them." },
  { question: "Does EduWrap help with jobs?", answer: "Yes. We provide job assistance after and during your training. We can help you work on your resume and prepare for interviews." },
  { question: "Can I learn from home?", answer: "Yes. We offer online learning for students who want to study from home. You can attend your classes without travelling to a training centre." },
  { question: "Will I get a certificate?", answer: "Yes. You will receive a certificate after finishing your course. You can use it with your resume when you apply for jobs or internships." },
];

export const aboutFaqs: FaqItem[] = [
  { question: "What is EduWrap's mission?", answer: "EduWrap's mission is to bridge the gap between education and industry through practical training, expert mentorship, and career-focused learning experiences." },
  { question: "Who are the trainers at EduWrap?", answer: "Our programs are led by experienced trainers with practical knowledge of the tools, workflows, and expectations relevant to their industries." },
  { question: "How does EduWrap support individual learners?", answer: "Small batch sizes, doubt-solving sessions, practical feedback, and ongoing learning support give every learner more opportunities to ask questions and improve." },
  { question: "What kind of learning approach does EduWrap follow?", answer: "We use a project-based approach that combines essential concepts with guided exercises, real-world tools, practical assignments, and portfolio-focused projects." },
  { question: "Does EduWrap update its course curriculum?", answer: "Yes. Course content is reviewed and updated to reflect changing technologies, industry tools, and the skills employers expect from candidates." },
  { question: "Where is EduWrap located?", answer: "EduWrap is located at SCO 51, 2nd Floor, Sector 11, Panchkula, Haryana 134109. You can contact our team before visiting for guidance or a counseling session." },
];

export const courseFaqsBySlug: Record<string, FaqItem[]> = {
  "digital-marketing": [
    { question: "Do I need marketing experience to join this course?", answer: "No. The course starts with digital marketing fundamentals before moving into SEO, paid advertising, content, email marketing, and analytics." },
    { question: "Which digital marketing tools will I learn?", answer: "You will use tools for Google Ads, Meta Ads, Google Analytics, Tag Manager, Search Console, email campaigns, keyword research, and reporting." },
    { question: "Will I run real marketing campaigns?", answer: "You will complete practical campaign exercises and an industry-relevant project covering planning, execution, optimization, and reporting." },
    { question: "What roles can I pursue after the course?", answer: "The program prepares you for roles such as digital marketing executive, SEO specialist, social media marketer, and paid ads associate." },
  ],
  "artificial-intelligence-machine-learning": [
    { question: "Do I need coding experience for the Artificial Intelligence & Machine Learning course?", answer: "No prior coding experience is required for the foundational modules. Technical concepts and integrations are introduced gradually." },
    { question: "Which AI tools are covered?", answer: "The curriculum includes ChatGPT, Claude, Google AI Studio, and N8n, along with prompt engineering and workflow automation." },
    { question: "What projects will I build?", answer: "Projects may include content systems, business automations, chatbots, summarization tools, and AI-powered workflows." },
    { question: "What career paths can this course support?", answer: "The skills support roles involving AI automation, prompt engineering, AI-assisted content, product operations, and generative AI implementation." },
  ],
  "data-analytics": [
    { question: "Is the Data Analytics course suitable for beginners?", answer: "Yes. The program starts with spreadsheets and data concepts before progressing to SQL, Python, visualization, and dashboards." },
    { question: "Which analytics tools will I learn?", answer: "You will learn Excel, SQL, Python, Pandas, NumPy, Matplotlib, and Power BI through guided exercises and projects." },
    { question: "Do I need advanced mathematics?", answer: "No advanced mathematics is required to begin. Relevant statistical concepts are explained during the program." },
    { question: "Will I create a data analytics portfolio?", answer: "Yes. You will complete an end-to-end analytics project and build dashboards and reports for your portfolio." },
  ],
  "web-development": [
    { question: "Can I join without coding experience?", answer: "Yes. You will start with HTML, CSS, and JavaScript before learning React, backend development, databases, and deployment." },
    { question: "Which web technologies are taught?", answer: "The course covers HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, Git, APIs, and authentication." },
    { question: "Will I build and deploy complete websites?", answer: "Yes. You will build responsive frontend projects and full-stack applications, then deploy and present them in your portfolio." },
    { question: "What jobs can I apply for?", answer: "Depending on your skills and portfolio, you can pursue junior frontend, backend, full-stack, React, or Node.js roles." },
  ],
  "app-development": [
    { question: "Will I learn Android and iOS development?", answer: "Yes. The program focuses on cross-platform development so you can build apps for both Android and iOS." },
    { question: "Does the course use Flutter or React Native?", answer: "The applicable track uses a modern cross-platform framework such as Flutter or React Native. Confirm the current batch curriculum before enrollment." },
    { question: "Will I learn backend and Firebase integration?", answer: "Yes. You will work with authentication, APIs, databases, notifications, and real-time features." },
    { question: "Will I learn how to publish an app?", answer: "The deployment module covers app preparation, testing, release builds, and the key steps for publishing to app stores." },
  ],
  "autocad-sketchup": [
    { question: "Who should join this course?", answer: "It suits learners interested in architecture, interior design, civil engineering, product design, drafting, or 3D visualization." },
    { question: "Do I need previous design software experience?", answer: "No. The course begins with drawing and modeling fundamentals before professional drafting, materials, lighting, and rendering." },
    { question: "Will I learn 2D drafting and 3D modeling?", answer: "Yes. AutoCAD covers technical drafting and 3D fundamentals, while SketchUp focuses on modeling and visualization." },
    { question: "Will I create a design portfolio?", answer: "Yes. You will complete practical projects that demonstrate your drafting, modeling, and presentation skills." },
  ],
  "cyber-security": [
    { question: "Can beginners join the Cyber Security course?", answer: "Yes. It starts with networking, operating systems, and security principles before ethical hacking and security operations." },
    { question: "Does the course include practical labs?", answer: "Yes. Authorized labs cover reconnaissance, vulnerability assessment, penetration testing, incident response, and reporting." },
    { question: "Which security tools will I learn?", answer: "The curriculum introduces Kali Linux, Metasploit, Splunk, network scanners, and web security testing utilities." },
    { question: "Does the course prepare me for certifications?", answer: "It builds foundations relevant to entry-level security certifications. Certification exams and fees are separate unless explicitly stated." },
  ],
  "tally-accounting": [
    { question: "Do I need an accounting background?", answer: "No. The course starts with accounting fundamentals before TallyPrime, taxation, payroll, and reporting." },
    { question: "Will I learn GST filing and compliance?", answer: "Yes. You will learn GST concepts, input tax credit, returns, e-invoicing, and practical compliance workflows." },
    { question: "Which accounting tools are covered?", answer: "The program focuses on TallyPrime and introduces relevant workflows in Excel and digital accounting tools such as Zoho Books." },
    { question: "What jobs can I pursue?", answer: "You can prepare for roles such as accounts assistant, Tally operator, billing executive, junior accountant, or GST support executive." },
  ],
  "basic-computer-course": [
    { question: "Is this course suitable for complete beginners?", answer: "Yes. It begins with computer fundamentals and file management before office applications and internet skills." },
    { question: "Which Microsoft Office apps will I learn?", answer: "You will receive practical training in Word, Excel, and PowerPoint, including documents, formulas, charts, and presentations." },
    { question: "Are the classes practical or theory-based?", answer: "The course is primarily practical, with exercises in documents, data, presentations, email, and file organization." },
    { question: "How will this course help my career?", answer: "It builds essential digital skills for office work, administration, data entry, customer support, further study, and productivity." },
  ],
};

export function getCourseFaqs(slug: string): FaqItem[] {
  return courseFaqsBySlug[slug] ?? [];
}
