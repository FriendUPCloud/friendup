/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __JSMN_H_
#define __JSMN_H_

#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * JSON type identifier. Basic types are:
 * 	o Object
 * 	o Array
 * 	o String
 * 	o Other primitive: number, boolean (true/false) or null
 */
typedef enum {
	JSMN_PRIMITIVE = 0,
	JSMN_OBJECT = 1,
	JSMN_ARRAY = 2,
	JSMN_STRING = 3
} jsmntype_t;

typedef enum {
	/* Not enough tokens were provided */
	JSMN_ERROR_NOMEM = -1,
	/* Invalid character inside JSON string */
	JSMN_ERROR_INVAL = -2,
	/* The string is not a full JSON packet, more bytes expected */
	JSMN_ERROR_PART = -3
} jsmnerr_t;

/**
 * JSON token description.
 * @param		type	type (object, array, string etc.)
 * @param		start	start position in JSON data string
 * @param		end		end position in JSON data string
 */
typedef struct {
	jsmntype_t type;
	int start;
	int end;
	int size;
#ifdef JSMN_PARENT_LINKS
	int parent;
#endif
} jsmntok_t;

/**
 * JSON parser. Contains an array of token blocks available. Also stores
 * the string being parsed now and current position in that string
 */
typedef struct {
	unsigned int pos; /* offset in the JSON string */
	unsigned int toknext; /* next token to allocate */
	int toksuper; /* superior token node, e.g parent object or array */
} jsmn_parser;

/**
 * Create JSON parser over an array of tokens
 */
void jsmn_init(jsmn_parser *parser);

/**
 * Run JSON parser. It parses a JSON data string into and array of tokens, each describing
 * a single JSON object.
 */
jsmnerr_t jsmn_parse(jsmn_parser *parser, const char *js, size_t len,
		jsmntok_t *tokens, unsigned int num_tokens);


/**
 * This struct holds everything needed by json_get_element_string.
 */
typedef struct {
	char *string;
	int string_length;
	const jsmntok_t *tokens;
	int token_count;
} json_t;

/**
 * Compare json token name to provided string
 *
 * @param json pointer to json memory where json is placed
 * @param tok pointer to json token
 * @param s name which will be used to compare with token name
 * @return 0 when success, otherwise error number
 */
int jsoneq(const char *json, const jsmntok_t *tok, const char *s);

/**
 * Returns a string described by a token. Example: {"t":"someting"} when asked for "t" it will return pointer
 * to "something". Returned string will be NULL-terminated.
 *
 * @param json JSON struct to look in
 * @param needle key to look for
 * @return pointer to NULL-terminated string (within json_string) or NULL in case of failure
 */
char* json_get_element_string(json_t *json, const char *needle);

/**
 * Extracts an integer described by a token. Example: {"t":123} when asked for "t" it will return true
 * and set target_int to its value.
 *
 * @param json JSON struct to look in
 * @param needle key to look for
 * @param target_int pointer where to place the parsed int
 * @return true on success, false otherwise (target_int is not modified on failure)
 */
bool json_get_element_int(json_t *json, const char *needle, int *target_int);

/**
 * Returns a string that is JSON-escaped.
 *
 * @param string_to_escape string that should be escaped
  * @return pointer to NULL-terminated string or NULL in case of failure
 */
char* json_escape_string(const char *string_to_escape);

/**
 * Returns a string that is JSON-unescaped.
 *
 * @param string_to_unescape string that should be unescaped
  * @return pointer to NULL-terminated string or NULL in case of failure
 */
char* json_unescape_string( char *string_to_unescape);

#ifdef __cplusplus
}
#endif

#endif /* __JSMN_H_ */
