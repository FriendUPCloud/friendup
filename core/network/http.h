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
 *  Http structures and functions definitions
 *
 *  @author HT
 *  @date created 2015
 */

#ifndef __NETWORK_HTTP_H__
#define __NETWORK_HTTP_H__

//
//
//
#include <core/types.h>
#include <time.h>
#include <fcntl.h>
#include <errno.h>
#include "util/hashmap.h"
#include "util/list.h"
#include "network/uri.h"
#include "network/socket.h"
#include <util/tagitem.h>
#include <network/user_session_websocket.h>
#include "http_file.h"

#define DEFAULT_CONTENT_TYPE "text/html; charset=utf-8"

#ifndef DOXYGEN
#define HTTP_READ_BUFFER_DATA_SIZE 32768
#define HTTP_READ_BUFFER_DATA_SIZE_ALLOC 32768+32
#endif


//
// HEADERS
//

enum {
	HTTP_HEADER_CONTENT_TYPE = 1,
	HTTP_HEADER_CONNECTION,
	HTTP_HEADER_CONTROL_ALLOW_ORIGIN,
	HTTP_HEADER_CONTROL_ALLOW_HEADERS,
	HTTP_HEADER_CONTROL_ALLOW_METHODS,
	HTTP_HEADER_CONTENT_LENGTH,
	HTTP_HEADER_ACCEPT_RANGES,
	HTTP_HEADER_ALLOW,
	HTTP_HEADER_CACHE_CONTROL,
	HTTP_HEADER_DAV,
	HTTP_HEADER_AUTHORIZATION,
	HTTP_HEADER_WWW_AUTHENTICATE,
	HTTP_HEADER_CONTENT_DISPOSITION,
	HTTP_HEADER_USER_AGENT,
	HTTP_HEADER_HOST,
	HTTP_HEADER_ORIGIN,
	HTTP_HEADER_ACCEPT,
	HTTP_HEADER_METHOD,
	HTTP_HEADER_REFERER,
	HTTP_HEADER_ACCEPT_LANGUAGE,
	HTTP_HEADER_ACCEPT_ENCODING,
	HTTP_HEADER_LOCATION,
	HTTP_HEADER_DESTINATION,
	HTTP_HEADER_DEPTH,
	HTTP_HEADER_EXPECTED_CONTENT_LENGTH,
	HTTP_HEADER_RANGE,
	HTTP_HEADER_X_FRAME_OPTIONS,
	HTTP_HEADER_UPGRADE,
	HTTP_HEADER_END
};

static const char *HEADERS[] = {
	"empty",
	"content-type",
	"connection",
	"access-control-allow-origin",
	"access-control-allow-headers",
	"access-control-allow-methods",
	"content-length",
	"accept-ranges",
	"allow",
	"cache-control",
	"dav",
	"authorization",
	"www-authenticate",
	"content-disposition",
	"user-agent",
	"host",
	"origin",
	"accept",
	"method",
	"referer",
	"accept-language",
	"accept-encoding",
	"location",
	"destination",
	"x-expected-entity-length",
	"depth",
	"range",
	"x-frame-options",
	"upgrade"
};

//
//
//

#define HTTP_HEADER_MAX_SIZE 16384+16 // 16 KiB (16 from stefkos)
#define HTTP_ENTITY_MAX_SIZE 1048576 // 1 MiB
#define HTTP_ENABLE_DEBUG 1
#define HTTP_MAX_MEM_CONTENT_SIZE (INT_MAX/4)

#define HTTP_CONTENT_TEMP_NAME "/tmp/Friendup/FriendHTTP_CONTENT_XXXXXXXXXXXXXXXXXX"

#ifdef HTTP_ENABLE_DEBUG
#define HTTP_PRINT(x) printf( x " (%s:%d)\n", __FILE__, __LINE__ );
#define HTTP_PRINTF(x, ...) printf( x " (%s:%d)\n", __VA_ARGS__, __FILE__, __LINE__ );
#else
#define HTTP_PRINT(x)
#define HTTP_PRINTF(x, ...)
#endif

