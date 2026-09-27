"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FeePaymentModal } from "@/components/admin/FeePaymentModal";
import { PrintReceiptButton } from "@/components/admin/PrintReceiptButton";
import { ThemedDateField, ThemedSelect } from "@/components/admin/EnrollmentFields";
import { confirmDestructive } from "@/lib/confirm-dialog";
import type { FeePagination, FeePaymentRecord } from "@/types/fees";

interface FeeListResponse {
  message: string;
  data?: {
    payments: FeePaymentRecord[];
    totalAmount: number;
    selectedFaculty?: { id: string; name: string; assignedStudentCount: number };
    pagination: FeePagination;
  };
}

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function queryString(page: number, values: { search: string; paymentMode: string; facultyId: string; dateFrom: string; dateTo: string }) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (values.search) params.set("search", values.search);
  if (values.paymentMode !== "all") params.set("paymentMode", values.paymentMode);
  if (values.facultyId) params.set("facultyId", values.facultyId);
  if (values.dateFrom) params.set("dateFrom", values.dateFrom);
  if (values.dateTo) params.set("dateTo", values.dateTo);
  return params.toString();
}

function modeLabel(mode: FeePaymentRecord["paymentMode"]) {
  return mode === "upi" ? "UPI" : mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function FeeManager({ faculties = [], readOnly = false, endpoint = "/api/admin/fees", studentBasePath = "/admin/students" }: { faculties?: Array<{ id: string; name: string }>; readOnly?: boolean; endpoint?: string; studentBasePath?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const initialMode = searchParams.get("paymentMode");
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [pagination, setPagination] = useState<FeePagination>({ page: 1, limit: 20, totalPayments: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedFaculty, setSelectedFaculty] = useState<{ id: string; name: string; assignedStudentCount: number } | null>(null);
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [paymentMode, setPaymentMode] = useState(() => initialMode === "cash" || initialMode === "upi" || initialMode === "online" ? initialMode : "all");
  const [facultyId, setFacultyId] = useState(() => searchParams.get("facultyId") || "");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") || "");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const firstLoad = useRef(true);
  const initialPageRef = useRef(initialPage);
  const requestId = useRef(0);

  const load = useCallback(async (page = 1) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search, paymentMode, facultyId, dateFrom, dateTo });
      const response = await fetch(`${endpoint}?${params}`, { cache: "no-store" });
      const result = await response.json() as FeeListResponse;
      if (!response.ok || !result.data) throw new Error(result.message);
      if (currentRequest !== requestId.current) return;
      setPayments(result.data.payments);
      setPagination(result.data.pagination);
      setTotalAmount(result.data.totalAmount);
      setSelectedFaculty(result.data.selectedFaculty || null);
      const query = queryString(page, { search, paymentMode, facultyId, dateFrom, dateTo });
      window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
    } catch (error) {
      if (currentRequest === requestId.current) toast.error(error instanceof Error ? error.message : "Unable to load fee payments.", { id: "fee-list-error" });
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [search, paymentMode, facultyId, dateFrom, dateTo, pathname, endpoint]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const page = firstLoad.current ? initialPageRef.current : 1;
    firstLoad.current = false;
    const timer = window.setTimeout(() => void load(page), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setPaymentMode("all");
    setFacultyId("");
    setDateFrom("");
    setDateTo("");
  }

  async function deletePayment(payment: FeePaymentRecord) {
    const confirmed = await confirmDestructive(
      "Delete fee entry?",
      `${payment.receiptId} for ${payment.studentName} (${currency.format(payment.amount)}) will be permanently deleted. This cannot be undone.`,
      "Delete fee entry",
    );
    if (!confirmed) return;

    setDeletingId(payment.id);
    try {
      const response = await fetch(`${endpoint}/${payment.id}`, { method: "DELETE" });
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
    {!readOnly && adding && <FeePaymentModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(1); }} />}
    <section className={`fee-overview-grid ${readOnly ? "is-read-only" : ""}`}>
      <article><span><i className="fa fa-inr" /></span><div><small>{selectedFaculty ? `${selectedFaculty.name}'s student collection` : "Filtered amount received"}</small><strong>{currency.format(totalAmount)}</strong><p>{selectedFaculty ? `From ${selectedFaculty.assignedStudentCount} assigned student${selectedFaculty.assignedStudentCount === 1 ? "" : "s"}` : "Across the current search and filters"}</p></div></article>
      <article><span><i className="fa fa-file-text-o" /></span><div><small>Matching transactions</small><strong>{pagination.totalPayments}</strong><p>Securely recorded fee receipts</p></div></article>
      {!readOnly && <button type="button" onClick={() => setAdding(true)}><span><i className="fa fa-plus" /></span><div><strong>Submit student fee</strong><small>Record a new payment</small></div><i className="fa fa-arrow-right" /></button>}
    </section>

    <section className="app-card fee-manager-toolbar">
      <div className="fee-manager-search"><label htmlFor="fee-search" className="form-label">Search payments</label><div><i className="fa fa-search" /><input id="fee-search" className="form-control" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Student name, student ID, or receipt ID" /></div></div>
      <div className={`fee-manager-filters ${readOnly ? "is-read-only" : ""}`}>
        {!readOnly && <div><label className="form-label">Faculty collection</label><ThemedSelect ariaLabel="Faculty collection filter" value={facultyId} onChange={setFacultyId} placeholder="All faculty" options={faculties.map((faculty) => ({ value: faculty.id, label: faculty.name }))} searchable searchPlaceholder="Search faculty..." /></div>}
        <div><label className="form-label">Payment from</label><ThemedDateField ariaLabel="Payment from date" value={dateFrom} onChange={setDateFrom} max={dateTo || localToday()} /></div>
        <div><label className="form-label">Payment to</label><ThemedDateField ariaLabel="Payment to date" value={dateTo} onChange={setDateTo} max={localToday()} /></div>
        <div><label className="form-label">Payment mode</label><ThemedSelect ariaLabel="Payment mode filter" value={paymentMode} onChange={setPaymentMode} options={[{ value: "all", label: "All payment modes" }, { value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }, { value: "online", label: "Online" }]} /></div>
        <button type="button" onClick={clearFilters}><i className="fa fa-times" /> Clear filters</button>
      </div>
    </section>

    {selectedFaculty && <section className="fee-faculty-scope" aria-label="Selected faculty collection"><span><i className="fa fa-user" /></span><div><small>Viewing faculty collection</small><strong>{selectedFaculty.name}</strong><p>Receipt history for {selectedFaculty.assignedStudentCount} currently assigned student{selectedFaculty.assignedStudentCount === 1 ? "" : "s"}.</p></div><button type="button" onClick={() => setFacultyId("")}><i className="fa fa-times" /> Show all faculty</button></section>}

    <section className="app-card fee-transactions-panel">
      <header><div><span className="dashboard-section-label">Payment records</span><h2>{selectedFaculty ? `${selectedFaculty.name}'s receipt history` : "Fee transaction history"}</h2><p>{selectedFaculty ? "Payments from the students assigned to this faculty member." : "Newest payment records are shown first."}</p></div><span>{pagination.totalPayments} transactions</span></header>
      {loading ? <div className="fee-transaction-loading">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div> : payments.length === 0 ? <div className="app-empty"><i className="fa fa-inr" /><strong>No fee payments found</strong><span>{readOnly ? "Change the filters or wait for an administrator to record a payment." : "Change the filters or submit the first fee payment."}</span></div> : <div className="table-responsive"><table className="table app-table fee-table align-middle mb-0"><thead><tr><th>Receipt</th><th>Student</th><th>Course</th>{!readOnly && <th>Assigned faculty</th>}<th>Payment date</th><th>Amount</th><th>Mode</th><th>Status</th><th>{readOnly ? "Receipt" : "Actions"}</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><code>{payment.receiptId}</code></td><td><Link href={`${studentBasePath}/${payment.studentObjectId}`}><strong>{payment.studentName}</strong><small>{payment.studentId}</small></Link></td><td>{payment.course || "—"}</td>{!readOnly && <td><span className="fee-faculty-names">{payment.facultyNames?.length ? payment.facultyNames.join(", ") : "Not assigned"}</span></td>}<td><span className="fee-payment-date"><strong>{new Date(`${payment.paymentDate}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</strong><small><i className="fa fa-clock-o" /> {new Date(payment.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></span></td><td><strong>{currency.format(payment.amount)}</strong></td><td><span className={`fee-mode-badge mode-${payment.paymentMode}`}>{modeLabel(payment.paymentMode)}</span></td><td><span className="fee-status-paid"><i />Paid</span></td><td><div className="fee-row-actions"><PrintReceiptButton paymentId={payment.id} receiptId={payment.receiptId} />{!readOnly && <button type="button" className="fee-delete-button" disabled={deletingId !== null} onClick={() => void deletePayment(payment)} aria-label={`Delete fee entry ${payment.receiptId}`} title="Delete fee entry"><i className={`fa fa-${deletingId === payment.id ? "spinner fa-spin" : "trash"}`} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      <footer className="app-pagination"><span>{pagination.totalPayments ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.totalPayments)} of ${pagination.totalPayments} payments` : "Showing 0 payments"}</span><div><button className="btn btn-sm btn-outline-secondary" type="button" disabled={!pagination.hasPreviousPage || loading} onClick={() => void load(pagination.page - 1)}><i className="fa fa-chevron-left" /> Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button className="btn btn-sm btn-outline-secondary" type="button" disabled={!pagination.hasNextPage || loading} onClick={() => void load(pagination.page + 1)}>Next <i className="fa fa-chevron-right" /></button></div></footer>
    </section>
  </>;
}
