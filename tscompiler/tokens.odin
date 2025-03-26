package main
import "core:fmt"
import "core:strconv"
import "core:strings"

TokenType :: enum {
	// expression ends
	EndOfFile,
	Semicolon,
	Comma,
	Equals,
	Colon,
	// whitespace-like
	Whitespace,
	SingleLineComment,
	MultiLineComment,
	// N length
	String,
	InterpolatedString,
	Regex,
	Alphanumeric,
	// 3 length
	TripleDot,
	// 2 length
	LambdaArrow,
	QuestionMarkColon,
	// 1 length
	QuestionMark,
	// 2 length, postfix ops
	POSTFIX_OPS_START,
	DoublePlus,
	DoubleMinus,
	POSTFIX_OPS_END,
	// 1 length, brackets
	BRACKETS_START,
	BracketLeft,
	BracketRight,
	BracketLeftSquare,
	BracketRightSquare,
	BracketLeftCurly,
	BracketRightCurly,
	// 1 length, brackets, binary ops
	_PAD_BRACKET_PARITY,
	BINARY_OPS_START,
	BracketLeftAngle,
	BracketRightAngle,
	BRACKETS_END,
	// 3 length, binary ops
	TripleEquals,
	TripleNotEquals,
	// 2 length, binary ops
	PlusEquals,
	MinusEquals,
	TimesEquals,
	SlashEquals,
	DoubleTimes,
	DoubleQuestionMark,
	QuestionMarkDot,
	DoubleEquals,
	DoubleNotEquals,
	LessThanEquals,
	GreaterThanEquals,
	LogicalOr,
	LogicalAnd,
	// 1 length, binary ops
	Times,
	Slash,
	BinaryOr,
	BinaryAnd,
	Dot,
	Remainder,
	// 1 length, binary ops, unary ops
	UNARY_OPS_START,
	Plus,
	Minus,
	BINARY_OPS_END,
	// 1 length, unary ops
	ExclamationMark,
}

