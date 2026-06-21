import { base44 } from "@/api/base44Client";

export async function calculateAndUpdateBadges(userEmail) {
  try {
    // Fetch user data
    const users = await base44.entities.User.filter({ email: userEmail });
    if (users.length === 0) return;
    const user = users[0];

    // Fetch user's recipes
    const recipes = await base44.entities.Recipe.filter({ created_by: userEmail });
    
    const earnedBadges = [];

    // Rising Chef: 3+ public recipes
    const publicRecipes = recipes.filter(r => r.is_public);
    if (publicRecipes.length >= 3) {
      earnedBadges.push("Rising Chef");
    }

    // Meal Prep Pro: 5+ meal prep recipes
    const mealPrepRecipes = recipes.filter(r => r.category === "meal_prep");
    if (mealPrepRecipes.length >= 5) {
      earnedBadges.push("Meal Prep Pro");
    }

    // Budget Master: 3+ recipes under $10
    const budgetRecipes = recipes.filter(r => r.total_cost && r.total_cost < 10);
    if (budgetRecipes.length >= 3) {
      earnedBadges.push("Budget Master");
    }

    // Quick Cook: 3+ recipes with cook_time <= 15 minutes
    const quickRecipes = recipes.filter(r => r.cook_time && r.cook_time <= 15);
    if (quickRecipes.length >= 3) {
      earnedBadges.push("Quick Cook");
    }

    // Community Favorite: 10+ followers
    if (user.followers >= 10) {
      earnedBadges.push("Community Favorite");
    }

    // Update user badges if changed
    const currentBadges = user.badges || [];
    if (JSON.stringify(earnedBadges.sort()) !== JSON.stringify(currentBadges.sort())) {
      await base44.entities.User.update(user.id, { badges: earnedBadges });
    }

    return earnedBadges;
  } catch (error) {
    console.error("Error calculating badges:", error);
    return [];
  }
}