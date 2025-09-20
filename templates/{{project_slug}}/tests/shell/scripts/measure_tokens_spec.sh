#shellcheck shell=bash
#
# ShellSpec for scripts/measure_tokens.sh

Describe 'measure_tokens.sh'

  It 'shows usage and fails when no args'
    When run script scripts/measure_tokens.sh
    The status should be failure
    The stderr should include 'Usage:'
  End

  It 'fails when prompt file is missing'
    When run script scripts/measure_tokens.sh nofile.prompt.md
    The status should be failure
    The stderr should include "does not exist"
  End

  It 'prints counts for a valid prompt file'
    tmp_dir=$(mktemp -d)
    prompt_file="$tmp_dir/sample.prompt.md"
    printf 'one two three four' > "$prompt_file"

    When run script scripts/measure_tokens.sh "$prompt_file"
    The status should be success
    The output should include '[measure_tokens] Approximate word count'
    The output should include '[measure_tokens] Approximate character count'

    rm -rf "$tmp_dir"
  End
End
