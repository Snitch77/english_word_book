export type SentencePart =
  | { type: "text"; value: string }
  | { type: "target"; value: string };

/**
 * Split an example sentence so the target word (and common inflections)
 * can be highlighted or blanked in the study UI.
 */
export function splitExampleByWord(
  example: string,
  word: string,
): SentencePart[] {
  const trimmedWord = word.trim();
  if (!trimmedWord || !example) {
    return [{ type: "text", value: example }];
  }

  const escaped = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match base form plus simple -s / -ed / -ing / -es endings
  const pattern = new RegExp(
    `\\b(${escaped}(?:s|es|ed|ing)?)\\b`,
    "gi",
  );

  const parts: SentencePart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = pattern.exec(example);

  while (match) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: example.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "target", value: match[0] });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(example);
  }

  if (lastIndex < example.length) {
    parts.push({ type: "text", value: example.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return [{ type: "text", value: example }];
  }

  // If the word never matched, wrap a soft fallback marker at the end
  // so learners still know which lemma they are studying.
  const hasTarget = parts.some((part) => part.type === "target");
  if (!hasTarget) {
    return [
      { type: "text", value: example },
      { type: "text", value: " " },
      { type: "target", value: `(${trimmedWord})` },
    ];
  }

  return parts;
}
