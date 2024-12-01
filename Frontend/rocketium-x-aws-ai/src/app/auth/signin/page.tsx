"use client";
import { useState } from "react";
import "./style.css";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <main className="auth">
        <section>
          <h2>Sign in</h2>
          <div className="input">
            <input type="email" placeholder="Email" />
          </div>
          <div className="input">
            <input type="password" placeholder="Password" />
            <IoMdEye />
          </div>
          <button>Sign in</button>
        </section>
      </main>
    </>
  );
}
