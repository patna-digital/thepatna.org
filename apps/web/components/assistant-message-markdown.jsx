"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { parseAssistantMarkdown } from "@/lib/assistant-markdown";

function AssistantInlineLink({ href, children }) {
  const router = useRouter();
  const external = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      onClick={(event) => {
        if (external) {
          return;
        }

        event.preventDefault();
        router.push(href);
      }}
      rel={external ? "noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

function renderInlineTokens(tokens, keyPrefix) {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (token.type === "strong") {
      return <strong key={key}>{token.value}</strong>;
    }

    if (token.type === "em") {
      return <em key={key}>{token.value}</em>;
    }

    if (token.type === "code") {
      return <code key={key}>{token.value}</code>;
    }

    if (token.type === "link") {
      return (
        <AssistantInlineLink href={token.href} key={key}>
          {token.value}
        </AssistantInlineLink>
      );
    }

    return <Fragment key={key}>{token.value}</Fragment>;
  });
}

export function AssistantMessageMarkdown({ content }) {
  const blocks = parseAssistantMarkdown(content);

  return (
    <div className="patna-assistant-markdown">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          if (block.depth === 1) {
            return <h1 key={key}>{renderInlineTokens(block.inlines, key)}</h1>;
          }
          if (block.depth === 2) {
            return <h2 key={key}>{renderInlineTokens(block.inlines, key)}</h2>;
          }
          return <h3 key={key}>{renderInlineTokens(block.inlines, key)}</h3>;
        }

        if (block.type === "rule") {
          return <hr key={key} />;
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`}>{renderInlineTokens(item, `${key}-item-${itemIndex}`)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "table") {
          return (
            <div className="patna-assistant-table-wrap" key={key}>
              <table className="patna-assistant-table">
                <thead>
                  <tr>
                    {block.headers.map((header, cellIndex) => (
                      <th key={`${key}-head-${cellIndex}`}>
                        {renderInlineTokens(header, `${key}-head-${cellIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${key}-row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${key}-row-${rowIndex}-cell-${cellIndex}`}>
                          {renderInlineTokens(cell, `${key}-row-${rowIndex}-cell-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "code") {
          return (
            <pre className="patna-assistant-code-block" key={key}>
              <code>{block.value}</code>
            </pre>
          );
        }

        return <p key={key}>{renderInlineTokens(block.inlines, key)}</p>;
      })}
    </div>
  );
}
