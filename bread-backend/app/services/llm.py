import json
import base64
import httpx
import anthropic
from app.config import settings

_client = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


async def invoke_llm(prompt: str, response_json_schema=None) -> dict:
    """
    Invoke Claude with a prompt, optionally requesting a structured JSON response.
    Mirrors Base44's InvokeLLM interface.
    """
    client = get_client()

    system = "You are a helpful assistant for a food and cooking app called Bread."
    if response_json_schema:
        system += (
            " Respond ONLY with valid JSON that matches this schema: "
            + json.dumps(response_json_schema)
            + ". No explanation, no markdown, just the JSON object."
        )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text.strip()

    if response_json_schema:
        # Strip markdown code fences if Claude added them
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            if text.endswith("```"):
                text = text[: text.rfind("```")]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON response", "raw": text}

    return {"output": text}


def _parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from a model response."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[: text.rfind("```")]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON response", "raw": text}


async def guess_recipe_from_image(image_url: str, caption: str = "") -> dict:
    """
    Use Claude VISION to guess a recipe from a food photo.
    The image is passed as a real image block (not a text URL), so Claude
    actually sees the dish. The post caption is used as a strong hint so the
    recipe matches what the user actually made (e.g. "Cheese Biscuits").
    Returns {title, ingredients: [{name, quantity, unit}], instructions: [str]}
    """
    client = get_client()

    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "quantity": {"type": "string"},
                        "unit": {"type": "string"},
                    },
                },
            },
            "instructions": {"type": "array", "items": {"type": "string"}},
        },
    }

    system = (
        "You are a chef assistant for a cooking app called Bread. "
        "Given a food photo (and the cook's caption), identify the dish and "
        "produce a best-guess recipe. The recipe MUST include clear step-by-step "
        "instructions, and the ingredients must reflect the captioned dish "
        "(e.g. if it says 'Cheese Biscuits', include cheese). "
        "Respond ONLY with valid JSON matching this schema: "
        + json.dumps(schema)
        + ". Use common measurement units (oz, lbs, cups, tbsp, tsp, pcs). "
        "No explanation, no markdown — just the JSON object."
    )

    user_text = "Identify this dish and give a best-guess recipe with steps."
    if caption and caption.strip():
        user_text = (
            f'The cook captioned this dish: "{caption.strip()}". '
            "Use that as a strong hint for what it is. " + user_text
        )

    # Download the image server-side and send it as base64. This is the most
    # reliable path: it works on any SDK version and doesn't require Anthropic
    # to fetch the URL (the backend reaches S3 directly).
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as http:
            resp = await http.get(image_url)
            resp.raise_for_status()
            img_bytes = resp.content
            media_type = (resp.headers.get("content-type") or "image/jpeg").split(";")[0]
    except Exception as e:
        return {"error": f"Could not load the image: {e}"}

    if media_type not in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        media_type = "image/jpeg"
    b64 = base64.standard_b64encode(img_bytes).decode("utf-8")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                {"type": "text", "text": user_text},
            ],
        }],
    )

    return _parse_json(message.content[0].text)
