import subprocess
import sys
from pathlib import Path


def test_docs_generator_writes_markdown(tmp_path: Path) -> None:
    """Integration test: run the Python docs generator and assert Markdown files exist.

    This test exercises the generator end-to-end but uses the default Markdown
    output so there's no dependency on external converters.
    """
    outdir = tmp_path / "out"
    outdir.mkdir()

    cmd = [
        sys.executable,
        str(Path("tools/docs/generator.py").absolute()),
        "--project-name",
        "integration-test-project",
        "--output-dir",
        str(outdir),
    ]

    # Run the generator; it should exit 0
    result = subprocess.run(cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"Generator failed: {result.stderr}\n{result.stdout}"

    # Check expected files
    expected = ["README.md", "ARCHITECTURE.md", "API-REFERENCE.md"]
    for fname in expected:
        path = outdir / fname
        assert path.exists() and path.stat().st_size > 0, (
            f"Expected {path} to exist and be non-empty"
        )
