/* eslint-disable @next/next/no-img-element -- tiny local tool logos need their natural, varied aspect ratios */
import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/content/types";

export function CourseCard({ course }: { course: Course }) {
  return <article className="sticky-card">
    <div className="row">
      <div className="col-12 pt-2 col-md-4 mb-3">
        <Image src={course.image} alt={`${course.cardTitle} course`} className="rounded-3 course-image" width={824} height={832} sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="col-12 pt-2 col-md-8">
        <div className="d-flex">
          <div><h3 className="h5 fw-bold">{course.name}</h3></div>
          <div className="mt-25 ms-1">
            <Image src="/assets/images/icons/AI.webp" alt="AI-powered curriculum" width={466} height={212} className="ai-powered-icon" />
          </div>
        </div>
        <p className="text-secondary">{course.overview}</p>
        <div>
          <span className="badge custom-badge mt-2 fs13 rounded-pill fw-normal"><i className="fa fa-thumbs-o-up text-dark" /> 100% Placement Assistance</span>{" "}
          <span className="badge custom-badge mt-2 fs13 rounded-pill fw-normal"><i className="fa fa-empire text-dark" /> AI-Powered Curriculum</span>{" "}
          <span className="badge custom-badge mt-2 fs13 rounded-pill fw-normal"><i className="fa fa-file-text-o text-dark" /> Real World Projects</span>
        </div>
        <div className="header-container pt-2"><p className="fs13 pt-3">Covered Projects & Tools</p></div>
        <div className="d-flex align-items-center overflow-auto flex-nowrap logo-slider">
          {course.logos.map((logo) => <img key={logo} src={`/assets/images/logos/${logo}`} className="mx-3 logo-img" alt={`${course.cardTitle} tool`} loading="lazy" />)}
        </div>
        <div className="pt-4">
          <div className="card p-1 mt-2 rounded-4 shadow-sm"><div className="row g-0 text-start">
            <Info icon="calendar" label="Duration" value={course.duration} />
            <div className="col-md-1 d-none d-md-flex align-items-center justify-content-center"><div className="vr h-75" /></div>
            <Info icon="suitcase" label={course.outcome === "Beginner" ? "Level" : "Average salary"} value={course.outcome} />
          </div></div>
          <div className="row pt-1">
            <div className="col-sm-6 pt-2"><Link href="/contact" className="btn first-btn rounded-3 form-control mt-2 py-2">Download Curriculum</Link></div>
            <div className="col-sm-6 pt-2"><Link href={`/courses/${course.slug}`} className="btn btn-outline-dark rounded-3 form-control mt-2 py-2">Learn More</Link></div>
          </div>
        </div>
      </div>
    </div>
  </article>;
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="col-md-5 d-flex align-items-center p-1"><div className="me-4 rounded-circle bg-lght"><i className={`fa fa-${icon} fs-4 p-3`} /></div><div><div className="text-secondary small">{label}</div><div className="fw-bold fs-5">{value}</div></div></div>;
}
