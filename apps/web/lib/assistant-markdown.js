const PATNA_PATH_PATTERN =
  /(\/(?:app(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|admin(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|book(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|publications(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|events(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|projects(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|community(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|contact|about|legal(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?|work-with-us(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?)(?:\?[^\s)]+)?(?:#[^\s)]+)?)/g;

function pushTextWithPatnaLinks(tokens, value) {
  const text = String(value || "");

  if (!text) {
    return;
  }

  let cursor = 0;
  let match;

  while ((match = PATNA_PATH_PATTERN.exec(text))) {
    if (match.index > cursor) {
      tokens.push({ type: "text", value: text.slice(cursor, match.index) });
    }

    tokens.push({
      type: "link",
      href: match[1],
      value: match[1],
    });

    cursor = match.index + match[1].length;
  }

  if (cursor < text.length) {
    tokens.push({ type: "text", value: text.slice(cursor) });
  }

  PATNA_PATH_PATTERN.lastIndex = 0;
}

function parseInline(text) {
  const value = String(text || "");
  const tokens = [];
  let cursor = 0;
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\((?:https?:\/\/|\/)[^)]+\))/g;

  let match;
  while ((match = pattern.exec(value))) {
    if (match.index > cursor) {
      pushTextWithPatnaLinks(tokens, value.slice(cursor, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      tokens.push({ type: "code", value: token.slice(1, -1) });
    } else if (token.startsWith("**")) {
      tokens.push({ type: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("*")) {
      tokens.push({ type: "em", value: token.slice(1, -1) });
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push({
          type: "link",
          href: linkMatch[2],
          value: linkMatch[1],
        });
      } else {
        tokens.push({ type: "text", value: token });
      }
    }

    cursor = match.index + token.length;
  }

  if (cursor < value.length) {
    pushTextWithPatnaLinks(tokens, value.slice(cursor));
  }

  return tokens;
}

function splitTableRow(line) {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const value = String(line || "").trim();
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(value);
}

function isTableRow(line) {
  const value = String(line || "").trim();
  return value.includes("|") && splitTableRow(value).length > 1;
}

function isListLine(line) {
  return /^\s*(?:[-*]|\d+\.)\s+/.test(String(line || ""));
}

function isHeadingLine(line) {
  return /^(#{1,6})\s+/.test(String(line || ""));
}

function isFenceLine(line) {
  return /^```/.test(String(line || "").trim());
}

function isRuleLine(line) {
  return /^\s*(?:---+|\*\*\*+|___+)\s*$/.test(String(line || ""));
}

export function parseAssistantMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isFenceLine(trimmed)) {
      const language = trimmed.slice(3).trim();
      const content = [];
      index += 1;

      while (index < lines.length && !isFenceLine(lines[index])) {
        content.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        language,
        value: content.join("\n"),
      });
      continue;
    }

    if (isHeadingLine(trimmed)) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      blocks.push({
        type: "heading",
        depth: match[1].length,
        inlines: parseInline(match[2]),
      });
      index += 1;
      continue;
    }

    if (isRuleLine(trimmed)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (isTableRow(trimmed) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(trimmed);
      const rows = [];
      index += 2;

      while (index < lines.length && isTableRow(lines[index].trim())) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({
        type: "table",
        headers: headers.map((cell) => parseInline(cell)),
        rows: rows.map((row) => row.map((cell) => parseInline(cell))),
      });
      continue;
    }

    if (isListLine(trimmed)) {
      const ordered = /^\s*\d+\.\s+/.test(trimmed);
      const items = [];

      while (index < lines.length && isListLine(lines[index].trim())) {
        const current = lines[index].trim().replace(/^(?:[-*]|\d+\.)\s+/, "");
        items.push(parseInline(current));
        index += 1;
      }

      blocks.push({
        type: "list",
        ordered,
        items,
      });
      continue;
    }

    const paragraph = [trimmed];
    index += 1;

    while (index < lines.length) {
      const next = lines[index];
      const nextTrimmed = next.trim();

      if (
        !nextTrimmed ||
        isFenceLine(nextTrimmed) ||
        isHeadingLine(nextTrimmed) ||
        isRuleLine(nextTrimmed) ||
        isListLine(nextTrimmed) ||
        (isTableRow(nextTrimmed) && index + 1 < lines.length && isTableSeparator(lines[index + 1]))
      ) {
        break;
      }

      paragraph.push(nextTrimmed);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      inlines: parseInline(paragraph.join(" ")),
    });
  }

  return blocks;
}
