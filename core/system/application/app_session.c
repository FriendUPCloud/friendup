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
 *  App Session
 *
 * file contain all functitons related to application sessions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "app_session.h"
#include <core/thread.h>
#include <system/systembase.h>
#include <limits.h>
#include <time.h>
#include <network/websocket_client.h>

#define TIMEOUT_APP_SESSION  5*(60)

/**
 * Application session thread
 *
 * @param args thread arguments
 */

void AppSessionThread( void *args )
{
	struct FThread *ft = (FThread *)args;
	AppSession *as =  (AppSession  *)ft->t_Data;
	
	struct timeval timeout;
	fd_set fds;
	
	while( ft->t_Quit != TRUE )
	{
		FD_ZERO( &fds );
		FD_SET( as->as_WritePipe, &fds );
						
		timeout.tv_sec = 5000;
		timeout.tv_usec = 0;
						
		int err = select( as->as_WritePipe+1, &fds, NULL, NULL, &timeout );
		
		if( err  < 0 )
		{
			FERROR("Problem\n");
		}
		else if(  err  ==  0  )
		{
			DEBUG("Timeout\n");
		}
		else
		{
#define BUFFER_SIZE 2048
			char buffer[ BUFFER_SIZE ];
			BufString *bs  =  BufStringNew();

			int  size = -1;
			
			while(  size != 0 )//!feof( (FILE *) as->as_WritePipe ) )
			{
				// Make a new buffer and read
				size = read( as->as_WritePipe, buffer, BUFFER_SIZE );
				//int  size = fread( buffer, sizeof(char), BUFFER_SIZE, (FILE *)as->as_WritePipe );
				BufStringAddSize( bs, buffer, size );
			}
			
			BufStringDelete( bs );
		}
	}
	
	ft->t_Launched = FALSE;
}

/**
 * Create app newssion, generate SASID number
 *
 * @param sb pointer to SystemBase
 * @param authid authenticationid, this information must be provided by the owner
 * @param appid applicationid to which session belong
 * @param owner owner UserSession
 * @return application session
 */

