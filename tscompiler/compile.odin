package main
import "core:fmt"
import "core:os"
import "core:strings"
import win "core:sys/windows"
// TODO: Run qgrep with: tscompiler "parse_" and not ("proc" or "or_return" or ":=" or "error =" or "DEBUG_" or "reparse_as_" or "parse_until_end_of_bracket") and file "compile.odin"

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
DEBUG_MODE :: true
DebugPrintType :: enum {
	Middle,
	Start,
	End,
}
debug_print_start :: proc(parser: ^Parser, name: string) -> int {
	prev_debug_indent := parser.debug_indent
	if DEBUG_MODE {
		parser.debug_indent += 1
		fmt.printfln("%v %v", parser.debug_indent, name)
	}
	return prev_debug_indent
}
debug_print :: proc(parser: ^Parser, name: string) {
	if DEBUG_MODE {
		fmt.printfln("%v %v", parser.debug_indent, name)
	}
}
debug_print_end :: proc(
	parser: ^Parser,
	name: string,
	prev_debug_indent: int,
	loc := #caller_location,
) {
	if DEBUG_MODE {
		fmt.printfln("- %v %v", parser.debug_indent, name)
		parser.debug_indent -= 1
		fmt.assertf(
			parser.debug_indent == prev_debug_indent,
			"got: %v, expected: %v",
			parser.debug_indent,
			prev_debug_indent,
			loc = loc,
		)
	}
}
start_comment :: proc(parser: ^Parser, sb: ^strings.Builder) {
	if parser.custom_comment_depth == 0 {
		fmt.sbprint(sb, "/*")
	}
	parser.custom_comment_depth += 1
}
end_comment :: proc(parser: ^Parser, sb: ^strings.Builder) {
	buffer := &sb.buf
	comment_end := "*/"
	parser.custom_comment_depth -= 1
	if parser.custom_comment_depth == 0 {
		if buffer[len(buffer) - 1] == ' ' {
			pop(buffer)
			comment_end = "*/ "
		}
		fmt.sbprint(sb, comment_end)
	}
}
parse_entire_file :: proc(file: string) -> (mjs: string, error: ParseError, parser: Parser) {
	fmt.println()
	parser = make_parser(file)
	sb := strings.builder_make_none()
	for parser.token_type != .EndOfFile {
		error = parse_statement(&parser, &sb)
		if error != .None {break}
		if DEBUG_MODE {fmt.println()}
	}
	return strings.to_string(sb), error, parser
}
ParseError :: enum {
	None,
	UnexpectedTokenInStatement,
	UnexpectedTokenInDestructuring,
	UnexpectedTokenInType,
	UnexpectedTokenInValue,
	UnexpectedTokenInValueCurly,
	ExpectedName,
	ExpectedEquals,
	ExpectedAssignmentInForLoop,
	ExpectedBracketLeft,
	ExpectedBracketRight,
	ExpectedBracketLeftSquare,
	ExpectedBracketRightSquare,
	ExpectedBracketLeftCurly,
	ExpectedBracketRightCurly,
	ExpectedBracketLeftAngle,
	ExpectedBracketRightAngle,
	ExpectedLambdaArrow,
	ExpectedColon,
	NotImplementedClass,
	NotImplementedExtends,
	NotImplementedTypeAngle,
}

