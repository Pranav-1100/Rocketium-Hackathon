"use client";
import LoadAnim from "@/components/loadanim/LoadAnim";
import "./style.css";
import { motion, useAnimation } from "motion/react";
import { IoSend } from "react-icons/io5";
import { SiGoogledocs } from "react-icons/si";
import { FaImage } from "react-icons/fa6";
import GridBack from "@/components/GridBack/GridBack";

export default function Page() {
  const anim = useAnimation();
  return (
    <>
      <GridBack className="input">
        <section className="user-input">
          <h1>Input Form</h1>
          <input type="text" name="" id="" placeholder="Input 1" />
          <input type="text" name="" id="" placeholder="Input 2" />
          <input type="text" name="" id="" placeholder="Input 3" />
          <div className="upload">
            <motion.label
              htmlFor="uploadimg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaImage />
              Select Image
            </motion.label>
            <motion.label
              htmlFor="uploadpdf"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Select PDF
            </motion.label>
            <input type="file" name="" id="uploadimg" accept="image/*" />
            <input
              type="file"
              name=""
              id="uploadpdf"
              accept="application/pdf"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              anim.start("show");
            }}
          >
            <span>Submit</span>
            <IoSend size={20} />
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
