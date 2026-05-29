// Skip-to-main-content link — invisible until keyboard-focused, then
// snaps into the top-left as a high-contrast button. Wired to the
// `#main-content` landmark added in the root layout. Lets keyboard +
// screen-reader users bypass the AuthBadge + app navigation on every page.
//
// Tailwind's `sr-only` keeps the element accessible to AT but visually
// hidden; `focus:not-sr-only` reveals it as soon as it gains focus.

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
    >
      Към съдържанието
    </a>
  );
}