/* slow path */
parse_statement :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	prev_debug_indent := debug_print_start(parser, "statement")
	if parser.token_group != .Token {
		next_token(parser, sb)
	}
	statement_start := parser.i
	// REFACTOR: lookahead "export"?
	if parser.token == "export" {
		next_token(parser)
	}
	#partial switch parser.token_type {
	case .Alphanumeric:
		switch parser.token {
		case "type":
			debug_print(parser, "statement.type")
			start_comment(parser, sb)
			print_prev_token(parser, sb, statement_start)
			next_token(parser, sb)
			parse_name_with_generic(parser, sb) or_return
			parse_equals(parser, sb) or_return
			parse_type(parser, sb) or_return
			end_comment(parser, sb)
		case "interface":
			debug_print(parser, "statement.interface")
			start_comment(parser, sb)
			print_prev_token(parser, sb, statement_start)
			next_token(parser, sb)
			parse_name(parser, sb) or_return
			parse_extends(parser, sb) or_return
			parse_until_end_of_bracket(parser, sb)
			end_comment(parser, sb)
		case "class":
			return .NotImplementedClass
		case "var", "let", "const":
			debug_print(parser, "statement.var")
			print_prev_token(parser, sb, statement_start)
			next_token(parser, sb)
			parse_destructuring(parser, sb) or_return
			parse_colon_equals_value(parser, sb, .Semicolon) or_return
		case "return":
			if statement_start != parser.i {return .UnexpectedTokenInStatement}
			debug_print(parser, "statement.return")
			next_token(parser, sb)
			if parser.token_type != .Semicolon {
				parse_value(parser, sb, .Semicolon) or_return
			}
			if parser.token_type != .Semicolon && parser.token != "case" {
				return .UnexpectedTokenInStatement
			}
		case "if":
			if statement_start != parser.i {return .UnexpectedTokenInStatement}
			debug_print(parser, "statement.if")
			next_token(parser, sb)
			parse_left_bracket(parser, sb) or_return
			parse_value(parser, sb, .Semicolon) or_return
			parse_right_bracket(parser, sb) or_return
			parse_code_block_or_statement(parser, sb) or_return
			for parser.token == "else" {
				debug_print(parser, "statement.if.else")
				next_token(parser, sb)
				if parser.token == "if" {
					next_token(parser, sb)
					parse_left_bracket(parser, sb) or_return
					parse_value(parser, sb, .Semicolon) or_return
					parse_right_bracket(parser, sb) or_return
				}
				parse_code_block_or_statement(parser, sb) or_return
			}
		case "for":
			if statement_start != parser.i {return .UnexpectedTokenInStatement}
			debug_print(parser, "statement.for")
			next_token(parser, sb)
			parse_left_bracket(parser, sb) or_return
			lookahead := parser^
			{
				prev_debug_indent := debug_print_start(&lookahead, "statement.for.lookahead")
				parse_name(&lookahead, nil) or_return
				parse_name_or_destructuring(&lookahead, nil) or_return
				debug_print_end(&lookahead, "statement.for.lookahead", prev_debug_indent)
			}
			if lookahead.token == "in" || lookahead.token == "of" {
				next_token(parser, sb)
				parse_name_or_destructuring(parser, sb) or_return
				next_token(parser, sb)
				parse_value(parser, sb, .Semicolon) or_return
			} else {
				// SPEC: technically we should parse exactly 3 statements
				for parser.token_type != .BracketRight {
					parse_statement(parser, sb) or_return
				}
			}
			parse_right_bracket(parser, sb) or_return
			debug_print(parser, "statement.for.body")
			parse_code_block(parser, sb) or_return
		case "switch":
			debug_print(parser, "statement.switch")
			next_token(parser, sb)
			parse_left_bracket(parser, sb) or_return
			parse_value(parser, sb, .Semicolon) or_return
			parse_right_bracket(parser, sb) or_return
			parse_left_bracket_curly(parser, sb) or_return
			for parser.token_type != .BracketRightCurly {
				if parser.token == "case" {
					next_token(parser, sb)
					parse_value(parser, sb, .Semicolon) or_return
				} else if parser.token == "default" {
					next_token(parser, sb)
				}
				parse_colon(parser, sb) or_return
				for parser.token_type != .BracketRightCurly &&
				    parser.token != "case" &&
				    parser.token != "default" {
					parse_statement(parser, sb) or_return
				}
			}
			parse_right_bracket_curly(parser, sb) or_return
		case:
			parse_value(parser, sb, .Semicolon) or_return
		}
	case .BracketLeft:
		parse_value(parser, sb, .Semicolon) or_return
	case .BracketLeftSquare:
		parse_destructuring(parser, sb) or_return
		parse_equals(parser, sb) or_return
		parse_value(parser, sb, .Semicolon) or_return
	case .BracketLeftCurly:
		parse_code_block(parser, sb) or_return
	case:
		return .UnexpectedTokenInStatement
	}
	for parser.token_type == .Semicolon {
		debug_print(parser, "statement.semicolons")
		next_token(parser, sb)
	}
	debug_print_end(parser, "statement", prev_debug_indent)
	return .None
}
parse_name :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Alphanumeric {return .ExpectedName}
	next_token(parser, sb)
	return .None
}
parse_name_with_generic :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	parse_name(parser, sb) or_return
	if parser.token_type == .BracketLeftAngle {
		prev_debug_indent := debug_print_start(parser, "generic")
		start_comment(parser, sb)
		next_token(parser, sb)
		for parser.token_type != .BracketRightAngle {
			parse_name(parser, sb) or_return
			if parser.token == "extends" {
				next_token(parser, sb)
				parse_type(parser, sb) or_return
			}
			if parser.token_type == .Equals {
				next_token(parser, sb)
				parse_type(parser, sb) or_return
			}
			if parser.token_type == .Comma {
				next_token(parser, sb)
			}
		}
		parse_right_bracket_angle(parser, sb) or_return
		end_comment(parser, sb)
		debug_print_end(parser, "generic", prev_debug_indent)
	}
	return .None
}
parse_name_or_destructuring :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type == .Alphanumeric {
		parse_name(parser, sb) or_return
	} else {
		parse_destructuring(parser, sb) or_return
	}
	return .None
}
parse_destructuring :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	prev_debug_indent := -1
	#partial switch parser.token_type {
	case .Alphanumeric:
		prev_debug_indent = debug_print_start(parser, "destructuring.name")
		next_token(parser, sb)
	case .BracketLeftSquare:
		prev_debug_indent = debug_print_start(parser, "destructuring.square")
		next_token(parser, sb)
		for parser.token_type != .BracketRightSquare {
			if parser.token_type == .TripleDot {
				next_token(parser, sb)
			}
			parse_name(parser, sb) or_return
			if parser.token_type == .Equals {
				next_token(parser, sb)
				parse_value(parser, sb, .Comma) or_return
			}
			if parser.token_type == .Comma {
				next_token(parser, sb)
			}
		}
		parse_right_bracket_square(parser, sb) or_return
	case .BracketLeftCurly:
		prev_debug_indent = debug_print_start(parser, "destructuring.curly")
		next_token(parser, sb)
		for parser.token_type != .BracketRightCurly {
			if parser.token_type == .TripleDot {
				next_token(parser, sb)
			}
			parse_name(parser, sb) or_return
			if parser.token_type == .Colon || parser.token_type == .QuestionMarkColon {
				next_token(parser, sb)
				parse_destructuring(parser, sb) or_return
			}
			if parser.token_type == .Equals {
				next_token(parser, sb)
				parse_value(parser, sb, .Comma) or_return
			}
			if parser.token_type == .Comma {
				next_token(parser, sb)
			}
		}
		parse_right_bracket_curly(parser, sb) or_return
	case:
		return .UnexpectedTokenInDestructuring
	}
	debug_print_end(parser, "destructuring", prev_debug_indent)
	return .None
}
parse_equals :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Equals {return .ExpectedEquals}
	next_token(parser, sb)
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
		next_token(parser, sb)
		return false, .None
	}
	if parser.token == "in" || parser.token == "of" {
		next_token(parser, sb)
		return true, .None
	}
	return false, .ExpectedAssignmentInForLoop
}
parse_left_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeft {return .ExpectedBracketLeft}
	next_token(parser, sb)
	return .None
}
parse_right_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRight {return .ExpectedBracketRight}
	next_token(parser, sb)
	return .None
}
parse_left_bracket_square :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeftSquare {return .ExpectedBracketLeftSquare}
	next_token(parser, sb)
	return .None
}
parse_right_bracket_square :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRightSquare {return .ExpectedBracketRightSquare}
	next_token(parser, sb)
	return .None
}
parse_left_bracket_curly :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeftCurly {return .ExpectedBracketLeftCurly}
	next_token(parser, sb)
	return .None
}
parse_right_bracket_curly :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRightCurly {return .ExpectedBracketRightCurly}
	next_token(parser, sb)
	return .None
}
parse_left_bracket_angle :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketLeftAngle {return .ExpectedBracketLeftAngle}
	next_token(parser, sb)
	return .None
}
parse_right_bracket_angle :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .BracketRightAngle {return .ExpectedBracketRightAngle}
	next_token(parser, sb)
	return .None
}
parse_extends :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	return .NotImplementedExtends
}
parse_type :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	prev_debug_indent := debug_print_start(parser, "type")
	for {
		if parser.token == "infer" {
			next_token(parser, sb)
		}
		#partial switch parser.token_type {
		case .Alphanumeric:
			next_token(parser, sb)
			if parser.token_type == .BracketLeftAngle {
				next_token(parser, sb)
				parse_type(parser, sb) or_return
				for parser.token_type == .Comma {
					next_token(parser, sb)
					parse_type(parser, sb) or_return
				}
				parse_right_bracket_angle(parser, sb) or_return
			}
		case .String:
			next_token(parser, sb)
		case .BracketLeft:
			lookahead := parser^
			parse_until_end_of_bracket(&lookahead, nil) // NOTE: we can use the fast path here
			if lookahead.token_type == .LambdaArrow {
				debug_print(parser, "type.lambda")
				parse_function_args(parser, sb, "type.lambda.cont") or_return
				parse_lambda_arrow(parser, sb) or_return
				parse_type(parser, sb) or_return
			} else {
				next_token(parser, sb)
				parse_type(parser, sb) or_return
				parse_right_bracket(parser, sb) or_return
			}
		case .BracketLeftCurly:
			parse_until_end_of_bracket(parser, sb) // NOTE: we can use the fast path here
		case:
			return .UnexpectedTokenInType
		}
		for parser.token_type == .BracketLeftSquare {
			next_token(parser, sb)
			parse_right_bracket_square(parser, sb) or_return
		}
		if parser.token_type == .BinaryAnd ||
		   parser.token_type == .BinaryOr ||
		   parser.token == "extends" {
			debug_print(parser, "type.binary_op")
			next_token(parser, sb)
			continue
		}
		if parser.token_type == .QuestionMark {
			debug_print(parser, "type.ternary")
			next_token(parser, sb)
			parse_type(parser, sb) or_return
			parse_colon(parser, sb) or_return
			continue
		}
		break
	}
	debug_print_end(parser, "type", prev_debug_indent)
	return .None
}
parse_value :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	stop_at: TokenType,
) -> (
	error: ParseError,
) {
	prev_debug_indent := debug_print_start(parser, "value")
	for {
		for parser.token_type >= .UNARY_OPS_START {
			next_token(parser, sb)
		}
		#partial switch parser.token_type {
		case .Alphanumeric:
			if parser.token == "function" {
				debug_print(parser, "value.function")
				next_token(parser, sb)
				parse_name_with_generic(parser, sb) or_return
				debug_print(parser, "value.function.args")
				parse_function_args(parser, sb, "function.args.cont") or_return
				if parser.token_type == .Colon {
					debug_print(parser, "value.function.returnType")
					start_comment(parser, sb)
					next_token(parser, sb)
					parse_type(parser, sb) or_return
					end_comment(parser, sb)
				}
				debug_print(parser, "value.function.body")
				parse_code_block(parser, sb) or_return
			} else {
				debug_print(parser, "value.name")
				next_token(parser, sb)
				if parser.token_type == .BracketLeft {
					debug_print(parser, "value.name.call")
					next_token(parser, sb)
					if parser.token_type != .BracketRight {
						parse_value(parser, sb, .Semicolon) or_return
					}
					parse_right_bracket(parser, sb) or_return
				} else if parser.token_type == .LambdaArrow {
					next_token(parser, sb)
					parse_code_block_or_value(parser, sb) or_return
				}
			}
		case .String:
			debug_print(parser, "value.string")
			next_token(parser, sb)
		case .BracketLeft:
			{
				debug_print(parser, "value.bracket.lookahead")
				lookahead := parser^
				parse_until_end_of_bracket(&lookahead, nil) // NOTE: we can use the fast path here
				if lookahead.token_type == .LambdaArrow {
					debug_print(parser, "value.bracket.lambda.args")
					parse_function_args(parser, sb, "lambda.args.cont") or_return
					parse_lambda_arrow(parser, sb) or_return
					debug_print(parser, "value.bracket.lambda.body")
					parse_code_block_or_value(parser, sb) or_return
				} else {
					debug_print(parser, "value.bracket.value")
					parse_left_bracket(parser, sb) or_return
					parse_value(parser, sb, stop_at) or_return
					parse_right_bracket(parser, sb) or_return
				}
			}
		case .BracketLeftSquare:
			debug_print(parser, "value.square")
			next_token(parser, sb)
			for parser.token_type != .BracketRightSquare {
				parse_value(parser, sb, .Comma) or_return
				if parser.token_type == .Comma {
					next_token(parser, sb)
				}
			}
			next_token(parser, sb)
		case .BracketLeftCurly:
			debug_print(parser, "value.curly")
			next_token(parser, sb)
			for parser.token_type != .BracketRightCurly {
				if parser.token_type == .Alphanumeric {
					next_token(parser, sb)
				} else if parser.token_type == .BracketLeftSquare {
					next_token(parser, sb)
					parse_value(parser, sb, .Semicolon) or_return
					parse_right_bracket_square(parser, sb) or_return
				} else if parser.token_type == .TripleDot {
					next_token(parser, sb)
					parse_name(parser, sb) or_return
				} else {
					return .UnexpectedTokenInValueCurly
				}
				if parser.token_type == .Colon {
					next_token(parser, sb)
					parse_value(parser, sb, .Comma) or_return
				}
				if parser.token_type == .Comma {
					next_token(parser, sb)
				}
			}
			next_token(parser, sb)
		case .Slash:
			reparse_as_regex(parser)
			next_token(parser, sb)
		case:
			return .UnexpectedTokenInValue
		}
		for parser.token_type == .BracketLeftSquare {
			debug_print(parser, "value.index_into")
			next_token(parser, sb)
			if parser.token_type != .BracketRightSquare {
				parse_value(parser, sb, stop_at) or_return
			}
			parse_right_bracket_square(parser, sb) or_return
		}
		if parser.token_type <= stop_at {
			break
		}
		if (parser.token_type >= .POSTFIX_OPS_START && parser.token_type <= .POSTFIX_OPS_END) {
			debug_print(parser, "value.postfix_op")
			next_token(parser, sb)
		}
		if (parser.token_type >= .BINARY_OPS_START && parser.token_type <= .BINARY_OPS_END) ||
		   parser.token_type == .Comma ||
		   parser.token_type == .Equals {
			debug_print(parser, "value.binary_op")
			next_token(parser, sb)
			continue
		}
		if parser.token_type == .QuestionMark {
			debug_print(parser, "value.ternary")
			next_token(parser, sb)
			parse_value(parser, sb, .Colon) or_return
			parse_colon(parser, sb) or_return
			continue
		}
		if parser.token == "as" {
			debug_print(parser, "value.as")
			start_comment(parser, sb)
			next_token(parser, sb)
			parse_value(parser, sb, stop_at) or_return
			end_comment(parser, sb)
		}
		break
	}
	debug_print_end(parser, "value", prev_debug_indent)
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
	for parser.token_type == .Alphanumeric || parser.token_type == .TripleDot {
		if parser.token_type == .TripleDot {
			next_token(parser, sb)
		}
		parse_name(parser, sb) or_return
		parse_question_mark_colon_equals_value(parser, sb) or_return
		if parser.token_type == .Comma {
			debug_print(parser, debug_name_cont)
			next_token(parser, sb)
		}
	}
	parse_right_bracket(parser, sb) or_return
	return .None
}
parse_lambda_arrow :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .LambdaArrow {return .ExpectedLambdaArrow}
	next_token(parser, sb)
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
parse_code_block_or_value :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type == .BracketLeftCurly {
		parse_code_block(parser, sb) or_return
	} else {
		parse_value(parser, sb, .Comma) or_return
	}
	return .None
}
parse_code_block_or_statement :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
) -> (
	error: ParseError,
) {
	if parser.token_type == .BracketLeftCurly {
		next_token(parser, sb)
		for parser.token_type != .BracketRightCurly {
			parse_statement(parser, sb) or_return
		}
		parse_right_bracket_curly(parser, sb) or_return
	} else {
		parse_statement(parser, sb) or_return
	}
	return .None
}
parse_colon :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type != .Colon {return .ExpectedColon}
	next_token(parser, sb)
	return .None
}
parse_question_mark_colon_equals_value :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
) -> (
	error: ParseError,
) {
	if parser.token_type == .Colon || parser.token_type == .QuestionMarkColon {
		start_comment(parser, sb)
		next_token(parser, sb)
		parse_type(parser, sb) or_return
		end_comment(parser, sb)
	}
	if parser.token_type == .Equals {
		next_token(parser, sb) // '='
		parse_value(parser, sb, .Comma) or_return
	}
	return .None
}
parse_colon_equals_value :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	stop_at: TokenType,
) -> (
	error: ParseError,
) {
	if parser.token_type == .Colon {
		start_comment(parser, sb)
		next_token(parser, sb)
		parse_type(parser, sb) or_return
		end_comment(parser, sb)
	}
	parse_equals(parser, sb) or_return
	parse_value(parser, sb, stop_at) or_return
	return .None
}

