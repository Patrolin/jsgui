from shutil import copy, rmtree
from os.path import isdir, getmtime
from os import makedirs, walk as os_walk
from dataclasses import dataclass
from enum import Enum
from time import sleep
from tscompile import tsCompile

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

def printChangeable(string: str):
  print(string, end='\r', flush=True)

class TaskType(Enum):
  Copy = 0
  TsCompile = 1

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
    Task(TaskType.Copy, "jsgui/jsgui.ts", "jsgui/out"),
    Task(TaskType.TsCompile, "jsgui", "jsgui/out")
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
        elif task.task_type.value == TaskType.TsCompile.value:
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
        elif task.task_type.value == TaskType.TsCompile.value:
          accTs = ""
          for file_name, file_path in walk(task.src, "out"):
            _, file_extension = splitFilePath(file_name, '.')
            if file_extension == 'ts':
              accTs += f"/* {file_name} */\n"
              with open(file_path, "r") as f:
                accTs += f.read()
          accJs = tsCompile(accTs)
          print(f"{task.src}/** -> {task.dest}/{task.src}.js {len(accJs)}")
          with open(f"{task.dest}/{task.src}.js", "w+") as f:
            f.write(accJs)
        task.done = True
        print_state()
      sleep(.1)
      if all(v.done for v in tasks): break
  finally:
    print()
