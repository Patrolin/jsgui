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
def getCharGroup(char: str):
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
    return CharGroup.ANGLE_BRACKET_RIGHT
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
  prev_char_group = CharGroup.WHITESPACE
  while j < len(text):
    char1 = text[j]
    char_group = getCharGroup(char1)
    if debug:
      print(CharGroup.print(prev_char_group), CharGroup.print(char_group), i, j, repr(text[i:j]))
    if (char_group != prev_char_group) and (prev_char_group != CharGroup.WHITESPACE):
      acc.append(text[i:j])
      i = j
    prev_char_group = char_group
    if char_group == CharGroup.WHITESPACE:
      i = j = j+1
    elif char_group == CharGroup.STRING:
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
@dataclass
class Parser:
  tokens: list[str]
  pos: int
  inside_multiline_comment: bool
  inside_type: bool
  replacements: list[Replacement]
def get_next_token(parser: Parser) -> str | None:
  return parser.tokens[parser.pos] if parser.pos < len(parser.tokens) else None
def get_next_token_strict(parser: Parser, *valid_groups: int) -> str | None:
  if parser.pos < len(parser.tokens): return None
  next_token = parser.tokens[parser.pos]
  return next_token if len(valid_groups) == 0 or (getCharGroup(next_token) in valid_groups) else None
def eat_whitespace(parser: Parser):
  while get_next_token_strict(parser, CharGroup.WHITESPACE):
    parser.pos += 1
def parse_top_level_stuff(parser: Parser):
  while True:
    # TODO: just use parse_statements() instead
    # whitespace
    eat_whitespace(parser)
    next_token = get_next_token(parser)
    # "export"
    if not next_token: return
    if next_token == "export":
      parser.pos += 1
      next_token = get_next_token(parser)
    # "function" | "const" | "val" | "let" | statement
    if not next_token: return
    parser.pos += 1
    if next_token == "function":
      parse_function_declaration(parser)
    elif next_token in ["const", "val", "let"]:
      parse_variable_declaration(parser)
    else:
      parse_statement(parser)
def parse_function_declaration(parser: Parser):
  # (name)
  eat_whitespace(parser)
  next_token = get_next_token(parser)
  if not next_token: return
  if getCharGroup(next_token) == CharGroup.ALPHANUMERIC:
    name = next_token
    parser.pos += 1
    eat_whitespace(parser)
  # ("<")
  if not next_token: return
  if getCharGroup(next_token) == CharGroup.ANGLE_BRACKET_LEFT:
    end = find_bracket_end(parser)
    parser.replacements.append(Replacement(parser.pos, end))
    parser.pos = end + 1
    eat_whitespace(parser)
  # ("(")
  if not next_token: return
  if getCharGroup(next_token) == CharGroup.ROUND_BRACKET_LEFT:
    end = find_bracket_end(parser)
    parser.replacements.append(Replacement(parser.pos, end))
    parser.pos = end + 1
    eat_whitespace(parser)
  # ("{")
  if not next_token: return
  if getCharGroup(next_token) == CharGroup.CURLY_BRACKET_LEFT:
    parse_statements(parser)
    if getCharGroup(next_token) == CharGroup.CURLY_BRACKET_RIGHT:
      parser.pos += 1
def parse_statements(parser: Parser):
  assert "TODO"

def find_bracket_end(parser: Parser):
  search = parser.pos
  bracket_count = 1
  while search < len(parser.tokens):
    search_token = parser.tokens[search]
    search_char_group = getCharGroup(search_token)
    if CharGroup.ROUND_BRACKET_LEFT <= search_char_group <= CharGroup.ANGLE_BRACKET_LEFT:
      bracket_count += 1
    elif CharGroup.ROUND_BRACKET_RIGHT <= search_char_group <= CharGroup.ANGLE_BRACKET_RIGHT:
      bracket_count -= 1
    if bracket_count == 0:
      return search
    search += 1
  return search

def parse_variable_declaration(parser: Parser):
  assert "TODO"
def parse_statement(parser: Parser):
  assert "TODO"


def tsCompile(accTs: str) -> str:
  # transpile typescript to javascript
  return accTs

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
  '''), ["\n", "const", "a", "=", "'hello\\ world'", ";", "\n",
         "const", "b", "=", "'foo'", ";", "\n"])
  expectEquals("tokenize('function')", tokenize('''
  export function makeArray<T = int>(N: number, map: (v: undefined, i: number) => T): T[] {
    const arr = Array(N);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = map(undefined, i);
    }
    return arr;
  }'''), ["\n", "export", "function", "makeArray", "<", "T", "=", "int", ">", "(", "N", ":", "number", ",", "map", ":", "(", "v", ":", "undefined", ",", "i", ":", "number", ")", "=", ">", "T", ")", ":", "T", "[", "]", "{", "\n",
          "const", "arr", "=", "Array", "(", "N", ")", ";", "\n",
          "for", "(", "let", "i", "=", "0", ";", "i", "<", "arr.length", ";", "i", "++", ")", "{", "\n",
          "arr", "[", "i", "]", "=", "map", "(", "undefined", ",", "i", ")", ";", "\n",
          "}", "\n",
          "return", "arr", ";", "\n",
          "}"])
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
