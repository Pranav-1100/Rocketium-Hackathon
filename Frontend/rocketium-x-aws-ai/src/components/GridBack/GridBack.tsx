import { input } from "motion/react-client";
import React from "react";
import "./style.css";
import { motion } from "motion/react";

const GridBack = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <main className={className}>
        <motion.div
          className="wave"
          initial={{ backgroundPositionY: "100%" }}
          animate={{ backgroundPositionY: "0%" }}
          transition={{ duration: 4, repeat: Infinity }}
        ></motion.div>
        {children}
      </main>
    </>
  );
};

export default GridBack;
