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
	// whitespace-like
	Whitespace,
	Newline,
	SingleLineComment,
	MultiLineComment,
	// N length
	String,
	Alphanumeric,
	// 2 length
	QuestionMarkColon,
	EqualsAngleBracketRight,
	// 1 length
	QuestionMark,
	Math,
	Colon,
	RoundBracketLeft,
	SquareBracketLeft,
	CurlyBracketLeft,
	AngleBracketLeft,
	RoundBracketRight,
	SquareBracketRight,
	CurlyBracketRight,
	AngleBracketRight,
}

Parser :: struct {
	file:       string `fmt:"-"`,
	whitespace: string,
	token:      string,
	token_type: TokenType,
	i:          int,
	j:          int,
	k:          int,
}
make_parser :: proc(file: string) -> Parser {
	parser := Parser{file, "", "", .EndOfFile, 0, 0, 0}
	parse_until_next_token(&parser)
	return parser
}
get_is_whitespace :: #force_inline proc(char: u8) -> bool {
	return char == ' ' || char == '\t'
}
get_is_newline :: #force_inline proc(char: u8) -> bool {
	return char == '\r' || char == '\n'
}
parse_until_next_token :: proc(parser: ^Parser) {
	_parse_whitespace(parser)
	_parse_token(parser)
}
@(private)
_parse_whitespace :: proc(parser: ^Parser) {
	j := parser.i
	for j < len(parser.file) {
		char := parser.file[j]
		is_whitespace := get_is_whitespace(char)
		is_newline := get_is_newline(char)
		if is_whitespace || is_newline {
			j += 1
		} else if char == '/' {
			j_1 := j + 1
			is_single_line_comment := j_1 < len(parser.file) && parser.file[j_1] == '/'
			is_multi_line_comment := j_1 < len(parser.file) && parser.file[j_1] == '*'
			if is_single_line_comment {
				j += 2
				for ; j < len(parser.file) && !get_is_newline(parser.file[j]); j += 1 {}
				continue
			} else if is_multi_line_comment {
				for ; j < len(parser.file); j += 1 {
					j_1 := j + 1
					if parser.file[j] == '*' && j_1 < len(parser.file) && parser.file[j_1] == '/' {
						break
					}
				}
				continue
			}
		} else {
			break
		}
	}
	parser.whitespace = parser.file[parser.i:j]
	parser.j = j
}
@(private)
_get_token_type :: proc(file: string, j: int) -> TokenType {
	if j >= len(file) {
		return .EndOfFile
	}
	switch file[j] {
	// whitespace-like
	case ' ', '\t', '\r', '\n':
		return .Whitespace
	// N length
	case '"', '\'':
		return .String
	case:
		return .Alphanumeric
	// 2 length
	case '?':
		{
			j_1 := j + 1
			is_question_mark_colon := j_1 < len(file) && (file[j_1] == ':')
			return is_question_mark_colon ? .QuestionMarkColon : .QuestionMark
		}
	case '=':
		{
			j_1 := j + 1
			is_lambda_arrow := j_1 < len(file) && (file[j_1] == '>')
			return is_lambda_arrow ? .EqualsAngleBracketRight : .Equals
		}
	// 1 length
	case ';':
		return .Semicolon
	case ',':
		return .Comma
	case '+', '-', '*', '/':
		return .Math
	case ':':
		return .Colon
	case '(':
		return .RoundBracketLeft
	case ')':
		return .RoundBracketRight
	case '[':
		return .SquareBracketLeft
	case ']':
		return .SquareBracketRight
	case '{':
		return .CurlyBracketLeft
	case '}':
		return .CurlyBracketRight
	case '<':
		return .AngleBracketLeft
	case '>':
		return .AngleBracketRight
	}
}
_parse_token :: proc(parser: ^Parser) {
	parser.token_type = _get_token_type(parser.file, parser.j)
	#partial switch parser.token_type {
	case .String:
		sb := strings.builder_make_none()
		parser.k = parser.j + 1
		is_escaped := false
		skip_count := 0
		for char, l in parser.file[parser.k:] {
			if skip_count > 0 {
				skip_count -= 1
				continue
			}
			if is_escaped {
				if char == 'u' {
					char_code_string := parser.file[parser.k + l + 1:parser.k + l + 5]
					parsed_length: int
					char_code, ok := strconv.parse_int(char_code_string, 16, &parsed_length)
					if !ok && char_code == 0 {
						fmt.sbprint(&sb, rune(0xFFFF))
					} else {
						fmt.sbprint(&sb, rune(char_code)) // TODO: actually handle UTF-16 properly
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
					if _get_token_type(parser.file, parser.k + l) == .String {
						parser.k += l + 1
						break
					} else {
						fmt.sbprint(&sb, char)
					}
				}
			}
		}
		parser.token = strings.to_string(sb)
	case .Alphanumeric:
		parser.k = parser.j + 1
		for parser.k < len(parser.file) &&
		    _get_token_type(parser.file, parser.k) == .Alphanumeric {
			parser.k += 1
		}
		parser.token = parser.file[parser.j:parser.k]
	case .QuestionMarkColon, .EqualsAngleBracketRight:
		// 2 length
		parser.k = parser.j + 2
		parser.token = parser.file[parser.j:parser.k]
	case:
		// 1 length
		parser.k = parser.j + 1
		parser.token = parser.file[parser.j:parser.k]
	case .EndOfFile:
		// 0 length
		parser.k = parser.j
		parser.token = ""
	}
}
eat_whitespace :: proc(parser: ^Parser, sb: ^strings.Builder) {
	fmt.sbprint(sb, parser.file[parser.i:parser.j])
	parser.i = parser.j
	parser.whitespace = ""
}
@(private)
_eat_token :: proc(parser: ^Parser) {
	parser.i = parser.k
	parse_until_next_token(parser)
}
@(private)
_eat_token_and_sbprint :: proc(parser: ^Parser, sb: ^strings.Builder) {
	fmt.sbprint(sb, parser.file[parser.i:parser.k])
	_eat_token(parser)
}
eat_token :: proc {
	_eat_token,
	_eat_token_and_sbprint,
}
