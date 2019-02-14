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
 * file contain body for MutexManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 05/06/2018
 */

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "mutex_manager.h"
#include <system/user/user.h>
#include <system/systembase.h>

/**
 * Create new MutexManager
 *
 * @param sb pointer to SystemBase
 * @return new MutexManager structure when success, otherwise NULL
 */
MutexManager *MutexManagerNew( void *sb )
{
	// there must be only one instance of MutexManager
	SystemBase *lsb = (SystemBase *)sb;
	MutexManager *mm = NULL;
	
	if( lsb->sl_MutexManager == NULL )
	{
		mm = FCalloc( 1, sizeof(MutexManager) );
		if( mm != NULL )
		{
			mm->mm_SB = sb;
		}
		lsb->sl_MutexManager = mm;
	}
	else
	{
		mm = lsb->sl_MutexManager;
	}
	return mm;
}

/**
 * Delete MutexManager
 *
 * @param mm pointer to MutexManager which will be deleted
 */
void MutexManagerDelete( MutexManager *mm )
{
	if( mm != NULL )
	{
		MutexEntry *me = mm->mm_MutexList;
		while( me != NULL )
		{
			MutexEntry *mr = me;
			me = (MutexEntry *) me->node.mln_Succ;
			
			if( mr != NULL )
			{
				FFree( mr );
			}
		}
		
		SystemBase *lsb = (SystemBase *)mm->mm_SB;
		FFree( mm );
		lsb->sl_MutexManager = NULL;
	}
}

/**
 * Lock mutex
 * Function is trying to lock mutex in period of time
 * 
 * @param mut pointer to mutex
 * @return 0 when success, otherwise error number
 */
int PthreadTimedLock( pthread_mutex_t *mut, char *file, int line )
{
	int times = 50;//MUTEX_TIMEOUT_NUMBER_TRIES;
	while( times > 0 )
	{
		if( pthread_mutex_trylock( mut ) == 0 )
		{
			return 0;
		}
		sleep( 1 );
		//usleep( 50000 );//MUTEX_TIMEOUT_TIME );
		times--;
		DEBUG("a");
	}
	Log( FLOG_ERROR, "Cannot lock, filename: '%s' Line: '%d'\n", file, line );
	// crash!
//#ifdef __DEBUG
	exit( EXIT_CODE_LOCK );
//#endif
	return 1;
}
