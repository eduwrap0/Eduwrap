"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface PrintReceiptButtonProps {
  paymentId: string;
  receiptId: string;
}

export function PrintReceiptButton({ paymentId, receiptId }: PrintReceiptButtonProps) {
  const [printing, setPrinting] = useState(false);

  async function printReceipt() {
    setPrinting(true);

    try {
      const response = await fetch(`/api/fees/${paymentId}/receipt`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(result?.message || "Unable to prepare the receipt for printing.");
      }

      const receiptUrl = URL.createObjectURL(await response.blob());
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.width = "1px";
      frame.style.height = "1px";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.border = "0";
      frame.setAttribute("aria-hidden", "true");

      frame.onload = () => {
        setPrinting(false);
        frame.contentWindow?.focus();
        frame.contentWindow?.print();

        window.setTimeout(() => {
          URL.revokeObjectURL(receiptUrl);
          frame.remove();
        }, 60_000);
      };

      frame.src = receiptUrl;
      document.body.appendChild(frame);
    } catch (error) {
      setPrinting(false);
      toast.error(error instanceof Error ? error.message : "Unable to print the receipt.");
    }
  }

  return <button className="fee-receipt-download" type="button" onClick={() => void printReceipt()} disabled={printing} aria-label={`Print receipt ${receiptId}`}>
    <i className={`fa fa-${printing ? "spinner fa-spin" : "print"}`} /> {printing ? "Preparing" : "Print"}
  </button>;
}
