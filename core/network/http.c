/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Http structures and functions
 *
 *  @author HT
 *  @date pushed 14/10/2015
 */

#include <core/types.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "network/http.h"
#include "util/string.h"
#include <util/log/log.h>
#include <util/tagitem.h>
#include <communication/comm_msg.h>
#include <system/systembase.h>
#include <arpa/inet.h>
#include <linux/limits.h>

#ifndef INT_MAX
#define INT_MAX (int) (0x7FFF/0x7FFFFFFF)
#endif

//test
#undef __DEBUG

extern SystemBase *SLIB;

/**
 * sprintf function used by Http messages. (Pretty inefficient, but what the heck...)
 *
 * @param format same which is used by printf
 * @param ... other parameters
 * @return arguments in string
 */

char *Httpsprintf( char * format, ... )
{
	va_list argList;
	va_start( argList, format );
	char* str = FCalloc( (vsnprintf( NULL, 0, format, argList ) + 1), sizeof(char) );

	if( str == NULL )
	{
		Log( FLOG_FATAL,"Cannot allocate memory in Httpsprintf\n");
		return NULL;
	}
	va_end( argList );
	va_start( argList, format );
	vsprintf( str, format, argList );
	va_end( argList );
	return str;
}


/**
 * Create new Http
 *
 * @return Http structure
 */

Http *HttpNew( )
{
	Http* h = FCalloc( 1, sizeof( Http ) );
	if( h == NULL )
	{
		Log( FLOG_FATAL,"Cannot allocate memory for Http\n");
		return NULL;
	}
	h->http_Headers = HashmapNew();
	
	if( SLIB->sl_XFrameOption != NULL )
	{
		h->http_RespHeaders[ HTTP_HEADER_X_FRAME_OPTIONS ] = SLIB->sl_XFrameOption;//StringDuplicate( SLIB->sl_XFrameOption );
	}

	// Set default version to HTTP/1.1
	h->http_VersionMajor = 1;
	h->http_VersionMinor = 1;
	h->http_ResponseHeadersRelease = TRUE;
	h->http_ContentLength = 0;
	
	return h;
}

/**
 * create simple Http structure based on provided tags
 *
 * @param code http code
 * @param tag pointer to tag list
 * @return Http structure
 */

Http *HttpNewSimple( unsigned int code, struct TagItem *tag )
{
	Http* h = HttpNew( );
	if( h != NULL )
	{
		HttpSetCode( h, code );
		
		//INFO("==================================\n");

		while( tag->ti_Tag != TAG_DONE )
		{
			if( HttpAddHeader( h, tag->ti_Tag , (char *)tag->ti_Data )  != 0 )
			{
				FERROR("Cannot add key: %s\n", HEADERS[ tag->ti_Tag ] );
			}
			else
			{
				//INFO("Added %s\n", (char *) tag->ti_Data );
			}

			tag++;
		}
	}
	else
	{
		FERROR("Cannot allocate memory for HTTP\n");
	}
	return h;
}

/**
 * create simple Http structure based on provided tags and request
 *
 * @param code http code
 * @param tag pointer to tag list
 * @return Http structure
 */

Http *HttpNewSimpleBaseOnRequest( unsigned int code, Http *request, struct TagItem *tag )
{
	Http* h = HttpNew( );
	if( h != NULL )
	{
		HttpSetCode( h, code );
		
		//INFO("==================================\n");
		
		while( tag->ti_Tag != TAG_DONE )
		{
			if( HttpAddHeader( h, tag->ti_Tag , (char *)tag->ti_Data )  != 0 )
			{
				FERROR("Cannot add key: %s\n", HEADERS[ tag->ti_Tag ] );
			}
			else
			{
				//INFO("Added %s\n", (char *) tag->ti_Data );
			}
			
			tag++;
		}
		
		h->http_RequestSource = request->http_RequestSource; 
		h->http_ResponseID = request->http_ResponseID; 
	}
	else
	{
		FERROR("Cannot allocate memory for HTTP\n");
	}
	return h;
}

/**
 * Helper function to add some error codes to an object
 *
 * @param code http code
 * @param http pointer to http structure on which code will be set
 * @param line number of line where error appeard
 * @return Http structure
 */

Http *HttpError( unsigned int code, Http* http, unsigned int line )
{
	http->http_ErrorCode = code;
	http->http_ErrorLine = line;
	switch( code )
	{
		case 400:
			Log( FLOG_INFO, "400 Bad Request (%u)\n", line );
			break;
		default:
			Log( FLOG_INFO, "%u (%u)\n", code, line );
	}
	return http;
}

/**
 * any US-ASCII character (octets 0 - 127)
 *
 * @param c character which will be checked
 * @return TRUE when character is US-ASCII
 */

FBOOL HttpIsChar( char c )
{
	return (unsigned char)c < 0x80;
}

/**
 * any US-ASCII control character (octets 0 - 31) and DEL (127)
 *
 * @param c character which will be checked
 * @return TRUE when char is US-ASCII control character
 */

FBOOL HttpIsCTL( char c )
{
	return c < 0x20 || c == 0x7F;
}

/**
 * Check if char is separator
 *
 * @param c character which will be checked
 * @return TRUE if char is separator, otherwise FALSE
 */

FBOOL HttpIsSeparator( char c )
{
	return 
	/* .--------------------------------------------. */
	/* | CHAR BINGO  || BOARD 15 || grandma   ||    | */
	/* +-------------++----------++-----------++----+ */
	/* | */ c == ' ' || c == '(' || c == ')'  || /* | */ 
	/* | */ c == '<' || c == '>' || c == '@'  || /* | */ 
	/* | */ c == ',' || c == ';' || c == '\\' || /* | */ 
	/* | */ c == '"' || c == '/' || c == '['  || /* | */ 
	/* | */ c == ']' || c == '?' || c == '='  || /* | */ 
	/* | */ c == '{' || c == '}' || c == 0x09;   /* | */
	/* '--------------------------------------------' */ 
}

/**
 * Check if characer is high 
 *
 * @param c character which will be checked
 * @return TRUE if character is high and alphanumeric, otherwise FALSE
 */

static inline FBOOL HttpIsUpAlpha( char c )
{
	return c >= 'A' && c <= 'Z';
}

/**
 * Check if characer is low 
 *
 * @param c character which will be checked
 * @return TRUE if character is low and alphanumeric, otherwise FALSE
 */

static inline FBOOL HttpIsLoAlpha( char c )
{
	return c >= 'a' && c <= 'z';
}

/**
 * Change char to lower
 *
 * @param c character which will be converted
 * @return changed or original character
 */

char HttpAlphaToLow( char c )
{
	if( HttpIsUpAlpha( c ) )
	{
		return c | 0x20;
	}
	return c;
}

/**
 * Check if character is token
 *
 * @param c character which will be checked
 * @return TRUE if char is token, otherwise FALSE
 */

static inline FBOOL HttpIsToken( char c )
{
	return !( HttpIsCTL( c ) || HttpIsSeparator( c ) ) && HttpIsChar( c );
}

/**
 * Check if character is whitespace
 *
 * @param c character which will be checked
 * @return TRUE or FALSE
 */

static inline FBOOL HttpIsWhitespace( char c )
{
	return c == ' ' || c == '\t';
}

/**
 * parse integer value
 *
 * @param str string which will be converted to int
 * @return str parameter represented by integer value
 */

int HttpParseInt( char* str )
{
	unsigned int len = strlen( str );
	unsigned int i = 0;
	int v = 0;
	bool negative = false;
	if( str[0] == '-' )
	{
		negative = true;
		i++;
	}
	else if( str[0] == '+' )
	{
		i++;
	}
	for( i = 0; i < len; i++ )
	{	
		if( str[ i ] >= '0' && str[ i ] <= '9' )
		{
			// bit shift: v * 10
			v = ( ( SHIFT_LEFT( v, 3 ) ) + ( SHIFT_LEFT(v, 1) ) ) + ( str[ i ] - '0' );
		}
		else
		{
			break;
		}
	}
	if( negative )
	{
		return -v;
	}
	else
	{
		return v;
	}
}

/**
 * Parse Http header
 *
 * @param http pointer to Http where results will be stored.
 * @param request http request represented by string
 * @param fullReqLength length of provided request
 * @return http error code
 */

