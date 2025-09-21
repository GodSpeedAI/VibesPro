#shellcheck shell=bash
# ShellSpec for scripts/sync_techstack.sh

Describe 'sync_techstack.sh'

  It 'fails when file missing'
  When run sh scripts/sync_techstack.sh nofile.yaml
    The status should be failure
    The stderr should include "does not exist"
  End

  It 'applies and writes resolved JSON'
    tmp_dir=$(mktemp -d)
    cat >"$tmp_dir/techstack.yaml" <<'YAML'
core_application_dependencies: { web_frameworks: [fastapi] }
YAML
  When run sh scripts/sync_techstack.sh "$tmp_dir/techstack.yaml"
    The status should be success
  The output should include 'Wrote '
  End
End
