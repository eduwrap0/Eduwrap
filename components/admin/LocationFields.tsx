"use client";

import { useState } from "react";
import { ThemedSelect } from "@/components/admin/EnrollmentFields";
import { getDistricts, INDIAN_STATES } from "@/lib/india-locations";

export function LocationFields({
  idPrefix,
  defaultState = "",
  defaultDistrict = "",
  errors = {},
}: {
  idPrefix: string;
  defaultState?: string;
  defaultDistrict?: string;
  errors?: Record<string, string[]>;
}) {
  const [state, setState] = useState(defaultState);
  const [district, setDistrict] = useState(defaultDistrict);
  const districts = getDistricts(state);

  return <>
    <div className="col-md-6">
      <label htmlFor={`${idPrefix}-state`} className="form-label">State / Union territory</label>
      <ThemedSelect id={`${idPrefix}-state`} name="state" ariaLabel="State or union territory" value={state} onChange={(value) => { setState(value); setDistrict(""); }} placeholder="Select state" options={INDIAN_STATES} invalid={Boolean(errors.state)} required searchable searchPlaceholder="Search state..." />
      {errors.state && <div className="invalid-feedback d-block">{errors.state[0]}</div>}
    </div>
    <div className="col-md-6">
      <label htmlFor={`${idPrefix}-district`} className="form-label">District</label>
      <ThemedSelect id={`${idPrefix}-district`} name="district" ariaLabel="District" value={district} onChange={setDistrict} placeholder={state ? "Select district" : "Select state first"} options={districts} invalid={Boolean(errors.district)} required searchable searchPlaceholder="Search district..." />
      {errors.district && <div className="invalid-feedback d-block">{errors.district[0]}</div>}
    </div>
  </>;
}
