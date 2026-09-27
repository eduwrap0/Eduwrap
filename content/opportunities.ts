export type OpportunityPageData = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  heroText: string;
  sectionTitle: string;
  intro: string;
  icon: string;
  highlightTitle: string;
  highlightText: string;
  benefits: string[];
  steps: { title: string; text: string }[];
  ctaTitle: string;
  ctaText: string;
};

export const opportunities: OpportunityPageData[] = [
  {
    slug: "careers",
    title: "Careers at EduWrap",
    metaTitle: "Careers at EduWrap | Join Our Education Team",
    description: "Explore career opportunities at EduWrap and help learners build practical, industry-ready skills.",
    heroText: "Build your career while helping learners transform theirs.",
    sectionTitle: "Do Meaningful Work in Education",
    intro: "Join a team focused on practical learning, thoughtful mentorship, and real student outcomes. We welcome people who are curious, dependable, and excited to keep growing.",
    icon: "briefcase",
    highlightTitle: "Grow With Purpose",
    highlightText: "Contribute your skills in training, counseling, marketing, operations, technology, or learner support.",
    benefits: ["A collaborative, learning-focused culture", "Opportunities to create measurable student impact", "Room to develop your professional skills"],
    steps: [
      { title: "Share Your Profile", text: "Send us your resume, area of interest, and a short introduction." },
      { title: "Profile Review", text: "Our team reviews your experience against current and upcoming openings." },
      { title: "Meet the Team", text: "Shortlisted candidates are contacted for the relevant interview process." },
    ],
    ctaTitle: "Interested in Joining EduWrap?",
    ctaText: "Tell us about your experience and the kind of role you are looking for.",
  },
  {
    slug: "blog-as-guest",
    title: "Blog as a Guest",
    metaTitle: "Write for EduWrap | Guest Blog Contributions",
    description: "Contribute an original guest article to EduWrap and share practical knowledge with our learner community.",
    heroText: "Share useful knowledge, fresh ideas, and practical industry experience with our learners.",
    sectionTitle: "Write Content That Helps People Grow",
    intro: "We welcome thoughtful guest contributions from educators, working professionals, founders, and subject-matter experts. Articles should be original, accurate, practical, and genuinely useful to learners.",
    icon: "pencil",
    highlightTitle: "Share Your Expertise",
    highlightText: "Contribute tutorials, career insights, industry explainers, case studies, or practical learning guides.",
    benefits: ["Reach a career-focused learner community", "Receive a credited author profile when approved", "Help simplify complex topics through experience"],
    steps: [
      { title: "Pitch Your Topic", text: "Send a proposed title, short outline, and details about your expertise." },
      { title: "Editorial Review", text: "We review relevance, originality, quality, and fit for the EduWrap audience." },
      { title: "Write and Publish", text: "Approved contributors receive submission guidance before final editing and publication." },
    ],
    ctaTitle: "Have a Valuable Story or Idea?",
    ctaText: "Send us your guest-post pitch and a brief author introduction.",
  },
  {
    slug: "refer-and-earn",
    title: "Refer and Earn",
    metaTitle: "Refer and Earn | EduWrap Referral Program",
    description: "Refer learners to EduWrap programs and learn how eligible referral rewards work.",
    heroText: "Help someone discover the right skills and become eligible for referral rewards.",
    sectionTitle: "Share an Opportunity to Learn",
    intro: "Know someone looking to build practical career skills? Introduce them to EduWrap. Eligible rewards, timelines, and conditions are confirmed by our team for each active referral offer.",
    icon: "gift",
    highlightTitle: "Simple and Transparent",
    highlightText: "Share a genuine referral, let our counselors guide the learner, and receive updates from our team.",
    benefits: ["Refer friends, colleagues, or family", "Personal course guidance for every referral", "Rewards on eligible successful enrollments"],
    steps: [
      { title: "Submit a Referral", text: "Share your details and the prospective learner's information with permission." },
      { title: "Learner Counseling", text: "Our team helps the referred learner evaluate the right program." },
      { title: "Eligible Reward", text: "If the referral meets the active offer terms, our team confirms the applicable reward." },
    ],
    ctaTitle: "Know Someone Ready to Upskill?",
    ctaText: "Contact our team to check the current referral offer and submit a referral.",
  },
  {
    slug: "franchise-partner",
    title: "Become a Franchise Partner",
    metaTitle: "EduWrap Franchise Partnership | Start an Education Center",
    description: "Explore an EduWrap franchise partnership and bring practical, career-focused training to your community.",
    heroText: "Build a local education business backed by EduWrap's career-focused learning approach.",
    sectionTitle: "Create Learning Impact in Your City",
    intro: "We are open to conversations with committed entrepreneurs who understand their local market and share our focus on learner outcomes, quality delivery, and responsible growth.",
    icon: "handshake-o",
    highlightTitle: "Build With EduWrap",
    highlightText: "Explore brand, program, training, marketing, and operational guidance through a structured partnership discussion.",
    benefits: ["Access to an established education brand", "Career-focused program portfolio", "Guidance for launch and local operations"],
    steps: [
      { title: "Initial Enquiry", text: "Tell us about your location, experience, investment readiness, and business goals." },
      { title: "Market Discussion", text: "We assess alignment, local opportunity, operational expectations, and feasibility." },
      { title: "Partnership Plan", text: "Suitable applicants receive details on the model, requirements, terms, and next steps." },
    ],
    ctaTitle: "Interested in an EduWrap Franchise?",
    ctaText: "Start a conversation with our partnerships team. All partnerships are subject to review and written agreement.",
  },
  {
    slug: "work-as-freelancer",
    title: "Work as a Freelancer",
    metaTitle: "Freelance With EduWrap | Project Opportunities",
    description: "Connect with EduWrap for suitable freelance opportunities in education, content, design, marketing, and technology.",
    heroText: "Bring your specialist skills to meaningful education and digital projects.",
    sectionTitle: "Collaborate on the Right Projects",
    intro: "EduWrap works with freelancers when a project needs focused expertise. We value clear communication, dependable delivery, original work, and a strong understanding of the agreed scope.",
    icon: "laptop",
    highlightTitle: "Flexible Collaboration",
    highlightText: "Contribute to suitable projects in content, design, development, marketing, video, training, or related fields.",
    benefits: ["Project-based professional opportunities", "Clear scope and delivery expectations", "Potential for repeat collaboration"],
    steps: [
      { title: "Share Your Portfolio", text: "Send examples of relevant work, your services, availability, and expected rates." },
      { title: "Project Match", text: "We contact you when your expertise matches an approved project requirement." },
      { title: "Agree and Deliver", text: "Scope, timeline, payment, ownership, and deliverables are agreed before work begins." },
    ],
    ctaTitle: "Want to Freelance With EduWrap?",
    ctaText: "Introduce yourself and share a link to your strongest relevant work.",
  },
];

export const opportunityBySlug = (slug: string) => opportunities.find((item) => item.slug === slug);
