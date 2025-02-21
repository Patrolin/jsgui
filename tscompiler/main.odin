package main
import "core:fmt"
import "core:os"
import "core:strings"

test_file :: string(#load("test_file.mts"))
main :: proc() {
	// TODO: include imports
	fmt.printfln("args: %v", os.args)
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)string(""))
	javascript_output := parse_entire_file(test_file)
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)javascript_output)
}
DEBUG_PARSER :: false
parse_entire_file :: proc(file: string) -> string {
	parser := make_parser(file)
	sb := strings.builder_make_none()
	for parser.token_type != .EndOfFile {
		if DEBUG_PARSER {fmt.printfln("parser: %v", parser)}
		#partial switch parser.token_type {
		case .AngleBracketLeft:
			if parser.whitespace == "" {
				parse_generic(&parser, &sb)
				continue
			}
		case .QuestionMarkColon:
			parse_type(&parser, &sb)
			continue
		case .Colon:
			if parser.whitespace == "" {
				parse_type(&parser, &sb)
				continue
			}
		case .Alphanumeric:
			switch parser.token {
			case "as":
				parse_as(&parser, &sb)
				continue
			case "type":
				parse_type_definition(&parser, &sb)
			}
		}
		eat_token(&parser, &sb)
	}
	return strings.to_string(sb)
}

parse_generic :: proc(parser: ^Parser, sb: ^strings.Builder) {
	fmt.sbprint(sb, "/*")
	parse_until_end_of_bracket(parser, sb)
	fmt.sbprint(sb, "*/")
}
parse_until_end_of_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) {
	bracket_count := 0
	for {
		if parser.token_type >= TokenType.RoundBracketLeft &&
		   parser.token_type <= TokenType.AngleBracketLeft {
			bracket_count += 1
		}
		if parser.token_type >= TokenType.RoundBracketRight &&
		   parser.token_type <= TokenType.AngleBracketRight {
			bracket_count -= 1
		}
		if parser.token_type == .EndOfFile {return}
		eat_token(parser, sb)
		if bracket_count <= 0 {return}
	}
}


parse_type :: proc(parser: ^Parser, sb: ^strings.Builder) {
	fmt.sbprint(sb, "/*")
	eat_token(parser, sb)
	parse_until_end_of_expression(parser, sb, .Equals)
	fmt.sbprint(sb, "*/")
}
parse_as :: proc(parser: ^Parser, sb: ^strings.Builder) {
	fmt.sbprint(sb, "/*")
	eat_token(parser, sb)
	parse_until_end_of_expression(parser, sb, .Comma)
	fmt.sbprint(sb, "*/")
}
parse_type_definition :: proc(parser: ^Parser, sb: ^strings.Builder) {
	eat_whitespace(parser, sb)
	fmt.sbprint(sb, "/*")
	eat_token(parser, sb)
	eat_token(parser, sb)
	parse_until_end_of_expression(parser, sb, .Comma)
	fmt.sbprint(sb, "*/")
}
parse_until_end_of_expression :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	max_end_of_expression: TokenType,
) {
	bracket_count := 0
	for {
		if parser.token_type >= TokenType.RoundBracketLeft &&
		   parser.token_type <= TokenType.AngleBracketLeft {
			bracket_count += 1
		}
		if parser.token_type >= TokenType.RoundBracketRight &&
		   parser.token_type <= TokenType.AngleBracketRight {
			bracket_count -= 1
		}
		if parser.token_type == .EndOfFile ||
		   (bracket_count < 0) ||
		   (bracket_count == 0 &&
				   parser.token_type >= .Semicolon &&
				   parser.token_type <= max_end_of_expression) {
			if DEBUG_PARSER {fmt.printfln("-return")}
			return
		}
		if DEBUG_PARSER {fmt.printfln("bracket_count: %v, expr: %v", bracket_count, parser)}
		eat_token(parser, sb)
		if parser.token_type == .EqualsAngleBracketRight {
			if DEBUG_PARSER {fmt.printfln("bracket_count: %v, expr: %v", bracket_count, parser)}
			eat_token(parser, sb)
			parse_until_end_of_expression(parser, sb, .Equals)
		}
	}
}
