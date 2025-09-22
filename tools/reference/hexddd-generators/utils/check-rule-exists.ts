export function checkRuleExists(
  filePath: string,
  rule: string,
  rules: Record<string, unknown>
) {
  const ruleGroupRaw = (rules as Record<string, unknown>)['rules'];
  const ruleGroup = (ruleGroupRaw as Record<string, unknown> | undefined) ?? undefined;
  if (!ruleGroup) {
    console.info(`${filePath}: rules expected`);
    return false;
  }

  const ruleEntry = (ruleGroup as Record<string, unknown>)[rule];
  if (!ruleEntry) {
    console.info(`${filePath}: ${rule} expected`);
    return false;
  }

  if (!Array.isArray(ruleEntry) || ruleEntry.length < 2) {
    console.info(`${filePath}: ${rule}.1 unexpected`);
    return false;
  }

  const depConstraints = ruleEntry[1]['depConstraints'];
  if (!depConstraints) {
    console.info(`${filePath}: ${rule}.1.depConstraints expected.`);
    return false;
  }

  if (!Array.isArray(depConstraints)) {
    console.info(`${filePath}: ${rule}.1.depConstraints expected to be an array.`);
    return false;
  }

  return true;
}
