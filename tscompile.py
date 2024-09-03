import re
from typing import Callable

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

def replaceType(accTs: str, match: re.Match) -> tuple[str, int]:
  start = match.end(1)
  i = findBracketEnd(accTs, ';', match.end(0))
  i = findBracketEnd(accTs, ';', i)
  i += 1
  #print('ayaya.type', repr(accTs[start:i]))
  return f"{match[1]}/* {escapeMultiLineComments(accTs[start:i])} */", i
def replaceAs(accTs: str, match: re.Match) -> tuple[str, int]:
  start = match.end(1)
  i = findBracketEnd(accTs, ';', match.end(0))
  return f"{match[1]}/* {accTs[start:i]} */", i
def replaceColon(accTs: str, match: re.Match, isFunctionReturn: bool = False) -> tuple[str, int]:
  replaceWith = match[0][:-1]
  search_start = match.end(0)
  while True:
    i = indexOrEnd(accTs, '{', search_start) if isFunctionReturn else findBracketEnd(accTs, ',=;', search_start) # NOTE: stop on ) if negative bracket_count
    if accTs[i:i+2] == "=>":
      i = findBracketEnd(accTs, ',=;', i+2)
    #print('ayaya.1', repr(accTs[i:i+8]), repr(accTs[search_start:i]))
    replaceWith += f"/*:{accTs[search_start:i]}*/"
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
def replaceClassColon(accTs: str, match: re.Match) -> tuple[str, int]:
  prev_i = indexOrEnd(accTs, "{", match.end(0)) + 1
  replaceWith = accTs[match.start(0):prev_i]
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
    colonStart = findBracketEnd(accTs, ":", nameStart)
    replaceWith += accTs[prev_i:colonStart]
    typeEnd = findBracketEnd(accTs, "=;", colonStart)
    if accTs[typeEnd:typeEnd+2] == "=>":
      typeEnd = findBracketEnd(accTs, "=;", typeEnd+2)
    replaceWith += f"/*{accTs[colonStart:typeEnd].strip()} */"
    valueEnd = findBracketEnd(accTs, ";", typeEnd)
    replaceWith += f"{accTs[typeEnd:valueEnd]};"
    #print(f"ayaya.class.2, {repr(accTs[nameStart:colonStart])}, {repr(accTs[colonStart:typeEnd])}, {repr(accTs[typeEnd:valueEnd])}")
    prev_i = valueEnd + 1
  return replaceWith, prev_i
def replaceGeneric(accTs: str, match: re.Match) -> tuple[str, int]:
  start = match.start(0)
  i = findBracketEnd(accTs, '>', match.start(0))
  i += 1
  return f"/* {accTs[start:i]} */", i
def ignoreSingleLineComment(accTs: str, match: re.Match) -> tuple[str, int]:
  start = match.end(0)
  i = indexOrEnd(accTs, '\n', start)
  return f"//{accTs[start:i]}", i
def ignoreMultiLineComment(accTs: str, match: re.Match) -> tuple[str, int]:
  start = match.end(0)
  i = indexOrEnd(accTs, '*/', start)
  return f"/*{accTs[start:i]}", i
def ignoreString(accTs: str, match: re.Match) -> tuple[str, int]:
  #print('ayaya.ignoreString', match)
  return match[0], match.end(0)

Replacer = Callable[[str, re.Match], tuple[str, int]]
def tsCompile(accTs: str) -> str:
  replacers: list[tuple[str, Replacer]] = [
    (r"//", ignoreSingleLineComment),
    (r"/\*", ignoreMultiLineComment),
    (r"^(\s*)type ", replaceType),
    (r"( )as ", replaceAs),
    (r"^\s*(?:var|let|const) [^:={]+:", replaceColon), # variable declarations
    (r"\([^`\"'/?{:\)]+:", replaceColon), # function declarations
    (r"^(\s*class )", replaceClassColon), # class declarations
    (r"\):", lambda *args: replaceColon(*args, isFunctionReturn = True)),
    (r"()<[A-Za-z0-9$_ \[\]<>]+>", replaceGeneric),
    (r"`[^`]*`", ignoreString),
    (r'"[^"]*"', ignoreString),
    (r"'[^']*'", ignoreString),
    (r"/[^/]/", ignoreString),
  ]
  searchStart = 0
  while True:
    tsSlice = accTs[searchStart:]
    matches = [(re.search(regex, tsSlice, re.MULTILINE), replacer) for regex, replacer in replacers]
    first_match = min(matches, key = lambda v: v[0].start(0) if v[0] else len(accTs))
    match, replacer = first_match
    if match == None: break
    replaceWith, end = replacer(tsSlice, match)
    replaceStart = searchStart + match.start(0)
    accTs = accTs[:replaceStart] + replaceWith + accTs[searchStart + end:]
    searchStart = replaceStart + len(replaceWith)
    #print(f"{match}   ->   {repr(replaceWith)}")
  return accTs # returns accJs

if __name__ == '__main__':
  if True:
    result = tsCompile("""
      const spanSection = makeComponent(function spanSection() {
        for (let href of [undefined, "https://www.google.com"]) {
        }
      }""".strip())
  else:
    result = tsCompile("""
    type X = number | string;
    type Y<T> = Bar<T> & {};
    type Bar = {
      a: {foo: string, bar: number};
    };
    type Zee = {
      a: {foo: string, bar: number};
    };
    const z = 'foo' as 'foo' | 'bar';
    const z: string = 'foo';
    type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => RenderReturn;
    type GetErrorsFunction<K extends string> = (errors: Partial<Record<K, string>>) => void;
    class Z {
      a: int;
      b: string = '';
      data: StringMap<DispatchTarget>;
      addListeners: (key: string) => DispatchTargetAddListeners;
      constructor() {}
      useState<T extends any>() {...}
    }
    // const z: string = "hello";
    function foo<T>(a: T, b: T): T {
      return a + b;
    }
    const diffMap: StringMap<Partial<Diff<T>>> = {};
    function makeComponent<A extends Parameters<any>>(onRender: RenderFunction<A>, options: ComponentOptions= {}): ComponentFunction<A> {}
    type _EventListener<T = Event> = ((event: T) => void);
    if (usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, component);
    /* ... */
    """.strip())
  print()
  print(result)
