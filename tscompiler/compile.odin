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

STATEMENT :: "export"? (TYPE_STATEMENT | INTERFACE_STATEMENT | CLASS_STATEMENT | FUNCTION_STATEMENT | VAR_STATEMENT) ()[";"]
TYPE_STATEMENT :: "type" NAME GENERIC? "=" "{" _IGNORE_UNTIL_MATCHING_BRACKET "}"
INTERFACE_STATEMENT :: "interface" NAME ("extends" NAME[","])? "{" _IGNORE_UNTIL_MATCHING_BRACKET "}"
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
		if type == .Start {parser.debug_indent += 1}
		format := type == .End ? "- %v, %v" : "%v %v"
		fmt.printfln(format, parser.debug_indent, name)
		if type == .End {parser.debug_indent -= 1}
	}
}
start_comment :: proc(sb: ^strings.Builder) {
	fmt.sbprint(sb, "/*")
}
end_comment :: proc(sb: ^strings.Builder) {
	fmt.sbprint(sb, "*/")
}
parse_entire_file :: proc(file: string) -> (mjs: string, error: ParseError, parser: Parser) {
	parser = make_parser(file)
	sb := strings.builder_make_none()
	for parser.token_type != .EndOfFile {
		fmt.println()
		error := parse_statement(&parser, &sb)
		if parser.debug_indent != 0 {
			error = .WrongDebugIndent
		}
		if error != .None {
			return strings.to_string(sb), error, parser
		}
	}
	return strings.to_string(sb), .None, parser
}
ParseError :: enum {
	None,
	WrongDebugIndent,
	UnexpectedTokenInStatement,
	UnexpectedTokenInDestructuring,
	UnexpectedTokenInValue,
	ExpectedName,
	ExpectedEquals,
	ExpectedAssignmentInForLoop,
	ExpectedBracketLeft,
	ExpectedBracketLeftCurly,
	ExpectedBracketLeftSquare,
	ExpectedBracketRight,
	ExpectedBracketRightCurly,
	ExpectedBracketRightSquare,
	ExpectedLambdaArrow,
	ExpectedColon,
	NotImplementedClass,
	NotImplementedBracket,
	NotImplementedExtends,
	NotImplementedDestructuring,
	NotImplementedIf,
}

