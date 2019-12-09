/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/types.h>
#include <stdlib.h>
#include <string.h>
#include "jsmn.h"

/**
 * Allocates a fresh unused token from the token pull.
 */
static jsmntok_t *jsmn_alloc_token(jsmn_parser *parser,
		jsmntok_t *tokens, size_t num_tokens) {
	jsmntok_t *tok;
	if (parser->toknext >= num_tokens) {
		return NULL;
	}
	tok = &tokens[parser->toknext++];
	tok->start = tok->end = -1;
	tok->size = 0;
#ifdef JSMN_PARENT_LINKS
	tok->parent = -1;
#endif
	return tok;
}

/**
 * Fills token type and boundaries.
 */
static void jsmn_fill_token(jsmntok_t *token, jsmntype_t type,
		int start, int end) {
	token->type = type;
	token->start = start;
	token->end = end;
	token->size = 0;
}

/**
 * Fills next available token with JSON primitive.
 */
static jsmnerr_t jsmn_parse_primitive(jsmn_parser *parser, const char *js,
		size_t len, jsmntok_t *tokens, size_t num_tokens) {
	jsmntok_t *token;
	int start;

	start = parser->pos;

	for (; parser->pos < len && js[parser->pos] != '\0'; parser->pos++) {
		switch (js[parser->pos]) {
#ifndef JSMN_STRICT
		/* In strict mode primitive must be followed by "," or "}" or "]" */
		case ':':
#endif
		case '\t' : case '\r' : case '\n' : case ' ' :
		case ','  : case ']'  : case '}' :
			goto found;
		}
		if (js[parser->pos] < 32 || js[parser->pos] >= 127) {
			parser->pos = start;
			return JSMN_ERROR_INVAL;
		}
	}
#ifdef JSMN_STRICT
	/* In strict mode primitive must be followed by a comma/object/array */
	parser->pos = start;
	return JSMN_ERROR_PART;
#endif

	found:
	if (tokens == NULL) {
		parser->pos--;
		return 0;
	}
	token = jsmn_alloc_token(parser, tokens, num_tokens);
	if (token == NULL) {
		parser->pos = start;
		return JSMN_ERROR_NOMEM;
	}
	jsmn_fill_token(token, JSMN_PRIMITIVE, start, parser->pos);
#ifdef JSMN_PARENT_LINKS
	token->parent = parser->toksuper;
#endif
	parser->pos--;
	return 0;
}

/**
 * Filsl next token with JSON string.
 */
static jsmnerr_t jsmn_parse_string(jsmn_parser *parser, const char *js,
		size_t len, jsmntok_t *tokens, size_t num_tokens) {
	jsmntok_t *token;

	int start = parser->pos;

	parser->pos++;

	/* Skip starting quote */
	for (; parser->pos < len && js[parser->pos] != '\0'; parser->pos++) {
		char c = js[parser->pos];

		/* Quote: end of string */
		if (c == '\"') {
			if (tokens == NULL) {
				return 0;
			}
			token = jsmn_alloc_token(parser, tokens, num_tokens);
			if (token == NULL) {
				parser->pos = start;
				return JSMN_ERROR_NOMEM;
			}
			jsmn_fill_token(token, JSMN_STRING, start+1, parser->pos);
#ifdef JSMN_PARENT_LINKS
			token->parent = parser->toksuper;
#endif
			return 0;
		}

		/* Backslash: Quoted symbol expected */
		if (c == '\\' && parser->pos + 1 < len) {
			int i;
			parser->pos++;
			switch (js[parser->pos]) {
			/* Allowed escaped symbols */
			case '\"': case '/' : case '\\' : case 'b' :
			case 'f' : case 'r' : case 'n'  : case 't' :
				break;
				/* Allows escaped symbol \uXXXX */
			case 'u':
				parser->pos++;
				for(i = 0; i < 4 && parser->pos < len && js[parser->pos] != '\0'; i++) {
					/* If it isn't a hex character we have an error */
					if(!((js[parser->pos] >= 48 && js[parser->pos] <= 57) || /* 0-9 */
							(js[parser->pos] >= 65 && js[parser->pos] <= 70) || /* A-F */
							(js[parser->pos] >= 97 && js[parser->pos] <= 102))) { /* a-f */
						parser->pos = start;
						return JSMN_ERROR_INVAL;
					}
					parser->pos++;
				}
				parser->pos--;
				break;
				/* Unexpected symbol */
			default:
				parser->pos = start;
				return JSMN_ERROR_INVAL;
			}
		}
	}
	parser->pos = start;
	return JSMN_ERROR_PART;
}

