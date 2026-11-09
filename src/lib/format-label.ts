const LOWERCASE_WORDS = new Set(['of', 'for', 'and']);

// Turns a SCREAMING_SNAKE_CASE enum value into readable Title Case, e.g.
// "BILL_OF_LADING" -> "Bill of Lading", "NEEDS_REVIEW" -> "Needs Review".
export function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}