/* slow path */
parse_statement :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	debug_print(parser, "statement", .Start)
	defer debug_print(parser, "statement", .End)
	eat_whitespace(parser, sb)
	statement_start := parser.i
	// TODO: lookahead "export"
	if parser.token == "export" {
		eat_token(parser)
	}
	#partial switch parser.token_type {
	case .Alphanumeric:
		switch parser.token {
		case "type":
			{
				debug_print(parser, "statement.type", .Middle)
				start_comment(sb)
				print_prev_token(parser, sb, statement_start)
				eat_token(parser, sb)
				parse_name(parser, sb) or_return
				parse_equals(parser, sb) or_return
				parse_type_def(parser, sb, "type.def") or_return
				end_comment(sb)
			}
		case "interface":
			{
				debug_print(parser, "statement.interface", .Middle)
				start_comment(sb)
				print_prev_token(parser, sb, statement_start)
				eat_token(parser, sb)
				parse_name(parser, sb) or_return
				parse_extends(parser, sb) or_return
				parse_type_def(parser, sb, "interface.def") or_return
				end_comment(sb)
			}
		case "class":
			return .NotImplementedClass
		case "var", "let", "const":
			debug_print(parser, "statement.var", .Middle)
			print_prev_token(parser, sb, statement_start)
			eat_token(parser, sb)
			parse_destructuring(parser, sb) or_return
			parse_equals(parser, sb) or_return
			parse_value(parser, sb, .Semicolon) or_return
		case "if":
			if statement_start != parser.i {return .UnexpectedTokenInStatement}
			debug_print(parser, "statement.if", .Middle)
			eat_token(parser, sb)
			parse_left_bracket(parser, sb) or_return
			parse_value(parser, sb) or_return
			parse_right_bracket(parser, sb) or_return
			parse_code_block(parser, sb) or_return
			for parser.token == "else" {
				debug_print(parser, "statement.if.else", .Middle)
				eat_token(parser, sb)
				if parser.token == "if" {
					eat_token(parser, sb)
				}
				parse_left_bracket(parser, sb) or_return
				parse_value(parser, sb) or_return
				parse_right_bracket(parser, sb) or_return
				parse_code_block(parser, sb) or_return
			}
		case "for":
			{
				if statement_start != parser.i {return .UnexpectedTokenInStatement}
				debug_print(parser, "statement.for", .Middle)
				eat_token(parser, sb)
				parse_left_bracket(parser, sb) or_return
				debug_print(parser, "statement.for.lookahead", .Start)
				lookahead := parser^
				parse_name(&lookahead, nil) or_return
				parse_name(&lookahead, nil) or_return
				debug_print(parser, "statement.for.lookahead", .End)
				if lookahead.token == "in" || lookahead.token == "of" {
					eat_token(parser, sb)
					eat_token(parser, sb)
					eat_token(parser, sb)
					parse_value(parser, sb) or_return
				} else {
					// SPEC: technically we should parse exactly 3 statements
					for parser.token_type != .BracketRight {
						parse_statement(parser, sb) or_return
					}
				}
				parse_right_bracket(parser, sb) or_return
				debug_print(parser, "statement.for.body", .Middle)
				parse_code_block(parser, sb) or_return
			}
		case:
			parse_value(parser, sb, .Semicolon) or_return
		}
	case:
		return .UnexpectedTokenInStatement
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
parse_destructuring :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	defer debug_print(parser, "destructuring", .End)
	#partial switch parser.token_type {
	case .Alphanumeric:
		debug_print(parser, "destructuring.name", .Start)
		eat_token(parser, sb)
		return .None
	case .BracketLeftSquare:
		debug_print(parser, "destructuring.square", .Start)
		return .NotImplementedDestructuring
	case .BracketLeftCurly:
		debug_print(parser, "destructuring.curly", .Start)
		eat_token(parser, sb)
		for parser.token_type == .Alphanumeric {
			eat_token(parser, sb)
			if parser.token_type == .Colon || parser.token_type == .QuestionMarkColon {
				eat_token(parser, sb)
				parse_destructuring(parser, sb) or_return
			}
			if parser.token_type == .Equals {
				eat_token(parser, sb)
				parse_value(parser, sb) or_return
			}
			if parser.token_type == .Comma {
				eat_token(parser, sb)
				continue
			}
		}
		parse_right_bracket_curly(parser, sb) or_return
	case .BracketRightCurly:
		return .None
	case:
		return .UnexpectedTokenInDestructuring
	}
	return .None
}
parse_equals :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Equals {return .ExpectedEquals}
	eat_token(parser, sb)
	return .None
}
parse_equals_or_of :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
) -> (
	is_is_or_of: bool,
	error: ParseError,
) {
	if parser.token_type == .Equals {
		eat_token(parser, sb)
		return false, .None
	}
	if parser.token == "in" || parser.token == "of" {
		eat_token(parser, sb)
		return true, .None
	}
	return false, .ExpectedAssignmentInForLoop
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
parse_left_bracket_square :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeftSquare {return .ExpectedBracketLeftSquare}
	eat_token(parser, sb)
	return .None
}
parse_right_bracket_square :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRightSquare {return .ExpectedBracketRightSquare}
	eat_token(parser, sb)
	return .None
}
parse_left_bracket_curly :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeftCurly {return .ExpectedBracketLeftCurly}
	eat_token(parser, sb)
	return .None
}
parse_right_bracket_curly :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRightCurly {return .ExpectedBracketRightCurly}
	eat_token(parser, sb)
	return .None
}
parse_extends :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	return .NotImplementedExtends
}
parse_type_def :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	debug_name: string,
) -> (
	error: ParseError,
) {
	debug_print(parser, debug_name, .Middle)
	for parser.token_type == .Alphanumeric || parser.token_type == .BracketLeftCurly {
		if (parser.token_type == .Alphanumeric) {
			eat_token(parser, sb)
		} else {
			parse_until_end_of_bracket(parser, sb) // NOTE: we can use the fast path here
		}
		if parser.token == "&" || parser.token == "|" {
			eat_token(parser, sb)
		}
	}
	return .None
}
parse_value :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	stop_at: TokenType = .Semicolon,
) -> (
	error: ParseError,
) {
	debug_print(parser, "value", .Start)
	defer debug_print(parser, "value", .End)
	for {
		for parser.token_type >= UNARY_OPS_START {
			eat_token(parser, sb)
		}
		#partial switch parser.token_type {
		case .BracketLeft:
			{
				debug_print(parser, "value.bracket.lookahead", .Middle)
				lookahead := parser^
				parse_until_end_of_bracket(&lookahead, nil) // NOTE: we can use the fast path here
				if lookahead.token_type == .LambdaArrow {
					debug_print(parser, "value.bracket.lambda.args", .Middle)
					parse_function_args(parser, sb, "lambda.args.cont") or_return
					parse_lambda_arrow(parser, sb) or_return
					debug_print(parser, "value.bracket.lambda.body", .Middle)
					if parser.token_type == .BracketLeftCurly {
						parse_code_block(parser, sb) or_return
					} else {
						parse_value(parser, sb, .Comma) or_return
					}
				} else {
					debug_print(parser, "value.bracket.value", .Middle)
					parse_left_bracket(parser, sb) or_return
					parse_value(parser, sb, stop_at) or_return
					parse_right_bracket(parser, sb) or_return
				}
			}
		case .Alphanumeric:
			if parser.token == "function" {
				debug_print(parser, "value.function", .Middle)
				eat_token(parser, sb)
				parse_name(parser, sb) or_return
				debug_print(parser, "value.function.args", .Middle)
				parse_function_args(parser, sb, "function.args.cont") or_return
				debug_print(parser, "value.function.body", .Middle)
				parse_code_block(parser, sb) or_return
			} else {
				debug_print(parser, "value.name", .Middle)
				eat_token(parser, sb)
				if parser.token_type == .BracketLeft {
					debug_print(parser, "value.name.call", .Middle)
					eat_token(parser, sb)
					if parser.token_type != .BracketRight {
						parse_value(parser, sb, .Semicolon) or_return
					}
					parse_right_bracket(parser, sb) or_return
				}
			}
		case .BracketLeftCurly:
			parse_until_end_of_bracket(parser, sb) // TODO: parse this properly
		case .String:
			eat_token(parser, sb)
		case:
			return .UnexpectedTokenInValue
		}
		for parser.token_type == .BracketLeftSquare {
			eat_token(parser, sb)
			error := parse_value(parser, sb, stop_at)
			if error == .UnexpectedTokenInValue && parser.token_type != .BracketRightSquare {
				return error
			}
			parse_right_bracket_square(parser, sb) or_return
		}
		if parser.token_type <= stop_at {
			return .None
		}
		if (parser.token_type >= BINARY_OPS_START && parser.token_type <= BINARY_OPS_END) ||
		   parser.token_type == .Comma ||
		   parser.token_type == .Equals {
			debug_print(parser, "value.binaryOp", .Middle)
			eat_token(parser, sb)
			continue
		}
		if parser.token_type == .QuestionMark {
			debug_print(parser, "value.ternary", .Middle)
			eat_token(parser, sb)
			parse_value(parser, sb, .Colon) or_return
			parse_colon(parser, sb) or_return
			continue
		}
		if parser.token == "as" {
			debug_print(parser, "value.as", .Middle)
			start_comment(sb)
			eat_token(parser, sb)
			parse_value(parser, sb, stop_at) or_return
			end_comment(sb)
		}
		break
	}
	return .None
}
parse_function_args :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	debug_name_cont: string,
) -> (
	error: ParseError,
) {
	parse_left_bracket(parser, sb) or_return
	for parser.token_type == .Alphanumeric {
		eat_token(parser, sb) // name
		if parser.token_type == .Colon || parser.token_type == .QuestionMarkColon {
			start_comment(sb)
			eat_token(parser, sb) // ':' | '?:'
			parse_value(parser, sb, .Equals) or_return // type
			end_comment(sb)
		}
		if parser.token_type == .Equals {
			eat_token(parser, sb) // '='
			parse_value(parser, sb, .Comma) or_return
		}
		if parser.token_type == .Comma {
			debug_print(parser, debug_name_cont, .Middle)
			eat_token(parser, sb) // ','
		}
	}
	parse_right_bracket(parser, sb) or_return
	return .None
}
parse_lambda_arrow :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .LambdaArrow {return .ExpectedLambdaArrow}
	eat_token(parser, sb)
	return .None
}
parse_code_block :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	parse_left_bracket_curly(parser, sb) or_return
	for parser.token_type != .BracketRightCurly {
		parse_statement(parser, sb) or_return
	}
	parse_right_bracket_curly(parser, sb) or_return
	return .None
}
parse_colon :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Colon {return .ExpectedColon}
	eat_token(parser, sb)
	return .None
}

/* fast path */
parse_until_end_of_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) {
	debug_print(parser, "parse_until_end_of_bracket", .Start)
	defer debug_print(parser, "parse_until_end_of_bracket", .End)
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
		if DEBUG_PARSER {fmt.printfln("bracket_count: %v, parser: %v", bracket_count, parser)}
		if parser.token_type == .EndOfFile {return}
		eat_token(parser, sb)
		if bracket_count <= 0 {return}
	}
}
