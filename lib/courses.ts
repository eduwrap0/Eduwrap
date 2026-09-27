export const FACULTY_COURSES = [
  "Digital Marketing",
  "Cyber Security",
  "Artificial Intelligence & Machine Learning",
  "Data Analytics",
  "Full Stack Web Development",
  "Mobile App Development",
  "AutoCAD",
  "SketchUp",
  "Revit",
  "Tally & Accounting (TallyPrime + GST)",
  "SAP",
  "Video Editing",
  "Graphics Designing",
  "Basic Computer Course",
  "ADCAP course (Advanced Diploma in Computer Application & Programming)",
  "Java Script",
  "JAVA",
  "Python",
  "HTML",
  "CSS",
  "SQL",
  "PowerBI",
  "Tableau",
  "Applied AI",
  "Advanced Excel",
  "C | C++",
  "Spoken English",
  "MERN Stack",
  "Next.js",
  "Mathematics",
  "Physics",
  "Science",
] as const;

export type FacultyCourse = (typeof FACULTY_COURSES)[number];

export const STUDENT_COURSES = FACULTY_COURSES;

export type StudentCourse = (typeof STUDENT_COURSES)[number];

const COURSE_NAME_ALIASES: Record<string, FacultyCourse> = {
  "DCA": "Basic Computer Course",
  "Diploma in Computer Application (DCA)": "Basic Computer Course",
  "DCA (Diploma in Computer Applications)": "Basic Computer Course",
  "Generative AI (Gen AI)": "Artificial Intelligence & Machine Learning",
  "Machine Learning (ML)": "Artificial Intelligence & Machine Learning",
};

export function canonicalCourseName(course: string): string {
  const trimmed = course.trim();
  return COURSE_NAME_ALIASES[trimmed] || trimmed;
}

export function courseNameVariants(courses: string[]): string[] {
  const canonical = new Set(courses.map(canonicalCourseName));
  return [...new Set([
    ...canonical,
    ...Object.entries(COURSE_NAME_ALIASES).flatMap(([legacy, current]) => canonical.has(current) ? [legacy] : []),
  ])];
}
