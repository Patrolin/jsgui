package main
import "core:fmt"
import "core:os"
import "core:path/filepath"
import "core:slice"
import "core:sort"
import "core:strings"
import win "core:sys/windows"

BuildTaskType :: enum {
	Copy,
	MtsCompile,
}
BuildTask :: struct {
	type: BuildTaskType,
	src:  string,
	out:  string,
}
BUILD_TASKS :: []BuildTask {
	BuildTask{BuildTaskType.Copy, "jsgui/jsgui.css", "jsgui/out"},
	BuildTask{BuildTaskType.MtsCompile, "jsgui", "jsgui/out"},
	//BuildTask{BuildTaskType.MtsCompile, "docs", "docs/out"},
}

main :: proc() {
	if ODIN_OS == .Windows {
		win.SetConsoleOutputCP(win.CODEPAGE(win.CP_UTF8))
	}
	for task in BUILD_TASKS {
		os.make_directory(task.out)
		remove_files_under(task.out)
	}
	for task in BUILD_TASKS {
		switch task.type {
		case .Copy:
		// TODO
		case .MtsCompile:
			{
				out_file_path := strings.join({task.out, "/", task.src}, "")
				mts_out_file_path := strings.join({out_file_path, ".mts"}, "")
				mjs_out_file_path := strings.join({out_file_path, ".mjs"}, "")
				fmt.printfln("--- %v, %v ---", mts_out_file_path, mjs_out_file_path)
				// find imports
				file_paths_to_include := get_files_under(task.src, ".mts")
				file_paths_to_include_set := as_set(file_paths_to_include[:])
				files: map[string]string
				file_path_to_imports: map[string][dynamic]string
				import_to_imported_by: map[string]string
				for i := 0; i < len(file_paths_to_include); i += 1 {
					file_path := file_paths_to_include[i]
					backslash_index := strings.index(file_path, "\\")
					fmt.assertf(backslash_index == -1, "Found a backslash: %v", file_path)
					file, error := os.read_entire_file_from_filename_or_err(file_path)
					fmt.assertf(
						error == nil,
						"Failed to read file: '%v', error: %v, imported_by: '%v:0'",
						file_path,
						error,
						file_path in import_to_imported_by ? import_to_imported_by[file_path] : "",
					)
					import_paths_relative_to_file, remaining_file := parse_imports(string(file))
					import_paths_abs: [dynamic]string
					files[file_path] = string(remaining_file)
					file_dir := filepath.dir(file_path)
					for import_path_relative_to_file in import_paths_relative_to_file {
						import_path_relative_to_pwd := strings.join(
							{file_dir, import_path_relative_to_file},
							"/",
						)
						import_path_abs, _did_allocate := filepath.abs(import_path_relative_to_pwd)
						import_path_abs, _did_allocate = filepath.to_slash(import_path_abs)
						if !(import_path_abs in file_paths_to_include_set.m) {
							append(&file_paths_to_include, import_path_abs)
							set_add(&file_paths_to_include_set, import_path_abs)
							append(&import_paths_abs, import_path_abs)
							import_to_imported_by[import_path_abs] = file_path
						}
					}
					file_path_to_imports[file_path] = import_paths_abs
				}
				slice.sort(file_paths_to_include[:])
				// include files
				added_set: Set(string)
				sb := strings.builder_make_none()
				bundled_file := ""
				made_progress := true
				k := 1
				for made_progress && len(file_paths_to_include) > 0 {
					fmt.printfln("%v)", k)
					k += 1
					made_progress = false
					for i := 0; i < len(file_paths_to_include); i += 1 {
						file_path := file_paths_to_include[i]
						imports := file_path_to_imports[file_path]
						can_include := true
						for import_ in imports {
							if !(import_ in added_set.m) {
								can_include = false
								break
							}
						}
						if can_include {
							fmt.printfln("+ '%v'", file_path)
							fmt.sbprint(&sb, files[file_path])
							ordered_remove(&file_paths_to_include, i)
							set_add(&added_set, file_path)
							made_progress = true
						}
					}
				}
				if (len(added_set.m) != len(file_paths_to_include_set.m)) {
					fmt.println("Missing items:")
					for file_path in set_diff(as_set(file_paths_to_include[:]), added_set).m {
						fmt.printfln("- %v", file_path)
						for import_file_path in file_path_to_imports[file_path] {
							fmt.printfln("  - %v", import_file_path)
						}
					}
					fmt.assertf(
						false,
						"Cyclic import, len(added_set): %v, len(file_paths_to_include_set): %v",
						len(added_set.m),
						len(file_paths_to_include_set.m),
					)
				}
				fmt.printfln("mts_out_file_path: %v", mts_out_file_path)
				fmt.printfln("mjs_out_file_path: %v", mjs_out_file_path)
				mts_file := strings.to_string(sb)
				os.write_entire_file(mts_out_file_path, transmute([]u8)mts_file)
				mjs_file, error, parser := parse_entire_file(mts_file)
				os.write_entire_file(mjs_out_file_path, transmute([]u8)mjs_file)
				#partial switch error {
				case .None:
				case:
					fmt.printfln("ParseError: .%v, %v", error, parser)
				}
			}
		}
	}
}
remove_files_under :: proc(dir_path: string) {
	remove_files_under_callback :: proc(
		info: os.File_Info,
		in_err: os.Error,
		user_data: rawptr,
	) -> (
		err: os.Error,
		skip_dir: bool,
	) {
		if !info.is_dir {
			err = os.remove(info.fullpath)
		}
		return
	}
	fmt.assertf(len(dir_path) > 5, "dir_path: %v", dir_path)
	filepath.walk(dir_path, remove_files_under_callback, nil)
}
get_files_under :: proc(dir_path: string, suffix: string) -> (arr: [dynamic]string) {
	get_files_under_callback :: proc(
		info: os.File_Info,
		in_err: os.Error,
		user_data: rawptr,
	) -> (
		err: os.Error,
		skip_dir: bool,
	) {
		data := (^GetFilesUnderData)(user_data)
		if !info.is_dir {
			fullpath_with_slashes, _did_allocate := filepath.to_slash(info.fullpath)
			if strings.ends_with(fullpath_with_slashes, data.suffix) {
				append(data.arr, fullpath_with_slashes)
			}
		}
		return
	}
	GetFilesUnderData :: struct {
		arr:    ^[dynamic]string,
		suffix: string,
	}
	data := GetFilesUnderData {
		arr    = &arr,
		suffix = suffix,
	}
	filepath.walk(dir_path, get_files_under_callback, &data)
	return
}

parse_imports :: proc(file: string) -> (imports: [dynamic]string, remaining_file: string) {
	parser := make_parser(file)
	for parser.token == "import" {
		for parser.token != "from" {eat_token(&parser)}
		eat_token(&parser)
		append(&imports, parser.token)
		eat_token(&parser)
		if parser.token_type == .Semicolon {
			eat_token(&parser)
		}
	}
	eat_whitespace_excluding_comments(&parser)
	remaining_file = parser.file[parser.i:]
	//fmt.printfln("parser: %v", parser)
	return
}
