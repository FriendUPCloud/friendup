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
		DEBUG("[USMDelete] Remove sessions\n");
		UserSession  *ls = smgr->usm_Sessions;
		while( ls != NULL )
		{
			UserSession *rem =  ls;
			ls = (UserSession *) ls->node.mln_Succ;
			
			DEBUG("[USMDelete] \t\tRemove session : %s uid %lu\n", rem->us_SessionID, rem->us_UserID );
			
			UserSessionDelete( rem );
		}
		smgr->usm_Sessions = NULL;
		
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
	FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( strcmp( sessionid, us->us_SessionID ) == 0 )
		{
			FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
			return us->us_User;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
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
	FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( strcmp( sessionid, us->us_SessionID ) == 0 )
		{
			DEBUG("CHECK4END\n");
			FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
			return us;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	DEBUG("CHECK4END\n");
	FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
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
	DEBUG("CHECK5\n");
 	if( FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) ) == 0 )
	{
		UserSession *us = usm->usm_Sessions;
		while( us != NULL )
		{
			if( us->us_UserID == uid && us->us_DeviceIdentity != NULL && strcmp( devid, us->us_DeviceIdentity ) == 0 )
			{
				DEBUG("CHECK5END\n");
				FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
				return us;
			}
			us = (UserSession *) us->node.mln_Succ;
		}
		DEBUG("CHECK5END\n");
		FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
	}
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
	DEBUG("CHECK6\n");
	//  we  will take only first session of that user
	FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( us->us_User  != NULL  && us->us_User->u_ID == id )
		{
			if( us->us_User->u_SessionsList != NULL )
			{
				FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
				return us->us_User->u_SessionsList->us;
			}
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
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
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "( LoggedTime > '%lld' OR  `UserID` in( SELECT ID FROM `FUser` WHERE `Name`='%s') )", (long long int)(timestamp - timeout), sent->s_ConfigUsername );
	}
	else
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), " ( LoggedTime > '%lld' )", (long long int)(timestamp - timeout) );
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
	
	DEBUG("CHECK7\n");
	if( FRIEND_MUTEX_LOCK( &(smgr->usm_Mutex) ) == 0 )
	{
		s->node.mln_Succ = (MinNode *)smgr->usm_Sessions;
		smgr->usm_Sessions = s;
		smgr->usm_SessionCounter++;
	
		FRIEND_MUTEX_UNLOCK( &(smgr->usm_Mutex) );
	}
	else
	{
		return NULL;
	}
	
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
	
	DEBUG("CHECK8\n");
	if( FRIEND_MUTEX_LOCK( &(smgr->usm_Mutex) ) == 0 )
	{
		DEBUG("CHECK8 LOCKED\n");
		UserSession *ses =  smgr->usm_Sessions;
		while( ses != NULL )
		{
			FBOOL quit = FALSE;
			DEBUG("inside session\n");
			
			if( FRIEND_MUTEX_LOCK( &us->us_Mutex ) == 0 )
			{
				DEBUG("Session locked, compare: %s vs %s\n", us->us_SessionID, ses->us_SessionID );
				
				if( us->us_SessionID != NULL && ses->us_SessionID != NULL && strncmp( us->us_SessionID, ses->us_SessionID, 256 ) == 0 )
				{
					DEBUG("Found session with same sessionID, return!\n");
					FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
					FRIEND_MUTEX_UNLOCK( &(smgr->usm_Mutex) );
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
				FRIEND_MUTEX_UNLOCK( &us->us_Mutex );
			}
			
			if( quit == TRUE )
			{
				DEBUG("Break\n");
				break;
			}
		
			DEBUG("inside session 2 id: %s\n", us->us_SessionID );
			ses = (UserSession *)ses->node.mln_Succ;
		}
		DEBUG("CHECK8 after while\n");

		// if session doesnt exist in memory we must add it to the list
	
		if( ses ==  NULL )
		{
			INFO("[USMUserSessionAdd] Add UserSession to User. SessionID: %s usptr: %p\n", us->us_SessionID, us );
	
			us->node.mln_Succ = (MinNode *)smgr->usm_Sessions;
			smgr->usm_Sessions = us;
		}
		else
		{
			duplicateMasterSession = TRUE;
			us = ses;
			DEBUG("User session was overwritten, ptr %p\n", us );
		}
		DEBUG("CHECK8END\n");
		FRIEND_MUTEX_UNLOCK( &(smgr->usm_Mutex) );
	}
	
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
			return NULL;
		}
		else
		{
			DEBUG("[USMUserSessionAdd] User added to user %s main sessionid %s usptr: %p\n", locusr->u_Name, locusr->u_MainSessionID, us );
			
			UserAddSession( locusr, us );

			us->us_User = locusr;
			
			DEBUG("[USMUserSessionAdd] have more sessions: %d mainsessionid: '%s'\n", userHaveMoreSessions, locusr->u_MainSessionID );
			
			if( userHaveMoreSessions == FALSE && ( locusr->u_MainSessionID == NULL || ( strlen( locusr->u_MainSessionID ) <= 0 ) ) )
			{
				DEBUG("[USMUserSessionAdd] is api: %d\n", locusr->u_IsAPI );
				if( locusr != NULL && locusr->u_IsAPI == FALSE )
				{
					// we cannot regenerate session because drives are using this sessionid
					//if( locusr->u_MainSessionID == NULL )
					{
						UserRegenerateSessionID( locusr, NULL );
					}
				}
				
				DEBUG("[USMUserSessionAdd] SessionID will be overwriten\n");
			}
		}
	}
	else
	{
		FERROR("Couldnt find user with ID %lu\n", us->us_UserID );
		return NULL;
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
	
	DEBUG("CHECK9\n");
	if( FRIEND_MUTEX_LOCK( &(smgr->usm_Mutex) ) == 0 )
	{
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
				/*
				prev = sess;
				sess = (UserSession *)sess->node.mln_Succ;
			
				if( sess == remses )
				{
				if( prevus == usr->u_SessionsList )
				{
					usr->u_SessionsList = (UserSessListEntry *)usr->u_SessionsList->node.mln_Succ;
				}
				else
				{
					prevus->node.mln_Succ = (MinNode *)actus;
				}
				usr->u_SessionsNr--;
				removed = TRUE;
				break;
			}
			*/
				
				prev = sess;
				sess = (UserSession *)sess->node.mln_Succ;
			
				if( sess != NULL && sess == remsess )
				{
					prev->node.mln_Succ = sess->node.mln_Succ;
					DEBUG("[USMUserSessionRemove] Session removed from list\n");
					sessionRemoved = TRUE;
					break;
				}
				
			}
			smgr->usm_SessionCounter--;
		}
		FRIEND_MUTEX_UNLOCK( &(smgr->usm_Mutex) );
	}
	
	if( sessionRemoved == TRUE )
	{
		USMGetSessionsDeleteDB( smgr, remsess->us_SessionID );
		UserSessionDelete( remsess );
	}

	return 0;
}

