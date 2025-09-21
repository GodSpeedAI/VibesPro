#shellcheck shell=bash
# ShellSpec for scripts/plan_techstack.sh

Describe 'plan_techstack.sh'

  It 'fails when file missing'
  When run sh scripts/plan_techstack.sh nofile.yaml
    The status should be failure
    The stderr should include "does not exist"
  End

  It 'runs plan on provided file (no changes likely)'
    tmp_dir=$(mktemp -d)
    cat >"$tmp_dir/techstack.yaml" <<'YAML'
core: {}
YAML
  When run sh -c 'sh scripts/plan_techstack.sh "$1" >/dev/null 2>&1' _ "$tmp_dir/techstack.yaml"
    The status should be success
  End
End
