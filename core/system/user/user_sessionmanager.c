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
 *  User Session Manager
 *
 * file contain all functitons related to user sessions management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_sessionmanager.h"
#include "user.h"

#include <system/systembase.h>
#include <system/user/user_manager.h>
#include <system/fsys/door_notification.h>
#include <util/session_id.h>

#include <strings.h>

/**
 * Create new User Session Manager
 *
 * @param sb pointer to SystemBase
 * @return UserSessionManager
 */
UserSessionManager *USMNew( void *sb )
{
	UserSessionManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( UserSessionManager ) ) ) != NULL )
	{
		sm->usm_SB = sb;
		
		pthread_mutex_init( &(sm->usm_Mutex), NULL );

		return sm;
	}
	return NULL;
}

/**
 * Delete User Session Manager
 *
 * @param smgr pointer to UserSessionManager which will be deleted
 */
void USMDelete( UserSessionManager *smgr )
{
	if( smgr != NULL )
	{
		//while( smgr->usm_InUse > 0 )
		//{
		//	sleep( 1 );
		//}
		
		SESSION_MANAGER_CHANGE_ON( smgr );

		DEBUG("[USMDelete] Remove sessions\n");
		UserSession  *ls = smgr->usm_Sessions;
		while( ls != NULL )
		{
			UserSession *rem = ls;
			ls = (UserSession *) ls->node.mln_Succ;
			
			DEBUG("[USMDelete] \t\tRemove session : %s uid %lu\n", rem->us_SessionID, rem->us_UserID );
		
			USMSessionsDeleteDB( smgr, rem->us_SessionID );
			UserSessionDelete( rem );
		}
		
		/*
		ls = smgr->usm_SessionsToBeRemoved;
		while( ls != NULL )
		{
			UserSession *rem =  ls;
			ls = (UserSession *) ls->node.mln_Succ;
			
			DEBUG("[USMDelete] \t\tRemove session from remove list: %s uid %lu\n", rem->us_SessionID, rem->us_UserID );
			
			USMSessionsDeleteDB( smgr, rem->us_SessionID );
			UserSessionDelete( rem );
		}
		*/
		
		smgr->usm_Sessions = NULL;
		
		SESSION_MANAGER_CHANGE_OFF( smgr );
		
		pthread_mutex_destroy( &(smgr->usm_Mutex) );
		
		FFree( smgr );
	}
}

/**
 * Get User by sessionid
 *
 * @param usm pointer to UserSessionManager
 * @param sessionid sessionid as string
 * @return pointer to User structure
 */
User *USMGetUserBySessionID( UserSessionManager *usm, char *sessionid )
{
	DEBUG("CHECK3\n");
	SESSION_MANAGER_USE( usm );
	
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( strcmp( sessionid, us->us_SessionID ) == 0 )
		{
			SESSION_MANAGER_RELEASE( usm );
			return us->us_User;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	
	SESSION_MANAGER_RELEASE( usm );
	return NULL;
}

/**
 * Get UserSession by sessionid
 *
 * @param usm pointer to UserSessionManager
 * @param sessionid sessionid as string
 * @return pointer to UserSession structure
 */
UserSession *USMGetSessionBySessionID( UserSessionManager *usm, char *sessionid )
{
	DEBUG("[USMGetSessionBySessionID] sesssion id %s\n", sessionid );
	if( sessionid == NULL )
	{
		FERROR("Sessionid is NULL!\n");
		return NULL;
	}
	DEBUG("CHECK4\n");
	
	SESSION_MANAGER_USE( usm );
	
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		//
		// If session is in "to remove" state, we can skip it
		//
		
		if( us->us_Status == USER_SESSION_STATUS_TO_REMOVE )
		{
			us = (UserSession *) us->node.mln_Succ;
			continue;
		}
		
		if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
		{
			us->us_InUseCounter++;
			FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
		}
		
		if( strcmp( sessionid, us->us_SessionID ) == 0 )
		{
			DEBUG("CHECK4END found\n");
			if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
			{
				us->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
			}
			SESSION_MANAGER_RELEASE( usm );
			return us;
		}
		else
		{
			if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
			{
				us->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
			}
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	DEBUG("[USMGetSessionBySessionID] session not found: %s\n", sessionid );
	
	SESSION_MANAGER_RELEASE( usm );
	
	return NULL;
}

/**
 * Get UserSession by sessionid from DB
 *
 * @param smgr pointer to UserSessionManager
 * @param id sessionid as string
 * @return pointer to UserSession structure
 */
UserSession *USMGetSessionBySessionIDFromDB( UserSessionManager *smgr, char *id )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	struct UserSession *usersession = NULL;
	char tmpQuery[ 1024 ];
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		int entries = 0;
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," SessionID='%s'", id );
	
		DEBUG( "[USMGetSessionBySessionIDFromDB] Sending query: %s...\n", tmpQuery );

		usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	
	DEBUG("[USMGetSessionBySessionIDFromDB] end\n");
	return usersession;
}