/**
 * Delete user session in database
 *
 * @param smgr pointer to UserSessionManager
 * @param sessionid user sessionid
 * @return 0 when success otherwise error number
 */
int USMGetSessionsDeleteDB( UserSessionManager *smgr, const char *sessionid )
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
		
		UserSessListEntry *us  = usr->u_SessionsList;
		while( us != NULL )
		{
			if( us->us != NULL )
			{
				UserSession *s = (UserSession *) us->us;
				if( s->us_SessionID != NULL )
				{
					return s->us_SessionID;
				}
			}
			us = (UserSessListEntry *)us->node.mln_Succ;
		}
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
		
		sqllib->SNPrintF( sqllib, temptext, TEMPSIZE, "SELECT ID FROM `FUserSession` WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", ses->us_DeviceIdentity,  ses->us_UserID );

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
			DEBUG("[USMDebugSessions]----\n USER %s ID %ld\nsessionid %s mastersesid %s device %s\n\n", lses->us_User->u_Name, lses->us_ID, lses->us_SessionID, lses->us_User->u_MainSessionID, lses->us_DeviceIdentity );
		}
		else
		{
			DEBUG("[USMDebugSessions]----\n USER %s ID %ld\nsessionid %s mastersesid %s device %s\n\n", "NOUSER!", lses->us_ID, lses->us_SessionID, lses->us_User->u_MainSessionID, lses->us_DeviceIdentity );
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
	/*
	FULONG sentID = 0;
	if( sb->sl_Sentinel != NULL && sb->sl_Sentinel->s_User != NULL )
	{
		sentID = sb->sl_Sentinel->s_User->u_ID;
	}
	*/
	
	time_t acttime = time( NULL );
	
	DEBUG("USMRemoveOldSessions\n" );

	BufString *sqlreq = BufStringNew();
	BufStringAdd( sqlreq,  "DELETE from `FUserSession` WHERE SessionID in(" );
	char temp[ 512 ];
	temp[ 0 ] = 0;
	
	// remove sessions from memory
	UserSessionManager *smgr = sb->sl_USM;
	int nr = 0;
	// we are conting maximum number of sessions
	//FRIEND_MUTEX_LOCK( &(smgr->usm_Mutex) );
	DEBUG("CHECK10\n");
	if( FRIEND_MUTEX_LOCK( &(smgr->usm_Mutex) ) == 0 )
	{
		
		UserSession *cntses = smgr->usm_Sessions;
		while( cntses != NULL )
		{
			nr++;
			cntses = (UserSession *)cntses->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(smgr->usm_Mutex) );
	}
	// now we are adding entries  which will be removed to array
	
	UserSession **remsessions = FCalloc( nr, sizeof(UserSession *) );
	if( remsessions != NULL )
	{
		FRIEND_MUTEX_LOCK( &(smgr->usm_Mutex) );
        
		UserSession *actSession = smgr->usm_Sessions;
		UserSession *remSession = actSession;
		nr = 0;
	
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
			actSession = (UserSession *)actSession->node.mln_Succ;
		
			if( canDelete == TRUE && ( ( acttime -  remSession->us_LoggedTime ) > sb->sl_RemoveSessionsAfterTime ) )
			{
				int size = 0;
				if( temp[ 0 ] == 0 )
				{
					size = snprintf( temp, sizeof(temp), "%s", remSession->us_SessionID );
				}
				else
				{
					size = snprintf( temp, sizeof(temp), ",%s", remSession->us_SessionID );
				}
				BufStringAddSize( sqlreq, temp, size );
			
				remsessions[ nr++ ] = remSession;
			}
		}
		BufStringAddSize( sqlreq, ")", 1 );
		
        FRIEND_MUTEX_UNLOCK( &(smgr->usm_Mutex) );
        
		int i;
		for( i=0 ; i < nr ; i++ )
		{
			if( remsessions[ i ] != NULL )
			{
				char tmpmsg[ 2048 ];
				int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session timeout\"}}" );
				
				int msgsndsize = WebSocketSendMessageInt( remsessions[ i ], tmpmsg, lenmsg );
				
				USMUserSessionRemove( smgr, remsessions[ i ] );
				
				smgr->usm_SessionCounter--;
			}
		}
		
		FFree( remsessions );
	}
	
	if( temp[ 0 ] != 0 )
	{
		SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
		if( sqllib != NULL )
		{
			DEBUG("USMRemoveOldSessionsInDB launched\n");
		
			sqllib->QueryWithoutResults( sqllib, sqlreq->bs_Buffer );
		
			sb->LibrarySQLDrop( sb, sqllib );
		}
	}
	BufStringDelete( sqlreq );
	
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
	 
		// we remove old entries older then 6 hours 43200
		snprintf( temp, sizeof(temp), "DELETE from `FUserSession` WHERE LoggedTime != '' AND (%lu-LoggedTime)>%lu", acttime, sb->sl_RemoveSessionsAfterTime );
		DEBUG("USMRemoveOldSessionsDB launched SQL: %s\n", temp );
	 
		sqllib->QueryWithoutResults( sqllib, temp );
	 
		sb->LibrarySQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Send door notification
 *
 * @param usm pointer to UserSessionManager
 * @param notif pointer to DoorNotification
 * @param ses UserSession
 * @param device pointer to RootDevice
 * @param path path to file/folder
 * @return TRUE if user can procced with login procedure or FALSE if error appear
 */
