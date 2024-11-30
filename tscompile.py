from dataclasses import dataclass
import re
from typing import Callable, TypeVar

# GOALS:
# find <T = ...>
# find name?: T,
# find name?: T;
# find name as T
# don't find a ? b : c
# if inside comment, replace "*/" with ""

WHITESPACE_SYMBOLS = " \t"
NEWLINE_SYMBOLS = "\r\n"
STRING_SYMBOLS = "\"'"
MATH_SYMBOLS = "+-"
COMMENT_SYMBOLS = "/*"
SEPARATOR_SYMBOLS = "?:=,;"
ROUND_BRACKET_LEFT_SYMBOLS = "("
SQUARE_BRACKET_LEFT_SYMBOLS = "["
CURLY_BRACKET_LEFT_SYMBOLS = "{"
ANGLE_BRACKET_LEFT_SYMBOLS = "<"
ROUND_BRACKET_RIGHT_SYMBOLS = ")"
SQUARE_BRACKET_RIGHT_SYMBOLS = "]"
CURLY_BRACKET_RIGHT_SYMBOLS = "}"
ANGLE_BRACKET_RIGHT_SYMBOLS = ">"

class CharGroup:
  WHITESPACE = 0
  NEWLINE = 1
  ALPHANUMERIC = 2
  STRING = 3
  MATH = 4
  COMMENT = 5
  SEPARATOR = 6
  ROUND_BRACKET_LEFT = 7
  SQUARE_BRACKET_LEFT = 8
  CURLY_BRACKET_LEFT = 9
  ANGLE_BRACKET_LEFT = 10
  ROUND_BRACKET_RIGHT = 11
  SQUARE_BRACKET_RIGHT = 12
  CURLY_BRACKET_RIGHT = 13
  ANGLE_BRACKET_RIGHT = 14
  @staticmethod
  def print(group_id: int) -> str:
    for k, v in CharGroup.__dict__.items():
      if v == group_id:
        return k.rjust(14)
    return str(group_id)
def get_char_group(char: str):
  if char in WHITESPACE_SYMBOLS:
    return CharGroup.WHITESPACE
  elif char in NEWLINE_SYMBOLS:
    return CharGroup.NEWLINE
  elif char in STRING_SYMBOLS:
    return CharGroup.STRING
  elif char in MATH_SYMBOLS:
    return CharGroup.MATH
  elif char in COMMENT_SYMBOLS:
    return CharGroup.COMMENT
  elif char in SEPARATOR_SYMBOLS:
    return CharGroup.SEPARATOR
  elif char in ROUND_BRACKET_LEFT_SYMBOLS:
    return CharGroup.ROUND_BRACKET_LEFT
  elif char in SQUARE_BRACKET_LEFT_SYMBOLS:
    return CharGroup.SQUARE_BRACKET_LEFT
  elif char in CURLY_BRACKET_LEFT_SYMBOLS:
    return CharGroup.CURLY_BRACKET_LEFT
  elif char in ANGLE_BRACKET_LEFT_SYMBOLS:
    return CharGroup.ANGLE_BRACKET_LEFT
  elif char in ROUND_BRACKET_RIGHT_SYMBOLS:
    return CharGroup.ROUND_BRACKET_RIGHT
  elif char in SQUARE_BRACKET_RIGHT_SYMBOLS:
    return CharGroup.SQUARE_BRACKET_RIGHT
  elif char in CURLY_BRACKET_RIGHT_SYMBOLS:
    return CharGroup.CURLY_BRACKET_RIGHT
  elif char in ANGLE_BRACKET_RIGHT_SYMBOLS:
    return CharGroup.ANGLE_BRACKET_RIGHT
  else:
    return CharGroup.ALPHANUMERIC
