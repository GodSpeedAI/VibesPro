#shellcheck shell=bash
#
# ShellSpec for just prompt-lint command

Describe 'just prompt-lint'

It 'succeeds when prompt-lint recipe exists'
When run just prompt-lint
The status should be success
End

It 'should call the linter tool'
When run just prompt-lint
The output should include "tools/prompt/lint.js"
End

End