int HttpParseHeader( Http* http, const char* request, FQUAD fullReqLength )
{
	// TODO: Better response codes
	//
	// https://www.ietf.org/rfc/rfc2616.txt
	// http://tools.ietf.org/html/rfc7230 <- Better!
	
	if( request == NULL )
	{
		FERROR("Cannot parse header, request is empty!\n");
		return 1;
	}

	char* r = (char *)request;

	// Parse request header
	char *ptr = r;
	int step = -1;
	int substep = 0;
	FBOOL emptyLine = FALSE;
	FBOOL lookForFieldName = TRUE;
	char *currentToken = NULL;
	char *lineStartPtr = r;
	char *fieldValuePtr = NULL;
	unsigned int i = 0, i1 = 0;
	FBOOL copyValue = TRUE;
	
	// we cannot parse whole big message, nothing is sending so big headers
	unsigned int length = (int)fullReqLength;
	int reqMaxLength = HTTP_MAX_MEM_CONTENT_SIZE;
	if( fullReqLength > reqMaxLength )
	{
		fullReqLength = reqMaxLength;
	}
	
	http->http_ResponseHeadersRelease = FALSE;

	// Ignore any CRLF's that may precede the request-line
	while( TRUE )
	{
		if( r[i] != '\r' && r[i] != '\n' )
		{
			step++;
			break;
		}
		i++;
	}

	// Parse
	for( ; TRUE; i++ )
	{
		i1 = i + 1; // save time
		
		// Sanity check
		if( i > length )
		{
			return 400;
		}

		// Request-Line
		if( step == 0 )
		{
			if( r[i] == ' ' || r[i] == '\r' || r[i] == '\n' )
			{
				switch( substep )
				{
					// Method -----------------------------------------------------------------------------------------
					case 0:
						http->http_Method = StringDuplicateN( ptr, ( r + i ) - ptr );
						StringToUppercase( http->http_Method );

						// TODO: Validate method
						break;
					// Path and Query ---------------------------------------------------------------------------------
					case 1:
					{
						http->http_RawRequestPath = StringDuplicateN( ptr, ( r + i ) - ptr );

						http->http_Uri = UriParse( http->http_RawRequestPath );
						if( http->http_Uri && http->http_Uri->uri_Query )
						{
							http->http_Query = http->http_Uri->uri_Query;
						}
						break;
					}
					// Version ----------------------------------------------------------------------------------------
					case 2:
						http->http_Version = StringDuplicateN( ptr, ( r + i ) - ptr );
						if( http->http_Version != NULL )
						{
							unsigned int strLen = strlen( http->http_Version );

							// Do we have AT LEAST "HTTPxxxx"?
							// TODO: What if we have HTTP1/1?
							if( strLen < 8 || memcmp( http->http_Version, "HTTP", 4 ) )
							{
								return 400;
							}

							// Find the version separator
							char* p = strchr( http->http_Version, '/' );
							if( !p )
							{
								return 400;
							}
							p++;

							unsigned int pOffset = p - http->http_Version;
							unsigned int v = 0;
							FBOOL major = TRUE;
							for( unsigned int j = 0; pOffset + j < strLen; j++ )
							{
								// Parse number
								if( p[j] >= '0' && p[j] <= '9' )
								{
									// Bit shift v * 10
									v = ( ( SHIFT_LEFT(v, 3) ) + ( SHIFT_LEFT(v, 1) ) ) + ( p[j] - '0' );
								}
								// Save major version
								else if( p[j] == '.' )
								{
									if( major )
									{
										http->http_VersionMajor = v;
									}
									else
									{
										return 400;
									}
									major = FALSE;
									v = 0;
								}
								// Invalid version numbering!
								else
								{
									return 400;
								}
							}
							http->http_VersionMinor = v;
						}
						else
						{
							return 400;
						}
						break;
					// ------------------------------------------------------------------------------------------------
					default:
						// Any more than 3 segments in the request line is a bad request
						return 400;
				}
				substep++;
				ptr = r + i1;
			}
		}
		// Additional header lines
		else
		{
			if( r[i] != '\r' && r[i] != '\n' )
			{
				emptyLine = FALSE;

				if( lookForFieldName )
				{
					// Make sure the field name is a valid token until we hit the : separator
					if( !HttpIsToken( r[i] ) && r[i] != ':' )
					{
						return 400;
					}
					if( r[i] == ':' )
					{
						unsigned int tokenLength = ( r + i ) - lineStartPtr;
						if( currentToken != NULL )
						{
							FFree( currentToken );
						}
						currentToken = StringDuplicateN( lineStartPtr, tokenLength );
						
						//DEBUG("CurrentToken: '%s'\n", currentToken );

						for( unsigned int j = 0; j < tokenLength; j++ )
						{
							currentToken[j] = HttpAlphaToLow( currentToken[j] );
						}
						lookForFieldName = FALSE;
						
						if( currentToken != NULL )
						{
							if( strcmp( currentToken, "content-type" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_CONTENT_TYPE ] = lineStartPtr;
							
								char *eptr = strstr( lineStartPtr + tokenLength, ";" );
								if( eptr == NULL )
								{
									eptr = strstr( lineStartPtr + tokenLength, "\r" );
								}
							
								if( eptr != NULL )
								{
									int toksize = eptr - (lineStartPtr + tokenLength);
									char *app = NULL;
								
									if( toksize > 0 )
									{
										app = StringDuplicateN( lineStartPtr + tokenLength + 2, toksize - 2 );
									}

									//
									// getting content type
									//

									if( app != NULL )
									{
										if( strcmp( app, "application/x-www-form-urlencoded" ) == 0 )// ||  strcmp( app, "application/json" )  == 0 )
										{
											http->http_ContentType = HTTP_CONTENT_TYPE_DEFAULT;
										}
										else if( strcmp( app, "application/json" )  == 0 )
										{
											http->http_ContentType = HTTP_CONTENT_TYPE_APPLICATION_JSON;
										}
										else if( strcmp( app, "multipart/form-data" ) == 0 )
										{
											http->http_ContentType = HTTP_CONTENT_TYPE_MULTIPART;
										}
										else if( strcmp( app, "application/xml" ) == 0 )
										{
											http->http_ContentType = HTTP_CONTENT_TYPE_APPLICATION_XML;
										}
										else if( strcmp( app, "text/xml" ) == 0 )
										{
											http->http_ContentType = HTTP_CONTENT_TYPE_TEXT_XML;
										}

										FFree( app );
									} // app != NULL
								} //eptr != NULL
								copyValue = TRUE;
							} // if content-type
							else if( strcmp( currentToken, "user-agent" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_USER_AGENT ] = lineStartPtr+12;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							
								char *ptr = http->http_RespHeaders[ HTTP_HEADER_USER_AGENT ];
								while( *ptr != 0 )
								{
									if( *ptr == '\r' )
									{
										break;
									}
									ptr++;
								}
							
								char ipstr[INET6_ADDRSTRLEN];
								ipstr[ 0 ] = 0;
								if( http != NULL && http->http_Socket != NULL )
								{
									inet_ntop( AF_INET6, &( http->http_Socket->ip ), ipstr, sizeof ipstr );
								}
								
								snprintf( http->http_UserActionInfo, sizeof(http->http_UserActionInfo), "AGENT: %.*s, IP: %s", (int)(ptr - http->http_RespHeaders[ HTTP_HEADER_USER_AGENT ]), http->http_RespHeaders[ HTTP_HEADER_USER_AGENT ], ipstr );
							}
							else if( strcmp( currentToken, "content-length" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_CONTENT_LENGTH ] = lineStartPtr+16;
							
								char *val = StringDuplicateEOL( lineStartPtr+16 );
								if( val != NULL )
								{
									char *end;
									http->http_ContentLength = strtol( val,  &end, 0 );
									//http->h_ContentLength = atoi( val );
									FFree( val );
								}

								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "authorization" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_AUTHORIZATION ] = StringDuplicateEOL( lineStartPtr+15 );
								http->http_HeadersAlloc[ HTTP_HEADER_AUTHORIZATION ] = TRUE;
								DEBUG("HTTP_HEADER_AUTHORIZATION FOUND %.*s\n", 64, http->http_RespHeaders[ HTTP_HEADER_AUTHORIZATION ] );
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "www-authenticate" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_WWW_AUTHENTICATE ] = lineStartPtr+18;
								DEBUG("HTTP_HEADER_WWW_AUTHENTICATE FOUND %.*s\n", 64, http->http_RespHeaders[ HTTP_HEADER_WWW_AUTHENTICATE ] );
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "host" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_HOST ] = lineStartPtr+6;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "origin" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_ORIGIN ] = lineStartPtr+8;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "accept" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_HOST ] = lineStartPtr+8;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "method" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_HOST ] = lineStartPtr+8;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "referer" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_HOST ] = lineStartPtr+9;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "accept-language" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_ACCEPT_LANGUAGE ] = lineStartPtr+17;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "destination" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_DESTINATION ] = lineStartPtr+13;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "depth" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_DEPTH ] = lineStartPtr+7;
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "x-expected-entity-length" ) == 0 )
							{
								http->http_RespHeaders[ HTTP_HEADER_EXPECTED_CONTENT_LENGTH ] = lineStartPtr+26;

								char *val = StringDuplicateEOL( http->http_RespHeaders[ HTTP_HEADER_EXPECTED_CONTENT_LENGTH ] );
								if( val != NULL )
								{
									DEBUG("X-expected-entity FOUND: %s\n", val );

									char *end;
									http->http_ExpectedLength = strtol( val,  &end, 0 );
									//http->h_ExpectedLength = atoi( val );
								
									DEBUG("X-expected-entity FOUND: content length set %ld\n", http->http_ContentLength );
									FFree( val );
								}
							
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else if( strcmp( currentToken, "range" ) == 0 )
							{
								//Range: bytes=8388608-12582911
							
								http->http_RespHeaders[ HTTP_HEADER_RANGE ] = lineStartPtr+7;
								char *tmpc = http->http_RespHeaders[ HTTP_HEADER_RANGE ];
								char range[ 256 ];
								int pos = -1;

								http->http_RangeMax = INT_MAX;
							
								while( *tmpc != 0 )
								{
									if( *tmpc == '=' )
									{
										tmpc++;
										pos = -1;
									}
									else if( *tmpc == '-' )
									{
										tmpc++;
										range[ pos+1 ] = 0;
										char *end;
										http->http_RangeMin = strtol( range,  &end, 0 );
										//http->h_RangeMin = atoi( range );
									
										pos = -1;
									}
									else if( *tmpc == '\n' || pos >= 250 )
									{
										range[ pos+1 ] = 0;
										char *end;
										http->http_RangeMax = strtol( range,  &end, 0 );
										//http->h_RangeMax = atoi( range );
										break;
									}
									pos++;
									range[ pos ] = *tmpc;
								
									tmpc++;
								}
							
								copyValue = FALSE;
								FFree( currentToken );
								currentToken = NULL;
							}
							else
							{
								copyValue = TRUE;
							}
						}
					}
				}
				else
				{
					if( !fieldValuePtr && r[i] != ' ' && r[i] != 0x09 )
					{
						fieldValuePtr = r + i;
					}
				}
			}
			else if( !lookForFieldName && copyValue == TRUE )
			{
				// Example value: "    \t lolwat,      hai,yep   "
				unsigned int valLength = ( r + i ) - fieldValuePtr;

				if( valLength > 1 && fieldValuePtr != NULL )
				{
					char* value = StringDuplicateN( fieldValuePtr, valLength );
					List* list = CreateList();

					// Do not split Set-Cookie field
					if( currentToken != NULL && strcmp( currentToken, "set-cookie" ) == 0 )
					{
						AddToList( list, value );
					}
					// Split by comma
					else
					{
						char *ptr = value;
						unsigned int lastCharIndex = 0;
						FBOOL leadingWhitespace = TRUE;
						for( unsigned int iz = 0; iz < valLength; iz++ )
						{
							// Ignore leading whitespace
							if( leadingWhitespace && HttpIsWhitespace( value[ iz ] ) )
							{
								ptr = value + iz + 1;
								lastCharIndex++;
							}
							else
							{
								leadingWhitespace = FALSE;

								// Comma is the separator
								if( value[ iz ] == ',' )
								{
									char* v = NULL;

									if( value[ lastCharIndex ] == '"' )
									{
										v = StringDuplicateN( ptr, ( lastCharIndex ) - ( ptr - value ) );
									}
									else
									{
										v = StringDuplicateN( ptr, ( lastCharIndex + 1 ) - ( ptr - value ) );
									}
								
									AddToList( list, v );
								
									leadingWhitespace = TRUE;
									ptr = value + iz + 1;
									lastCharIndex++;
								}
								// Ignore trailing whitespace
								else if( !HttpIsWhitespace( value[ iz ] ) )
								{
									lastCharIndex++;
								}
							}
						}
						// Add the last value in the lift, if there are any left
						if( !leadingWhitespace )
						{
							char* v = NULL;

							if( value[ lastCharIndex ] == '"' )
							{
								v = StringDuplicateN( ptr, (lastCharIndex) - ( ptr - value ) );
							}
							else
							{
								v = StringDuplicateN( ptr, (lastCharIndex + 1) - ( ptr - value ) );
							}
							
							AddToList( list, v );
						}
						FFree( value );
					}

					if( currentToken != NULL )
					{
						HashmapPut( http->http_Headers, currentToken, list );
						currentToken = NULL; // It's gone!
					}
				}
			}
		}

		// Check for line ending
		// Even though the specs clearly say \r\n is the separator,
		// let's forgive some broken implementations! It's not a big deal.
		if( r[i] == '\n' || r[i] == '\r' )
		{
			// Reset and update some vars
			step++;
			substep = 0;
			if( r[ i1 ] == '\n' )
			{
				i++;
			}

			lineStartPtr = r + i + 1;

			// Time to end?
			if( emptyLine )
			{
				break;
			}
			emptyLine = TRUE;
			lookForFieldName = TRUE;
			fieldValuePtr = 0;
		}
	}
	
	// Free unused token!
	if( currentToken )
	{
		FFree( currentToken );
	}
	
	if( r[i] == '\r' )
	{
		i++; // In case we ended on a proper \r\n note, we need to adjust i by 1 to get to the beginning of the content (if any)
	}

	return 0;
}

