#shellcheck shell=bash
#
# ShellSpec for scripts/run_prompt.sh

Describe 'run_prompt.sh'

  It 'shows usage and fails when no args'
    When run sh scripts/run_prompt.sh
    The status should be failure
    The stderr should include 'Usage:'
  End

  It 'fails when prompt file is missing'
    When run sh scripts/run_prompt.sh non_existent.prompt.md
    The status should be failure
    The stderr should include "does not exist"
  End

  It 'succeeds and prints messages for valid file'
    # Create a temporary prompt file fixture
    tmp_dir=$(mktemp -d)
    prompt_file="$tmp_dir/sample.prompt.md"
    cat > "$prompt_file" <<'EOF'
# Sample prompt
Content
EOF
  When run sh scripts/run_prompt.sh "$prompt_file" --config=style
    The status should be success
    The output should include '[run_prompt] Running prompt:'
    The output should include '[run_prompt] Using configuration:'
    The output should include "$prompt_file"
    The output should include 'style'
    # cleanup
    rm -rf "$tmp_dir"
  End
End