def tokenize(text: str, debug = False) -> list[str]:
  acc: list[str] = []
  i = j = 0
  prev_char_group = get_char_group(text[0]) if len(text) > 0 else CharGroup.WHITESPACE
  while j < len(text):
    char1 = text[j]
    char_group = get_char_group(char1)
    if debug:
      print(CharGroup.print(prev_char_group), CharGroup.print(char_group), i, j, repr(text[i:j]))
    if (char_group != prev_char_group):
      acc.append(text[i:j])
      i = j
    prev_char_group = char_group
    if char_group == CharGroup.STRING:
      k = j+1
      while k < len(text):
        char2 = text[k]
        if char2 == char1:
          acc.append(text[j:k+1])
          break
        elif char2 == "\\":
          k += 2
        else:
          k += 1
      i = k+1
      j = k+2
    else:
      j += 1
  if prev_char_group != CharGroup.WHITESPACE:
    acc.append(text[i:])
  return acc

@dataclass
class Replacement:
  start: int
  end: int
  rtype: str
@dataclass
class Parser:
  tokens: list[str]
  replacements: list[Replacement]
  pos: int = 0
  inside_multiline_comment: bool = False
  inside_type: bool = False
def eat_whitespace(parser: Parser) -> str | None:
  pos = parser.pos
  while True:
    next_token = parser.tokens[pos] if pos < len(parser.tokens) else None
    if next_token == None: return
    char_group = get_char_group(next_token)
    if (char_group == CharGroup.WHITESPACE) or (char_group == CharGroup.NEWLINE):
      pos += 1
      continue
    elif char_group == CharGroup.COMMENT:
      if next_token == "/*":
        comment_end = find_first_string(parser, "*/")
        parser.pos = comment_end + 1
      else:
        comment_end = find_first(parser, "\r\n")
        parser.pos = comment_end + 1
    else:
      parser.pos = pos
      return next_token
def parse_top_level_stuff(parser: Parser):
  while parser.pos < len(parser.tokens):
    prev_pos = parser.pos
    parse_statements(parser, top_level=True)
    print(f"parse_statements: {parser.tokens[prev_pos:parser.pos]}")
    prev_pos = parser.pos
    parse_function_declaration(parser, top_level=True)
    print(f"parse_function: {parser.tokens[prev_pos:parser.pos]}")
    if parser.pos == prev_pos:
      print(f"! Parser got stuck at {parser.pos}/{len(parser.tokens)} ('{parser.tokens[parser.pos]}') !")
      return
def parse_function_declaration(parser: Parser, top_level = False):
  # "export" | ...
  next_token = eat_whitespace(parser)
  if top_level and next_token == "export":
    parser.pos += 1
    next_token = eat_whitespace(parser)
  # "function"
  if (next_token == None) or (next_token != "function"): return
  parser.pos += 1
  next_token = eat_whitespace(parser)
  # (name)
  if next_token == None: return
  if get_char_group(next_token) == CharGroup.ALPHANUMERIC:
    #name = next_token
    parser.pos += 1
    next_token = eat_whitespace(parser)
  # ("<")
  if next_token == None: return
  if get_char_group(next_token) == CharGroup.ANGLE_BRACKET_LEFT:
    parser.pos += 1
    end = find_bracket_end(parser)
    parser.replacements.append(Replacement(parser.pos - 1, end, "Generic"))
    parser.pos = end + 1
    next_token = eat_whitespace(parser)
  # "("
  if next_token == None: return
  if get_char_group(next_token) == CharGroup.ROUND_BRACKET_LEFT:
    parser.pos += 1
    end = find_bracket_end(parser)
    parser.replacements.append(Replacement(parser.pos - 1, end, "Arguments"))
    parser.pos = end + 1
    next_token = eat_whitespace(parser)
  # "{"
  if next_token == None: return
  if get_char_group(next_token) == CharGroup.CURLY_BRACKET_LEFT:
    parser.pos += 1
    print("ayaya.curly_bracket_left", parser.pos)
    parse_statements(parser)
    print("ayaya.statements_end", parser.pos, parser.tokens[parser.pos])
    # "}"
    next_token = eat_whitespace(parser)
    if next_token == None: return
    if get_char_group(next_token) == CharGroup.CURLY_BRACKET_RIGHT:
      parser.pos += 1
