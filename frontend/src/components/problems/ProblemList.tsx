import type { Problem } from "./problem";
import ProblemRow from "./ProblemRow";
import styles from "./problems.module.css";

type ProblemListProps = {
  problems: Problem[];
  isLoading: boolean;
  error: string | null;
  onSelectProblem: (problem: Problem) => void;
};

export default function ProblemList({
  problems,
  isLoading,
  error,
  onSelectProblem,
}: ProblemListProps) {
  return (
    <div className={styles.list}>
      <div className={`${styles.row} ${styles.columnHead}`}>
        <span>PROBLEM</span>
        <span>DIFFICULTY</span>
        <span>NEXT REVIEW</span>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>Loading problems…</div>
      ) : error ? (
        <div className={`${styles.emptyState} ${styles.errorState}`} role="alert">
          Could not load problems: {error}
        </div>
      ) : problems.length === 0 ? (
        <div className={styles.emptyState}>No problems added yet.</div>
      ) : (
        problems.map((problem) => (
          <ProblemRow
            key={problem.id}
            problem={problem}
            onSelect={onSelectProblem}
          />
        ))
      )}
    </div>
  );
}
