import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import CategoryBar from "../components/feed/CategoryBar";
import PostCard from "../components/feed/PostCard";
import CreatePostModal from "../components/feed/CreatePostModal";
import AdCard from "../components/feed/AdCard";
import { calculateAndUpdateBadges } from "../components/badges/badgeUtils";
import PullToRefresh from "../components/shared/PullToRefresh";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [user, setUser] = useState(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", selectedCategory],
    queryFn: () => {
      if (selectedCategory === "all") {
        return base44.entities.Post.list("-created_date", 50);
      }
      return base44.entities.Post.filter({ category: selectedCategory }, "-created_date", 50);
    },
  });

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowCreatePost(true);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleSaveRecipe = async (post) => {
    if (!user) { setShowSignUpPrompt(true); return; }
    const aiRecipe = post.ai_recipe_guess;
    if (!aiRecipe?.title) return;
    try {
      await base44.entities.Recipe.create({
        title: aiRecipe.title,
        ingredients: aiRecipe.ingredients || [],
        instructions: aiRecipe.instructions || [],
        image_url: post.media_url || null,
        is_public: false,
      });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      alert("Recipe saved to your collection!");
    } catch {
      alert("Could not save recipe. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col">
      {/* Sticky top area: header + share prompt + categories */}
      <div className="flex-shrink-0">
        <div className="pt-4 px-5 pb-2">
          {/* Share prompt */}
          <button
            onClick={() => user ? setShowCreatePost(true) : setShowSignUpPrompt(true)}
            className="w-full bg-[#1A2744] rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-[#243352] transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <span className="text-sm text-[#C4C4BA]/60">What are you eating today?</span>
          </button>
        </div>

        {/* Categories */}
        <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {/* Snap-scroll feed */}
      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ["posts"] })}>
      {isLoading ? (
        <div className="flex-1 flex flex-col gap-4 px-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1A2744] rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
          <span className="text-5xl mb-4">🍞</span>
          <p className="text-base font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share a meal!</p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`.feed-scroll::-webkit-scrollbar{display:none}`}</style>
          {posts.map((post, index) => {
            const elements = [
              <PostCard
                key={post.id}
                post={post}
                onSaveRecipe={handleSaveRecipe}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                currentUserEmail={user?.email}
              />
            ];

            const adInterval = 6 + (index % 3);
            if ((index + 1) % adInterval === 0 && index !== posts.length - 1) {
              elements.push(
                <div key={`ad-${index}`} className="snap-start flex-shrink-0">
                  <AdCard index={Math.floor(index / adInterval)} />
                </div>
              );
            }

            return elements;
          })}
        </div>
      )}

      </PullToRefresh>
      {/* Create Post Modal */}
      <CreatePostModal
      open={showCreatePost}
      onClose={() => {
      setShowCreatePost(false);
      setEditingPost(null);
      }}
      onCreated={() => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setEditingPost(null);
      }}
      userName={user?.full_name}
      editPost={editingPost}
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