/**
 * Find string in data
 *
 * @param str string which will be searched
 * @param data pointer to table of chars where str will be searched
 * @param length length of provided data
 * @return pointer to string where it is, otherwise NULL
 */

char *FindStrInData( char *str, char *data, int length)
{
	int pos = 0;
	int slen = strlen(str);
	while( pos < length - slen )
	{
		int i = 0;
		while( i < slen && str[ i ] == data[ pos + i ] )
		{
			i++;
		}
		
		if ( i == slen )
		{
			return data + pos;
		}
		pos++;
	}
	return NULL;
}

/**
 * Parse Http header (Multipart)
 *
 * @param http pointer to Http which will be parsed
 * @return 0 when request will be parsed without problems, otherwise error number
 */

int ParseMultipart( Http* http )
{
	http->http_ParsedPostContent = HashmapNew();
	if( http->http_ParsedPostContent == NULL )
	{
		Log( FLOG_ERROR,"Map was not created\n");
		return -1;
	}
	
	DEBUG("Multipart parsing, content length %ld\n", http->http_ContentLength);
	
	
	/*
	 * Content-Disposition: form-data; name="sessionid"

f0fc966084ebceefb32862f6d8255f3f8a47c52c
------WebKitFormBoundaryyhHTTYrmbVyzL3Ns
Content-Disposition: form-data; name="module"

files
------WebKitFormBoundaryyhHTTYrmbVyzL3Ns
Content-Disposition: form-data; name="command"

uploadfile
------WebKitFormBoundaryyhHTTYrmbVyzL3Ns
Content-Disposition: form-data; name="args"

{'path':'Home:'}
------WebKitFormBoundaryyhHTTYrmbVyzL3Ns
Content-Disposition: form-data; name="file"; filename="project.properties"
Content-Type: application/octet-stream

	 */
	
	//
	// Find files in http request
	//
	
	char *contentDisp = NULL;
	int numOfFiles = 0;
	char *dataPtr = http->http_Content;
	while( TRUE )
	{
	    if( ( contentDisp = strstr( dataPtr, "Content-Disposition: form-data; name=\"" ) ) != NULL )
		{
			char *nameEnd = strchr( contentDisp + 38, '"' );
			char *nextlineStart = strstr( nameEnd, "\r\n" ) + 2;
			
			//application/octet-stream
			if( strncmp( nextlineStart, "Content-Type: ", 14 ) == 0 )
			{
				//if( ( contentDisp = strstr( dataPtr, "Content-Disposition: form-data; name=\"file") ) != NULL )
				char *startOfFile = strstr( nextlineStart, "\r\n\r\n" ) + 4;
				FQUAD size = 0;
				
				if( startOfFile != NULL )
				{
					DEBUG("START CONTENT TO START FILE %d\n", startOfFile - http->http_Content );

					FQUAD res;
					int divSize = strlen( http->http_PartDivider );

					DEBUG("DIVSIZE %d\n", divSize );
					res = FindInBinaryPOS( http->http_PartDivider, divSize, startOfFile, (http->http_SizeOfContent-(startOfFile-http->http_Content)) )-2;// + divSize;
					//res = FindInBinaryPOS( http->http_PartDivider, strlen(http->http_PartDivider), startOfFile, http->http_SizeOfContent ) - 2;
					
					//res = (FQUAD )FindInBinarySimple( http->http_PartDivider, divSize, startOfFile, http->http_SizeOfContent )-2;
					
					char *endOfFile = startOfFile + res;
					DEBUG("MULTI FOUND END OF FILE %p START %p LEN %lu\n", endOfFile, startOfFile, res );
					if( endOfFile != NULL )
					{
						char *fname = strstr( contentDisp, "filename=\"" ) + 10;
						if( fname != NULL )
						{
							char *fnameend = strchr( fname, '"' );
							size = (FQUAD)(endOfFile - startOfFile);
							int fnamesize = (int)(fnameend - fname);
							
							INFO("[Http] Found file - name %.*s  FILESIZE %lu  FIRST CHAR\n", 30, fname, size );

							HttpFile *newFile = HttpFileNew( fname, fnamesize, startOfFile, size );
							if( newFile != NULL )
							{
								//FERROR("TEMP POS %p END POS %p   size %d\n", startOfFile, endOfFile, (int)( endOfFile-startOfFile ) );
								//INFO("PARSING FOR FILES %40s =============== %p  filesize %ld\n", startOfFile, startOfFile, size );
								if( http->http_FileList == NULL )
								{
									http->http_FileList = newFile;
								}
								else
								{
									newFile->node.mln_Succ = (MinNode *)http->http_FileList;
									http->http_FileList = newFile;
								}
								numOfFiles++;
							}
						}
						//--------- BG-389 ---------
						dataPtr = endOfFile;
						continue;
						//--------------------------
					}
				}
				
				int pos = size;
				if( size > 0 )
				{
					dataPtr += pos;
				}
				else
				{
					dataPtr += pos + 20;
				}
			} //end of if( strncmp( nextlineStart, "Content-Type: ", 14 ) == 0 )
			
			//
			// its not file its parameter
			//
			
			else
			{
				char *nameStart = contentDisp + 38;
				char *nameEnd = strchr( nameStart, '"' );
				char *key = StringDuplicateN( nameStart, (int)(nameEnd - nameStart) );
				
				char *startParameter = strstr( nextlineStart, "\r\n" ) + 2;
				char *endParameter = strstr( startParameter, "\r\n" );
				char *value = StringDuplicateN( startParameter, (int)(endParameter - startParameter) );
				
				//Content-Disposition: form-data; name="command"
				/*
				TODO: Enable this when it does something..
				*/
				
				if( HashmapPut( http->http_ParsedPostContent, key, value ) == MAP_OK )
				{
					
				}
				
				//DEBUG("[Http] Parse multipart KEY: <%s> VALUE <%s>\n", key, value );
				
				int pos = ( int )( contentDisp - dataPtr ); 
				dataPtr += pos + 20;
			}
		}
		else {
			DEBUG("End of parsing");
			break;
		}
	}
	
	DEBUG("Number of files in http request %d\n", numOfFiles );
	
	return 0;
}

