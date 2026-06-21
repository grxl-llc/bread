import json
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


async def guess_recipe_from_image(image_url: str) -> dict:
    """
    Use Claude VISION to guess a recipe from a food photo.
    The image is passed as a real image block (not a text URL), so Claude
    actually sees the dish. Returns
    {title, ingredients: [{name, quantity, unit}], instructions: [str]}
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
        "Given a food photo, identify the dish and produce a best-guess recipe. "
        "Respond ONLY with valid JSON matching this schema: "
        + json.dumps(schema)
        + ". Use common measurement units (oz, lbs, cups, tbsp, tsp, pcs). "
        "No explanation, no markdown — just the JSON object."
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "url", "url": image_url}},
                {"type": "text", "text": "Identify this dish and give a best-guess recipe."},
            ],
        }],
    )

    return _parse_json(message.content[0].text)
