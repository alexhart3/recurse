"use client";

import ProblemList from "@/components/problems/ProblemList";
import ProblemSummary from "@/components/problems/ProblemSummary";
import AddProblemModal from "@/components/problems/AddProblemModal";
import { useProblems } from "@/components/problems/useProblems";
import styles from "./page.module.css";
import { useState } from "react";

export default function Home() {
  const { problems, isLoading, error, addProblem } = useProblems();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <main className={styles.main}>
      <section className={styles.content}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>YOUR PERSONAL REVIEW QUEUE</p>
            <h1>Your problem set</h1>
            <p className={styles.subtitle}>
              A little practice, remembered for longer.
            </p>
          </div>
          <button
            className={styles.addButton}
            type="button"
            onClick={() => setIsAddModalOpen(true)}
          >
            <span aria-hidden="true">＋</span> Add problem
          </button>
        </div>

        <ProblemSummary
          problems={problems}
          isLoading={isLoading}
          error={error}
        />
        <ProblemList
          problems={problems}
          isLoading={isLoading}
          error={error}
        />

        <p className={styles.footerNote}>
          Your next review is always one small step away.
        </p>
      </section>

      {isAddModalOpen && (
        <AddProblemModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={addProblem}
        />
      )}
    </main>
  );
}