FBOOL USMSendDoorNotification( UserSessionManager *usm, void *notif, UserSession *ses, File *device, char *path )
{
	//return FALSE;
	
	SystemBase *sb = (SystemBase *)usm->usm_SB;
	DoorNotification *notification = (DoorNotification *)notif;
	
	char *tmpmsg = FCalloc( 2048, 1 );
	if( tmpmsg == NULL )
	{
		FERROR("Cannot allocate memory for buffer\n");
		return FALSE;
	}
    
	//
	// Go through logged users
	//
    
	//DEBUG("CHECK11\n");
	if( FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) ) == 0 )
	{
		User *usr = sb->sl_UM->um_Users;
		while( usr != NULL )
		{
			// if notification should be addressed to user
			//DEBUG("[USMSendDoorNotification] going through users, user: %lu\n", usr->u_ID );
			if( usr->u_ID == notification->dn_OwnerID )
			{
				char *uname = usr->u_Name;
				int len = snprintf( tmpmsg, 2048, "{ \"type\":\"msg\", \"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%lu\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", device->f_ID, device->f_Name, path, uname  );
			
				//DEBUG("[USMSendDoorNotification] found ownerid %lu\n", usr->u_ID );
			
				FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
			
				if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
				{
					// go through all User Sessions and send message
					UserSessListEntry *le = usr->u_SessionsList;
					while( le != NULL )
					{
						UserSession *uses = (UserSession *)le->us;
					
						// do not send message to sender
						FBOOL sendNotif = TRUE;
						if( uses == NULL )
						{
							sendNotif = FALSE;
						}
			
						if( sendNotif == TRUE )
						{
							DEBUG("[USMSendDoorNotification] Send message %s function pointer %p sbpointer %p to sessiondevid: %s\n", tmpmsg, sb->WebSocketSendMessage, sb, uses->us_DeviceIdentity );
				
						
							FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
							WebSocketSendMessage( sb, uses, tmpmsg, len );
							FRIEND_MUTEX_LOCK( &(usr->u_Mutex) );

							// send message to all remote users
							RemoteUser *ruser = usr->u_RemoteUsers;
							while( ruser != NULL )
							{
								//DEBUG("[USMSendDoorNotification] Remote user connected: %s\n", ruser->ru_Name );
								RemoteDrive *rdrive = ruser->ru_RemoteDrives;
				
								while( rdrive != NULL )
								{
								//DEBUG("[USMSendDoorNotification] Remote drive connected: %s %lu\n", rdrive->rd_LocalName, rdrive->rd_DriveID );
					
									if( rdrive->rd_DriveID == device->f_ID )
									{
										int fnamei;
										int fpathi;
										int funamei;
										int fdriveid;
						
										char *fname =  createParameter( "devname", rdrive->rd_RemoteName, &fnamei );
										char *fpath =  createParameter( "path", path, &fpathi );
										char *funame =  createParameter( "usrname", ruser->ru_Name, &funamei );
										char *fdeviceid = createParameterFULONG( "deviceid", rdrive->rd_RemoteID, &fdriveid );
						
										MsgItem tags[] = {
											{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
											{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)sb->fcm->fcm_ID },
											{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
											{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
											{ ID_FNOT, (FULONG)0 , MSG_INTEGER_VALUE },
											{ ID_PARM, (FULONG)0, MSG_GROUP_START },
											{ ID_PRMT, (FULONG) fnamei, (FULONG)fname },
											{ ID_PRMT, (FULONG) fpathi, (FULONG)fpath },
											{ ID_PRMT, (FULONG) funamei, (FULONG)funame },
											{ ID_PRMT, (FULONG) fdriveid, (FULONG)fdeviceid },
											{ MSG_GROUP_END, 0,  0 },
											{ TAG_DONE, TAG_DONE, TAG_DONE }
										};
						
										DataForm *df = DataFormNew( tags );
										if( df != NULL )
										{
											//DEBUG("[USMSendDoorNotification] Register device, send notification\n");
							
											BufString *result = SendMessageAndWait( ruser->ru_Connection, df );
											if( result != NULL )
											{
												//DEBUG("[USMSendDoorNotification] Received response\n");
												BufStringDelete( result );
											}
											DataFormDelete( df );
										}
						
										FFree( fdeviceid );
										FFree( fname );
										FFree( fpath );
										FFree( funame );
										break;
									} // if driveID = deviceID
									rdrive = (RemoteDrive *)rdrive->node.mln_Succ;
								} // while remote drives
								ruser = (RemoteUser *)ruser->node.mln_Succ;
							} // while remote users
						} // sendNotif == TRUE
				
						le = (UserSessListEntry *)le->node.mln_Succ;
					} // while loop, session
					//FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
					FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
				} // mutex lock
			
				DEBUG("CHECK12\n");
				FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) );
			}
			usr = (User *)usr->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
	}
	
	FFree( tmpmsg );
	return TRUE;
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
	if( FRIEND_MUTEX_LOCK( &(usm->usm_Mutex) ) == 0 )
	{
		UserSession *ses = usm->usm_Sessions;
		while( ses != NULL )
		{
			UserSessionWebsocket *cl = ses->us_WSConnections;
			if( cl != NULL )
			{
				//TODO check maybe ws connections should be removed?
				/*
				if( ( actTime - cl->wsc_LastPingTime ) < 150 )		// if last call was done 150 secs ago, we can close it
				{
					lws_close_reason( cl->wsc_Wsi, LWS_CLOSE_STATUS_NORMAL, (unsigned char *)"CLOSE", 5 );
					DEBUG("[USMCloseUnusedWebSockets] close WS connection\n");
				}
				*/
			}
			ses = (UserSession *)ses->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(usm->usm_Mutex) );
	}
	DEBUG("[USMCloseUnusedWebSockets] end\n");
}