/**
 * Parse first part of the request
 *
 * @param http http request
 * @param data which represent request as string
 * @param length data length
 * @return 0 when success, otherwise error number
 */

static const char *headerEnd = "\r\n\r\n";

static inline int HttpParsePartialRequestChunked( Http* http, char* data, unsigned int length )
{
	if( data == NULL || http == NULL )
	{
		Log( FLOG_ERROR,"Cannot parse NULL requiest\n");
		return -1;
	}
	long chunkSize = 0;
	char chunkSizeString[ 6 ];
	chunkSizeString[ 4 ] = 0;
	
	//data += 4;
	/*
	int i=0;
	for( i = 0 ; i < 12 ; i++ )
	{
		printf(" %c[%d] ", data[i], data[i] );
	}
	*/
	//DEBUG("MacOS workaround: %p\n", data );
	
	//DEBUG("ENDPOS chunk size %d\n", chunkSize );
	
	if( http->http_GotHeader && http->http_ExpectBody && http->http_Content )
	{
		//DEBUG("[HttpParsePartialRequestChunk] RECEIVE DATA, length %d\n", length );
		
		// If we have null data, just purge!
		if( length > 0 )
		{
			// we must copy chunk after chunk
			long chunk = 0;
			long left = length;
			char *ptr = data;
			char *dst = http->http_Content;
			long total = 0;
			int numberChunks = 0;
			
			//FILE *dfp;
			//if( ( dfp = fopen("/tmp/testwebdav_dst", "wb" ) ) != NULL ){}
			
			char *next = NULL;

			while( 1 )
			{
				/*
				int i;
				for( i = 0 ; i <6 ; i++ )
				{
					if( ptr[i] != 13 && ptr[i] != 11 ) printf(" %c[%d] ", ptr[i], ptr[i] );
				}
				printf("\n");
				*/

				int chunkSize = (int)strtol( ptr, &next, 16);
				ptr[ 4 ] = 0;
				ptr[ 5 ] = 0;
				if( chunkSize > 0 )
				{
					//printf("Chunksize %d\n", chunkSize );
					memcpy( dst, ptr + 6, chunkSize );
					dst += chunkSize;
					total += chunkSize;
					//fwrite( ptr+6, 1, chunkSize, dfp );
					ptr += 8 + chunkSize;

					numberChunks++;
				}
				else
				{
					//printf("Chunk < 0\n");
					break;
				}

				left -= chunkSize;//+8;
				//printf("bytes left %d\n", left );
				if( left < 0 )
				{
					DEBUG("No more chunks left\n");
					break;
				}
			}
// file                                                  1074791064 
			//DEBUG("stored in file %lu  should be 1073741824, numberChunks %d\n", total, numberChunks );
			
			//fclose( dfp );
			
			//DEBUG("Data stored TOTAL %ld\n", total );
		  
			//memcpy( http->content, data, length );
			
			/*
			char *endDivider = strstr( http->content, "\r\n" );
			memset( http->h_PartDivider, 0, 256*sizeof(char ) );
			if( endDivider != NULL )
			{
				strncpy( http->h_PartDivider, http->content, endDivider-http->content );
			}
			else
			  */
			{
				strcpy( http->http_PartDivider, "\r\n");
			}
			DEBUG("[HttpParsePartialRequest] Purge... Divider: %s\n", http->http_PartDivider );
		}
	
		if( length == http->http_SizeOfContent )
		{
			if( http->http_ContentType == HTTP_CONTENT_TYPE_MULTIPART )
			{
				DEBUG( "[HttpParsePartialRequest] Parsing multipart data!\n" );
			
				if( http->http_ParsedPostContent )
				{
					HashmapFree( http->http_ParsedPostContent );
				}
				int ret = ParseMultipart( http );
				
				DEBUG("MULTIPART\n");
			}
			else
			{
				DEBUG( "[HttpParsePartialRequest] Parsing post content!\n" );
				if( http->http_ParsedPostContent )
				{
					HashmapFree( http->http_ParsedPostContent );
				}
				
				http->http_ParsedPostContent = UriParseQuery( http->http_Content );
			}
		}
		return 1;
	}
	else
	{
		FERROR("Could not find data\n");
	}
	
	return 0;
}

// we need this information in Log
extern int nothreads;

