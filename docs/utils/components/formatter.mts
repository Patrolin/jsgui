import { BaseProps, br, code, Component, makeComponent, span } from "../../../jsgui/out/jsgui.mts";

// base formatter
type CodeFormatterProps = {
  text: string;
  getTokens: (text: string) => Component[];
};
const codeFormatter = makeComponent(function codeFormatter(props: CodeFormatterProps) {
  const {text, getTokens} = props;
  const wrapper = this.append(code(""));
  for (let token of getTokens(text)) {
    wrapper.append(token);
  }
});

// js formatter
enum JSTokenType {
  Whitespace,
  Newline,
  Number,
  Symbols,
  SymbolCurlyRight,
  SingleLineComment,
  MultiLineComment,
  String,
  InterpolatedString,
  Alphanumeric,
  Keyword,
  Boolean, // "false" | "true"
}
const JS_TOKEN_TYPE_TO_GROUP: Record<JSTokenType, string> = {
  [JSTokenType.Whitespace]: "whitespace",
  [JSTokenType.Newline]: "newline",
  [JSTokenType.Number]: "number",
  [JSTokenType.Symbols]: "symbols",
  [JSTokenType.SymbolCurlyRight]: "symbol-curly-right",
  [JSTokenType.SingleLineComment]: "single-line-comment",
  [JSTokenType.MultiLineComment]: "multi-line-comment",
  [JSTokenType.String]: "string",
  [JSTokenType.InterpolatedString]: "interpolated-string",
  [JSTokenType.Alphanumeric]: "alphanumeric",
  [JSTokenType.Keyword]: "keyword",
  [JSTokenType.Boolean]: "boolean",
};
function jsGetTokenType(text: string, i: number): JSTokenType {
  switch (text[i]) {
    case " ":
    case "\t":
      return JSTokenType.Whitespace;
    case "\r":
    case "\n":
      return JSTokenType.Newline;
    case "\"":
    case "'":
      return JSTokenType.String;
    case "`":
      return JSTokenType.InterpolatedString;
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return JSTokenType.Number;
    case "~":
    case "+":
    case "-":
    case "*":
    case "|":
    case "&":
    case ",":
    case "<":
    case ">":
    case "=":
    case "(":
    case ")":
    case "[":
    case "]":
    case "{":
    case "?":
    case ";":
      return JSTokenType.Symbols;
    case "}":
      return JSTokenType.SymbolCurlyRight;
    case "/":
      {
        const is_single_line_comment = text[i + 1] === "/";
        const is_multi_line_comment = text[i + 1] === "*";
        if (is_single_line_comment) return JSTokenType.SingleLineComment;
        return is_multi_line_comment ? JSTokenType.MultiLineComment : JSTokenType.Symbols;
      }
    default:
      return JSTokenType.Alphanumeric;
  }
}
function jsGetTokens(text: string): Component[] {
  let tokens: Component[] = [];
  type Context = {
    continue_as: JSTokenType | null,
    interpolated_string_depth: number;
  };
  const context: Context = {
    continue_as: null,
    interpolated_string_depth: 0,
  };
  let j = 0;
  for (let i = j; i < text.length; i = j) {
    let startTokenType = jsGetTokenType(text, i);
    j = i + 1;
    let isNewline = startTokenType === JSTokenType.Newline;
    if (isNewline) {
      if (text[i] === "\r" && text[j] === "\n") {
        j += 1;
      }
      tokens.push(br({
        attribute: {"data-token-group": JS_TOKEN_TYPE_TO_GROUP[startTokenType]},
      }));
      continue;
    }
    startTokenType = context.continue_as ?? startTokenType;
    switch (startTokenType) {
      case JSTokenType.String:
        for (; j < text.length && (jsGetTokenType(text, j) !== JSTokenType.String);) {
          if (text[j] === "\\") j += 2;
          else j += 1;
        }
        j += 1;
        break;
      case JSTokenType.SymbolCurlyRight:
        if (context.interpolated_string_depth > 0) {
          context.interpolated_string_depth -= 1;
          context.continue_as = null;
          startTokenType = JSTokenType.InterpolatedString;
          // fallthrough to .InterpolatedString
        } else {
          break;
        }
      case JSTokenType.InterpolatedString:
        for (; j < text.length; j++) {
          const tokenType = jsGetTokenType(text, j);
          if (tokenType === JSTokenType.InterpolatedString) {
            j += 1;
            context.continue_as = null;
            break;
          };
          if (tokenType === JSTokenType.Newline) {
            context.continue_as = JSTokenType.InterpolatedString;
            break;
          }
          if (text.slice(j-2, j) === "${") {
            context.interpolated_string_depth += 1;
            break
          };
        }
        break;
      case JSTokenType.SingleLineComment:
        for (; j < text.length && jsGetTokenType(text, j) !== JSTokenType.Newline; j++) {}
        break;
      case JSTokenType.MultiLineComment:
        for (; j < text.length; j++) {
          if (text[j-1] === "*" && text[j] === "/") {
            context.continue_as = null;
            j++;
            break;
          }
          if (jsGetTokenType(text, j) === JSTokenType.Newline) {
            context.continue_as = JSTokenType.MultiLineComment;
            break
          }
        }
        break;
      case JSTokenType.Alphanumeric:
        for (; j < text.length; j++) {
          const tokenType = jsGetTokenType(text, j);
          if (tokenType !== JSTokenType.Alphanumeric && tokenType !== JSTokenType.Number) {
            break;
          }
        }
        break;
      case JSTokenType.Symbols:
        if (text[i] === '+' || text[i] === '-' && jsGetTokenType(text, j) === JSTokenType.Number) {
          startTokenType = JSTokenType.Number;
          // fallthrough to .Number
        } else {
          break;
        }
      case JSTokenType.Number:
        {
          let is_first_dot = true;
          for (; j < text.length; j++) {
            if (text[j] === '.') {
              if (is_first_dot) {
                is_first_dot = false;
                continue;
              } else {
                break;
              }
            }
            if (jsGetTokenType(text, j) !== JSTokenType.Number) break;
          }
          break;
        }
      default:
        for (; j < text.length && jsGetTokenType(text, j) === startTokenType; j++) {}
        break;
    }
    const token = text.slice(i, j);
    switch (token) {
    case "const":
    case "let":
    case "var":
    case "for":
    case "in":
    case "of":
    case "switch":
    case "function":
    case "new":
    case "delete":
      startTokenType = JSTokenType.Keyword;
      break;
    case "true":
    case "false":
      startTokenType = JSTokenType.Boolean;
      break;
    }
    tokens.push(span(token, {
      attribute: {"data-token-group": JS_TOKEN_TYPE_TO_GROUP[startTokenType]},
    }));
    if (j === i) {
      console.error("Failed to parse", {text, i, j});
      break
    }
  }
  return tokens;
}
export const jsFormatter = makeComponent(function javascriptFormatter(text: string, props?: BaseProps) {
  this.append(codeFormatter({
    text,
    getTokens: jsGetTokens,
    ...props,
  }));
});
