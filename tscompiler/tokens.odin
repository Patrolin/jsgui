package main
import "core:fmt"

TokenType :: enum {
	// expression ends
	EndOfFile,
	Comma,
	Semicolon,
	// whitespace-like
	Whitespace,
	Newline,
	SingleLineComment,
	MultiLineComment,
	// N length
	String,
	Alphanumeric,
	// 1 length
	Math,
	QuestionMarkColon,
	QuestionMark,
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
	file: string `fmt:"-"`,
	i:    int,
}
make_parser :: proc(file: string) -> Parser {
	return Parser{file, 0}
}
get_next_token :: proc(parser: ^Parser) -> (token_type: TokenType) {
	if parser.i >= len(parser.file) {return .EndOfFile}
	char := parser.file[parser.i]
	switch char {
	// 1 length
	case ' ', '\t':
		return .Whitespace
	case '+', '-', '*':
		return .Math
	case '?':
		j := parser.i + 1
		is_question_mark_colon := j < len(parser.file) && (parser.file[parser.i + 1] == ':')
		return is_question_mark_colon ? .QuestionMarkColon : .QuestionMark
	case ':':
		return .Colon
	case '=':
		return .Equals
	case ',':
		return .Comma
	case ';':
		return .Semicolon
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
	// N length
	case '\r', '\n':
		return .Newline
	case '/':
		j := parser.i + 1
		is_single_line_comment := j < len(parser.file) && (parser.file[parser.i + 1] == '/')
		is_multi_line_comment := j < len(parser.file) && (parser.file[parser.i + 1] == '*')
		if is_single_line_comment {return .SingleLineComment}
		return is_multi_line_comment ? .MultiLineComment : .Math
	case '"', '\'':
		return .String
	case:
		return .Alphanumeric
	}
}
eat_next_token :: proc(parser: ^Parser, token_type: TokenType, assert_on_eof := true) -> string {
	start := parser.i
	#partial switch token_type {
	// N length
	case .QuestionMarkColon:
		parser.i += 2
	case .Newline:
		j := parser.i + 1
		is_two_char :=
			(parser.file[parser.i] == '\r') && (j < len(parser.file)) && (parser.file[j] == '\n')
		parser.i += is_two_char ? 2 : 1
	case .SingleLineComment:
		j := parser.i + 2
		for j < len(parser.file) && (parser.file[j] != '\n') && (parser.file[j] != '\r') {
			j += 1
		}
		parser.i = j
	case .MultiLineComment:
		j := parser.i + 3
		for j < len(parser.file) && (parser.file[j - 1] != '*') && (parser.file[j] != '/') {
			j += 1
		}
		parser.i = j + 1
	case .String:
		// TODO
		assert(false, "Not implemented")
	case .Alphanumeric:
		parser.i += 1
		for parser.i < len(parser.file) && get_next_token(parser) == .Alphanumeric {
			parser.i += 1
		}
	case .EndOfFile:
		if assert_on_eof {
			assert(false, "Cannot eat .EndOfFile token")
		}
	// 1 length
	case:
		parser.i += 1
	}
	return parser.file[start:parser.i]
}
eat_whitespace :: proc(
	parser: ^Parser,
) -> (
	token_type: TokenType,
	token: string,
	whitespace: string,
	did_newline: bool,
) {
	start := parser.i
	token_type = get_next_token(parser)
	for token_type >= .Whitespace && token_type <= .MultiLineComment {
		did_newline = did_newline && token_type == .Newline
		eat_next_token(parser, token_type)
		token_type = get_next_token(parser)
	}
	whitespace = parser.file[start:parser.i]
	token = eat_next_token(parser, token_type, false)
	return
}
