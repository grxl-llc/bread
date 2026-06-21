import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";

export default function CommentModal({ open, onClose, post, currentUser }) {
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", post?.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id }, "-created_date"),
    enabled: !!post?.id && open,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const comment = await base44.entities.Comment.create(commentData);
      // Notify post author (skip if commenting on own post)
      if (post.created_by && post.created_by !== currentUser?.email) {
        await base44.entities.Notification.create({
          user_email: post.created_by,
          type: "comment",
          title: "New Comment",
          message: `${currentUser?.full_name || "Someone"} commented: "${commentData.text.slice(0, 60)}${commentData.text.length > 60 ? "…" : ""}"`,
          actor_name: currentUser?.full_name || currentUser?.email,
          actor_email: currentUser?.email,
          link: "/Home",
        });
      }
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      setCommentText("");
    },
  });

  const handleSubmit = () => {
    if (!commentText.trim() || !currentUser) return;

    createCommentMutation.mutate({
      post_id: post.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name || "Anonymous",
      user_avatar: currentUser.avatar_url || "",
      text: commentText.trim(),
    });
  };

  if (!open || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#15233A] rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-[#F5F5F0]">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 transition"
            >
              <X className="w-5 h-5 text-[#C4C4BA]" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A2744]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#1A2744] rounded w-1/4" />
                      <div className="h-3 bg-[#1A2744] rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#C4C4BA]/40">
                <span className="text-4xl mb-2">💬</span>
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.user_avatar ? (
                      <img
                        src={comment.user_avatar}
                        alt={comment.user_name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-sm font-bold text-[#FF6B35] flex-shrink-0">
                        {(comment.user_name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-[#F5F5F0]">
                          {comment.user_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-[#C4C4BA]/40">
                          {moment(comment.created_date).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-[#C4C4BA] leading-relaxed break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="px-5 py-4 border-t border-white/5">
            <div className="flex gap-3 items-end">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-[#1A2744] border-[#243352] text-[#F5F5F0] placeholder:text-[#C4C4BA]/40 rounded-xl resize-none min-h-[44px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={!commentText.trim() || createCommentMutation.isPending}
                className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-11 px-4 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}