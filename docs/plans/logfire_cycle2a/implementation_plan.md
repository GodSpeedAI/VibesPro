# Logfire Cycle 2A — Phased TDD Implementation Plan

**Status**: Draft - Pass 1 (Header & Structure)
**Created**: November 3, 2025
**Target Completion**: TBD

---

## 1. Header

### Title

**Logfire Instrumentation Cycle 2A — Phased TDD Implementation Plan**

### Audience

Junior AI coding agents (A, B, C) working in parallel within the VibesPro template repository.

### Preconditions

-   [ ] Workspace trust enabled in VS Code
-   [ ] Environment setup complete: `just setup && just doctor`
-   [ ] All dependencies installed (Node, Python, Rust via mise/Devbox)
-   [ ] Access to GitHub repository with write permissions
-   [ ] MCP servers configured (GitHub, Context7, Exa, Ref, Vibe Check, Memory)

### Branching & Coordination Rules

**Branch Naming Convention:**

-   Cycle A: `feature/logfire-cycle2a-foundations-agent-a`
-   Cycle B: `feature/logfire-cycle2a-testing-agent-b`
-   Cycle C: `feature/logfire-cycle2a-docs-agent-c`

**Coordination Matrix:**

```
┌─────────┬──────────────┬─────────────────┬──────────────┐
│ Cycle   │ Dependencies │ Can Start After │ Parallel With│
├─────────┼──────────────┼─────────────────┼──────────────┤
│ A       │ None         │ Immediately     │ None         │
│ B       │ A-GREEN      │ A completes     │ C            │
│ C       │ A-GREEN      │ A completes     │ B            │
└─────────┴──────────────┴─────────────────┴──────────────┘
```

**Sync Protocol:**

1. Always sync with `origin/dev` before starting any cycle
2. Create branch from latest `dev` HEAD
3. Use GitHub MCP for all branching operations
4. PR must pass CI before merge
5. Each cycle gets independent PR, merged sequentially (A → B → C)

**CI/CD Workflows:**

-   **Primary**: `.github/workflows/ai-validate.yml` (lint, typecheck, test)
-   **Secondary**: `.github/workflows/spec-guard.yml` (spec validation)
-   **Observability**: `.github/workflows/observability.yml` (logging tests)

**Success Criteria per Cycle:**

-   All tests passing (`just test`)
-   Lint clean (`just ai-validate`)
-   Spec traceability verified (`just spec-guard`)
-   Documentation updated and validated (`just docs-lint`)
-   PR approved and CI green

---

## 2. Repository Analysis

### 2.1 Repository Structure Overview

VibesPro is a **Copier template repository** that generates Nx monorepos. Key characteristics:

-   **Template Location**: `templates/{{project_slug}}/` contains Jinja2 templates
-   **This Repo**: Contains template source code and tooling
-   **Generated Projects**: Separate directories created by users via Copier
-   **Architecture**: Hexagonal (domain ← application ← infrastructure)
-   **Build System**: Nx workspace with pnpm
-   **Task Orchestration**: Just (804 lines of recipes in `justfile`)
-   **Environment**: Devbox + mise + SOPS + Just layered approach

### 2.2 Current State of Logfire Implementation

**What Exists (Cycle 1 - Complete):**

-   ✅ `libs/python/vibepro_logging.py` - Core Logfire helpers (131 lines)
    -   `configure_logger()` - Working
    -   `bootstrap_logfire(app)` - **Implemented but marked as Cycle 2A incomplete in docs**
    -   `default_metadata()` - Working
    -   `get_logger()` - Working
    -   `instrument_integrations()` - Working
    -   `LogCategory` class - Working
-   ✅ `tools/logging/test_logfire.py` - Basic smoke test (76 lines)
-   ✅ `tests/python/test_logfire_bootstrap.py` - FastAPI instrumentation tests
-   ✅ Environment variable documentation
-   ✅ CI integration via `.github/workflows/ai-validate.yml`

**What's Missing (Cycle 2A - This Plan):**

-   ⚠️ TODO markers in template documentation
-   ⚠️ Incomplete references in main docs
-   ⚠️ Checklist items in `docs/dev_tdd.md` not marked complete
-   ⚠️ Enhanced smoke tests for edge cases
-   ⚠️ Complete validation suite integration

### 2.3 Files to Modify or Create

#### Category 1: Core Implementation (Already Functional - Verify Only)

| File                              | Action     | Reason                                                  | Lines |
| --------------------------------- | ---------- | ------------------------------------------------------- | ----- |
| `libs/python/vibepro_logging.py`  | **VERIFY** | Core helpers already implemented; validate completeness | 131   |
| `libs/python/logging_settings.py` | **VERIFY** | Settings already exist; ensure alignment                | ~30   |

#### Category 2: Testing & Validation (Enhance)