AppSession *AppSessionNew( void *sb, const char *authid, FUQUAD appid, UserSession *owner )
{
	AppSession *las = NULL;
	DEBUG("[AppSession] Create app session\n");
	
	if( ( las = FCalloc( 1, sizeof( AppSession ) ) ) != NULL )
	{
		strcpy( las->as_AuthID, authid );
		las->as_AppID = appid;
		
		DEBUG("[AppSession] AppSessionCreated, authid %s\n", authid );
		
		SASUList *ali =  FCalloc( 1, sizeof( SASUList ) );
		if( ali != NULL )
		{
			ali->ID = las->as_NumberGenerator++;
			ali->status = SASID_US_STATUS_NEW;
			ali->usersession = owner;
			strcpy( ali->authid, authid );
			DEBUG("[AppSession] ASN set %s pointer %p\n", ali->authid, ali );
			las->as_UserSessionList = ali;
			
			las->as_SASID = (FUQUAD)ali;//( rand() % ULLONG_MAX );
			las->as_Timer = time( NULL );
			
			las->as_UserNumber++;
			las->as_VariablesNumGenerator = 100;
			las->as_SB = sb;
			
			pthread_mutex_init( &las->as_SessionsMut, NULL );
			pthread_mutex_init( &las->as_VariablesMut, NULL );
			
			DEBUG("[AppSessionNew] SAS created: %lu\n", las->as_SASID );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for AppSession\n");
	}
	DEBUG("[AppSessionNew] End\n");
	
	return las;
}

/**
 * Delete application session
 *
 * @param as pointer to session which will be deleted
 */

void AppSessionDelete( AppSession *as )
{
	DEBUG("[AppSessionDelete] Delete app session\n");
	if( as != NULL )
	{
		SASUList *ali = NULL;
		SASUList *rml = NULL;
		
		DEBUG("[AppSession] AS %lu\n", as->as_SASID );
		
		DEBUG("[AppSession] locking as sessionmut\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			ali = as->as_UserSessionList;
			rml = ali;
		
			while( ali != NULL )
			{
				DEBUG("[AppSession] Remove session\n");
				rml = ali;
				ali = (SASUList *) ali->node.mln_Succ;
			
				FFree( rml );
				rml = NULL;
			}
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
			DEBUG("[AppSession] unlocking as sessionmut\n");
		}
		
		pthread_mutex_destroy( &as->as_SessionsMut );
		
		DEBUG("[AppSessionDelete] locking as variable mutex\n");
		
		if( FRIEND_MUTEX_LOCK( &as->as_VariablesMut ) == 0 )
		{
			INVAREntry *le = as->as_Variables;
			INVAREntry *re = le;
			while( le != NULL )
			{
				re = le;
				le = (INVAREntry *) le->node.mln_Succ;
			
				INVAREntryDelete( re );
			}
			FRIEND_MUTEX_UNLOCK( &as->as_VariablesMut );
		}
		pthread_mutex_destroy( &as->as_VariablesMut );
		
		DEBUG("[AppSessionDelete] app session released\n");
		
		FFree( as );
		as = NULL;
	}
	DEBUG("[AppSession] App sessions deleted\n");
}

/**
 * Add user session to application session
 *
 * @param as application session
 * @param u user session which will be added to application session
 * @param authid authenticationid of person which will be added to application session
 * @return SASUList if success, otherwise NULL
 */

SASUList *AppSessionAddUser( AppSession *as, UserSession *u, char *authid )
{
	DEBUG("[AppSessionAddUser] Add user to to appsession\n");
	FBOOL userAdded = FALSE;
	if( as != NULL && u != NULL )
	{
		SASUList *lali = NULL;
		
		DEBUG("[AppSessionAddUser] AS %lu\n", as->as_SASID );
		
		DEBUG("[AppSession] locking as sessionmut1\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			lali = (SASUList *)as->as_UserSessionList;
			while( lali != NULL )
			{
				// we check if device was added
			
				if( lali->usersession == u )
				{
					userAdded = TRUE;
					break;
				}
				lali = (SASUList *) lali->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
			DEBUG("[AppSession] unlocking as sessionmut1\n");
		}
		
		DEBUG("User was added: %d\n", userAdded );
		if( userAdded == TRUE )
		{
			if( lali->authid[ 0 ] == 0 )
			{
				as->as_Timer = time( NULL );
				DEBUG("[AppSession] User is already invited but he did not accept previous invitation\n");
				return lali;
			}
			else
			{
				FERROR("User is already invited with session %lu\n", as->as_SASID );
				return NULL;
			}
		}
		
		SASUList *ali = NULL;
		
		DEBUG("[AppSession] locking as sessionmut2\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			DEBUG("Allocate memory for  new ali\n");
			ali = FCalloc( 1, sizeof( SASUList ) );
			
			if( ali != NULL )
			{
				ali->ID = as->as_NumberGenerator++;

				ali->usersession = u;
				ali->node.mln_Succ = (MinNode *)as->as_UserSessionList;
				as->as_UserSessionList = ali;

				if( authid != NULL )
				{
					DEBUG("[AppSession] Auth id set %s in ptr %p\n", authid, ali );
					strcpy( ali->authid, authid );
				}
			}
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
			DEBUG("[AppSession] unlocking as sessionmut2\n");
		}
		as->as_Timer = time( NULL );
		DEBUG("[AppSessionAddUser] return %p\n", ali );
		return ali;
	}
	return NULL;
}

/**
 * Remove user session from application session
 * ! This function do not allow to remove owners
 *
 * @param as application session
 * @param u user session which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int AppSessionRemUsersession( AppSession *as, UserSession *u )
{
	if( as != NULL )
	{
		SASUList *ali = NULL;
		
		DEBUG("[AppSessionRemUsersession] AS %lu\n", as->as_SASID );
		
		if( u != NULL )
		{
			DEBUG("[AppSession] AppSessionRemUsersession %s\n", u->us_SessionID );
		}
		else
		{
			DEBUG("[AppSession] remove user session, user session is equal to NULL\n");
			return -1;
		}
		
		DEBUG("[AppSession] locking as sessionmut3\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			if( as->as_Type == SAS_TYPE_OPEN )
			{
				ali = (SASUList *)as->as_UserSessionList; // we cannot remove owner
			}
			else
			{
				ali = (SASUList *)as->as_UserSessionList->node.mln_Succ; // we cannot remove owner
			}
			
			SASUList *prevali = as->as_UserSessionList;
		
			DEBUG("[AppSession] Session before loop\n");
			while( ali != NULL )
			{
				//DEBUG("PARAM US: %p LIST US: %p\n");
				if( u ==  ali->usersession )
				{
					if( ali == as->as_UserSessionList )
					{
						as->as_UserSessionList =(SASUList *)ali->node.mln_Succ;
					}
					else
					{
						prevali->node.mln_Succ = ali->node.mln_Succ;
					}
			
					as->as_UserNumber--;
					DEBUG("[AppSession] Session removed, sessions %d\n", as->as_UserNumber );
			
					FFree( ali );
					DEBUG("[AppSession] break\n");
					break;
				}
				prevali = ali;
				ali = (SASUList *) ali->node.mln_Succ;
				DEBUG("[AppSession] Session end loop\n");
			}
		
			DEBUG("[AppSession] locking as sessionmut3\n");
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
		}
		as->as_Timer = time( NULL );
		
		if( ali == NULL )
		{
			DEBUG("[AppSession] user is not in SAS user session list\n");
			return -2;
		}
	}
	
	DEBUG("[AppSession] remove user session, success\n");
	return 0;
}

/**
 * Remove user session from application session
 *
 * @param as application session
 * @param u user session which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int AppSessionRemUsersessionAny( AppSession *as, UserSession *u )
{
	if( as != NULL )
	{
		if( u != NULL )
		{
			DEBUG("[AppSessionRemUsersessionAny] AppSessionRemUsersession %s\n", u->us_SessionID );
		}
		else
		{
			DEBUG("[AppSessionRemUsersessionAny] remove user session, user session is equal to NULL\n");
			return -1;
		}
		
		SASUList *ali = NULL;
		SASUList *prevali = NULL;
		
		DEBUG("[AppSessionRemUsersessionAny] AS %lu\n", as->as_SASID );
		
		DEBUG("[AppSession] locking as sessionmut4\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			ali = (SASUList *)as->as_UserSessionList;
			prevali = as->as_UserSessionList;
			DEBUG("[AppSessionRemUsersessionAny] Session before loop\n");
			while( ali != NULL )
			{
				if( u ==  ali->usersession )
				{
					if( ali == as->as_UserSessionList )
					{
						as->as_UserSessionList =(SASUList *)ali->node.mln_Succ;
					}
					else
					{
						prevali->node.mln_Succ = ali->node.mln_Succ;
					}
				
					as->as_UserNumber--;
					DEBUG("[AppSessionRemUsersessionAny] Session removed, sessions %d\n", as->as_UserNumber );
				
					FFree( ali );
					DEBUG("[AppSessionRemUsersessionAny] break\n");
			
					break;
				}
				prevali = ali;
				ali = (SASUList *) ali->node.mln_Succ;
				DEBUG("[AppSessionRemUsersessionAny] Session end loop\n");
			}

			DEBUG("[AppSession] locking as sessionmut4\n");
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
		}
		as->as_Timer = time( NULL );
		
		if( ali == NULL )
		{
			DEBUG("[AppSessionRemUsersessionAny] user is not in SAS user session list\n");
			return -2;
		}
	}
	
	DEBUG("[AppSessionRemUsersessionAny] remove user session, success\n");
	return 0;
}

#define WS_MESSAGE_TEMPLATE_USER "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": %s}}}}"

/**
 * Remove user from application session
 *
 * @param as application session
 * @param u user (and all his sessions) which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int AppSessionRemUser( AppSession *as, User *u )
{
	if( as != NULL )
	{
		DEBUG("[AppSessionRemUser] AS %lu\n", as->as_SASID );
		
		DEBUG("[AppSession] locking as sessionmut5\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			SASUList *ali = (SASUList *)as->as_UserSessionList->node.mln_Succ; // we cannot remove owner
			SASUList *prevali = as->as_UserSessionList;
		
			while( ali != NULL )
			{
				if( u ==  ali->usersession->us_User  )
				{
					if( ali == as->as_UserSessionList )
					{
						as->as_UserSessionList =(SASUList *)ali->node.mln_Succ;
					}
					else
					{
						prevali->node.mln_Succ = ali->node.mln_Succ;
					}
			
					as->as_UserNumber--;
				}
		
				prevali = ali;
				ali = (SASUList *) ali->node.mln_Succ;
			}
			DEBUG("[AppSession] unlocking as sessionmut5\n");
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
		}
	}
	
	return 0;
}

/**
 * Add current sesssion to SAS
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @return pointer to SASUList if session was added, otherwise NULL
 */

SASUList *AppSessionAddCurrentUserSession( AppSession *as, UserSession *loggedSession )
{
	// remove spaces and 'weird' chars from entry
	unsigned int i, j=0;
	int  pos = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	SASUList *retListEntry = NULL;
	SystemBase *l = (SystemBase *)as->as_SB;
	
	//DEBUG("[AppSession] sessid %s\n", sessid );
	
	UserSession *usrses = NULL;

	//
	// we must check if  user is already in application session
	//

	DEBUG("[AppSessionAddCurrentSession] AS %lu\n", as->as_SASID );
	DEBUG("[AppSession] locking as sessionmut94\n");
	SASUList *curgusr = NULL;
	if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
	{
		curgusr = as->as_UserSessionList;
		while( curgusr != NULL )
		{
			//DEBUG("[AppSession] Check users  '%s'='%s'\n", upositions[ i ], curgusr->usersession->us_User->u_Name );
			if( loggedSession == curgusr->usersession )
			{
				break;
			}
			curgusr = (SASUList *) curgusr->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
		DEBUG("[AppSession] unlocking as sessionmut94\n");
	}

	if( curgusr != NULL )
	{
		DEBUG("User is already on list\n");
		return curgusr;
	}

	//
	// user was not added  we must find it in system sessions
	//

	usrses = loggedSession;

	if( usrses != NULL )
	{
		retListEntry = AppSessionAddUser( as, usrses, NULL );

		DEBUG("[AppSession] newsession will be added %p retListEntry %p\n", usrses, retListEntry );
	} // if( usrses != NULL )
	DEBUG("[AppSessionAddCurrentSession] return %p\n", retListEntry );

	return retListEntry;
}

/**
 * Add usersession provided as string
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @param sessid invited session
 * @param appname application name string
 * @param msg message string which will appear in invitation
 * @return pointer to SASUList if session was added, otherwise NULL
 */

SASUList *AppSessionAddUsersBySession( AppSession *as, UserSession *loggedSession, char *sessid, char *appname, char *msg )
{
	// remove spaces and 'weird' chars from entry
	unsigned int i, j=0;
	int  pos = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	SASUList *retListEntry = NULL;
	SystemBase *l = (SystemBase *)as->as_SB;
	
	DEBUG("[AppSessionAddUsersBySession] AS %lu\n", as->as_SASID );
	DEBUG("[AppSession] sessid %s\n", sessid );
	
	if( sessid != NULL )
	{
		UserSession *usrses = NULL;
		SASUList *curgusr = NULL;

		//
		// we must check if  user is already in application session
		//

		DEBUG("[AppSession] locking as sessionmut95\n");
		if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
		{
			curgusr = as->as_UserSessionList;
			while( curgusr != NULL )
			{
				//DEBUG("[AppSession] Check users  '%s'='%s'\n", upositions[ i ], curgusr->usersession->us_User->u_Name );
				if( strcmp( sessid, curgusr->usersession->us_SessionID  ) == 0  )
				{
					if( curgusr->status == SASID_US_STATUS_NEW )
					{
						curgusr->status = SASID_US_INVITED;
					}
					break;
				}
				curgusr = (SASUList *) curgusr->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
			DEBUG("[AppSession] unlocking as sessionmut95\n");
		}

		usrses = USMGetSessionBySessionID( l->sl_USM, sessid );
		
		//
		// user was not added  we must find it in system sessions
		//

		if( curgusr == NULL )
		{
			if( usrses != NULL )
			{
				retListEntry = AppSessionAddUser( as, usrses, NULL );

				DEBUG("[AppSession] newsession will be added %p\n", usrses );

				if( retListEntry != NULL && msg != NULL )
				{
					char tmp[ 512 ];
					int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", usrses->us_User->u_Name, usrses->us_DeviceIdentity );

					char tmpmsg[ 2048 ];
					int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->as_SASID, msg, loggedSession->us_User->u_Name , appname );

					WebSocketSendMessageInt( usrses, tmpmsg, len );
				}
				
			} // if( usrses != NULL )
		}	// check if userlistadded != NULL
	}
	else
	{
		DEBUG("[AppSession] Userlist is equal to NULL\n");
	}
	return retListEntry;
}

/**
 * Add user or user list provided as string
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @param userlist list of users provided as string in json format ['userA','userB',.....]
 * @param appname application name string
 * @param msg message string which will appear in invitation
 * @return list of users provided as string who received invitation
 */

char *AppSessionAddUsersByName( AppSession *as, UserSession *loggedSession, char *userlist, char *appname, char *msg )
{
	// remove spaces and 'weird' chars from entry
	unsigned int i, j=0;
	int  pos = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	char *userlistadded = NULL;
	
	SystemBase *l = (SystemBase *)as->as_SB;
	
	DEBUG("[AppSessionAddUsersByName] AS %lu\n", as->as_SASID );
	DEBUG("[AppSession] user list %s\n", userlist );
	
	if( userlist != NULL )
	{
		unsigned int listsize = strlen( userlist );
		for( i=0 ; i < listsize ; i++ )
		{
			if( userlist[ i ] == '[' || userlist[ i ] == ']' || userlist[ i ] == ' ' || userlist[ i ] == '"' )
			{
				if( userlist[ i ] == ']' )
				{
					userlist[ i ] = 0;
					break;
				}
			}
			else
			{
				userlist[ j ] = userlist[ i ];
				j++;
			}
		}
		userlist[ j ] = 0;

		upositions[ 0 ] = userlist;
		usersi = 1;
		
		listsize = strlen( userlist );
		
		for( i = 1 ; i < listsize; i++ )
		{
			if( userlist[ i ] == ',' )
			{
				userlist[ i ] = 0;
				upositions[ usersi++ ] = &(userlist[ i+1 ]);
			}
		}
		
		// I assume that user can have max 8 sessions - usersi * 512 * 8
		DEBUG("[AppSession] Bytes %d for user list will be allocated\n", SHIFT_LEFT( SHIFT_LEFT(usersi, 9), 3 ) );
		userlistadded = FCalloc( SHIFT_LEFT( SHIFT_LEFT(usersi, 9), 3 ), sizeof(char) );
		if( userlistadded != NULL )
		{
			int errors = 0;
			strcpy( userlistadded, "{ \"invited\": [" );

			//
			// we are going through list of users passed by client
			//

			for( i = 0 ; i < usersi ; i++ )
			{
				UserSession *usrses = l->sl_USM->usm_Sessions;

				//
				// we must check if  user is already in application session
				//

				SASUList *curgusr = NULL;
				DEBUG("[AppSession] locking as sessionmut96\n");
				if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
				{
					SASUList *curgusr = as->as_UserSessionList;
					while( curgusr != NULL )
					{
						//DEBUG("[AppSession] Check users  '%s'='%s'\n", upositions[ i ], curgusr->usersession->us_User->u_Name );
						if( strcmp( upositions[ i ], curgusr->usersession->us_User->u_Name  ) == 0  )
						{
							if( curgusr->status == SASID_US_STATUS_NEW )
							{
								curgusr->status = SASID_US_INVITED;
							}
							break;
						}
						curgusr = (SASUList *) curgusr->node.mln_Succ;
					}
					FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
					DEBUG("[AppSession] unlocking as sessionmut96\n");
				}
				
				//
				// user was not added  we must find it in system sessions
				//

				if( curgusr == NULL )
				{
					while( usrses != NULL )
					{
						// if user is not logged in he will not get invitation
						DEBUG("[AppSession] Going throug sessions userptr %p\n", usrses->us_User );

						//FRIEND_MUTEX_LOCK( &usrses->us_Mutex );
						if( usrses->us_User != NULL )
						{
							DEBUG("[AppSession] share user name %s --- ptr to list %p\n", usrses->us_User->u_Name, usrses );

							if( strcmp( upositions[ i ], usrses->us_User->u_Name ) == 0 )
							{
								int err = 0;
								char tmp[ 512 ];

								if( usrses->us_WSConnections == NULL )
								{
									int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"not invited\"}", usrses->us_User->u_Name, usrses->us_DeviceIdentity );
									if( pos > 0  )
									{
										strcat( userlistadded, "," );
									}

									strcat( userlistadded, tmp );
									pos++;
								}

								//
								// no working websockets
								//

								else
								{
									SASUList *sli = AppSessionAddUser( as, usrses, NULL );

									DEBUG("[AppSession] newsession will be added %p\n", usrses );

									if( sli != NULL )
									{
										int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", usrses->us_User->u_Name, usrses->us_DeviceIdentity );

										if( pos > 0  )
										{
											strcat( userlistadded, "," );
										}

										DEBUG("[AppSession] New entry will be added: %s , currentlist size %d\n", tmp, (int)strlen(userlistadded ) );

										strcat( userlistadded, tmp );
										pos++;

										char tmpmsg[ 2048 ];
										int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->as_SASID, msg, loggedSession->us_User->u_Name , appname );

										WebSocketSendMessageInt( usrses, tmpmsg, len );
									}
								}
							}
							
							//FRIEND_MUTEX_UNLOCK( &usrses->us_Mutex );
						}
						else
						{
							DEBUG("[AppSession] Usersession is nott connected to user '%s' userid %lu\n", usrses->us_SessionID, usrses->us_UserID );
						}
						usrses  = (UserSession *)usrses->node.mln_Succ;
					}	//while lusr
				}// if userfound
				else
				{
					UserSession *ses = (UserSession *)curgusr->usersession;
					
					DEBUG("[AppSession] Found user session %p wscon %p\n", ses, ses->us_WSConnections );
					
					if( ses != NULL && ses->us_WSConnections != NULL && ses != loggedSession )
					{
						char tmp[ 512 ];
						int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", ses->us_User->u_Name, ses->us_DeviceIdentity );
					
						if( pos > 0  )
						{
							strcat( userlistadded, "," );
						}
					
						DEBUG("[AppSession] Old entry will be updated: %s , currentlist size %d\n", tmp, (int)strlen(userlistadded ) );
					
						strcat( userlistadded, tmp );
						pos++;
					
						char tmpmsg[ 2048 ];
						int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->as_SASID, msg, loggedSession->us_User->u_Name , appname );
					
						WebSocketSendMessageInt( ses, tmpmsg, len );
					}
				}
			} // for usersi
			strcat( userlistadded,  "]}" );
		}	// check if userlistadded != NULL
	}
	else
	{
		DEBUG("[AppSession] Userlist is equal to NULL\n");
	}
	return userlistadded;
}

