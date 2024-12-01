import React from "react";
import "./style.css";
import { motion } from "motion/react";

const LoadAnim = ({ label }: { label: string }) => {
  return (
    <>
      <div className="progress-bar">
        <motion.div
          className="progress"
          initial={{ width: "0%", x: "0%" }}
          animate={{ width: "100%", x: "101%" }}
          transition={{ repeat: Infinity, duration: 2, type: "spring" }}
        ></motion.div>
      </div>
      <p>{label}</p>
    </>
  );
};

export default LoadAnim;
