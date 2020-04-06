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
 *  FCDB auth module code
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2017
 */

#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <openssl/sha.h>
#include <string.h>
#include <interface/properties_interface.h>
#include <system/user/user.h>
#include <util/sha256.h>
#include <util/session_id.h>
#include <network/websocket_client.h>

#include <system/user/user_sessionmanager.h>
#include <system/systembase.h>
#include <system/user/user_manager.h>
#include <system/user/user_sessionmanager.h>

#define LIB_NAME "fcdb.authmod"
#define LIB_VERSION			1
#define LIB_REVISION		0

//
// init library
//


typedef struct SpecialData
{
	int test;
}SpecialData;

/**
 * Initialize authmodule
 *
 * @param l pointer to AuthMod
 * @param sb pointer to SystemBase
 * @return 0 when success, otherwise error number
 */
int libInit( AuthMod *l, void *sb )
{
	DEBUG("[FCDB] libinit\n");

	if( ( l->SpecialData = FCalloc( 1, sizeof( struct SpecialData ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for authmodule\n");
		return 1;
	}

	l->am_Name = LIB_NAME;
	l->am_Version = LIB_VERSION;
	l->sb = sb;

	return 0;
}

/**
 * De-initialize authmodule
 *
 * @param l pointer to AuthMod
 */
void libClose( struct AuthMod *l )
{
	if( l->SpecialData != NULL )
	{
		FFree( l->SpecialData );
	}
	
	DEBUG("[FCDB] close\n");
}

/**
 * Return AuthMod version
 *
 * @return AuthMod version
 */
long GetVersion(void)
{
	return LIB_VERSION;
}

/**
 * Return AuthMod revision
 *
 * @return AuthMod revision
 */
long GetRevision(void)
{
	return LIB_REVISION;
}

#define FUP_AUTHERR_PASSWORD	1
#define FUP_AUTHERR_TIMEOUT		2
#define FUP_AUTHERR_UPDATE		3
#define FUP_AUTHERR_USRNOTFOUND	4
#define FUP_AUTHERR_WRONGSESID	5
#define FUP_AUTHERR_USER		6
#define RANDOM_WAITING_TIME 20

/**
 * Check user password
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param usr pointer to User structure
 * @param pass password provided
 * @param blockTime pointer to integer value where blocked account time will be returned (int seconds)
 * @return TRUE when success, otherwise FALSE
 */
FBOOL CheckPassword( struct AuthMod *l, Http *r __attribute__((unused)), User *usr, char *pass, FULONG *blockTime )
{
	if( usr == NULL )
	{
		FERROR("Cannot check password for usr = NULL\n");
		return FALSE;
	}
	
	//
	// checking if last user login attempts failed, if yes, then we cannot continue
	//
	*blockTime = 0;
	DEBUG("SystemBase\n");
	
	SystemBase *sb = (SystemBase *)l->sb;
	{
		DEBUG("SystemBase ptr %p\n", sb );
		time_t tm = 0;
		time_t tm_now = time( NULL );
		FBOOL access = sb->sl_UserManagerInterface.UMGetLoginPossibilityLastLogins( sb->sl_UM, usr->u_Name, l->am_BlockAccountAttempts, &tm );
		
		DEBUG("[FCDB] Authentication, access flag set: %d, time difference between last login attempt and now %lu\n", (int)access, (unsigned long)( tm_now - tm ) );
		// if last 3 access failed you must wait one hour from last login attempt
		if( access == FALSE && ( (tm_now - tm ) < l->am_BlockAccountTimeout) )
		{
			//int max = rand( )%RANDOM_WAITING_TIME;
			
			// This "hack" will give login machine feeling that FC is doing something in DB
			
			//sleep( max );
			
			FERROR("User: %s was trying to login 3 times in a row (fail login attempts)\n", usr->u_Name );
			sb->sl_UserManagerInterface.UMStoreLoginAttempt( sb->sl_UM, usr->u_Name, "Login fail", "Last login attempts fail" );
			
			*blockTime = (FULONG) (tm_now + l->am_BlockAccountTimeout);
			
			return FALSE;
		}
	}
	
	if( usr->u_Password[ 0 ] == '{' &&
		usr->u_Password[ 1 ] == 'S' &&
		usr->u_Password[ 2 ] == '6' &&
		usr->u_Password[ 3 ] == '}' )
	{
		if( pass != NULL )
		{
			FBOOL passS6 = FALSE;
			
			if( pass[ 0 ] == '{' &&
				pass[ 1 ] == 'S' &&
				pass[ 2 ] == '6' &&
				pass[ 3 ] == '}' )
			{
				passS6 = TRUE;
			}
			
			FCSHA256_CTX ctx;
			unsigned char hash[ 32 ];
			char hashTarget[ 64 ];
		
			if( passS6 == TRUE )
			{
				if( strcmp( usr->u_Password, pass ) == 0 )
				{
					DEBUG("[FCDB] Password is ok! Both are hashed\n");
					return TRUE;
				}
			}
			else
			{
				DEBUG("[FCDB] Checkpassword, password is not in SHA256 format for user %s\n", usr->u_Name );
		
				Sha256Init( &ctx );
				Sha256Update( &ctx, (unsigned char *) pass, (unsigned int)strlen( pass ) ); //&(usr->u_Password[4]), strlen( usr->u_Password )-4 );
				Sha256Final( &ctx, hash );

				int i;
				int j=0;
		
				for( i = 0 ; i < 64 ; i += 2, j++ )
				{
					sprintf( &(hashTarget[ i ]), "%02x", (char )hash[ j ] & 0xff );
				}
		
				DEBUG("[FCDB] Checking provided password '%s' versus active password '%s'\n", hashTarget, usr->u_Password );
		
				if( strncmp( &(hashTarget[0]), &(usr->u_Password[4]), 64 ) == 0 )
				{
					DEBUG("[FCDB] Password is ok!\n");
					return TRUE;
				}
			}
		}
	}
	else
	{
		if( strcmp( usr->u_Password, pass ) == 0 )
		{
			return TRUE;
		}
	}
	return FALSE;
}

/**
 * Update user password
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param usr pointer to User structure
 * @param pass password provided (new password)
 * @return 0 when success, otherwise error number
 */
int UpdatePassword( struct AuthMod *l, Http *r __attribute__((unused)), User *usr, char *pass )
{
	if( l != NULL && usr != NULL )
	{
		if( usr->u_Password != NULL )
		{
			FFree( usr->u_Password );
		}
		usr->u_Password = StringDuplicate( pass );
		
		SystemBase *sb = (SystemBase *)l->sb;
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
		if( sqlLib != NULL )
		{
			char temptext[ 2048 ];
			
			sqlLib->SNPrintF( sqlLib, temptext, 2048, "UPDATE `FUser` f SET f.Password = '%s' WHERE`ID` = '%ld'",  pass, usr->u_ID );

			void *res = sqlLib->Query( sqlLib, temptext );
			if( res != NULL )
			{
				sqlLib->FreeResult( sqlLib, res );
			}
			
			sb->LibrarySQLDrop( sb, sqlLib );
		}
	}
	
	return 0;
}

/**
 * Return information if User is in API group
 *
 * @param sqlLib pointer to MYSQL.library
 * @param tmpusr pointer to User structure which will be checked
 * @return TRUE when success, otherwise FALSE
 */
FBOOL isAPIUser( SQLLibrary *sqlLib __attribute__((unused)), User *tmpusr )
{
	// If we are not an API user:
	return tmpusr->u_IsAPI;
}

/**
 * Authenticate User
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param logsess pointer to UserSession structure
 * @param name name of the User
 * @param pass password provided
 * @param devname device identitiy
 * @param sessionId sessionid provided as string
 * @param blockTime pointer to integer value where blocked account time will be returned (int seconds)
 * @return UserSession structure when user is authenticated, otherwise NULL
 */
UserSession *Authenticate( struct AuthMod *l, Http *r, struct UserSession *logsess, char *name, char *pass, char *devname, char *sessionId, FULONG *blockTime )
{
	if( l == NULL )
	{
		return NULL;
	}
	DEBUG("[FCDB] Authenticate START (%s)\n", name );
	
	//struct User *user = NULL;
	UserSession *uses = NULL;
	User *tmpusr = NULL;
	SystemBase *sb = (SystemBase *)l->sb;
	FBOOL userFromDB = FALSE;
	FULONG userid = 0;
	*blockTime = 0;
	
	//
	// checking if last user login attempts failed, if yes, then we cannot continue
	//
	
	{
		time_t tm = 0;
		time_t tm_now = time( NULL );
		FBOOL access = sb->sl_UserManagerInterface.UMGetLoginPossibilityLastLogins( sb->sl_UM, name, l->am_BlockAccountAttempts, &tm );
		
		DEBUG("[FCDB] Authentication, access: %d, time difference between last login attempt and now %lu\n", access, ( tm_now - tm ) );
		// if last 3 access failed you must wait one hour from last login attempt
		if( access == FALSE && ( (tm_now - tm ) < l->am_BlockAccountTimeout) )
		{
			int max = rand( )%RANDOM_WAITING_TIME;

			// This "hack" will give login machine feeling that FC is doing something in DB
			
			//sleep( max );
			
			FERROR("User: %s was trying to login 3 times in a row (fail login attempts)\n", name );
			sb->sl_UserManagerInterface.UMStoreLoginAttempt( sb->sl_UM, name, "Login fail", "Last login attempts fail" );
			
			*blockTime = (FULONG) (tm_now + l->am_BlockAccountTimeout);
			
			return NULL;
		}
	}
	
	//
	// when loguser is not null , it says that session is in memory, we should use it
	//
	
	if( logsess == NULL  )
	{
		DEBUG("[FCDB] Usersession not provided, will be taken from DB\n");

		tmpusr = sb->sl_UserManagerInterface.UMUserGetByNameDB( sb->sl_UM, name );
		userFromDB = TRUE;
		
		if( tmpusr != NULL )
		{
			uses = USMGetSessionByDeviceIDandUser( sb->sl_USM, devname, tmpusr->u_ID );
		}
		else
		{
			int max = rand( )%RANDOM_WAITING_TIME;
			
			DEBUG("[FCDB] User not found, generate random loop, seconds: %d\n", max );
			// This "hack" will give login machine feeling that FC is doing something in DB

			//sleep( max );
			
			goto loginfail;
		}
	}
	else
	{
		if( logsess->us_User == NULL )
		{
			DEBUG("[FCDB] User is not connected to session, it will loaded from DB\n");
			tmpusr = sb->sl_UserManagerInterface.UMUserGetByNameDB( sb->sl_UM, name );
			userFromDB = TRUE;
		}
		tmpusr = logsess->us_User;
		uses = logsess;
	}
	
	DEBUG("[FCDB] Authenticate getting timestamp\n");
	time_t timestamp = time ( NULL );
	
	if( tmpusr == NULL )
	{
		DEBUG("[ERROR] Cannot find user by name %s\n", name );
		goto loginfail;
	}
	
	userid = tmpusr->u_ID;
	
	DEBUG("[FCDB] User found ID %lu\n", tmpusr->u_ID );
	
	//
	// if sessionid is provided
	// we are trying to find it and update
	//
	
	if( sessionId != NULL )
	{
		DEBUG("[FCDB] Sessionid != NULL\n");
		if( logsess == NULL )
		{
			FERROR("[FCDB] provided Sessionid is empty\n");
		}
		
		//
		// use remote session
		//
		
		if( strcmp( devname, "remote" ) == 0 )
		//if( strcmp( sessionId, "remote" ) == 0 )
		{
			DEBUG("[FCDB] remote connection found\n");
			if( l->CheckPassword( l, r, tmpusr, (char *)pass, blockTime ) == FALSE )
			{
				//tmpusr->u_Error = FUP_AUTHERR_PASSWORD;
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				goto loginfail;
			}
			
			UserSessListEntry *usl = tmpusr->u_SessionsList;
			while( usl != NULL )
			{
				UserSession *s = (UserSession *)usl->us;
				if( strcmp( s->us_DeviceIdentity, "remote" ) == 0 )
				//if( strcmp( s->us_SessionID, "remote" ) == 0 )
				{
					break;
				}
				usl = (UserSessListEntry *) usl->node.mln_Succ;
			}
			
			if( usl == NULL )
			{
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				UserSession *ses = UserSessionNew( sessionId, "remote" );
				if( ses != NULL )
				{
					ses->us_UserID = tmpusr->u_ID;
					ses->us_LoggedTime = timestamp;
				}
				DEBUG("[FCDB] remotefs returning session ptr %p\n", ses );

				uses = ses;
				goto loginok;
			}
			
			if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
			uses = usl->us;
			goto loginok;
		}
		
		//
		// getting user session from memory via sessionid
		//
		
		DEBUG( "[FCDB] Provided sessionid to function %s\n", sessionId );
		uses = sb->sl_UserSessionManagerInterface.USMGetSessionBySessionID( sb->sl_USM, sessionId );
		
		if( uses != NULL )
		{
			uses->us_LoggedTime = timestamp;
			DEBUG("[FCDB] Check password %s  -  %s\n", pass, uses->us_User->u_Password );
			
			if( l->CheckPassword( l, r, uses->us_User, (char *)pass, blockTime ) == FALSE )
			{
				//uses->us_User->u_Error = FUP_AUTHERR_PASSWORD;
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				goto loginfail;
			}
		
			if( strcmp( name, uses->us_User->u_Name ) != 0 )
			{
				//uses->us_User->u_Error = FUP_AUTHERR_USER;
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				goto loginfail;
			}
		
			//
			// session is valid
			//
		
			if( (timestamp - uses->us_LoggedTime ) < sb->sl_RemoveSessionsAfterTime )
			{	// session timeout
	
				DEBUG("[FCDB] checking login time %ld < LOGOUTTIME %lu\n", timestamp - uses->us_LoggedTime, sb->sl_RemoveSessionsAfterTime );
	
				// same session, update login time
				
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				goto loginok;
			}
			else
				
				//
				// session not found in memory
				//
				
			{
				//user->u_Error = FUP_AUTHERR_TIMEOUT;
				FERROR("[ERROR] FUP AUTHERR_TIMEOUT\n");
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				goto loginok;
			}
		}
		else
		{
			DEBUG("[ERROR] User cannot be found by session %s\n", sessionId );
			if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
			goto loginfail;
		}
	}
	
	//
	// provided sessionid is null
	//
	
	else
	{
		
		DEBUG("[FCDB] AUTHENTICATE sessionid was not provided\n");
		
		if( l->CheckPassword( l, r, tmpusr, (char *)pass, blockTime ) == FALSE )
		{
			DEBUG( "[FCDB] Password does not match! %s (provided password) != %s (user from session or db)\n", pass, tmpusr->u_Password );
			// if user is in global list, it means that that it didnt come  from outside
			//user->u_Error = FUP_AUTHERR_PASSWORD;
			if( sb->sl_UserManagerInterface.UMUserCheckExistsInMemory( sb->sl_UM, tmpusr ) == NULL )
			{
				DEBUG( "[FCDB] User used for tests is not in list. Safely remove it.\n" );
			}
			if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
			goto loginfail;
		}
		
		//
		// if session is not provided we must create one
		//
		
		if( uses == NULL )
		{
			DEBUG("[FCDB] Create new session\n");
			//USMGetSessionByDeviceIDandUser()
			uses = UserSessionNew( NULL, devname );
			uses->us_UserID = tmpusr->u_ID;
		}
		else
		{
			DEBUG("[FCDB] Found old session, using it %s\n", uses->us_SessionID );
			if( uses->us_User->u_MainSessionID != NULL )
			{
			}
		}
		
		//USMSessionSaveDB( sb->sl_USM, uses );
		
		DEBUG( "[FCDB] The password comparison is: %s, %s\n", pass, tmpusr->u_Password );
		
		SystemBase *sb = (SystemBase *)l->sb;
		
		DEBUG("[FCDB] SB %p\n", sb );
		SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
		if( sqlLib != NULL )
		{
			FBOOL testAPIUser = isAPIUser( sqlLib, tmpusr );
			
			//if( uses->us_SessionID == NULL || testAPIUser != 0 )
			if( uses->us_SessionID == NULL || testAPIUser == FALSE )
			{
				DEBUG( "[FCDB] : We got a response on: \nAUTHENTICATE: SessionID = %s\n", uses->us_SessionID ? uses->us_SessionID : "No session id" );
				DEBUG("\n\n\n1============================================================ tmiest %ld usertime %ld logouttst %lu\n\
		==========================================================================\n", timestamp, uses->us_LoggedTime , sb->sl_RemoveSessionsAfterTime);
				
				//char tmpQuery[ 512 ];
				//
				// user was not logged out
				//
				if(  (timestamp - uses->us_LoggedTime) < sb->sl_RemoveSessionsAfterTime )
				{
					DEBUG("User was not logged out\n");
					
				}
				else		// user session is no longer active
				{
					//Generate new session ID for the user
					char *new_session_id = SessionIDGenerate();
					DEBUG("[FCDB] New sessionid <%s>\n", new_session_id);
				
					// Remove old session ID and update
					if( uses->us_SessionID )
					{
						FFree( uses->us_SessionID );
					}
					uses->us_SessionID = new_session_id;
				}

				DEBUG("[FCDB] Update filesystems\n");
				uses->us_LoggedTime = timestamp;

				sb->LibrarySQLDrop( sb, sqlLib );
				// TODO: Generate sessionid the first time if it is empty!!
				INFO("Auth return user %s with sessionid %s\n", tmpusr->u_Name,  uses->us_SessionID );
				if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
				goto loginok;
			}
			else 
			{
				// We have an API user!
				if( testAPIUser == TRUE && uses->us_SessionID )
				{
					
					DEBUG("[FCDB] APIUSR!\n");
					// Generate sessionid
					if( uses->us_SessionID == NULL || !strlen( uses->us_SessionID ) )
					{
						DEBUG("============================================================\n \
							user name %s current timestamp %ld login time %ld logout time %lu\n\
								============================================================\n", tmpusr->u_Name, timestamp, uses->us_LoggedTime , sb->sl_RemoveSessionsAfterTime);
						
						char *hashBase = MakeString( 255 );
						sprintf( hashBase, "%ld%s%d", timestamp, tmpusr->u_FullName, ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) );
						HashedString( &hashBase );
				
						// Remove old one and update
						if( uses->us_SessionID )
						{
							FFree( uses->us_SessionID );
						}
						uses->us_SessionID = hashBase;
					}
					sb->LibrarySQLDrop( sb, sqlLib );
					DEBUG( "[FCDB] AUTHENTICATE: We found an API user! sessionid=%s\n", uses->us_SessionID );
					if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
					goto loginok;
				}
			}
			sb->LibrarySQLDrop( sb, sqlLib );
		}
		if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
		goto loginfail;
	}

	DEBUG("[FCDB] AUTHENTICATE END\n");

	if(  tmpusr != NULL && userFromDB == TRUE ){ UserDelete( tmpusr );	tmpusr =  NULL; }
	// next request, if session id exist then user is logged in
	
loginok:
	DEBUG("[FCDB] Login ok Stored\n");
	sb->sl_UserManagerInterface.UMStoreLoginAttempt( sb->sl_UM, name, "Login success", NULL );
	return uses;
	
loginfail:
	{
		time_t tm;
		sb->sl_UserManagerInterface.UMStoreLoginAttempt( sb->sl_UM, name, "Login fail", "Login fail" );
	}
// if login fail, goto must be used
	return NULL;
}

/**
 * Logout User
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param name name of the User
 */
void Logout( struct AuthMod *l, Http *r __attribute__((unused)), char *name )
{
	SystemBase *sb = (SystemBase *)l->sb;
	//UserSession *users = sb->sl_UserSessionManagerInterface.USMGetSessionBySessionID( sb->sl_USM, name );
	
	DEBUG("Logout get\n");
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 1024 ];
		
		sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserSession WHERE SessionID = '%s'", name );
		DEBUG("Logout sql: %s\n", tmpQuery );
		
		sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
	
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	DEBUG("Logout get end\n");
}

/**
 * Check if UserSession is valid
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param sessionId sessionid provided as string
 * @return UserSession structure when session is valid, otherwise NULL
 */
UserSession *IsSessionValid( struct AuthMod *l, Http *r __attribute__((unused)), char *sessionId )
{
	SystemBase *sb = (SystemBase *)l->sb;
	// to see if the session has lastupdated date less then 2 hours old
	UserSession *users = sb->sl_UserSessionManagerInterface.USMGetSessionBySessionID( sb->sl_USM, sessionId );
	time_t timestamp = time ( NULL );
	
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib == NULL )
	{
		FERROR("Cannot get mysql.library slot!\n");
		return NULL;
	}

	if( users == NULL )
	{
		sb->LibrarySQLDrop( sb, sqlLib );
		//FUP_AUTHERR_USRNOTFOUND
		return NULL;
	}

	// we check if user is already logged in
	if( ( timestamp - users->us_LoggedTime ) < sb->sl_RemoveSessionsAfterTime )
	{	// session timeout
		// we set timeout

		if( strcmp( users->us_SessionID, sessionId ) == 0 )
		{
			DEBUG( "[FCDB] IsSessionValid: Session is valid! %s\n", sessionId );
			char tmpQuery[ 512 ];
			
			sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionId );
			//sprintf( tmpQuery, "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionId );

			void *res = sqlLib->Query( sqlLib, tmpQuery );
			if( res != NULL )
			{
			//users->us_User->u_Error = FUP_AUTHERR_UPDATE;
				sqlLib->FreeResult( sqlLib, res );
				sb->LibrarySQLDrop( sb, sqlLib );
				return users;
			}
		}
		else
		{
			DEBUG( "[FCDB] IsSessionValid: Wrong sessionid! %s\n", sessionId );
			
			// same session, update loggedtime
			//user->u_Error = FUP_AUTHERR_WRONGSESID;
			sb->LibrarySQLDrop( sb, sqlLib );
			return users;
		}
	}
	else
	{
		DEBUG( "[FCDB] IsSessionValid: Session has timed out! %s\n", sessionId );
		//user->u_Error = FUP_AUTHERR_TIMEOUT;
		sb->LibrarySQLDrop( sb, sqlLib );
		return users;
	}
	sb->LibrarySQLDrop( sb, sqlLib );
	return users;
}

