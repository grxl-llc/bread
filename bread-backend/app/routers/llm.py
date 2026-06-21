from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from app.auth.dependencies import get_optional_user, get_current_user
from app.models.user import User
from app.services.llm import invoke_llm, guess_recipe_from_image

router = APIRouter(prefix="/llm", tags=["llm"])


class InvokeLLMRequest(BaseModel):
    prompt: str
    response_json_schema: Optional[Any] = None


class GuessRecipeRequest(BaseModel):
    image_url: str


@router.post("/invoke")
async def invoke(
    body: InvokeLLMRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Call Claude with a prompt.
    Mirrors Base44's integrations.Core.InvokeLLM interface.
    """
    result = await invoke_llm(body.prompt, body.response_json_schema)
    return result


@router.post("/guess-recipe")
async def guess_recipe(
    body: GuessRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Best-guess recipe from a food photo (Claude vision). Auth required — powers
    the "Best Guess Recipe" feature on social posts.
    """
    if not body.image_url:
        raise HTTPException(422, "image_url required")
    try:
        return await guess_recipe_from_image(body.image_url)
    except Exception as e:
        # Surface the actual reason so the client can show something useful.
        return {"error": str(e)}
