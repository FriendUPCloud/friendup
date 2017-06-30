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
		UserSession  *ls = smgr->usm_Sessions;
		while( ls != NULL )
		{
			UserSession *rem =  ls;
			ls = (UserSession *) ls->node.mln_Succ;
			
			UserSessionDelete( rem );
		}
		
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

UserSession *USMGetSessionBySessionID( UserSessionManager *usm, const char *sessionid )
{
	DEBUG("sesssion id %s\n", sessionid );
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
 * Get UserSession by deviceid and user id
 *
 * @param usm pointer to UserSessionManager
 * @param devid device id as string
 * @param uid user id as unsigned integer value
 * @return UserSession structure
 */

UserSession *USMGetSessionByDeviceIDandUser( UserSessionManager *usm, const char *devid, FULONG uid )
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

UserSession *USMGetSessionByDeviceIDandUserDB( UserSessionManager *smgr, const char *devid, FULONG uid )
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
	//snprintf( tmpQuery, sizeof(tmpQuery)," ( DeviceIdentity='%s' AND UserID = %ld )", devid, uid );
	sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery)," ( DeviceIdentity='%s' AND UserID = %ld )", devid, uid );
	
	DEBUG( "[USMGetSessionsByTimeout] Sending query: %s...\n", tmpQuery );
	
	// You added 'where' and on the end you did not used it??
	
	//usersession = ( UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, NULL, &entries );
	usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );
	
	DEBUG("UserGetByTimeout end\n");
	return usersession;
	return NULL;
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
		//snprintf( tmpQuery, sizeof(tmpQuery), "( LoggedTime > '%lld' OR  `UserID` in( SELECT ID FROM `FUser` WHERE `Name`='%s') )", (long long int)(timestamp - timeout), sent->s_ConfigUsername );
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "( LoggedTime > '%lld' OR  `UserID` in( SELECT ID FROM `FUser` WHERE `Name`='%s') )", (long long int)(timestamp - timeout), sent->s_ConfigUsername );
	}
	else
	{
		//snprintf( tmpQuery, sizeof(tmpQuery), " ( LoggedTime > '%lld' )", (long long int)(timestamp - timeout) );
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), " ( LoggedTime > '%lld' )", (long long int)(timestamp - timeout) );
	}
	
	DEBUG( "[USMGetSessionsByTimeout] Sending query: %s...\n", tmpQuery );
	
	// You added 'where' and on the end you did not used it??
	
	//usersession = ( UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, NULL, &entries );
	usersession = ( struct UserSession *)sqlLib->Load( sqlLib, UserSessionDesc, tmpQuery, &entries );
	sb->LibraryMYSQLDrop( sb, sqlLib );

	DEBUG("UserGetByTimeout end\n");
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
				
			DEBUG("CLOSE ACtfs ptr %p\n",  actFS );
			DEBUG("CLOSE f %p openedfile %p\n",  f, ses->us_OpenedFiles );
			
			if( f == ses->us_OpenedFiles )
			{
				ses->us_OpenedFiles =(File *)f->node.mln_Succ;
			}
			else
			{
				prevfile->node.mln_Succ = f->node.mln_Succ;
			}
			
			actFS->FileClose( actDev, f );
			//FileDelete( f );
			DEBUG("File freed, removed from list\n");
			
			break;
		}
		
		prevfile = f;
		f = (File *)f->node.mln_Succ;
		DEBUG("RAWClose finished\n");
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
	FBOOL userHaveMoreSessions = FALSE;
	FBOOL duplicateMasterSession = FALSE;
	
	pthread_mutex_lock( &(smgr->usm_Mutex) );
	UserSession  *ses =  smgr->usm_Sessions;
	while( ses != NULL )
	{
		if( ses->us_DeviceIdentity != NULL )
		{
			//DEBUG("Found session with deviceid %s\n", ses->us_DeviceIdentity );
			if( s->us_UserID == ses->us_UserID && strcmp( s->us_DeviceIdentity, ses->us_DeviceIdentity ) ==  0 )
			{
				DEBUG("Session found, no need to create new  one %lu   devid %s\n", ses->us_UserID, ses->us_DeviceIdentity );
				break;
			}
		}
		else
		{
			DEBUG("Found session without deviceid\n");
			if( ses->us_DeviceIdentity == s->us_DeviceIdentity )
			{
				DEBUG("Found session with empty deviceid\n");
				break;
			}
		}
		
		ses =  (UserSession *)ses->node.mln_Succ;
	}
	
	DEBUG("Went through sessions\n");
	
	// if session doesnt exist in memory we must add it to the list
	
	if( ses ==  NULL )
	{
		if( smgr->usm_Sessions == NULL )	// list is empty
		{
			smgr->usm_Sessions = s;
		}
		else
		{
			FERROR("\n\n\nSECOND USER\nsessid %s\n\n\n", s->us_SessionID );
	
			//lastuser->node.mln_Succ = (struct MinNode *)loggedUser;
			//loggedUser->node.mln_Pred = (struct MinNode *)lastuser;
			s->node.mln_Succ = (MinNode *)smgr->usm_Sessions;
			smgr->usm_Sessions = s;
		}
	}
	else
	{
		duplicateMasterSession = TRUE;
		s = ses;
	}
	pthread_mutex_unlock( &(smgr->usm_Mutex) );
	
	DEBUG("Checking session id %lu\n",  s->us_UserID );
	
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
				//DEBUG("list  user id %lu  find usr id %lu\n", locusr->u_ID, s->us_UserID );
				if( locusr->u_ID == s->us_UserID )
				{
					DEBUG("User found in memory, pointer to sessions %p and number %d\n", locusr->u_SessionsList, locusr->u_SessionsNr );
					
					if( locusr->u_SessionsNr > 0 )
					{
						userHaveMoreSessions = TRUE;
						// now we must update master session
						/*
						UserSessList *sli = locusr->u_SessionsList;
						while( sli != NULL )
						{
							if( sli->us != NULL )
							{
								UserSession *mus = (UserSession *)sli->us;
								if( mus != NULL )
								{
									if( mus->us_MasterSession != NULL )
									{
										FFree( mus->us_MasterSession );
									}
									
									mus->us_MasterSession = s->us_MasterSession;
								}
							}
							sli = (UserSessList *)sli->node.mln_Succ;
						}
						*/
					}
					break;
				}
				locusr  = (User *)locusr->node.mln_Succ;
			}
		}
		
		if( locusr == NULL )
		{
			DEBUG("User found in DB, generate new master session for him and his devices\n");
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
			/*
			if( duplicateMasterSession == TRUE )
			{
				if( ses->us_MasterSession == NULL )
				{
					DEBUG("Session duplicated\n");
					DEBUG("Session will be overwriten\n");
					char buf[ 256 ];
					snprintf( buf, sizeof(buf), "%lu", locusr->u_ID );
					
					ses->us_MasterSession = StringDuplicate( buf );
					//ses->us_MasterSession = StringDuplicate( s->us_User->u_MainSessionID );
				}
			}
			*/
			
			DEBUG("User added to user %s  main sessionid %s\n", locusr->u_Name, locusr->u_MainSessionID );
			
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
				
				DEBUG("Session will be overwriten\n");
				/*
				char buf[ 256 ];
				snprintf( buf, sizeof(buf), "%lu", locusr->u_ID );
				
				if( s->us_User->u_MainSessionID != NULL )
				{
					FFree( s->us_User->u_MainSessionID );
					s->us_User->u_MainSessionID = StringDuplicate(  buf );
				}
				else
				{
					s->us_User->u_MainSessionID = StringDuplicate( buf );
				}
				*/
				
				/*
				if( s->us_User->u_MainSessionID != NULL )
				{
					FFree( s->us_User->u_MainSessionID );
					s->us_User->u_MainSessionID = StringDuplicate(  s->us_MasterSession );
				}
				else
				{
					s->us_User->u_MainSessionID = StringDuplicate( s->us_MasterSession );
				}
				*/
			}
			pthread_mutex_unlock( &(smgr->usm_Mutex) );
		}
	}
	else
	{
		FERROR("Couldnt find user with ID %lu\n", s->us_UserID );
		//pthread_mutex_unlock( &(smgr->usm_Mutex) );
		return NULL;
	}
	
	//pthread_mutex_unlock( &(smgr->usm_Mutex) );
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
	//pthread_mutex_lock( &(smgr->usm_Mutex) );
	
	UserSession *sess = smgr->usm_Sessions;
	UserSession *prev = sess;
	FBOOL sessionRemoved = FALSE;
	
	DEBUG("UserSessionRemove\n");
	
	if( remsess == smgr->usm_Sessions )
	{
		smgr->usm_Sessions = (UserSession *)smgr->usm_Sessions->node.mln_Succ;
		UserSession *nexts = (UserSession *)sess->node.mln_Succ;
		if( nexts != NULL )
		{
			nexts->node.mln_Pred = (MinNode *)NULL;
		}
		sessionRemoved = TRUE;
		INFO("Session removed\n");
	}
	else
	{
		INFO("Session was not first one\n");
		while( sess != NULL )
		{
			prev = sess;
			sess = (UserSession *)sess->node.mln_Succ;
			
			if( sess == remsess )
			{
				DEBUG("Removeing session\n");
				prev->node.mln_Succ = (MinNode *)sess->node.mln_Succ;
				UserSession *nexts = (UserSession *)sess->node.mln_Succ;
				if( nexts != NULL )
				{
					nexts->node.mln_Pred = (MinNode *)prev;
				}
				sessionRemoved = TRUE;
				break;
			}
		}
	}
	
	if( sessionRemoved == TRUE )
	{
		User *usr = remsess->us_User;
		
		DEBUG("Remove session %p\n", remsess );
		// remove session from user
		UserRemoveSession( remsess->us_User, remsess );
		//sess->us_User = NULL;
		
		if( usr->u_SessionsNr == 0 )
		{
			/*
			// we must remove user from list
			UserManager *um = (UserManager *)smgr->usm_UM;
			User *locusr = um->um_Users;
			if( um->um_Users == usr )
			{
				um->um_Users->node.mln_Succ = (MinNode *)usr;
			}
			else
			{
				User *prevusr = locusr;
				while( locusr != NULL )
				{
					if( locusr == usr )
					{
						prevusr->node.mln_Succ = locusr->node.mln_Succ;
						User *nextusr = (User *)locusr->node.mln_Succ;
						if( nextusr != NULL )
						{
							nextusr->node.mln_Pred = (MinNode *) prevusr;
						}
						
						break;
					}
					prevusr = locusr;
					locusr = (User *) locusr->node.mln_Succ;
				}
			}
			// we should check if user have more sessions
			UserDelete( usr );
			usr = NULL;
			*/
		}
	}
	//pthread_mutex_unlock( &(smgr->usm_Mutex) );
	
	return 0;
}

