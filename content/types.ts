export type CourseModule = { title: string; description: string };
export type WhyChooseReason = { icon: string; title: string; text: string };
export type WhyChooseContent = { title: string; intro: string; reasons: WhyChooseReason[] };

export type Course = {
  slug: string;
  name: string;
  cardTitle: string;
  title: string;
  description: string;
  keywords: string[];
  heroText: string;
  overview: string;
  image: string;
  logos: string[];
  modules: CourseModule[];
  whyChooseUs: WhyChooseContent;
  duration: string;
  outcome: string;
};
