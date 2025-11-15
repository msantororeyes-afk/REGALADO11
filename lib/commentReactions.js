// /lib/commentReactions.js
import { supabase } from "./supabase";

/**
 * Fetch all reactions for a batch of comments.
 * Returns a map like:
 * {
 *   "12": { "😍": 3, "🔥": 1 },
 *   "20": { "😂": 4 }
 * }
 */
export async function getCommentReactions(commentIds = []) {
  if (!commentIds.length) return {};

  const { data, error } = await supabase
    .from("comment_reactions")
    .select("comment_id, reaction_emoji")
    .in("comment_id", commentIds);

  if (error) {
    console.error("❌ Error fetching reactions:", error);
    return {};
  }

  const result = {};

  for (const row of data) {
    if (!result[row.comment_id]) {
      result[row.comment_id] = {};
    }
    if (!result[row.comment_id][row.reaction_emoji]) {
      result[row.comment_id][row.reaction_emoji] = 0;
    }
    result[row.comment_id][row.reaction_emoji] += 1;
  }

  return result;
}

/**
 * Toggle a reaction.
 * If user has reacted with this emoji → DELETE it.
 * Otherwise INSERT it.
 */
export async function toggleReaction(commentId, emoji, userId) {
  if (!commentId || !emoji || !userId)
    return { error: "Invalid reaction parameters" };

  // 1️⃣ Check if reaction already exists
  const { data: existing, error: checkError } = await supabase
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .eq("reaction_emoji", emoji)
    .maybeSingle();

  if (checkError) {
    console.error("❌ Error checking reaction:", checkError);
    return { error: checkError };
  }

  // 2️⃣ If exists → DELETE
  if (existing) {
    const { error: deleteError } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      console.error("❌ Error removing reaction:", deleteError);
      return { error: deleteError };
    }

    return { removed: true };
  }

  // 3️⃣ If not exists → INSERT
  const { error: insertError } = await supabase
    .from("comment_reactions")
    .insert({
      comment_id: commentId,
      user_id: userId,
      reaction_emoji: emoji,
    });

  if (insertError) {
    console.error("❌ Error adding reaction:", insertError);
    return { error: insertError };
  }

  return { added: true };
}
