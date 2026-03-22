"""
Snowflake Cortex client — AI-driven savings suggestions via COMPLETE function.

Uses username/password auth (externalbrowser is interactive-only, not usable server-side).
Account: VHRTSNV-QIC29014 / User: THEEGREENGENIE

Set SNOWFLAKE_PASSWORD for your user in Atlas → Snowflake console:
  Admin → Users & Roles → THEEGREENGENIE → Reset Password
"""
from __future__ import annotations

from app.core.config import settings
from app.schemas.finance import ParsedTransaction, SavingsSuggestion

_CORTEX_PROMPT = """
You are a personal finance advisor. A user has the following spending transactions:

{transactions}

Give 3 concise, actionable savings suggestions in JSON array format:
[{{"category": "...", "suggestion": "...", "estimated_savings": <number or null>}}]
Respond with valid JSON only.
"""


def get_suggestions(transactions: list[ParsedTransaction]) -> list[SavingsSuggestion]:
    if not (settings.SNOWFLAKE_ACCOUNT and settings.SNOWFLAKE_USER and settings.SNOWFLAKE_PASSWORD):
        return []  # no credentials — let the chain continue to next provider

    try:
        import snowflake.connector  # type: ignore

        conn = snowflake.connector.connect(
            account=settings.SNOWFLAKE_ACCOUNT,
            user=settings.SNOWFLAKE_USER,
            password=settings.SNOWFLAKE_PASSWORD,
            warehouse=settings.SNOWFLAKE_WAREHOUSE or "COMPUTE_WH",
            database=settings.SNOWFLAKE_DATABASE or "SNOWFLAKE",
            schema=settings.SNOWFLAKE_SCHEMA or "PUBLIC",
            role="ACCOUNTADMIN",
        )

        tx_lines = "\n".join(
            f"{t.date or 'unknown'} | {t.description} | ${t.amount:.2f} | {t.category or 'other'}"
            for t in transactions[:30]
        )
        prompt = _CORTEX_PROMPT.format(transactions=tx_lines).replace("'", "\\'")

        cur = conn.cursor()
        cur.execute(f"SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-7b', '{prompt}')")
        result = cur.fetchone()[0]
        conn.close()

        import json
        items = json.loads(result)
        return [
            SavingsSuggestion(
                category=item.get("category", "general"),
                suggestion=item.get("suggestion", ""),
                estimated_savings=item.get("estimated_savings"),
                source="snowflake",
            )
            for item in items
        ]
    except ImportError:
        return _stub_suggestions()
    except Exception:
        return _stub_suggestions()


def _stub_suggestions() -> list[SavingsSuggestion]:
    return [
        SavingsSuggestion(
            category="general",
            suggestion="[Snowflake stub] Set SNOWFLAKE_PASSWORD to activate Cortex AI suggestions.",
            source="snowflake",
        )
    ]