#define HTTP_100_CONTINUE                        100
#define HTTP_101_SWITCHING_PROTOCOLS             101
#define HTTP_102_PROCESSING                      102

#define HTTP_200_OK                              200
#define HTTP_201_CREATED                         201
#define HTTP_202_ACCEPTED                        202
#define HTTP_203_NON_AUTHORITATIVE_INFORMATION   203
#define HTTP_204_NO_CONTENT                      204
#define HTTP_205_RESET_CONTENT                   205
#define HTTP_206_PARTIAL_CONTENT                 206
#define HTTP_207_MULTI_STATUS                    207
#define HTTP_208_ALREADY_REPORTED                208
#define HTTP_225_IM_USED                         225

#define HTTP_300_MULTIPLE_CHOICES                300
#define HTTP_301_MOVED_PERMANENTLY               301
#define HTTP_302_FOUND                           302
#define HTTP_303_SEE_OTHER                       303
#define HTTP_304_NOT_MODIFIED                    304
#define HTTP_305_USE_PROXY                       305
#define HTTP_307_TEMPORARY_REDIRECT              307
#define HTTP_308_PERMANENT_REDIRECT              308

#define HTTP_400_BAD_REQUEST                     400
#define HTTP_401_UNAUTHORIZED                    401
#define HTTP_402_PAYMENT_REQUIRED                402
#define HTTP_403_FORBIDDEN                       403
#define HTTP_404_NOT_FOUND                       404
#define HTTP_405_METHOD_NOT_ALLOWED              405
#define HTTP_406_NOT_ACCEPTABLE                  406
#define HTTP_407_PROXY_AUTHENTICATION_REQUIRED   407
#define HTTP_408_REQUEST_TIME_OUT                408
#define HTTP_409_CONFLICT                        409
#define HTTP_410_GONE                            410
#define HTTP_411_LENGTH_REQUIRED                 411
#define HTTP_412_PRECONDITION_FAILED             412
#define HTTP_413_REQUEST_ENTITY_TOO_LARGE        413
#define HTTP_414_REQUEST_URI_TOO_LARGE           414
#define HTTP_415_UNSUPPORTED_MEDIA_TYPE          415
#define HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE 416
#define HTTP_417_EXPECTATION_FAILED              417
#define HTTP_418_IM_A_TEAPOT                     418
#define HTTP_422_UNPROCESSABLE_ENTITY            422
#define HTTP_423_LOCKED                          423
#define HTTP_424_FAILED_DEPENDENCY               424
#define HTTP_426_UPGRADE_REQUIRED                426
#define HTTP_428_PRECONDITION_FAILED             428
#define HTTP_429_TOO_MANY_REQUESTS               429
#define HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE 431
#define HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS   451

#define HTTP_500_INTERNAL_SERVER_ERROR           500
#define HTTP_501_NOT_IMPLEMENTED                 501
#define HTTP_502_BAD_GATEWAY                     502
#define HTTP_503_SERVICE_UNAVAILABLE             503
#define HTTP_504_GATEWAY_TIME_OUT                504
#define HTTP_505_HTTP_VERSION_NOT_SUPPORTED      505
#define HTTP_506_VARIANT_ALSO_NEGOTIATES         506
#define HTTP_507_INSUFFICIENT_STORAGE            507
#define HTTP_508_LOOP_DETECTED                   508
#define HTTP_510_NOT_EXTENDED                    510
#define HTTP_511_NETWORK_AUTHENTICATION_REQUIRED 511

// HTTP Specification:
// https://www.ietf.org/rfc/rfc2616.txt

/*
HTTP Example use:
*/
/*Http_t* request = HttpParseRequest( message, len );

if( !request->errorCode && request->queryMap )
{
	HashmapElement_t* action = HashmapGet( request->queryMap, "action" );
	if( action && action->data )
	{
		printf("[FMW] Action: %s\n", (char*)action->data );
		if( strcmp( action->data, "ping" ) == 0 )
		{
			Http_t* response = HttpNew();
			HttpAddCode( response, 200 );
			HttpAddHeader( response, "Content-Type", StringDuplicate( "application/json" ) );
			HttpAddHeader( response, "Connection", StringDuplicate( "close" ) );
			HttpAddTextContent( response, "{response:'pong'}\n" );
			HttpBuild( response );
			SDLNet_TCP_Send( client, (void*)response->response, response->responseLength );
			HttpFree( response );

			err = 0;
		}
	}
}

HttpFreeRequest( request );*/

