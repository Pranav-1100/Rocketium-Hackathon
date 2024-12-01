/* "use client";
import "./style.css";

import NewPrompt from "@/components/prompt/Prompt";

export default function Home() {
  return (
    <>
      <main className="home">
        <section className="welcome">
          <h1>Welcome</h1>
          <div className="void-gap"></div>
          <NewPrompt />
        </section>
      </main>
    </>
  );
}
 */
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/input");
}