/**
 * Get UserSession by deviceid and user id
 *
 * @param usm pointer to UserSessionManager
 * @param devid device id as string
 * @param uid user id as unsigned integer value
 * @return UserSession structure
 */
UserSession *USMGetSessionByDeviceIDandUser( UserSessionManager *usm, char *devid, FULONG uid )
{
	DEBUG("[USMGetSessionByDeviceIDandUser] new, deviceid: >%s<\n", devid );
 	SESSION_MANAGER_USE( usm );
	
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( us->us_Status != USER_SESSION_STATUS_TO_REMOVE && us->us_Status != USER_SESSION_STATUS_DELETE_IN_PROGRESS )
		{
			DEBUG("[USMGetSessionByDeviceIDandUser] userid >%ld< devidentity >%s< compare to UID %ld and DEVID %s\n", us->us_UserID, us->us_DeviceIdentity, uid, devid );
			if( us->us_UserID == uid && us->us_DeviceIdentity != NULL && strcmp( devid, us->us_DeviceIdentity ) == 0 && us->us_Status != USER_SESSION_STATUS_TO_REMOVE )
			{
				DEBUG("[USMGetSessionByDeviceIDandUser] found user by deviceid: %s sessionID: %s\n", devid, us->us_SessionID );
				SESSION_MANAGER_RELEASE( usm );
				return us;
			}
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	DEBUG("[USMGetSessionByDeviceIDandUser] end\n");
	
	SESSION_MANAGER_RELEASE( usm );
	return NULL;
}

/**
 * Get UserSession by deviceid and user id from Database
 *
 * @param smgr pointer to UserSessionManager
 * @param devid device id as string
 * @param uid user id as unsigned integer value
 * @return UserSession structure
 */
UserSession *USMGetSessionByDeviceIDandUserDB( UserSessionManager *smgr, char *devid, FULONG uid )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	struct UserSession *usersession = NULL;
	char tmpQuery[ 1024 ];
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		int entries = 0;
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," ( DeviceIdentity='%s' AND UserID = %ld )", devid, uid );
	
		DEBUG( "[USMGetSessionByDeviceIDandUserDB] Sending query: %s...\n", tmpQuery );
	
		// You added 'where' and on the end you did not used it??
	
		//usersession = ( UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, NULL, &entries );
		usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
		sb->LibrarySQLDrop( sb, sqlLib );	
	}
	else
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	DEBUG("[USMGetSessionByDeviceIDandUserDB] end\n");
	return usersession;
}

/**
 * Get first UserSession by sessionid
 *
 * @param usm pointer to UserSessionManager
 * @param id user id as integer value
 * @return UserSession structure
 */
UserSession *USMGetSessionByUserID( UserSessionManager *usm, FULONG id )
{
	DEBUG("[USMGetSessionByUserID] start\n");
	// We will take only first session of that user
	// protect in mutex
	SESSION_MANAGER_USE( usm );
	
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( us->us_User  != NULL  && us->us_User->u_ID == id )
		{
			if( us->us_User->u_SessionsList != NULL )
			{
				SESSION_MANAGER_RELEASE( usm );
				return us->us_User->u_SessionsList->us;
			}
		}
		us = (UserSession *) us->node.mln_Succ;
	}
		
	SESSION_MANAGER_RELEASE( usm );
	return NULL;
}

/**
 * Display information about users and their doors in logs
 *
 * @param usm pointer to UserSessionManager
 */
void USMLogUsersAndDevices( UserSessionManager *usm )
{
	SystemBase *sb = (SystemBase *)usm->usm_SB;
	UserManager *um = (UserManager *)sb->sl_UM;
	User *lu = um->um_Users;
	while( lu != NULL )
	{
		INFO("Unmounting checking users %s\n", lu->u_Name );
		
		File *lf = lu->u_MountedDevs;
		while( lf != NULL )
		{
			INFO("Device %s\n", lf->f_Name );
			lf = (File *)lf->node.mln_Succ;
		}
		lu = (User *)lu->node.mln_Succ;
	}
}

/**
 * Get all sessions from database which
 *
 * @param smgr pointer to UserSessionManager
 * @param timeout time from which we want to get sessions
 * @return UserSession structure
 */
