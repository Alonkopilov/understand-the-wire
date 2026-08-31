import type { Language } from "./types.ts";

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "interp"
  | "number"
  | "keyword"
  | "property"
  | "func"
  | "punct"
  | "meta";

export type Token = { text: string; kind: TokenKind };

type Rule = { kind: TokenKind; pattern: RegExp; expand?: boolean };

const HCL_KEYWORDS =
  /\b(?:resource|variable|output|module|data|locals|provider|terraform|backend|for_each|count|depends_on|lifecycle|dynamic|true|false|null|for|in|if|each|var|local|path)\b/y;

/** Split `"a-${var.b}-c"` into string / interpolation / string pieces. */
function expandInterpolation(text: string, kind: TokenKind): Token[] {
  const tokens: Token[] = [];
  const pattern = /\$\{[^}]*\}/g;

  let cursor = 0;
  let match = pattern.exec(text);

  while (match !== null) {
    if (match.index > cursor) {
      tokens.push({ text: text.slice(cursor, match.index), kind });
    }
    tokens.push({ text: match[0], kind: "interp" });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) tokens.push({ text: text.slice(cursor), kind });
  return tokens;
}

/** Walk `text` applying the first matching rule at each position. */
function scan(text: string, rules: Rule[]): Token[] {
  const tokens: Token[] = [];
  let plain = "";
  let cursor = 0;

  const flush = () => {
    if (plain) {
      tokens.push({ text: plain, kind: "plain" });
      plain = "";
    }
  };

  while (cursor < text.length) {
    let matched = false;

    for (const rule of rules) {
      rule.pattern.lastIndex = cursor;
      const match = rule.pattern.exec(text);

      if (match !== null && match.index === cursor && match[0].length > 0) {
        flush();
        if (rule.expand)
          tokens.push(...expandInterpolation(match[0], rule.kind));
        else tokens.push({ text: match[0], kind: rule.kind });

        cursor += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      plain += text[cursor];
      cursor += 1;
    }
  }

  flush();
  return tokens;
}

const HCL_RULES: Rule[] = [
  { kind: "comment", pattern: /\/\*[\s\S]*?\*\//y },
  { kind: "comment", pattern: /(?:#|\/\/)[^\n]*/y },
  { kind: "string", pattern: /"(?:[^"\\\n]|\\.)*"/y, expand: true },
  { kind: "number", pattern: /\b\d+(?:\.\d+)?\b/y },
  { kind: "keyword", pattern: HCL_KEYWORDS },
  { kind: "func", pattern: /[a-z_][\w]*(?=\()/y },
  { kind: "property", pattern: /[A-Za-z_][\w-]*(?=\s*=(?!=))/y },
  { kind: "punct", pattern: /[{}[\]()=,:?!<>+*/-]+/y },
];

const VALUE_RULES: Rule[] = [
  { kind: "comment", pattern: /(?<=\s)#[^\n]*/y },
  {
    kind: "string",
    pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y,
    expand: true,
  },
  { kind: "interp", pattern: /\$\{[^}]*\}|\$[A-Za-z_]\w*/y },
  { kind: "number", pattern: /\b\d+(?:\.\d+)?\b/y },
  { kind: "keyword", pattern: /\b(?:true|false|null|yes|no)\b/y },
  { kind: "punct", pattern: /[{}[\]|>&*,]+/y },
];

const BASH_RULES: Rule[] = [
  { kind: "comment", pattern: /#[^\n]*/y },
  {
    kind: "string",
    pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\n]|\\.)*'/y,
    expand: true,
  },
  { kind: "interp", pattern: /\$\{[^}]*\}|\$\(|\$[A-Za-z_]\w*/y },
  {
    kind: "keyword",
    pattern:
      /\b(?:if|then|else|elif|fi|for|in|do|done|while|until|case|esac|function|return|export|local|set|source)\b/y,
  },
  {
    kind: "func",
    pattern:
      /\b(?:aws|kubectl|flux|curl|openssl|tee|mkdir|chmod|sed|ln|bash|echo|sleep|cat)\b/y,
  },
  { kind: "number", pattern: /\b\d+(?:\.\d+)?\b/y },
  { kind: "punct", pattern: /[|&;()<>]+/y },
];

/** YAML is line-oriented, so keys can be found reliably without full parsing. */
function tokenizeYamlLine(line: string): Token[] {
  if (line.trim() === "") return [{ text: line, kind: "plain" }];
  if (/^\s*#/.test(line)) return [{ text: line, kind: "comment" }];
  if (/^---\s*$/.test(line)) return [{ text: line, kind: "meta" }];

  const keyMatch = /^(\s*)(-\s+)?([A-Za-z_][\w.\-/]*)(\s*:)(.*)$/.exec(line);
  if (keyMatch === null) {
    const listMatch = /^(\s*)(-\s+)(.*)$/.exec(line);
    if (listMatch !== null) {
      return [
        { text: listMatch[1], kind: "plain" },
        { text: listMatch[2], kind: "punct" },
        ...scan(listMatch[3], VALUE_RULES),
      ];
    }
    return scan(line, VALUE_RULES);
  }

  const [, indent, dash, key, colon, rest] = keyMatch;
  return [
    { text: indent, kind: "plain" },
    ...(dash ? [{ text: dash, kind: "punct" as TokenKind }] : []),
    { text: key, kind: "property" },
    { text: colon, kind: "punct" },
    ...scan(rest, VALUE_RULES),
  ];
}

/** Break tokens that span newlines so callers can render line by line. */
function toLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];

  for (const token of tokens) {
    const parts = token.text.split("\n");

    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, kind: token.kind });
    });
  }

  return lines;
}

export function highlight(code: string, language: Language): Token[][] {
  const source = code.replace(/\r\n/g, "\n").replace(/\n$/, "");

  if (language === "yaml") return source.split("\n").map(tokenizeYamlLine);
  if (language === "hcl") return toLines(scan(source, HCL_RULES));
  if (language === "bash") return toLines(scan(source, BASH_RULES));

  return source
    .split("\n")
    .map((line) => [{ text: line, kind: "plain" as TokenKind }]);
}
