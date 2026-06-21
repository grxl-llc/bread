import { base44 } from "@/api/base44Client";

export async function calculateNutrition(recipe) {
  const ingredientsList = recipe.ingredients
    ?.map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
    .join(", ");

  if (!ingredientsList) {
    return null;
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Calculate the total nutrition information for a recipe with these ingredients: ${ingredientsList}. The recipe makes ${recipe.servings || 4} servings. Provide total values (not per serving).`,
    response_json_schema: {
      type: "object",
      properties: {
        calories: { type: "number" },
        protein: { type: "number" },
        carbs: { type: "number" },
        fat: { type: "number" },
        fiber: { type: "number" },
        sugar: { type: "number" },
        sodium: { type: "number" },
      },
    },
  });

  return result;
}