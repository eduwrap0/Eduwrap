"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoTestimonialRecord } from "@/types/video-testimonial";

function LazyAccordionVideo({ testimonial }: { testimonial: VideoTestimonialRecord }) {
  const wrapper = useRef<HTMLElement>(null); const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false); const [playing, setPlaying] = useState(false); const [muted, setMuted] = useState(false);
  useEffect(() => {
    const element = wrapper.current; if (!element) return;
    if (!("IntersectionObserver" in window)) { const timer = setTimeout(() => setReady(true), 0); return () => clearTimeout(timer); }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setReady(true); observer.disconnect(); } }, { rootMargin: "300px" });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const play = () => { if (!ready) { setReady(true); return; } videoRef.current?.play().then(() => setPlaying(true)).catch(() => undefined); };
  const pause = () => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } setPlaying(false); };
  const togglePlay = () => { if (playing) pause(); else play(); };

  return <article ref={wrapper} className={`accordion-item${playing ? " playing" : ""}`} itemScope itemType="https://schema.org/VideoObject" onMouseEnter={play} onMouseLeave={pause} onClick={togglePlay} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); togglePlay(); } }} tabIndex={0} aria-label={`${playing ? "Pause" : "Play"} testimonial from ${testimonial.studentName}`}>
    {ready ? <video ref={videoRef} className="bg-video" muted={muted} loop playsInline preload="metadata" aria-label={testimonial.videoAltText} itemProp="contentUrl" src={testimonial.videoUrl}>Your browser does not support HTML video.</video> : <span className="public-video-placeholder"><i className="fa fa-play-circle" /><small>Video loads when visible</small></span>}
    <div className="overlay"><button type="button" className="testimonial-sound-button" onClick={(event) => { event.stopPropagation(); setMuted((current) => !current); }} aria-label={`${muted ? "Unmute" : "Mute"} testimonial from ${testimonial.studentName}`} title={muted ? "Unmute video" : "Mute video"}><i className={`fa fa-volume-${muted ? "off" : "up"}`} aria-hidden="true" /></button><div className="testimonial-video-footer"><div className="testimonial-student"><small>Student Story</small><strong itemProp="name">{testimonial.studentName}</strong></div><div className="play-button"><i className={`fa fa-${playing ? "pause-circle" : "play-circle"}`} aria-hidden="true" /></div></div></div>
    <meta itemProp="description" content={testimonial.videoAltText} /><meta itemProp="uploadDate" content={testimonial.uploadDate} />
  </article>;
}

export function VideoTestimonials({ testimonials }: { testimonials: VideoTestimonialRecord[] }) {
  if (!testimonials.length) return null;
  return <section className="student-stories-section" id="testimonials">
    <div className="container">
      <div className="student-stories-heading text-center"><span>Learner experiences</span><h2 className="fw-bold">What Students Say About Learning at EduWrap</h2><p>Read what students say about learning at EduWrap Computer Training Institute. Their stories show how hands-on training and guidance have helped them build confidence in their skills.</p></div>
      <div className="student-stories-gallery"><div className="video-accordion-container">{testimonials.map((testimonial) => <LazyAccordionVideo key={testimonial.id} testimonial={testimonial} />)}</div></div>
    </div>
  </section>;
}
