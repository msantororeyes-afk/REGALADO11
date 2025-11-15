// /components/CommentContent.js
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import sanitizeHtml from "sanitize-html";

export default function CommentContent({ text = "" }) {
  // sanitize raw text (for safety)
  const clean = sanitizeHtml(text, {
    allowedTags: false,
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
          a: ({ href, children }) => {
            // If markdown includes [text](url) or bare URL
            const encoded = encodeURIComponent(href);
            const safeHref = `/api/comment-redirect?url=${encoded}`;

            return (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0070f3", textDecoration: "underline" }}
              >
                {children}
              </a>
            );
          },

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
          li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,

          strong: ({ children }) => (
            <strong style={{ fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,

          p: ({ children }) => <p style={{ margin: "4px 0" }}>{children}</p>,
        }}
      >
        {clean}
      </ReactMarkdown>
    </div>
  );
}
