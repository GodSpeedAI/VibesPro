import shutil
import subprocess
import sys
from pathlib import Path


def test_generate_templates_via_python_wrapper(tmp_path: Path) -> None:
    """Integration: call tools/docs/generator.py to generate templates using a temp context.

    This exercises the code path that creates a temporary JSON context file and
    invokes the Node runner. It avoids network and heavy deps and only verifies
    that the runner returns success and wrote expected template files.
    """
    repo_root = Path(__file__).resolve().parents[1]
    tools_dir = repo_root / 'tools' / 'docs'

    out_dir: Path = tmp_path / 'out'
    templates_dir: Path = tmp_path / 'templates'
    out_dir.mkdir()
    templates_dir.mkdir()

    # Invoke the python wrapper
    cmd = [sys.executable, str(tools_dir / 'generator.py'), '--project-name', 'testproj', '--output-dir', str(out_dir), '--templates-dir', str(templates_dir)]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=repo_root)

    # Print outputs for debugging (helps CI and local runs)
    print('STDOUT:\n', proc.stdout)
    print('STDERR:\n', proc.stderr)

    assert proc.returncode == 0, 'generator.py exited non-zero'

    # The generator writes into a 'templates' subdirectory (templates/templates/docs)
    expected = templates_dir / 'templates' / 'docs'
    assert expected.exists() and expected.is_dir(), f'Expected templates dir {expected} to exist'

    # Spot check a few expected files
    got = sorted([p.name for p in expected.iterdir()])
    assert 'README.md.j2' in got
    assert 'ARCHITECTURE.md.j2' in got

    # Cleanup explicit (tmp_path will be removed by pytest)
    shutil.rmtree(out_dir, ignore_errors=True)
    shutil.rmtree(templates_dir, ignore_errors=True)
