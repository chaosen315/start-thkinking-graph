# Contributing

Thanks for your interest in contributing! This project welcomes issues and pull requests.

## Development Setup
- Python `>= 3.13`
- Dependencies via `uv`

```powershell
uv init
uv add flask openai python-dotenv pytest
$env:LLM_API_KEY="your-api-key"
uv run python app.py
```

## Testing
```powershell
uv run python -m pytest -q
```

## Guidelines
- Use small, focused PRs with clear descriptions
- Ensure tests pass; add tests for new features
- Do not commit secrets; use `.env` and keep it out of VCS
- Follow project structure and existing style

## Releases
- Semantic versioning (SemVer)
- Please include a CHANGELOG entry for user-visible changes
