/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "string.h"
#include "hashmap.h"
#include "list.h"
#include "json_core.h"

//
//#define JSON_DEBUG
//

char* JSONGetExpectedErrorString( unsigned int expected )
{
	char* str = malloc( 86 );
	char* ptr = str;
	if( expected & JSON_TYPE_ARRAY )
	{
		memcpy( ptr, "array, ", 7 );
		ptr += 7;
	}
	if( expected & JSON_TYPE_OBJECT )
	{
		memcpy( ptr, "object, ", 8 );
		ptr += 8;
	}
	if( expected & JSON_TYPE_VALUE )
	{
		memcpy( ptr, "value, ", 7 );
		ptr += 7;
	}
	if( expected & JSON_TYPE_FBOOL )
	{
		memcpy( ptr, "bool, ", 6 );
		ptr += 6;
	}
	if( expected & JSON_TYPE_NULL )
	{
		memcpy( ptr, "null, ", 6 );
		ptr += 6;
	}
	if( expected & JSON_TYPE_NUMBER )
	{
		memcpy( ptr, "number, ", 8 );
		ptr += 8;
	}
	if( expected & JSON_TYPE_STRING )
	{
		memcpy( ptr, "string, ", 8 );
		ptr += 8;
	}
	if( expected & JSON_TYPE_ERROR )
	{
		memcpy( ptr, "error, ", 7 );
		ptr += 7;
	}
	if( expected & JSON_TYPE_COLON )
	{
		memcpy( ptr, "colon, ", 7 );
		ptr += 7;
	}
	if( expected & JSON_TYPE_COMMA )
	{
		memcpy( ptr, "comma, ", 7 );
		ptr += 7;
	}
	if( expected & JSON_TYPE_ARRAY_END )
	{
		memcpy( ptr, "array end, ", 11 );
		ptr += 11;
	}
	if( expected & JSON_TYPE_OBJECT_END )
	{
		memcpy( ptr, "object end, ", 12 );
		ptr += 12;
	}
	if(ptr != str)
	{
		*(ptr-2) = 0;
	}
	else
	{
		str[0] = 0;
	}
	return str;
}

//
//
//

JSONArray* JSONArrayNew()
{
	JSONArray* a = calloc( 1, sizeof( JSONArray ) );
	return a;
}

//
//
//

JSONData* JSONDataNew( unsigned int line __attribute__((unused)))
{
	JSONData* d = calloc( 1, sizeof( JSONData ) );
	d->type = JSON_TYPE_NONE;
	//printf("++++ JSONDataNew 0x%.8X, %d\n", d, line);
	return d;
}

//
//
//

int JSONCharIsWhitespace( char c )
{
	return ( c == ' ' || c == '\t' || c == '\n' || c == '\r' );
}

//
//
//

int JSONCharIsStructural( char c )
{
	return ( c == '[' || c == ']' || c == '{' || c == '}' || c == ':' || c == ',' );
}

//
//
//

