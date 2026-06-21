import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, Sparkles, ChevronDown, ChevronUp, BookmarkPlus, MoreVertical, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

import CommentModal from "./CommentModal";

export default function PostCard({ post, onSaveRecipe, onEdit, onDelete, currentUserEmail }) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [creatorBadges, setCreatorBadges] = useState([]);
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const hasAiRecipe = post.ai_recipe_guess?.title;
  const isOwnPost = currentUserEmail && post.created_by === currentUserEmail;
  const isVideo = post.media_url && (
    post.media_url.includes(".mp4") ||
    post.media_url.includes("video") ||
    post.media_url.includes(".mov") ||
    post.media_url.includes(".webm")
  );
  const isClip = isVideo && post.tutorial_id;

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (post.created_by) {
      base44.entities.User.filter({ email: post.created_by }).then((users) => {
        if (users.length > 0) {
          if (users[0].is_creator || users[0].badges?.includes("creator")) {
            setCreatorBadges(["creator"]);
          }
          if (users[0].avatar_url) setAuthorAvatarUrl(users[0].avatar_url);
        }
      });
    }
  }, [post.created_by]);

  // enforce clip end time for tutorial clips
  useEffect(() => {
    if (!isClip || !videoRef.current) return;
    const vid = videoRef.current;
    const handleTime = () => {
      if (post.clip_start != null) vid.currentTime < post.clip_start && (vid.currentTime = post.clip_start);
      if (post.clip_end != null && vid.currentTime >= post.clip_end) {
        vid.pause();
        vid.currentTime = post.clip_start ?? 0;
      }
    };
    vid.addEventListener("timeupdate", handleTime);
    const handlePlay = () => {
      if (post.clip_start != null) vid.currentTime = post.clip_start;
    };
    vid.addEventListener("play", handlePlay);
    return () => {
      vid.removeEventListener("timeupdate", handleTime);
      vid.removeEventListener("play", handlePlay);
    };
  }, [isClip, post.clip_start, post.clip_end]);

  const { data: commentCount = 0 } = useQuery({
    queryKey: ["commentCount", post.id],
    queryFn: async () => {
      const comments = await base44.entities.Comment.filter({ post_id: post.id });
      return comments.length;
    },
  });

  return (
    <div className="relative w-full h-[calc(100svh-120px)] bg-[#0A1220] flex-shrink-0 snap-start overflow-hidden">
      {/* Full-screen media */}
      <div className="absolute inset-0">
        {post.media_url ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={post.media_url}
              className="w-full h-full object-cover"
              controls
              playsInline
              loop={!isClip}
            />
          ) : (
            <img
              src={post.media_url}
              alt={post.caption}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1A2744]">
            <span className="text-7xl">🍞</span>
          </div>
        )}
        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        {/* Gradient overlay top */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      </div>

      {/* "Watch full tutorial" banner for clips */}
      {isClip && (
        <div className="absolute top-3 left-0 right-0 flex justify-center z-10">
          <Link
            to={createPageUrl("Tutorials")}
            className="flex items-center gap-1.5 bg-[#FF6B35]/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
          >
            <ExternalLink className="w-3 h-3" />
            Watch full tutorial
          </Link>
        </div>
      )}

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <button
            onClick={async () => {
              if (!currentUser) { setShowSignUpPrompt(true); return; }
              if (likeLoading) return;
              setLikeLoading(true);
              try {
                if (liked) {
                  const existing = await base44.entities.Like.filter({ post_id: post.id, user_id: currentUser.id });
                  if (existing.length > 0) await base44.entities.Like.delete(existing[0].id);
                  await base44.entities.Post.update(post.id, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
                } else {
                  await base44.entities.Like.create({ post_id: post.id, user_id: currentUser.id });
                  await base44.entities.Post.update(post.id, { likes_count: (post.likes_count || 0) + 1 });
                }
                setLiked(!liked);
              } finally {
                setLikeLoading(false);
              }
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${liked ? "bg-red-500/20" : "bg-black/40"}`}>
              <Heart className={`w-6 h-6 transition ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
            </div>
            <span className="text-xs text-white/70">{(post.likes_count || 0) + (liked ? 1 : 0)}</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                setShowSignUpPrompt(true);
              } else {
                setShowComments(true);
              }
            }}
            className="flex flex-col items-center gap-1"
          >
          <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white/70">{commentCount}</span>
        </button>

        {isOwnPost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1A2744] border-[#243352]">
              <DropdownMenuItem onClick={() => onEdit(post)} className="text-[#F5F5F0] hover:bg-[#243352] cursor-pointer">
                <Edit2 className="w-4 h-4 mr-2" />Edit Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                <Trash2 className="w-4 h-4 mr-2" />Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-14 p-4 z-10">
        {/* Author */}
        <Link
          to={post.created_by ? `/PublicProfile?email=${post.created_by}` : "#"}
          className="flex items-center gap-2 mb-2 hover:opacity-80 transition"
        >
          <div className="w-9 h-9 rounded-full bg-[#FF6B35]/30 border-2 border-[#FF6B35]/60 flex items-center justify-center text-sm font-bold text-[#FF6B35] overflow-hidden">
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (post.author_name || "U")[0].toUpperCase()
            )}
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              {post.author_name || "Anonymous"}
            </span>
            {creatorBadges.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40 px-1.5 py-0.5 rounded-full">
                👨‍🍳 Top Chef
              </span>
            )}
          </div>
        </Link>

        {/* Caption */}
        <p className="text-sm text-white/90 leading-snug mb-2 line-clamp-2">{post.caption}</p>

        {/* AI Recipe toggle */}
        {hasAiRecipe && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[#FF6B35] text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Recipe: {post.ai_recipe_guess.title}
              {expanded ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronUp className="w-3.5 h-3.5 ml-1" />}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-black/60 backdrop-blur-sm rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-[#C4C4BA] uppercase tracking-wider">Ingredients</p>
                    {(Array.isArray(post.ai_recipe_guess.ingredients) ? post.ai_recipe_guess.ingredients : []).map((ing, i) => (
                      <p key={i} className="text-xs text-[#C4C4BA]">• {ing.quantity} {ing.unit} {ing.name}</p>
                    ))}
                    <Button
                      onClick={() => onSaveRecipe(post)}
                      size="sm"
                      className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-lg mt-1"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
                      Save to My Recipes
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CommentModal
        open={showComments}
        onClose={() => setShowComments(false)}
        post={post}
        currentUser={currentUser}
      />

      {/* Sign Up Prompt Modal */}
      {showSignUpPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2744] rounded-2xl max-w-sm w-full p-6 text-center">
            <p className="text-[#F5F5F0] font-semibold mb-4">Sign up to use this feature</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/signup")}
                className="w-full bg-[#FF6B35] text-white font-semibold py-3 rounded-xl hover:bg-[#FF8555] transition"
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowSignUpPrompt(false)}
                className="w-full bg-[#243352] text-[#C4C4BA] font-medium py-3 rounded-xl hover:bg-[#2A3F54] transition"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}