/* fast path */
parse_until_end_of_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) {
	prev_debug_indent := debug_print_start(parser, "parse_until_end_of_bracket")
	bracket_count := 0
	for {
		is_bracket := parser.token_type >= .BRACKETS_START && parser.token_type <= .BRACKETS_END
		is_left_bracket := int(parser.token_type - .BRACKETS_START) & 1
		if is_bracket {
			bracket_count += 2 * is_left_bracket - 1
		}
		if DEBUG_MODE {fmt.printfln("bracket_count: %v, parser: %v", bracket_count, parser)}
		if parser.token_type == .EndOfFile {break}
		next_token(parser, sb)
		if bracket_count <= 0 {break}
	}
	debug_print_end(parser, "parse_until_end_of_bracket", prev_debug_indent)
}

/* special regex path */
is_regex_flag :: #force_inline proc(char: u8) -> bool {
	return(
		char == 'd' ||
		char == 'g' ||
		char == 'i' ||
		char == 'm' ||
		char == 's' ||
		char == 'u' ||
		char == 'v' ||
		char == 'y' \
	)
}
reparse_as_regex :: proc(parser: ^Parser, loc := #caller_location) {
	assert(parser.token_type == .Slash, "Regex must start with '/'")
	parser.j = parser.i + 1
	is_inside_set := false
	outer: for parser.j < len(parser.file) {
		char := parser.file[parser.j]
		switch char {
		case '[':
			is_inside_set = true
		case ']':
			is_inside_set = false
		case '\\':
			parser.j += 1
		case '/':
			if !is_inside_set {
				parser.j += 1
				break outer // ???: why do we need the outer label?
			}
		}
		parser.j += 1
	}
	for parser.j < len(parser.file) && is_regex_flag(parser.file[parser.j]) {
		parser.j += 1
	}
	parser.token = parser.file[parser.i:parser.j]
	parser.token_type = .Regex
}