JSONData* JSONParse( char* str, unsigned int length )
{
	// First node in the JSON document
	JSONData* firstNode = JSONDataNew(__LINE__);
	JSONData* currentNode = firstNode;

	// For continuing after nested arrays/objects
	JSONData* stack[JSON_NESTED_SIZE];
	unsigned int level = 0;

	// Control variables
	unsigned int state      = JSON_TYPE_NONE;
	unsigned int prevState  = JSON_TYPE_NONE;
	unsigned int expect     = JSON_TYPE_ARRAY | JSON_TYPE_OBJECT | JSON_TYPE_VALUE;
	unsigned int nextExpect = 0;

	// Control flags
	char inObject    = FALSE;
	char inObjectKey = FALSE;
	char inArray     = FALSE;
	char inValue     = FALSE;
	char doAdd       = FALSE;
	char resetState  = FALSE;
	char inEscape    = FALSE;
	char inHexEscape = FALSE;

	char* currentKey = NULL;

	const char* trueStr  = "true";
	const char* falseStr = "false";
	const char* nullStr  = "null";

	char buffer[256];
	unsigned int bIndex = 0;

	// For debugging/error reporting
	unsigned int linenum = 1;
	unsigned int column = 1;
	unsigned int error = JSON_ERROR_NONE;

	for( unsigned int i = 0; i < length + 1 && error == JSON_ERROR_NONE; i++ )
	{
		char c = i < length ? str[i] : '\n';

		DEBUG("\nChar: %c (0x%.2X, %d)\n", c, c, i);

		column++;

		// How it works:
		//     Step 1:  Check for the first character, and determine what what kind of token it is, and what to do next
		//     Step 2a: If it's a value, determine the value type and continue parsing the value
		//     Step 2b: If it's a control character, do the appropriate action and go to Step 1 (by setting resetSate = true)
		//     Step 2c: Check if we expected this token. If we did not, stop parsing and report error.
		//     Step 3:  Once we're done parsing the value, add it to the current JSONData object/array/plain, then to go Step 1
		//     (Some values, such as bools, nulls and nums will reset the state and feed the last character back to the loop)
		switch( state )
		{
			// --------------------------------------------------------------------------------------------------------
			// Step 1
			// Check for the first character, and determine what what kind of token it is, and what to do next
			// --------------------------------------------------------------------------------------------------------
			case JSON_TYPE_NONE:
			{
				bIndex = 0;
				switch( c )
				{
					// ----------------------------------------
					// Control characters
					// If it's a control character, do the appropriate action and go to Step 1 (by setting resetSate = true)
					// ----------------------------------------
					// New array
					case '[':
						state = JSON_TYPE_ARRAY;
						currentNode->type = state | JSON_TYPE_ARRAY_LIST;
						currentNode->data = (void*)JSONArrayNew();
						doAdd = TRUE;
						inObject = FALSE;
						inArray = TRUE;
						resetState = TRUE;
						nextExpect = JSON_TYPE_VALUE | JSON_TYPE_ARRAY | JSON_TYPE_OBJECT | JSON_TYPE_ARRAY_END;
						break;

					// Next value in array or object
					case ',':
						if( inArray )
						{
							nextExpect = JSON_TYPE_VALUE | JSON_TYPE_ARRAY | JSON_TYPE_OBJECT;
							JSONData* d = stack[level - 1];
						}
						else if( inObject )
						{
							nextExpect = JSON_TYPE_VALUE | JSON_TYPE_OBJECT_END;
							inObjectKey = TRUE;
						}
						else
						{
							printf( "Unknown state\n" );
							JSONFree( firstNode );
							if( firstNode != currentNode )
								JSONFree( currentNode );
							return NULL;
						}
						state = JSON_TYPE_COMMA;
						resetState = TRUE;
						break;

					// End array
					case ']':
					{
						// Convert from list to array
						JSONData* d = stack[level - 1];
						JSONArray* a = d->data;
						JSONData** a2 = (JSONData**)calloc( d->size, sizeof( JSONData* ) );
						List* lt = a->first;
						unsigned int i = 0;
						while( lt )
						{
							List* t = lt;
							if( lt->l_Data )
								a2[i++] = (JSONData*)lt->l_Data;
							lt = lt->next;
							free( t );
						}
						free( a );
						d->data = a2;
						d->type &= ~JSON_TYPE_ARRAY_LIST;

						// Pop the stack
						state = JSON_TYPE_ARRAY_END;
						level--;
						d = stack[level - 1];
						if( d && ( d->type & JSON_TYPE_OBJECT ) )
						{
							inObject = TRUE;
							inObjectKey = TRUE;
							inArray = FALSE;
							nextExpect = JSON_TYPE_COMMA | JSON_TYPE_OBJECT_END;
						}
						if( d && ( d->type & JSON_TYPE_ARRAY ) )
						{
							inObject = FALSE;
							inObjectKey = FALSE;
							inArray = TRUE;
							nextExpect = JSON_TYPE_COMMA | JSON_TYPE_ARRAY_END;
						}

						// If the previous object was an array, we're expecting a new value or the array to end
						/*
						nextExpect = JSON_TYPE_COMMA;
						if( stack[level]->type & JSON_TYPE_ARRAY )
							nextExpect |= JSON_TYPE_ARRAY_END;
						else if( stack[level]->type & JSON_TYPE_OBJECT )
							nextExpect |= JSON_TYPE_OBJECT_END;
						*/
						resetState = TRUE;
						break;
					}

					// New object
					case '{':
						state = JSON_TYPE_OBJECT;
						currentNode->type = state;
						currentNode->data = (void*)HashmapNew();
						doAdd = TRUE;
						inObject = TRUE;
						inObjectKey = TRUE;
						inArray = FALSE;
						resetState = TRUE;
						//expect = JSON_TYPE_NONE;
						nextExpect = JSON_TYPE_VALUE | JSON_TYPE_OBJECT_END;
						break;

					// Key/value separator for objects
					case ':':
						nextExpect = JSON_TYPE_VALUE | JSON_TYPE_ARRAY | JSON_TYPE_OBJECT;
						state = JSON_TYPE_COLON;
						resetState = TRUE;
						inObjectKey = FALSE;
						break;

					// End object
					case '}':
					{
						state = JSON_TYPE_OBJECT_END;
						level--;

						// If the previous object was an array, we're expecting a new value or the array to end
						JSONData* d = stack[level - 1];
						if( d && ( d->type & JSON_TYPE_OBJECT ) )
						{
							inObject = TRUE;
							inObjectKey = TRUE;
							inArray = FALSE;
							nextExpect = JSON_TYPE_COMMA | JSON_TYPE_OBJECT_END;
						}
						if( d && ( d->type & JSON_TYPE_ARRAY ) )
						{
							inObject = FALSE;
							inObjectKey = FALSE;
							inArray = TRUE;
							nextExpect = JSON_TYPE_COMMA | JSON_TYPE_ARRAY_END;
						}

						//expect = JSON_TYPE_NONE;
						resetState = TRUE;
						break;
					}
					// ----------------------------------------
					// Values
					// If it's a value, determine the value type and continue parsing the value
					// ----------------------------------------
					// String
					case '"':
						state = JSON_TYPE_VALUE;
						currentNode->type = JSON_TYPE_STRING;
						break;

					// Number
					case '-':
						state = JSON_TYPE_VALUE;
						currentNode->type = JSON_TYPE_NUMBER;
						buffer[bIndex++] = c;
						break;

					// Bool
					case 't':
					case 'f':
						state = JSON_TYPE_VALUE;
						currentNode->type = JSON_TYPE_FBOOL;
						currentNode->size = c == 't' ? 4 : 5;
						buffer[bIndex++] = c;
						break;

					// Null
					case 'n':
						state = JSON_TYPE_VALUE;
						currentNode->type = JSON_TYPE_NULL;
						currentNode->size = 4;
						buffer[bIndex++] = c;
						break;

					default:
						// Number (again)
						if( c >= '0' && c <= '9' )
						{
							state = JSON_TYPE_VALUE;
							currentNode->type = JSON_TYPE_NUMBER;
							buffer[bIndex++] = c;
						}
						// Whitespace (Should be ignored)
						else if( JSONCharIsWhitespace( c ) )
						{
							if( c == '\n' )
							{
								column = 1;
								linenum++;
							}
						}
						// Unknown token
						else
						{
							printf( "Unexpected character \"%c\" on line %d, column %d (%s:%d)\n", c, linenum, column, __FILE__, __LINE__ );
							JSONFree( firstNode );
							if( firstNode != currentNode )
								JSONFree( currentNode );
							return NULL;
						}
				}

				// Check if we expected this token. If we did not, stop parsing and report error.
				// If we're in an object, verify the value type to be string
				if( state && expect && !JSONCharIsWhitespace( c ) )
				{
					if( ( expect & state ) && ( !inObjectKey || state != JSON_TYPE_VALUE || (inObjectKey && currentNode->type == JSON_TYPE_STRING ) ) )
					{
						expect = JSON_TYPE_NONE;
					}
					else
					{
						DEBUG( "Expecting: %.8X%s, got %.8X\n", expect, inObjectKey ? " (string)" : "", state );
						DEBUG( "    expected: %s. got: %s\n", JSONGetExpectedErrorString(expect), JSONGetExpectedErrorString(state) );

						DEBUG( "Unexpected character \"%c\" on line %d, column %d (%s:%d)\n", c, linenum, column, __FILE__, __LINE__ );
						JSONFree( firstNode );
						if( firstNode != currentNode )
						{
							JSONFree( currentNode );
						}
						return NULL;
					}
				}
				if( nextExpect )
				{
					expect = nextExpect;

					DEBUG( "Now expecting: %.8X (%s) (%s:%d)\n", expect, JSONGetExpectedErrorString( expect ), __FILE__, __LINE__ );
				}

				break;
			}

			// --------------------------------------------------------------------------------------------------------
			// Step 2a
			// --------------------------------------------------------------------------------------------------------
			case JSON_TYPE_VALUE:
			{
				switch( currentNode->type )
				{
					case JSON_TYPE_FBOOL:
						// Is it "true"?
						if( currentNode->size == 4 && c == trueStr[bIndex] )
						{
							buffer[bIndex++] = c;
							if( bIndex == 4 )
							{
								doAdd = TRUE;
								buffer[bIndex] = 0;
								currentNode->data = StringDuplicate( buffer );
							}
						}
						// Is it "false"?
						else if( currentNode->size == 5 && c == falseStr[bIndex] )
						{
							buffer[bIndex++] = c;
							if( bIndex == 5 )
							{
								doAdd = TRUE;
								buffer[bIndex] = 0;
								currentNode->data = StringDuplicate( buffer );
							}
						}
						// I am error.
						else
						{
							error = JSON_ERROR_UNEXPECTED_CHARACTER;
							printf( "Illegal literal name on line %d, column %d.\n", linenum, column );
							JSONFree( firstNode );
							if( firstNode != currentNode )
								JSONFree( currentNode );
							return NULL;
						}
						break;
					case JSON_TYPE_NULL:
						if( currentNode->size == 4 && c == nullStr[bIndex] )
						{
							buffer[bIndex++] = c;
							if( bIndex == 4 )
							{
								doAdd = TRUE;
								buffer[bIndex] = 0;
								currentNode->data = StringDuplicate( buffer );
							}
						}
						else
						{
							error = JSON_ERROR_UNEXPECTED_CHARACTER;
							printf( "Illegal literal name on line %d, column %d.\n", linenum, column );
							JSONFree( firstNode );
							if( firstNode != currentNode )
								JSONFree( currentNode );
							return NULL;
						}
						break;
					case JSON_TYPE_NUMBER:
						if( !CharIsDigit( c ) )
						{
							// TODO: Numbers are not allowed to start with 0
							if( JSONCharIsWhitespace( c ) || JSONCharIsStructural( c ) )
							{
								// Validate that the number is valid
								// Don't interpret the number until it's nessecary, though.
								buffer[bIndex++] = 0;
								currentNode->data = StringDuplicate( buffer );
								doAdd = TRUE;

								// Parse the current character again, now that we know it's not
								// part of this number.
								i--;
							}
							else
							{
								// Unexpected character
								error = JSON_ERROR_UNEXPECTED_CHARACTER;
								printf( "Unexpected character \"%c\" on line %d, column %d (%s:%d)\n", c, linenum, column, __FILE__, __LINE__ );
								JSONFree( firstNode );
								if( firstNode != currentNode )
									JSONFree( currentNode );
								return NULL;
							}
						}
						else
							buffer[bIndex++] = c;
						break;
					case JSON_TYPE_STRING:
						// Parse regular character
						if( !inEscape )
						{
							// Check for escape character
							if( c == '\\' )
							{
								inEscape = TRUE;
							}
							// Check for end of string
							else if( c == '"' )
							{
								buffer[bIndex] = 0;
								//printf("---- %s\n", buffer);
								currentNode->data = StringDuplicate( buffer );
								doAdd = TRUE;
							}
							// Add to the buffer
							else
							{
								buffer[bIndex++] = c;
							}
						}
						// Parse escape
						else
						{
							switch( c )
							{
								// Escaped control characters
								case '"':
								case '\\':
								case '/':
									buffer[bIndex++] = c;
									inEscape = FALSE;
									break;
								// Backspace
								case 'b':
									buffer[bIndex++] = '\b';
									inEscape = FALSE;
									break;
								// ?
								case 'f':
									buffer[bIndex++] = '\f';
									inEscape = FALSE;
									break;
								// Newline
								case 'n':
									buffer[bIndex++] = '\n';
									inEscape = FALSE;
									break;
								// Carriage return
								case 'r':
									buffer[bIndex++] = '\r';
									inEscape = FALSE;
									break;
								// Tab
								case 't':
									buffer[bIndex++] = '\t';
									inEscape = FALSE;
									break;
								// UTF-16 surrogate
								case 'u':
									inHexEscape = TRUE;
									break;
								// Error
								default:
									error = JSON_ERROR_UNEXPECTED_CHARACTER;
									printf( "Unexpected escape character \"\\%c\" on line %d, column %d.\n", c, linenum, column );
									JSONFree( firstNode );
									if( firstNode != currentNode )
									{
										JSONFree( currentNode );
									}
									return NULL;
							}

						}
						break;
					default:
						DEBUG( "Unknown value type 0x%.8X on line %d, column %d.\n", currentNode->type, linenum, column );
						JSONFree( firstNode );
						if( firstNode != currentNode )
						{
							JSONFree( currentNode );
						}
						return NULL;
				}
				break;
			}

			// --------------------------------------------------------------------------------------------------------
			default:
				DEBUG( "Unknown token type 0x%.8X on line %d, column %d.\n", currentNode->type, linenum, column );
				JSONFree( firstNode );
				if( firstNode != currentNode )
					JSONFree( currentNode );
				return NULL;
		}
		// --------------------------------------------------------------------------------------------------------
		// Step 3
		// Once we're done parsing the value, add it to the current JSONData object/array/plain, then to go Step 1
		// --------------------------------------------------------------------------------------------------------
		if( doAdd )
		{
			// If this is the first node, just push it onto the stack
			if( level == 0 )
			{

				DEBUG("Got initial type (level %d), type: %s\n", level, JSONGetExpectedErrorString(currentNode->type) );

				stack[level++] = currentNode;
			}

			// Add to array
			else if( ( level && ( stack[level - 1]->type & JSON_TYPE_ARRAY ) ) )
			{
				DEBUG("Added to array (level %d), type: %s\n", level, JSONGetExpectedErrorString(currentNode->type) );
			
				// Get the parent object
				JSONData* d = stack[level - 1];
				
				// Reset buffer index
				bIndex = 0;

				// Append to array
				JSONArray* array = ((JSONArray*)d->data);
				List* newElement = ListNew();
				newElement->l_Data = currentNode;

				// If the array if empty, add the first element
				if( array->last == NULL )
				{
					array->first = newElement;
					array->last = newElement;

				}
				// Else append to the existing array
				else
				{
					array->last->next = newElement;
					array->last = newElement;
					
				}
				// Expect , or ] if the array contains more than 1 item.
				expect = JSON_TYPE_COMMA | JSON_TYPE_ARRAY_END;
				d->size++;
				
				nextExpect = JSON_TYPE_NONE;

				DEBUG( "Now expecting: %.8X (%s) (%s:%d)\n", expect, JSONGetExpectedErrorString( expect ), __FILE__, __LINE__ );

			}

			// Add to object
			else if( ( level && ( stack[level - 1]->type & JSON_TYPE_OBJECT ) ) )
			{
				// Add object
				/*
				if( state & JSON_TYPE_OBJECT )
				{
					#ifdef JSON_DEBUG
						printf("Added object (level %d), type: %s\n", level, JSONGetExpectedErrorString(currentNode->type) );
					#endif

					stack[level++] = currentNode;
					expect = JSON_TYPE_VALUE | JSON_TYPE_OBJECT_END;
				}*/

				// Add key
				if( inObjectKey && !( state & JSON_TYPE_OBJECT ) )
				{
					if( bIndex )
					{
						currentKey = StringDuplicate( buffer );
					}
					//if( !( state & JSON_TYPE_OBJECT ) )
						JSONFree( currentNode );
						currentNode = NULL;
					expect = JSON_TYPE_COLON;

					DEBUG( "Now expecting: %.8X (%s) (%s:%d)\n", expect, JSONGetExpectedErrorString( expect ), __FILE__, __LINE__ );

					inObjectKey = FALSE;
				}
				// Add value
				else
				{
					DEBUG( "Added to object (level %d), type: %s\n", level, JSONGetExpectedErrorString( state ) );

					// Get the parent object
					JSONData* d = stack[level - 1];
					if( !d || !d->data )
					{
						DEBUG( "Error: Data is NULL! on line %d, column %d.\n", linenum, column );
						JSONFree( firstNode );
						if( firstNode != currentNode )
						{
							JSONFree( currentNode );
						}
						return NULL;
					}
					HashmapPut( d->data, currentKey, currentNode );
					HashmapElement* e = HashmapGet( d->data, currentKey );
					currentKey = NULL;
					expect = JSON_TYPE_COMMA | JSON_TYPE_OBJECT_END;

					DEBUG( "Now expecting: %.8X (%s) (%s:%d)\n", expect, JSONGetExpectedErrorString( expect ), __FILE__, __LINE__ );
				}
				nextExpect = JSON_TYPE_NONE;
			}

			// If the element we added was an array, push it onto the stack
			if( state & JSON_TYPE_ARRAY )
			{

				DEBUG("Added array (level %d), type: %s\n", level, JSONGetExpectedErrorString(currentNode->type) );

				stack[level++] = currentNode;
				expect = JSON_TYPE_ARRAY | JSON_TYPE_OBJECT | JSON_TYPE_VALUE | JSON_TYPE_ARRAY_END;
			}
			if( state & JSON_TYPE_OBJECT )
			{

				DEBUG("Added object (level %d), type: %s\n", level, JSONGetExpectedErrorString(currentNode->type) );

				stack[level++] = currentNode;
				expect = JSON_TYPE_VALUE | JSON_TYPE_OBJECT_END;
			}

			currentNode = JSONDataNew(__LINE__);

			state = JSON_TYPE_NONE;
			doAdd = FALSE;
		}

		// Sometimes we need to know what happened previously
		prevState = state;

		// Cleanup the state to prepare for the next token
		if( resetState )
		{
			state = JSON_TYPE_NONE;
			resetState = FALSE;
		}
	}

	// We should be at level 1 or 0 for a clean exit.
	if( level > 1 )
	{
		DEBUG( "Unexpected end of document on line %d, column %d. Level %d\n", linenum, column, level );
	}

	// The current node wasn't used at this point, free it!
	if( currentNode )
	{
		JSONFree( currentNode );
	}

	// Return the document
	return firstNode;
}

