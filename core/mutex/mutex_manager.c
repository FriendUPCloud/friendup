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
		
		SystemBase *lsb = (SystemBase *)lsb->sl_MutexManager->mm_SB;
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
	int times = MUTEX_TIMEOUT_NUMBER_TRIES;
	while( times > 0 )
	{
		if( pthread_mutex_trylock( mut ) == 0 )
		{
			return 0;
		}
		usleep( MUTEX_TIMEOUT_TIME );
		times--;
	}
	Log( FLOG_ERROR, "Cannot lock, filename: '%s' Line: '%d'\n", file, line );
	// crash!
#ifdef __DEBUG
	//exit( EXIT_CODE_LOCK );
#endif
	return 1;
}