/**
 * Parse JSON string and fill tokens.
 */
jsmnerr_t jsmn_parse(jsmn_parser *parser, const char *js, size_t len,
		jsmntok_t *tokens, unsigned int num_tokens) {
	jsmnerr_t r;
	int i;
	jsmntok_t *token;
	int count = 0;

	for (; parser->pos < len && js[parser->pos] != '\0'; parser->pos++) {
		char c;
		jsmntype_t type;

		c = js[parser->pos];
		switch (c) {
		case '{': case '[':
			count++;
			if (tokens == NULL) {
				break;
			}
			token = jsmn_alloc_token(parser, tokens, num_tokens);
			if (token == NULL)
				return JSMN_ERROR_NOMEM;
			if (parser->toksuper != -1) {
				tokens[parser->toksuper].size++;
#ifdef JSMN_PARENT_LINKS
				token->parent = parser->toksuper;
#endif
			}
			token->type = (c == '{' ? JSMN_OBJECT : JSMN_ARRAY);
			token->start = parser->pos;
			parser->toksuper = parser->toknext - 1;
			break;
		case '}': case ']':
			if (tokens == NULL)
				break;
			type = (c == '}' ? JSMN_OBJECT : JSMN_ARRAY);
#ifdef JSMN_PARENT_LINKS
			if (parser->toknext < 1) {
				return JSMN_ERROR_INVAL;
			}
			token = &tokens[parser->toknext - 1];
			for (;;) {
				if (token->start != -1 && token->end == -1) {
					if (token->type != type) {
						return JSMN_ERROR_INVAL;
					}
					token->end = parser->pos + 1;
					parser->toksuper = token->parent;
					break;
				}
				if (token->parent == -1) {
					break;
				}
				token = &tokens[token->parent];
			}
#else
			for (i = parser->toknext - 1; i >= 0; i--) {
				token = &tokens[i];
				if (token->start != -1 && token->end == -1) {
					if (token->type != type) {
						return JSMN_ERROR_INVAL;
					}
					parser->toksuper = -1;
					token->end = parser->pos + 1;
					break;
				}
			}
			/* Error if unmatched closing bracket */
			if (i == -1) return JSMN_ERROR_INVAL;
			for (; i >= 0; i--) {
				token = &tokens[i];
				if (token->start != -1 && token->end == -1) {
					parser->toksuper = i;
					break;
				}
			}
#endif
			break;
		case '\"':
			r = jsmn_parse_string(parser, js, len, tokens, num_tokens);
			if (r < 0) return r;
			count++;
			if (parser->toksuper != -1 && tokens != NULL)
				tokens[parser->toksuper].size++;
			break;
		case '\t' : case '\r' : case '\n' : case ' ':
			break;
		case ':':
			parser->toksuper = parser->toknext - 1;
			break;
		case ',':
			if (tokens != NULL && parser->toksuper >= 0 &&
					tokens[parser->toksuper].type != JSMN_ARRAY &&
					tokens[parser->toksuper].type != JSMN_OBJECT) {
#ifdef JSMN_PARENT_LINKS
				parser->toksuper = tokens[parser->toksuper].parent;
#else
				for (i = parser->toknext - 1; i >= 0; i--) {
					if (tokens[i].type == JSMN_ARRAY || tokens[i].type == JSMN_OBJECT) {
						if (tokens[i].start != -1 && tokens[i].end == -1) {
							parser->toksuper = i;
							break;
						}
					}
				}
#endif
			}
			break;
#ifdef JSMN_STRICT
			/* In strict mode primitives are: numbers and booleans */
		case '-': case '0': case '1' : case '2': case '3' : case '4':
		case '5': case '6': case '7' : case '8': case '9':
		case 't': case 'f': case 'n' :
			/* And they must not be keys of the object */
			if (tokens != NULL) {
				jsmntok_t *t = &tokens[parser->toksuper];
				if (t->type == JSMN_OBJECT ||
						(t->type == JSMN_STRING && t->size != 0)) {
					return JSMN_ERROR_INVAL;
				}
			}
#else
			/* In non-strict mode every unquoted value is a primitive */
		default:
#endif
			r = jsmn_parse_primitive(parser, js, len, tokens, num_tokens);
			if (r < 0) return r;
			count++;
			if (parser->toksuper != -1 && tokens != NULL)
				tokens[parser->toksuper].size++;
			break;

#ifdef JSMN_STRICT
			/* Unexpected char in strict mode */
		default:
			return JSMN_ERROR_INVAL;
#endif
		}
	}

	for (i = parser->toknext - 1; i >= 0; i--) {
		/* Unmatched opened object or array */
		if (tokens[i].start != -1 && tokens[i].end == -1) {
			return JSMN_ERROR_PART;
		}
	}

	return count;
}