/**
 * Remove user or user list provided as string
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @param userlist list of users provided as string in json format ['userA','userB',.....]
 * @return 0 when success, otherwise error number
 */

BufString *AppSessionRemUserByNames( AppSession *as, UserSession *loggedSession, char *userlist )
{
	BufString *bs = BufStringNew();
	
	if( userlist == NULL )
	{
		DEBUG("Userlist is empty!\n");
		BufStringAdd( bs, " {\"removed\": [ ] }" );
		return bs;
	}
	
	BufStringAdd( bs, " {\"removed\": [" );
	
	unsigned int i = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	
	DEBUG("[AppSessionRemUserByNames] AS %lu\n", as->as_SASID );

	if( as != NULL )
	{
		// remove spaces and 'weird' chars from entry
		unsigned int i, j=0;
		
		DEBUG("[AppSession] user list: %s\n", userlist );
		
		if( userlist != NULL )
		{
			unsigned int listsize = strlen( userlist );
			for( i=0 ; i < listsize ; i++ )
			{
				if( userlist[ i ] == '[' || userlist[ i ] == ']' || userlist[ i ] == ' ' || userlist[ i ] == '"' )
				{
					if( userlist[ i ] == ']' )
					{
						userlist[ i ] = 0;
						DEBUG("End\n");
						break;
					}
				}
				else
				{
					userlist[ j ] = userlist[ i ];
					j++;
				}
			}
			userlist[ j ] = 0;

			upositions[ 0 ] = userlist;
			usersi = 1;
			
			listsize = strlen( userlist );
				
			for( i = 1 ; i < listsize; i++ )
			{
				if( userlist[ i ] == ',' )
				{
					userlist[ i ] = 0;
					upositions[ usersi++ ] = &(userlist[ i+1 ]);
				}
			}
			
			//userlistadded = FCalloc( usersi * 512, sizeof(char) );
		}
	}
	else
	{
		DEBUG("[AppSession] as = NULL\n" );
	}
	
	SASUList **rementr = NULL;
	User *assidAdmin = NULL;
	UserSession *adminSession = NULL;
	SASUList *asul = NULL;
	unsigned int rementrnum = 0;
	
	// find user sessions by username
	// and send message
	
	DEBUG("[AppSession] locking as sessionmut97\n");
	if( FRIEND_MUTEX_LOCK( &as->as_SessionsMut ) == 0 )
	{
		asul = as->as_UserSessionList;
		int returnEntry = 0;
	
		DEBUG("[AppSession] Number of entries in SAS %d\n", as->as_UserNumber );
	
		if( as->as_UserNumber > 0 )
		{
			rementr = FCalloc( as->as_UserNumber+100, sizeof(SASUList *) );

			while( asul != NULL )
			{
				for( i = 0 ; i < usersi ; i++ )
				{
					if( asul->usersession->us_User != NULL )
					{
						DEBUG("[AppSession] Checking user '%s'\n", upositions[ i ] );
						if( strcmp( upositions[ i ], asul->usersession->us_User->u_Name ) == 0 )
						{
							char locbuf[ 128 ];
							int size = 0;
							if( returnEntry == 0 )
							{
								size = snprintf( locbuf, sizeof(locbuf), "%s", asul->usersession->us_User->u_Name );
							}
							else
							{
								size = snprintf( locbuf, sizeof(locbuf), ",%s", asul->usersession->us_User->u_Name );
							}
							BufStringAddSize( bs, locbuf, size );
						
							returnEntry++;
						
							if( asul->usersession == as->as_UserSessionList->usersession )
							{
								DEBUG("[AppSession] Admin will be removed\n");
								adminSession = asul->usersession;
							}
							rementr[ rementrnum++ ] = asul;
						}
					}
				}
				asul = (SASUList *) asul->node.mln_Succ;
			}
		}
		FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
		DEBUG("[AppSession] unlocking as sessionmut97\n");
	}
	
	//
	// we want to remove admin
	//
	
	if( rementr != NULL )
	{
		char tmp[ 1024 ];
		int msgsndsize = 0;
		
		if( adminSession != NULL )
		{
			asul = as->as_UserSessionList;
			while( asul != NULL )
			{
				int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", asul->authid, as->as_SASID,  loggedSession->us_User->u_Name, asul->usersession->us_User->u_Name );
				msgsndsize += WebSocketSendMessageInt( asul->usersession, tmp, len );
			
				asul = (SASUList *) asul->node.mln_Succ;
			}
		}
		else
		{
			for( i=0 ; i < rementrnum ; i++ )
			{
				DEBUG("[AppSession] authid %s sasid %lu userptr %p usersessptr %p usersessuser ptr %p\n", rementr[ i ]->authid, as->as_SASID,  loggedSession->us_User, rementr[ i ]->usersession, rementr[ i ]->usersession->us_User );
				int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", rementr[ i ]->authid, as->as_SASID,  loggedSession->us_User->u_Name, rementr[ i ]->usersession->us_User->u_Name );
				msgsndsize += WebSocketSendMessageInt( rementr[ i ]->usersession, tmp, len );
			
				AppSessionRemUsersession( as, rementr[ i ]->usersession );
			}
		}
		FFree( rementr );
	}
	
	BufStringAdd( bs, "] }" );
	
	return bs;
}