| File                                     | Action      | Reason                                              | Lines |
| ---------------------------------------- | ----------- | --------------------------------------------------- | ----- |
| `tools/logging/test_logfire.py`          | **ENHANCE** | Add edge case coverage (missing token, env vars)    | +30   |
| `tests/python/test_logfire_bootstrap.py` | **ENHANCE** | Add integration tests (SQLAlchemy, httpx, requests) | +50   |
| `tests/ops/test_vector_logfire.sh`       | **VERIFY**  | Ensure Vector pipeline captures Logfire metadata    | ±0    |
| `justfile:739`                           | **VERIFY**  | Confirm `test-logs` recipe covers all cases         | ±0    |

#### Category 3: Documentation Updates (Remove TODOs)

| File                                                          | Action     | Reason                                            | Lines   |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------- | ------- |
| `templates/{{project_slug}}/docs/observability/logging.md.j2` | **UPDATE** | Remove "Cycle 2A will extend..." TODO on line 5-6 | -2, +5  |
| `docs/observability/README.md:850`                            | **UPDATE** | Remove "Phase 3 Logfire integration" TODO comment | -1, +10 |
| `docs/dev_tdd.md:29,69`                                       | **UPDATE** | Mark Cycle 2A checklist items as complete `[x]`   | ±20     |
| `docs/ENVIRONMENT.md`                                         | **VERIFY** | Ensure Logfire examples are current               | ±0      |

#### Category 4: Traceability & Specs (Update)

| File                          | Action     | Reason                                       | Lines |
| ----------------------------- | ---------- | -------------------------------------------- | ----- |
| `docs/traceability_matrix.md` | **UPDATE** | Mark DEV-PRD-018, DEV-SDS-018 items complete | +5    |
| `docs/dev_spec_index.md`      | **VERIFY** | Ensure Logfire specs properly indexed        | ±0    |

### 2.4 Dependencies & Related Components

**Internal Dependencies:**

-   `libs/python/vibepro_logging.py` ← FastAPI apps (via `bootstrap_logfire`)
-   Vector configuration (`ops/vector/`) ← Logfire OTLP output
-   OpenObserve sink ← Vector output
-   Just recipes (`justfile:709-750`) ← Test orchestration

**External Dependencies:**

-   `logfire` Python package (already in `pyproject.toml`)
-   `fastapi` (for instrumentation)
-   `opentelemetry-sdk` (for test verification)
-   `pytest`, `pytest-asyncio` (for testing)

**Affected Components:**

-   Generated projects using `bootstrap_logfire()` in `apps/*/src/main.py`
-   Template scaffolding in `hooks/post_gen.py:478` (creates FastAPI services)
-   Service generator tests in `tests/generators/service.logfire.test.ts`

### 2.5 Key Guardrails

**Build & Validation:**

-   `just ai-validate` - Lint, typecheck, optional tests
-   `just test` - All test suites (Node, Python, Shell, Integration)
-   `just spec-guard` - Full quality gate (specs, prompts, docs, tests)
-   `just test-logs` - Logging-specific validation suite
-   `just docs-lint` - Documentation validation and link checking

**CI Workflows:**

-   `.github/workflows/ai-validate.yml` - Primary CI (runs on PR)
-   `.github/workflows/spec-guard.yml` - Spec traceability enforcement
-   `.github/workflows/observability.yml` - Observability stack validation

**Specification Constraints:**

-   All changes must reference spec IDs in commits
-   Hexagonal architecture must be preserved
-   No breaking changes to public APIs
-   Security guidelines (precedence 10) override all others

---

## 3. Specification Mapping

### 3.1 Primary Specifications

This work directly implements and completes the following existing specs:

| Spec ID         | Title                                             | Location                  | Status                           | Cycle   |
| --------------- | ------------------------------------------------- | ------------------------- | -------------------------------- | ------- |
| **DEV-PRD-018** | Structured Logging Product Requirements (Logfire) | `docs/dev_prd.md`         | ✅ Implemented, docs incomplete  | A, C    |
| **DEV-SDS-018** | Structured Logging with Trace Correlation         | `docs/dev_sds.md:373-725` | ✅ Implemented, docs incomplete  | A, B, C |
| **DEV-PRD-021** | Template Synchronization & Documentation          | `docs/dev_prd.md`         | ⚠️ Partial (TODO markers remain) | C       |
| **DEV-SDS-005** | Log Sanitization Logic                            | `docs/dev_sds.md`         | ✅ Complete (Vector VRL)         | B       |
| **DEV-PRD-007** | CI & Task Wiring                                  | `docs/dev_prd.md`         | ✅ Complete                      | B       |
| **DEV-SDS-006** | Build & Test Integration                          | `docs/dev_sds.md`         | ✅ Complete                      | B       |
| **DEV-PRD-020** | Metadata Standardization                          | `docs/dev_prd.md`         | ✅ Complete                      | A       |
| **DEV-SDS-022** | Shared OTEL Environment Binding                   | `docs/dev_sds.md`         | ✅ Complete                      | A       |
| **DEV-PRD-023** | Regression Testing Requirements                   | `docs/dev_prd.md`         | ⚠️ Needs enhanced coverage       | B       |

### 3.2 Referenced Architectural Decisions

