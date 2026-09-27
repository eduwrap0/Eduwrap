"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { GalleryImageRecord } from "@/types/gallery";

export function ImpactNumbers() {
  return <section className="impact-section">
    <div className="container">
      <div className="impact-heading text-center">
        <span>EduWrap in numbers</span>
        <h2 className="fw-bold">Our Impact Numbers</h2>
        <p>Every number represents someone who chose to learn and grow with EduWrap. Our students build practical skills through hands-on training across our professional courses. We&apos;re proud to support every student&apos;s learning journey.</p>
      </div>
      <div className="impact-grid">
        <Metric icon="clock-o" value="8+" label="Years of Experience" text="Years dedicated to practical, career-focused learning." />
        <Metric icon="briefcase" value="100%" label="Job Assistance" text="Career guidance and support for every eligible learner." />
        <Metric icon="star" value="4.9" label="Learner Rating" text="Trusted by learners for training and mentor support." />
        <Metric icon="users" value="1200+" label="Students Trained" text="Learners supported across our professional courses." featured />
      </div>
    </div>
  </section>;
}

function Metric({ icon, value, label, text, featured = false }: { icon: string; value: string; label: string; text: string; featured?: boolean }) {
  return <article className={`impact-card${featured ? " impact-card-featured" : ""}`}>
    <div className="impact-card-top"><span className="impact-icon"><i className={`fa fa-${icon}`} aria-hidden="true" /></span><i className="fa fa-arrow-up impact-arrow" aria-hidden="true" /></div>
    <strong className="impact-value">{value}</strong>
    <h3>{label}</h3>
    <p>{text}</p>
  </article>;
}

export function BatchImages({ images, title = "Batch Images" }: { images: GalleryImageRecord[]; title?: string }) {
  const marquee = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [preview, setPreview] = useState<GalleryImageRecord | null>(null);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      const element = marquee.current;
      if (element && !paused.current) {
        element.scrollLeft += 0.5;
        if (element.scrollLeft >= element.scrollWidth / 2) element.scrollLeft = 0;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!images.length) return null;
  const track = (copy: string) => {
    const duplicate = copy === "copy";
    return <div className="track" aria-hidden={duplicate}>{images.map((image) => <button type="button" className="card img-box" tabIndex={duplicate ? -1 : 0} key={`${copy}-${image.id}`} onClick={() => setPreview(image)} aria-label={`Preview ${image.altTag}`}><Image src={image.imageUrl} alt={image.altTag} width={360} height={230} /><span className="classroom-image-overlay"><i className="fa fa-expand" aria-hidden="true" /> View moment</span></button>)}</div>;
  };

  return <section className="classroom-moments-section overflow-x-hidden">
    <div className="container"><div className="classroom-moments-heading text-center"><span>Inside EduWrap</span><h2 className="fw-bold">{title}</h2><p>Explore classroom moments at EduWrap Computer Training Institute in Zirakpur, where students build skills through practical computer training. See our learners gaining hands-on experience in professional courses.</p></div></div>
    <div className="container-fluid classroom-gallery-container"><div className="classroom-gallery-shell"><div className="slider-section"><div className="marquee-container" ref={marquee} onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}>{track("original")}{track("copy")}</div></div></div></div>
    {preview && <div id="imageModal" className="image-modal-open" role="dialog" aria-modal="true" aria-label="Batch image preview" onClick={() => setPreview(null)}><button className="close-btn" aria-label="Close preview" onClick={() => setPreview(null)}>&times;</button><Image id="previewImg" src={preview.imageUrl} alt={preview.altTag} width={960} height={640} onClick={(event) => event.stopPropagation()} /></div>}
  </section>;
}
