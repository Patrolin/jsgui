package main
import "core:fmt"
import "core:os"
import "core:strings"
import win "core:sys/windows"

@(test)
test_compile :: proc() {
	if ODIN_OS == .Windows {
		win.SetConsoleOutputCP(win.CODEPAGE(win.CP_UTF8))
	}
	test_file :: string(#load("test_file.mts"))
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)string(""))
	javascript_output := parse_entire_file(test_file)
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)javascript_output)
}

/*
Typescipt is a poorly designed language that makes it hard to parse. We can't just switch
on one token and go from there, we have to constantly guess and rollback if we were wrong.
Therefore we are basically forced to copy the following structure:

STATEMENT :: "export" (TYPE_STATEMENT | INTERFACE_STATEMENT | CLASS_STATEMENT | FUNCTION_STATEMENT | VAR_STATEMENT)
TYPE_STATEMENT :: "type" NAME GENERIC? "=" "{" _IGNORE_UNTIL_MATCHING_BRACKET "}"
INTERFACE_STATEMENT :: "interface" NAME "{" _IGNORE_UNTIL_MATCHING_BRACKET "}"
CLASS_STATEMENT :: "class NAME "{" CLASS_PROPERTY[] "}"
	CLASS_PROPERTY :: (CLASS_VARIABLE | CLASS_METHOD)[]
	CLASS_VARIABLE :: NAME ":" TYPE ("=" VALUE)? ";"?
	CLASS_METHOD :: FUNCTION_DECL
FUNCTION_STATEMENT :: "function" FUNCTION_DECL
	FUNCTION_DECL :: NAME GENERIC "(" FUNCTION_ARGS ")" "{" STATMENT[] "}"
VAR_STATEMENT :: (VAR_DECL | SINGLE_ASSIGN | MULTI_ASSIGN | VALUE)
	VAR_DECL :: ("var" | "let" | "const")? NAME = VALUE ";"?
	SINGLE_ASSIGN :: NAME "=" VALUE ";"?
	MULTI_ASSIGN :: "[" NAME[","] "]" "=" VALUE ";"?
VALUE :: _UNTIL_NEWLINE_OR_END_OF_BRACKET_OR_SEMICOLON
*/

DEBUG_PARSER :: true
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
	if DEBUG_PARSER {fmt.printfln("parse_until_end_of_bracket")}
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
	if DEBUG_PARSER {fmt.printfln("-parse_until_end_of_bracket")}
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
	if DEBUG_PARSER {fmt.printfln("parse_until_end_of_expression")}
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
	}
	if DEBUG_PARSER {fmt.printfln("-parse_until_end_of_expression")}
}
