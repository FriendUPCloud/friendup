/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 * Image Library Web code
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include <stdio.h>
#include <limits.h>
#include <stdlib.h>
#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include "imagelibrary.h"
#include <util/buffered_string.h>
#include <ctype.h>
#include <system/systembase.h>
#include <system/fsys/fsys_activity.h>

//
// Handle webrequest calls
//

Http* WebRequestImage( struct ImageLibrary *l, UserSession *usr, char **urlpath, Http* request, Socket* sock )
{
	Http* response = NULL;
	
	DEBUG("[ImageLibrary] first command: %s\n", urlpath[ 0 ] );
	
	if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, \
			"resize - resize image on filesystem\n \
			" );			// out of memory/user not found
		
		//
		// resize image on filesystem
		//
		
	}
	else if( strcmp( urlpath[ 0 ], "resize" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *path = NULL, *oPath = NULL;
		File *pathRoot = NULL;
		char *toPath = NULL, *otoPath = NULL;
		File *toRoot = NULL;
		int width = 0, height = 0;
		char *error = NULL;
		
		HashmapElement *tst = HashmapGet( request->http_ParsedPostContent, "path" );
		if( tst == NULL ) tst = HashmapGet( request->http_Query, "path" );
		if( tst != NULL  )
		{
			path = UrlDecodeToMem(  (char *) tst->hme_Data );
			pathRoot = IMGGetRootDeviceByPath( l, usr->us_User, &oPath, path );
			
			DEBUG("[ImageLibrary] Found PATH parameter %s root %s\n", path, oPath );
		}
		
		tst = HashmapGet( request->http_ParsedPostContent, "to" );
		if( tst == NULL ) tst = HashmapGet( request->http_Query, "to" );
		if( tst != NULL  )
		{
			toPath = UrlDecodeToMem(  (char *) tst->hme_Data );
			toRoot = IMGGetRootDeviceByPath( l, usr->us_User, &otoPath, toPath );
			
			//DEBUG("[ImageLibrary] Found DESTINATION PATH parameter %s root %s\n", toPath, toRoot );
		}
		
		tst = HashmapGet( request->http_ParsedPostContent, "width" );
		if( tst == NULL ) tst = HashmapGet( request->http_Query, "width" );
		if( tst != NULL  )
		{
			width = atoi(  (char *) tst->hme_Data );
		}
		
		tst = HashmapGet( request->http_ParsedPostContent, "height" );
		if( tst == NULL ) tst = HashmapGet( request->http_Query, "height" );
		if( tst != NULL  )
		{
			height = atoi(  (char *) tst->hme_Data );
		}
		
		//
		//
		//
		
		if( path != NULL || width <= 0 || height <= 0 )
		{
			gdImagePtr image = l->ImageRead( l, pathRoot, path );
			if( image != NULL )
			{
				int err = FResizeImage( l, &image, width, height );
				if( err == 0 )
				{
					if( toPath != NULL )
					{
						if( l->ImageWrite( l, toRoot, image, toPath ) == 0 )
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Image Converted and stored\"}";
						}
						else
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot save file\"}";
						};
					}
					else
					{
						if( l->ImageWrite( l, pathRoot, image, path ) == 0 )
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Image Converted and stored\"}";
						}
						else
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot save file\"}";
						};
					}
				}
				else
				{
					FERROR("Cannot resize image\n");
					error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot resize image\"}";
				}
			}
			else
			{
				FERROR("Cannot read image from path %s\n", path );
				error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot read image\"}";
			}
		}
		else
		{
			FERROR("'path' parameter was not passed or width|height <= 0 \n");
			error = "ok<!--separate-->{ \"ErrorMessage\": \"'path' parameter was not passed or width|height <= 0\"}";
		}
		
		if( toPath != NULL )
		{
			free( toPath );
		}
		
		if( path != NULL )
		{
			free( path );
		}
		
		if( error != NULL )
		{
			HttpAddTextContent( response, error );
			//HttpWriteAndFree( response );
		}
	}
	else
	{
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
		//HttpWriteAndFree( response );
		return response;
	}
	return response;
}