UserSession *USMGetSessionsByTimeout( UserSessionManager *smgr, const FULONG timeout )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	time_t timestamp = time ( NULL );
	struct UserSession *usersession = NULL;
	int entries = 0;
	char tmpQuery[ 1024 ];
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	
	/*
	if( fc_sentinel != NULL && fc_sentinel->UserObject != NULL )
	{
		DEBUG( "[USMGetSessionsByTimeout] Creating query part.\n" );
		sentinelQuery = FCalloc( 256, sizeof( char ) );
		sprintf( sentinelQuery, " OR ( `Name`=\"%s\" AND `Password`=SHA2(CONCAT(\"HASHED\",SHA2(\"%s\",256)),256) )",
			fc_sentinel->Username, fc_sentinel->Password );
	}*/
	// There is only one user in DB which have name  Sentinel, there is no need to check Password
	
	Sentinel *sent = NULL;

	if( ( sent = sb->GetSentinelUser( sb ) ) != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), " (LastActionTime>%lld OR `UserID` in( SELECT ID FROM `FUser` WHERE `Name`='%s'))", (long long int)(timestamp - timeout), sent->s_ConfigUsername );
	}
	else
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), " (LastActionTime>%lld)", (long long int)(timestamp - timeout) );
	}
	
	DEBUG( "[USMGetSessionsByTimeout] Sending query: %s...\n", tmpQuery );
	
	usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
    UserSession *ses = usersession;
    while( ses != NULL )
    {
        INFO("Loaded sessionid: %s id %lu\n", ses->us_SessionID, ses->us_ID );
        ses = (UserSession *)ses->node.mln_Succ;
    }
    
	sb->LibrarySQLDrop( sb, sqlLib );

	DEBUG("[USMGetSessionsByTimeout] UserGetByTimeout end\n");
	return usersession;
}

/**
 * Add file to user session
 *
 * @param smgr pointer to UserSessionManager UNUSED
 * @param ses pointer to user session to which file will be added
 * @param f pointer to file which will be added to user session
 * @return 0 if everything will go ok, otherwise error number
 */
int USMAddFile( UserSessionManager *smgr __attribute__((unused)), UserSession *ses, File *f )
{
	f->node.mln_Succ = (MinNode *) ses->us_OpenedFiles;
	ses->us_OpenedFiles = f;
	
	return 0;
}

/**
 * Remove file from user session
 *
 * @param smgr pointer to UserSessionManager UNUSED
 * @param ses pointer to user session from which file will be removed
 * @param id id of the file which will be removed from user session
 * @return 0 if everything will go ok, otherwise error number
 */
int USMRemFile( UserSessionManager *smgr __attribute__((unused)), UserSession *ses, FULONG id )
{
	File *f = ses->us_OpenedFiles;
	File *prevfile = f;
	while( f != NULL )
	{
		if( f->f_Pointer == id )
		{
			File *actDev = f->f_RootDevice;
			FHandler *actFS = (FHandler *)actDev->f_FSys;
				
			DEBUG("[USMRemFile] close file %p openedfile %p\n",  f, ses->us_OpenedFiles );
			
			if( f == ses->us_OpenedFiles )
			{
				ses->us_OpenedFiles =(File *)f->node.mln_Succ;
			}
			else
			{
				prevfile->node.mln_Succ = f->node.mln_Succ;
			}
			
			actFS->FileClose( actDev, f );

			break;
		}
		
		prevfile = f;
		f = (File *)f->node.mln_Succ;
	}
	return 0;
}

/**
 * Get file from user session
 *
 * @param smgr pointer to UserSessionManager UNUSED
 * @param ses pointer to user session from which file will be taken
 * @param id id of the file which will be taken from user session
 * @return pointer to File structure when success, otherwise NULL
 */
File *USMGetFile( UserSessionManager *smgr __attribute__((unused)), UserSession *ses, FULONG id )
{
	File *f = ses->us_OpenedFiles;
	while( f != NULL )
	{
		if( f->f_Pointer == id )
		{
			return f;
		}
		
		f = (File *)f->node.mln_Succ;
	}
	return NULL;
}

/**
 * Add user session to global user sessions list without checking if session exist
 *
 * @param smgr pointer to UserSessionManager
 * @param s pointer to user session which  will be added
 * @return UserSession if success, otherwise NULL
 */
UserSession *USMUserSessionAddToList( UserSessionManager *smgr, UserSession *s )
{
	DEBUG("[USMUserSessionAddToList] start\n");
	
	while( smgr->usm_InUse > 0 )
	{
		usleep( 2000 );
		Log( FLOG_INFO, "USMserSEssionAddToList\n");
	}
	
	SESSION_MANAGER_CHANGE_ON( smgr );
	
	if( smgr->usm_Sessions == s )
	{
		DEBUG("[USMUserSessionAddToList] stop adding same session!\n");
		SESSION_MANAGER_CHANGE_OFF( smgr );
		return s;
	}
	// Add next usersession
	s->node.mln_Succ = (MinNode *)smgr->usm_Sessions;
	smgr->usm_Sessions = s;
	smgr->usm_SessionCounter++;
	
	SESSION_MANAGER_CHANGE_OFF( smgr );
	
	//
	/*
	SESSION_MANAGER_CHANGE_ON( smgr );
	
	UserSession *actSess = smgr->usm_SessionsToBeRemoved;
	UserSession *remSess = smgr->usm_SessionsToBeRemoved;
	smgr->usm_SessionsToBeRemoved = NULL;
	
	SESSION_MANAGER_CHANGE_OFF( smgr );
		
	while( actSess != NULL )
	{
		remSess = actSess;
		actSess = (UserSession *)actSess->node.mln_Succ;
		
		//UserRemoveSession( remSess->us_User, remSess );
		
		USMSessionsDeleteDB( smgr, remSess->us_SessionID );
		UserSessionDelete( remSess );
	}
	*/
	
	DEBUG("[USMUserSessionAddToList] end\n");
	
	return s;
}

