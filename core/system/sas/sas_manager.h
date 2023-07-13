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


#endif // __SYSTEM_SAS_SAS_MANAGER_H__