/* HTTP requests above this thresholds are saved to temporary files
* and mmap'ed for later use. This conserves RAM during large
* file uploads. (TK-628)
*/
#define TUNABLE_LARGE_HTTP_REQUEST_SIZE (10*1024*1024) //10MB

//
// HTTP CONTENT TYPE
//

enum {
	HTTP_CONTENT_TYPE_DEFAULT = 0,
	HTTP_CONTENT_TYPE_MULTIPART,
	HTTP_CONTENT_TYPE_APPLICATION_XML,
	HTTP_CONTENT_TYPE_TEXT_XML,
	HTTP_CONTENT_TYPE_APPLICATION_JSON
};

//
//
//

enum {
	WRITE_AND_FREE = 0,
	FREE_ONLY
};

//
// Source
//

enum {
	HTTP_SOURCE_HTTP = 0,
	HTTP_SOURCE_WS,
	HTTP_SOURCE_HTTP_TO_WS,
	HTTP_SOURCE_FC,
	HTTP_SOURCE_EXTERNAL_SERVER
};

//
//
//

// HTTP Request structure
typedef struct Http
{
	// -----------------------------------------------------------------------------------------------------------------
	//
	// These fields only applies to requests.
	//
	// Raw null-terminated strings
	char				*http_Method;
	Uri					*http_Uri;
	char				*http_RawRequestPath;
	char				*http_Version;

	Hashmap				*http_Query;   // Hasmap of the query, for convinience (Is null when no query, or invalid key/value query)

	unsigned int		http_ErrorCode;  // If any of these are non-null, an error has occured and a fitting response should be generated
	unsigned int		http_ErrorLine;   // Useful for debugging, otherwise ignore

	Hashmap				*http_ParsedPostContent; // x-www-form-urlencoded

	// -----------------------------------------------------------------------------------------------------------------
	//
	// Fields for both requests and responses.
	//
	// HTTP x.x
	int					http_VersionMajor; // Pretty much always 1
	int					http_VersionMinor; // Also pretty much always 1 or 0

	// This is a blob (But most likely text)
	int					http_ContentFileHandle;
	char				*http_Content;
	FQUAD				http_SizeOfContent;
	char				http_TempContentFileName[ 128 ];
	
	Hashmap				*http_Headers; // Additional headers
	char				*http_RespHeaders[ HTTP_HEADER_END ]; // response header
	FBOOL				http_HeadersAlloc[ HTTP_HEADER_END ]; // memory was allocated?
	FBOOL				http_ResponseHeadersRelease;		// if response headers points to allocated memory, they should not be released
	int					http_RequestSource;			// depends who is calling response should go to the target
	time_t				http_Timestamp;  // Optional timestamp

	// -----------------------------------------------------------------------------------------------------------------
	//
	// These fields only applies to responses.
	//
	unsigned int		http_ResponseCode;
	char				*http_ResponseReason;

	// -----------------------------------------------------------------------------------------------------------------
	//
	// Do not write to these. They are "private"
	//
	char				*http_Response;
	FLONG				http_ResponseLength;

	FBOOL				http_PartialRequest;
	char				*http_PartialData;
	unsigned int		http_PartialDataIndex;
	FBOOL				http_ExpectBody;
	int					http_ExpectSize;
	FBOOL				http_GotHeader;
	FBOOL				http_GotBody;
	
	char				http_PartDivider[ 512 ];
	FBOOL				http_ContentType;
	FQUAD				http_ContentLength;
	FQUAD				http_ExpectedLength;
	FLONG				http_RangeMin, http_RangeMax;
	HttpFile			*http_FileList;
	
	FBOOL				http_Stream;			// stream
	UserSessionWebsocket *http_WSocket;				// websocket context, if provided data should be delivered here
	Socket				*http_Socket;		// socket,  if != NULL  data should be delivered here
	
	int					http_WriteType;
	
	FBOOL				http_WriteOnlyContent;		// set to TRUE if you want to stream content
	
	void				*http_ActiveSession;	// pointer to UserSession
	FULONG				http_ResponseID;		// number used to compare http calls (unique number)
	
	FILE				*http_ContentFile;		// http content in FILE
	void				*http_PIDThread;    // PIDThread
	void				*http_UserSession;  // user session
	void				*http_SB; // SystemBase
	
	FBOOL				*http_ShutdownPtr;		// pointer to quit flag
	char				http_UserActionInfo[ 512 ];
} Http;