def parse_statements(parser: Parser, top_level = False):
  while True:
    # "export" | ...
    next_token = eat_whitespace(parser)
    if top_level and next_token == "export":
      parser.pos += 1
      next_token = eat_whitespace(parser)
    # statement
    if next_token == None: return
    char_group = get_char_group(next_token)
    if char_group == CharGroup.STRING:
      parser.pos += 1
      continue
    elif char_group == CharGroup.ALPHANUMERIC:
      if next_token == "as":
        expression_end = find_bracket_end(parser, ";\r\n")
        parser.replacements.append(Replacement(parser.pos, expression_end-1, "As"))
        parser.pos = expression_end + 1
      elif next_token == "function":
        return
      else:
        parser.pos += 1
      continue
    else:
      #print(CharGroup.print(char_group), next_token)
      return

def find_first_string(parser: Parser, stop_string: str):
  search = parser.pos
  while search < len(parser.tokens):
    search_token = parser.tokens[search]
    if search_token == stop_string:
      return search
    search += 1
  return search
def find_first(parser: Parser, stop_chars: str):
  search = parser.pos
  while search < len(parser.tokens):
    search_token = parser.tokens[search]
    if search_token in stop_chars:
      return search
    search += 1
  return search
def find_bracket_end(parser: Parser, extra_stop_chars: str = ""):
  search = parser.pos
  bracket_count = 1
  while search < len(parser.tokens):
    search_token = parser.tokens[search]
    search_char_group = get_char_group(search_token)
    if CharGroup.ROUND_BRACKET_LEFT <= search_char_group <= CharGroup.ANGLE_BRACKET_LEFT:
      bracket_count += 1
    elif (CharGroup.ROUND_BRACKET_RIGHT <= search_char_group <= CharGroup.ANGLE_BRACKET_RIGHT) or search_token in extra_stop_chars:
      bracket_count -= 1
    if bracket_count == 0:
      return search
    search += 1
  return search

def tsCompile(accTs: str) -> str:
  # parse typescript
  tokens = tokenize(accTs)
  parser = Parser(tokens, [])
  parse_top_level_stuff(parser)
  # comment out types
  for replacement in parser.replacements:
    print(replacement.rtype, parser.tokens[replacement.start:replacement.end+1])
  accJs = ""
  pos = 0
  for replacement in parser.replacements:
    if replacement.rtype == "Arguments": continue
    # TODO: shift left to include whitespace in some cases
    accJs += "".join(parser.tokens[pos:replacement.start]) + f"/*{"".join(parser.tokens[replacement.start:replacement.end+1])}*/"
    pos = replacement.end + 1
  accJs += "".join(parser.tokens[pos:])
  return accJs