//
//
//

List* _JSONStringify( JSONData* d __attribute__((unused)), List* l __attribute__((unused)))
{ //UNIMPLEMENTED
	return NULL;
}

//
//
//

void printJSONDocument( JSONData* c )
{
	JSONData** a = NULL;
	unsigned int size = 0;
	unsigned int iterator = 0;
	Hashmap* h = NULL;
	if( c->type == JSON_TYPE_ARRAY )
	{
		printf( "[" );
		a = (JSONData**)c->data;
		size = c->size;
	}
	else if( c->type == JSON_TYPE_OBJECT )
	{
		h = (Hashmap*)c->data;
		size = h->hm_Size;
		printf( "{" );
	}
	else
	{
		size = 1;
	}
	for( unsigned int i = 0; i < size; i++ )
	{
		JSONData* t = NULL;
		HashmapElement* e = NULL;
		if( c->type == JSON_TYPE_ARRAY )
			t = a[i];
		else if( c->type == JSON_TYPE_OBJECT )
		{
			e = HashmapIterate( h, &iterator );
			if( !e )
			{
				printf( "\n;____________;\n" );
			}
			if( e )
			{
				t = (JSONData*)e->hme_Data;
			}
			printf( "\"%s\":", e->hme_Key );
		}
		else
			t = c;
		if( !t )
			printf( "%d nope", i );
		switch( t->type )
		{
			case JSON_TYPE_STRING:
				printf( "\"%s\",", (char*)t->data );
				break;
			case JSON_TYPE_NULL:
				printf( "null," );
				break;
			case JSON_TYPE_FBOOL:
				printf( "%s,", (char*)t->data );
				break;
			case JSON_TYPE_NUMBER:
				printf( "%s,", (char*)t->data );
				break;
			case JSON_TYPE_ARRAY:
				printJSONDocument( t );
				printf( "," );
				break;
			case JSON_TYPE_OBJECT:
				printJSONDocument( t );
				printf( "," );
				break;
			default:
				printf( "%d wtf is %.8X", i, t->type );
		}
	}
	if( c->type == JSON_TYPE_ARRAY )
		printf( "]" );
	else if( c->type == JSON_TYPE_OBJECT )
		printf( "}" );
}

