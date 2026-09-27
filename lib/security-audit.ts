import "server-only";

type SecurityAction =
  | "login_succeeded"
  | "login_failed"
  | "logout"
  | "student_created"
  | "student_updated"
  | "student_status_changed"
  | "student_course_status_changed"
  | "certificate_downloaded"
  | "admission_form_downloaded"
  | "student_data_exported"
  | "fee_payment_created"
  | "fee_payment_deleted"
  | "fee_receipt_downloaded"
  | "blog_created"
  | "blog_updated"
  | "blog_published"
  | "blog_unpublished"
  | "blog_deleted"
  | "gallery_images_uploaded"
  | "gallery_images_published"
  | "gallery_images_hidden"
  | "gallery_image_updated"
  | "gallery_image_deleted"
  | "video_testimonial_created"
  | "video_testimonial_updated"
  | "video_testimonial_deleted"
  | "video_testimonials_published"
  | "video_testimonials_hidden"
  | "student_password_reset"
  | "student_deleted"
  | "faculty_created"
  | "faculty_updated"
  | "faculty_status_changed"
  | "faculty_password_reset"
  | "own_profile_updated"
  | "own_password_changed"
  | "faculty_deleted";

export function auditSecurityEvent(action: SecurityAction, actorId?: string, targetId?: string): void {
  console.info(
    JSON.stringify({
      type: "security_audit",
      action,
      ...(actorId ? { actorId } : {}),
      ...(targetId ? { targetId } : {}),
      occurredAt: new Date().toISOString(),
    }),
  );
}
