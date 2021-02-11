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
 *  PIDThread body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 27 March 2017
 * 
 * \defgroup FriendCoreThreadsPID PID
 * \ingroup FriendCoreThreads
 * @{
 */

#include <core/types.h>
#include <core/thread.h>
#include <core/nodes.h>
#include <network/http.h>
#include "pid_thread.h"

/**
 * Create new PIDThread
 *
 * @param sb pointer to SystemBase
 * @return pointer to new PIDThread
 */

PIDThread *PIDThreadNew( void *sb )
{
	PIDThread *pt = FCalloc( 1, sizeof( PIDThread ) );
	if( pt != NULL )
	{
		pt->pt_SB = sb;
		pt->pt_PID = (FUQUAD) pt;
	}
	return pt;
}

/**
 * Delete PIDThread
 *
 * @param th pointer to PIDThread
 */

void PIDThreadDelete( PIDThread *th )
{
	if( th != NULL )
	{
		int i;
		
		for( i = 0; i < th->pt_UrlDepth; i++ )
		{
			if( th->pt_Url[ i ] != NULL )
			{
				FFree( th->pt_Url[ i ] );
				th->pt_Url[ i ] = NULL;
			}
		}
		
		ThreadDelete( th->pt_Thread );
		
		FFree( th );
	}
}

/**@}*/
// End of FriendCoreThreadsPID Doxygen group
