import { daysUntilReview, type Problem } from "./problem";
import styles from "./problems.module.css";

type ProblemSummaryProps = {
  problems: Problem[];
  isLoading: boolean;
  error: string | null;
};

export default function ProblemSummary({
  problems,
  isLoading,
  error,
}: ProblemSummaryProps) {
  const dueTodayCount = problems.filter(
    (problem) => daysUntilReview(problem.next_review_date) === 0,
  ).length;
  const countsUnavailable = isLoading || error !== null;

  return (
    <div className={styles.summary}>
      <span>
        <strong>{countsUnavailable ? "—" : problems.length}</strong> problems
      </span>
      <span className={styles.summaryDivider} aria-hidden="true" />
      <span>
        <strong>{countsUnavailable ? "—" : dueTodayCount}</strong> due today
      </span>
    </div>
  );
}
