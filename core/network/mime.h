/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/


#ifndef __NETWORK_MIME_H__
#define __NETWORK_MIME_H__


#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <util/string.h>

//
// get MIME by filename extension
//

//#define CHECK_MIME( A, B, C, D )

static inline char *GetMIMEByFilename( char *fname )
{
	unsigned int flen = strlen( fname );
	
	// Need a proper extension
	// TODO: What about .ps (postscript) or others?
	if( flen < 4 ) return StringDuplicate( "application/octet-stream" );
	
	// Our variables!
	char *mime = calloc( 1, 16 );
	char *fallbackMime = NULL;
	unsigned int i = 0, j = 0;
	
	for( i = flen - 6 ; i < flen ; i++ )
	{
		mime[ j++ ] = toupper( fname[ i ] ); 
	}

	if( strstr( mime, ".PDF" ) )
		fallbackMime = StringDuplicate( "application/pdf" );
	else if( strstr( mime, ".WAV" ) )
		fallbackMime = StringDuplicate( "audio/wav" );
	else if( strstr( mime, ".MP3" ) )
		fallbackMime = StringDuplicate( "audio/mp3" );
	else if( strstr( mime, ".OGG" ) )
		fallbackMime = StringDuplicate( "audio/ogg" );
	else if( strstr( mime, ".OGV" ) )
		fallbackMime = StringDuplicate( "video/ogg" );
	else if( strstr( mime, ".JPG" ) )
		fallbackMime = StringDuplicate( "image/jpeg" );
	else if( strstr( mime, ".JPEG" ) )
		fallbackMime = StringDuplicate( "image/jpeg" );
	else if( strstr( mime, ".PNG" ) )
		fallbackMime = StringDuplicate( "image/png" );
	else if( strstr( mime, ".AVI" ) )
		fallbackMime = StringDuplicate( "video/avi" );
	else if( strstr( mime, ".MP4" ) )
		fallbackMime = StringDuplicate( "video/mp4" );
	else if( strstr( mime, ".MOV" ) )
		fallbackMime = StringDuplicate( "video/quicktime" );
	else if( strstr( mime, ".WMV" ) )
		fallbackMime = StringDuplicate( "video/ms-video" );
	else if( strstr( mime, ".HTML" ) )
		fallbackMime = StringDuplicate( "text/html" );
	else if( strstr( mime, ".CSS" ) )
		fallbackMime = StringDuplicate( "text/css" );
	else
		fallbackMime = StringDuplicate( "text/plain" );
	
	free( mime );
	
	return fallbackMime;
}



const char* MimeFromExtension( char* extension );

#endif
