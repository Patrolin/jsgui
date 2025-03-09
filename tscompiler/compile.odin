package main
import "core:fmt"
import "core:os"
import "core:strings"
import win "core:sys/windows"
// TODO: Run qgrep with: tscompiler "parse_" and not ("proc" or "or_return" or ":=" or "DEBUG_") and file "compile.odin"

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
DebugPrintType :: enum {
	Middle,
	Start,
	End,
}
debug_print :: proc(parser: ^Parser, name: string, type: DebugPrintType) {
	if DEBUG_PARSER {
		if parser.debug_indent == 0 {fmt.println()}
		if type == .Start {parser.debug_indent += 1}
		format := type == .End ? "- %v, %v" : "%v %v"
		fmt.printfln(format, parser.debug_indent, name)
		if type == .End {parser.debug_indent -= 1}
	}
}
parse_entire_file :: proc(file: string) -> (mjs: string, error: ParseError, parser: Parser) {
	parser = make_parser(file)
	sb := strings.builder_make_none()
	for parser.token_type != .EndOfFile {
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
	ExpectedBracketLeft,
	ExpectedBracketLeftCurly,
	ExpectedBracketRight,
	ExpectedBracketRightCurly,
	ExpectedColon,
}

// slow path
parse_statement :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	debug_print(parser, "statement", .Start)
	defer debug_print(parser, "statement", .End)
	eat_whitespace(parser, sb)
	statement_start := parser.i
	if parser.token == "export" {
		eat_token(parser)
	}
	#partial switch parser.token_type {
	case .Alphanumeric:
		switch parser.token {
		case "type":
			fmt.sbprint(sb, "/*")
			print_prev_token(parser, sb, statement_start)
			eat_token(parser, sb)
			parse_name(parser, sb) or_return
			parse_equals(parser, sb) or_return
			if parser.token_type != .BracketRightCurly {return .ExpectedBracketRightCurly}
			parse_until_end_of_bracket(parser, sb)
			fmt.sbprint(sb, "*/")
		case "interface":
			fmt.sbprint(sb, "/*")
			print_prev_token(parser, sb, statement_start)
			eat_token(parser, sb)
			parse_name(parser, sb) or_return
			if parser.token_type != .BracketRightCurly {return .ExpectedBracketRightCurly}
			parse_until_end_of_bracket(parser, sb)
			fmt.sbprint(sb, "*/")
		case "class":
			return .NotImplemented
		case "var", "let", "const":
			print_prev_token(parser, sb, statement_start)
			eat_token(parser, sb)
			parse_name(parser, sb) or_return
			parse_equals(parser, sb) or_return
			parse_value(parser, sb, .Semicolon) or_return
		case:
			parse_value(parser, sb, .Semicolon) or_return
		}
	case:
		return .NotImplemented
	}
	for parser.token_type == .Semicolon {
		debug_print(parser, "statement.semicolons", .Middle)
		eat_token(parser, sb)
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
parse_right_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRight {return .ExpectedBracketRight}
	eat_token(parser, sb)
	return .None
}
parse_left_bracket_curly :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeftCurly {return .ExpectedBracketLeftCurly}
	eat_token(parser, sb)
	return .None
}
parse_right_bracket_curly :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	// TODO: unused?
	if parser.token_type != .BracketRightCurly {return .ExpectedBracketRightCurly}
	eat_token(parser, sb)
	return .None
}
parse_value :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	stop_at: TokenType,
) -> (
	error: ParseError,
) {
	debug_print(parser, "value", .Start)
	defer debug_print(parser, "value", .End)
	for {
		for parser.token_type == .PlusMinus {
			eat_token(parser, sb)
		}
		if parser.token_type <= stop_at {
			return .None
		}
		#partial switch parser.token_type {
		case .BracketLeft:
			lookahead := parser^
			parse_until_end_of_bracket(&lookahead, nil)
			if lookahead.token_type == .LambdaArrow {
				return .NotImplemented
			} else {
				return .NotImplemented
			}
		case .Alphanumeric:
			if parser.token == "function" {
				debug_print(parser, "function.args", .Start)
				defer debug_print(parser, "function", .End)
				eat_token(parser, sb)
				parse_name(parser, sb) or_return
				parse_left_bracket(parser, sb) or_return
				parse_function_args(parser, sb) or_return
				parse_right_bracket(parser, sb) or_return
				debug_print(parser, "function.body", .Middle)
				parse_left_bracket_curly(parser, sb) or_return
				for parser.token_type != .BracketRightCurly {
					parse_statement(parser, sb) or_return
				}
				eat_token(parser, sb)
			} else {
				eat_token(parser, sb)
				if parser.token_type == .BracketLeft {
					debug_print(parser, "call", .Start)
					defer debug_print(parser, "call", .End)
					eat_token(parser, sb)
					parse_value(parser, sb, .Semicolon) or_return
					parse_right_bracket(parser, sb) or_return
				}
			}
		case .BracketLeftCurly:
			parse_until_end_of_bracket(parser, sb)
		case:
			return .UnexpectedToken
		}
		if parser.token_type == .PlusMinus ||
		   parser.token_type == .TimesDivide ||
		   parser.token_type == .Comma ||
		   parser.token_type == .Equals {
			debug_print(parser, "value.cont", .Middle)
			eat_token(parser, sb)
			continue
		}
		break
	}
	return .None
}
parse_function_args :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	for parser.token_type == .Alphanumeric {
		eat_token(parser, sb) // name
		fmt.sbprint(sb, "/*")
		if parser.token_type == .Colon || parser.token_type == .QuestionMarkColon {
			eat_token(parser, sb) // ':' | '?:'
			parse_value(parser, sb, .Comma) or_return // type ('=' value)?
		} else {
			parse_value(parser, sb, .Comma) or_return // value
		}
		fmt.sbprint(sb, "*/")
	}
	return .None
}
parse_colon :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if (parser.token_type != .Colon || parser.token_type != .QuestionMarkColon) {
		return .ExpectedColon
	}
	eat_token(parser, sb)
	return .None
}