/**
 * Add user session to global user sessions list.
 * Function check first if session with provided already exist. If it exist its not added.
 *
 * @param smgr pointer to UserSessionManager
 * @param us pointer to user session which  will be added
 * @return UserSession if success, otherwise NULL
 */
UserSession *USMUserSessionAdd( UserSessionManager *smgr, UserSession *us )
{
	DEBUG("[USMUserSessionAdd] start, usptr : %p\n", us );
	
	FBOOL userHaveMoreSessions = FALSE;
	FBOOL duplicateMasterSession = FALSE;
	
	if( us == NULL )
	{
		FERROR("[USMUserSessionAdd] Cannot add NULL session!\n");
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
	{
		us->us_InUseCounter++;
		FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
	}

	DEBUG("[USMUserSessionAdd] CHECK8\n");
	
	SESSION_MANAGER_CHANGE_ON( smgr );
	
	DEBUG("[USMUserSessionAdd] CHECK8 LOCKED\n");
	UserSession *ses =  smgr->usm_Sessions;
	while( ses != NULL )
	{
		FBOOL quit = FALSE;
		DEBUG("[USMUserSessionAdd] inside session\n");
		
		DEBUG("[USMUserSessionAdd] Session locked, compare: %s vs %s\n", us->us_SessionID, ses->us_SessionID );
		
		if( us->us_SessionID != NULL && ses->us_SessionID != NULL && strncmp( us->us_SessionID, ses->us_SessionID, 256 ) == 0 )
		{
			DEBUG("Found session with same sessionID, return!\n");
			
			SESSION_MANAGER_CHANGE_OFF( smgr );
			
			if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
			{
				us->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
			}
			return ses;
		}
		
		if( ses->us_DeviceIdentity != NULL )
		{
			if( us->us_UserID == ses->us_UserID && strcmp( us->us_DeviceIdentity, ses->us_DeviceIdentity ) ==  0 )
			{
				DEBUG("[USMUserSessionAdd] Session found, no need to create new  one %lu devid %s\n", ses->us_UserID, ses->us_DeviceIdentity );
				quit = TRUE;
			}
		}
		else
		{
			if( ses->us_DeviceIdentity == us->us_DeviceIdentity )
			{
				DEBUG("[USMUserSessionAdd] Found session with empty deviceid\n");
				quit = TRUE;
			}
		}
		if( quit == TRUE )
		{
			DEBUG("[USMUserSessionAdd] Break\n");
			break;
		}
		
		DEBUG("[USMUserSessionAdd] inside session 2 id: %s\n", us->us_SessionID );
		ses = (UserSession *)ses->node.mln_Succ;
	}
	DEBUG("[USMUserSessionAdd] CHECK8 after while\n");

	// if session doesnt exist in memory we must add it to the list
	
	if( ses ==  NULL )
	{
		INFO("[USMUserSessionAdd] Add UserSession to User. SessionID: %s usptr: %p\n", us->us_SessionID, us );
		UserSession *sessPtr =  smgr->usm_Sessions;
		while( sessPtr != NULL )
		{
			if( sessPtr == us )
			{
				break;
			}
			sessPtr = (UserSession *)sessPtr->node.mln_Succ;
		}
		
		if( sessPtr == NULL )
		{
			us->node.mln_Succ = (MinNode *)smgr->usm_Sessions;
			smgr->usm_Sessions = us;
		}
	}
	else
	{
		duplicateMasterSession = TRUE;
		us = ses;
		DEBUG("[USMUserSessionAdd] User session was overwritten, ptr %p\n", us );
	}
	DEBUG("[USMUserSessionAdd] CHECK8END\n");
	
	SESSION_MANAGER_CHANGE_OFF( smgr );
	
	DEBUG("[USMUserSessionAdd] Checking session id %lu\n", us->us_UserID );
	
	if( us->us_UserID != 0 )
	{
		SystemBase *sb = (SystemBase *)smgr->usm_SB;
		smgr->usm_SessionCounter++;
		User *locusr = NULL;
		
		if( us->us_User != NULL )
		{
			locusr = us->us_User;
		}
		else
		{
			locusr = UMGetUserByID( sb->sl_UM, us->us_UserID );
			if( locusr != NULL )
			{
				if( locusr->u_SessionsNr > 0 )
				{
					userHaveMoreSessions = TRUE;
				}
			}
		}
		
		if( locusr == NULL )
		{
			DEBUG("[USMUserSessionAdd] User found in DB, generate new master session for him and his devices\n");
			locusr = UMUserGetByIDDB( sb->sl_UM, us->us_UserID );
		}
		
		if( locusr == NULL )
		{
			Log( FLOG_ERROR, "Cannot get user by ID\n");
			if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
			{
				us->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
			}
			return NULL;
		}
		else
		{
			//DEBUG("[USMUserSessionAdd] User added to user %s main sessionid %s usptr: %p\n", locusr->u_Name, locusr->u_MainSessionID, us );
			
			UserAddSession( locusr, us );

			us->us_User = locusr;
		}
	}
	else
	{
		FERROR("[USMUserSessionAdd] Couldnt find user with ID %lu\n", us->us_UserID );
		if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
		{
			us->us_InUseCounter--;
			FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
		}
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
	{
		us->us_InUseCounter--;
		FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
	}
	
	return us;
}

/**
 * Remove UserSession from FC list
 *
 * @param smgr pointer to UserSessionManager
 * @param remsess session which will be removed
 * @return 0 when success, otherwise error number
 */
int USMUserSessionRemove( UserSessionManager *smgr, UserSession *remsess )
{
	if( remsess == NULL )
	{
		return -1;
	}
	
	UserSession *sess = smgr->usm_Sessions;
	UserSession *prev = sess;
	FBOOL sessionRemoved = FALSE;
	
	DEBUG("[USMUserSessionRemove] UserSessionRemove\n");
	
	SESSION_MANAGER_CHANGE_ON( smgr );
	
	if( remsess == smgr->usm_Sessions )
	{
		smgr->usm_Sessions = (UserSession *)smgr->usm_Sessions->node.mln_Succ;
		sessionRemoved = TRUE;
		smgr->usm_SessionCounter--;
		INFO("[USMUserSessionRemove] Session removed from list\n");
	}
	else
	{
		while( sess != NULL )
		{
			prev = sess;
			sess = (UserSession *)sess->node.mln_Succ;
		
			if( sess != NULL && sess == remsess )
			{
				// Remove usersession from list
				prev->node.mln_Succ = sess->node.mln_Succ;
				DEBUG("[USMUserSessionRemove] Session removed from list\n");
				sessionRemoved = TRUE;
				break;
			}
		}
		smgr->usm_SessionCounter--;
	}
	
	SESSION_MANAGER_CHANGE_OFF( smgr );
	
	/*
	if( sessionRemoved == TRUE )
	{
		USMSessionsDeleteDB( smgr, remsess->us_SessionID );
		
		// we do not delete session, untill it is used
		SESSION_MANAGER_CHANGE_ON( smgr );
		remsess->node.mln_Succ = (MinNode *) smgr->usm_SessionsToBeRemoved;
		smgr->usm_SessionsToBeRemoved = remsess;
		
		SESSION_MANAGER_CHANGE_OFF( smgr );
	}
	*/

	return 0;
}

/**
 * Delete user session in database
 *
 * @param smgr pointer to UserSessionManager
 * @param sessionid user sessionid
 * @return 0 when success otherwise error number
 */
int USMSessionsDeleteDB( UserSessionManager *smgr, const char *sessionid )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	char tmpQuery[ 1024 ];
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return -1;
	}

	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "DELETE from FUserSession WHERE SessionID='%s'", sessionid );

	sqlLib->QueryWithoutResults( sqlLib, tmpQuery );

	sb->LibrarySQLDrop( sb, sqlLib );

	DEBUG("[USMGetSessionsDeleteDB] end\n");
	return 0;
}

