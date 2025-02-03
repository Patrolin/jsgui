package main
import "core:fmt"

TokenType :: enum {
	EndOfFile,
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
	Separator,
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
	file: string,
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
	case '?', ':', '=', ',', ';':
		return .Separator
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
eat_next_token :: proc(parser: ^Parser, token_type: TokenType) -> string {
	start := parser.i
	#partial switch token_type {
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
		assert(false, "Cannot eat .EndOfFile token")
	case:
		parser.i += 1
	}
	return parser.file[start:parser.i]
}
eat_whitespace :: proc(parser: ^Parser) -> TokenType {
	token_type := get_next_token(parser)
	for token_type >= .Whitespace && token_type <= .MultiLineComment {
		eat_next_token(parser, token_type)
		token_type = get_next_token(parser)
	}
	return token_type
}
