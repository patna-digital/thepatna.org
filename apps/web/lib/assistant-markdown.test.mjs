import test from "node:test";
import assert from "node:assert/strict";

import { parseAssistantMarkdown } from "./assistant-markdown.js";

test("parseAssistantMarkdown recognises headings and paragraphs", () => {
  const blocks = parseAssistantMarkdown("## Title\n\nHello **world**");

  assert.equal(blocks[0].type, "heading");
  assert.equal(blocks[0].depth, 2);
  assert.equal(blocks[1].type, "paragraph");
  assert.equal(blocks[1].inlines[1].type, "strong");
});

test("parseAssistantMarkdown recognises markdown tables", () => {
  const blocks = parseAssistantMarkdown(
    "| Name | Role |\n| --- | --- |\n| Ada | Lead |",
  );

  assert.equal(blocks[0].type, "table");
  assert.equal(blocks[0].headers.length, 2);
  assert.equal(blocks[0].rows.length, 1);
});

test("parseAssistantMarkdown recognises ordered and unordered lists", () => {
  const unordered = parseAssistantMarkdown("- one\n- two");
  const ordered = parseAssistantMarkdown("1. one\n2. two");

  assert.equal(unordered[0].type, "list");
  assert.equal(unordered[0].ordered, false);
  assert.equal(ordered[0].ordered, true);
});

test("parseAssistantMarkdown auto-links PATNA-relative paths in prose", () => {
  const blocks = parseAssistantMarkdown("Go to: /app/publications/the-path-to-maritime-net-zero");

  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[0].inlines[1].type, "link");
  assert.equal(blocks[0].inlines[1].href, "/app/publications/the-path-to-maritime-net-zero");
});

test("parseAssistantMarkdown auto-links PATNA-relative paths inside tables", () => {
  const blocks = parseAssistantMarkdown(
    "| Name | Link |\n| --- | --- |\n| Jane | /book/jane-doe |",
  );

  assert.equal(blocks[0].type, "table");
  assert.equal(blocks[0].rows[0][1][0].type, "link");
  assert.equal(blocks[0].rows[0][1][0].href, "/book/jane-doe");
});