/**
 * Get first active user sessionid
 *
 * @param smgr pointer to UserSessionManager
 * @param usr point to User structure from which session will be taken
 * @return pointer to sessionid string
 */
char *USMUserGetFirstActiveSessionID( UserSessionManager *smgr, User *usr )
{
	//TODO get  only active  session
	if( smgr != NULL && usr != NULL )
	{
		char *sessionid = NULL;
		
		USER_LOCK( usr );
		
		UserSessListEntry *us  = usr->u_SessionsList;
		while( us != NULL )
		{
			if( us->us != NULL )
			{
				UserSession *s = (UserSession *) us->us;
				if( s->us_SessionID != NULL )
				{
					USER_UNLOCK( usr );
					return s->us_SessionID;
				}
			}
			us = (UserSessListEntry *)us->node.mln_Succ;
		}
		
		USER_UNLOCK( usr );
		
		return sessionid;
	}
	return NULL;
}

/**
 * Save UserSession into DB
 *
 * @param smgr pointer to UserSessionManager
 * @param ses pointer to user session which will be stored in DB
 * @return 0 when success, otherwise error number
 */
int USMSessionSaveDB( UserSessionManager *smgr, UserSession *ses )
{
	if( ses == NULL )
	{
		FERROR("UserSession parameter is NULL!\n");
		return 1;
	}
	SystemBase *sb = (SystemBase *) smgr->usm_SB;
	SQLLibrary *sqllib  = sb->LibrarySQLGet( sb );
	
	DEBUG("[USMSessionSaveDB] start\n");
	if( sqllib != NULL )
	{
		//
		// checking if entry exist in db
		//
		
		int TEMPSIZE = 512 + strlen( ses->us_DeviceIdentity );
		
		int error = 0;
		char *temptext = FMalloc( TEMPSIZE );
		
		snprintf( temptext, TEMPSIZE, "SELECT ID FROM `FUserSession` WHERE `DeviceIdentity`='%s' AND `UserID`=%lu", ses->us_DeviceIdentity,  ses->us_UserID );

		void *res = sqllib->Query( sqllib, temptext );
		char **row;
		int numberEntries = 0;
	
		if( res != NULL )
		{
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				numberEntries++;
			}
			sqllib->FreeResult( sqllib, res );
		}
		
		FFree( temptext );
		
		//
		// if entry do not exist insert it
		//
		
		if( numberEntries == 0 )
		{
			if( ( error = sqllib->Save( sqllib, UserSessionDesc, ses ) ) != 0 )
			{
				FERROR("Cannot store session\n");
			}
			else
			{
				DEBUG("[USMSessionSaveDB] Session stored\n");
			}
		}
		else
		{
			DEBUG("[USMSessionSaveDB] Session already exist in DB and it will be not stored.\n");
		}
		
		sb->LibrarySQLDrop( sb, sqllib );
	}
	
	return 0;
}

