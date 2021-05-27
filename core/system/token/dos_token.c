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
 * Body of DOS token
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (26/03/2018)
 */

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include <system/user/user_session.h>
#include "dos_token.h"
#include <util/session_id.h>

/**
 * Create DOSToken
 *
 * @param us pointer to UserSession
 * @param timeout number of seconds after which token will be deleted
 * @param usedTimes number of times how many token can be used where -1 is equal to infinity 
 * @return new instance of DOSToken
 */
DOSToken *DOSTokenNew( UserSession *us, time_t timeout, int usedTimes )
{
	DOSToken *dt = FCalloc( 1, sizeof(DOSToken) );
	if( dt != NULL )
	{
		int i;
		dt->ct_Timeout = time( NULL ) + timeout;
		dt->ct_UserSession = us;
		dt->ct_UserSessionID = us->us_ID;
		dt->ct_UserID = us->us_UserID;
		dt->ct_User = us->us_User;
		dt->ct_TokenID = SessionIDGenerate();						// token ID
		dt->ct_UsedTimes = usedTimes;								// -1 , unlimited
		dt->ct_Commands = StringDuplicate("file/read;file/write");	// default actions allowed
		dt->ct_MaxAccess = 0;
		
		DOSTokenInit( dt );
	}
	return dt;
}

/**
 * Init DOSToken
 *
 * @param dt pointer to DOSToken
 */
void DOSTokenInit( DOSToken *dt )
{
	if( dt != NULL )
	{
		if( dt->ct_Commands == NULL )
		{
			return;
		}
		int i;
		int max = strlen( dt->ct_Commands );
		dt->ct_MaxAccess = 1;
	
		// checking number of paths
		for( i=0 ; i < max ; i++ )
		{
			if( dt->ct_Commands[ i ] == ';' )
			{
				dt->ct_MaxAccess++;
			}
		}
	
		DEBUG("Found paths: %d\n", dt->ct_MaxAccess );
		if( dt->ct_AccessPath != NULL )
		{
			FFree( dt->ct_AccessPath );
		}
	
		if( ( dt->ct_AccessPath = FCalloc( dt->ct_MaxAccess, sizeof( DOSTokenPath ) ) ) != NULL )
		{
			int maxPathSize = (DOSTOKEN_MAX_PATH_SIZE-1);
			int activePath = 0;
			int pathEntry = 0;

			dt->ct_AccessPath[ activePath ].path[ pathEntry ] = dt->ct_Commands;
		
			// going through command string
		
			for( i=0 ; i < max ; i++ )
			{
				//printf("%c ", dt->ct_Commands[ i ] );
				// '/' means new path part is provided
				if( dt->ct_Commands[ i ] == '/' )
				{
					dt->ct_Commands[ i ] = 0;
					pathEntry++;
				
					// we cannot have more then maxPathSize
					if( pathEntry >= maxPathSize )
					{
						break;
					}
				
					DEBUG("Active path %d entry %d\n", activePath, pathEntry );
					dt->ct_AccessPath[ activePath ].path[ pathEntry ] = &(dt->ct_Commands[ i+1 ]);
				}
				// ';' means that new path is provided
				else if( dt->ct_Commands[ i ] == ';' )
				{
					dt->ct_Commands[ i ] = 0;
					dt->ct_AccessPath[ activePath ].path[ pathEntry ] = &(dt->ct_Commands[ i+1 ]);
				
					activePath++;
					pathEntry = 0;
				
					DEBUG("next %d pathentry %d\n", activePath, pathEntry );
				}
			}
		}
	}
}

/**
 * Delete DOSToken
 *
 * @param d pointer to DOSToken which will be deleted
 */
void DOSTokenDelete( DOSToken *d )
{
	if( d != NULL )
	{
		if( d->ct_AccessPath != NULL )
		{
			FFree( d->ct_AccessPath );
		}
		if( d->ct_TokenID != NULL )
		{
			FFree( d->ct_TokenID );
		}
		if( d->ct_Commands != NULL )
		{
			FFree( d->ct_Commands );
		}
		FFree( d );
	}
}

/**
 * Delete list of DOSTokens
 *
 * @param d pointer to first DOSToken in list
 */
void DOSTokenDeleteAll( DOSToken *d )
{
	while( d != NULL )
	{
		DOSToken *dt = d;
		d = (DOSToken *)d->node.mln_Succ;
		
		DOSTokenDelete( dt );
	}
}

/**
 * Get DOSToken description (JSON)
 *
 * @param dt pointer to DOSToken
 * @param bs pointer to BufferedString where description will be stored
 */
void DOSTokenJSONDescription( DOSToken *dt, BufString *bs )
{
	char buffer[ 2048 ];
	
	int size = snprintf( buffer, sizeof( buffer ), "{\"ID\":\"%lu\",\"usersessionid\":\"%lu\",\"userid\":\"%lu\",\"tokenid\":\"%s\",\"usedtimes\":\"%d\",\"timeout\":\"%lu\"}", dt->ct_ID, dt->ct_UserSessionID, dt->ct_UserID, dt->ct_TokenID, dt->ct_UsedTimes, dt->ct_Timeout );
	BufStringAddSize( bs, buffer, size );
}
