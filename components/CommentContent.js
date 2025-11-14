// /components/CommentContent.js
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import sanitizeHtml from "sanitize-html";

export default function CommentContent({ text = "" }) {
  // Sanitize BEFORE markdown is parsed
  const clean = sanitizeHtml(text, {
    allowedTags: false, // allow markdown full range, sanitize after render
    allowedAttributes: false,
  });

  return (
    <div
      style={{
        marginTop: "4px",
        lineHeight: "1.45rem",
        wordBreak: "break-word",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ul: ({ children }) => (
            <ul style={{ marginTop: 6, marginBottom: 6, paddingLeft: 20 }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ marginTop: 6, marginBottom: 6, paddingLeft: 20 }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: 2 }}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
          p: ({ children }) => (
            <p style={{ margin: "4px 0" }}>{children}</p>
          ),
        }}
      >
        {clean}
      </ReactMarkdown>
    </div>
  );
}