int HttpParsePartialRequest( Http* http, char* data, FQUAD length )
{
	if( data == NULL || http == NULL )
	{
		Log( FLOG_ERROR,"Cannot parse NULL requiest\n");
		return -1;
	}
	
	// Setting it up
	if( !http->http_PartialRequest )
	{
		http->http_PartialRequest = TRUE;
		Log( FLOG_INFO,"INCOMING Request threads: %d length: %ld data: %.*s\n", nothreads, length, 512, data );
		
		// Check if the recieved data exceeds the maximum header size. If it does, 404 dat bitch~
		// TODO

		// Search for \r\n\r\n in the recieved header
		// Needle in a haystack
		char* found = strstr( ( char* )data, headerEnd );

		if( found )
		{
			int result = 0;
			FQUAD size = 0;
			
			if( http->http_GotHeader == FALSE )
			{
				http->http_GotHeader = TRUE;
				HttpParseHeader( http, data, length );
			}
			
			//DEBUG("content length %ld\n", http->h_ContentLength );
			//if( (content = HttpGetHeaderFromTable( http, HTTP_HEADER_CONTENT_LENGTH ) ) )
			//if( ( content = HttpGetHeader( http, "content-length", 0 ) ) )
			if( http->http_ContentLength > 0 )
			{
				// getting chunks, MacOS workaround
				if( http->http_RespHeaders[ HTTP_HEADER_EXPECTED_CONTENT_LENGTH ] != NULL )
				{
					//DEBUG("MacOS1 workaround: %p\n", found );
					
					size = http->http_ExpectedLength;//http->h_ContentLength;

					if( size > 0 )
					{
						http->http_ExpectBody = TRUE;

						DEBUG("=================\n=================\n================\n===============\n==============\n");
						if( http->http_ContentFileHandle > 0 )
						{
							munmap( http->http_Content, http->http_ContentLength );
							http->http_Content = NULL;
							unlink( http->http_TempContentFileName );
						}
						else
						{
							if( http->http_Content )
							{
								FFree( http->http_Content );
							}
						}
						
						if( size > HTTP_MAX_MEM_CONTENT_SIZE )
						{
							strcpy( http->http_TempContentFileName, HTTP_CONTENT_TEMP_NAME );
							char *tfname = mktemp( http->http_TempContentFileName );
							if( strlen( http->http_TempContentFileName ) == 0 )
							{
								FERROR("mktemp failed!");
							}
							else
							{
								http->http_ContentFileHandle = open( http->http_TempContentFileName, O_RDWR | O_CREAT | O_EXCL, 0600/*permissions*/);
								if( http->http_ContentFileHandle == -1 )
								{
									FERROR("temporary file open failed!");
								}

							}

							DEBUG("MMAP: HttpParsePartialRequest size: %lu\n", size );
							http->http_Content = mmap( 0, size+5, PROT_READ | PROT_WRITE, MAP_SHARED, http->http_ContentFileHandle, 0/*offset*/);
							
							//http->http_Content = mmap( 0, size, PROT_READ | PROT_WRITE, MAP_SHARED, http->http_ContentFileHandle, 0/*offset*/);
							DEBUG("Content set\n");
						}
						else
						{
							//http->content = FCalloc( (size + 5), sizeof( char ) );
							http->http_Content = FMalloc( size + 5 );
							http->http_SizeOfContent = size;
					
							http->http_Content[ size ] = 0;
						}
						
						// Add some extra data for content..
						int dataOffset = ( found - data + 4 ), dataLength = length - dataOffset;
						DEBUG("Content set, ptr %p offset %d\n", http->http_Content, dataOffset );
						if( dataLength <= 0 )
						{
							DEBUG("dataLength <= 0\n" );
							FFree( http->http_Content );
							http->http_Content = NULL;
							http->http_SizeOfContent = 0;
							http->http_ExpectBody = FALSE;
							return result != 400;
						}
						else if( dataLength < size )
						{
							DEBUG("dataLength != size  %d - %ld \n", dataLength, size );
							FFree( http->http_Content );
							http->http_Content = NULL;
							http->http_SizeOfContent = 0;
							http->http_ExpectBody = FALSE;
							return result != 400;
						}

						DEBUG("Call HttpParsePartialRequestChunked %p\n", found+4 );
						int r = HttpParsePartialRequestChunked( http, found + 4, size );
						return r;
					}
					else
					{
						DEBUG( "Ok, we say ONE (we have no size, nothing in content)\n" );
						return 1;
					}
				}
				else
				{
					size = http->http_ContentLength;
					
					DEBUG("SIZE %ld\n", size );

					if( size > 0 )
					{
						http->http_ExpectBody = TRUE;
						DEBUG("Size %ld\n", size );
				
						if( http->http_Content )
						{
							if( http->http_ContentFileHandle > 0 )
							{
								munmap( http->http_Content, http->http_ContentLength );
								http->http_Content = NULL;
								unlink( http->http_TempContentFileName );
							}
							else
							{
								FFree( http->http_Content );
							}
						}
						
						if( size > HTTP_MAX_MEM_CONTENT_SIZE )
						{
							strcpy( http->http_TempContentFileName, HTTP_CONTENT_TEMP_NAME );
							char *tfname = mktemp( http->http_TempContentFileName );
							//DEBUG( "large upload will go to remporary file %s", tmp_filename );
							if( strlen( http->http_TempContentFileName ) == 0 )
							{
								FERROR("mktemp failed!");
							}
							else
							{
								http->http_ContentFileHandle = open( http->http_TempContentFileName, O_RDWR | O_CREAT | O_EXCL, 0600/*permissions*/);
								if( http->http_ContentFileHandle == -1 )
								{
									FERROR("temporary file open failed!");
								}

							}
							
							/*
							if( incomingBufferPtr != NULL )
						{
							//DEBUG("incoming buffer already set? unmapping");
							munmap( incomingBufferPtr, incomingBufferLength );
							incomingBufferPtr = NULL;
						}
						//DEBUG( "mmaping" );
						incomingBufferLength = lseek( tmpFileHandle, 0, SEEK_END);
						DEBUG("->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ibl: %ld", incomingBufferLength );
						incomingBufferPtr = mmap( 0, incomingBufferLength, PROT_READ | PROT_WRITE, MAP_SHARED, tmpFileHandle, 0);
						
						if( incomingBufferPtr == MAP_FAILED )
						{
							Log( FLOG_ERROR, "Cannot allocate memory for stream, length: %d\n", incomingBufferLength );
							goto close_fcp;
						}
							*/
							//int sizes = lseek( http->http_ContentFileHandle, 0, SEEK_END);
							DEBUG("MMAP: HttpParsePartialRequest size: %lu\n", size );
							http->http_Content = mmap( 0, size, PROT_READ | PROT_WRITE, MAP_SHARED, http->http_ContentFileHandle, 0/*offset*/);
							
							//http->http_Content = mmap( 0, size, PROT_READ | PROT_WRITE, MAP_SHARED, http->http_ContentFileHandle, 0/*offset*/);
							DEBUG("Content set\n");
						}
						else
						{
							//http->content = FCalloc( (size + 5), sizeof( char ) );
							http->http_Content = FMalloc( (size + 5) );
							http->http_Content[ size ] = 0;
						}
						
						if( http->http_Content == NULL )
						{ //always check your pointers ;)
							DEBUG("********** Allocation of %ld bytes failed", size+5);
							return -2;
						}
						http->http_SizeOfContent = size;

						// Add some extra data for content..
						int dataOffset = ( found - data + 4 );
						FQUAD dataLength = length - dataOffset;
						DEBUG("Content set, ptr %p offset %d\n", http->http_Content, dataOffset );
						if( dataLength <= 0 )
						{
							DEBUG("dataLength <= 0\n" );
							FFree( http->http_Content );
							http->http_Content = NULL;
							http->http_SizeOfContent = 0;
							http->http_ExpectBody = FALSE;
							return result != 400;
						}
						else if( dataLength != size && ( ( dataLength - 4 ) != size ) )
						{
							DEBUG("dataLength != size  %ld - %ld \n", dataLength, size );
							FFree( http->http_Content );
							http->http_Content = NULL;
							http->http_SizeOfContent = 0;
							http->http_ExpectBody = FALSE;
							return result != 400;
						}

						int r = HttpParsePartialRequest( http, found + 4, size );
						return r;
					}
					else
					{
						DEBUG( "Ok, we say ONE (we have no size, nothing in content)\n" );
						return 1;
					}
				}
			}
			else
			{
				DEBUG("NO MORE DATA\n");
				// No more data, we're done parsing
				return result != 400;
			}
		}
		else
		{
			DEBUG("Header not found!\n");
			return 0;
		}
	}
	
	if( http->http_GotHeader && http->http_ExpectBody && http->http_Content )
	{
		DEBUG("[HttpParsePartialRequest] RECEIVE DATA, length %ld\n", length );
		
		// If we have null data, just purge!
		if( length > 0 )
		{
			if( http->http_ContentFileHandle > 0 )
			{
				int store = TUNABLE_LARGE_HTTP_REQUEST_SIZE;
				
				int wrote = write( http->http_ContentFileHandle, data, store );
				/*
				FQUAD toWrite = length;
				char *dataptr = data;
				
				if( toWrite < (FQUAD)store )
				{
					store = toWrite;
				}
				
				while( toWrite > 0 )
				{
					int wrote = write( http->http_ContentFileHandle, dataptr, store );
					dataptr += wrote;
					toWrite -= wrote;
					
					DEBUG("UPLOAD writing data into buffer toWrite: %ld wrote: %d\n", toWrite, wrote );
			
					if( toWrite < (FQUAD)store )
					{
						store = toWrite;
					}
				}
				*/
				DEBUG("-----------------------------------\n--------------------------------\n---------------------\n---------------------\n---------\n");
				FQUAD z;
				for( z=0 ; z < (length-8) ; z++ )
				{
					if( data[ z-8 ] == (char)0x00 && data[ z-7 ] == (char)0x00 && data[ z-6 ] == (char)0x9E && data[ z-5 ] == (char)0xCF && data[ z-4 ] == (char)0x04 && data[ z-3 ] == (char)0x01 && data[ z-2 ] == (char)0x00 && data[ z-1 ] == (char)0x00 )
					{
						FERROR("HTTP.c END FILE FOUDN! in CONTENT\n");
					}
				}
				
				DEBUG("UPLOAD writting done!\n");
				//FQUAD = 
				//int wrote = write( http->http_ContentFileHandle, data, length );
			}
			else
			{
				memcpy( http->http_Content, data, length );
			}
			
			char *endDivider = strstr( http->http_Content, "\r\n" );
			memset( http->http_PartDivider, 0, sizeof( char ) << 8 );
			
			DEBUG("UPLOAD endDivider pointer: %p\n", endDivider );
			if( endDivider != NULL )
			{
				int maxDivLen = sizeof( http->http_PartDivider ) - 1;
				int divLen = endDivider-http->http_Content;
				if(  divLen < maxDivLen )
				{
					maxDivLen = divLen;
				}
				strncpy( http->http_PartDivider, http->http_Content, maxDivLen );
			}
			else
			{
				strcpy( http->http_PartDivider, "\n");
			}
			DEBUG("[HttpParsePartialRequest] Purge... Divider: %s\n", http->http_PartDivider );
		}
	
		if( length == http->http_SizeOfContent )
		{
			if( http->http_ContentType == HTTP_CONTENT_TYPE_MULTIPART )
			{
				DEBUG( "[HttpParsePartialRequest] Parsing multipart data!\n" );
			
				if( http->http_ParsedPostContent )
				{
					HashmapFree( http->http_ParsedPostContent );
				}
				int ret = ParseMultipart( http );
				
				DEBUG("MULTIPART\n");
			}
			else
			{
				DEBUG( "[HttpParsePartialRequest] Parsing post content!\n" );
				if( http->http_ParsedPostContent )
				{
					HashmapFree( http->http_ParsedPostContent );
				}
				
				http->http_ParsedPostContent = UriParseQuery( http->http_Content );
			}
		}
		return 1;
	}
	else
	{
		FERROR("Could not find data\n");
	}
	
	return 0;
}
	
