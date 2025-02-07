package main
import "core:fmt"
import "core:os"
import "core:strings"

test_file :: string(#load("test_file.mts"))
main :: proc() {
	parser := make_parser(test_file)
	sb := strings.builder_make_none()
	for parser.i < len(parser.file) {
		parse_top_level(&parser, &sb)
		break
	}
}
assert_token :: proc(
	condition: bool,
	token_type: TokenType,
	token: string,
	loc := #caller_location,
) {
	fmt.assertf(condition, "Invalid token: .%v, '%v'", token_type, token, loc = loc)
}
print_token :: proc(prefix: string, token_type: TokenType, token: string) {
	fmt.printfln("%v, token_type: .%v, token: '%v'", prefix, token_type, token)
}
parse_top_level :: proc(parser: ^Parser, sb: ^strings.Builder) {
	token_type, token, whitespace, did_newline := eat_whitespace(parser)
	if token_type == .EndOfFile {return}
	assert_token(token_type == .Alphanumeric, token_type, token)
	if token == "export" {
		fmt.sbprint(sb, whitespace)
		fmt.sbprint(sb, token)
		token_type, token, whitespace, did_newline = eat_whitespace(parser)
		assert_token(token_type == .Alphanumeric, token_type, token)
	}
	fmt.sbprint(sb, whitespace)
	switch token {
	case "function":
		parse_function_declaration(parser, sb)
	case:
		fmt.assertf(false, "Unknown token: '%v'", token)
	}
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)strings.to_string(sb^))
}
parse_function_declaration :: proc(parser: ^Parser, sb: ^strings.Builder) {
	fmt.sbprint(sb, "function")
	// function_name
	token_type, token, whitespace, did_newline := eat_whitespace(parser)
	assert_token(token_type == .Alphanumeric, token_type, token)
	fmt.sbprint(sb, whitespace)
	fmt.sbprint(sb, token)
	// generic
	token_type, token, whitespace, did_newline = eat_whitespace(parser)
	if token_type == .AngleBracketLeft {
		fmt.sbprint(sb, "/*")
		fmt.sbprint(sb, whitespace)
		fmt.sbprint(sb, token)
		parse_until_end_of_bracket(parser, sb)
		fmt.sbprint(sb, "*/")
		token_type, token, whitespace, did_newline = eat_whitespace(parser)
	}
	// arguments
	assert_token(token_type == .RoundBracketLeft, token_type, token)
	fmt.sbprint(sb, whitespace)
	fmt.sbprint(sb, token)
	for token_type != .RoundBracketRight {
		token_type, token, whitespace, did_newline = eat_whitespace(parser)
		assert_token(token_type == .Alphanumeric, token_type, token)
		fmt.sbprint(sb, whitespace)
		fmt.sbprint(sb, token)
		token_type, token, whitespace, did_newline = eat_whitespace(parser)
		if token_type == .QuestionMarkColon || token_type == .Colon {
			// NOTE: we ignore whitespace before .Colon
			fmt.sbprint(sb, "/*")
			fmt.sbprint(sb, token)
			token_type, token, whitespace, did_newline = parse_until_end_of_expression(parser, sb)
			fmt.sbprint(sb, "*/")
			fmt.sbprint(sb, whitespace)
			fmt.sbprint(sb, token)
		}
		assert_token(token_type == .Comma || token_type == .RoundBracketRight, token_type, token)
	}
	// code block
	token_type, token, whitespace, did_newline = eat_whitespace(parser)
	assert_token(token_type == .CurlyBracketLeft, token_type, token)
	fmt.sbprint(sb, whitespace)
	fmt.sbprint(sb, token)
	// TODO: parse_statements
}
parse_until_end_of_expression :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
) -> (
	token_type: TokenType,
	token: string,
	whitespace: string,
	did_newline: bool,
) {
	bracket_count := 0
	for bracket_count >= 0 {
		token_type, token, whitespace, did_newline = eat_whitespace(parser)
		if token_type >= .EndOfFile && token_type <= .Semicolon {
			return
		}
		fmt.sbprint(sb, whitespace)
		fmt.sbprint(sb, token)
		if token_type >= TokenType.RoundBracketLeft && token_type <= TokenType.AngleBracketLeft {
			bracket_count += 1
		}
		if token_type >= TokenType.RoundBracketRight && token_type <= TokenType.AngleBracketRight {
			bracket_count -= 1
		}
	}
	return
}
parse_until_end_of_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) {
	bracket_count := 1
	for bracket_count > 0 {
		token_type, token, whitespace, did_newline := eat_whitespace(parser)
		fmt.sbprint(sb, whitespace)
		fmt.sbprint(sb, token)
		if token_type == .EndOfFile {break}
		if token_type >= TokenType.RoundBracketLeft && token_type <= TokenType.AngleBracketLeft {
			bracket_count += 1
		}
		if token_type >= TokenType.RoundBracketRight && token_type <= TokenType.AngleBracketRight {
			bracket_count -= 1
		}
	}
	return
}
