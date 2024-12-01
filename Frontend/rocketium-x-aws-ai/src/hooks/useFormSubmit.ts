import { useRouter } from "next/navigation";
import { useState } from "react";

export default function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirect = useRouter();
  const submitForm = async (imageFile: File, pdfFile: File) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("prd", pdfFile);

    try {
      const response = await fetch("http://localhost:4567/api/ads/qc", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      console.log(result);
      return `/analysis/?res=${JSON.stringify(result)}`;
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("An error occurred while uploading files. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitForm };
}
