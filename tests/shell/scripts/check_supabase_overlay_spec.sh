#!/usr/bin/env shellspec
Describe 'check_supabase_overlay.sh'
  Include scripts/check_supabase_overlay.sh

  It 'should detect overlay file and reference in devbox.json'
    When run script scripts/check_supabase_overlay.sh
    The status should be success
    The output should include 'OK: supabase overlay exists and is referenced in devbox.json'
  End
End