| ADR ID          | Title                         | Relevance                             | Location          |
| --------------- | ----------------------------- | ------------------------------------- | ----------------- |
| **DEV-ADR-016** | Observability Architecture    | Defines Vector → OpenObserve pipeline | `docs/dev_adr.md` |
| **DEV-ADR-017** | Rust Instrumentation Strategy | Complements Python logging            | `docs/dev_adr.md` |
| **DEV-ADR-021** | Nx Generator Design           | Affects service scaffolding           | `docs/dev_adr.md` |

### 3.3 Specification Gaps Identified

**No new specs required** — all work maps to existing specifications. However, we need to:

1. **Update completion status** in `docs/dev_tdd.md` Cycle 2A checkboxes
2. **Remove TODO markers** indicating Cycle 2A is incomplete
3. **Add traceability entries** in `docs/traceability_matrix.md`

### 3.4 Deliverable-to-Spec Mapping

#### Cycle A: Core Verification & Enhancements

| Deliverable                               | File(s)                          | Satisfies Specs          | Notes                                          |
| ----------------------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------- |
| Verify `bootstrap_logfire()` completeness | `libs/python/vibepro_logging.py` | DEV-PRD-018, DEV-SDS-018 | Already implemented; validate edge cases       |
| Verify `configure_logger()` completeness  | `libs/python/vibepro_logging.py` | DEV-PRD-018, DEV-SDS-018 | Already implemented; validate metadata binding |
| Verify `default_metadata()` alignment     | `libs/python/vibepro_logging.py` | DEV-PRD-020, DEV-SDS-022 | Already implemented; ensure OTEL compatibility |
| Enhanced smoke tests                      | `tools/logging/test_logfire.py`  | DEV-PRD-023              | Add edge case coverage                         |

#### Cycle B: Testing & Validation

| Deliverable                          | File(s)                                  | Satisfies Specs                       | Notes                                    |
| ------------------------------------ | ---------------------------------------- | ------------------------------------- | ---------------------------------------- |
| FastAPI integration tests (enhanced) | `tests/python/test_logfire_bootstrap.py` | DEV-PRD-018, DEV-SDS-018              | Add SQLAlchemy, httpx, requests coverage |
| Vector pipeline validation           | `tests/ops/test_vector_logfire.sh`       | DEV-SDS-005, DEV-PRD-018              | Verify OTLP metadata capture             |
| Regression test suite                | `justfile:739`, CI workflows             | DEV-PRD-007, DEV-SDS-006, DEV-PRD-023 | Ensure all `test-logs` cases pass        |

#### Cycle C: Documentation & Templates

| Deliverable                   | File(s)                                                           | Satisfies Specs          | Notes                                          |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| Remove template TODO markers  | `templates/{{project_slug}}/docs/observability/logging.md.j2:5-6` | DEV-PRD-021              | Replace with complete instrumentation guidance |
| Remove main docs TODO markers | `docs/observability/README.md:850`                                | DEV-PRD-021              | Update Phase 3 reference to "Complete"         |
| Mark TDD checklist complete   | `docs/dev_tdd.md:29,69`                                           | DEV-PRD-018, DEV-SDS-018 | Change `[ ]` to `[x]` for Cycle 2A items       |
| Update traceability matrix    | `docs/traceability_matrix.md`                                     | All above                | Add completion evidence for Cycle 2A           |
| Validate environment docs     | `docs/ENVIRONMENT.md`                                             | DEV-PRD-018              | Ensure Logfire examples match implementation   |

### 3.5 Success Criteria per Spec

**DEV-PRD-018 & DEV-SDS-018 (Primary):**

-   ✅ `bootstrap_logfire(app)` instruments FastAPI with OTLP spans
-   ✅ `configure_logger(service)` returns properly configured Logfire instance
-   ✅ Metadata includes `service`, `environment`, `application_version`
-   ✅ Integration tests validate FastAPI, SQLAlchemy, httpx, requests
-   ✅ Documentation accurately reflects implementation (no TODO markers)
-   ✅ Generated projects use `bootstrap_logfire()` correctly

**DEV-PRD-021 (Documentation Sync):**

-   ✅ Template docs reflect complete Cycle 2A implementation
-   ✅ No references to "future work" or "Cycle 2A pending"
-   ✅ Examples and walkthroughs are accurate and tested
-   ✅ `just docs-lint` passes with no warnings

**DEV-PRD-023 (Regression Testing):**

-   ✅ `just test-logs` executes full validation suite
-   ✅ Edge cases covered (missing env vars, invalid configs, no token)
-   ✅ CI workflows enforce logging tests on every PR
-   ✅ Vector pipeline validation (`test_vector_logfire.sh`) passes

---

## 4. Cycles (MECE)

### Cycle A — Foundations & Core Verification (BLOCKING)

**Owner**: Agent A
**Branch**: `feature/logfire-cycle2a-foundations-agent-a`
**Dependencies**: None (can start immediately)
**Blocks**: Cycles B and C
**Estimated Duration**: 2-4 hours

---

#### A.1 Preparation

-   [ ] **GitHub MCP**: Create and sync branch

    ```bash
    # Via MCP or manually:
    git checkout dev
    git pull origin dev
    git checkout -b feature/logfire-cycle2a-foundations-agent-a
    ```

