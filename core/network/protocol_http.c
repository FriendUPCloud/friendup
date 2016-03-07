/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#include <stdio.h>
#include <string.h>
#include <time.h>
#include "core/friend_core.h"
#include "core/library.h"

#include "util/string.h"
#include "util/murmurhash3.h"

#include "network/uri.h"
#include "network/http.h"
#include "network/mime.h"
#include "network/websocket.h"
#include "network/protocol_http.h"

#include <system/systembase.h>
#include <network/file.h>
#include <system/systembase.h>
#include <system/cache/cache_manager.h>
#include <util/tagitem.h>
#include <util/list_string.h>
#include <network/protocol_webdav.h>

#define HTTP_REQUEST_TIMEOUT 2 * 60

extern SystemBase *SLIB;

/* 
	TODO: This should be moved
	It is to help us with fallback PHP support
*/
inline ListString *RunPHPScript( const char *command )
{
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		ERROR("Cannot open pipe\n");
		return NULL;
	}
	
	//char *buffer = NULL;
	char *temp = NULL;
	char *result = NULL;
	char *gptr = NULL;
	ULONG size = 0;
	ULONG res = 0;
	
	ListString *data = ListStringNew();

#define PHP_READ_SIZE 131072
	char buf[ PHP_READ_SIZE ]; memset( buf, '\0', PHP_READ_SIZE );
	
	while( !feof( pipe ) )
	{
		// Make a new buffer and read
		size = fread( buf, sizeof(char), PHP_READ_SIZE, pipe );
		
		if( size > 0 )
		{
			ListStringAdd( data, buf, size );
			
			// This is how the total size is now
			res += size;
		}
	}
	ListStringJoin( data );		
	
	// Free buffer if it's there
	pclose( pipe );
	
	return data;
}

//
// Read file
//
// we assume that mime is not neccessary for many files in one

inline int ReadServerFile( Uri *uri, char *locpath, BufString *dstbs, int *result )
{
	Path *base = PathNew( "resources" );
	
	DEBUG("ReadServerFile path %s\n", locpath );
	Path *convPath = PathNew( locpath );
	if( convPath ) PathResolve( convPath ); 
	
	Path* completePath = PathJoin( base, convPath );
	BOOL freeFile = FALSE;
	
	DEBUG("Read file %s\n", completePath->raw );
					
	LocFile* file = NULL;
	if( pthread_mutex_lock( &SLIB->mutex ) == 0 )
	{
		file = CacheManagerFileGet( SLIB->cm, completePath->raw );
		if( file == NULL )
		{
			file = LocFileNew( completePath->raw, FILE_READ_NOW | FILE_CACHEABLE );
			if( file != NULL )
			{
				if( CacheManagerFilePut( SLIB->cm, file ) != 0 )
				{
					freeFile = TRUE;
				}
			}
		}
		pthread_mutex_unlock( &SLIB->mutex );
	}

	// Send reply
	if( file != NULL )
	{
		if(  file->buffer == NULL )
		{
			ERROR("File is empty %s\n", completePath->raw );
		}
		
		DEBUG("File readed %d\n", file->bufferSize );
		
		// TODO: This shouldn't be needed by the way
		//       Make method to expand buffer size
		BufStringAddSize( dstbs, file->buffer, file->bufferSize );
		BufStringAdd( dstbs, "\n");

		if( freeFile == TRUE )
		{
			LocFileFree( file );
		}
		DEBUG("File readed return 200\n");
		
		*result = 200;
	}
	else
	{
		DEBUG( "[ProtocolHttp] Going ahead with %s.\n", completePath->parts ? completePath->parts[0] : "No path part.." );
		
		// Try to fall back on module
		// TODO: Make this behaviour configurable
		char command[255];
		sprintf( command, "php \"php/catch_all.php\" \"%s\";", locpath ); 
		DEBUG( "[ProtocolHttp] Executing %s\n", command );
		int phpRun = FALSE;
		ListString *bs = RunPHPScript( command );
		if( bs )
		{
			if( bs->ls_Size > 0 )
			{
				BufStringAddSize( dstbs, bs->ls_Data, bs->ls_Size );
				BufStringAdd( dstbs, "\n");
			}
			
			phpRun = TRUE;
			*result = 200;

			ListStringDelete( bs );
		}
		
		if( !phpRun )
		{
			DEBUG("File do not exist\n");

			*result = 404;
		}
	}
	PathFree( base );
	PathFree( completePath );
	PathFree( convPath );
	
	return 0;
}

//
//	Protocol callback function
//

