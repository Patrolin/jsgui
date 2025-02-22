package main
import "core:fmt"
import "core:os"
import win "core:sys/windows"

main :: proc() {
	if ODIN_OS == .Windows {
		win.SetConsoleOutputCP(win.CODEPAGE(win.CP_UTF8))
	}
	test_file :: string(#load("test_file.mts"))
	imports := parse_imports(test_file)
	fmt.printfln("imports: %v", imports)
}
parse_imports :: proc(file: string) -> [dynamic]string {
	imports: [dynamic]string
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
	fmt.printfln("parser: %v", parser)
	return imports
}
