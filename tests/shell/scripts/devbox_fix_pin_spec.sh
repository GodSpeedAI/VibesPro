# shellcheck shell=bash
Describe 'scripts/devbox_fix_pin.sh'
It 'exists and is executable'
When call test -f scripts/devbox_fix_pin.sh
The status should be success
End

It 'is at least readable'
When call test -r scripts/devbox_fix_pin.sh
The status should be success
End
End
