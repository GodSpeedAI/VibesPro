Describe 'Type generation pipeline'
  Include scripts/run_prompt.sh

  It 'generates TS and Python types and passes CI check'
    When run just clean
    # Ensure test fixture schema is used for reproducibility
    When run just types-generate
    The status should be success
    The file libs/shared/types/src/database.types.ts should exist

    When run just gen-types-py
    The status should be success
    The file libs/shared/types-py/src/models.py should exist

    When run just check-types
    The status should be success
  End
End
