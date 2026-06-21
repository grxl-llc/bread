from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any
from app.auth.dependencies import get_optional_user
from app.models.user import User
from app.services.llm import invoke_llm

router = APIRouter(prefix="/llm", tags=["llm"])


class InvokeLLMRequest(BaseModel):
    prompt: str
    response_json_schema: Optional[Any] = None


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
