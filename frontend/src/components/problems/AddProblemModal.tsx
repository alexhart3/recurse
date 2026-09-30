"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { NewProblem, Problem } from "./problem";
import styles from "./AddProblemModal.module.css";

type AddProblemModalProps = {
  onClose: () => void;
  onSubmit: (problem: NewProblem) => Promise<void>;
};

type Difficulty = Exclude<Problem["difficulty"], null>;

export default function AddProblemModal({
  onClose,
  onSubmit,
}: AddProblemModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [topics, setTopics] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const newProblem: NewProblem = {
      title: title.trim(),
      url: url.trim(),
      difficulty: difficulty || null,
      topics: topics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
      notes: notes.trim(),
    };

    try {
      await onSubmit(newProblem);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save this problem.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-problem-title"
        aria-describedby="add-problem-description"
      >
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>YOUR REVIEW QUEUE</p>
            <h2 id="add-problem-title">Add a problem</h2>
            <p id="add-problem-description" className={styles.description}>
              Save a problem to revisit it later.
            </p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close add problem dialog"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Problem name</span>
            <input
              autoFocus
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Two Sum"
            />
          </label>

          <label className={styles.field}>
            <span>URL</span>
            <input
              type="url"
              required
              maxLength={2048}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label className={styles.field}>
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty | "")
              }
            >
              <option value="">Choose difficulty (optional)</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Topics</span>
            <input
              value={topics}
              onChange={(event) => setTopics(event.target.value)}
              placeholder="e.g. Array, Hash Table"
            />
            <span className={styles.fieldHint}>Separate topics with commas.</span>
          </label>

          <label className={styles.field}>
            <span>Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything you want to remember about this problem"
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Add problem"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
