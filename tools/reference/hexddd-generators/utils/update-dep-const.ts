import { Tree } from "@nx/devkit";
import { checkRuleExists } from "./check-rule-exists";

const allowAll =
  /\s*\{\s*sourceTag:\s*'\*',\s*onlyDependOnLibsWithTags:\s*\['\*'\],?\s*\}\s*,?/;
const depConstraints = /depConstraints:\s*\[\s*/;

export function updateDepConst(
  host: Tree,
  update: (depConst: Array<object>) => void,
) {
  let filePath = "tslint.json";
  const rule = "nx-enforce-module-boundaries";
  let isJson = true;
  let newText = "";

  if (!host.exists("tslint.json")) {
    if (host.exists(".eslintrc.json")) {
      filePath = ".eslintrc.json";
      console.info("Found .eslintrc.json");
    } else if (host.exists(".eslintrc")) {
      filePath = ".eslintrc";
      console.info("Found .eslintrc");
    } else if (host.exists("eslint.config.cjs")) {
      filePath = "eslint.config.cjs";
      console.info("Found eslint.config.cjs");
      isJson = false;
    } else if (host.exists("eslint.config.mjs")) {
      filePath = "eslint.config.mjs";
      console.info("Found eslint.config.mjs");
      isJson = false;
    } else if (host.exists("eslint.config.js")) {
      console.info("ESLint flat config will be supported in next release!");
      return;
    } else {
      console.info("Cannot add linting rules: ESLint config file not found");
      return;
    }
  }

  const content = host.read(filePath);
  if (!content) {
    console.warn(`Could not read file: ${filePath}`);
    return;
  }
  const text = content.toString();

  if (isJson) {
    const json = JSON.parse(text);
    let rules = json;
    if (rules["overrides"]) {
      const overrides = rules["overrides"];
      rules = overrides.find((e: unknown) => {
        if (typeof e !== "object" || e === null) return false;
        const rec = e as Record<string, unknown>;
        return (
          !!rec.rules &&
          !!(rec.rules as Record<string, unknown>)[
            "@nx/enforce-module-boundaries"
          ]
        );
      }) as Record<string, unknown> | undefined;
    }

    if (!checkRuleExists(filePath, rule, rules)) return;

    const rulesRec = rules as Record<string, unknown>;
    const ruleEntry = (rulesRec["rules"] as Record<string, unknown>)[
      rule
    ] as unknown;
    const depConst = (
      (ruleEntry as unknown[])?.[1] as unknown as Record<string, unknown>
    )["depConstraints"] as Array<object>;
    update(depConst);
    newText = JSON.stringify(json, undefined, 2);
  } else {
    const rules = new Array<object>();
    update(rules);
    const code = trim(JSON.stringify(rules, null, 2)) + ",";
    newText = text.replace(allowAll, "");
    newText = newText.replace(depConstraints, "depConstraints: [\n" + code);
  }

  host.write(filePath, newText);
}

function trim(str: string) {
  if (str.startsWith("[")) {
    str = str.substring(1);
  }

  if (str.endsWith("]")) {
    str = str.substring(0, str.length - 1);
  }
  return str.trim();
}
