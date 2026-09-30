export type Problem = {
  id: string;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  topics: string[];
  next_review_date: string;
  review_count: number;
};

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
