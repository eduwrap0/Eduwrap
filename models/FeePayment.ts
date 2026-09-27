import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export type PaymentMode = "cash" | "upi" | "online";

export interface IFeePayment {
  receiptId: string;
  student: Types.ObjectId;
  studentId: string;
  studentName: string;
  course?: string;
  courses?: string[];
  faculty?: Types.ObjectId;
  facultyName?: string;
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentMode;
  status: "paid";
  createdBy: Types.ObjectId;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FeePaymentDocument = HydratedDocument<IFeePayment>;

const feePaymentSchema = new Schema<IFeePayment>(
  {
    receiptId: { type: String, required: true, unique: true, immutable: true, trim: true, uppercase: true, maxlength: 40 },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true, index: true },
    studentId: { type: String, required: true, immutable: true, trim: true, uppercase: true, maxlength: 40 },
    studentName: { type: String, required: true, immutable: true, trim: true, maxlength: 100 },
    course: { type: String, immutable: true, trim: true, maxlength: 100, index: true },
    courses: [{ type: String, immutable: true, trim: true, maxlength: 100 }],
    faculty: { type: Schema.Types.ObjectId, ref: "User", immutable: true, index: true },
    facultyName: { type: String, immutable: true, trim: true, maxlength: 100 },
    paymentDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01, max: 100000000 },
    paymentMode: { type: String, required: true, enum: ["cash", "upi", "online"], index: true },
    status: { type: String, required: true, enum: ["paid"], default: "paid", immutable: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true, index: true },
    idempotencyKey: { type: String, required: true, unique: true, immutable: true, maxlength: 80, select: false },
  },
  { timestamps: true, versionKey: false },
);

feePaymentSchema.index({ student: 1, paymentDate: -1, createdAt: -1 });
feePaymentSchema.index({ paymentDate: -1, paymentMode: 1, createdAt: -1 });
feePaymentSchema.index({ studentName: 1, studentId: 1, createdAt: -1 });

export const FeePayment: Model<IFeePayment> = process.env.NODE_ENV === "development"
  ? mongoose.model<IFeePayment>("FeePayment", feePaymentSchema, undefined, { overwriteModels: true })
  : (mongoose.models.FeePayment as Model<IFeePayment> | undefined) || mongoose.model<IFeePayment>("FeePayment", feePaymentSchema);