-   [ ] **Memory MCP**: Record initial assumptions

    ```
    Session: logfire-cycle2a-foundations
    Assumptions:
    - bootstrap_logfire() already functional per tests/python/test_logfire_bootstrap.py
    - Need to verify edge cases (missing env vars, no token, invalid config)
    - Documentation claims implementation incomplete, but code appears complete
    ```

-   [ ] **Baseline validation** (expect initial state)

    ```bash
    just test-logs-logfire
    # Expected: Basic smoke test passes

    python -c "from libs.python.vibepro_logging import bootstrap_logfire; print('Import OK')"
    # Expected: No import errors
    ```

-   [ ] **Context7 MCP**: Fetch Logfire/OTLP best practices

    ```
    Query: "Logfire Python FastAPI instrumentation best practices"
    Focus: Error handling, environment variable validation, graceful degradation
    ```

---

#### A.2 TDD Phase A (RED)

**Goal**: Add failing tests validating foundational edge cases and configuration scenarios.

-   [ ] **Test 1**: Missing `LOGFIRE_TOKEN` environment variable

    **File**: `tools/logging/test_logfire.py`
    **Why**: Verify graceful degradation when no token present
    **Spec**: DEV-PRD-018, DEV-SDS-018

    ```python
    def test_configure_without_token():
        """Verify Logfire configures in offline mode when LOGFIRE_TOKEN is unset."""
        import os
        old_token = os.environ.pop('LOGFIRE_TOKEN', None)
        try:
            logger = configure_logger('test-service')
            assert logger is not None
            # Should not raise; should configure in offline mode
        finally:
            if old_token:
                os.environ['LOGFIRE_TOKEN'] = old_token
    ```

    **Expected Result**: Test fails (function may not handle missing token gracefully)

-   [ ] **Test 2**: Invalid service name (empty string, None)

    **File**: `tools/logging/test_logfire.py`
    **Why**: Validate input sanitization
    **Spec**: DEV-PRD-020

    ```python
    def test_configure_with_invalid_service_name():
        """Verify sensible defaults when service name is invalid."""
        logger1 = configure_logger('')
        assert logger1 is not None

        logger2 = configure_logger(None)
        assert logger2 is not None
        # Both should fall back to default service name
    ```

    **Expected Result**: Test fails (may not have explicit validation)

-   [ ] **Test 3**: Environment variable overrides

    **File**: `tools/logging/test_logfire.py`
    **Why**: Ensure env vars take precedence
    **Spec**: DEV-SDS-018

    ```python
    def test_env_var_overrides():
        """Verify environment variables override function arguments."""
        import os
        os.environ['SERVICE_NAME'] = 'env-override-service'
        try:
            logger = configure_logger('arg-service')
            metadata = default_metadata()
            # Should respect argument over env var (or document precedence)
        finally:
            os.environ.pop('SERVICE_NAME', None)
    ```

    **Expected Result**: Test fails or clarifies precedence behavior

-   [ ] **Test 4**: Metadata completeness

    **File**: `tools/logging/test_logfire.py`
    **Why**: Validate all required OTEL fields present
    **Spec**: DEV-PRD-020, DEV-SDS-022

    ```python
    def test_metadata_completeness():
        """Verify default_metadata() includes all required OTEL fields."""
        metadata = default_metadata('test-svc')
        assert 'service' in metadata
        assert 'environment' in metadata
        assert 'application_version' in metadata
        assert metadata['service'] == 'test-svc'
    ```

    **Expected Result**: Test passes (validates existing implementation)

-   [ ] **Run RED phase tests**

    ```bash
    uv run python tools/logging/test_logfire.py
    # Expected: At least 1-2 tests fail, revealing edge cases
    ```

---

#### A.3 TDD Phase A (GREEN)

**Goal**: Implement minimal logic to make all RED tests pass.

-   [ ] **Fix 1**: Handle missing `LOGFIRE_TOKEN` gracefully

    **File**: `libs/python/vibepro_logging.py`
    **Change**: Ensure `send_to_logfire='if-token-present'` is default

    ```python
    def _configure_global_logfire(service_name: str, **kwargs) -> logfire.Logfire:
        configure_kwargs: dict[str, object] = {
            "service_name": service_name,
            "environment": os.getenv("APP_ENV", "local"),
            "send_to_logfire": kwargs.get("send_to_logfire", "if-token-present"),  # Explicit default
        }
        # ... rest of implementation
    ```

    **Why**: Graceful degradation when no token present
    **Spec**: DEV-PRD-018

-   [ ] **Fix 2**: Validate and sanitize service names

    **File**: `libs/python/vibepro_logging.py`
    **Change**: Add validation in `_resolve_service_name()`

    ```python
    def _resolve_service_name(service: str | None) -> str:
        resolved = service or os.getenv("SERVICE_NAME", "vibepro-py")
        # Sanitize: strip whitespace, ensure non-empty
        cleaned = resolved.strip() if resolved else "vibepro-py"
        return cleaned if cleaned else "vibepro-py"
    ```

    **Why**: Prevent invalid service names
    **Spec**: DEV-PRD-020

