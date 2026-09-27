"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface ThemeSelectOption { value: string; label: string; }

export function ThemeSelect({ value, options, onChange, placeholder = "Choose an option", ariaLabel, searchable = false, searchPlaceholder = "Search options...", disabled = false }: { value: string; options: ThemeSelectOption[]; onChange: (value: string) => void; placeholder?: string; ariaLabel: string; searchable?: boolean; searchPlaceholder?: string; disabled?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => options.filter((option) => option.label.toLocaleLowerCase("en-IN").includes(query.trim().toLocaleLowerCase("en-IN"))), [options, query]);

  useEffect(() => {
    function close(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function choose(next: string) { onChange(next); setOpen(false); setQuery(""); }
  function keyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen((current) => !current); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = Math.max(0, filtered.findIndex((option) => option.value === value));
      const next = event.key === "ArrowDown" ? Math.min(filtered.length - 1, current + 1) : Math.max(0, current - 1);
      if (filtered[next]) choose(filtered[next].value);
    }
  }

  return <div className={`theme-select ${open ? "is-open" : ""}`} ref={root}>
    <button type="button" className="theme-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((current) => !current)} onKeyDown={keyboard}><span className={!selected ? "is-placeholder" : ""}>{selected?.label || placeholder}</span><i className="fa fa-chevron-down" aria-hidden="true" /></button>
    {open && <div className="theme-select-menu">
      {searchable && <div className="theme-select-search"><i className="fa fa-search" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} aria-label={`Search ${ariaLabel}`} /></div>}
      <div className="theme-select-options" role="listbox" aria-label={ariaLabel}>{filtered.length === 0 ? <span className="theme-select-empty">No matching option</span> : filtered.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "is-selected" : ""} key={`${option.value}-${option.label}`} onClick={() => choose(option.value)}><span>{option.label}</span>{option.value === value && <i className="fa fa-check" />}</button>)}</div>
    </div>}
  </div>;
}