//
//
//

void JSONFree( JSONData* document )
{
	//char* type = JSONGetExpectedErrorString( document->type );
	//free( type );

	if( document == NULL )
	{
		return;
	}

	// Empty document
	if( document->data == NULL )
	{
		free( document );
		return;
	}

	// Normal array[]
	if( document->type == JSON_TYPE_ARRAY )
	{
		unsigned int size = document->size;
		for(unsigned int i = 0; i < size; i++)
		{
			JSONFree( ((JSONData**)document->data)[i] );
		}
		free( document->data );
	}
	// Linked->list
	else if( document->type == ( JSON_TYPE_ARRAY | JSON_TYPE_ARRAY_LIST ) )
	{
		JSONArray* a = document->data;
		List* lt = a->first;
		while( lt )
		{
			List* t = lt;
			if( lt->l_Data )
			{
				JSONFree( lt->l_Data );
			}
			lt = lt->next;
			free( t );
		}
		free( a );
	}
	// {"object"}
	else if( document->type == JSON_TYPE_OBJECT )
	{
		Hashmap* h = (Hashmap*)document->data;
		HashmapElement* e;
		unsigned int i = 0;
		while( ( e = HashmapIterate( h, &i ) ) != NULL )
		{
			FFree( e->hme_Key );
			if( e->hme_Data != NULL )
			{
				JSONFree( (JSONData*)e->hme_Data );
			}
		}
		HashmapFree( h );
	}
	// Value
	else
	{
		free( document->data );
	}
	free( document );
}