-   [ ] **Fix 3**: Document precedence rules for env vars

    **File**: `libs/python/vibepro_logging.py` (docstring)
    **Change**: Clarify that function argument takes precedence over env var

    ```python
    def configure_logger(service: str | None = None, **kwargs) -> logfire.Logfire:
        """
        Configure Logfire (once) and return a bound logger instance.

        Args:
            service: Optional service override. Takes precedence over SERVICE_NAME env var.
                     If None, falls back to SERVICE_NAME, then 'vibepro-py'.
            **kwargs: Additional keyword arguments forwarded to logfire.configure()
                      on the first invocation.

        Returns:
            Logfire-bound logger with default metadata pre-applied.
        """
    ```

    **Why**: Clear API contract
    **Spec**: DEV-SDS-018

-   [ ] **Verify 4**: Metadata completeness (should already pass)

    **Action**: No changes needed if test passes
    **File**: `libs/python/vibepro_logging.py`

-   [ ] **Run GREEN phase tests**

    ```bash
    uv run python tools/logging/test_logfire.py
    # Expected: All tests pass

    pytest tests/python/test_logfire_bootstrap.py
    # Expected: All existing FastAPI instrumentation tests still pass
    ```

-   [ ] **Enhanced smoke test script**

    **File**: `tools/logging/test_logfire.py`
    **Add**: More comprehensive validation in `main()`

    ```python
    def main() -> int:
        """Verify Logfire bootstrap helper availability and basic functionality."""
        _ensure_repo_root_on_path()

        # Existing import check
        try:
            module = importlib.import_module("libs.python.vibepro_logging")
        except ImportError as e:
            print(f"::error::Failed to import libs.python.vibepro_logging: {e}")
            return 1

        # Check required functions
        required_funcs = ['bootstrap_logfire', 'configure_logger', 'default_metadata']
        for func_name in required_funcs:
            if not hasattr(module, func_name):
                print(f"::error::Missing {func_name} in libs.python.vibepro_logging")
                return 1

        # Validate metadata structure
        metadata = module.default_metadata('smoke-test')
        required_keys = {'service', 'environment', 'application_version'}
        if not required_keys.issubset(metadata.keys()):
            print(f"::error::Metadata missing keys: {required_keys - metadata.keys()}")
            return 1

        print("✅ Logfire bootstrap helper is available and functional")
        return 0
    ```

---

#### A.4 Refactor & Regression

-   [ ] **Code quality review**

    ```bash
    # Run formatters
    uv run ruff format libs/python/vibepro_logging.py
    uv run ruff format tools/logging/test_logfire.py

    # Run linters
    uv run ruff check libs/python/vibepro_logging.py
    uv run mypy libs/python/vibepro_logging.py --strict
    ```

-   [ ] **Regression validation**

    ```bash
    # Full logging test suite
    just test-logs
    # Expected: All tests pass (config, redaction, correlation, logfire)

    # Full Python test suite
    pytest tests/python/
    # Expected: All tests pass

    # Validate no breaking changes
    just ai-validate
    # Expected: Lint, typecheck, tests all pass
    ```

-   [ ] **Vibe Check MCP**: Validate assumptions

    ```
    Goal: Complete Logfire Cycle 2A foundations
    Plan: Verified bootstrap_logfire() completeness, added edge case tests
    Progress: All GREEN tests passing, no regressions
    Uncertainties:
      - Are there other edge cases we haven't considered?
      - Is the precedence of service name (arg > env > default) clear enough?
    ```

-   [ ] **Memory MCP**: Record decisions

    ```
    Session: logfire-cycle2a-foundations
    Decisions:
      - Function arguments take precedence over environment variables
      - send_to_logfire defaults to 'if-token-present' for graceful degradation
      - Empty/None service names fall back to 'vibepro-py'
    Test Outcomes:
      - All edge case tests passing
      - Existing FastAPI instrumentation tests still green
      - No regressions in smoke tests or integration tests
    ```

-   [ ] **Commit changes**

    ```bash
    git add libs/python/vibepro_logging.py
    git add tools/logging/test_logfire.py
    git commit -m "feat(logging): validate Logfire Cycle 2A core implementation [DEV-PRD-018]

    - Enhanced smoke tests with edge case coverage (missing token, invalid service name)
    - Validated bootstrap_logfire() handles graceful degradation
    - Clarified service name precedence (arg > env > default)
    - Added metadata completeness validation
    - All tests passing, no regressions

    Satisfies: DEV-PRD-018, DEV-SDS-018, DEV-PRD-020, DEV-SDS-022"
    ```

-   [ ] **GitHub MCP**: Push branch and open PR

    ```
    Title: "feat(logging): Logfire Cycle 2A - Core Verification & Edge Cases"
    Body:
    ## Summary
    Completes Cycle 2A foundations by validating core Logfire implementation and adding edge case coverage.

    ## Changes
    - ✅ Enhanced `tools/logging/test_logfire.py` with edge case tests
    - ✅ Validated `bootstrap_logfire()` graceful degradation
    - ✅ Clarified service name precedence in docstrings
    - ✅ Ensured metadata completeness (service, environment, app version)

    ## Testing
    - All smoke tests passing
    - All integration tests passing
    - No regressions in `just test-logs`

    ## Specs
    - DEV-PRD-018 (Structured Logging)
    - DEV-SDS-018 (Trace Correlation)
    - DEV-PRD-020 (Metadata Standardization)
    - DEV-SDS-022 (OTEL Environment Binding)

    ## Next Steps
    - Merge this PR (Cycle A)
    - Unblock Cycles B (Testing) and C (Documentation) to run in parallel

    Label: GREEN
    Base: dev
    Head: feature/logfire-cycle2a-foundations-agent-a
    ```

