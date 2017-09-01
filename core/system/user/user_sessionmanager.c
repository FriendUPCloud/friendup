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
	pthread_mutex_lock( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( strcmp( sessionid, us->us_SessionID ) == 0 )
		{
			pthread_mutex_unlock( &(usm->usm_Mutex) );
			return us->us_User;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	pthread_mutex_unlock( &(usm->usm_Mutex) );
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
	pthread_mutex_lock( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( strcmp( sessionid, us->us_SessionID ) == 0 )
		{
			pthread_mutex_unlock( &(usm->usm_Mutex) );
			return us;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	pthread_mutex_unlock( &(usm->usm_Mutex) );
	return NULL;
}

/**
 * Get UserSession by sessionid from DB
 *
 * @param usm pointer to UserSessionManager
 * @param sessionid sessionid as string
 * @return pointer to UserSession structure
 */

UserSession *USMGetSessionBySessionIDFromDB( UserSessionManager *smgr, char *id )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	struct UserSession *usersession = NULL;
	char tmpQuery[ 1024 ];
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	
	int entries = 0;
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," SessionID='%s'", id );
	
	DEBUG( "[USMGetSessionBySessionIDFromDB] Sending query: %s...\n", tmpQuery );
	
	// You added 'where' and on the end you did not used it??
	
	//usersession = ( UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, NULL, &entries );
	usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
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
	pthread_mutex_lock( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( us->us_UserID == uid && strcmp( devid, us->us_SessionID ) == 0 )
		{
			pthread_mutex_unlock( &(usm->usm_Mutex) );
			return us;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	pthread_mutex_unlock( &(usm->usm_Mutex) );
	return NULL;
}

/**
 * Get UserSession by deviceid and user id from Database
 *
 * @param usm pointer to UserSessionManager
 * @param devid device id as string
 * @param uid user id as unsigned integer value
 * @return UserSession structure
 */

UserSession *USMGetSessionByDeviceIDandUserDB( UserSessionManager *smgr, char *devid, FULONG uid )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	struct UserSession *usersession = NULL;
	char tmpQuery[ 1024 ];
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	
	int entries = 0;
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," ( DeviceIdentity='%s' AND UserID = %ld )", devid, uid );
	
	DEBUG( "[USMGetSessionByDeviceIDandUserDB] Sending query: %s...\n", tmpQuery );
	
	// You added 'where' and on the end you did not used it??
	
	//usersession = ( UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, NULL, &entries );
	usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
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
	//  we  will take only first session of that user
	pthread_mutex_lock( &(usm->usm_Mutex) );
	UserSession *us = usm->usm_Sessions;
	while( us != NULL )
	{
		if( us->us_User  != NULL  && us->us_User->u_ID == id )
		{
			pthread_mutex_unlock( &(usm->usm_Mutex) );
			return us->us_User->u_SessionsList->us;
		}
		us = (UserSession *) us->node.mln_Succ;
	}
	pthread_mutex_unlock( &(usm->usm_Mutex) );
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
	User *lu =um->um_Users;
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
 * @param usm pointer to UserSessionManager
 * @param id user id as integer value
 * @return UserSession structure
 */

UserSession *USMGetSessionsByTimeout( UserSessionManager *smgr, const FULONG timeout )
{
	SystemBase *sb = (SystemBase *)smgr->usm_SB;
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	time_t timestamp = time ( NULL );
	struct UserSession *usersession = NULL;
	int entries = 0;
	char tmpQuery[ 1024 ];
	
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
	
	// You added 'where' and on the end you did not used it??
	
	//usersession = ( UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, NULL, &entries );
	usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
    UserSession *ses = usersession;
    while( ses != NULL )
    {
        INFO("Loaded sessionid: %s id %lu\n", ses->us_SessionID, ses->us_ID );
        ses = (UserSession *)ses->node.mln_Succ;
    }
    
	sb->LibraryMYSQLDrop( sb, sqlLib );

	DEBUG("[USMGetSessionsByTimeout] UserGetByTimeout end\n");
	return usersession;
}

/**
 * Add file to user session
 *
 * @param smgr pointer to UserSessionManager
 * @param ses pointer to user session to which file will be added
 * @param f pointer to file which will be added to user session
 * @return 0 if everything will go ok, otherwise error number
 */

int USMAddFile( UserSessionManager *smgr, UserSession *ses, File *f )
{
	f->node.mln_Succ = (MinNode *) ses->us_OpenedFiles;
	ses->us_OpenedFiles = f;
	
	return 0;
}

/**
 * Remove file from user session
 *
 * @param smgr pointer to UserSessionManager
 * @param ses pointer to user session from which file will be removed
 * @param id id of the file which will be removed from user session
 * @return 0 if everything will go ok, otherwise error number
 */

int USMRemFile( UserSessionManager *smgr, UserSession *ses, FULONG id )
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
 * @param smgr pointer to UserSessionManager
 * @param ses pointer to user session from which file will be taken
 * @param id id of the file which will be taken from user session
 * @return pointer to File structure when success, otherwise NULL
 */

File *USMGetFile( UserSessionManager *smgr, UserSession *ses, FULONG id )
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
 * Add user session to global user sessions list
 *
 * @param smgr pointer to UserSessionManager
 * @param s pointer to user session which  will be added
 * @return UserSession if success, otherwise NULL
 */

UserSession *USMUserSessionAdd( UserSessionManager *smgr, UserSession *s )
{
	DEBUG("[USMUserSessionAdd] start\n");
	
	FBOOL userHaveMoreSessions = FALSE;
	FBOOL duplicateMasterSession = FALSE;
	
	pthread_mutex_lock( &(smgr->usm_Mutex) );
	UserSession  *ses =  smgr->usm_Sessions;
	while( ses != NULL )
	{
		if( ses->us_DeviceIdentity != NULL )
		{
			if( s->us_UserID == ses->us_UserID && strcmp( s->us_DeviceIdentity, ses->us_DeviceIdentity ) ==  0 )
			{
				DEBUG("[USMUserSessionAdd] Session found, no need to create new  one %lu devid %s\n", ses->us_UserID, ses->us_DeviceIdentity );
				break;
			}
		}
		else
		{
			if( ses->us_DeviceIdentity == s->us_DeviceIdentity )
			{
				DEBUG("[USMUserSessionAdd] Found session with empty deviceid\n");
				break;
			}
		}
		
		ses =  (UserSession *)ses->node.mln_Succ;
	}

	// if session doesnt exist in memory we must add it to the list
	
	if( ses ==  NULL )
	{
		INFO("[USMUserSessionAdd] Add UserSession to User. SessionID: %s\n", s->us_SessionID );
	
		//lastuser->node.mln_Succ = (struct MinNode *)loggedUser;
		//loggedUser->node.mln_Pred = (struct MinNode *)lastuser;
		s->node.mln_Succ = (MinNode *)smgr->usm_Sessions;
		smgr->usm_Sessions = s;
	}
	else
	{
		duplicateMasterSession = TRUE;
		s = ses;
	}
	pthread_mutex_unlock( &(smgr->usm_Mutex) );
	
	DEBUG("[USMUserSessionAdd] Checking session id %lu\n",  s->us_UserID );
	
	if( s->us_UserID != 0 )
	{
		UserManager *um = (UserManager *)smgr->usm_UM;
		User *locusr = um->um_Users;
		
		if( s->us_User != NULL )
		{
			locusr = s->us_User;
		}
		else
		{
			while( locusr != NULL )
			{
				if( locusr->u_ID == s->us_UserID )
				{
					if( locusr->u_SessionsNr > 0 )
					{
						userHaveMoreSessions = TRUE;
					}
					break;
				}
				locusr  = (User *)locusr->node.mln_Succ;
			}
		}
		
		if( locusr == NULL )
		{
			DEBUG("[USMUserSessionAdd] User found in DB, generate new master session for him and his devices\n");
			locusr = UMUserGetByIDDB( um, s->us_UserID );
		}
		
		if( locusr == NULL )
		{
			FERROR("Cannot get user by ID\n");
			//pthread_mutex_unlock( &(smgr->usm_Mutex) );
			return NULL;
		}
		else
		{
			DEBUG("[USMUserSessionAdd] User added to user %s main sessionid %s\n", locusr->u_Name, locusr->u_MainSessionID );
			
			pthread_mutex_lock( &(smgr->usm_Mutex) );
			UserAddSession( locusr, s );
			s->us_User = locusr;
			
			//DEBUG("New session was added session master %s user session %s does user have more sessions %d\n", loggedSession->us_MasterSession, loggedSession->us_User->u_MainSessionID, userHaveMoreSessions );
			if( userHaveMoreSessions == FALSE )
			{
				if( locusr != NULL )
				{
					UserRegenerateSessionID( locusr, NULL );
				}
				
				DEBUG("[USMUserSessionAdd] SessionID will be overwriten\n");
			}
			pthread_mutex_unlock( &(smgr->usm_Mutex) );
		}
	}
	else
	{
		FERROR("Couldnt find user with ID %lu\n", s->us_UserID );
		return NULL;
	}
	return s;
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
	
	pthread_mutex_lock( &(smgr->usm_Mutex) );
	
	if( remsess == smgr->usm_Sessions )
	{
		smgr->usm_Sessions = (UserSession *)smgr->usm_Sessions->node.mln_Succ;
		UserSession *nexts = (UserSession *)sess->node.mln_Succ;
		if( nexts != NULL )
		{
			nexts->node.mln_Pred = (MinNode *)NULL;
		}
		sessionRemoved = TRUE;
		INFO("[USMUserSessionRemove] Session removed from list\n");
	}
	else
	{
		while( sess != NULL )
		{
			prev = sess;
			sess = (UserSession *)sess->node.mln_Succ;
			
			if( sess == remsess )
			{
				prev->node.mln_Succ = (MinNode *)sess->node.mln_Succ;
				UserSession *nexts = (UserSession *)sess->node.mln_Succ;
				if( nexts != NULL )
				{
					nexts->node.mln_Pred = (MinNode *)prev;
				}
				DEBUG("[USMUserSessionRemove] Session removed from list\n");
				sessionRemoved = TRUE;
				break;
			}
		}
	}
	pthread_mutex_unlock( &(smgr->usm_Mutex) );
	
	if( sessionRemoved == TRUE )
	{
		UserSessionDelete( remsess );
	}

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
	//pthread_mutex_lock( &(smgr->usm_Mutex) );
	
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
					//pthread_mutex_unlock( &(smgr->usm_Mutex) );
					return s->us_SessionID;
				}
			}
			us = (UserSessListEntry *)us->node.mln_Succ;
		}
		//pthread_mutex_unlock( &(smgr->usm_Mutex) );
		return sessionid;
	}
	
	//pthread_mutex_unlock( &(smgr->usm_Mutex) );
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
	SystemBase *sb = (SystemBase *) smgr->usm_SB;
	MYSQLLibrary *sqllib  = sb->LibraryMYSQLGet( sb );
	
	DEBUG("[USMSessionSaveDB] start\n");
	if( sqllib != NULL )
	{
		//
		// checking if entry exist in db
		//
		
		int error = 0;
		char temptext[ 512 ];
		
		sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "SELECT ID FROM `FUserSession` WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", ses->us_DeviceIdentity,  ses->us_UserID );

		MYSQL_RES *res = sqllib->Query( sqllib, temptext );
		MYSQL_ROW row;
		int numberEntries = 0;
	
		if( res != NULL )
		{
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				numberEntries++;
			}
			sqllib->FreeResult( sqllib, res );
		}
		
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
		
		sb->LibraryMYSQLDrop( sb, sqllib );
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
	//pthread_mutex_lock( &(smgr->usm_Mutex) );
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
	//pthread_mutex_unlock( &(smgr->usm_Mutex) );
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
	
	// we are conting maximum number of sessions
	//pthread_mutex_lock( &(smgr->usm_Mutex) );
    pthread_mutex_lock( &(smgr->usm_Mutex) );
	int nr = 0;
	UserSession *cntses = smgr->usm_Sessions;
	while( cntses != NULL )
	{
		nr++;
		cntses = (UserSession *)cntses->node.mln_Succ;
	}
	pthread_mutex_unlock( &(smgr->usm_Mutex) );
	
	// now we are adding entries  which will be removed to array
	
	UserSession **remsessions = FCalloc( nr, sizeof(UserSession *) );
	if( remsessions != NULL )
	{
        //pthread_mutex_lock( &(sb->sl_SessionMutex) );
        pthread_mutex_lock( &(smgr->usm_Mutex) );
        
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
		
			if( canDelete == TRUE && ( ( acttime -  remSession->us_LoggedTime ) > REMOVE_SESSIONS_AFTER_TIME ) )
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
		
        pthread_mutex_unlock( &(smgr->usm_Mutex) );
        //pthread_mutex_unlock( &(sb->sl_SessionMutex) );
        
		int i;
		for( i=0 ; i < nr ; i++ )
		{
			if( remsessions[ i ] != NULL )
			{
				USMUserSessionRemove( smgr, remsessions[ i ] );
			}
		}
		
		FFree( remsessions );
	}
	
	if( temp[ 0 ] != 0 )
	{
		MYSQLLibrary *sqllib = sb->LibraryMYSQLGet( sb );
		if( sqllib != NULL )
		{
			DEBUG("USMRemoveOldSessionsInDB launched\n");
		
			sqllib->QueryWithoutResults( sqllib, sqlreq->bs_Buffer );
		
			sb->LibraryMYSQLDrop( sb, sqllib );
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

	 MYSQLLibrary *sqllib = sb->LibraryMYSQLGet( sb );
	 if( sqllib != NULL )
	 {
		DEBUG("\n");
		char temp[ 1024 ];
	 
		// we remove old entries older then 6 hours 43200
		snprintf( temp, sizeof(temp), "DELETE from `FUserSession` WHERE LoggedTime != '' AND (%lu-LoggedTime)>"REMOVE_SESSIONS_AFTER_TIME_STRING, acttime );
		DEBUG("USMRemoveOldSessionsDB launched SQL: %s\n", temp );
	 
		sqllib->QueryWithoutResults( sqllib, temp );
	 
		sb->LibraryMYSQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Send door notification
 *
 * @param usm pointer to UserSessionManager
 * @param name username which will be checked
 * @param numberOfFail if last failed logins will have same value as this variable then login possibility will be blocked for some period of time
 * @param lastLoginTime in this field infomration about last login time will be stored
 * @return TRUE if user can procced with login procedure or FALSE if error appear
 */
FBOOL USMSendDoorNotification( UserSessionManager *usm, void *notif, File *device, char *path )
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
    
    //pthread_mutex_lock( &(usm->usm_Mutex) );
	User *usr = sb->sl_UM->um_Users;
	while( usr != NULL )
	{
		if( usr->u_ID == notification->dn_OwnerID )
		{
			char *uname = usr->u_Name;
			
			UserSessListEntry *le = usr->u_SessionsList;
			while( le != NULL )
			{
				UserSession *uses = (UserSession *)le->us;
			
				int len = snprintf( tmpmsg, 2048, "{ \"type\":\"msg\", \"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%lu\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", device->f_ID, device->f_Name, path, uname  );
			
				DEBUG("[DoorNotificationCommunicateChanges] Send message %s function pointer %p sbpointer %p to sessiondevid: %s\n", tmpmsg, sb->WebSocketSendMessage, sb, uses->us_DeviceIdentity );
				
				WebSocketSendMessage( sb, uses, tmpmsg, len );

				RemoteUser *ruser = usr->u_RemoteUsers;
				while( ruser != NULL )
				{
					DEBUG("[DoorNotificationCommunicateChanges] Remote user connected: %s\n", ruser->ru_Name );
					RemoteDrive *rdrive = ruser->ru_RemoteDrives;
				
                    while( rdrive != NULL )
					{
						DEBUG("[DoorNotificationCommunicateChanges] Remote drive connected: %s %lu\n", rdrive->rd_LocalName, rdrive->rd_DriveID );
					
						if( rdrive->rd_DriveID == device->f_ID )
						{
							char devid[ 128 ];
						
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
								DEBUG("[DoorNotificationCommunicateChanges] Register device, send notification\n");
							
								BufString *result = SendMessageAndWait( ruser->ru_Connection, df );
								if( result != NULL )
								{
									DEBUG("[DoorNotificationCommunicateChanges] Received response\n");
									BufStringDelete( result );
								}
								DataFormDelete( df );
							}
						
							FFree( fdeviceid );
							FFree( fname );
							FFree( fpath );
							FFree( funame );
							break;
						}
						rdrive = (RemoteDrive *)rdrive->node.mln_Succ;
					}
					ruser = (RemoteUser *)ruser->node.mln_Succ;
				}
				
				le = (UserSessListEntry *)le->node.mln_Succ;
			} // if ->usr == NULL
		}
		usr = (User *)usr->node.mln_Succ;
	}
	//pthread_mutex_unlock( &(usm->usm_Mutex) );
	
    /*
	pthread_mutex_lock( &(usm->usm_Mutex) );
	UserSession *uses = usm->usm_Sessions;
	while( uses != NULL )
	{
		if( uses->us_ID == notification->dn_OwnerID )
		{
			char *uname = NULL;
			
			if( uses->us_User != NULL )
			{
				uname = uses->us_User->u_Name;
			}
			
			pthread_mutex_unlock( &(usm->usm_Mutex) );
			uses->us_NRConnections++;
			
			int len = snprintf( tmpmsg, 2048, "{ \"type\":\"msg\", \"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%lu\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", device->f_ID, device->f_Name, path, uname  );
			
            DEBUG("[DoorNotificationCommunicateChanges] Send message %s function pointer %p sbpointer %p to sessiondevid: %s\n", tmpmsg, sb->WebSocketSendMessage, sb, uses->us_DeviceIdentity );
			WebSocketSendMessage( sb, uses, tmpmsg, len );
			
			//pthread_mutex_lock( &(uses->us_Mutex) );
			if( uses->us_User == NULL )
			{
                
			}
			else
			{
				RemoteUser *ruser = uses->us_User->u_RemoteUsers;
				while( ruser != NULL )
				{
					DEBUG("[DoorNotificationCommunicateChanges] Remote user connected: %s\n", ruser->ru_Name );
					RemoteDrive *rdrive = ruser->ru_RemoteDrives;
				
                    while( rdrive != NULL )
					{
						DEBUG("[DoorNotificationCommunicateChanges] Remote drive connected: %s %lu\n", rdrive->rd_LocalName, rdrive->rd_DriveID );
					
						if( rdrive->rd_DriveID == device->f_ID )
						{
							char devid[ 128 ];
						
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
								DEBUG("[DoorNotificationCommunicateChanges] Register device, send notification\n");
							
								BufString *result = SendMessageAndWait( ruser->ru_Connection, df );
								if( result != NULL )
								{
									DEBUG("[DoorNotificationCommunicateChanges] Received response\n");
									BufStringDelete( result );
								}
								DataFormDelete( df );
							}
						
							FFree( fdeviceid );
							FFree( fname );
							FFree( fpath );
							FFree( funame );
							break;
						}
						rdrive = (RemoteDrive *)rdrive->node.mln_Succ;
					}
					ruser = (RemoteUser *)ruser->node.mln_Succ;
				}
			} // if ->usr == NULL
			
			uses->us_NRConnections--;
			//pthread_mutex_unlock( &(uses->us_Mutex) );
			
			pthread_mutex_lock( &(usm->usm_Mutex) );
		}
		uses = (UserSession *)uses->node.mln_Succ;
	}
	pthread_mutex_unlock( &(usm->usm_Mutex) );
	*/
    
	FFree( tmpmsg );
	return TRUE;
}
