"use client";
import LoadAnim from "@/components/loadanim/LoadAnim";
import "./style.css";
import { motion, useAnimation } from "motion/react";
import { IoSend } from "react-icons/io5";
import { SiGoogledocs } from "react-icons/si";
import { FaImage } from "react-icons/fa6";
import GridBack from "@/components/GridBack/GridBack";
import useFileInput from "../../hooks/useFileInput";
import useFormSubmit from "../../hooks/useFormSubmit";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const route = useRouter();
  const [imageFile, handleImageChange, handleImageDrop] = useFileInput("image");
  const [pdfFile, handlePdfChange, handlePdfDrop] =
    useFileInput("application/pdf");
  const { isSubmitting, submitForm } = useFormSubmit();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile || !pdfFile) {
      alert("Please select both an image and a PDF file.");
      return;
    }
    anim.start("show");
    const res: any = await submitForm(imageFile, pdfFile);
    localStorage.setItem("res", res);
    route.push(`/analyse`);
  };
  const anim = useAnimation();
  return (
    <>
      <GridBack className="input">
        <section className="user-input">
          <h1>Quality Check form</h1>
          <p>upload ad banner and ad document</p>
          <form className=".upload" onSubmit={handleSubmit}>
            <FileInput
              label="Image"
              accept="image/*"
              file={imageFile}
              onChange={handleImageChange}
              onDrop={handleImageDrop}
            />
            <FileInput
              label="PDF Document"
              accept="application/pdf"
              file={pdfFile}
              onChange={handlePdfChange}
              onDrop={handlePdfDrop}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
            >
              Submit
            </motion.button>
          </form>
          <motion.section
            className="loading"
            variants={{
              hide: {
                scale: 0,
                borderRadius: "50%",
              },
              show: {
                scale: 1,
                borderRadius: "var(--uxsmall)",
              },
            }}
            initial="hide"
            animate={anim}
          >
            <motion.div
              className="screen"
              variants={{
                hide: {
                  scale: 0,
                  borderRadius: "50%",
                },
                show: {
                  scale: 1,
                  borderRadius: "var(--uxsmall)",
                },
              }}
              initial="hide"
              animate={anim}
              transition={{ delay: 0.1 }}
            >
              <LoadAnim label="Loading..." />
            </motion.div>
          </motion.section>
        </section>
      </GridBack>
    </>
  );
}

interface FileInputProps {
  label: string;
  accept: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

function FileInput({ label, accept, file, onChange, onDrop }: FileInputProps) {
  return (
    <div className="file-input">
      <label htmlFor={`upload-file-${label}`}>
        {label}
        <motion.div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="file"
            accept={accept}
            id={`upload-file-${label}`}
            onChange={onChange}
          />
          <p>Drag & drop or click to select a file</p>
          {file && <p className="file-name">{file.name}</p>}
        </motion.div>
      </label>
    </div>
  );
}
