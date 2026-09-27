export const CLASS_DURATIONS = ["1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", "3.5 hours", "4 hours", "4.5 hours", "5 hours"] as const;

export type ClassDuration = (typeof CLASS_DURATIONS)[number];
