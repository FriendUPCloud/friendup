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
 *  Shared Application Session
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_SAS_SAS_SESSION_H__
#define __SYSTEM_SAS_SAS_SESSION_H__

#include <time.h>
#include <core/types.h>
#include <db/sqllib.h>
//#include "app_category.h"
//#include "app_permission.h"
#include <system/user/user.h>
#include <system/user/user_session.h>
#include <system/invar/invar.h>

enum {
	SASID_US_STATUS_NEW = 0,
	SASID_US_INVITED,
	SASID_US_ACCEPTED,
	SASID_US_REJECTED,
	SASID_US_WORKING,
	SASID_US_INVALID
};

enum {
	SAS_TYPE_CLOSED = 0,
	SAS_TYPE_OPEN,
	SAS_TYPE_MAX
};

//
// Application session
//

typedef struct SASUList
{
	MinNode 			node;
	UserSession 		*usersession;
	char 				authid[ 256 ];
	int					status;
	
	FULONG				ID;
}SASUList;


typedef struct SASSession
{
	MinNode					node;
	char					sas_AuthID[ 255 ];			// ID of applicaton from UserApplication
	FUQUAD					sas_AppID;						// application ID
	FUQUAD					sas_SASID;						// Application session ID
	SASUList				*sas_UserSessionList;					// first user is always owner
	int						sas_UserNumber;
	pthread_mutex_t			sas_SessionsMut;
	
	FThread					*sas_Thread;
	int						sas_WritePipe;
	time_t					sas_Timer;						// session timer
	
	FBOOL					sas_Obsolete;					// if session is obsolete, remove it
	FULONG					sas_NumberGenerator;		// generate ID for every entry in session list
	
	INVAREntry				*sas_Variables;
	FULONG					sas_VariablesNumGenerator;
	pthread_mutex_t			sas_VariablesMut;
	
	void 					*sas_SB;
	int						sas_Type;
}SASSession;

//
//
//

SASSession *SASSessionNew( void *sb, const char *authid, FUQUAD  appid, UserSession *u );

//
//
//

void SASSessionDelete( SASSession *as );

//
//
//

int SASSessionAddUserSession( SASSession *as, UserSession *u, char *authid );

//
//
//

int SASSessionRemUserSession( SASSession *as, UserSession *u );

//
//
//

int SASSessionRemUserSessionAny( SASSession *as, UserSession *u );

//
//
//

SASUList *SASSessionAddCurrentUserSession( SASSession *as, UserSession *loggedSession );

//
//
//

int SASSessionRemByWebSocket( SASSession *as, void *wc );

//
//
//

int SASSessionRemUser( SASSession *as, User *u );

//
//
//

int SASSessionSendMessage( SASSession *as, UserSession *sender, char *buffer, int size, char *dstusers );

//
//
//

int SASSessionSendOwnerMessage( SASSession *as, UserSession *sender, char *buffer, int size );

//
//
//

int SASSessionSendPureMessage( SASSession *as, UserSession *sender, char *buffer, int size );

//
//
//

SASUList *SASSessionAddUser( SASSession *as, UserSession *u, char *authid );

//
//
//

char *SASSessionAddUsersByName( SASSession *as, UserSession *loggedSession, char *userlist, char *appname, char *msg );

//
//
//

SASUList *SASSessionAddUsersBySession( SASSession *as, UserSession *loggedSession, char *sessid, char *appname, char *msg );

//
//
//

BufString *SASSessionRemUserByNames( SASSession *as, UserSession *loggedSession, char *userlist );

//
//
//

SASUList *SASSessionGetListEntryBySession( SASSession *as, UserSession *ses );

#endif // __APP_SESSION_H__
