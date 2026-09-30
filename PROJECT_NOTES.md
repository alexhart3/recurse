# Project Notes

## Product

A personal LeetCode problem tracker that uses spaced repetition to help decide when to revisit problems.

## UI direction

Keep the app minimal and centered on a single page:

- Show the user's problems in a list.
- Show how many days remain until each problem's next review.
- Label problems due today as “Due today.”
- Label past-due problems as “Overdue by N days,” showing the number of days overdue.
- Clicking a problem opens a modal on the same page with that entry's details and actions.
- Add and edit problems can use the same modal pattern.

Avoid adding separate dashboard, library, or progress pages unless the app's needs grow.

## Data and hosting direction

- Use PostgreSQL for the relational problem and review-history data.
- Start with Supabase's free tier for the hosted database.
- The intended app will have a frontend and backend/API. Keep database credentials on the backend, out of frontend code.
- Hosting choice and backend implementation details are still open.

## Initial scope

Build the single-page UI first. Backend integration, review scheduling details, and additional features can be decided as the UI takes shape.
