import { useState } from "react";

export default function useFileInput(acceptType: string) {
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith(acceptType)) {
      setFile(selectedFile);
    } else {
      setFile(null);
      alert(`Please select a valid ${acceptType} file.`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith(acceptType)) {
      setFile(droppedFile);
    } else {
      alert(`Please drop a valid ${acceptType} file.`);
    }
  };

  return [file, handleChange, handleDrop] as const;
}
