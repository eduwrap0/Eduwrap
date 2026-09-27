"use client";

import { useEffect, useRef, useState } from "react";

type CourseOption = {
  name: string;
  slug: string;
};

export function BlogCourseFilter({ courses, value }: { courses: CourseOption[]; value: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedCourse = courses.find((course) => course.slug === selected);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const choose = (slug: string) => {
    setSelected(slug);
    setOpen(false);
  };

  return (
    <div className={`blog-course-filter${open ? " is-open" : ""}`} ref={rootRef}>
      <input type="hidden" name="course" value={selected} />
      <button
        type="button"
        className="blog-course-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedCourse?.name ?? "All courses"}</span>
        <i className={`fa fa-angle-${open ? "up" : "down"}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="blog-course-filter-menu" role="listbox" aria-label="Course">
          <button type="button" role="option" aria-selected={!selected} className={!selected ? "selected" : ""} onClick={() => choose("")}>All courses</button>
          {courses.map((course) => (
            <button key={course.slug} type="button" role="option" aria-selected={selected === course.slug} className={selected === course.slug ? "selected" : ""} onClick={() => choose(course.slug)}>
              {course.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
