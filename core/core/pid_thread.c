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
 *  PIDThread body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 27 March 2017
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
			FFree( th->pt_Url[ i ] );
		}
		
		ThreadDelete( th->pt_Thread );
		
		FFree( th );
	}
}