// fast path // TODO: we cannot call these ever unfortunately
parse_until_end_of_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) {
	debug_print(parser, "parse_until_end_of_bracket", .Start)
	defer debug_print(parser, "parse_until_end_of_bracket", .End)
	bracket_count := 0
	for {
		fmt.printfln("ayaya")
		if parser.token_type >= TokenType.BracketLeft &&
		   parser.token_type <= TokenType.BracketLeftAngle {
			bracket_count += 1
		}
		if parser.token_type >= TokenType.BracketRight &&
		   parser.token_type <= TokenType.BracketRightAngle {
			bracket_count -= 1
		}
		fmt.printfln("ayaya.3")
		if DEBUG_PARSER {fmt.printfln("bracket_count: %v, parser: %v", bracket_count, parser)}
		if parser.token_type == .EndOfFile {return}
		eat_token(parser, sb) // TODO: this crashes for some reason
		fmt.printfln("ayaya.4")
		if bracket_count <= 0 {return}
	}
}
// TODO: unused?
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
	debug_print(parser, "parse_until_end_of_expression", .Start)
	defer debug_print(parser, "parse_until_end_of_expression", .End)
	bracket_count := 0
	for {
		if parser.token_type >= TokenType.BracketLeft &&
		   parser.token_type <= TokenType.BracketLeftAngle {
			bracket_count += 1
		}
		if parser.token_type >= TokenType.BracketRight &&
		   parser.token_type <= TokenType.BracketRightAngle {
			bracket_count -= 1
		}
		if parser.token_type == .EndOfFile ||
		   (bracket_count < 0) ||
		   (bracket_count == 0 &&
				   parser.token_type >= .Semicolon &&
				   parser.token_type <= max_end_of_expression) {
			return
		}
		//if DEBUG_PARSER {fmt.printfln("bracket_count: %v, parser: %v", bracket_count, parser)}
		eat_token(parser, sb)
	}
}