Parser :: struct {
	file:                 string `fmt:"-"`,
	token:                string,
	token_type:           TokenType,
	token_group:          TokenGroup,
	i:                    int,
	j:                    int,
	debug_indent:         int,
	custom_comment_depth: int,
}
TokenGroup :: enum {
	Whitespace,
	Comment,
	Token,
}
make_parser :: proc(file: string, loc := #caller_location) -> Parser {
	parser := Parser{file, "", .Whitespace, .Whitespace, 0, 0, 0, 0}
	_parse_until_next_token(&parser, nil, .Whitespace, loc = loc)
	return parser
}
get_is_whitespace :: #force_inline proc(char: u8) -> bool {
	return char == ' ' || char == '\t' || get_is_newline(char)
}
get_is_newline :: #force_inline proc(char: u8) -> bool {
	return char == '\r' || char == '\n'
}
@(private)
_parse_until_next_token :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	desired_token_group: TokenGroup,
	loc := #caller_location,
) {
	i := parser.i
	j := i
	// TODO: TokenGroup.WhitespaceAndToken?
	for j < len(parser.file) {
		// .Whitespace
		if get_is_whitespace(parser.file[j]) {
			j += 1
			for j < len(parser.file) && get_is_whitespace(parser.file[j]) {
				j += 1
			}
			if desired_token_group <= .Whitespace {
				parser.token_type = .Whitespace
				parser.token_group = .Whitespace
				break
			} else {
				if sb != nil {
					fmt.sbprint(sb, parser.file[i:j])
				}
				i = j
			}
		}
		// .Comment
		if j < len(parser.file) && parser.file[j] == '/' {
			j_1 := j + 1
			is_single_line_comment := j_1 < len(parser.file) && parser.file[j_1] == '/'
			is_multi_line_comment := j_1 < len(parser.file) && parser.file[j_1] == '*'
			if is_single_line_comment {
				//debug_print(parser, "comment.single")
				for j += 2; j < len(parser.file) && !get_is_newline(parser.file[j]); j += 1 {}
				parser.token_type = .SingleLineComment
				if desired_token_group <= .Comment {break}
			} else if is_multi_line_comment {
				//debug_print(parser, "comment.multi")
				for j += 1;
				    j < len(parser.file) && (parser.file[j - 1] != '*' || parser.file[j] != '/');
				    j += 1 {}
				j += 1
				parser.token_type = .MultiLineComment
			}
			if j != i {
				if desired_token_group <= .Comment {
					parser.token_group = .Comment
					break
				} else {
					if sb != nil {
						fmt.sbprint(sb, parser.file[i:j])
						if parser.token_type == .MultiLineComment &&
						   parser.custom_comment_depth > 0 {
							fmt.sbprint(sb, "/*")
						}
					}
					i = j
					continue
				}
			}
		}
		// .Token
		//debug_print(parser, "token")
		parser.i = i
		parser.j = i
		parser.token_type = _get_token_type(parser.file, parser.i, loc = loc)
		parse_current_token(parser, loc = loc)
		parser.token_group = .Token
		assert(parser.token_type != .Whitespace, loc = loc)
		return
	}
	// .Whitespace | .Comment
	parser.i = i
	parser.j = j
	parser.token = parser.file[i:j]
}
@(private)
_get_token_type :: proc(file: string, j: int, loc := #caller_location) -> TokenType {
	if j >= len(file) {
		return .EndOfFile
	}
	j_1 := j + 1
	j_2 := j + 2
	switch file[j] {
	// whitespace-like
	case ' ', '\t', '\r', '\n':
		return .Whitespace
	// N length
	case '"', '\'':
		return .String
	case '`':
		return .InterpolatedString
	case:
		return .Alphanumeric
	// 2-3 length
	case '?':
		{
			is_question_mark_colon := j_1 < len(file) && (file[j_1] == ':')
			is_double_question_mark := j_1 < len(file) && (file[j_1] == '?')
			is_question_mark_dot := j_1 < len(file) && (file[j_1] == '.')
			if is_question_mark_colon {return .QuestionMarkColon}
			if is_double_question_mark {return .DoubleQuestionMark}
			if is_question_mark_dot {return .QuestionMarkDot}
			return .QuestionMark
		}
	case '=':
		{
			is_double_equals := j_1 < len(file) && (file[j_1] == '=')
			is_triple_equals := j_2 < len(file) && (file[j_2] == '=')
			is_lambda_arrow := j_1 < len(file) && (file[j_1] == '>')
			if is_double_equals {
				return is_triple_equals ? .TripleEquals : .DoubleEquals
			}
			return is_lambda_arrow ? .LambdaArrow : .Equals
		}
	case '!':
		{
			is_double_equals := j_1 < len(file) && (file[j_1] == '=')
			is_triple_equals := j_2 < len(file) && (file[j_2] == '=')
			if is_double_equals {
				return is_triple_equals ? .TripleNotEquals : .DoubleNotEquals
			}
			return .ExclamationMark
		}
	case '|':
		{
			is_logical_or := j_1 < len(file) && (file[j_1] == '|')
			return is_logical_or ? .LogicalOr : .BinaryOr
		}
	case '&':
		{
			is_logical_or := j_1 < len(file) && (file[j_1] == '&')
			return is_logical_or ? .LogicalAnd : .BinaryAnd
		}
	// 1 length
	case ';':
		return .Semicolon
	case ',':
		return .Comma
	case '+':
		is_double_plus := j_1 < len(file) && (file[j_1] == '+')
		is_plus_equals := j_1 < len(file) && (file[j_1] == '=')
		if is_plus_equals {return .PlusEquals}
		return is_double_plus ? .DoublePlus : .Plus
	case '-':
		is_double_minus := j_1 < len(file) && (file[j_1] == '-')
		is_minus_equals := j_1 < len(file) && (file[j_1] == '=')
		if is_minus_equals {return .MinusEquals}
		return is_double_minus ? .DoubleMinus : .Minus
	case '*':
		is_double_times := j_1 < len(file) && (file[j_1] == '*')
		is_times_equals := j_1 < len(file) && (file[j_1] == '=')
		if is_times_equals {return .TimesEquals}
		return is_double_times ? .DoubleTimes : .Times
	case '/':
		// NOTE: comments are handled by _parse_until_next_token()
		// NOTE: compiler needs to set `parser.token_type = .Regex` manually
		is_slash_equals := j_1 < len(file) && (file[j_1] == '=')
		return is_slash_equals ? .SlashEquals : .Slash
	case '.':
		is_double_dot := j_1 < len(file) && (file[j_1] == '.')
		is_triple_dot := j_2 < len(file) && (file[j_2] == '.')
		return is_double_dot && is_triple_dot ? .TripleDot : .Dot
	case '%':
		return .Remainder
	case ':':
		return .Colon
	case '(':
		return .BracketLeft
	case ')':
		return .BracketRight
	case '[':
		return .BracketLeftSquare
	case ']':
		return .BracketRightSquare
	case '{':
		return .BracketLeftCurly
	case '}':
		return .BracketRightCurly
	case '<':
		is_less_than_equals := j_1 < len(file) && (file[j_1] == '=')
		return is_less_than_equals ? .LessThanEquals : .BracketLeftAngle
	case '>':
		is_greater_than_equals := j_1 < len(file) && (file[j_1] == '=')
		return is_greater_than_equals ? .GreaterThanEquals : .BracketRightAngle
	}
}
parse_current_token :: proc(parser: ^Parser, loc := #caller_location) {
	#partial switch parser.token_type {
	case .String:
		sb := strings.builder_make_none()
		string_char := parser.file[parser.i]
		parser.j = parser.i + 1
		is_escaped := false
		skip_count := 0
		for char, l in parser.file[parser.j:] {
			if skip_count > 0 {
				skip_count -= 1
				continue
			}
			if is_escaped {
				if char == 'u' {
					char_code_string := parser.file[parser.j + l + 1:]
					parsed_length: int
					char_code, ok := strconv.parse_int(char_code_string, 16, &parsed_length)
					if !ok && char_code == 0 {
						fmt.sbprint(&sb, rune(0xFFFE))
					} else {
						fmt.sbprint(&sb, rune(char_code)) // NOTE: we don't handle characters split across multiple "\u" tokens
					}
					skip_count = parsed_length
				} else {
					fmt.sbprint(&sb, char)
				}
				is_escaped = false
			} else {
				if char == '\\' {
					is_escaped = true
				} else {
					if parser.file[parser.j + l] == string_char {
						parser.j += l + 1
						break
					} else {
						fmt.sbprint(&sb, char)
					}
				}
			}
		}
		parser.token = strings.to_string(sb)
	case .InterpolatedString:
		// default parsing for .InterpolatedString, does not comment out typescript syntax inside interpolations
		parser.j = parser.i + 1
		interpolation_depth := 0
		outer: for parser.j < len(parser.file) {
			switch parser.file[parser.j] {
			case '{':
				if parser.file[parser.j - 1] == '$' || interpolation_depth > 0 {
					interpolation_depth += 1
					fmt.printfln("interpolation_depth, %v", interpolation_depth)
				}
			case '}':
				interpolation_depth -= 1
				fmt.printfln("interpolation_depth, %v", interpolation_depth)
			case '`':
				if interpolation_depth <= 0 {
					parser.j += 1
					break outer
				}
			}
			parser.j += 1
		}
		parser.token = parser.file[parser.i:parser.j]
	case .Alphanumeric:
		parser.j = parser.i + 1
		for parser.j < len(parser.file) &&
		    _get_token_type(parser.file, parser.j, loc = loc) == .Alphanumeric {
			parser.j += 1
		}
		parser.token = parser.file[parser.i:parser.j]
	case .TripleDot, .TripleEquals, .TripleNotEquals:
		// 3 length
		parser.j = parser.i + 3
		parser.token = parser.file[parser.i:parser.j]
	case .PlusEquals,
	     .MinusEquals,
	     .TimesEquals,
	     .SlashEquals,
	     .QuestionMarkColon,
	     .DoubleQuestionMark,
	     .QuestionMarkDot,
	     .DoubleEquals,
	     .LambdaArrow,
	     .DoubleNotEquals,
	     .LessThanEquals,
	     .GreaterThanEquals,
	     .LogicalOr,
	     .LogicalAnd,
	     .DoublePlus,
	     .DoubleMinus,
	     .DoubleTimes:
		// 2 length
		parser.j = parser.i + 2
		parser.token = parser.file[parser.i:parser.j]
	case:
		// 1 length
		parser.j = parser.i + 1
		parser.token = parser.file[parser.i:parser.j]
	case .EndOfFile:
		// 0 length
		parser.j = parser.i
		parser.token = ""
	}
}
// NOTE: we want `sb = nil` for lookahead
next_token :: proc(
	parser: ^Parser,
	sb: ^strings.Builder = nil,
	token_group := TokenGroup.Token,
	loc := #caller_location,
) {
	if DEBUG_MODE {fmt.printfln("  %v", parser)}
	if sb != nil {
		fmt.sbprint(sb, parser.file[parser.i:parser.j])
	}
	parser.i = parser.j
	_parse_until_next_token(parser, sb, token_group, loc = loc)
}
print_prev_token :: proc(
	parser: ^Parser,
	sb: ^strings.Builder,
	prev_i: int,
	loc := #caller_location,
) {
	assert(sb != nil, "sb cannot be nil", loc = loc)
	fmt.sbprint(sb, parser.file[prev_i:parser.i])
}