/**
 * Get headers list from Http request
 *
 * @param http http request
 * @param name header name
 * @return List witch headers
 */

List *HttpGetHeaderList( Http* http, const char* name )
{
	HashmapElement* e = HashmapGet( http->http_Headers, (char*)name );
	if( e )
	{
		return e->hme_Data;
	}
	else
	{
		return NULL;
	}
}

/**
 * Get a header field value from a list at the index, or NULL if there is no values at the given index
 *
 * @param http http request
 * @param name header name
 * @param index number of entry which will be taken from list
 * @return header as string
 */

char *HttpGetHeader( Http* http, const char* name, unsigned int index )
{
	HashmapElement* e = HashmapGet( http->http_Headers, (char*)name );
	if( e )
	{
		List* l = e->hme_Data;
		char* f = l->l_Data;
		for( unsigned int i = 0; i < index; i++ )
		{
			l = l->next;
			f = l->l_Data;
		}
		return f;
	}
	else
	{
		return NULL;
	}
}

/**
 * Get a header field value fromtable, or NULL if there is no values
 *
 * @param http http request
 * @param pos get header from http from this position
 * @return header as string
 */


char* HttpGetHeaderFromTable( Http* http, int pos )
{
	return http->http_RespHeaders[ pos ];
}

/**
 * Get the number of values this header contains
 *
 * @param http http request
 * @param name header name
 * @return number of header entries
 */

unsigned int HttpNumHeader( Http* http, const char* name )
{
	HashmapElement* e = HashmapGet( http->http_Headers, (char*)name );
	if( e )
	{
		List* l = e->hme_Data;
		unsigned int num = 0;
		do
		{
			num++;
		}
		while( ( l = l->next ) != NULL );

		return num;
	}
	else
	{
		return 0;
	}
}

/**
 * Check if the request contains a header with the given value
 *
 * @param http http request
 * @param name of header which will be checked
 * @param value which will be checked
 * @param caseSensitive is value case sensitive
 * @return TRUE if value is same, otherwise FALSE
 * 
 */

FBOOL HttpHeaderContains( Http* http, const char* name, const char* value, FBOOL caseSensitive )
{
	HashmapElement* e = HashmapGet( http->http_Headers, (char*)name );
	if( e )
	{		
		unsigned int i = 0;
		unsigned int size = strlen( value );
		
		// Precalc lowercase value
		char valueLowcase[ size ];
		for( ; i < size; i++ ) valueLowcase[ i ] = HttpAlphaToLow( value[ i ] );
		
		List* l = e->hme_Data;
		do
		{
			i = 0;
			char* data = (char*) l->l_Data;
			while( data[i] && i < size )
			{
				if(
					( !caseSensitive ? HttpAlphaToLow( data[ i ] ) : data[ i ] ) != 
					( !caseSensitive ? valueLowcase[ i ] : value[ i ] )
				)
				{
					break;
				}
				i++;
				
			}
			if( i == size )
			{
				return TRUE;
			}
		}
		while( ( l = l->next ) != NULL );

		return FALSE;
	}
	else
	{
		return FALSE;
	}
}

/**
 * Release Http request from memory
 *
 * @param http http request
 */

void HttpFree( Http* http )
{
	//DEBUG("Free HashMap\n");
	int i;
	//if( http->h_RequestSource == HTTP_SOURCE_HTTP )
	{
		for( i = 0; i < HTTP_HEADER_END ; i++ )
		{
			if( (i != HTTP_HEADER_X_FRAME_OPTIONS) )
			{
				if( http->http_RespHeaders[ i ] != NULL)
				{
					FFree( http->http_RespHeaders[ i ]  );
					http->http_RespHeaders[ i ] = NULL;
				}
			}
		}
	}
	
	// Only free the headers hashmap
	if( http->http_Headers != NULL )
	{
		HashmapFree( http->http_Headers );
	}
	//DEBUG("Headers freed\n");
	
	if( http->http_Response )
	{
		FFree( http->http_Response );
	}
	if( http->http_ContentFileHandle > 0 )
	{
		munmap( http->http_Content, http->http_ContentLength );
		http->http_Content = NULL;
		unlink( http->http_TempContentFileName );
	}
	else
	{
		FFree( http->http_Content );
	}
	if( http->http_ParsedPostContent != NULL )
	{
		HashmapFree( http->http_ParsedPostContent );
		http->http_ParsedPostContent = NULL;
	}
	//DEBUG("Remove files\n");
	
	// Free files
	HttpFile *curFile = http->http_FileList;
	HttpFile *remFile = curFile;
	while( curFile != NULL )
	{
		remFile = curFile;
		curFile = ( HttpFile * )curFile->node.mln_Succ;
		HttpFileDelete( remFile );
	}
	//DEBUG("Free http\n");

	FFree( http );
}

/**
 * Release Http request
 *
 * @param http http request
 */
void HttpFreeRequest( Http* http )
{
	int i;
	if( http == NULL )
	{
		return;
	}
	
	for( i = 0; i < HTTP_HEADER_END ; i++ )
	{
		if( http->http_HeadersAlloc[ i ] == TRUE && http->http_RespHeaders[ i ] != NULL )
		{
			FFree( http->http_RespHeaders[ i ]  );
			http->http_RespHeaders[ i ] = NULL;
		}
	}
	// Free the raw data we got from the request
	if( http->http_Method != NULL )
	{
		FFree( http->http_Method );
		http->http_Method = NULL;
	}
	if( http->http_Uri != NULL )
	{
		UriFree( http->http_Uri );
		http->http_Uri = NULL;
	}
	if( http->http_RawRequestPath != NULL )
	{
		FFree( http->http_RawRequestPath );
		http->http_RawRequestPath = NULL;
	}
	if( http->http_Version != NULL )
	{
		FFree( http->http_Version );
		http->http_Version = NULL;
	}
	if( http->http_Content != NULL && http->http_SizeOfContent != 0 )
	{
		if( http->http_ContentFileHandle > 0 )
		{
			if( http->http_Content )
			{
				munmap( http->http_Content, http->http_SizeOfContent );
			}
			close( http->http_ContentFileHandle );
			unlink( http->http_TempContentFileName );
		}
		else
		{
			FFree( http->http_Content );
		}
		http->http_Content = NULL;
		http->http_SizeOfContent = 0;
	}

	// Free the headers hashmap
	unsigned int iterator = 0;
	HashmapElement* e = NULL;
	if( http->http_Headers != NULL )
	{
		while( ( e = HashmapIterate( http->http_Headers, &iterator ) ) != NULL )
		{
			if( e->hme_Data != NULL )
			{
				List* l = (List*)e->hme_Data;
				List* n = NULL;
				do
				{
					if( l->l_Data )
					{
						FFree( l->l_Data );
						l->l_Data = NULL;
					}
					n = l->next;
					FFree( l );
					l = n;
				} while( l );
				e->hme_Data = NULL;
			}
			FFree( e->hme_Key );
			e->hme_Key = NULL;
		}
	
		HashmapFree( http->http_Headers );
		http->http_Headers = NULL;
	}
	
	if( http->http_PartialData )
	{
		FFree( http->http_PartialData );
		http->http_PartialData = NULL;
	}

	if( http->http_ParsedPostContent ) HashmapFree( http->http_ParsedPostContent );

	// Free files
	HttpFile *curFile = http->http_FileList;
	HttpFile *remFile = curFile;
	while( curFile != NULL )
	{
		remFile = curFile;
		curFile = (HttpFile *)curFile->node.mln_Succ;
		HttpFileDelete( remFile );
	}
	//DEBUG("Free http\n");

	// Suicide
	FFree( http );
}

/**
 * Set error code on request
 *
 * @param http http request
 * @param code error code as number
 */