---

#### A.5 Artifacts

**Deliverables:**

-   ✅ Enhanced `tools/logging/test_logfire.py` (76 → ~120 lines)
-   ✅ Validated `libs/python/vibepro_logging.py` (131 lines, edge cases confirmed)
-   ✅ Passing tests: all edge cases covered
-   ✅ Commit with spec IDs
-   ✅ PR opened with "A-GREEN" label

**Evidence:**

-   CI passing (`.github/workflows/ai-validate.yml`)
-   `just test-logs` all green
-   No lint/typecheck errors
-   Memory MCP session saved
-   Vibe Check findings documented

---

#### A.6 Parallelization Gate

**Gate Status**: 🚦 **A-GREEN**

**Conditions Met:**

-   All A.2 (RED) tests written
-   All A.3 (GREEN) tests passing
-   Regression suite clean
-   PR opened and CI green

**Unblocks:**

-   ✅ **Cycle B** (Testing & Validation) - Agent B can now start
-   ✅ **Cycle C** (Documentation & Templates) - Agent C can now start

**Coordination:**

-   Agents B and C must sync from `dev` after A is merged
-   Agents B and C can work in parallel once A-GREEN is confirmed
-   Final integration happens after both B and C are complete

---

### Cycle B — Testing & Validation (Depends on A; Parallel with C)

**Owner**: Agent B
**Branch**: `feature/logfire-cycle2a-testing-agent-b`
**Dependencies**: Cycle A complete (A-GREEN)
**Parallel With**: Cycle C
**Estimated Duration**: 3-5 hours

---

#### B.1 Preparation

-   [ ] **Wait for A-GREEN gate**

    ```bash
    # Confirm Cycle A is merged to dev
    git checkout dev
    git pull origin dev
    # Expected: Contains Cycle A changes
    ```

-   [ ] **GitHub MCP**: Create B branch from latest dev

    ```bash
    git checkout -b feature/logfire-cycle2a-testing-agent-b
    ```

-   [ ] **Memory MCP**: Review Cycle A findings

    ```
    Session: logfire-cycle2a-testing
    Context from Cycle A:
    - Core implementation validated (bootstrap_logfire, configure_logger)
    - Edge cases handled (missing token, invalid service names)
    - Metadata completeness confirmed

    Cycle B Focus:
    - Integration test coverage (SQLAlchemy, httpx, requests)
    - Vector pipeline validation (OTLP metadata capture)
    - Regression suite completeness
    ```

-   [ ] **Context7 MCP**: Retrieve integration testing patterns

    ```
    Query: "Logfire SQLAlchemy httpx requests instrumentation testing Python"
    Focus: Best practices for testing instrumented integrations, mock strategies
    ```

-   [ ] **Exa MCP**: External best practices

    ```
    Query: "Python OpenTelemetry testing best practices SQLAlchemy httpx"
    Focus: Span validation, trace context propagation, integration test patterns
    ```

---

#### B.2 TDD Phase B (RED)

**Goal**: Add failing tests covering complex integrations and Vector pipeline validation.

-   [ ] **Test 1**: SQLAlchemy instrumentation

    **File**: `tests/python/test_logfire_bootstrap.py`
    **Why**: Validate database query tracing
    **Spec**: DEV-PRD-018, DEV-SDS-018

    ```python
    def test_sqlalchemy_instrumentation_emits_spans():
        """Verify SQLAlchemy queries emit OTEL spans when instrumented."""
        from sqlalchemy import create_engine, text
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
        import logfire

        exporter = InMemorySpanExporter()
        processor = SimpleSpanProcessor(exporter)

        # Create in-memory SQLite engine
        engine = create_engine("sqlite:///:memory:")

        # Instrument SQLAlchemy
        logfire.configure(send_to_logfire=False, console=False, additional_span_processors=[processor])
        logfire.instrument_sqlalchemy(engine=engine)

        # Execute a query
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        spans = exporter.get_finished_spans()
        # Should have at least one span for the SQL query
        sql_spans = [s for s in spans if 'db.statement' in s.attributes]
        assert len(sql_spans) > 0, "Expected SQL query span"
        assert sql_spans[0].attributes.get('db.statement') == 'SELECT 1'
    ```

    **Expected Result**: Test fails (SQLAlchemy instrumentation not explicitly tested yet)

