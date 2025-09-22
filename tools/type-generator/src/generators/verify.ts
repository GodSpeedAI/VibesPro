const TS_OPTIONAL_TOKENS = new Set(['null', 'undefined']);

function splitTopLevel(type: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  const openingBrackets = new Map([
    ['[', ']'],
    ['(', ')'],
    ['{', '}'],
    ['<', '>'],
  ]);
  const closingBrackets = new Map(Array.from(openingBrackets.entries()).map(([open, close]) => [close, open]));

  for (const char of type) {
    if (openingBrackets.has(char)) {
      depth += 1;
    } else if (closingBrackets.has(char)) {
      depth = Math.max(depth - 1, 0);
    }

    if (char === delimiter && depth === 0) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    parts.push(current);
  }

  return parts.filter(Boolean);
}

function parseTypeScriptTokens(type: string): string[] {
  return splitTopLevel(type, '|');
}

function parsePythonTokens(type: string): string[] {
  if (type.startsWith('optional[')) {
    const inner = type.slice('optional['.length, -1);
    return [...parsePythonTokens(inner), 'none'];
  }

  if (type.startsWith('union[')) {
    const inner = type.slice('union['.length, -1);
    return splitTopLevel(inner, ',').flatMap(token => parsePythonTokens(token));
  }

  const unionParts = splitTopLevel(type, '|');
  if (unionParts.length > 1) {
    return unionParts.flatMap(token => parsePythonTokens(token));
  }

  return [type];
}

function matchTokenSets(tsTokens: string[], pyTokens: string[]): boolean {
  if (tsTokens.length !== pyTokens.length) {
    return false;
  }

  const remaining = [...pyTokens];

  for (const tsToken of tsTokens) {
    let matched = false;

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      if (matchSingleType(tsToken, candidate)) {
        remaining.splice(index, 1);
        matched = true;
        break;
      }
    }

    if (!matched) {
      return false;
    }
  }

  return remaining.length === 0;
}

function matchSingleType(tsToken: string, pyToken: string): boolean {
  if (!tsToken || !pyToken) {
    return false;
  }

  if (tsToken === pyToken) {
    return true;
  }

  const tsArray = tsToken.endsWith('[]');
  const pyList = pyToken.startsWith('list[') && pyToken.endsWith(']');

  if (tsArray || pyList) {
    if (!(tsArray && pyList)) {
      return false;
    }

    const tsBase = tsToken.slice(0, -2);
    const pyBase = pyToken.slice('list['.length, -1);
    return verifyTypeParity(tsBase, pyBase);
  }

  if (tsToken.startsWith('{') && tsToken.endsWith('}')) {
    return matchSingleType('object', pyToken);
  }

  const typeMapping: Record<string, string[]> = {
    string: ['str', 'uuid', 'datetime', 'date', 'time', 'bytes'],
    number: ['int', 'float'],
    boolean: ['bool'],
    unknown: ['dict', 'any', 'object', 'mapping'],
    object: ['dict', 'mapping'],
  };

  const normalizedMatch = (candidate: string, targets: string[]): boolean =>
    targets.some(target => candidate === target || candidate.startsWith(`${target}[`));

  for (const [tsKey, pyValues] of Object.entries(typeMapping)) {
    if (tsToken === tsKey && normalizedMatch(pyToken, pyValues)) {
      return true;
    }
  }

  if (tsToken === 'record<string,any>' && pyToken.startsWith('dict[')) {
    return true;
  }

  if (pyToken === 'any' && (tsToken === 'unknown' || tsToken === 'any')) {
    return true;
  }

  return false;
}

export function verifyTypeParity(tsType: string, pyType: string): boolean {
  const normalizedTsType = tsType.replace(/\s+/g, '').toLowerCase();
  const normalizedPyType = pyType.replace(/\s+/g, '').toLowerCase();

  if (!normalizedTsType || !normalizedPyType) {
    return false;
  }

  const tsTokens = parseTypeScriptTokens(normalizedTsType);
  const pyTokens = parsePythonTokens(normalizedPyType);

  const tsHasOptional = tsTokens.some(token => TS_OPTIONAL_TOKENS.has(token));
  const pyHasOptional = pyTokens.includes('none');

  if (tsHasOptional !== pyHasOptional) {
    return false;
  }

  const tsCoreTokens = tsTokens.filter(token => !TS_OPTIONAL_TOKENS.has(token));
  const pyCoreTokens = pyTokens.filter(token => token !== 'none');

  return matchTokenSets(tsCoreTokens, pyCoreTokens);
}
