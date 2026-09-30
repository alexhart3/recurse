import { daysUntilReview, reviewLabel, type Problem } from "./problem";
import styles from "./problems.module.css";

type ProblemRowProps = {
  problem: Problem;
};

function difficultyClass(difficulty: Problem["difficulty"]) {
  if (difficulty === "Easy") return styles.easy;
  if (difficulty === "Medium") return styles.medium;
  if (difficulty === "Hard") return styles.hard;
  return styles.unrated;
}

export default function ProblemRow({ problem }: ProblemRowProps) {
  const days = daysUntilReview(problem.next_review_date);

  return (
    <article className={styles.row}>
      <div className={styles.problemInfo}>
        <div className={styles.problemText}>
          <h2>{problem.title}</h2>
          <p>
            {problem.topics.length > 0
              ? problem.topics.join(" · ")
              : "No topics"}
          </p>
        </div>
      </div>

      <div className={styles.difficultyCell}>
        <span
          className={`${styles.difficulty} ${difficultyClass(problem.difficulty)}`}
        >
          <span className={styles.difficultyDot} />
          {problem.difficulty ?? "Not set"}
        </span>
      </div>

      <div className={styles.reviewCell}>
        <span className={`${styles.review} ${days <= 0 ? styles.due : ""}`}>
          {reviewLabel(days)}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ↗
        </span>
      </div>
    </article>
  );
}