//
//
//

typedef struct RWSCon
{
	AppSession *as;		// app session
	SASUList *sasuentry;		// user session
	
	struct RWSCon *next;
}RWSCon;

/**
 * Remove user from application session by websocket connection
 *
 * @param as application session
 * @param lwsc pointer to websocket connection (lwsc structure)
 * @return 0 if success, otherwise error number
 */

int AppSessionRemByWebSocket( AppSession *as,  void *lwsc )
{
	UserSessionWebsocket *ws = (UserSessionWebsocket *) lwsc;
	RWSCon *root = NULL;
	RWSCon *rwsentr = NULL;
	
	DEBUG("[AppSession] App session remove by WS\n");
	
	if( as != NULL )
	{
		DEBUG("[AppSessionRemByWebSocket] AS %lu\n", as->as_SASID );
		
		//while( as != NULL )
		//{
			DEBUG("[AppSession] locking as sessionmut98\n");
			FRIEND_MUTEX_LOCK( &(as->as_SessionsMut) );
			
			SASUList *le = as->as_UserSessionList;
			while( le != NULL )
			{
				DEBUG("[AppSession] Going through User Sessions\n");
				if( le->usersession != NULL )
				{
					//FRIEND_MUTEX_UNLOCK( &(as->as_SessionsMut) );
					
					FRIEND_MUTEX_LOCK( &(le->usersession->us_Mutex) );
					UserSessionWebsocket *lws = le->usersession->us_WSConnections;
					while( lws != NULL )
					{
						if( lws == ws )
						{
							RWSCon *ne = FCalloc( 1, sizeof( RWSCon ) );
							if( ne != NULL )
							{
								//FRIEND_MUTEX_LOCK( &as->as_SessionsMut );
								ne->as = as;
								ne->sasuentry = le;
							
								if( root == NULL )
								{
									root = ne;
									rwsentr = root;
								}
								else
								{
									rwsentr->next = ne;
									rwsentr = ne;
								}
							}
							//FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
						
							break;
						}
						if( lws->wusc_Data == NULL )
						{
							break;
						}
					
						lws = (UserSessionWebsocket *)lws->node.mln_Succ;
					}
					FRIEND_MUTEX_UNLOCK( &(le->usersession->us_Mutex) );
					
					//FRIEND_MUTEX_LOCK( &(as->as_SessionsMut) );
				}
				le = (SASUList *)le->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(as->as_SessionsMut) );
			DEBUG("[AppSession] unlocking as sessionmut98\n");
			//as = (AppSession *)as->node.mln_Succ;
		//}
	
		DEBUG("Remove session from SAS, pointer %p\n", root );
		rwsentr = root;
		while( rwsentr != NULL )
		{
			DEBUG("[AppSession] Remove entry and spread message about that\n");
			RWSCon *re = rwsentr;

			rwsentr = rwsentr->next;
		
			if( re != NULL )
			{
				int err = 0;
				// *
				/*
				char tmpmsg[ 255 ];
				int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", re->sasuentry->usersession->us_User->u_Name );
			
				DEBUG("[AppSession] Session found and will be removed\n");
			
				if( re->as->as_UserSessionList == re->sasuentry )
				{
					err = AppSessionSendMessage( as, re->sasuentry->usersession, tmpmsg, msgsize, NULL );
				}
				else
				{
					err = AppSessionSendOwnerMessage( as, re->sasuentry->usersession, tmpmsg, msgsize );
				}
				//
				*/
			
				err = AppSessionRemUsersession( re->as, re->sasuentry->usersession );
			
				FFree( re );
			}
		}
	}	//  as == NULL
	/*
	if( ws->wusc_Data != NULL )
	{
		WSCData *data = (WSCData *)ws->wusc_Data;
		int err = AppSessionRemUsersession( as, data->wsc_UserSession );
	}
	*/
	DEBUG("[AppSession] App session remove by WS END\n");
	
	return 0;
}

