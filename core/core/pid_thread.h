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
 *  Filesystem manager    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */
/**
 * \ingroup FriendCoreThreadsPID
 * @{
 */

#ifndef __CORE_PID_THREAD_H__
#define __CORE_PID_THREAD_H__

#include <core/types.h>
#include <core/thread.h>
#include <core/nodes.h>
#include <network/http.h>

#define PID_URL_MAX_DEPTH 32

//
//
//

enum 
{
	PID_THREAD_NEW,
	PID_THREAD_STARTED,
	PID_THREAD_STOPPED
};

//
//
//

typedef struct PIDThread
{
	MinNode					node;
	FThread					*pt_Thread;
	FUQUAD					pt_PID;   // thread ID
	void					*( *pt_Function)( void *, char **, Http* , void *, int * );
	char					*pt_Url[ PID_URL_MAX_DEPTH ];   //
	int						pt_UrlDepth;
	Http					*pt_Request;
	void					*pt_UserSession;
	void					*pt_SB;
	int						pt_Status;
	void					*pt_PTM;   // PIDThreadManager
}PIDThread;

//
//
//

PIDThread *PIDThreadNew( void *sb );

//
//
//

void PIDThreadDelete( PIDThread *t );

#endif // __CORE_PID_THREAD_H__

/**@}*/
