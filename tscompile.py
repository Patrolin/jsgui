import re
from typing import Callable

def findNotWhitespace(string: str, start: int) -> int:
  i = start
  while i < len(string):
    char = string[i]
    if char != ' ' and char != '\t' and char != '\r' and char != '\n':
      return i
    i += 1
  return i
def indexOrEnd(string: str, substring: str, start: int|None, end: int|None = None) -> int:
  try:
    return string.index(substring, start, end)
  except ValueError:
    return len(string)
def findBracketEnd(string: str, stop_chars: str, start: int) -> int:
  i = start
  bracket_count = 0
  while i < len(string):
    char = string[i]
    if char in "([{<":
      bracket_count += 1
    elif char in ")]}>":
      if string[i-1] != "=":
        bracket_count -= 1
    if (bracket_count == 0 and char in stop_chars) or (bracket_count < 0):
      break
    i += 1
  return i
def escapeMultiLineComments(string: str) -> str:
  return re.sub(r"\*/", "*//*", string)

def replaceTypeStatement(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  statementStart = findNotWhitespace(accTs, matchStart)
  semicolonStart = findBracketEnd(accTs, ';', matchEnd)
  semicolonEnd = semicolonStart + 1
  nextStartOfLine = re.search(r"^[\n/a-zA-Z$_(\[]", f" {accTs[matchEnd:]}", re.MULTILINE)
  endByStartOfLine = (matchEnd + nextStartOfLine.start(0) - 2) if nextStartOfLine != None else len(accTs)
  statementEnd = min(semicolonEnd, endByStartOfLine)
  #print('ayaya.type', repr(accTs[matchStart:statementEnd]))
  return f"{accTs[matchStart:statementStart]}/*{escapeMultiLineComments(accTs[statementStart:statementEnd])}*/", statementEnd
def replaceValue(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  i = findBracketEnd(accTs, ';,', matchEnd)
  return f"/*{accTs[matchStart:i]}*/", i
def replaceColon(accTs: str, matchStart: int, matchEnd: int, isFunctionReturn: bool = False) -> tuple[str, int]:
  replaceWith = accTs[matchStart:matchEnd-1]
  search_start = matchEnd
  while True:
    i = indexOrEnd(accTs, '{', search_start) if isFunctionReturn else findBracketEnd(accTs, ',=;', search_start) # NOTE: stop on ) if negative bracket_count
    while accTs[i:i+2] == "=>":
      i = findBracketEnd(accTs, ',=;', i+2)
    #print('ayaya.1', repr(accTs[i:i+8]), repr(accTs[search_start:i]))
    spaceOrNothing = " " if accTs[i-1] == " " else ""
    replaceWith += f"/*: {accTs[search_start:i].strip()}*/{spaceOrNothing}"
    search_start = i
    nextColon = findBracketEnd(accTs, ':', search_start)
    nextBracket = findBracketEnd(accTs, ')', search_start)
    nextSemicolon = findBracketEnd(accTs, ';', search_start)
    if nextColon >= nextBracket or nextColon >= nextSemicolon or isFunctionReturn:
      break
    replaceWith += accTs[i:nextColon]
    #print('ayaya.2', repr(accTs[nextColon:nextColon+12]))
    search_start = nextColon + 1
  return replaceWith, search_start
def replaceClassColon(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  prev_i = indexOrEnd(accTs, "{", matchEnd) + 1
  replaceWith = accTs[matchStart:prev_i]
  constructorStart = indexOrEnd(accTs, "constructor", prev_i)
  while True:
    nameStart = prev_i
    while nameStart < len(accTs):
      char = accTs[nameStart]
      if char == " " or char == "\t" or char == "\n" or char == "\r":
        nameStart += 1
      else:
        break
    #print("ayaya.class.0", nameStart, constructorStart)
    if nameStart >= constructorStart: break
    _colonStart = findBracketEnd(accTs, ":", nameStart)
    questionColonStart = _colonStart-1 if accTs[_colonStart-1] == "?" else _colonStart
    replaceWith += accTs[prev_i:questionColonStart]
    typeEnd = findBracketEnd(accTs, "=;", questionColonStart)
    if accTs[typeEnd:typeEnd+2] == "=>":
      typeEnd = findBracketEnd(accTs, "=;", typeEnd+2)
    replaceWith += f"/*{accTs[questionColonStart:typeEnd].strip()}*/"
    if accTs[typeEnd-1] == " ": replaceWith += " "
    # value
    valueEnd = findBracketEnd(accTs, ";", typeEnd)
    asStart = indexOrEnd(accTs, " as ", typeEnd, valueEnd)
    if asStart < valueEnd:
      replaceWith += accTs[typeEnd:asStart]
      replaceAsWith, asEnd = replaceValue(accTs, asStart, asStart+4)
      replaceWith += replaceAsWith
      typeEnd = asEnd
    replaceWith += f"{accTs[typeEnd:valueEnd]};"
    #print(f"ayaya.class.2, {repr(accTs[nameStart:colonStart])}, {repr(accTs[colonStart:typeEnd])}, {repr(accTs[typeEnd:valueEnd])}")
    prev_i = valueEnd + 1
  return replaceWith, prev_i
def replaceGeneric(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  start = matchStart
  i = findBracketEnd(accTs, '>', matchStart)
  i += 1
  return f"/*{accTs[start:i]}*/", i
def ignoreSingleLineComment(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  start = matchEnd
  i = indexOrEnd(accTs, '\n', start)
  return f"//{accTs[start:i]}", i
def ignoreMultiLineComment(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  start = matchEnd
  i = indexOrEnd(accTs, '*/', start)
  return f"/*{accTs[start:i]}", i
def ignoreString(accTs: str, matchStart: int, matchEnd: int) -> tuple[str, int]:
  return accTs[matchStart:matchEnd], matchEnd

Replacer = Callable[[str, int, int], tuple[str, int]]
def tsCompile(accTs: str) -> str:
  # transpile typescript to javascript
  replacers: list[tuple[str, Replacer]] = [
    (r"//", ignoreSingleLineComment),
    (r"/\*", ignoreMultiLineComment),
    (r"`[^`]*`", ignoreString),
    (r'"[^"]*"', ignoreString),
    (r"'[^']*'", ignoreString),
    (r"/[^/]/", ignoreString),
    (r"^\s*(?:export )?type ", replaceTypeStatement),
    (r" as ", replaceValue),
    (r"^\s*(?:export )?(?:var|let|const) [^:={]+:", replaceColon), # variable declarations
    (r"\([^`\"'/?{:\)]+:", replaceColon), # function declarations
    (r"^\s*(?:export )?class ", replaceClassColon), # class declarations
    (r"\):", lambda *args: replaceColon(*args, isFunctionReturn = True)),
    (r"()<[A-Za-z0-9$_ \[\]<>]+>", replaceGeneric),
  ]
  searchStart = 0
  while True:
    tsSlice = accTs[searchStart:]
    matches = [(re.search(regex, tsSlice, re.MULTILINE), replacer) for regex, replacer in replacers]
    first_match = min(matches, key = lambda v: v[0].start(0) if v[0] else len(accTs))
    match, replacer = first_match
    if match == None: break
    replaceWith, end = replacer(tsSlice, match.start(0), match.end(0))
    replaceStart = searchStart + match.start(0)
    accTs = accTs[:replaceStart] + replaceWith + accTs[searchStart + end:]
    searchStart = replaceStart + len(replaceWith)
    #print(f"{match}   ->   {repr(replaceWith)}")
  return accTs # returns accJs

if __name__ == '__main__':
  passed = 0
  total = 0
  def expectEquals(name: str, got: str, expected: str):
    global passed, total
    if got != expected:
      print(f"- Test '{name}' failed:")
      print("-- GOT --", got, "-- EXPECTED --", expected, sep='\n')
    else:
      print(f"- Test '{name}' passed.")
      passed += 1
    total += 1
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
