// /components/EditCommentModal.js
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function EditCommentModal({ comment, onClose, onUpdated }) {
  const [newContent, setNewContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
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

    // Update comment
    const { error } = await supabase
      .from("comments")
      .update({
        content: newContent.trim(),
        edited_at: new Date(),
      })
      .eq("id", comment.id)
      .eq("user_id", user.id); // security

    setSaving(false);

    if (error) {
      console.error("❌ Error updating comment:", error);
      setMessage("❌ Error saving changes.");
    } else {
      setMessage("✅ Comment updated!");
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 600);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>

        <h2 style={{ marginBottom: "14px", color: "#0070f3" }}>Edit Comment</h2>

        {/* Old comment (strikethrough) */}
        <p style={{
          background: "#f2f2f2",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "12px",
          textDecoration: "line-through",
          color: "#888",
          fontSize: "0.9rem"
        }}>
          {comment.content}
        </p>

        {/* Editable field */}
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        ></textarea>

        {message && (
          <p style={{ marginTop: "8px", color: "#444" }}>{message}</p>
        )}

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
