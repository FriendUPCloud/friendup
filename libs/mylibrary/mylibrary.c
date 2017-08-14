/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

/*

*/

#include <core/types.h>
#include <core/library.h>
#include <core/friend_core.h>
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>

//#include <libs/system/systemlibrary.h>
#include "../libs/system/systemlibrary.h"
#include "mylibrary.h"

#define LIB_NAME "mylibrary.library"
#define LIB_VERSION 0.1

/*********
 *
 * Main entry point for libraries.
 * The library should allocate and set up the resources
 * it needs, and return a pointer to a library structure.
 *
 * If it fails to initialize, it should return NULL.
 *
 */
void* libInit()
{
	EchoLibrary_t* lib;

	if( ( lib = calloc( sizeof( struct EchoLibrary ), 1 ) ) == NULL )
	{
		return NULL;
	}

	// All of these are /REQUIRED/!
	lib->l_Name = LIB_NAME;
	lib->l_Version = LIB_VERSION;
	lib->libClose = dlsym( lib->handle, "libClose" );
	lib->GetVersion = dlsym( lib->handle, "GetVersion" );

	// WebRequest is optional. Calls initiated externally will be sent to this function.
	lib->WebRequest = dlsym( lib->handle, "WebRequest" );

	return lib;
}

/*********
 *
 * Exit point for libraries.
 * free all resources that was previously allocated here, except
 * for the library structure; That is free'd by the caller.
 *
 */
void libClose( EchoLibrary_t* lib )
{
	// This simple library doesn't make any mess :)
}

/*********
 *
 * This should always return the current version of the library.
 * It's best to not modify this.
 * for the library structure; That is free'd by the caller.
 *
 */
double GetVersion()
{
	return LIB_VERSION;
}

/*********
 *
 * (NOTE: This section should be replaced with a protocol agnostic solution soon.)
 *
 * All requests to /mylibrary.library/<func>?<args> end up here.
 * <func> can be found in the func variable below.
 * <args> can be found in request->uri->query. It's a hashmap. (NOTE: This will change when we go away from using query strings, and instead use POST!)
 *
 * The library should write its output manually to sock, and return the HTTP response code to the caller.
 */
int WebRequest( char* func, Http_t* request, Socket_t* sock )
{
	// Someone is making a request to http://localhost:6502/mylibrary.library/testSomething

	// Note: The following strcmp can be replaced with a hash + call table if the complexity of the library
	//       becomes too much of a bottle neck. For now, we keep things simple.

	// Are we trying to call testSomething?
	if( strcmp( func, "testSomething" ) == 0 )
	{
		// Yep, BUT, this function isn't defined in C yet!
		// We do however have have a PHP prototype.
		// Let's call that instead.
		struct SystemLibrary* slib = (SystemLibrary*)FriendCoreGetLibrary( sock->instance, "system.library", 0.1 );
		char* phpResponse = slib->Run( slib, "php", "php/mylibrary.library/testSomething.php", request->uri->queryRaw );

		if( phpResponse )
		{
			// Write the response from PHP to the client
			Http_t* response = HttpNewSimple( 
				HTTP_200_OK, 4,
				"Content-Type", StringDuplicate( "text/plain" ),
				"Connection", StringDuplicate( "close" )
			);
			HttpAddTextContent( response, phpResponse );
			HttpWriteAndFree( response, sock );

			// The caller needs to know how we handled the request for logging purposes.
			return 200;
		}
	}

	// No. We're trying to call an unknown function.
	// Let's 404 it.
	Http404( sock );
	return 404;

}
