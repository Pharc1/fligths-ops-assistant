from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PostJson = Callable[[str, str, dict[str, Any]], dict[str, Any]]


class AIGatewayHTTPError(RuntimeError):
    pass


def join_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def post_json(url: str, api_key: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise AIGatewayHTTPError(f"AI Gateway HTTP {exc.code}: {error_body}") from exc
    except URLError as exc:
        raise AIGatewayHTTPError(f"AI Gateway request failed: {exc.reason}") from exc
