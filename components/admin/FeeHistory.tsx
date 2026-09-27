"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FeePaymentModal } from "@/components/admin/FeePaymentModal";
import { PrintReceiptButton } from "@/components/admin/PrintReceiptButton";
import { confirmDestructive } from "@/lib/confirm-dialog";
import type { FeePagination, FeePaymentRecord, StudentFeeSearchResult } from "@/types/fees";

interface HistoryResponse {
  message: string;
  data?: {
    payments: FeePaymentRecord[];
    totalPaid: number;
    balance: number | null;
    pagination: FeePagination;
  };
}

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function modeLabel(mode: FeePaymentRecord["paymentMode"]) {
  return mode === "upi" ? "UPI" : mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function FeeHistory({ studentId, className, allowSubmit = false, student }: { studentId: string; className: string; allowSubmit?: boolean; student?: StudentFeeSearchResult }) {
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [pagination, setPagination] = useState<FeePagination>({ page: 1, limit: 10, totalPayments: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}/fees?page=${page}&limit=10`, { cache: "no-store" });
      const result = await response.json() as HistoryResponse;
      if (!response.ok || !result.data) throw new Error(result.message);
      setPayments(result.data.payments);
      setTotalPaid(result.data.totalPaid);
      setBalance(result.data.balance);
      setPagination(result.data.pagination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load fee history.", { id: `fee-history-${studentId}` });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(1), 0); return () => window.clearTimeout(timer); }, [load]);

  async function deletePayment(payment: FeePaymentRecord) {
    const confirmed = await confirmDestructive(
      "Delete fee entry?",
      `${payment.receiptId} for ${payment.studentName} (${currency.format(payment.amount)}) will be permanently deleted. This cannot be undone.`,
      "Delete fee entry",
    );
    if (!confirmed) return;

    setDeletingId(payment.id);
    try {
      const response = await fetch(`/api/admin/fees/${payment.id}`, { method: "DELETE" });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Unable to delete fee entry.");
      toast.success(result.message || "Fee entry deleted.");
      await load(payments.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete fee entry.");
    } finally {
      setDeletingId(null);
    }
  }

  return <>
    {adding && student && <FeePaymentModal initialStudent={student} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(1); }} />}
    <section className={`${className} fee-history-panel`}>
      <header className="fee-history-header"><div><span><i className="fa fa-inr" /></span><div><h2>Fee / payment history</h2><p>Verified payments recorded by the administration.</p></div></div>{allowSubmit && student && <button type="button" onClick={() => setAdding(true)}><i className="fa fa-plus" /> Submit fee</button>}</header>
      <div className="fee-history-summary"><div><small>Total amount paid</small><strong>{currency.format(totalPaid)}</strong></div><div><small>Total transactions</small><strong>{pagination.totalPayments}</strong></div>{balance !== null && <div><small>Remaining balance</small><strong>{currency.format(balance)}</strong></div>}</div>
      {loading ? <div className="fee-history-loading"><span /><span /><span /></div> : payments.length === 0 ? <div className="fee-history-empty"><span><i className="fa fa-file-text-o" /></span><strong>No fee payments recorded</strong><small>Payment history will appear here after an administrator submits a fee.</small></div> : <div className="table-responsive"><table className="table app-table fee-history-table align-middle mb-0"><thead><tr><th>Receipt ID</th><th>Payment date</th><th>Amount paid</th><th>Mode</th><th>Recorded by</th><th>Status</th><th>{allowSubmit ? "Actions" : "Receipt"}</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><code>{payment.receiptId}</code></td><td>{new Date(`${payment.paymentDate}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</td><td><strong>{currency.format(payment.amount)}</strong></td><td><span className={`fee-mode-badge mode-${payment.paymentMode}`}>{modeLabel(payment.paymentMode)}</span></td><td>{payment.recordedBy}</td><td><span className="fee-status-paid"><i />Paid</span></td><td><div className="fee-row-actions"><PrintReceiptButton paymentId={payment.id} receiptId={payment.receiptId} />{allowSubmit && <button type="button" className="fee-delete-button" disabled={deletingId !== null} onClick={() => void deletePayment(payment)} aria-label={`Delete fee entry ${payment.receiptId}`} title="Delete fee entry"><i className={`fa fa-${deletingId === payment.id ? "spinner fa-spin" : "trash"}`} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      {pagination.totalPages > 1 && <footer className="fee-history-pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div><button type="button" disabled={!pagination.hasPreviousPage || loading} onClick={() => void load(pagination.page - 1)}><i className="fa fa-chevron-left" /> Previous</button><button type="button" disabled={!pagination.hasNextPage || loading} onClick={() => void load(pagination.page + 1)}>Next <i className="fa fa-chevron-right" /></button></div></footer>}
    </section>
  </>;
}
