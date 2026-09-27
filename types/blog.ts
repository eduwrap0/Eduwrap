export enum BlogStatus {
  Draft = "DRAFT",
  Published = "PUBLISHED",
}

export interface BlogCourseRecord {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  socialImage?: string;
  author: { id: string; name: string };
  courses: BlogCourseRecord[];
  status: BlogStatus;
  featuredOnHome: boolean;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BlogFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  socialImage: string;
  courseIds: string[];
  status: BlogStatus;
  featuredOnHome: boolean;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
}
