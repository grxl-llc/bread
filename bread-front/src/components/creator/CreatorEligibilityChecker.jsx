import { base44 } from "@/api/base44Client";

export async function checkCreatorEligibility(userEmail) {
  // Fetch user data
  const users = await base44.entities.User.filter({ email: userEmail });
  if (!users || users.length === 0) return false;
  const user = users[0];

  // Check eligibility criteria
  const hasFollowers = (user.followers_count || 0) >= 100;
  
  // Check public recipes
  const recipes = await base44.entities.Recipe.filter({ created_by: userEmail });
  const publicRecipes = recipes.filter((r) => r.is_public);
  const hasPublicRecipes = publicRecipes.length >= 5;
  
  // Check creator badges (excluding "creator" itself)
  const badges = user.badges || [];
  const creatorBadges = badges.filter(
    (b) => b !== "creator" && ["recipe_master", "meal_prep_pro", "budget_chef", "speed_chef", "influencer"].includes(b)
  );
  const hasCreatorBadges = creatorBadges.length >= 3;
  
  // Check for at least 1 tutorial
  const tutorials = await base44.entities.Tutorial.filter({ creator_email: userEmail });
  const hasTutorial = tutorials.length >= 1;

  const isEligible = hasFollowers && hasPublicRecipes && hasCreatorBadges && hasTutorial;

  return {
    isEligible,
    criteria: {
      hasFollowers,
      hasPublicRecipes,
      hasCreatorBadges,
      hasTutorial,
    },
  };
}

export async function grantCreatorBadge(userEmail) {
  const { isEligible } = await checkCreatorEligibility(userEmail);
  
  if (isEligible) {
    const users = await base44.entities.User.filter({ email: userEmail });
    if (users && users.length > 0) {
      const user = users[0];
      const badges = user.badges || [];
      
      if (!badges.includes("creator")) {
        badges.push("creator");
        await base44.entities.User.update(user.id, { badges });
        
        // Send notification
        await base44.entities.Notification.create({
          user_email: userEmail,
          type: "badge_unlock",
          title: "Creator Badge Unlocked! 🎉",
          message: "You've unlocked the Creator badge! You can now monetize your content.",
        });
        
        return true;
      }
    }
  }
  
  return false;
}