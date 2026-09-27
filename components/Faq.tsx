"use client";

import { useState } from "react";

export type FaqItem = { question: string; answer: string };

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return <section className="faq-section" id="faqs" aria-labelledby="faq-title">
    <div className="container">
      <div className="faq-heading text-center">
        <span className="faq-label">Helpful information</span>
        <h2 className="fw-bold" id="faq-title">Frequently Asked Questions</h2>
        <p>Find clear answers about the program, learning experience, practical training, and career support.</p>
      </div>

      <div className="faq-list-wrap">
        <div className="faq-container">
          {items.map((item, index) => <div className={`faq-item${open === index ? " active" : ""}`} key={item.question}>
            <button type="button" className="faq-question d-flex align-items-center justify-content-between w-100" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>
              <span className="d-flex align-items-center"><i className="fa fa-plus" aria-hidden="true" />{item.question}</span>
            </button>
            <div className="faq-answer"><p>{item.answer}</p></div>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}