void HttpSetCode( Http* http, unsigned int code )
{
	http->http_ResponseCode = code;
	switch( code )
	{
		case 100: http->http_ResponseReason = "Continue"; break;
		case 101: http->http_ResponseReason = "Switching Protocols"; break;
		case 102: http->http_ResponseReason = "Processing"; break;                      // WebDAV; RFC 2518

		case 200: http->http_ResponseReason = "OK"; break;
		case 201: http->http_ResponseReason = "Created"; break;
		case 202: http->http_ResponseReason = "Accepted"; break;
		case 203: http->http_ResponseReason = "Non-Authoritative Information"; break;
		case 204: http->http_ResponseReason = "No Content"; break;
		case 205: http->http_ResponseReason = "Reset Content"; break;
		case 206: http->http_ResponseReason = "Partial Content"; break;
		case 207: http->http_ResponseReason = "Multi-Status"; break;                    // WebDAV; RFC 4918
		case 208: http->http_ResponseReason = "Already Reported"; break;                // WebDAV; RFC 6842
		case 225: http->http_ResponseReason = "IM Used"; break;                         // RFC 3229

		case 300: http->http_ResponseReason = "Multiple Choices"; break;
		case 301: http->http_ResponseReason = "Moved Permanently"; break;
		case 302: http->http_ResponseReason = "Found"; break;
		case 303: http->http_ResponseReason = "See Other"; break;
		case 304: http->http_ResponseReason = "Not Modified"; break;
		case 305: http->http_ResponseReason = "Use Proxy"; break;
		case 307: http->http_ResponseReason = "Temporary Redirect"; break;
		case 308: http->http_ResponseReason = "Permanent Redirect"; break;              // Experimental RFC; RFC 7238

		case 400: http->http_ResponseReason = "Bad Request"; break;
		case 401: http->http_ResponseReason = "Unauthorized"; break;
		case 402: http->http_ResponseReason = "Payment Required"; break;
		case 403: http->http_ResponseReason = "Forbidden"; break;
		case 404: http->http_ResponseReason = "Not Found"; break;
		case 405: http->http_ResponseReason = "Method Not Allowed"; break;
		case 406: http->http_ResponseReason = "Not Acceptable"; break;
		case 407: http->http_ResponseReason = "Proxy Authentication Required"; break;
		case 408: http->http_ResponseReason = "Request Time-out"; break;
		case 409: http->http_ResponseReason = "Conflict"; break;
		case 410: http->http_ResponseReason = "Gone"; break;
		case 411: http->http_ResponseReason = "Length Required"; break;
		case 412: http->http_ResponseReason = "Precondition Failed"; break;
		case 413: http->http_ResponseReason = "Request Entity Too Large"; break;
		case 414: http->http_ResponseReason = "Request-URI Too Large"; break;
		case 415: http->http_ResponseReason = "Unsupported Media Type"; break;
		case 416: http->http_ResponseReason = "Requested range not satisfiable"; break;
		case 417: http->http_ResponseReason = "Expectation Failed"; break;
		case 418: http->http_ResponseReason = "I'm a teapot"; break;                    // RFC 2324
		case 422: http->http_ResponseReason = "Unprocessable Entity"; break;            // WebDAV; RFC 4918
		case 423: http->http_ResponseReason = "Locked"; break;                          // WebDAV; RFC 4918
		case 424: http->http_ResponseReason = "Failed Dependency"; break;               // WebDAV; RFC 4918
		case 426: http->http_ResponseReason = "Upgrade Required"; break;
		case 428: http->http_ResponseReason = "Precondition Failed"; break;             // RFC 6585
		case 429: http->http_ResponseReason = "Too Many Requests"; break;               // RFC 6585
		case 431: http->http_ResponseReason = "Request Header Fields Too Large"; break; // RFC 6585
		case 451: http->http_ResponseReason = "Unavailable For Legal Reasons"; break;

		case 500: http->http_ResponseReason = "Internal Server Error"; break;
		case 501: http->http_ResponseReason = "Not Implemented"; break;
		case 502: http->http_ResponseReason = "Bad Gateway"; break;
		case 503: http->http_ResponseReason = "Service Unavailable"; break;
		case 504: http->http_ResponseReason = "Gateway Time-out"; break;
		case 505: http->http_ResponseReason = "HTTP Version not supported"; break;
		case 506: http->http_ResponseReason = "Variant Also Negotiates"; break;         // RFC 2295
		case 507: http->http_ResponseReason = "Insufficient Storage"; break;            // WebDAV; RFC 4918
		case 508: http->http_ResponseReason = "Loop Detected"; break;                   // WebDAV; RFC 5842
		case 510: http->http_ResponseReason = "Not Extended"; break;                    // RFC 2774
		case 511: http->http_ResponseReason = "Network Authentication Required"; break; // RFC 6585
		default: http->http_ResponseReason = "?"; break;
	}
}

/**
 * Add Http header
 *
 * @param http http request
 * @param id id of header
 * @param value vaule of the header entry
 * @return 0 when value will be set, otherwise error number
 */

int HttpAddHeader(Http* http, int id, char* value )
{
	if( value == NULL )
	{
		FERROR("Cannot add empty header\n");
		return -1;
	}
	
	if( http->http_RespHeaders[ id ] != NULL )
	{
		FFree( http->http_RespHeaders[ id ] );
	}
	
	http->http_RespHeaders[ id ] = value;
	
	return 0;
}


/*
int HttpAddHeader( Http* http, const char* key, char* value )
{
	if( key && value  )
	{
		DEBUG("ADDHTTPHEADER %s : %s\n", key, value );
		
		// Lowercase the key
		int len = strlen( key );
		char* bkey = FCalloc( (len + 1), sizeof( char ) );
		if( bkey == NULL ) 
		{
			FFree( value );
			return -1;
		}
		memcpy( bkey, key, len );
		
		//int i = 0;
		//for( ; i < len; i++ )
		//{
		//	bkey[i] = HttpAlphaToLow( key[i] );
		//}
		
		// If this fails!
		if( HashmapPut( http->headers, bkey, value ) == MAP_OK )
		{
			FERROR("Cannot push data into hashmap %s\n", value );
			FFree( bkey ); 
			FFree( value );
			return -2;
		}
		else
		{
 			
		}
	}else if( value != NULL )
	{
		FFree( value );
	}
	return 0;
}*/

/**
 * Sets char *data on http structure (no copy, reference!)
 *
 * @param http http request
 * @param data pointer to data which will represent http content
 * @param length data length
 */

void HttpSetContent( Http* http, char* data, unsigned int length )
{
	http->http_Content = data;
	http->http_SizeOfContent = length;
	//DEBUG( "Setting content length! %ld\n", (unsigned long int )length );
	HttpAddHeader( http, HTTP_HEADER_CONTENT_LENGTH, Httpsprintf( "%ld", (unsigned long int )http->http_SizeOfContent ) );
}

/**
 * Adds text content to http (real copy, no reference!)
 *
 * @param http http request
 * @param content data which will represent Http content
 */

void HttpAddTextContent( Http* http, char* content )
{
	http->http_SizeOfContent = strlen( content )+1;
	http->http_Content = StringDuplicateN( content, http->http_SizeOfContent );
	http->http_SizeOfContent--;
	//http->sizeOfContent = strlen( content );
	HttpAddHeader( http, HTTP_HEADER_CONTENT_LENGTH, Httpsprintf( "%ld", (unsigned long int)http->http_SizeOfContent ) );
}

/**
 * build Http request string from Http request
 *
 * @param http http request
 * @return header as string
 */

#define HTTP_MAX_ELEMENTS 512

char *HttpBuild( Http* http )
{
	char *strings[ HTTP_MAX_ELEMENTS ];
	int stringsSize[ HTTP_MAX_ELEMENTS ];
	int stringPos = 0;

	// TODO: This is a nasty hack and should be fixed!
	HttpAddHeader( http, HTTP_HEADER_CONTROL_ALLOW_ORIGIN, StringDuplicateN( "*", 1 ) ); 
	
	int rrlen = strlen( http->http_ResponseReason );
	int i = 0;
	int tmpl = 512 + rrlen;
	
	char *tmpdat = FCalloc( tmpl, sizeof( char ) );
	if( tmpdat != NULL )
	{
		snprintf( tmpdat , tmpl, "HTTP/%u.%u %u %s\r\n", http->http_VersionMajor, http->http_VersionMinor, http->http_ResponseCode, http->http_ResponseReason );
		strings[ stringPos++ ] = tmpdat;

		// Add all the custom headers
		int iterator = 0;
		i = 0;
	
		if( http->http_ResponseHeadersRelease == TRUE )
		{
			for( i = 0 ; i < HTTP_HEADER_END ; i++ )
			{
				if( http->http_RespHeaders[ i ] != NULL )
				{
					char *tmp = FCalloc( 512, sizeof( char ) );
					if( tmp != NULL )
					{
						snprintf( tmp, 512, "%s: %s\r\n", HEADERS[ i ], http->http_RespHeaders[ i ] );
						strings[ stringPos++ ] = tmp;
						//INFO("ADDDDDDDDDDDD %s   AND FREE %s\n", tmp, http->http_RespHeaders[ i ] );
						if( i != HTTP_HEADER_X_FRAME_OPTIONS )
						{
							FFree( http->http_RespHeaders[ i ] );
							http->http_RespHeaders[ i ] = NULL;
						}
					}
					else
					{
						FERROR("respheader = NULL\n");
						FFree( tmp );
					}
				}
			}
		}
		else
		{
			for( i = 0; i < HTTP_HEADER_END; i++ )
			{
				if( http->http_RespHeaders[ i ] != NULL )
				{
					char *tmp = FCalloc( 512, sizeof( char ) );
					if( tmp != NULL )
					{
						snprintf( tmp, 512, "%s: %s\r\n", HEADERS[ i ], http->http_RespHeaders[ i ] );
						strings[ stringPos++ ] = tmp;
					}
					else
					{
						FERROR("respheader = NULL\n");
						FFree( tmp );
					}
				}
			}
		}

		strings[ stringPos++ ] = StringDuplicateN( "\r\n", 2 );
	}
	else
	{
		FERROR("HTTPBuild: Cannot allocate memory\n");
	}

	// Find the total size of the response
	FLONG size = 0;
	
	if( http->http_Stream == FALSE )
	{
		size += http->http_SizeOfContent ? http->http_SizeOfContent : 0 ;
	}
	
	for( i = 0; i < stringPos; i++ )
	{
		stringsSize[ i ] = strlen( strings[ i ] );
		size += stringsSize[ i ];
	}

	// Concat all the strings into one mega reply!!
	char* response = FCalloc( (size + 1), sizeof( char ) );
	char* ptr = response;
	
	for( i = 0; i < stringPos; i++ )
	{
		memcpy( ptr, strings[ i ], stringsSize[ i ] );
		ptr += stringsSize[ i ];
		FFree( strings[ i ] );
	}

	if( http->http_Stream == FALSE && http->http_Content )
	{
		memcpy( response + ( size - http->http_SizeOfContent ), http->http_Content, http->http_SizeOfContent );
	}
	
	// Old response is gone
	if( http->http_Response )
	{
		FFree( http->http_Response );
	}
		
	// Store the response pointer, so that we can free it later
	http->http_Response = response;
	http->http_ResponseLength = size;

	return response;
}

