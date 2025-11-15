// /lib/commentReactions.js
import { supabase } from "./supabase";

/**
 * Fetch reaction counts for a list of comment IDs
 * Returns:
 * {
 *   "commentId": { "😍": 3, "😂": 1, "🔥": 0 }
 * }
 */
export async function getCommentReactions(commentIds) {
  if (!commentIds || commentIds.length === 0) return {};

  const { data, error } = await supabase
    .from("comment_reactions")
    .select("comment_id, emoji")
    .in("comment_id", commentIds);

  if (error) {
    console.error("❌ Error loading comment reactions:", error);
    return {};
  }

  const map = {};

  for (const row of data) {
    if (!map[row.comment_id]) map[row.comment_id] = {};
    if (!map[row.comment_id][row.emoji]) map[row.comment_id][row.emoji] = 0;

    map[row.comment_id][row.emoji] += 1;
  }

  return map;
}

/**
 * Toggle a reaction:
 * - If the user has reacted with that emoji → remove reaction
 * - Otherwise → add reaction
 */
export async function toggleReaction(commentId, emoji, userId) {
  // check if user already reacted
  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    // remove reaction
    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("id", existing.id);

    return { added: false, removed: true, error };
  }

  // add new reaction
  const { error } = await supabase.from("comment_reactions").insert([
    {
      comment_id: commentId,
      user_id: userId,
      emoji,
    },
  ]);

  return { added: true, removed: false, error };
}
