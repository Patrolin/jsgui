package main
import "core:fmt"
import "core:os"
import "core:strings"
import win "core:sys/windows"
// TODO: Run qgrep with: tscompiler "parse_" and not ("proc" or "or_return" or ":=" or "error =" or "DEBUG_" or "reparse_as_" or "parse_until_end_of_bracket") and file "compile.odin"

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

// debug print
DEBUG_MODE :: false
debug_print_start :: proc(parser: ^Parser, name: string) -> int {
	prev_debug_indent := parser.debug_indent
	if DEBUG_MODE {
		parser.debug_indent += 1
		fmt.printfln("%v %v", parser.debug_indent, name)
	}
	return prev_debug_indent
}
debug_print :: #force_inline proc(parser: ^Parser, name: string) {
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

// comments
start_comment :: proc(parser: ^Parser, sb: ^strings.Builder) {
	if parser.custom_comment_depth == 0 {
		fmt.sbprint(sb, "/*")
	}
	parser.custom_comment_depth += 1
}
end_comment :: proc(parser: ^Parser, sb: ^strings.Builder, keep_space := true) {
	buffer := &sb.buf
	comment_end := "*/"
	parser.custom_comment_depth -= 1
	if parser.custom_comment_depth == 0 {
		if keep_space && buffer[len(buffer) - 1] == ' ' {
			pop(buffer)
			comment_end = "*/ "
		}
		fmt.sbprint(sb, comment_end)
	}
}

// main
parse_entire_file :: proc(file: string) -> (mjs: string, error: ParseError, parser: Parser) {
	if DEBUG_MODE {fmt.println()}
	parser = make_parser(file)
	sb := strings.builder_make_none()
	for parser.token_type != .EndOfFile {
		error = parse_statement(&parser, &sb, true)
		if error != .None {break}
		if DEBUG_MODE {fmt.println()}
	}
	fmt.assertf(error != .None || parser.debug_indent == 0, "Wrong debug indent")
	return strings.to_string(sb), error, parser
}
ParseError :: enum {
	None,
	UnexpectedTokenInStatement,
	UnexpectedTokenInDestructuring,
	UnexpectedTokenInType,
	UnexpectedTokenInValue,
	UnexpectedTokenInValueCurly,
	UnexpectedTokenInClass,
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
}

