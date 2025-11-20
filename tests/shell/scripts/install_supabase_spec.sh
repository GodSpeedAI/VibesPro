# shellcheck shell=bash
Describe 'scripts/install_supabase.sh'
  It 'exists and is executable'
    When call test -f scripts/install_supabase.sh
    The status should be success
  End

  It 'is at least readable'
    When call test -r scripts/install_supabase.sh
    The status should be success
  End
End
