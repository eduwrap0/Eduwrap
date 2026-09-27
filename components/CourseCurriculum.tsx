"use client";

import { useState } from "react";
import type { CourseModule } from "@/content/types";

export function CourseCurriculum({ modules }: { modules: CourseModule[] }) {
  const [openModule, setOpenModule] = useState<number | null>(null);
  const columns = [modules.slice(0, 2), modules.slice(2, 4)];

  return <section className="modules-section pt-1 mb-5">
    <div className="container mb-4"><div className="text-center"><h2 className="fw-bold text-dark">Course Curriculum</h2><p className="text-secondary col-md-8 mx-auto">A comprehensive breakdown of everything you&apos;ll master.</p></div></div>
    <div className="container"><div className="row module-accordion">
      {columns.map((column, columnIndex) => <div className="col-lg-6" key={columnIndex}>
        {column.map((module, localIndex) => {
          const index = columnIndex * 2 + localIndex;
          const isOpen = openModule === index;
          const number = String(index + 1).padStart(2, "0");
          return <div className="accordion-item shadow-sm border-0 mb-3" key={module.title}>
            <h2 className="accordion-header">
              <button className={`accordion-button${isOpen ? "" : " collapsed"}`} type="button" onClick={() => setOpenModule(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`module-${index + 1}`}>
                <span className="module-num">{number}</span>{module.title}
              </button>
            </h2>
            <div id={`module-${index + 1}`} className={`accordion-collapse collapse${isOpen ? " show" : ""}`}>
              <div className="accordion-body">{module.description}</div>
            </div>
          </div>;
        })}
      </div>)}
    </div></div>
  </section>;
}