/**
 * build Http header from Http request
 *
 * @param http http request
 * @return header as string
 */

char *HttpBuildHeader( Http* http )
{
	char *strings[ HTTP_MAX_ELEMENTS ];
	int stringsSize[ HTTP_MAX_ELEMENTS ];
	int stringPos = 0;
	int i = 0;

	// TODO: This is a nasty hack and should be fixed!
	HttpAddHeader( http, HTTP_HEADER_CONTROL_ALLOW_ORIGIN, StringDuplicateN( "*", 1 ) ); 
	
	int rrlen = strlen( http->http_ResponseReason );
	char *tmpdat = FCalloc( 512 + rrlen, sizeof( char ) );
	if( tmpdat != NULL )
	{
		snprintf( tmpdat , rrlen, "HTTP/%u.%u %u %s\r\n", http->http_VersionMajor, http->http_VersionMinor, http->http_ResponseCode, http->http_ResponseReason );
		strings[ stringPos++ ] = tmpdat;

		// Add all the custom headers
		int iterator = 0;
	
		for( i = 0; i < HTTP_HEADER_END ; i++ )
		{
			if( http->http_RespHeaders[ i ] != NULL )
			{
				char *tmp = FCalloc( 512, sizeof( char ) );
				if( tmp != NULL )
				{
					snprintf( tmp, 512, "%s: %s\r\n", HEADERS[ i ], http->http_RespHeaders[ i ] );
					strings[ stringPos++ ] = tmp;
				
					FFree( http->http_RespHeaders[ i ] );
					http->http_RespHeaders[ i ] = NULL;
				}
				else
				{
					FERROR("respheader = NULL\n");
					FFree( tmp );
				}
			}
		}

		strings[ stringPos++ ] = StringDuplicateN( "\r\n", 2 );
	}
	else
	{
		FERROR("Cannot allocate memory\n");
	}

	// Find the total size of the response
	int size = 0;
	
	for( i = 0; i < stringPos; i++ )
	{
		stringsSize[ i ] = strlen( strings[ i ] );
		size += stringsSize[ i ];
	}

	// Concat all the strings into one mega reply!!
	char* response = FCalloc( (size + 1), sizeof( char ) );
	char* ptr = response;
	
	for( i = 0; i < stringPos; i++ )
	{
		memcpy( ptr, strings[ i ], stringsSize[ i ] );
		ptr += stringsSize[ i ];
		FFree( strings[ i ] );
	}
	
	// Old response is gone
	if( http->http_Response )
	{
		FFree( http->http_Response );
	}
		
	// Store the response pointer, so that we can free it later
	http->http_Response = response;
	http->http_ResponseLength = size;

	return response;
}

/**
 * write Http request to socket and release it
 *
 * @param http http request
 * @param sock pointer to socket
 */

void HttpWriteAndFree( Http* http, Socket *sock )
{
	if( http == NULL )
	{
		FERROR("Http call was empty\n");
		return;
	}
	
	if( sock == NULL )
	{
		FERROR("[HttpWriteAndFree] HTTP WRITE sock is null\n");
		HttpFree( http );
		return;
	}
	
	//DEBUG("HTTP AND FREE\n");
	
	if( http->http_WriteOnlyContent == TRUE )
	{
		SocketWrite( sock, http->http_Content, http->http_SizeOfContent );
	}
	else
	{
		if( http->http_Stream == FALSE )
		{
			if( HttpBuild( http ) != NULL )
			{
				// Write to the socket!
				SocketWrite( sock, http->http_Response, http->http_ResponseLength );
			}
			else
			{
				HttpFree( http );
				return;
			}
		}
	}
	
	HttpFree( http );
}

/**
 * write Http request to socket
 *
 * @param http http request
 * @param sock pointer to socket
 */

void HttpWrite( Http* http, Socket *sock )
{
	FLONG ret = 0;
	if( http == NULL )
	{
		return;
	}
	
	if( sock == NULL )
	{
		FERROR("[HttpWrite] HTTP WRITE sock is null\n");
		return;
	}

	if( http->http_RequestSource == HTTP_SOURCE_FC )
	{
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
			{ ID_FRID, (FULONG) http->http_ResponseID , MSG_INTEGER_VALUE },
			{ ID_RESP, (FULONG)0, (FULONG)0 }
		};
		
		ret = SocketWrite( sock, (char *) tags, (FLONG)sizeof(tags) );
	}
	else
	{
		HttpBuild( http );
		
		if( http->http_WriteOnlyContent == TRUE )
		{
			DEBUG("only content\n");
			ret = SocketWrite( sock, http->http_Content, http->http_SizeOfContent );
		}
		else
		{
			DEBUG("response\n");
			ret = SocketWrite( sock, http->http_Response, http->http_ResponseLength );
		}
	}

	DEBUG("HttpWrite, wrote: %ld\n", ret );
}

// ---------------------------------------------------------------------------------------------------------------------
//
// Testing 
//

/**
 * assert if value is not NULL
 *
 * @param val value which will be checked
 * @param field field name
 */

void HttpAssertNotNullPtr( void* val, const char* field )
{
	if( val == NULL )
	{
		printf( "Failed: Field \"%s\" is NULL, but shouldn't be.\n", field );
	}
}

/**
 * assert NULL pointer
 *
 * @param val value which will be checked
 * @param field field name
 */

void HttpAssertNullPtr( void* val, const char* field )
{
	if( val != NULL )
	{
		printf( "Failed: Field \"%s\" is not NULL. Is 0x%.8X.\n", field, *( unsigned int *)val );
	}
}

/**
 * assert int value
 *
 * @param value int value
 * @param expected int value
 * @param field field name
 */

void HttpAssertIntValue( int value, int expected, const char* field )
{
	if( value != expected )
	{
		printf( "Failed: Field \"%s\" is not 0x%.8X. Is %.8X.\n", field, expected, value );
	}
}

/**
 * assert unsigned int value
 *
 * @param value unsigned int value
 * @param expected unsigned int value
 * @param field field name
 */

void HttpAssertUnsignedIntValue( unsigned int value, unsigned int expected, const char* field )
{
	if( value != expected )
	{
		printf( "Failed: Field \"%s\" is not 0x%.8X. Is %.8X.\n", field, expected, value );
	}
}

/**
 * assert string
 *
 * @param value string value
 * @param expected expected string value
 * @param field field name
 */

void HttpAssertStr( char* value, const char* expected, const char* field )
{
	if( value == NULL )
	{
		printf( "Failed: Field \"%s\" is NULL, not \"%s\".\n", field, expected );
	}
	else if( strcmp( value, expected ) != 0 )
	{
		printf( "Failed: Field \"%s\" is not \"%s\". Is \"%s\".\n", field, expected, value );
	}
}

/**
 * Get POST parameter
 *
 * @param request pointer to Http from which parameter will be taken
 * @param param variable name
 * @return pointer to HashMapElement which contain parameter or NULL
 */

HashmapElement* HttpGetPOSTParameter( Http *request,  char* param)
{
	return HashmapGet( request->http_ParsedPostContent, param );
}

