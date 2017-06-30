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
 *  Returns information about a running Friend Core
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 14/10/2015
 */

#include "friendcore_info.h"
#include <core/friendcore_manager.h>
#include <core/friend_core.h>


/**
 * Allocates a new Friend Core information structure.
 *
 * @param fcm pointer to Friend Core manager
 * @return pointer to allocated structure
 * @return undefined in case of error
 */
FriendcoreInfo *FriendCoreInfoNew( void *fcm )
{
	FriendcoreInfo *fci = NULL;
	
	if( ( fci = FCalloc( 1, sizeof( FriendcoreInfo ) ) ) != NULL )
	{
		fci->fci_FCM = fcm;
	}
	else
	{
		FERROR("Cannot allocate memory for FriendcoreInfo structure\n");
	}
	
	return fci;
}

/**
 * Frees a Friend Core information structure.
 *
 * @param fci pointer to the structure to delete
 */
void FriendCoreInfoDelete( FriendcoreInfo *fci )
{
	if( fci != NULL )
	{
		FFree( fci );
	}
}

/**
 * Get information about a running Friend Core/
 *
 * @param fci pointer to the Friend Core information structure to store data
 * @return pointer to a buffered string containing the informations
 * @return NULL in case of error
 */
BufString *FriendCoreInfoGet( FriendcoreInfo *fci )
{
	BufString *bs = BufStringNew();
	if( bs != NULL )
	{
		FriendCoreManager *fcm = (FriendCoreManager *)fci->fci_FCM;
	
		char temp[ 2048 ];
	
		BufStringAdd( bs, "{" );
	
		sprintf( temp, " \"FriendCoreName\":\"%s\", ", fcm->fcm_ID );
		BufStringAdd( bs, temp );
		
		sprintf( temp, " \"FriendCoreVersion\":\"%s\", \"FriendCoreBuildDate\":\"%s\", \"FriendCoreBuild\":\"%s\",", APPVERSION, APPDATE, APPGITVERSION );
		BufStringAdd( bs, temp );
	
		BufStringAdd( bs, "\"FriendCores\" : " );
		FriendCoreInstance *fc = fcm->fcm_FriendCores;
		int i = 0, j =0;
	
		while( fc != NULL )
		{
			if( i == 0 )
			{
				sprintf( temp, "{ \"ID\":\"%32s\" ,\"Port\":\"%d\",\"Workers\":", fc->fci_CoreID, fc->fci_Port );
			}
			else
			{
				sprintf( temp, ", { \"ID\":\"%32s\" ,\"Port\":\"%d\",\"Workers\":", fc->fci_CoreID, fc->fci_Port );
			}
			BufStringAdd( bs, temp );
		
			strcpy( temp, "\"0\"" );
			BufStringAdd( bs, temp );
			/*
			if( fc->fci_WorkerManager->wm_MaxWorkers == 0 )
			{
				
			}
			else
			{
				for( j=0 ; j < fc->fci_WorkerManager->wm_MaxWorkers ; j++ )
				{
					Worker *wrk = fc->fci_WorkerManager->wm_Workers[ j ];
					if( j == 0 )
					{
						sprintf( temp, "{\"Number\":\"%d\", \"State\":\"%d\", \"Quit\":\"%d\", \"AvgUsage\":\"%f\"'}", wrk->w_Nr, wrk->w_State, wrk->w_Quit, wrk->w_WorkSeconds );
					}
					else
					{
						sprintf( temp, ",{\"Number\":\"%d\", \"State\":\"%d\", \"Quit\":\"%d\", \"AvgUsage\":\"%f'\"}", wrk->w_Nr, wrk->w_State, wrk->w_Quit, wrk->w_WorkSeconds );
					}
				}
			}
			*/
		
			BufStringAdd( bs, "}" );
		
			i++;
			fc = (FriendCoreInstance *)fc->node.mln_Succ;
		}
	
		BufStringAdd( bs, "}" );
	}
	
	return bs;
}