/**
 * Print information about user sessions in debug console
 *
 * @param smgr pointer to UserSessionManager
 */
void USMDebugSessions( UserSessionManager *smgr )
{
	UserSession *lses  = smgr->usm_Sessions;
	while( lses != NULL )
	{
		if( lses->us_User != NULL )
		{
			DEBUG("[USMDebugSessions]----\n USER %s ID %ld\nsessionid %s device %s\n\n", lses->us_User->u_Name, lses->us_ID, lses->us_SessionID, lses->us_DeviceIdentity );
		}
		else
		{
			DEBUG("[USMDebugSessions]----\n USER %s ID %ld\nsessionid %s device %s\n\n", "NOUSER!", lses->us_ID, lses->us_SessionID, lses->us_DeviceIdentity );
		}
		lses = (UserSession *)lses->node.mln_Succ;
	}
}

/**
 * Remove old User Sessions from DB
 *
 * @param lsb pointer to SystemBase
 * @return 0 when success, otherwise error number
 */
int USMRemoveOldSessions( void *lsb )
{
	SystemBase *sb = (SystemBase *)lsb;

	time_t acttime = time( NULL );
	
	DEBUG("[USMRemoveOldSessions] start\n" );

	// remove sessions from memory
	UserSessionManager *smgr = sb->sl_USM;
	// int nr = 0;
	// we are conting maximum number of sessions

	DEBUG("[USMRemoveOldSessions] CHECK10\n");

	SESSION_MANAGER_USE( smgr );
	
	UserSession *actSession = smgr->usm_Sessions;
	UserSession *remSession = actSession;
	UserSession *newRoot = NULL;
	
	while( actSession != NULL )
	{
		FBOOL canDelete = TRUE;
		remSession = actSession;
		
		if( sb->sl_Sentinel != NULL )
		{
			if( remSession->us_User == sb->sl_Sentinel->s_User && strcmp( remSession->us_DeviceIdentity, "remote" ) == 0 )
			{
				DEBUG("Sentinel REMOTE session I cannot remove it\n");
				canDelete = FALSE;
			}
		}
		
		if( actSession == (UserSession *)actSession->node.mln_Succ )
		{
			DEBUG( "DOUBLE ACTSESSION\n" );
			break;
		}
		
		actSession = (UserSession *)actSession->node.mln_Succ;
		
		// we delete session
		if( canDelete == TRUE && ( ( acttime -  remSession->us_LastActionTime ) > sb->sl_RemoveSessionsAfterTime ) )
		{
			UserRemoveSession( remSession->us_User, remSession );	// we want to remove it from user first
			USMSessionsDeleteDB( smgr, remSession->us_SessionID );
			UserSessionDelete( remSession );
		}
		else // or create new root of working sessions
		{
			remSession->node.mln_Succ = (MinNode *)newRoot;
			newRoot = remSession;
		}
	}
	
	smgr->usm_Sessions = newRoot;

	SESSION_MANAGER_RELEASE( smgr );
	
	//
	// now remove unused application sessions
	//
	
	ApplicationManagerRemoveDetachedApplicationSession( sb->sl_ApplicationManager );
	
	return 0;
}

/**
 * Remove old User Sessions from DB
 *
 * @param lsb pointer to SystemBase
 * @return 0 when success, otherwise error number
 */
