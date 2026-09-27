export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const GENDER_VALUES = ["male", "female", "other", "prefer_not_to_say"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Gender = (typeof GENDERS)[number]["value"];
