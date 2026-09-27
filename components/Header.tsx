"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { courses } from "@/content/courses";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => { setOpen(false); setCoursesOpen(false); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); setCoursesOpen(false); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isBlogArticle = pathname.startsWith("/blog/");

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark nav-color${pathname === "/about" ? " about-navbar" : ""}${isBlogArticle ? " blog-navbar" : ""}${scrolled ? " scrolled" : ""}`} aria-label="Main navigation">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" href="/" onClick={closeMenu}>
          <Image src="/assets/images/logo-light-60a64c68.webp" alt="EduWrap" width={1932} height={426} className="light-logo" priority />
          <Image src="/assets/images/logo-dark-cf3f5756.webp" alt="EduWrap" width={1932} height={426} className="dark-logo" priority />
        </Link>
        <button className="navbar-toggler" type="button" aria-expanded={open} aria-controls="navbarMain" aria-label="Toggle navigation" onClick={() => { if (open) setOpen(false); else { setCoursesOpen(false); setOpen(true); } }}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse custom-collapse${open ? " show" : ""}`} id="navbarMain" onTransitionEnd={(event) => { if (!open && event.propertyName === "right") setCoursesOpen(false); }}>
          <button type="button" className="btn-close ms-auto d-lg-none" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className={`nav-link my-link${active("/") ? " active" : ""}`} href="/" onClick={closeMenu}>Home</Link></li>
            <li
              className="nav-item dropdown dropdown-hover"
              onMouseEnter={() => { if (window.innerWidth >= 992) setCoursesOpen(true); }}
              onMouseLeave={() => { if (window.innerWidth >= 992) setCoursesOpen(false); }}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCoursesOpen(false); }}
            >
              <Link className={`nav-link my-link dropdown-toggle${active("/courses") ? " active" : ""}`} href="/courses" aria-haspopup="true" aria-expanded={coursesOpen} onFocus={() => { if (window.innerWidth >= 992) setCoursesOpen(true); }} onClick={(event) => { if (window.innerWidth <= 991) { event.preventDefault(); setCoursesOpen(!coursesOpen); } }}>Courses</Link>
              <ul className={`dropdown-menu courses-dropdown-menu border-0${coursesOpen ? " show" : ""}`}>
                <li className="courses-menu-label">Explore courses</li>
                {courses.map((course) => (
                  <li key={course.slug}>
                    <Link className={`dropdown-item${pathname === `/courses/${course.slug}` ? " active" : ""}`} href={`/courses/${course.slug}`} aria-current={pathname === `/courses/${course.slug}` ? "page" : undefined} onClick={closeMenu}>
                      <span>{course.cardTitle}</span>
                      <i className="fa fa-angle-right" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                <li className="courses-menu-footer"><Link href="/courses" onClick={closeMenu}>View all courses <i className="fa fa-arrow-right" aria-hidden="true" /></Link></li>
              </ul>
            </li>
            <li className="nav-item"><Link className={`nav-link my-link${active("/about") ? " active" : ""}`} href="/about" onClick={closeMenu}>About</Link></li>
            <li className="nav-item"><Link className={`nav-link my-link${active("/blog") ? " active" : ""}`} href="/blog" onClick={closeMenu}>Blog</Link></li>
            <li className="nav-item"><Link className={`nav-link my-link${active("/contact") ? " active" : ""}`} href="/contact" onClick={closeMenu}>Contact</Link></li>
          </ul>
          <div className="header-actions">
            <Link href="/verify-certificate" className={`btn verify-nav-btn${active("/verify-certificate") ? " active" : ""}`} onClick={closeMenu}><i className="fa fa-certificate" aria-hidden="true" /> Verify Certificate</Link>
            <Link href="/login" className="btn btn-light mybtn rounded-3" onClick={closeMenu}>Login</Link>
          </div>
        </div>
      </div>
      <button type="button" className={`mobile-nav-backdrop${open ? " show" : ""}`} aria-label="Close navigation" onClick={() => setOpen(false)} />
    </nav>
  );
}