/**
 * Get first active user sessionid
 *
 * @param smgr pointer to UserSessionManager
 * @param usr point to User structure from which session will be taken
 * @return pointer to sessionid string
 */

char *USMUserGetActiveSessionID( UserSessionManager *smgr, User *usr )
{
	//pthread_mutex_lock( &(smgr->usm_Mutex) );
	
	//TODO get  only active  session
	if( smgr != NULL && usr != NULL )
	{
		char *sessionid = NULL;
		
		UserSessList *us  = usr->u_SessionsList;
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
			us = (UserSessList *)us->node.mln_Succ;
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
	
	DEBUG("Store session\n");
	if( sqllib != NULL )
	{
		//
		// checking if entry exist in db
		//
		
		int error = 0;
		char temptext[ 512 ];
		
		sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "SELECT ID FROM `FUserSession` WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", ses->us_DeviceIdentity,  ses->us_UserID );
		//snprintf( temptext, sizeof(temptext), "SELECT ID FROM `FUserSession` WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", ses->us_DeviceIdentity,  ses->us_UserID );
		
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
				DEBUG("Session stored\n");
			}
		}
		else
		{
			DEBUG("Session already exist in DB\n");
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
			DEBUG("SESSIONS----\n USER %s ID %ld\nsessionid %s mastersesid %s device %s\n\n", lses->us_User->u_Name, lses->us_ID, lses->us_SessionID, lses->us_User->u_MainSessionID, lses->us_DeviceIdentity );
		}
		else
		{
			DEBUG("SESSIONS----\n USER %s ID %ld\nsessionid %s mastersesid %s device %s\n\n", "NOUSER!", lses->us_ID, lses->us_SessionID, lses->us_User->u_MainSessionID, lses->us_DeviceIdentity );
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

// 3h timeout
//#define REMOVE_SESSIONS_AFTER_TIME 10800
//#define REMOVE_SESSIONS_AFTER_TIME_STRING "10800"
#define REMOVE_SESSIONS_AFTER_TIME 60
#define REMOVE_SESSIONS_AFTER_TIME_STRING "60"

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
	
	DEBUG("USMRemoveOldSessions LSB %p\n", lsb );
	/*  //old version
	MYSQLLibrary *sqllib = sb->LibraryMYSQLGet( sb );
	if( sqllib != NULL )
	{
		DEBUG("USMRemoveOldSessions launched\n");
		char temp[ 1024 ];
		
		// we remove old entries older then 6 hours 43200
		//sqllib->SNPrintF( sqllib, temp, sizeof(temp), "DELETE from `FUserSession` WHERE (%lu-LoggedTime)>"REMOVE_SESSIONS_AFTER_TIME_STRING" AND NOT (DeviceIdentity='remote' AND UserID=%lu)", acttime, sentID );
		snprintf( temp, sizeof(temp), "DELETE from `FUserSession` WHERE LoggedTime != "" AND (%lu-LoggedTime)>"REMOVE_SESSIONS_AFTER_TIME_STRING, acttime );
		DEBUG("Call: %s\n", temp );
		
		sqllib->QueryWithoutResults( sqllib, temp );
		
		sb->LibraryMYSQLDrop( sb, sqllib );
	}
	*/
	BufString *sqlreq = BufStringNew();
	BufStringAdd( sqlreq,  "DELETE from `FUserSession` WHERE SessionID in(" );
	char temp[ 512 ];
	temp[ 0 ] = 0;
	
	// remove sessions from memory
	UserSessionManager *smgr = sb->sl_USM;
	
	pthread_mutex_lock( &(smgr->usm_Mutex) );
	UserSession *actSession = smgr->usm_Sessions;
	UserSession *remSession = actSession;
	
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
			
			USMUserSessionRemove( smgr, remSession );
		}
	}
	BufStringAddSize( sqlreq, ")", 1 );
	//DEBUG("\n--------------------------------------------\n");
	
	pthread_mutex_unlock( &(smgr->usm_Mutex) );
	
	MYSQLLibrary *sqllib = sb->LibraryMYSQLGet( sb );
	if( sqllib != NULL )
	{
		DEBUG("USMRemoveOldSessionsInDB launched\n");
		
		sqllib->QueryWithoutResults( sqllib, sqlreq->bs_Buffer );
		
		sb->LibraryMYSQLDrop( sb, sqllib );
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
	
	DEBUG("USMRemoveOldSessions LSB %p\n", lsb );

	 MYSQLLibrary *sqllib = sb->LibraryMYSQLGet( sb );
	 if( sqllib != NULL )
	 {
		DEBUG("USMRemoveOldSessions launched\n");
		char temp[ 1024 ];
	 
		// we remove old entries older then 6 hours 43200
		snprintf( temp, sizeof(temp), "DELETE from `FUserSession` WHERE LoggedTime != "" AND (%lu-LoggedTime)>"REMOVE_SESSIONS_AFTER_TIME_STRING, acttime );
		DEBUG("Call: %s\n", temp );
	 
		sqllib->QueryWithoutResults( sqllib, temp );
	 
		sb->LibraryMYSQLDrop( sb, sqllib );
	}
	return 0;
}
