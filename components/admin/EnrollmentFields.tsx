"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface SelectOption { value: string; label: string }

interface ThemedSelectProps {
  id?: string;
  name?: string;
  ariaLabel: string;
  options: readonly (string | SelectOption)[];
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function ThemedSelect({ id, name, ariaLabel, options, placeholder = "Select an option", defaultValue = "", value, onChange, invalid = false, required = false, className = "", searchable = false, searchPlaceholder = "Search..." }: ThemedSelectProps) {
  const items = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedValue = value === undefined ? internalValue : value;
  const selected = items.find((item) => item.value === selectedValue);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = normalizedQuery ? items.filter((item) => item.label.toLocaleLowerCase().includes(normalizedQuery)) : items;

  function choose(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setQuery("");
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function toggleOpen() {
    setOpen((current) => {
      if (!current && searchable) requestAnimationFrame(() => searchRef.current?.focus());
      if (current) setQuery("");
      return !current;
    });
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = items.findIndex((item) => item.value === selectedValue);
    if (event.key === "Escape") { setQuery(""); setOpen(false); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleOpen(); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : items.length - 1) : Math.min(items.length - 1, Math.max(0, currentIndex + direction));
      choose(items[nextIndex].value);
    }
  }

  return <div className={`themed-select ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""} ${className}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setQuery(""); setOpen(false); } }}>
    {name && <input type="hidden" name={name} value={selectedValue} />}
    <button ref={triggerRef} id={id} type="button" className="themed-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} data-required={required || undefined} onClick={toggleOpen} onKeyDown={keyDown}>
      <span className={selected ? "" : "is-placeholder"}>{selected?.label || placeholder}</span><i className="fa fa-chevron-down" aria-hidden="true" />
    </button>
    {open && <div className="themed-select-menu">
      {searchable && <div className="themed-select-search"><i className="fa fa-search" aria-hidden="true" /><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { setQuery(""); setOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); } else if (event.key === "Enter" && filteredItems.length) { event.preventDefault(); choose(filteredItems[0].value); } }} placeholder={searchPlaceholder} aria-label={`Search ${ariaLabel}`} /></div>}
      <div role="listbox" aria-label={ariaLabel}>{filteredItems.map((item) => <button type="button" role="option" aria-selected={item.value === selectedValue} className={`themed-select-option ${item.value === selectedValue ? "is-selected" : ""}`} key={item.value} onClick={() => choose(item.value)}><span>{item.label}</span>{item.value === selectedValue && <i className="fa fa-check" aria-hidden="true" />}</button>)}</div>
      {filteredItems.length === 0 && <div className="themed-select-empty" role="status">No matching options</div>}
    </div>}
  </div>;
}

function parseTime(value = "") {
  const [rawHour = "", minute = ""] = value.split(":");
  const hour24 = Number(rawHour);
  if (!rawHour || Number.isNaN(hour24)) return { hour: "", minute: "00", period: "AM" };
  return { hour: String(hour24 % 12 || 12).padStart(2, "0"), minute: minute || "00", period: hour24 >= 12 ? "PM" : "AM" };
}

export function BatchTimeField({ defaultValue = "", invalid = false }: { defaultValue?: string; invalid?: boolean }) {
  const initial = parseTime(defaultValue);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);
  const hour24 = hour ? String((Number(hour) % 12) + (period === "PM" ? 12 : 0)).padStart(2, "0") : "";

  return <div className={`batch-time-field ${invalid ? "is-invalid" : ""}`}>
    <input type="hidden" name="batchTiming" value={hour24 ? `${hour24}:${minute}` : ""} />
    <ThemedSelect ariaLabel="Batch hour" value={hour} onChange={setHour} placeholder="Hour" options={Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"))} required />
    <span aria-hidden="true">:</span>
    <ThemedSelect ariaLabel="Batch minutes" value={minute} onChange={setMinute} options={["00", "15", "30", "45"]} />
    <ThemedSelect ariaLabel="AM or PM" value={period} onChange={setPeriod} options={["AM", "PM"]} className="batch-period-select" />
  </div>;
}

export function CourseDurationField({ defaultValue = "", invalid = false }: { defaultValue?: string; invalid?: boolean }) {
  const initialValue = defaultValue.match(/\d+(?:\.\d+)?/)?.[0] || "";
  const [months, setMonths] = useState(initialValue);
  return <div className={`course-duration-field ${invalid ? "is-invalid" : ""}`}>
    <input type="hidden" name="courseDuration" value={months ? `${months} ${Number(months) === 1 ? "month" : "months"}` : ""} />
    <input aria-label="Course duration in months" type="number" inputMode="decimal" min="0.5" max="120" step="0.5" value={months} onChange={(event) => setMonths(event.target.value)} className="form-control" placeholder="For example, 3" required />
    <span>months</span>
  </div>;
}

function parseDate(value: string) {
  const parts = value.split("-").map(Number);
  return parts.length === 3 && parts.every(Number.isFinite) ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ThemedDateField({ id, name, ariaLabel, defaultValue = "", value, onChange, max, invalid = false, required = false }: { id?: string; name?: string; ariaLabel: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; max?: string; invalid?: boolean; required?: boolean }) {
  const [today] = useState(() => new Date());
  const initialDate = parseDate(value ?? defaultValue);
  const [selected, setSelected] = useState(defaultValue);
  const [viewDate, setViewDate] = useState(initialDate || today);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedValue = value === undefined ? selected : value;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const leadingDays = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const maximum = max ? parseDate(max) : null;
  const maximumYear = maximum?.getFullYear() ?? today.getFullYear() + 10;
  const years = Array.from({ length: maximumYear - 1899 }, (_, index) => maximumYear - index);
  const months = Array.from({ length: 12 }, (_, index) => new Date(2000, index, 1).toLocaleDateString("en-IN", { month: "long" }));
  const availableMonths = months.slice(0, maximum && year === maximum.getFullYear() ? maximum.getMonth() + 1 : 12);
  const todayString = dateValue(today);
  const cells = Array.from({ length: leadingDays + daysInMonth }, (_, index) => {
    if (index < leadingDays) return null;
    const day = index - leadingDays + 1;
    const cellDate = new Date(year, month, day);
    return { day, value: dateValue(cellDate), disabled: Boolean(maximum && cellDate > maximum) };
  });
  const formatted = selectedValue ? selectedValue.split("-").reverse().join("-") : "";

  function updateSelected(nextValue: string) {
    if (value === undefined) setSelected(nextValue);
    onChange?.(nextValue);
  }

  function choose(day: number) {
    updateSelected(dateValue(new Date(year, month, day)));
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function changeMonth(nextMonth: number) {
    setViewDate(new Date(year, nextMonth, 1));
  }

  function changeYear(nextYear: number) {
    const nextMonth = maximum && nextYear === maximum.getFullYear() ? Math.min(month, maximum.getMonth()) : month;
    setViewDate(new Date(nextYear, nextMonth, 1));
  }

  return <div className={`themed-date ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    {name && <input type="hidden" name={name} value={selectedValue} />}
    <button ref={triggerRef} id={id} type="button" className="themed-date-trigger" aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} data-required={required || undefined} onClick={() => setOpen((current) => !current)}><span className={formatted ? "" : "is-placeholder"}>{formatted || "dd-mm-yyyy"}</span><i className="fa fa-calendar" aria-hidden="true" /></button>
    {open && <div className="themed-calendar" role="dialog" aria-label={ariaLabel}>
      <div className="themed-calendar-head">
        <button type="button" aria-label="Previous month" onClick={() => setViewDate(new Date(year, month - 1, 1))}><i className="fa fa-chevron-left" /></button>
        <div className="themed-calendar-period">
          <ThemedSelect ariaLabel="Month" value={String(month)} onChange={(value) => changeMonth(Number(value))} options={availableMonths.map((label, index) => ({ value: String(index), label }))} />
          <ThemedSelect ariaLabel="Year" value={String(year)} onChange={(value) => changeYear(Number(value))} options={years.map(String)} />
        </div>
        <button type="button" aria-label="Next month" disabled={Boolean(maximum && new Date(year, month + 1, 1) > maximum)} onClick={() => setViewDate(new Date(year, month + 1, 1))}><i className="fa fa-chevron-right" /></button>
      </div>
      <div className="themed-calendar-week">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="themed-calendar-grid">{cells.map((cell, index) => cell === null ? <span key={`blank-${index}`} /> : <button type="button" key={cell.value} disabled={cell.disabled} className={`${cell.value === selectedValue ? "is-selected" : ""} ${cell.value === todayString ? "is-today" : ""}`} onClick={() => choose(cell.day)}>{cell.day}</button>)}</div>
      <div className="themed-calendar-footer"><button type="button" onClick={() => { updateSelected(""); setOpen(false); }}>Clear</button><button type="button" disabled={Boolean(max && todayString > max)} onClick={() => { setViewDate(today); updateSelected(todayString); setOpen(false); }}>Today</button></div>
    </div>}
  </div>;
}
