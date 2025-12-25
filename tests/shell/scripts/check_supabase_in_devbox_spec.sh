# shellcheck shell=bash
Describe 'scripts/check_supabase_in_devbox.sh'
It 'exists and is executable'
When call test -f scripts/check_supabase_in_devbox.sh
The status should be success
End

It 'is at least readable'
When call test -r scripts/check_supabase_in_devbox.sh
The status should be success
End
End
