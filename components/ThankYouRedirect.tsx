"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ThankYouRedirect() {
  const router = useRouter();

  const returnToPreviousPage = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace("/");
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(returnToPreviousPage, 2_000);

    return () => window.clearTimeout(timeout);
  }, [returnToPreviousPage]);

  return <div className="thank-you-return" role="status">
    <div className="thank-you-return-copy"><i className="fa fa-clock-o" aria-hidden="true" /><span>Returning you to the previous page in 2 seconds</span></div>
    <div className="thank-you-progress" aria-hidden="true"><span /></div>
    <button type="button" onClick={returnToPreviousPage}>Return now <i className="fa fa-arrow-right" aria-hidden="true" /></button>
  </div>;
}
