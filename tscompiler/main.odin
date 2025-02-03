package main
import "core:fmt"

test_file :: string(#load("test_file.ts"))
main :: proc() {
	parser := make_parser(test_file)
	for parser.i < len(parser.file) {
		token_type := eat_whitespace(&parser)
		if token_type == .EndOfFile {return}
		token := eat_next_token(&parser, token_type)
		fmt.printfln("token: %v, token_type: %v, parser: %v", token, token_type, parser)
	}
}
