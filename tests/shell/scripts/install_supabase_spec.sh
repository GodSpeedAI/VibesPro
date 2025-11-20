# shellcheck shell=bash
Describe 'scripts/setup/install_supabase.sh'
  It 'exists and is executable'
    When call test -f scripts/setup/install_supabase.sh
    The status should be success
  End

  It 'is at least readable'
    When call test -r scripts/setup/install_supabase.sh
    The status should be success
  End
End
