export type Problem = {
  id: string;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  topics: string[];
  notes: string;
  created_at: string;
  last_reviewed_at: string | null;
  next_review_date: string;
  review_interval_days: number;
  review_count: number;
};

export type NewProblem = {
  title: string;
  url: string;
  difficulty: Problem["difficulty"];
  topics: string[];
  notes: string;
};

export type ReviewRating = "Again" | "Hard" | "Good" | "Easy";

export type NewReview = {
  rating: ReviewRating;
  solved_on_own: boolean;
  notes: string;
};

export type ProblemReview = {
  id: string;
  reviewed_at: string;
  rating: ReviewRating;
  solved_on_own: boolean;
  interval_days_after: number;
  notes: string;
};

export type ProblemDetail = Problem & {
  reviews: ProblemReview[];
};

export function nextReviewInterval(
  problem: Problem,
  rating: ReviewRating,
  solvedOnOwn: boolean,
) {
  if (!solvedOnOwn || rating === "Again" || problem.review_count === 0) return 1;

  const multipliers: Record<ReviewRating, number> = {
    Again: 1,
    Hard: 1.2,
    Good: 2,
    Easy: 2.5,
  };
  return Math.ceil(problem.review_interval_days * multipliers[rating]);
}

export function daysUntilReview(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const today = new Date();

  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const reviewDateUtc = Date.UTC(year, month - 1, day);

  return Math.round((reviewDateUtc - todayUtc) / 86_400_000);
}

export function reviewLabel(days: number) {
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return `Overdue by ${overdueDays} ${
      overdueDays === 1 ? "day" : "days"
    }`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