/* slow path */
parse_statement :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	allow_empty_statement: bool,
) -> (
	error: ParseError,
) {
	prev_debug_indent := debug_print_start(parser, "statement")
	if parser.token_group != .Token {
		next_token(parser, sb)
	}
	statement_start := parser.i
	// REFACTOR: lookahead "export"?
	if parser.token_type == .Alphanumeric && parser.token == "export" {
		next_token(parser, nil)
	}
	#partial switch parser.token_type {
	case .Alphanumeric:
		switch parser.token {
		case "type":
			// SPEC: edgecase: we fail when assigning to a variable named `type`
			debug_print(parser, "statement.type")
			start_comment(parser, sb)
			print_prev_token(parser, sb, statement_start)
			next_token(parser, sb)
			parse_name_with_generic(parser, sb) or_return
			parse_equals(parser, sb) or_return
			parse_type(parser, sb) or_return
			end_comment(parser, sb)
		case "interface", "declare":
			debug_print(parser, "statement.interface")
			start_comment(parser, sb)
			print_prev_token(parser, sb, statement_start)
			next_token(parser, sb)
			parse_name(parser, sb) or_return
			parse_extends_type(parser, sb) or_return
			parse_until_end_of_bracket(parser, sb)
			end_comment(parser, sb)
		case "enum":
			{
				debug_print(parser, "statement.enum")
				print_prev_token(parser, sb, statement_start)
				replace_token(parser, sb, "const")
				parse_name(parser, sb)
				fmt.sbprint(sb, "= ")
				parse_left_bracket_curly(parser, sb) or_return
				enum_value_index := 0
				for parser.token_type != .BracketRightCurly {
					if parser.token_type != .Alphanumeric {return .ExpectedName}
					next_token(parser, sb, .Whitespace)
					if parser.token_group == .Whitespace {
						next_token(parser, nil)
					}
					if parser.token_type == .Equals {
						replace_token(parser, sb, ":")
						parse_value(parser, sb, .Comma)
					} else {
						fmt.sbprintf(sb, ": %v", enum_value_index)
					}
					if parser.token_type == .Comma {
						next_token(parser, sb)
					} else if parser.token_type == .BracketRightCurly {
						// noop
					} else {
						return .UnexpectedTokenInStatement
					}
					enum_value_index += 1
				}
				parse_right_bracket_curly(parser, sb) or_return
			}
		case "class":
			debug_print(parser, "statement.class")
			next_token(parser, sb)
			parse_name(parser, sb) or_return
			parse_extends_type(parser, sb) or_return
			parse_left_bracket_curly(parser, sb) or_return
			for parser.token_type != .BracketRightCurly {
				if parser.token_type == .Alphanumeric &&
				   (parser.token == "get" || parser.token == "set" || parser.token == "static") {
					next_token(parser, sb)
				}
				parse_name_with_generic(parser, sb) or_return // SPEC: technically we shouldn't parse generic if it's a class field
				#partial switch parser.token_type {
				case .Colon, .QuestionMarkColon:
					parse_question_mark_colon_equals_value(parser, sb) or_return
				case .BracketLeft:
					debug_print(parser, "statement.class.method")
					parse_function_args(parser, sb, "statement.class.method.cont") or_return
					if parser.token_type == .Colon {
						start_comment(parser, sb)
						next_token(parser, sb)
						parse_type(parser, sb) or_return
						end_comment(parser, sb)
					}
					parse_code_block(parser, sb) or_return
				case .Semicolon:
				// noop
				case:
					return .UnexpectedTokenInClass
				}
				for parser.token_type == .Semicolon {
					next_token(parser, sb)
				}
			}
			parse_right_bracket_curly(parser, sb) or_return
		case "var", "let", "const":
			debug_print(parser, "statement.var")
			print_prev_token(parser, sb, statement_start)
			next_token(parser, sb)
			for {
				parse_destructuring(parser, sb) or_return
				parse_colon_equals_value(parser, sb, .Comma) or_return
				if parser.token_type == .Comma {
					next_token(parser, sb)
					continue
				}
				break
			}
		case "return", "throw":
			if statement_start != parser.i {return .UnexpectedTokenInStatement}
			debug_print(parser, "statement.return")
			next_token(parser, sb)
			if parser.token_type != .Semicolon {
				parse_value(parser, sb, .Semicolon) or_return
			}
			if parser.token_type != .Semicolon &&
			   parser.token_type != .BracketRightCurly &&
			   parser.token != "case" {
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
			for parser.token_type == .Alphanumeric && parser.token == "else" {
				debug_print(parser, "statement.if.else")
				next_token(parser, sb)
				if parser.token_type == .Alphanumeric && parser.token == "if" {
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
			lookahead_is_for_in_of :: proc(parser: ^Parser) -> bool {
				lookahead := parser^
				prev_debug_indent := debug_print_start(&lookahead, "statement.for.lookahead")
				error := parse_name(&lookahead, nil)
				if error != nil {return false}
				error = parse_name_or_destructuring(&lookahead, nil)
				if error != nil {return false}
				debug_print_end(&lookahead, "statement.for.lookahead", prev_debug_indent)
				return lookahead.token == "in" || lookahead.token == "of"
			}
			is_for_in_of := lookahead_is_for_in_of(parser)
			if is_for_in_of {
				next_token(parser, sb)
				parse_name_or_destructuring(parser, sb) or_return
				next_token(parser, sb)
				parse_value(parser, sb, .Semicolon) or_return
			} else {
				// SPEC: technically we should parse exactly 3 statements
				for parser.token_type != .BracketRight {
					parse_statement(parser, sb, true) or_return
				}
			}
			parse_right_bracket(parser, sb) or_return
			debug_print(parser, "statement.for.body")
			parse_code_block_or_statement(parser, sb) or_return
		case "switch":
			debug_print(parser, "statement.switch")
			next_token(parser, sb)
			parse_left_bracket(parser, sb) or_return
			parse_value(parser, sb, .Semicolon) or_return
			parse_right_bracket(parser, sb) or_return
			parse_left_bracket_curly(parser, sb) or_return
			for parser.token_type != .BracketRightCurly {
				if parser.token_type == .Alphanumeric && parser.token == "case" {
					next_token(parser, sb)
					parse_value(parser, sb, .Semicolon) or_return
				} else if parser.token_type == .Alphanumeric && parser.token == "default" {
					next_token(parser, sb)
				}
				parse_colon(parser, sb) or_return
				for parser.token_type != .BracketRightCurly &&
				    parser.token != "case" &&
				    parser.token != "default" {
					parse_statement(parser, sb, true) or_return
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
	case .Semicolon:
		if !allow_empty_statement {return .UnexpectedTokenInStatement}
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
parse_extends_type :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	if parser.token_type == .Alphanumeric && parser.token == "extends" {
		next_token(parser, sb)
		parse_type(parser, sb) or_return
	}
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
			parse_extends_type(parser, sb) or_return
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
	if parser.token_type == .Alphanumeric && (parser.token == "in" || parser.token == "of") {
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
unparse_binary_shift_right :: proc(parser: ^Parser) {
	if len(parser.token) > 0 && parser.token[0] == '>' {
		// chess battle advanced
		parser.token_type = .BracketRightAngle
		parser.token = ">"
		parser.j = parser.i + 1
	}
}
parse_right_bracket_angle :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	unparse_binary_shift_right(parser)
	if parser.token_type != .BracketRightAngle {return .ExpectedBracketRightAngle}
	next_token(parser, sb)
	return .None
}
parse_type :: proc(parser: ^Parser, sb: ^strings.Builder) -> (error: ParseError) {
	prev_debug_indent := debug_print_start(parser, "type")
	for {
		if parser.token_type == .Alphanumeric &&
		   (parser.token == "infer" || parser.token == "keyof" || parser.token == "typeof") {
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
		case .InterpolatedString:
			// NOTE: you can do weird stuff like Record<`v_${string}`, number>
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
		case .BracketLeftSquare:
			debug_print(parser, "type.tuple")
			next_token(parser, sb)
			for {
				parse_type(parser, sb) or_return
				if parser.token_type == .Comma {
					next_token(parser, sb)
					continue
				}
				break
			}
			parse_right_bracket_square(parser, sb) or_return
		case .BracketLeftCurly:
			debug_print(parser, "type.struct")
			parse_until_end_of_bracket(parser, sb) // NOTE: we can use the fast path here
		case:
			return .UnexpectedTokenInType
		}
		for parser.token_type == .BracketLeftSquare {
			next_token(parser, sb)
			#partial switch parser.token_type {
			case .String, .Numeric:
				next_token(parser, sb)
			}
			parse_right_bracket_square(parser, sb) or_return
		}
		if parser.token_type == .BinaryAnd ||
		   parser.token_type == .BinaryOr ||
		   (parser.token_type == .Alphanumeric &&
				   (parser.token == "extends" || parser.token == "is")) ||
		   parser.token_type == .Dot {
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
	outer: for {
		for (parser.token_type >= .UNARY_OPS_START && parser.token_type <= .UNARY_OPS_END) ||
		    (parser.token_type == .Alphanumeric &&
				    (parser.token == "typeof" || parser.token == "new" || parser.token == "async" || parser.token == "await")) ||
		    parser.token_type == .TripleDot { 	// SPEC: cba to only parse .TripleDot inside function calls
			next_token(parser, sb)
		}
		#partial switch parser.token_type {
		case .Numeric:
			debug_print(parser, "value.numeric")
			next_token(parser, sb)
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
				if parser.token_type == .LambdaArrow {
					debug_print(parser, "value.name.lambda")
					next_token(parser, sb)
					parse_code_block_or_value(parser, sb) or_return
				} else {
					if parser.token_type == .BracketLeftAngle {
						lookahead := parser^
						parse_until_end_of_bracket(&lookahead, nil)
						if lookahead.token_type == .BracketLeft {
							start_comment(parser, sb)
							next_token(parser, sb)
							parse_type(parser, sb) or_return
							parse_right_bracket_angle(parser, sb) or_return
							end_comment(parser, sb)
						}
					}
					for parser.token_type == .BracketLeft {
						debug_print(parser, "value.name.call")
						next_token(parser, sb)
						if parser.token_type != .BracketRight {
							parse_value(parser, sb, .Semicolon) or_return
						}
						parse_right_bracket(parser, sb) or_return
					}
				}
			}
		case .String, .InterpolatedString:
			// TODO: fully parse .InterpolatedString?
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
				#partial switch parser.token_type {
				case .TripleDot:
					next_token(parser, sb)
					parse_value(parser, sb, .Comma) or_return
				case .String:
					next_token(parser, sb)
				case .Alphanumeric:
					next_token(parser, sb)
					if parser.token_type == .BracketLeft {
						debug_print(parser, "value.curly.method")
						parse_function_args(parser, sb, "value.curly.method.cont") or_return
						parse_code_block(parser, sb) or_return
					}
				case .BracketLeftSquare:
					next_token(parser, sb)
					parse_value(parser, sb, .Semicolon) or_return
					parse_right_bracket_square(parser, sb) or_return
				case:
					return .UnexpectedTokenInValueCurly
				}
				if parser.token_type == .Colon {
					next_token(parser, sb)
					parse_value(parser, sb, .Comma) or_return
				}
				if parser.token_type == .Comma {
					debug_print(parser, "value.curly.cont")
					next_token(parser, sb)
				}
			}
			next_token(parser, sb)
		case .Slash:
			reparse_as_regex(parser)
			next_token(parser, sb)
		case .BracketRight:
			break outer
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
		// SPEC: is "++"|"--" allowed after a function call?
		if (parser.token_type >= .POSTFIX_OPS_START && parser.token_type <= .POSTFIX_OPS_END) {
			postfix_needs_comment := parser.token_type == .ExclamationMark
			if postfix_needs_comment {start_comment(parser, sb)}
			debug_print(parser, "value.postfix_op")
			next_token(parser, sb)
			if postfix_needs_comment {end_comment(parser, sb)}
		}
		for parser.token_type == .Alphanumeric && parser.token == "as" {
			debug_print(parser, "value.as")
			start_comment(parser, sb)
			next_token(parser, sb)
			parse_type(parser, sb) or_return
			end_comment(parser, sb)
		}
		// REFACTOR: put .Comma, .Equals under .BINARY_OPS?
		if parser.token_type <= stop_at {
			break
		}
		if (parser.token_type >= .BINARY_OPS_START && parser.token_type <= .BINARY_OPS_END) ||
		   parser.token_type == .Comma ||
		   parser.token_type == .Equals ||
		   (parser.token_type == .Alphanumeric &&
				   (parser.token == "instanceof" || parser.token == "in")) {
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
	for parser.token_type != .BracketRight {
		is_this_type := false
		if parser.token_type == .TripleDot {
			next_token(parser, sb)
			parse_name(parser, sb) or_return
		} else {
			is_this_type = parser.token == "this"
			if is_this_type {start_comment(parser, sb)}
			parse_destructuring(parser, sb) or_return
		}
		parse_question_mark_colon_equals_value(parser, sb) or_return
		if parser.token_type == .Comma {
			debug_print(parser, debug_name_cont)
			next_token(parser, sb, .Token)
		}
		if is_this_type {
			end_comment(parser, sb, keep_space = false)
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
		parse_statement(parser, sb, true) or_return
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
			parse_statement(parser, sb, true) or_return
		}
		parse_right_bracket_curly(parser, sb) or_return
	} else {
		parse_statement(parser, sb, false) or_return
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
	if parser.token_type == .Equals {
		next_token(parser, sb)
		parse_value(parser, sb, stop_at) or_return
	}
	return .None
}

/* fast path */
parse_until_end_of_bracket :: proc(parser: ^Parser, sb: ^strings.Builder) {
	prev_debug_indent := debug_print_start(parser, "parse_until_end_of_bracket")
	bracket_count := 0
	for {
		unparse_binary_shift_right(parser)
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
