import type { PaymentMode } from "@/models/FeePayment";

export interface FeePaymentRecord {
  id: string;
  receiptId: string;
  studentId: string;
  studentName: string;
  course?: string;
  courses?: string[];
  facultyId?: string;
  facultyName?: string;
  studentObjectId: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  status: "paid";
  recordedBy: string;
  facultyNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeePagination {
  page: number;
  limit: number;
  totalPayments: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StudentFeeSearchResult {
  id: string;
  studentId: string;
  name: string;
  fatherName?: string;
  phone?: string;
  email: string;
  totalFee?: number;
  courses: string[];
  faculties: Array<{ id: string; name: string }>;
}
