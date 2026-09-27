"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordField({ className = "", ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? "text" : "password"} className={className} />
      <button
        type="button"
        className="password-field-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <i className={`fa fa-eye${visible ? "-slash" : ""}`} aria-hidden="true" />
      </button>
    </div>
  );
}
