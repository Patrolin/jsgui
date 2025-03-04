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
	mjs_output, error, parser := parse_entire_file(test_file)
	os.write_entire_file("tscompiler/test_file.mjs", transmute([]u8)mjs_output)
	#partial switch error {
	case .None:
	case:
		fmt.assertf(false, "%v", parser)
	}
}

/*
Typescipt is a poorly designed language that makes it hard to parse. We can't just switch
on one token and go from there, we have to constantly guess and rollback if we were wrong.
We don't even know if something is a function or not, because there's 3 different ways
to declare them: `() => {}`, `function name(){}`, `name(){}` (inside classes).
We are also forced to parse lambdas (which we also don't know whether they are lambdas
or function calls or just brackets for math), so we also have to parse the entirety of VALUE.
Therefore we are practically forced to copy the following structure:

STATEMENT :: "export" (TYPE_STATEMENT | INTERFACE_STATEMENT | CLASS_STATEMENT | FUNCTION_STATEMENT | VAR_STATEMENT)
TYPE_STATEMENT :: "type" NAME GENERIC? "=" "{" _IGNORE_UNTIL_MATCHING_BRACKET "}"
INTERFACE_STATEMENT :: "interface" NAME "{" _IGNORE_UNTIL_MATCHING_BRACKET "}"
CLASS_STATEMENT :: "class NAME "{" CLASS_PROPERTY[] "}"
	CLASS_PROPERTY :: (CLASS_VARIABLE | CLASS_METHOD)[]
	CLASS_VARIABLE :: NAME ":" TYPE ("=" VALUE)? ";"?
	CLASS_METHOD :: FUNCTION_DECL
FUNCTION_STATEMENT :: "function" FUNCTION_DECL
	FUNCTION_DECL :: NAME GENERIC "(" FUNCTION_ARG[","] ")" "{" STATMENT[] "}"
	GENERIC :: "<" _IGNORE_UNTIL_MATCHING_BRACKET ">"
VAR_STATEMENT :: (VAR_DECL | SINGLE_ASSIGN | MULTI_ASSIGN | VALUE)
	VAR_DECL :: ("var" | "let" | "const")? NAME = VALUE ";"?
	SINGLE_ASSIGN :: NAME "=" VALUE ";"?
	MULTI_ASSIGN :: "[" NAME[","] "]" "=" VALUE ";"?
VALUE :: _UNTIL_NEWLINE_OR_END_OF_BRACKET_OR_SEMICOLON

*/
DEBUG_PARSER :: true
parse_entire_file :: proc(file: string) -> (mjs: string, error: ParseError, parser: Parser) {
	parser = make_parser(file)
	sb := strings.builder_make_none()
	for parser.token_type != .EndOfFile {
		if DEBUG_PARSER {fmt.printfln("parser: %v", parser)}
		error := parse_statement(&parser, &sb)
		if error != .None {
			return strings.to_string(sb), error, parser
		}
	}
	return strings.to_string(sb), .None, parser
}
ParseError :: enum {
	None,
	NotImplemented,
	UnexpectedToken,
	ExpectedName,
	ExpectedEquals,
	ExpectedCurlyBracketRight,
	ExpectedBracketLeft,
	ExpectedBracketRight,
}
parse_statement :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	eat_whitespace(parser, sb)
	statement_start := parser.i
	if parser.token == "export" {
		eat_token(parser)
	}
	switch parser.token {
	case "type":
		fmt.sbprint(sb, "/*")
		print_prev_token(parser, sb, statement_start)
		eat_token(parser, sb)
		parse_name(parser, sb) or_return
		parse_equals(parser, sb) or_return
		if parser.token_type != .Alphanumeric {return .ExpectedCurlyBracketRight}
		parse_until_end_of_bracket(parser, sb)
		fmt.sbprint(sb, "*/")
	case "interface":
		fmt.sbprint(sb, "/*")
		print_prev_token(parser, sb, statement_start)
		eat_token(parser, sb)
		parse_name(parser, sb) or_return
		if parser.token_type != .Alphanumeric {return .ExpectedCurlyBracketRight}
		parse_until_end_of_bracket(parser, sb)
		fmt.sbprint(sb, "*/")
	case "class":
		return .NotImplemented
	case "var", "let", "const":
		print_prev_token(parser, sb, statement_start)
		eat_token(parser, sb)
		parse_name(parser, sb) or_return
		parse_equals(parser, sb) or_return
		parse_value(parser, sb) or_return
	case:
		return .NotImplemented
	}
	return .None
}
parse_name :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Alphanumeric {return .ExpectedName}
	eat_token(parser, sb)
	return .None
}
parse_equals :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Equals {return .ExpectedEquals}
	eat_token(parser, sb)
	return .None
}
parse_left_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeft {return .ExpectedBracketLeft}
	eat_token(parser, sb)
	return .None
}
parse_value :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	for {
		for parser.token_type == .PlusMinus {
			eat_token(parser, sb)
		}
		#partial switch parser.token_type {
		case .BracketLeft:
			parser_copy := parser^
			parse_until_end_of_bracket(&parser_copy, nil)
			if parser_copy.token_type == .LambdaArrow {
				return .NotImplemented
			} else {
				return .NotImplemented
			}
		case .Alphanumeric:
			if parser.token == "function" {
				eat_token(parser, sb)
				parse_name(parser, sb)
				parse_left_bracket(parser, sb)
				return .NotImplemented
			}
			eat_token(parser, sb)
			if parser.token_type == .BracketLeft {
				eat_token(parser, sb)
				parse_value(parser, sb)
				return .ExpectedBracketRight
			}
		case:
			return .UnexpectedToken
		}
		if parser.token_type == .TimesDivide || parser.token_type == .Comma {
			eat_token(parser, sb)
			continue
		}
		break
	}
	return .None
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
		if parser.token_type >= TokenType.BracketLeft &&
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
		if parser.token_type >= TokenType.BracketLeft &&
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
