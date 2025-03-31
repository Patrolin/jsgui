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
  Operator,
  SingleLineComment,
  MultiLineComment,
  String,
  // TODO: InterpolatedString
  // TODO: "false", "true"
  // TODO: stop parsing alphanumeric on brackets
  Alphanumeric,
  Keyword,
}
const JS_TOKEN_TYPE_TO_GROUP: Record<JSTokenType, string> = {
  [JSTokenType.Whitespace]: "whitespace",
  [JSTokenType.Newline]: "newline",
  [JSTokenType.Number]: "number",
  [JSTokenType.Operator]: "operator",
  [JSTokenType.SingleLineComment]: "single-line-comment",
  [JSTokenType.MultiLineComment]: "multi-line-comment",
  [JSTokenType.String]: "string",
  [JSTokenType.Alphanumeric]: "alphanumeric",
  [JSTokenType.Keyword]: "keyword",
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
    case "=":
      return JSTokenType.Operator;
    case "/":
      {
        const is_single_line_comment = text[i + 1] === "/";
        const is_multi_line_comment = text[i + 1] === "*";
        if (is_single_line_comment) return JSTokenType.SingleLineComment;
        return is_multi_line_comment ? JSTokenType.MultiLineComment : JSTokenType.Operator;
      }
    default:
      return JSTokenType.Alphanumeric;
  }
}
function jsGetTokens(text: string): Component[] {
  let tokens: Component[] = [];
  type Context = {
    inside_multiline_comment: boolean;
  };
  const context: Context = {
    inside_multiline_comment: false,
  };
  let j = 0;
  for (let i = j; i < text.length; i = j) {
    let startTokenType = jsGetTokenType(text, i);
    j = i + 1;
    let isNewline = startTokenType === JSTokenType.Newline;
    if (isNewline) {
      if (text[j] === "\r" && text[j+1] === "\n") {
        j += 1;
      }
      tokens.push(br({
        attribute: {"data-token-group": JS_TOKEN_TYPE_TO_GROUP[startTokenType]},
      }));
      continue;
    }
    if (context.inside_multiline_comment) {
      startTokenType = JSTokenType.MultiLineComment;
      console.log('ayaya', {token: text.slice(i, i+20), context, startTokenType})
    }
    switch (startTokenType) {
      case JSTokenType.String:
        for (; j < text.length && (jsGetTokenType(text, j) !== JSTokenType.String);) {
          if (text[j] === "\\") j += 2;
          else j += 1;
        }
        j += 1;
        break;
      case JSTokenType.SingleLineComment:
        for (; j < text.length && jsGetTokenType(text, j) !== JSTokenType.Newline; j++) {}
        break;
      case JSTokenType.MultiLineComment:
        for (; j < text.length; j++) {
          if (text[j-1] === "*" && text[j] === "/") {
            context.inside_multiline_comment = false;
            j++;
            break;
          }
          if (jsGetTokenType(text, j) === JSTokenType.Newline) {
            context.inside_multiline_comment = true;
            break
          }
        }
        break;
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
    case "switch":
    case "function":
    case "new":
    case "delete":
      startTokenType = JSTokenType.Keyword;
    }
    tokens.push(span(text.slice(i, j), {
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