/**
 * Creates a new parser based over a given  buffer with an array of tokens
 * available.
 */
void jsmn_init(jsmn_parser *parser) {
	parser->pos = 0;
	parser->toknext = 0;
	parser->toksuper = -1;
}

//taken from demo code https://github.com/zserge/jsmn/blob/master/example/simple.c
int jsoneq(const char *json, const jsmntok_t *tok, const char *s) {
	if (tok->type == JSMN_STRING && (int) strlen(s) == tok->end - tok->start &&
			strncmp(json + tok->start, s, tok->end - tok->start) == 0) {
		return 0;
	}
	return -1;
}

char* json_get_element_string(json_t *json, const char *needle){
	char *return_string = NULL;
	int key_index = -1;

	for (int i = 0; i < json->token_count; i++){
		if (jsoneq(json->string, &(json->tokens[i]), needle) == 0){
			key_index = i;
			break;
		}
	}
	if (key_index == -1){ //element not found
		return NULL;
	}

	//there must be at least one more token after the key token
	if (key_index + 1 >= json->token_count){
		return NULL;
	}

	int return_value_index = key_index + 1;

	if (json->tokens[return_value_index].type != JSMN_STRING){ //value token is not a string
		return NULL;
	}

	if (json->tokens[return_value_index].end >= json->string_length){ //parsing error? can't write outside the array...
		return NULL;
	}

	return_string = json->string + json->tokens[return_value_index].start;
	json->string[json->tokens[return_value_index].end] = '\0';
	return return_string;
}

bool json_get_element_int(json_t *json, const char *needle, int *target_int){
	int key_index = -1;

	for (int i = 0; i < json->token_count; i++){
		if (jsoneq(json->string, &(json->tokens[i]), needle) == 0){
			key_index = i;
			break;
		}
	}
	if (key_index == -1){ //element not found
		return false;
	}

	//there must be at least one more token after the key token
	if (key_index + 1 >= json->token_count){
		return false;
	}

	int return_value_index = key_index + 1;

	if (json->tokens[return_value_index].type != JSMN_PRIMITIVE){ //value token is not an int
		return false;
	}

	if (json->tokens[return_value_index].end >= json->string_length){ //parsing error? can't write outside the array...
		return false;
	}

	json->string[json->tokens[return_value_index].end] = '\0';

	int status = sscanf(json->string + json->tokens[return_value_index].start, "%d", target_int);
	if (status != 1){
		return false;
	}

	return true;
}
char* json_escape_string(const char *string_to_escape){
	unsigned int characters_to_escape = 0;
	unsigned int string_length = 0;
	const char *p = string_to_escape;

	//count how many characters have to be escaped
	while (*p){
		switch (*p) {
		case '"': //yes - fallthrough everythere
		case '\\'://TODO: use __attribute__((fallthrough))
		case '\b':
		case '\f':
		case '\n':
		case '\r':
		case '\t':
			characters_to_escape++;
		}
		string_length++;
		p++;
	}
	if (characters_to_escape == 0){ //nothing to do

		char *string_to_return = FCalloc(string_length+1, 1);
		memcpy(string_to_return, string_to_escape, string_length+1);
		return string_to_return;
	}

	//the fun starts...
	char *escaped_string = FCalloc(string_length + characters_to_escape + 1/*terminator*/, 1);
	if (escaped_string == NULL){
		return NULL;
	}

	const char *source = string_to_escape;
	char *target = escaped_string;

	while (*source){
		switch (*source) {
		case '"': //yes - fallthrough everythere
		case '\\'://TODO: use __attribute__((fallthrough))
		case '\b':
		case '\f':
		case '\n':
		case '\r':
		case '\t':
			*target = '\\';
			target++;
		}
		*target = *source;
		target++;
		source++;
	}

	return escaped_string;
}

char* json_unescape_string( char *string_to_unescape){
	char *src = string_to_unescape;
	char *dst = string_to_unescape;
	while( *src != 0 )
	{
		switch( *src ) 
		{
			case '\\':
				printf("skip!\n");
				src++;
			break;
			default:
			printf("-> %c ", *src );
				*dst = *src;
				src++;
				dst++;
			break;
	}
		// 0 on the end
	
	}
	*dst = 0;//*src;
	return string_to_unescape;
}
