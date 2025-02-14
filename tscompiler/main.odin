package main
import "core:fmt"
import "core:os"
import "core:strings"

test_file :: string(#load("test_file.mts"))
main :: proc() {
	// TODO: return errors instead of asserting
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)string(""))
	javascript_output := parse_entire_file(test_file)
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)javascript_output)
}
parse_entire_file :: proc(file: string) -> string {
	parser := make_parser(file)
	sb := strings.builder_make_none()
	for parse_statement(&parser, &sb) {}
	//fmt.assertf(parser.i == len(file) - 1, "Malformed input: %v", parser) // TODO: uncomment this
	return strings.to_string(sb)
}
parse_statement :: proc(parser: ^Parser, sb: ^strings.Builder) -> bool {
	fmt.println(strings.to_string(sb^))
	if parser.token == "export" {
		eat_token(parser, sb)
	}
	if parser.token_type == .EndOfFile || parser.token_type == .CurlyBracketRight {return false}
	switch parser.token {
	case "function":
		parse_function_declaration(parser, sb)
	case "var", "let", "const":
		fmt.assertf(false, "variable_declaration, %v", parser)
	case "return":
		eat_token(parser, sb)
		parse_expression(parser, sb)
	case "throw":
		fmt.assertf(false, "throw, %v", parser)
	case:
		parse_expression(parser, sb)
	}
	return false // TODO
}
parse_function_declaration :: proc(parser: ^Parser, sb: ^strings.Builder) {
	eat_token(parser, sb)
	// function_name
	fmt.assertf(parser.token_type == .Alphanumeric, "%v", parser)
	eat_token(parser, sb)
	// generic
	if parser.token_type == .AngleBracketLeft {
		fmt.sbprint(sb, "/*")
		parse_until_end_of_bracket(parser, sb)
		fmt.sbprint(sb, "*/")
	}
	// arguments
	fmt.assertf(parser.token_type == .RoundBracketLeft, "%v", parser)
	eat_token(parser, sb)
	for {
		fmt.assertf(parser.token_type == .Alphanumeric, "%v", parser)
		eat_token(parser, sb)
		if parser.token_type == .QuestionMarkColon || parser.token_type == .Colon {
			fmt.sbprint(sb, "/*")
			eat_token(parser, sb)
			parse_until_end_of_expression(parser, sb, .Comma)
			fmt.sbprint(sb, "*/")
		}
		if parser.token_type == .Comma {
			eat_token(parser, sb)
		} else if parser.token_type == .RoundBracketRight {
			eat_token(parser, sb)
			break
		} else {
			fmt.assertf(false, "%v", parser)
		}
	}
	// code block
	fmt.assertf(parser.token_type == .CurlyBracketLeft, "%v", parser)
	eat_token(parser, sb)
	for parse_statement(parser, sb) {}
	fmt.assertf(parser.token_type == .CurlyBracketRight, "%v", parser)
	eat_token(parser, sb)
}
parse_expression :: proc(parser: ^Parser, sb: ^strings.Builder) {
	switch parser.token_type {
	case .RoundBracketLeft:
		fmt.assertf(false, "TODO: bracket/lambda")
	case .SquareBracketLeft:

	}
	fmt.assertf(false, "todo")
	//fmt.assertf(parser.token_type != .RoundBracketLeft)
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
			return
		}
		eat_token(parser, sb)
	}
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
