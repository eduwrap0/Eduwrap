"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const redirectDelaySeconds = 5;

export function ThankYouRedirect() {
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState(redirectDelaySeconds);

  const returnToPreviousPage = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace("/");
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(returnToPreviousPage, redirectDelaySeconds * 1_000);
    const countdown = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(countdown);
    };
  }, [returnToPreviousPage]);

  return <div className="thank-you-return" role="status">
    <div className="thank-you-return-copy"><i className="fa fa-clock-o" aria-hidden="true" /><span>Returning you to the previous page in {secondsRemaining} seconds</span></div>
    <div className="thank-you-progress" aria-hidden="true"><span /></div>
    <button type="button" onClick={returnToPreviousPage}>Return now <i className="fa fa-arrow-right" aria-hidden="true" /></button>
  </div>;
}