-   [ ] **Test 2**: httpx client instrumentation

    **File**: `tests/python/test_logfire_bootstrap.py`
    **Why**: Validate outbound HTTP request tracing
    **Spec**: DEV-PRD-018, DEV-SDS-018

    ```python
    def test_httpx_instrumentation_emits_spans():
        """Verify httpx outbound requests emit OTEL spans."""
        import httpx
        import logfire
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

        exporter = InMemorySpanExporter()
        processor = SimpleSpanProcessor(exporter)

        logfire.configure(send_to_logfire=False, console=False, additional_span_processors=[processor])
        logfire.instrument_httpx()

        # Make a request (use httpbin or mock server)
        with httpx.Client() as client:
            try:
                response = client.get("https://httpbin.org/get", timeout=5.0)
            except Exception:
                pass  # Network errors OK for span validation

        spans = exporter.get_finished_spans()
        http_spans = [s for s in spans if s.name and 'GET' in s.name]
        assert len(http_spans) > 0, "Expected HTTP client span"
    ```

    **Expected Result**: Test fails (httpx instrumentation not explicitly tested yet)

-   [ ] **Test 3**: requests library instrumentation

    **File**: `tests/python/test_logfire_bootstrap.py`
    **Why**: Validate legacy HTTP client tracing
    **Spec**: DEV-PRD-018, DEV-SDS-018

    ```python
    def test_requests_instrumentation_emits_spans():
        """Verify requests library outbound calls emit OTEL spans."""
        import requests
        import logfire
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

        exporter = InMemorySpanExporter()
        processor = SimpleSpanProcessor(exporter)

        logfire.configure(send_to_logfire=False, console=False, additional_span_processors=[processor])
        logfire.instrument_requests()

        try:
            response = requests.get("https://httpbin.org/get", timeout=5)
        except Exception:
            pass  # Network errors OK

        spans = exporter.get_finished_spans()
        http_spans = [s for s in spans if 'http' in str(s.attributes).lower()]
        assert len(http_spans) > 0, "Expected HTTP request span"
    ```

    **Expected Result**: Test fails (requests instrumentation not explicitly tested yet)

-   [ ] **Test 4**: Vector pipeline OTLP metadata capture

    **File**: `tests/ops/test_vector_logfire.sh` (verify existing)
    **Why**: Ensure Vector captures Logfire OTLP attributes
    **Spec**: DEV-SDS-005, DEV-PRD-018

    ```bash
    # Verify this test exists and is comprehensive
    cat tests/ops/test_vector_logfire.sh

    # If missing assertions, add:
    # - Check for trace_id field
    # - Check for span_id field
    # - Check for service_name field
    # - Verify PII redaction still works with Logfire spans
    ```

    **Expected Result**: Verify test exists; may need enhancement

-   [ ] **Run RED phase tests**

    ```bash
    pytest tests/python/test_logfire_bootstrap.py -v
    # Expected: New integration tests fail (not instrumented in test setup)

    bash tests/ops/test_vector_logfire.sh
    # Expected: Passes (already validated in Cycle 1)
    ```

---

#### B.3 TDD Phase B (GREEN)

**Goal**: Implement integration test setups to make all RED tests pass.

-   [ ] **Fix 1**: Add SQLAlchemy test setup

    **File**: `tests/python/test_logfire_bootstrap.py`
    **Change**: Ensure SQLAlchemy instrumentation test passes

    ```python
    # Add to existing test file
    # Ensure logfire.instrument_sqlalchemy() is called correctly
    # Validate spans are created with proper attributes
    ```

    **Why**: Prove SQLAlchemy integration works
    **Spec**: DEV-PRD-018

-   [ ] **Fix 2**: Add httpx test setup

    **File**: `tests/python/test_logfire_bootstrap.py`
    **Change**: Ensure httpx instrumentation test passes

    ```python
    # Add httpx instrumentation call
    # Use pytest fixtures to isolate httpx client
    # Mock network if needed (or allow httpbin.org call)
    ```

    **Why**: Prove httpx integration works
    **Spec**: DEV-PRD-018

-   [ ] **Fix 3**: Add requests test setup

    **File**: `tests/python/test_logfire_bootstrap.py`
    **Change**: Ensure requests library instrumentation test passes

    ```python
    # Add requests instrumentation call
    # Validate span attributes include HTTP method, URL, status
    ```

    **Why**: Prove requests integration works
    **Spec**: DEV-PRD-018

-   [ ] **Fix 4**: Enhance Vector pipeline test (if needed)

    **File**: `tests/ops/test_vector_logfire.sh`
    **Change**: Add assertions for Logfire-specific OTLP fields

    ```bash
    # Verify trace_id, span_id, observation_id fields present
    # Confirm Vector transform logs_logfire_normalize works
    # Check that downstream sinks see canonical fields
    ```

    **Why**: Ensure Vector pipeline properly handles Logfire metadata
    **Spec**: DEV-SDS-005, DEV-PRD-018

-   [ ] **Run GREEN phase tests**

    ```bash
    pytest tests/python/test_logfire_bootstrap.py -v
    # Expected: All integration tests pass (SQLAlchemy, httpx, requests, FastAPI)

    bash tests/ops/test_vector_logfire.sh
    # Expected: Vector pipeline validation passes

    just test-logs
    # Expected: Full logging suite passes
    ```

---