if __name__ == '__main__':
  # test lib
  passed = 0
  total = 0
  T = TypeVar("T")
  def expectEquals(name: str, got: T, expected: T):
    global passed, total
    if got != expected:
      print(f"- Test '{name}' failed:")
      print("-- GOT --", got, "-- EXPECTED --", expected, sep='\n')
    else:
      print(f"- Test '{name}' passed.")
      passed += 1
    total += 1
  # test tokenize()
  expectEquals("tokenize('')", tokenize(''), [])
  expectEquals("tokenize('a+b')", tokenize('a+b'), ["a", "+", "b"])
  expectEquals("tokenize(string)", tokenize('''
    const a = 'hello\\ world';
    const b = 'foo';
  '''), ["\n", "    ", "const", " ", "a", " ", "=", " ", "'hello\\ world'", ";", "\n",
         "    ", "const", " ", "b", " ", "=", " ", "'foo'", ";", "\n"])
  expectEquals("tokenize('function')", tokenize('''
  export function makeArray<T = int>(N: number, map: (v: undefined, i: number) => T): T[] {
    const arr = Array(N);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = map(undefined, i);
    }
    return arr;
  }'''), ["\n", "  ", "export", " ", "function", " ", "makeArray", "<", "T", " ", "=", " ", "int", ">", "(", "N", ":", " ", "number", ",", " ", "map", ":", " ", "(", "v", ":", " ", "undefined", ",", " ", "i", ":", " ", "number", ")", " ", "=", ">", " ", "T", ")", ":", " ", "T", "[", "]", " ", "{", "\n",
          "    ", "const", " ", "arr", " ", "=", " ", "Array", "(", "N", ")", ";", "\n",
          "    ", "for", " ", "(", "let", " ", "i", " ", "=", " ", "0", ";", " ", "i", " ", "<", " ", "arr.length", ";", " ", "i", "++", ")", " ", "{", "\n",
          "      ", "arr", "[", "i", "]", " ", "=", " ", "map", "(", "undefined", ",", " ", "i", ")", ";", "\n",
          "    ", "}", "\n",
          "    ", "return", " ", "arr", ";", "\n",
          "  ", "}"])
  expectEquals(
    "function",
    tsCompile("""export function<T>() {
      return 1 as number
    }"""),
    """export function/*<T>*/() {
      return 1 /*as number*/
    }""")
  if False:
    # test tsCompile()
    expectEquals("type", tsCompile("""export type Foo = {
      bar: number;
      baz: string = '1' as string;
    }
  const foo = 13;"""), """/*export type Foo = {
      bar: number;
      baz: string = '1' as string;
    }*/
  const foo = 13;""")
    expectEquals("classes", tsCompile("""export class Foo {
      bar: number;
      baz: string = '1' as string;
      constructor() {}
    }
    const foo = 13;"""), """export class Foo {
      bar/*: number*/;
      baz/*: string*/ = '1'/* as string*/;
      constructor() {}
    }
    const foo = 13;""")
    expectEquals("functions", tsCompile("""const diffMap: StringMap<Partial<Diff<T>>> = {};
    function makeComponent<A extends Parameters<any>>(onRender: RenderFunction<A>, options: ComponentOptions= {}): ComponentFunction<A> {}
    type _EventListener<T = Event> = ((event: T) => void);
    """), """const diffMap/*: StringMap<Partial<Diff<T>>>*/ = {};
    function makeComponent/*<A extends Parameters<any>>*/(onRender/*: RenderFunction<A>*/, options/*: ComponentOptions*/= {})/*: ComponentFunction<A>*/ {}
    /*type _EventListener<T = Event> = ((event: T) => void);*/
    """)
    expectEquals("classBug", tsCompile(r"""
    export class CountryDate {
      countryIsoString: string;
      country: string;
      constructor(countryIsoString: string, country: string = "GMT") {
        this.countryIsoString = countryIsoString;
        this.country = country;
      }
      /** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones - e.g. "Europe/Prague" */
      static fromIsoString(isoString: string, country: string = "GMT"): CountryDate {
        const match = isoString.match(/^(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(?:\.(\d+))?)?(?:([\-+\d]+):(\d+))?/);
      }
    }""".strip()), r"""
    export class CountryDate {
      countryIsoString/*: string*/;
      country/*: string*/;
      constructor(countryIsoString/*: string*/, country/*: string*/ = "GMT") {
        this.countryIsoString = countryIsoString;
        this.country = country;
      }
      /** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones - e.g. "Europe/Prague" */
      static fromIsoString(isoString/*: string*/, country/*: string*/ = "GMT")/*: CountryDate*/ {
        const match = isoString.match(/^(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(?:\.(\d+))?)?(?:([\-+\d]+):(\d+))?/);
      }
    }""".strip())
    expectEquals("stringBug", tsCompile(r"""
      `hello world`;
      const incrementValue = (by: number) => {};
    """.strip()), r"""
      `hello world`;
      const incrementValue = (by/*: number*/) => {};
    """.strip())
