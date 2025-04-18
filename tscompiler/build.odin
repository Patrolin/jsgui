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
	BuildTask{BuildTaskType.Copy, "jsgui/jsgui.css", "jsgui/out/jsgui.css"},
	BuildTask{BuildTaskType.MtsCompile, "jsgui", "jsgui/out"},
	BuildTask{BuildTaskType.MtsCompile, "docs", "docs/out"},
}

main :: proc() {
	if ODIN_OS == .Windows {
		win.SetConsoleOutputCP(win.CODEPAGE(win.CP_UTF8))
	}
	for task in BUILD_TASKS {
		if task.type == .MtsCompile {
			os.make_directory(task.out)
			remove_files_under(task.out)
		}
	}
	for task in BUILD_TASKS {
		switch task.type {
		case .Copy:
			{
				file, ok := os.read_entire_file_from_filename(task.src)
				assert(ok)
				ok = os.write_entire_file(task.out, file)
				assert(ok)
				fmt.printfln("+ %v", task.out)
			}
		case .MtsCompile:
			{
				// TODO: cache files by mtime?
				out_file_path := strings.join({task.out, "/", task.src}, "")
				mts_out_file_path := strings.join({out_file_path, ".mts"}, "")
				mjs_out_file_path := strings.join({out_file_path, ".mjs"}, "")
				fmt.printfln("--- %v, %v ---", mts_out_file_path, mjs_out_file_path)
				// .mts
				files_to_include := get_files_under(task.src, ".mts")
				file_infos_to_include := resolve_imports(files_to_include[:])
				sb: strings.Builder
				for file_info in file_infos_to_include {
					fmt.sbprint(&sb, file_info.remaining_file)
				}
				mts_file := strings.to_string(sb)
				os.write_entire_file(mts_out_file_path, transmute([]u8)mts_file)
				fmt.printfln("+ %v", mts_out_file_path)
				// .mjs
				mjs_file, error, parser := parse_entire_file(mts_file)
				if error != .None {
					fmt.printfln("ParseError: .%v, %v", error, parser)
				}
				os.write_entire_file(mjs_out_file_path, transmute([]u8)mjs_file)
				fmt.printfln("+ %v", mjs_out_file_path)
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

FileInfoHeader :: struct {
	imported_by: string,
	file_path:   string,
}
FileInfo :: struct {
	imported_by:    string `fmt:"-"`,
	file_path:      string,
	imports:        []string,
	remaining_file: string `fmt:"-"`,
	priority:       int,
}
resolve_imports :: proc(files_paths_to_include: []string) -> []FileInfo {
	// add initial files
	files_to_include_set: Set(string)
	files_to_include: [dynamic]FileInfoHeader
	for file_path in files_paths_to_include {
		set_add(&files_to_include_set, file_path)
		append(&files_to_include, FileInfoHeader{"", file_path})
	}
	// parse imports
	file_infos_to_include: [dynamic]FileInfo
	for i := 0; i < len(files_to_include); i += 1 {
		fmt.printf("%v, ", i)
		imported_by := files_to_include[i].imported_by
		file_path := files_to_include[i].file_path
		file_bytes, error := os.read_entire_file_from_filename_or_err(file_path)
		file := string(file_bytes)
		fmt.assertf(
			error == nil,
			"Failed to read file: '%v', error: %v, imported_by: '%v:0'",
			file_path,
			error,
			imported_by,
		)
		file_dir := filepath.dir(file_path)
		imports, remaining_file := parse_imports(file_dir, file)
		append(
			&file_infos_to_include,
			FileInfo{imported_by, file_path, imports[:], remaining_file, 0},
		)
		for import_path in imports {
			if !(import_path in files_to_include_set.m) {
				set_add(&files_to_include_set, import_path)
				append(&files_to_include, FileInfoHeader{file_path, import_path})
			}
		}
	}
	// resolve import order
	included_file_infos: [dynamic]FileInfo
	included_file_paths: Set(string)
	priority := 0
	for len(file_infos_to_include) > 0 {
		made_progress := false
		for i := 0; i < len(file_infos_to_include); {
			file_info := file_infos_to_include[i]
			// can include
			can_include_file := true
			for import_path in file_info.imports {
				if !(import_path in included_file_paths.m) {
					can_include_file = false
					break
				}
			}
			// process file
			if can_include_file {
				made_progress = true
				file_info.priority = priority
				set_add(&included_file_paths, file_info.file_path)
				unordered_remove(&file_infos_to_include, i)
				append(&included_file_infos, file_info)
			} else {
				i += 1
			}
		}
		if !made_progress {
			fmt.printfln("Ordered:")
			for file_info in included_file_infos {
				fmt.printfln("  %v", file_info)
			}
			fmt.printfln("Remaining:")
			for file_info in file_infos_to_include {
				fmt.printfln("  %v", file_info)
			}
			assert(false, "Failed to order imports")
		}
		priority += 1
	}
	// sort by [priority, file_path]
	slice.sort_by(included_file_infos[:], proc(a, b: FileInfo) -> bool {
		if a.priority >= b.priority {return false}
		if a.file_path >= b.file_path {return false}
		return true
	})
	DEBUG_BUILD_ORDER :: false
	if DEBUG_BUILD_ORDER {
		fmt.printfln("Ordered:")
		for file_info in included_file_infos {
			fmt.printfln("  %v, %v", file_info.priority, file_info.file_path)
		}
	}
	return included_file_infos[:]
}
parse_imports :: proc(
	file_dir: string,
	file: string,
) -> (
	imports: [dynamic]string,
	remaining_file: string,
) {
	parser := make_parser(file)
	for parser.token == "import" {
		for parser.token != "from" {next_token(&parser, nil)}
		next_token(&parser, nil)
		append(&imports, path_abs(file_dir, parser.token))
		next_token(&parser, nil)
		if parser.token_type == .Semicolon {
			next_token(&parser, nil)
		}
	}
	if parser.token_group == .Whitespace {
		next_token(&parser, nil, .Comment)
	}
	remaining_file = parser.file[parser.i:]
	return
}
path_abs :: proc(file_dir: string, file_name_rel: string) -> string {
	rel_file_path := strings.join({file_dir, file_name_rel}, "/")
	file_path_abs, _did_allocate := filepath.abs(rel_file_path)
	file_path_abs, _did_allocate = filepath.to_slash(file_path_abs)
	return file_path_abs
}
