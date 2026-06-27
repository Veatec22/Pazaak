/** The top-left "← Menu" button shown over an in-game board. */
export function LeaveButton({ onLeave }: { onLeave: () => void }) {
  return (
    <button className="pz-leave" onClick={onLeave} aria-label="Back to menu">
      ← Menu
    </button>
  );
}