/*
int main()
{
	char* test1 =  
		"[\n"
		"    10,\n"
		"    50,\n"
		"    666,\n"
		"    -30,\n"
		"    [99,-69],\n"
		"    \"test \\\"String\\\"\",\n"
		"    true,\n"
		"    {\n"
		"        \"the key\" : 100,\n"
		"        \"yiffers\": [\n"
		"            -50,\n"
		"            \"omfg\"\n"
		"        ],\n"
		"        \"you\" :\"win\",\n"
		"    },\n"
		"    false,\n"
		"    null,1,2,\n"
		"    3\n"
		"]"
	;
	char* test2  = "{\"a\":1337,\"b\":-1337,\"c\":[1,2,\"fu\\\"1ck\",{\"a\":[\"w00t\"]}]}";
	//char* test2  = "{\"yo\":[{\"hello\":1}]}";
	char* test3  = "\"1337\"";
	char* test4  = "1337";
	char* test5  = "-1337";
	char* test6  = "true";
	char* test7  = "false";
	char* test8  = "null";
	char* test9  = "[1337]";
	char* test10 = "[\"1337\"]";
	char* test11 = "[]";
	char* test12 = "{}";
	char* test13 = "[{}]";
	char* test14 = 
		"["
			"{"
				"\"a\":"
				"{"
					"\"b\":"
					"{"
						"\"c\":"
						"["
							"["
								"["
									"{"
										"\"a\":\"yiffers\", \"poopers\":100"
									"}"
								"]"
							"]"
						"]"
					"}"
				"}"
			"}"
		"]";
	char* test15 = "{\"pne\":\"two\"}";
	char* tests[] = {
		test1,
		test2,
		test3,
		test4,
		test5,
		test6,
		test7,
		test8,
		test9,
		test10,
		test11,
		test12,
		test13,
		test14,
		test15,
	};
	for(unsigned int i = 0; i < sizeof(tests) / sizeof(char*); i++)
	{
		JSONData_t* doc = JSONParse( tests[i], strlen( tests[i] ) );
		if( doc )
		{
			printJSONDocument( doc );
			printf("\n");
			JSONFree( doc , __LINE__ );
			printf("\n\n");
		}
		else
			break;
	}
	//free( testString );
	printf( "\nDone c:\n" );
	return 0;
}
*/