/**
 * Set User attribute
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param u pointer to User structure which will be updated
 * @param param attribute name as string
 * @param val attribute value as string
 */
void SetAttribute( struct AuthMod *l __attribute__((unused)), Http *r __attribute__((unused)), struct User *u, const char *param, void *val )
{
	if( param != NULL && u != NULL )
	{
		if( strcmp("fname",param) == 0 )
		{
			if( u->u_FullName != NULL )
			{
				FFree( u->u_FullName );
			}
			if( val != NULL )
			{
				u->u_FullName = StringDuplicate( (char *) val );
			}
		}
		else if( strcmp("email",param) == 0 )
		{
			if( u->u_Email != NULL )
			{
				FFree( u->u_Email );
			}
			if( val != NULL )
			{
				u->u_Email = StringDuplicate( (char *) val );
			}
		}
	}
}

//
// 
//
/**
 * Check if user has a textual permission, like module or filesystem
 * in concert with applications
 *
 * @param l pointer to AuthMod
 * @param r pointer to Http request
 * @param userId User ID
 * @param applicationId application ID
 * @param permission permissions which will be checked
 * @return 0 when success, otherwise error number
 */
int UserAppPermission( struct AuthMod *l __attribute__((unused)),
		Http *r __attribute__((unused)),
		int userId __attribute__((unused)),
		int applicationId __attribute__((unused)),
		const char *permission __attribute__((unused)) )
{

	return -1;
}
