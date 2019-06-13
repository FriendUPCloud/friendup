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
 *  Application Session
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __APP_SESSION_H__
#define __APP_SESSION_H__

#include <time.h>
#include <core/types.h>
#include <db/sqllib.h>
#include "app_category.h"
#include "app_permission.h"
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


typedef struct AppSession
{
	MinNode					node;
	char					as_AuthID[ 255 ];			// ID of applicaton from UserApplication
	FUQUAD					as_AppID;						// application ID
	FUQUAD					as_SASID;						// Application session ID
	SASUList				*as_UserSessionList;					// first user is always owner
	int						as_UserNumber;
	pthread_mutex_t			as_SessionsMut;
	
	FThread					*as_Thread;
	int						as_WritePipe;
	time_t					as_Timer;						// session timer
	
	FBOOL					as_Obsolete;					// if session is obsolete, remove it
	FULONG					as_NumberGenerator;		// generate ID for every entry in session list
	
	INVAREntry				*as_Variables;
	FULONG					as_VariablesNumGenerator;
	pthread_mutex_t			as_VariablesMut;
	
	void 					*as_SB;
	int						as_Type;
}AppSession;

//
//
//

AppSession *AppSessionNew( void *sb, const char *authid, FUQUAD  appid, UserSession *u );

//
//
//

void AppSessionDelete( AppSession *as );

//
//
//

int AppSessionAddUserSession( AppSession *as, UserSession *u, char *authid );

//
//
//

int AppSessionRemUsersession( AppSession *as, UserSession *u );

//
//
//

int AppSessionRemUsersessionAny( AppSession *as, UserSession *u );

//
//
//

SASUList *AppSessionAddCurrentSession( AppSession *as, UserSession *loggedSession );

//
//
//

int AppSessionRemByWebSocket( AppSession *as, void *wc );

//
//
//

int AppSessionRemUser( AppSession *as, User *u );

//
//
//

int AppSessionSendMessage( AppSession *as, UserSession *sender, char *buffer, int size, char *dstusers );

//
//
//

int AppSessionSendOwnerMessage( AppSession *as, UserSession *sender, char *buffer, int size );

//
//
//

int AppSessionSendPureMessage( AppSession *as, UserSession *sender, char *buffer, int size );

//
//
//

SASUList *AppSessionAddUser( AppSession *as, UserSession *u, char *authid );

//
//
//

char *AppSessionAddUsersByName( AppSession *as, UserSession *loggedSession, char *userlist, char *appname, char *msg );

//
//
//

SASUList *AppSessionAddUsersBySession( AppSession *as, UserSession *loggedSession, char *sessid, char *appname, char *msg );

//
//
//

BufString *AppSessionRemUserByNames( AppSession *as, UserSession *loggedSession, char *userlist );

//
//
//

SASUList *GetListEntryBySession( AppSession *as, UserSession *ses );

#endif // __APP_SESSION_H__
