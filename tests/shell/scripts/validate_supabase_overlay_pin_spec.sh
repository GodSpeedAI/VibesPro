# shellcheck shell=bash
Describe 'scripts/validate_supabase_overlay_pin.sh'
It 'exists and is executable'
When call test -f scripts/validate_supabase_overlay_pin.sh
The status should be success
End

It 'validates overlay is pinned'
When run script scripts/validate_supabase_overlay_pin.sh
The status should be success
The output should include 'OK: supabase overlay is pinned'
End
End
