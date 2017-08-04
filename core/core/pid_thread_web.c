/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

/** @file
 * 
 *  PIDThread web calls handler
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13 April 2017
 */

#include "pid_thread_web.h"
#include <system/systembase.h>

/**
 * Network handler
 *
 * @param sb pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession UserSession of loged user
 * @return http response
 */
Http *PIDThreadWebRequest( void *sb, char **urlpath, Http *request, UserSession *loggedSession )
{
	Http *response = NULL;
	SystemBase *l = (SystemBase *)sb;
	
	DEBUG("[PIDThreadWebRequest] PIDThread web request\n");

	//
	// list PID threads
	//
	
	if( strcmp( urlpath[ 1 ], "list" ) == 0 )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
			 HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		BufString *resp = PIDThreadManagerGetThreadList( l->sl_PIDTM );
		
		HttpAddTextContent( response, resp->bs_Buffer );
		resp->bs_Buffer = NULL;
		BufStringDelete( resp );
		
	//
	//
	//
		
	}
	else if( strcmp( urlpath[ 1 ], "kill" ) == 0 )
	{
		FUQUAD pid = 0;
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el == NULL ) el = HashmapGet( request->query, "id" );
		if( el != NULL )
		{
			char *end;
			pid = strtoull( (char *)el->data,  &end, 0 );
		}
		
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
			HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		if( pid > 0 )
		{
			int error = PIDThreadManagerKillPID( l->sl_PIDTM, pid );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"PID parameter is missing\" }" );
		}
		
	//
	// No function
	//
		
	}
	else
	{
		if( response == NULL)
		{
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		}
		HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Function not found\" }" );
	}
	return response;
}
