import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, BookOpen, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TutorialCard from "../components/tutorials/TutorialCard";
import RecipeCard from "../components/recipes/RecipeCard";
import RecipeDetail from "../components/recipes/RecipeDetail";

export default function PublicProfile() {
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!email) return;
    base44.entities.User.filter({ email }).then((users) => {
      if (users.length > 0) setProfileUser(users[0]);
      setLoading(false);
    });
  }, [email]);

  // Check if current user already follows this profile
  useEffect(() => {
    if (!currentUser || !profileUser) return;
    const followingList = currentUser.following_list || [];
    setFollowing(followingList.includes(profileUser.id));
  }, [currentUser, profileUser]);

  const { data: tutorials = [] } = useQuery({
    queryKey: ["public-tutorials", email],
    queryFn: () => base44.entities.Tutorial.filter({ creator_email: email }, "-created_date", 20),
    enabled: !!email,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["public-recipes", email],
    queryFn: () => base44.entities.Recipe.filter({ created_by: email, is_public: true }, "-created_date", 50),
    enabled: !!email,
  });

  const isCreator = profileUser?.is_creator || profileUser?.badges?.includes("creator");
  const isOwnProfile = currentUser?.email === email;

  const handleFollow = async () => {
    if (!currentUser) return;
    const followingList = currentUser.following_list || [];
    const delta = following ? -1 : 1;

    if (following) {
      const existingFollows = await base44.entities.Follow.filter({ follower_id: currentUser.id, following_id: profileUser.id });
      if (existingFollows.length > 0) await base44.entities.Follow.delete(existingFollows[0].id);
    } else {
      await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: profileUser.id });
      // Notify the person being followed
      await base44.entities.Notification.create({
        user_email: profileUser.email,
        type: "follower",
        title: "New Follower",
        message: `${currentUser.full_name || currentUser.email} started following you`,
        actor_name: currentUser.full_name || currentUser.email,
        actor_email: currentUser.email,
        link: `/PublicProfile?email=${currentUser.email}`,
      });
    }

    // Update follower count on target user
    await base44.entities.User.update(profileUser.id, {
      followers_count: Math.max(0, (profileUser.followers_count || 0) + delta),
    });
    // Update following count + list on current user
    const updatedList = following
      ? followingList.filter((id) => id !== profileUser.id)
      : [...followingList, profileUser.id];
    await base44.auth.updateMe({
      following_list: updatedList,
      following_count: Math.max(0, (currentUser.following_count || 0) + delta),
    });

    setFollowing(!following);
    setProfileUser((prev) => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) + delta) }));
  };

  const handleMessage = () => {
    navigate(`/Chat?userId=${profileUser.id}&name=${encodeURIComponent(profileUser.full_name || "User")}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <p className="text-[#C4C4BA]">Loading...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center gap-4">
        <p className="text-[#C4C4BA]">User not found.</p>
        <Button onClick={() => navigate(-1)} className="bg-[#1A2744] text-[#F5F5F0]">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A] pb-6">
      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[#C4C4BA] hover:text-[#F5F5F0]">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-b from-[#1A2744] to-[#15233A] pt-4 px-5 pb-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-3xl font-bold text-[#FF6B35] mb-3 overflow-hidden">
            {profileUser.avatar_url ? (
              <img src={profileUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              profileUser.full_name?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">{profileUser.full_name}</h1>

          {isCreator && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40 px-2.5 py-0.5 rounded-full mb-2">
              👨‍🍳 Top Chef
            </span>
          )}

          <div className="flex items-center gap-8 text-sm mt-2 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-[#F5F5F0]">{profileUser.followers_count || 0}</p>
              <p className="text-xs text-[#C4C4BA]">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#F5F5F0]">{profileUser.following_count || 0}</p>
              <p className="text-xs text-[#C4C4BA]">Following</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#F5F5F0]">{tutorials.length + recipes.length}</p>
              <p className="text-xs text-[#C4C4BA]">Posts</p>
            </div>
          </div>

          {/* Action buttons — hidden on own profile */}
          {!isOwnProfile && (
            <div className="flex gap-3 w-full max-w-xs">
              <Button
                onClick={handleFollow}
                className={`flex-1 rounded-xl h-10 text-sm font-semibold gap-2 ${
                  following
                    ? "bg-[#243352] text-[#C4C4BA] hover:bg-red-500/20 hover:text-red-400"
                    : "bg-[#FF6B35] hover:bg-[#FF8555] text-white"
                }`}
              >
                {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {following ? "Following" : "Follow"}
              </Button>
              <Button
                onClick={handleMessage}
                className="flex-1 bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-10 text-sm font-semibold gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="recipes">
          <TabsList className="bg-[#1A2744] border border-[#243352] rounded-xl p-1 mb-4 w-full grid grid-cols-2">
            <TabsTrigger
              value="recipes"
              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-xs flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Recipes ({recipes.length})
            </TabsTrigger>
            <TabsTrigger
              value="tutorials"
              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-xs flex items-center gap-1"
            >
              <Video className="w-3 h-3" />
              Tutorials ({tutorials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes">
            {recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#C4C4BA]/40">
                <BookOpen className="w-10 h-10 mb-2" />
                <p className="text-sm">No public recipes yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-6">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={setSelectedRecipe} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tutorials">
            {tutorials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#C4C4BA]/40">
                <Video className="w-10 h-10 mb-2" />
                <p className="text-sm">No tutorials yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-6">
                {tutorials.map((tutorial) => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial} onClick={() => {}} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RecipeDetail
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ["public-recipes", email] })}
        onDelete={() => queryClient.invalidateQueries({ queryKey: ["public-recipes", email] })}
        onAddToGrocery={() => {}}
      />
    </div>
  );
}