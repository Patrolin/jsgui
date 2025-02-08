package main
import "core:fmt"
import "core:strings"

TokenType :: enum {
	// expression ends
	EndOfFile,
	Semicolon,
	Comma,
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
	// 1 length
	QuestionMark,
	Math,
	Colon,
	Equals,
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
		j_1 := j + 1
		is_question_mark_colon := j_1 < len(file) && (file[j_1] == ':')
		return is_question_mark_colon ? .QuestionMarkColon : .QuestionMark
	// 1 length
	case ';':
		return .Semicolon
	case ',':
		return .Comma
	case '+', '-', '*', '/':
		return .Math
	case ':':
		return .Colon
	case '=':
		return .Equals
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
		assert(false, "Not implemented: .String")
	case .Alphanumeric:
		parser.k = parser.j + 1
		for parser.k < len(parser.file) &&
		    _get_token_type(parser.file, parser.k) == .Alphanumeric {
			parser.k += 1
		}
		parser.token = parser.file[parser.j:parser.k]
	case .QuestionMarkColon:
		parser.k = parser.j + 2
		parser.token = parser.file[parser.j:parser.k]
	case .EndOfFile:
		parser.k = parser.j
		parser.token = ""
	case:
		parser.k = parser.j + 1
		parser.token = parser.file[parser.j:parser.k]
	}
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
