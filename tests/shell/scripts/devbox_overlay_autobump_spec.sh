# shellcheck shell=bash
Describe 'scripts/devbox_overlay_autobump.sh'
It 'exists and is executable'
When call test -f scripts/devbox_overlay_autobump.sh
The status should be success
End

It 'is at least readable'
When call test -r scripts/devbox_overlay_autobump.sh
The status should be success
End
End
