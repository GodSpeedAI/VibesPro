#shellcheck shell=bash
#
# ShellSpec for just spec-feature command

Describe 'just spec-feature'

  It 'succeeds when spec-feature recipe exists and THREAD is provided'
    When run just spec-feature THREAD=test
    The status should be success
    The output should include "Created feature specification for thread: test"
  End

  It 'fails with missing THREAD argument'
    When run just spec-feature
    The status should be failure
    The stderr should include "Justfile does not contain recipe"
    The stderr should include "spec-feature"
  End

End
