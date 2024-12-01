"use client";
import LoadAnim from "@/components/loadanim/LoadAnim";
import "./style.css";
import { IoSend } from "react-icons/io5";
import { motion, useAnimation } from "motion/react";
import GridBack from "@/components/GridBack/GridBack";

export default function Page() {
  const anim = useAnimation();
  return (
    <>
      <GridBack className="result">
        <section className="user-result">
          <h1>Analysis</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              anim.start("show");
            }}
          >
            <IoSend size={20} />
            Submit
          </motion.button>
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
