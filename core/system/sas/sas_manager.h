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
 *  Application Session Manager
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_SAS_SAS_MANAGER_H__
#define __SYSTEM_SAS_SAS_MANAGER_H__

#include <system/sas/sas_session.h>

//
// app session manager structure
//

typedef struct SASManager
{
	SASSession						*sasm_AppSessions;
	pthread_mutex_t					sasm_Mutex;
	FBOOL							sasm_ChangeState;
	int								sasm_InUse;
	void							*sasm_SB;
}SASManager;

//
// functions
//

SASManager *SASManagerNew( void *sb );

//
//
//

void SASManagerDelete( SASManager *asmm );

//
//
//

int SASManagerAddSession( SASManager *asmm, SASSession *nas );

//
//
//

int SASManagerRemSession( SASManager *asmm, SASSession *nas );

//
//
//

int SASManagerRemUserSession( SASManager *asmm, UserSession *ses );

//
//
//

SASSession *SASManagerGetSession( SASManager *asmm, FUQUAD id );

#ifndef SAS_MANAGER_CHANGE_ON
#define SAS_MANAGER_CHANGE_ON( MGR ) \
while( (MGR->sasm_InUse > 0 && MGR->sasm_ChangeState == TRUE ) ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(MGR->sasm_Mutex) ) == 0 ){ \
	MGR->sasm_ChangeState = TRUE; \
	FRIEND_MUTEX_UNLOCK( &(MGR->sasm_Mutex) ); \
}
#endif

#ifndef SAS_MANAGER_CHANGE_OFF
#define SAS_MANAGER_CHANGE_OFF( MGR ) \
if( FRIEND_MUTEX_LOCK( &(MGR->sasm_Mutex) ) == 0 ){ \
	MGR->sasm_ChangeState = FALSE; \
	FRIEND_MUTEX_UNLOCK( &(MGR->sasm_Mutex) ); \
}
#endif

#ifndef SAS_MANAGER_USE
#define SAS_MANAGER_USE( MGR ) \
while( MGR->sasm_ChangeState != FALSE ){ usleep( 2000 ); } \
if( FRIEND_MUTEX_LOCK( &(MGR->sasm_Mutex) ) == 0 ){ \
	MGR->sasm_InUse++; \
	FRIEND_MUTEX_UNLOCK( &(MGR->sasm_Mutex) ); \
}
#endif

#ifndef SAS_MANAGER_RELEASE
#define SAS_MANAGER_RELEASE( MGR ) \
if( FRIEND_MUTEX_LOCK( &(MGR->sasm_Mutex) ) == 0 ){ \
	MGR->sasm_InUse--; \
	FRIEND_MUTEX_UNLOCK( &(MGR->sasm_Mutex) ); \
}
#endif


#endif // __SYSTEM_SAS_SAS_MANAGER_H__