#### B.4 Refactor & Regression

-   [ ] **Code quality review**

    ```bash
    uv run ruff format tests/python/test_logfire_bootstrap.py
    uv run ruff check tests/python/test_logfire_bootstrap.py
    uv run mypy tests/python/test_logfire_bootstrap.py --strict
    ```

-   [ ] **Regression validation**

    ```bash
    # Full test suite
    just test
    # Expected: All tests pass (Node, Python, Shell, Integration)

    # Specific logging tests
    just test-logs-config
    just test-logs-redaction
    just test-logs-correlation
    just test-logs-logfire
    # Expected: All pass

    # CI simulation
    just ai-validate
    # Expected: Clean
    ```

-   [ ] **Exa MCP**: Validate against external best practices

    ```
    Query: "OpenTelemetry Python testing span validation best practices"
    Action: Compare our tests against authoritative patterns
    Citations: Add references to test docstrings
    ```

-   [ ] **Memory MCP**: Record test outcomes

    ```
    Session: logfire-cycle2a-testing
    Test Outcomes:
      - SQLAlchemy: Spans created with db.statement attributes
      - httpx: Client spans include HTTP method and URL
      - requests: Legacy client instrumentation validated
      - Vector pipeline: OTLP metadata properly captured and normalized
    Lessons:
      - In-memory SQLite works well for DB instrumentation tests
      - httpbin.org useful for HTTP client tests (or use pytest-httpserver for mocks)
      - Span processors allow inspection without external services
    ```

-   [ ] **Commit changes**

    ```bash
    git add tests/python/test_logfire_bootstrap.py
    git add tests/ops/test_vector_logfire.sh  # If modified
    git commit -m "test(logging): add comprehensive Logfire integration tests [DEV-PRD-018]

    - Added SQLAlchemy instrumentation test (database query tracing)
    - Added httpx instrumentation test (outbound HTTP client)
    - Added requests library instrumentation test (legacy HTTP client)
    - Enhanced Vector pipeline validation for Logfire OTLP metadata
    - All tests passing, full regression suite clean

    Satisfies: DEV-PRD-018, DEV-SDS-018, DEV-PRD-023, DEV-SDS-005"
    ```

-   [ ] **GitHub MCP**: Push branch and open PR

    ```
    Title: "test(logging): Logfire Cycle 2A - Comprehensive Integration Tests"
    Body:
    ## Summary
    Adds comprehensive integration test coverage for Logfire instrumentation.

    ## Changes
    - ✅ SQLAlchemy database query tracing tests
    - ✅ httpx outbound HTTP client tests
    - ✅ requests library instrumentation tests
    - ✅ Vector pipeline OTLP metadata validation

    ## Testing
    - All integration tests passing
    - Full regression suite clean (`just test`)
    - Logging validation complete (`just test-logs`)

    ## Specs
    - DEV-PRD-018 (Structured Logging)
    - DEV-SDS-018 (Trace Correlation)
    - DEV-PRD-023 (Regression Testing)
    - DEV-SDS-005 (Log Sanitization)

    ## Dependencies
    - Requires Cycle A merged (A-GREEN)
    - Can run in parallel with Cycle C

    Label: B-GREEN
    Base: dev
    Head: feature/logfire-cycle2a-testing-agent-b
    ```

---

#### B.5 Artifacts

**Deliverables:**

-   ✅ Enhanced `tests/python/test_logfire_bootstrap.py` (+80 lines)
-   ✅ Validated `tests/ops/test_vector_logfire.sh` (±10 lines)
-   ✅ Comprehensive integration test coverage
-   ✅ External best practice citations
-   ✅ Commit with spec IDs
-   ✅ PR opened with "B-GREEN" label

**Evidence:**

-   CI passing for all integration tests
-   `just test-logs` all green
-   External references documented
-   Memory MCP session saved

---

#### B.6 Parallelization Gate

**Gate Status**: 🚦 **B-GREEN**

**Conditions Met:**

-   All B.2 (RED) integration tests written
-   All B.3 (GREEN) tests passing
-   Regression suite clean
-   PR opened and CI green

**Coordinates With:**

-   ✅ **Cycle C** (Documentation) - Running in parallel
-   Waits for C-GREEN before final integration

---

_Pass 5 will detail MCP integration points_

---

## 6. Regression Safeguards

_Pass 6 will list all validation commands_

---

## 7. Risk & Rollback

_Pass 7 will detail risk assessment_

---

## 8. Deliverables & Sign-off

_Pass 8 will define exit criteria_

---

## Next Steps for Plan Development

-   [ ] **Pass 2**: Complete repository analysis
-   [ ] **Pass 3**: Complete specification mapping
-   [ ] **Pass 4**: Detail Cycle A (Foundations)
-   [ ] **Pass 5**: Detail Cycle B (Testing)
-   [ ] **Pass 6**: Detail Cycle C (Documentation)
-   [ ] **Pass 7**: Complete MCP tooling strategy
-   [ ] **Pass 8**: Complete regression safeguards
-   [ ] **Pass 9**: Complete risk & rollback
-   [ ] **Pass 10**: Finalize deliverables & sign-off
