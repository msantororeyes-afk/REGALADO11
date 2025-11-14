// /components/EditCommentModal.js
import { useState } from "react";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Components configuration for markdown (no images allowed)
const markdownComponents = {
  img: () => null, // 🚫 block images
};

export default function EditCommentModal({ comment, onClose, onUpdated }) {
  // latest text to edit
  const [newContent, setNewContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // What to show as the "old" version in grey:
  // - if original_content exists, use that
  // - otherwise, fall back to the current content
  const originalText = comment.original_content || comment.content;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("⚠️ You must be logged in.");
      setSaving(false);
      return;
    }

    // Prevent empty edits
    if (!newContent.trim()) {
      setMessage("⚠️ Comment cannot be empty.");
      setSaving(false);
      return;
    }

    // Build payload for update
    const payload = {
      content: newContent.trim(),
      edited_at: new Date(),
    };

    // If this is the FIRST edit (no edited_at / no original_content),
    // store the current comment content as original_content so
    // the UI can show it crossed out for everyone.
    if (!comment.edited_at && !comment.original_content) {
      payload.original_content = comment.content;
    }

    // Update comment
    const { error } = await supabase
      .from("comments")
      .update(payload)
      .eq("id", comment.id)
      .eq("user_id", user.id); // security

    setSaving(false);

    if (error) {
      console.error("❌ Error updating comment:", error);
      setMessage("❌ Error saving changes.");
    } else {
      setMessage("✅ Comment updated!");
      setTimeout(() => {
        onUpdated(); // reload comments in [id].js
        onClose();
      }, 600);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>

        <h2 style={{ marginBottom: "14px", color: "#0070f3" }}>Edit Comment</h2>

        {/* Old comment (strikethrough, rendered as markdown, no images) */}
        <div
          style={{
            background: "#f2f2f2",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "12px",
            textDecoration: "line-through",
            color: "#888",
            fontSize: "0.9rem",
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {originalText}
          </ReactMarkdown>
        </div>

        {/* Editable field (markdown text) */}
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write your updated comment here (markdown supported: **bold**, *italic*, lists, etc.)"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        ></textarea>

        {message && <p style={{ marginTop: "8px", color: "#444" }}>{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#0070f3",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Styles Based on DealAlertModal ---------- */
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "24px 30px",
  maxWidth: "420px",
  width: "90%",
  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  position: "relative",
  textAlign: "center",
};

const closeButtonStyle = {
  position: "absolute",
  top: "10px",
  right: "12px",
  border: "none",
  background: "transparent",
  fontSize: "20px",
  cursor: "pointer",
};
