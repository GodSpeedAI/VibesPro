#shellcheck shell=bash
#
# ShellSpec for just spec-matrix command

Describe 'just spec-matrix'

It 'succeeds when spec-matrix recipe exists'
When run just spec-matrix
The status should be success
End

It 'should call the matrix tool'
When run just spec-matrix
The output should include "tools/spec/matrix.js"
End

End