extern inline Http *ProtocolHttp( Socket* sock, char* data, unsigned int length )
{
	Http *response = NULL;
	DEBUG("HTTP Callback called\n");
	
	if( length <= 0 )
	{
		DEBUG("RESULT<0 http400\n");
		
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicateN( "close", 5 ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_400_BAD_REQUEST,  tags );
	
		//HttpWriteAndFree( response );
	}
	
	// Get the current request we're working on, or start a new one
	Http* request = (Http*)sock->data;
	if( !request )
	{
		request = HttpNew( sock );
		request->timestamp = time( NULL );
		sock->data = (void*)request;
	}
	
	//DEBUG("Checking timeout, data %s\n", data );

	//DEBUG("time %ld\nreqtimestamp %ld\nreqtimestamp %ld\n",
	//	  time( NULL ), request->timestamp, HTTP_REQUEST_TIMEOUT );
	// Timeout
	
	if( time( NULL ) > request->timestamp + HTTP_REQUEST_TIMEOUT )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/plain" ) },
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_408_REQUEST_TIME_OUT,  tags );
		
		HttpAddTextContent( response, "408 Request Timeout\n" );
		//HttpWriteAndFree( response );
		HttpFreeRequest( request );
		sock->data = NULL;
		DEBUG("HTTP TIMER\n");
		return response;
	}
	

	// Continue parsing the request
	int result = HttpParsePartialRequest( request, data, length );
	
	// Protocol error
	if( result < 0 )
	{
		DEBUG("RESULT<0 http400\n");
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_400_BAD_REQUEST,  tags );
	
		//HttpWriteAndFree( response );
	}
	// Request not fully parsed yet. Return and wait for more data
	else if( result == -1 )
	{
		DEBUG( " <- (%d): Waiting for more data\n", sock->fd );
		HttpFreeRequest( request );
		return response;
	}
	// Request parsed without errors!
	else if( result == 1 )
	{
		Uri* uri = request->uri;
		Path* path = NULL;
		if( uri->path->raw )
		{
			int nlen = 0;
			for( ; ; nlen++ )
			{
				if( !uri->path->raw[nlen] )
				{
					break;
				}
			}
			DEBUG("Want to parse path: %s (%d)\n", uri->path->raw, nlen );
			path = PathNew( uri->path->raw );
			if( path ) PathResolve( path );  // Resolve checks for "../"'s, and removes as many as it can.
		}
		
		// Disallow proxy requests
		if( uri && ( uri->scheme || uri->authority ) )
		{
			struct TagItem tags[] = {
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			response = HttpNewSimple( HTTP_403_FORBIDDEN,  tags );
	
			result = 403;
		}
		
		//
		// WEBDAV
		//
		
		else if( strcmp( "webdav", path->parts[ 0 ] ) == 0 ) //if( (request->h_ContentType == HTTP_CONTENT_TYPE_APPLICATION_XML || request->h_ContentType == HTTP_CONTENT_TYPE_TEXT_XML ) &&
		{
			response = HandleWebDav( request, request->content, request->sizeOfContent );
			
			result = 200;
		}

		//
		// Cross-domain requests uses a pre-flight OPTIONS call
		//
		
		else if( !request->errorCode && request->method && strcmp( request->method, "OPTIONS" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTROL_ALLOW_ORIGIN, (ULONG)StringDuplicateN( "*", 1 ) },
				{ HTTP_HEADER_CONTROL_ALLOW_HEADERS, (ULONG)StringDuplicateN( "Origin, X-Requested-With, Content-Type, Accept, Method", 54 ) },
				{ HTTP_HEADER_CONTROL_ALLOW_METHODS,  (ULONG)StringDuplicateN( "GET, POST, OPTIONS", 18 ) },
				{ HTTP_HEADER_CONNECTION, (ULONG)StringDuplicateN( "close", 5 ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("Response != NULL\n");
			response = HttpNewSimple( HTTP_200_OK,  tags );

			result = 200;
		}		
		// Check for connection upgrade
		else if( !request->errorCode && HttpHeaderContains( request, "connection", "Upgrade", false ) )
		{
			struct TagItem tags[] = {
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			response = HttpNewSimple(  HTTP_400_BAD_REQUEST, tags );
	
		}
		
		else
		{
			
			
			if( !path || !path->resolved ) // If it cannot remove all, path->resolved == false.
			{
				DEBUG( "We have no path..\n" );
				struct TagItem tags[] = {
					{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
					{TAG_DONE, TAG_DONE}
				};
		
				response = HttpNewSimple( HTTP_403_FORBIDDEN,  tags );
	
				result = 403;
			}
			else
			{
				DEBUG( "We got through. %s\n", path->parts[ 0 ] );
				
				//
				// we must check if thats WEBDAV call and provide data
				//
				/*
				if( strcmp( "webdav", path->parts[ 0 ] ) == 0 )
				{
					response = HandleWebDav( request, request->content, request->sizeOfContent );
			
					result = 200;
				}*/
				//
				//
				//
				//else
				{
					if( path->size >= 2 && StringCheckExtension( path->parts[0], "library" ) == 0 )
					{
						// system.library is main library and should be use for most things
						// we open it and close in main
						//DEBUG("systemlib found\n");
						DEBUG("Calling systemlib\n");
					
						if( strcmp( path->parts[ 0 ], "system.library" ) == 0 )
						{
							DEBUG( "%s\n", path->parts[1] );
							response = SLIB->SysWebRequest( SLIB, &(path->parts[1]), request );
						
							if( response == NULL )
							{
								struct TagItem tags[] = {
									{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
									{TAG_DONE, TAG_DONE}
								};	
		
								response = HttpNewSimple(  HTTP_500_INTERNAL_SERVER_ERROR,  tags );
	
								result = 500;
							}
						}
						else
						{
							FriendCoreInstance_t *fci = (FriendCoreInstance_t *) sock->s_Data;
							Library* lib = FriendCoreGetLibrary( fci, path->parts[0], 1 );
							if( lib && lib->WebRequest )
							{
								response =(Http *) lib->WebRequest( lib, path->parts[1], request );
								if( response == NULL )
								{
									struct TagItem tags[] = {
										{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
										{TAG_DONE, TAG_DONE}
									};	
		
									response = HttpNewSimple( HTTP_500_INTERNAL_SERVER_ERROR,  tags );
	
									result = 500;
								}
							}
							else
							{
								struct TagItem tags[] = {
									{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
									{TAG_DONE, TAG_DONE}
								};	
		
								response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
								result = 404;
							}
						}
				//	}	// else "webdav"
					}
					// We're calling on a static file.
					else
					{
						// Read the file
						
						unsigned int i;
						int pos = -1;
						
						for( i=0 ; i < path->rawSize ; i++ )
						{
							if( path->raw[ i ] == ';' )
							{
								pos = i;
								break;
							}
						}
						
						DEBUG("Found ; in position %d\n",  pos );
						
#define MAX_FILES_TO_LOAD 100
						
						if( pos > 0 )
						{
							char *multipath = NULL;
							char *pathTable[ MAX_FILES_TO_LOAD ];
							
							memset( pathTable, 0, MAX_FILES_TO_LOAD );
							int pathSize = path->rawSize + 1;
							
							// split path 
							
							if( ( multipath = FCalloc( pathSize, sizeof( char ) ) ) != NULL )
							{
								memcpy( multipath, path->raw, pathSize );
								DEBUG("Multiplepath\n");
								
								int entry = 0;
								pathTable[ entry ] = multipath;
								
								for( i=0 ; i < pathSize ; i++ )
								{
									if( multipath[ i ] == ';' )
									{
										multipath[ i ] = 0;
										pathTable[ ++entry ] = &(multipath[ i+1 ] );
									}
								}
								
								DEBUG("Found entries %d\n", entry );
								
								BufString *bs = BufStringNewSize( 1000 );
								if( bs != NULL )
								{
									int resError = 404;
									
									for( i = 0 ; i < entry + 1 ; i++ )
									{
										INFO("FIND file %s\n", pathTable[ i ] );
									
										int err = ReadServerFile( request->uri, pathTable[ i ], bs, &result );
									
										DEBUG("Read file result %d\n", result );
									
										if( result == 200 )
										{
											resError = 200;
										}
									}
								
									DEBUG("ERROR: %d\n", resError );
								
									if( resError == 200 )
									{
										struct TagItem tags[] = {
											{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate("text/html") },
											{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
											{TAG_DONE, TAG_DONE}
										};
		
										response = HttpNewSimple( HTTP_200_OK, tags );

										HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
						
										bs->bs_Buffer = NULL;
									
										// write here and set data to NULL!!!!!
										// retusn response
										HttpWrite( response, sock );
									
										//BufStringDelete( bs );
									
										result = 200;
									}
									// error, cannot open any file
									else
									{
										ERROR("File do not exist\n");
							
										struct TagItem tags[] = {
											{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
											{TAG_DONE, TAG_DONE}
										};	
		
										response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
										result = 404;
									}
								
									//bs->bs_Buffer = NULL;
									BufStringDelete( bs );
								}
								DEBUG("Before multipath free\n");
								FFree( multipath );
							}

						}
						else		// only one file
						{
							Path *base = PathNew( "resources" );
							Path* completePath = PathJoin( base, path );
							BOOL freeFile = FALSE;
							
							LocFile* file = NULL;
							if( pthread_mutex_lock( &SLIB->mutex ) == 0 )
							{
								file = CacheManagerFileGet( SLIB->cm, completePath->raw );
								if( file == NULL )
								{
									file = LocFileNew( completePath->raw, FILE_READ_NOW | FILE_CACHEABLE );
									if( file != NULL )
									{
										if( CacheManagerFilePut( SLIB->cm, file ) != 0 )
										{
											freeFile = TRUE;
										}
									}
								}
								pthread_mutex_unlock( &SLIB->mutex );
							}

							// Send reply
							if( file != NULL )
							{
								char* mime = NULL;
						
								if(  file->buffer == NULL )
								{
									ERROR("File is empty %s\n", completePath->raw );
								}

								if( completePath->extension )
								{
									mime = StringDuplicate( MimeFromExtension( completePath->extension ) );
								}
								else
								{
									mime = StringDuplicate( "text/plain" );
								}
						
								struct TagItem tags[] = {
									{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  mime },
									{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
									{TAG_DONE, TAG_DONE}
								};
		
								response = HttpNewSimple( HTTP_200_OK, tags );

						
								//DEBUG("Before returning data\n");
						
								HttpSetContent( response, file->buffer, file->bufferSize );
						
								// write here and set data to NULL!!!!!
								// retusn response
								HttpWrite( response, sock );
								result = 200;
						
								INFO("--------------------------------------------------------------%d\n", freeFile );
								if( freeFile == TRUE )
								{
									//ERROR("\n\n\n\nFREEEEEEFILE\n");
									LocFileFree( file );
								}
								response->content = NULL;
								response->sizeOfContent = 0;
						
								response->h_WriteType = FREE_ONLY;
							}
							else
							{
								DEBUG( "[ProtocolHttp] Going ahead with %s.\n", path->parts ? path->parts[0] : "No path part.." );
						
								// Try to fall back on module
								// TODO: Make this behaviour configurable
								char command[255];
								sprintf( command, "php \"php/catch_all.php\" \"%s\";", uri->path->raw ); 
								DEBUG( "[ProtocolHttp] Executing %s\n", command );
								int phpRun = FALSE;
								ListString *bs = RunPHPScript( command );
								if( bs )
								{
									if( bs->ls_Size > 0 )
									{
										struct TagItem tags[] = {
											{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
											{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
											{TAG_DONE, TAG_DONE}
										};
		
										response = HttpNewSimple(  HTTP_200_OK,  tags );
						
										HttpSetContent( response, bs->ls_Data, bs->ls_Size );
								
										result = 200;
										phpRun = TRUE;
										bs->ls_Data = NULL;
									}
									ListStringDelete( bs );
								}
						
								if( !phpRun )
								{
									DEBUG("File do not exist\n");
							
									struct TagItem tags[] = {
										{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
										{TAG_DONE, TAG_DONE}
									};	
		
									response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
									result = 404;
								}
							}
							PathFree( base );
							PathFree( completePath );
						}		// one-many files read
					
						DEBUG("Files delivered\n");
					}
				}
			} // else WEBDAV
			
		}

		DEBUG("free requests\n");
		// SPRING CLEANING!!! TIME TO CLEAN THE CASTLE!!! :) :) :)
		HttpFreeRequest( request );
		
		if( result != 101 )
		{
			sock->data = NULL;
		}
		PathFree( path );
		DEBUG("Return response\n");
		
		return response;
	}
	// Winter cleaning
	HttpFreeRequest( request );
	DEBUG("HTTP parsed, returning response\n");
	return response;
}

/*

Arguments as query:
GET /<lib>/<command>?<args>

Arguments as JSON:
POST /<lib>/<command>
{<args>}

Request as DOS:
POST /core/cmd
<command>

--------------------------------------------------------------

GET /core/read?path=Home:something
Return: {'type':'file','content':<file>}

POST /core/read
{'path':'Home:something'}
Return: {'type':'directory','content':<dirlist>}

POST /core/cmd
read Home:something
Return: {'type':'directory','content':<dirlist>}

--------------------------------------------------------------

GET /core/read?path=Home:something/picture.png
Return: {'type':'file','content':<file>}

POST /core/read
{'path':'Home:something/picture.png'}
Return: {'type':'file','content':<file>}

POST /core/cmd
read Home:something/picture.png
Return: {'type':'file','content':<file>}

--------------------------------------------------------------
Other examples:
/rdp/connect?bookmark=win
/rdp/connect?host=192.168.0.66&user=Administrator&password=passw0rd

/
/web/<...>


Order:
First, poll virtual hosts list (has config w/wo lib support)
Second, poll libraries

Definition:
commands[
	[callback, 'name', 'arg_name_1', 'arg_name_2' ... , 'arg_name_n'],
	[callback, 'name', 'arg_name_1']
];

[RdpCommandHandler, 'connect', 'host', 'username', 'password'];
/rdp/rdp

By query:
GET /rdp/connect?host=192.168.0.66&user=Administrator&password=passw0rd

By JSON:
POST /rdp/connect
{'host':'192.168.0.66','user':'Administrator','password':'passw0rd'}

By terminal:
connect somehost.com Administrator passw0rd
rdp.connect somehost.com Administrator passw0rd

By Friendlish:
<TODO>

*/
