"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  daysUntilReview,
  nextReviewInterval,
  reviewLabel,
  type NewReview,
  type ReviewRating,
  type ProblemDetail,
} from "./problem";
import styles from "./ProblemDetailModal.module.css";

type ProblemDetailModalProps = {
  problemId: string;
  onClose: () => void;
  onSubmitReview: (problemId: string, review: NewReview) => Promise<ProblemDetail>;
};

const ratings: ReviewRating[] = ["Again", "Hard", "Good", "Easy"];

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProblemDetailModal({
  problemId,
  onClose,
  onSubmitReview,
}: ProblemDetailModalProps) {
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<ReviewRating | "">("");
  const [solvedOnOwn, setSolvedOnOwn] = useState<boolean | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewHistoryOpen, setIsReviewHistoryOpen] = useState(false);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating || solvedOnOwn === null) return;

    setIsSavingReview(true);
    setReviewError(null);
    try {
      const updatedProblem = await onSubmitReview(problemId, {
        rating,
        solved_on_own: solvedOnOwn,
        notes: reviewNotes.trim(),
      });
      setProblem(updatedProblem);
      setRating("");
      setSolvedOnOwn(null);
      setReviewNotes("");
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setIsSavingReview(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch(`http://localhost:8000/problems/${encodeURIComponent(problemId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            body && typeof body.detail === "string"
              ? body.detail
              : `Request failed: ${response.status}`,
          );
        }
        return response.json() as Promise<ProblemDetail>;
      })
      .then(setProblem)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load problem");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [problemId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const previewInterval =
    problem && rating && solvedOnOwn !== null
      ? nextReviewInterval(problem, rating, solvedOnOwn)
      : null;

  return (
    <div className={styles.overlay}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-detail-title"
        aria-describedby="problem-detail-description"
      >
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>PROBLEM DETAILS</p>
            <h2 id="problem-detail-title">
              {isLoading ? "Loading problem…" : problem?.title ?? "Problem"}
            </h2>
            <p id="problem-detail-description" className={styles.description}>
              Details and review history for this problem.
            </p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close problem details"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <p className={styles.message} role="status">Loading details…</p>
        ) : error ? (
          <p className={`${styles.message} ${styles.error}`} role="alert">
            Could not load problem details: {error}
          </p>
        ) : problem ? (
          <div className={styles.detailContent}>
            <a
              className={styles.problemLink}
              href={problem.url}
              target="_blank"
              rel="noreferrer"
            >
              Open problem <span aria-hidden="true">↗</span>
            </a>

            <div className={styles.tags}>
              <span className={styles.difficulty}>{problem.difficulty ?? "Not set"}</span>
              {problem.topics.map((topic) => (
                <span className={styles.topic} key={topic}>{topic}</span>
              ))}
            </div>

            <section className={styles.section} aria-labelledby="schedule-heading">
              <h3 id="schedule-heading">Review schedule</h3>
              <dl className={styles.scheduleGrid}>
                <div>
                  <dt>Next review</dt>
                  <dd>
                    {reviewLabel(daysUntilReview(problem.next_review_date))}
                    <span>{formatDate(problem.next_review_date)}</span>
                  </dd>
                </div>
                <div>
                  <dt>Interval</dt>
                  <dd>{problem.review_interval_days} days</dd>
                </div>
                <div>
                  <dt>Reviews</dt>
                  <dd>{problem.review_count}</dd>
                </div>
                <div>
                  <dt>Last reviewed</dt>
                  <dd>
                    {problem.last_reviewed_at
                      ? formatTimestamp(problem.last_reviewed_at)
                      : "Not reviewed yet"}
                  </dd>
                </div>
              </dl>
            </section>

            {problem.notes && (
              <section className={styles.section} aria-labelledby="problem-notes-heading">
                <h3 id="problem-notes-heading">Notes</h3>
                <p className={styles.notes}>{problem.notes}</p>
              </section>
            )}

            <section className={styles.section} aria-labelledby="record-review-heading">
              <h3 id="record-review-heading">Record a review</h3>
              <form className={styles.reviewForm} onSubmit={submitReview}>
                <label className={styles.selectField}>
                  Review difficulty
                  <select
                    value={rating}
                    onChange={(event) => setRating(event.target.value as ReviewRating | "")}
                  >
                    <option value="">Choose a rating</option>
                    {ratings.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <fieldset className={styles.fieldset}>
                  <legend>Did you solve it on your own?</legend>
                  <div className={styles.outcomeChoices}>
                    <label>
                      <input
                        type="radio"
                        name="solved-on-own"
                        checked={solvedOnOwn === true}
                        onChange={() => setSolvedOnOwn(true)}
                      />
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="solved-on-own"
                        checked={solvedOnOwn === false}
                        onChange={() => setSolvedOnOwn(false)}
                      />
                      Used outside help
                    </label>
                  </div>
                </fieldset>

                <label className={styles.notesField}>
                  Review notes <span>(optional)</span>
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="What was tricky? What do you want to remember?"
                  />
                </label>

                <p className={styles.intervalPreview} aria-live="polite">
                  {previewInterval !== null
                    ? `Next review in ${previewInterval} ${previewInterval === 1 ? "day" : "days"}. ${!solvedOnOwn ? "Outside help resets the interval to one day." : ""}`
                    : "Choose a rating and whether you solved it on your own to preview the next review."}
                </p>

                {reviewError && (
                  <p className={styles.error} role="alert">{reviewError}</p>
                )}
                <button
                  className={styles.submitReviewButton}
                  type="submit"
                  disabled={!rating || solvedOnOwn === null || isSavingReview}
                >
                  {isSavingReview ? "Saving review…" : "Save review"}
                </button>
              </form>
            </section>

            <section className={styles.section} aria-labelledby="review-history-heading">
              <button
                className={styles.historyToggle}
                type="button"
                aria-expanded={isReviewHistoryOpen}
                aria-controls="review-history-content"
                onClick={() => setIsReviewHistoryOpen((isOpen) => !isOpen)}
              >
                <span id="review-history-heading">
                  Review history <span className={styles.historyCount}>({problem.reviews.length})</span>
                </span>
                <span className={styles.historyChevron} aria-hidden="true">
                  {isReviewHistoryOpen ? "−" : "+"}
                </span>
              </button>
              {isReviewHistoryOpen && (
                <div id="review-history-content" className={styles.historyContent}>
                  {problem.reviews.length === 0 ? (
                    <p className={styles.message}>No reviews yet.</p>
                  ) : (
                    <ol className={styles.reviewList}>
                      {problem.reviews.map((review) => (
                        <li className={styles.reviewItem} key={review.id}>
                          <div className={styles.reviewTopline}>
                            <time dateTime={review.reviewed_at}>
                              {formatTimestamp(review.reviewed_at)}
                            </time>
                            <span className={styles.rating}>{review.rating}</span>
                          </div>
                          <p className={styles.reviewOutcome}>
                            {review.solved_on_own
                              ? "Solved on own"
                              : "Used outside help"}
                            <span>Next interval: {review.interval_days_after} days</span>
                          </p>
                          {review.notes && (
                            <p className={styles.reviewNotes}>{review.notes}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
