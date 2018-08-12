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
 *  Server Checker Body
 *
 * This module periodically checks if the HTTP server is responding,
 * if not - it shuts down Friend Core (that will be restarted by systemd).
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/05/2018
 */

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>
#include <network/http_client.h>
#include <util/buffered_string.h>
#include <system/systembase.h>

static int test = 0;

/**
 * Check Server and Restart if there is need
 *
 * @param s pointer to SystemBase
 */
void CheckServerAndRestart( void* s )
{
	SystemBase *sb = (SystemBase *)s;
	
	DEBUG("[CheckServerAndRestart] start\n");
	
	HttpClient *c = HttpClientNew( FALSE, "/webclient/index.html" );
	if( c != NULL )
	{
		
		DEBUG("Test shutdown %d test %d\n", sb->fcm->fcm_Shutdown , test );
		
		DEBUG("[CheckServerAndRestart] HttpClient created\n");
		BufString *bs = HttpClientCall( c, "localhost", 6502, sb->fcm->fcm_SSLEnabled );
		if( bs != NULL )
		{
			if( bs->bs_Size == 0 )
			{
				if( test++ >= 3 )
				{
					Log( FLOG_ERROR, "[CheckServerAndRestart] no http response\n");
					FriendCoreManagerShutdown( sb->fcm );
				}
			}
			else
			{
				DEBUG("[CheckServerAndRestart] response received\n");
				/*
				
				char *pos = strstr( bs->bs_Buffer, "\r\n\r\n" );
				if( pos != NULL )
				{
					pos+=4;
				}
				*/
			}
			BufStringDelete( bs );
			test = 0;
		}
		else
		{
			if( test++ >= 3 )
			{
				Log( FLOG_ERROR, "[CheckServerAndRestart] no http response, bs = null\n");
				
				FriendCoreManagerShutdown( sb->fcm );
				sb->fcm->fcm_Shutdown = TRUE;
			}
		}
		HttpClientDelete( c );
	}
	DEBUG("[CheckServerAndRestart] end\n");
}
