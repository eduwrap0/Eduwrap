import Swal from "sweetalert2";

export async function confirmDestructive(title: string, text: string, confirmButtonText = "Delete") {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export async function confirmAction(title: string, text: string, confirmButtonText: string) {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#A00B44",
    cancelButtonColor: "#6c757d",
    reverseButtons: true,
  });
  return result.isConfirmed;
}