/**
 * Send message to all application session recipients
 *
 * @param as application session
 * @param sender user session which is sending message
 * @param msg pointer to message which will be sent
 * @param length length of the message
 * @return 0 if success, otherwise error number
 */

int AppSessionSendMessage( AppSession *as, UserSession *sender, char *msg, int length, char *dstusers )
{
	int msgsndsize = 0;
	if( as == NULL || sender == NULL )
	{
		DEBUG("[AppSession] AppSession or sender parameter are empty\n");
		return -1;
	}

	DEBUG("[AppSessionSendMessage] AS %lu\n", as->as_SASID );
	time_t ntime = time( NULL );
	DEBUG("[AppSessionSendMessage] OLD TIME %lld NEW TIME %lld\n", (long long)as->as_Timer, (long long)ntime );
	if( ( ntime - as->as_Timer ) > TIMEOUT_APP_SESSION )
	{
		as->as_Obsolete = TRUE;
	}
	as->as_Timer = ntime;
	
	if( dstusers == NULL )
	{
		SASUList *ali = as->as_UserSessionList;
		while( ali != NULL )
		{
			if( ali->usersession == sender )
			{
				// sender should receive response
				DEBUG("[AppSessionSendMessage] SENDER AUTHID %s\n", ali->authid );
			}
			else
			{
				char *newmsg = NULL;
				
				if( ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
				{
					User *usend = sender->us_User;
					
					DEBUG("[AppSessionSendMessage] Sendmessage AUTHID %s\n", ali->authid );
					
					int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, ali->authid, as->as_SASID, usend->u_Name, msg );
					
					if( ali->usersession != NULL )
					{
						msgsndsize += WebSocketSendMessageInt( ali->usersession, newmsg, newmsgsize );
						if( ali->usersession != NULL && ali->usersession->us_User != NULL )
						{
							DEBUG("[AppSessionSendMessage] FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, ali->usersession->us_User->u_Name, msgsndsize );
						}
					}
					FFree( newmsg );
				}
				else
				{
					FERROR("Cannot allocate memory for message\n");
				}
			}
			DEBUG("[AppSessionSendMessage] in loop \n");
			ali = (SASUList *) ali->node.mln_Succ;
		}
		DEBUG("[AppSessionSendMessage] SENDER\n");
	}
	else  // dstusers != NULL
	{
		int dstuserssize = strlen( dstusers );
		char *quotaName = FMalloc( dstuserssize );
		
		SASUList *ali = as->as_UserSessionList;
		while( ali != NULL )
		{
			if( ali->usersession == sender )
			{
				// sender should receive response
				DEBUG("[AppSessionSendMessage] SENDER AUTHID %s\n", ali->authid );
			}
			else
			{
				UserSession *locusrsess = (UserSession *)ali->usersession;
				User *usr = locusrsess->us_User;
				
				if( usr != NULL )
				{
					int size = strlen( usr->u_Name );
					quotaName[ 0 ] = quotaName[ size+1 ] = '\"';
					quotaName[ size+2 ] = 0;
					memcpy( &quotaName[ 1 ], usr->u_Name, size );
					
					char *newmsg = NULL;
					
					if( strstr( dstusers, quotaName ) != NULL &&  ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
					{
						User *usend = sender->us_User;
						
						DEBUG("[AppSession] Sendmessage AUTHID %s\n", ali->authid );
						
						int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, ali->authid, as->as_SASID, usend->u_Name, msg );
						
						msgsndsize += WebSocketSendMessageInt( ali->usersession, newmsg, newmsgsize );
						DEBUG("[AppSession] FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, ali->usersession->us_User->u_Name, msgsndsize );
						FFree( newmsg );
					}
					else
					{
						//FERROR("Cannot allocate memory for message\n");
					}
				}
			}
			ali = (SASUList *) ali->node.mln_Succ;
		}
		
		FFree( quotaName );
	}
	DEBUG("[AppSessionSendMessage] end\n");
	return msgsndsize;
}

/**
 * Send message to  application session owner
 *
 * @param as application session
 * @param sender user session which is sending message
 * @param msg pointer to message which will be sent
 * @param length length of the message
 * @return 0 if success, otherwise error number
 */

int AppSessionSendOwnerMessage( AppSession *as, UserSession *sender, char *msg, int length )
{
	int msgsndsize = 0;
	if( as == NULL )
	{
		DEBUG("[AppSession] AppSession parameter is empty\n");
		return -1;
	}
	
	DEBUG("[AppSessionSendOwnerMessage] AS %lu\n", as->as_SASID );
	time_t ntime = time( NULL );
	DEBUG("[AppSession] OLD TIME %lld NEW TIME %lld\n", (long long)as->as_Timer, (long long)ntime );
	if( ( ntime - as->as_Timer ) > TIMEOUT_APP_SESSION )
	{
		as->as_Obsolete = TRUE;
	}
	as->as_Timer = ntime;

	DEBUG("[AppSession] Send message %s\n", msg );
	
	char *newmsg = NULL;
	
	if( ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
	{
		User *usend = sender->us_User;
		DEBUG("[AppSession] AS POINTER %p SENDER %p\n", as, usend );
		int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, as->as_AuthID, as->as_SASID, usend->u_Name, msg );
		
		//if( FRIEND_MUTEX_LOCK( &(as->as_SessionsMut) ) == 0 )
		{
			if( as->as_UserSessionList != NULL )
			{
				msgsndsize += WebSocketSendMessageInt( as->as_UserSessionList->usersession, newmsg, newmsgsize );
				DEBUG("[AppSession] FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, as->as_UserSessionList->usersession->us_User->u_Name, msgsndsize );
			}
			//FRIEND_MUTEX_UNLOCK( &(as->as_SessionsMut) );
		}
		FFree( newmsg );
	}
	else
	{
		FERROR("Cannot allocate memory for message\n");
	}
	
	return msgsndsize;
}

/**
 * Send message to all application session recipients without additional headers
 *
 * @param as application session
 * @param sender user session which is sending message
 * @param msg pointer to message which will be sent
 * @param length length of the message
 * @return 0 if success, otherwise error number
 */

int AppSessionSendPureMessage( AppSession *as, UserSession *sender, char *msg, int length )
{
	int msgsndsize = 0;
	if( as == NULL || sender == NULL )
	{
		DEBUG("[AppSession] AppSession or sender parameter are empty\n");
		return -1;
	}
	
	DEBUG("[AppSession] Send message %s\n", msg );
	
	SASUList *ali = as->as_UserSessionList;
	while( ali != NULL )
	{
		if( ali->usersession ==  sender )
		{
			// sender should receive response
		}
		else
		{
			if( ali->authid[ 0 ] == 0 )
			{
				msgsndsize += WebSocketSendMessageInt( ali->usersession, msg, length );
			}
		}
			
		ali = (SASUList *) ali->node.mln_Succ;
	}
	
	return msgsndsize;
}

/**
 * Get Application Session list entry by user session
 *
 * @param as application session
 * @param ses pointer to session to be searched
 * @return list entry or NULL if its not attached to application session
 */

SASUList *GetListEntryBySession( AppSession *as, UserSession *ses )
{
	DEBUG("[GetListEntryBySession] AS %lu\n", as->as_SASID );
	DEBUG("[AppSession] locking as sessionmut99\n");
	FRIEND_MUTEX_LOCK( &as->as_SessionsMut );
	SASUList *li = as->as_UserSessionList;
		
	// Find invitee user with authid from user list in allowed users
	while( li != NULL )
	{
		DEBUG("[AppSession] sessionfrom list %p loggeduser session %p\n",  li->usersession, ses );
		if( li->usersession == ses )
		{
			break;
		}
		li = ( SASUList * )li->node.mln_Succ;
	}
	FRIEND_MUTEX_UNLOCK( &as->as_SessionsMut );
	DEBUG("[AppSession] unlocking as sessionmut99\n");
	
	return li;
}
