from shutil import copy, rmtree
from os.path import isdir, getmtime, relpath
from os import makedirs, walk as os_walk
from dataclasses import dataclass
from enum import Enum
from time import sleep
from tscompile import tsCompile
import re

def makedir(path: str, replace: bool = False):
  if path.startswith("/"): raise ValueError(path)
  exists = isdir(path)
  if exists and replace: rmtree(path)
  if (not exists) or replace: makedirs(path)

def walk(root: str, *ignore_dirs: str):
  for dir_path, dirs, files in os_walk(root):
    dir_path = dir_path.replace("\\", "/")
    for file_name in files:
      file_path = f"{dir_path}/{file_name}"
      yield file_name, file_path
    for dir in dirs:
      if dir in ignore_dirs:
        dirs.remove(dir)

def splitFilePath(file_path: str, sep: str = '/') -> tuple[str, str]:
  parts = file_path.rsplit(sep, maxsplit=1)
  return ("", parts[0]) if len(parts) == 1 else (parts[0], parts[1])

def pathRelativeToFile(start_file_path: str, rel_path: str) -> str:
  start_dir_path, _ = splitFilePath(start_file_path)
  return relpath(f"{start_dir_path}/{rel_path}").replace("\\", "/")

def printChangeable(string: str):
  print(string, end='\r', flush=True)

class TaskType(Enum):
  Copy = 0
  MtsCompile = 1

@dataclass
class CodeFile:
  file_path: str
  text_without_imports: str
  imports: list[str]
  def to_short_string(self) -> str:
    return repr(CodeFile(self.file_path, "...", self.imports))

class TaskStatus(Enum):
  Unknown = 0
  Pending = 1
  Done = 2

@dataclass
class Task:
  task_type: TaskType
  src: str
  dest: str
  done: bool = False

if __name__ == '__main__':
  makedir("jsgui/out", True)
  makedir("docs/out", True)
  tasks = [
    Task(TaskType.Copy, "jsgui/jsgui.css", "jsgui/out"),
    Task(TaskType.MtsCompile, "jsgui", "jsgui/out"),
    Task(TaskType.MtsCompile, "docs", "docs/out"),
    #Task(TaskType.MtsCompile, "docs", "docs/out"),
    #Task(TaskType.MjsCompile, "jsgui/out/jsgui.js", "jsgui/out/jsgui.mjs")
  ]
  mtimes: dict[str, float] = {}
  state_strings = [
    "Processing... ({0}/{1})",
    "Done.                  "
  ]
  def print_state():
    if not all(v.done for v in tasks):
      success_count = sum(int(v.done) for v in tasks)
      printChangeable(state_strings[0].format(success_count, len(tasks)))
    else:
      printChangeable(state_strings[1])
  try:
    while True:
      # check if files changed
      for task in tasks:
        if task.task_type.value == TaskType.Copy.value:
          mtime = getmtime(task.src)
          task.done = (task.src in mtimes) and mtime == mtimes[task.src]
          mtimes[task.src] = mtime
        elif task.task_type.value == TaskType.MtsCompile.value:
          need_recompile = False
          for file_name, file_path in walk(task.src, "out"):
            mtime = getmtime(file_path)
            if (file_path not in mtimes) or mtime != mtimes[file_path]:
              need_recompile = True
              mtimes[file_path] = mtime
              print_state()
          task.done = not need_recompile
      print_state()
      # do the task
      for task in tasks:
        if task.done: continue
        if task.task_type.value == TaskType.Copy.value:
          print(f"{task.src} -> {task.dest}/{splitFilePath(task.src)[1]}.js")
          copy(task.src, task.dest)
        elif task.task_type.value == TaskType.MtsCompile.value:
          # add initial files
          code_files_to_link: set[str] = set()
          for file_name, file_path in walk(task.src, "out"):
            code_files_to_link.add(file_path)
          # read and link files
          try:
            read_code_files: dict[str, CodeFile] = {}
            linked_code_files: set[str] = set()
            accTs = ""
            while len(code_files_to_link) > 0:
              made_progress = False
              for file_path in sorted(code_files_to_link):
                # read file if necessary
                if file_path not in read_code_files:
                  made_progress = True
                  _, file_name = splitFilePath(file_path)
                  _, file_extension = splitFilePath(file_name, '.')
                  code_file = CodeFile("", "", [])
                  code_file.file_path = file_path
                  code_file.text_without_imports += f"/* {file_name} */\n"
                  if file_extension == 'ts':
                    with open(file_path, "r") as f:
                      code_file.text_without_imports += f.read()
                    read_code_files[file_path] = code_file
                  elif file_extension == 'mts':
                    text = ""
                    with open(file_path, "r") as f:
                      text = f.read()
                    MTS_IMPORT_REGEX = r"\s*import [^;]*? from [\"']([^;]*?)[\"'];?"
                    for g1 in re.findall(MTS_IMPORT_REGEX, text, re.MULTILINE):
                      import_file_path = pathRelativeToFile(file_path, g1)
                      code_file.imports.append(import_file_path)
                      if import_file_path not in linked_code_files:
                        code_files_to_link.add(import_file_path)
                    code_file.text_without_imports += re.sub(MTS_IMPORT_REGEX, "", text).strip() + "\n"
                    read_code_files[file_path] = code_file
                  else:
                    code_files_to_link.remove(file_path)
                    continue
                # link if possible
                code_file = read_code_files[file_path]
                if all(v in linked_code_files for v in code_file.imports):
                  made_progress = True
                  accTs += code_file.text_without_imports
                  linked_code_files.add(file_path)
                  code_files_to_link.remove(file_path)
              if not made_progress:
                print("Failed to link files: ")
                for file_path in code_files_to_link:
                  message = read_code_files[file_path].to_short_string() if file_path in read_code_files else repr(file_path)
                  print(f"- Invalid import: {message}")
                break
          except FileNotFoundError:
            match = next(v for v in read_code_files.values() if file_path in v.imports)
            print("Failed to link files:")
            print(f"- Missing file: {match.to_short_string()}")
            break
          if len(code_files_to_link) == 0:
            # transpile typescript to javascript
            accJs = tsCompile(accTs)
            # write files
            print(f"{task.src}/**.mts -> {task.dest}/{task.src}.mts {len(accJs)}")
            with open(f"{task.dest}/{task.src}.mts", "w+") as f:
              f.write(accTs)
            print(f"{task.src}/**.mts -> {task.dest}/{task.src}.mjs {len(accJs)}")
            with open(f"{task.dest}/{task.src}.mjs", "w+") as f:
              f.write(accJs)
        task.done = True
        print_state()
      sleep(.1)
      if all(v.done for v in tasks): break
  finally:
    print()