//
//
//

int HttpParseHeader( Http* http, const char* request, FQUAD length );

//
// Create a generic HttpObject
//

Http* HttpNew( );

// Create a generic HttpObject, set the code and add headers
// vararg = "header1", "value1", "header2", "value2", ...
//Http_t* HttpNewSimple( unsigned int code, unsigned int numHeaders, ... );

Http* HttpNewSimple( unsigned int code, struct TagItem * );

Http* HttpNewSimpleBaseOnRequest( unsigned int code, Http *request, struct TagItem *tag );

#define HttpNewSimpleANOREQ( CODE, ... ) \
	({Http *ret; FULONG tags[] = { __VA_ARGS__ }; \
	ret = HttpNewSimple( CODE, (struct TagItem *)tags ); \
	ret; })

#define HttpNewSimpleA( CODE, request, ... ) \
	({Http *ret; FULONG tags[] = { __VA_ARGS__ }; \
	ret = HttpNewSimpleBaseOnRequest( CODE, request, (struct TagItem *)tags ); \
	ret; })
   
//
// Always returns an HttpObject element.
// Error fields are set on error.
//

Http* HttpParseRequest( const char* request, FQUAD length );

//
// Parse a request in chunks. Useful for data recived over the network
//

int HttpParsePartialRequest( Http* http, char* data, FQUAD length );

//
// Frees an HttpObject element (Only call this for HttpObjects returned from HttpParseRequest!!!)
//

void HttpFreeRequest( Http* http );

//
// Set the response code
//

void HttpSetCode( Http* http, unsigned int code );

//
// Add a response header
//

int HttpAddHeader(Http* http, int id, char* value );

// Shortcuts: --------------------------------------------------------------------------------------------------------------
//
// Get the raw header list
//

List* HttpGetHeaderList( Http* http, const char* name );

//
// Get a header field value from a list at the index, or NULL if there is no values at the given index
//

char* HttpGetHeader( Http* http, const char* name, unsigned int index );

//
// Get a header field value from table of headers, or NULL if there is no values at the given index
//

char* HttpGetHeaderFromTable( Http* http, int pos );

//
// TODO: Get a single header field value from the list, or NULL if there no values, or NULL is there is more than 1 value
// (Useful for failing when only 1 value is expected)
//

char* HttpGetSingleHeader( Http* http, const char* name );

//
// Get the number of values this header contains
//

unsigned int HttpNumHeader( Http* http, const char* name );

//
// Check if the request contains a header with the given value
//

FBOOL HttpHeaderContains( Http* http, const char* name, const char* value, FBOOL caseSensitive );

// --------------------------------------------------------------------------------------------------------------------

//
// Add a null-terminated text response (Content-Length is added automatically from strlen)
//

void HttpAddTextContent( Http* http, char* content );

//
// Set the content
//

void HttpSetContent( Http*, char* data, unsigned int length );

//
// Build the HTTP response
//

char* HttpBuild( Http* http );

//
// Frees a generic HttpObject (Caller is responsible for freeing other fields before calling this)
//

void HttpFree( Http* http );

//
//
//

HashmapElement *HttpGetPOSTParameter( Http *request,  char *param );

//
//
//

void HttpWriteAndFree( Http* http, Socket *sock );

//
//
//

void HttpWrite( Http* http, Socket *sock );

#endif // __NETWORK_HTTP_H__