int USMRemoveOldSessionsinDB( void *lsb )
{
	SystemBase *sb = (SystemBase *)lsb;

	time_t acttime = time( NULL );
	
	DEBUG("USMRemoveOldSessionsDB\n" );

	 SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	 if( sqllib != NULL )
	 {
		char temp[ 1024 ];
	 
		// we remove old entries older then sl_RemoveSessionsAfterTime (look in systembase.c)
		snprintf( temp, sizeof(temp), "DELETE from `FUserSession` WHERE LastActionTime>0 AND (%lu-LastActionTime)>%lu", acttime, sb->sl_RemoveSessionsAfterTime );
		DEBUG("USMRemoveOldSessionsDB launched SQL: %s\n", temp );
	 
		sqllib->QueryWithoutResults( sqllib, temp );
	 
		sb->LibrarySQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Remove unused websockets connections
 *
 * @param usm pointer to UserSessionManager
 */
void USMCloseUnusedWebSockets( UserSessionManager *usm )
{
	time_t actTime = time( NULL );
	DEBUG("[USMCloseUnusedWebSockets] start\n");
	DEBUG("[USMCloseUnusedWebSockets] end\n");
}

//

//
/**
 * // Generate temporary session
 *
 * @param smgr pointer to UserSessionManager
 * @param sqllib pointer to SQLLibrary. If you want to use it during one sql connection
 * @param userID user ID to which user session will be assigned
 * @param type type of session
 * @return UserSession when success, otherwise NULL
 */
UserSession *USMCreateTemporarySession( UserSessionManager *smgr, SQLLibrary *sqllib, FULONG userID, int type )
{
	UserSession *ses = NULL;
	FBOOL locSQLused = FALSE;

	SystemBase *sb = (SystemBase *)smgr->usm_SB;

	SQLLibrary *locSqllib = sqllib;
	if( sqllib == NULL )
	{
		locSqllib = sb->LibrarySQLGet( sb );
		locSQLused = TRUE;
	}
	
	ses = UserSessionNew( NULL, "tempsession", sb->fcm->fcm_ID );
	if( ses != NULL )
	{
		ses->us_UserID = userID;
		if( locSqllib != NULL )
		{
			char temp[ 1024 ];
	 
			//INSERT INTO `FUserSession` ( `UserID`, `DeviceIdentity`, `SessionID`, `CreationTime`) VALUES (0, 'tempsession','93623b68df9e390bc89eff7875d6b8407257d60d',0 )
			snprintf( temp, sizeof(temp), "INSERT INTO `FUserSession` (`UserID`,`DeviceIdentity`,`SessionID`,`CreationTime`) VALUES (%lu,'tempsession','%s',%lu)", userID, ses->us_SessionID, time(NULL) );

			DEBUG("[USMCreateTemporarySession] launched SQL: %s\n", temp );
	
			locSqllib->QueryWithoutResults( locSqllib, temp );
		}
	}
	
	if( locSQLused == TRUE )
	{
		sb->LibrarySQLDrop( sb, locSqllib );
	}
	
	return ses;
}

/**
 * Destroy temporary session
 *
 * @param smgr pointer to UserSessionManager
 * @param sqllib pointer to SQLLibrary. If you want to use it during one sql connection
 * @param ses session which will be deleted
 */
void USMDestroyTemporarySession( UserSessionManager *smgr, SQLLibrary *sqllib, UserSession *ses )
{
	FBOOL locSQLused = FALSE;
	SystemBase *sb = NULL;
	
	DEBUG("[USMDestroyTemporarySession] start\n");
	
	SQLLibrary *locSqllib = sqllib;
	if( sqllib == NULL )
	{
		sb = (SystemBase *)smgr->usm_SB;
		locSqllib = sb->LibrarySQLGet( sb );
		locSQLused = TRUE;
	}
	
	if( locSqllib != NULL )
	{
		char temp[ 1024 ];
	 
		snprintf( temp, sizeof(temp), "DELETE from `FUserSession` where SessionID='%s' AND DeviceIdentity='tempsession'", ses->us_SessionID );

		DEBUG("[USMDestroyTemporarySession] launched SQL: %s\n", temp );
	
		locSqllib->QueryWithoutResults( locSqllib, temp );
	}
	
	if( locSQLused == TRUE )
	{
		sb->LibrarySQLDrop( sb, locSqllib );
	}
	
	if( ses != NULL )
	{
		DEBUG("[USMDestroyTemporarySession] session will be deleted: %p\n", ses );
		UserSessionDelete( ses );
	}
	DEBUG("[USMDestroyTemporarySession] end\n");
}

/**
 * Check if UserSession is attached to Sentinel
 *
 * @param usm pointer to UserSessionManager
 * @param username name of the User
 * @param isSentinel set flag to TRUE if user is Sentinel user
 * @return User to which session is attached or NULL
 */
User *USMIsSentinel( UserSessionManager *usm, char *username, UserSession **rus, FBOOL *isSentinel )
{
	User *tuser = NULL;
	/*
	SystemBase *sb = (SystemBase *)usm->usm_SB;
	FBOOL isUserSentinel = FALSE;
	
	SESSION_MANAGER_USE( usm );
	
	UserSession *tusers = usm->usm_Sessions;

	while( tusers != NULL )
	{
		tuser = tusers->us_User;
		Sentinel *sent = sb->GetSentinelUser( sb );
		if( tuser != NULL && sent != NULL && sent->s_User == tuser )
		{
			isUserSentinel = TRUE;
			break;
		}
		tusers = (UserSession *)tusers->node.mln_Succ;
	}
	
	SESSION_MANAGER_RELEASE( usm );
	*/
	
	return tuser;
}


#define USERSESSION_SIZE (sizeof(WebsocketReqManager) + sizeof(struct UserSession) + sizeof(struct FQueue) )

int countSessionSize( UserSession *us )
{
	int size = 0;
	if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
	{
		size = USERSESSION_SIZE + 255;	// approx 255 for sessionid

		FQEntry *fqe = us->us_MsgQueue.fq_First;
		while( fqe != NULL )
		{
			size += fqe->fq_Size + sizeof( FQEntry );
			fqe = (FQEntry *)fqe->node.mln_Succ;
		}
	
		FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
	}
	
	return size;
}

/**
 * Get statistic about user sessions
 *
 * @param usm pointer to UserSessionManager
 * @param bs pointer to BufString where results will be stored (as string)
 * @param details set to true if you want to get more details
 * @return 0 when success otherwise error number
 */

int USMGetUserSessionStatistic( UserSessionManager *usm, BufString *bs, FBOOL details )
{
	int activeSessionCounter = 0;
	int64_t activeSessionBytes = 0;
	int nonActiveSessionCounter = 0;
	int64_t nonActiveSessionBytes = 0;
	char tmp[ 512 ];
	
	SESSION_MANAGER_USE( usm );
	
	if( details == TRUE )
	{
		UserSession *actSession = usm->usm_Sessions;
		while( actSession != NULL )
		{
			activeSessionCounter++;
			activeSessionBytes += countSessionSize( actSession );
			
			actSession = (UserSession *)actSession->node.mln_Succ;
		}
	
		/*
		actSession = usm->usm_SessionsToBeRemoved;
		while( actSession != NULL )
		{
			nonActiveSessionCounter++;
			nonActiveSessionBytes += countSessionSize( actSession );
			actSession = (UserSession *)actSession->node.mln_Succ;
		}
		*/
		
		int len = snprintf( tmp, sizeof(tmp), "\"usersessions\":{\"active\":%d,\"activebtes\":%ld,\"toberemoved\":%d,\"toberemovedbytes\":%ld},\"averagesize\":%d", activeSessionCounter, activeSessionBytes, nonActiveSessionCounter, nonActiveSessionBytes, (int)USERSESSION_SIZE );
		BufStringAddSize( bs, tmp, len );
	}
	else
	{
		UserSession *actSession = usm->usm_Sessions;
		while( actSession != NULL )
		{
			activeSessionCounter++;
			actSession = (UserSession *)actSession->node.mln_Succ;
		}
	
		/*
		actSession = usm->usm_SessionsToBeRemoved;
		while( actSession != NULL )
		{
			nonActiveSessionCounter++;
			actSession = (UserSession *)actSession->node.mln_Succ;
		}
		*/

		// average size of 
		
		int len = snprintf( tmp, sizeof(tmp), "\"usersessions\":{\"active\":%d,\"toberemoved\":%d},\"averagesize\":%d", activeSessionCounter, nonActiveSessionCounter, (int)USERSESSION_SIZE );
		BufStringAddSize( bs, tmp, len );
	}
	
	SESSION_MANAGER_RELEASE( usm );
	
	return 0;
}

/**
 * Get first UserSession by user name
 *
 * @param usm pointer to UserSessionManager
 * @param name name of the user to which session belong
 * @param caseSensitive if set to TRUE function will use case sensitive comparation
 * @return UserSession structure
 */
UserSession *USMGetSessionByUserName( UserSessionManager *usm, char *name, FBOOL caseSensitive )
{
	// We will take only first session of that user
	// protect in mutex
	SESSION_MANAGER_USE( usm );
	
	if( caseSensitive == TRUE )
	{
		UserSession *us = usm->usm_Sessions;
		while( us != NULL )
		{
			if( us->us_User != NULL  && strcmp( us->us_User->u_Name, name ) == 0 )
			{
				SESSION_MANAGER_RELEASE( usm );
				return us;
			}
			us = (UserSession *) us->node.mln_Succ;
		}
	}
	else // case sensitive = FALSE
	{
		UserSession *us = usm->usm_Sessions;
		while( us != NULL )
		{
			if( us->us_User != NULL  && strcasecmp( us->us_User->u_Name, name ) == 0 )
			{
				SESSION_MANAGER_RELEASE( usm );
				return us;
			}
			us = (UserSession *) us->node.mln_Succ;
		}
	}
	
	SESSION_MANAGER_RELEASE( usm );
	return NULL;
}
