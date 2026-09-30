import styles from "./page.module.css";

type Problem = {
  number: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  reviewIn: number;
};

const problems: Problem[] = [
  { number: "0001", title: "Two Sum", topic: "Array · Hash Table", difficulty: "Easy", reviewIn: 0 },
  { number: "0049", title: "Group Anagrams", topic: "Array · Hash Table", difficulty: "Medium", reviewIn: 0 },
  { number: "0206", title: "Reverse Linked List", topic: "Linked List", difficulty: "Easy", reviewIn: 1 },
  { number: "0015", title: "3Sum", topic: "Two Pointers", difficulty: "Medium", reviewIn: 3 },
  { number: "0102", title: "Binary Tree Level Order Traversal", topic: "Tree · BFS", difficulty: "Medium", reviewIn: 5 },
  { number: "0076", title: "Minimum Window Substring", topic: "Sliding Window", difficulty: "Hard", reviewIn: 8 },
  { number: "0239", title: "Sliding Window Maximum", topic: "Queue · Sliding Window", difficulty: "Hard", reviewIn: 12 },
];

function reviewLabel(days: number) {
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default function Home() {
  const dueCount = problems.filter((problem) => problem.reviewIn === 0).length;

  return (
    <main className={styles.main}>
      <section className={styles.content}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>YOUR PERSONAL REVIEW QUEUE</p>
            <h1>Your problem set</h1>
            <p className={styles.subtitle}>A little practice, remembered for longer.</p>
          </div>
          <button className={styles.addButton} type="button">
            <span aria-hidden="true">＋</span> Add problem
          </button>
        </div>

        <div className={styles.summary}>
          <span><strong>{problems.length}</strong> problems</span>
          <span className={styles.summaryDivider} aria-hidden="true" />
          <span><strong>{dueCount}</strong> due today</span>
        </div>

        <div className={styles.list}>
          <div className={`${styles.row} ${styles.columnHead}`}>
            <span>PROBLEM</span>
            <span>DIFFICULTY</span>
            <span>NEXT REVIEW</span>
          </div>
          {problems.map((problem) => (
            <article className={styles.row} key={problem.number}>
              <div className={styles.problemInfo}>
                <span className={styles.problemNumber}>{problem.number}</span>
                <div className={styles.problemText}>
                  <h2>{problem.title}</h2>
                  <p>{problem.topic}</p>
                </div>
              </div>
              <div className={styles.difficultyCell}>
                <span className={`${styles.difficulty} ${styles[problem.difficulty.toLowerCase()]}`}>
                  <span className={styles.difficultyDot} />
                  {problem.difficulty}
                </span>
              </div>
              <div className={styles.reviewCell}>
                <span className={`${styles.review} ${problem.reviewIn === 0 ? styles.due : ""}`}>
                  {reviewLabel(problem.reviewIn)}
                </span>
                <span className={styles.chevron} aria-hidden="true">↗</span>
              </div>
            </article>
          ))}
        </div>

        <p className={styles.footerNote}>Your next review is always one small step away.</p>
      </section>
    </main>
  );
}
