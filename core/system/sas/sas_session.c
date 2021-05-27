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
#include "sas_session.h"
#include <core/thread.h>
#include <system/systembase.h>
#include <limits.h>
#include <time.h>
#include <network/websocket_client.h>

#define TIMEOUT_APP_SESSION  5*(60)

/**
 * Shared Application Session thread
 *
 * @param args thread arguments
 */

void SASSessionThread( void *args )
{
	struct FThread *ft = (FThread *)args;
	SASSession *as =  (SASSession  *)ft->t_Data;
	
	struct timeval timeout;
	fd_set fds;
	
	while( ft->t_Quit != TRUE )
	{
		FD_ZERO( &fds );
		FD_SET( as->sas_WritePipe, &fds );
						
		timeout.tv_sec = 5000;
		timeout.tv_usec = 0;
						
		int err = select( as->sas_WritePipe+1, &fds, NULL, NULL, &timeout );
		
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
			
			while(  size != 0 )//!feof( (FILE *) as->sas_WritePipe ) )
			{
				// Make a new buffer and read
				size = read( as->sas_WritePipe, buffer, BUFFER_SIZE );
				//int  size = fread( buffer, sizeof(char), BUFFER_SIZE, (FILE *)as->sas_WritePipe );
				BufStringAddSize( bs, buffer, size );
			}
			
			BufStringDelete( bs );
		}
	}
	
	ft->t_Launched = FALSE;
}

/**
 * Create shared app newssion, generate SASID number
 *
 * @param sb pointer to SystemBase
 * @param authid authenticationid, this information must be provided by the owner
 * @param appid applicationid to which session belong
 * @param owner owner UserSession
 * @return application session
 */

SASSession *SASSessionNew( void *sb, const char *authid, FUQUAD appid, UserSession *owner )
{
	SASSession *las = NULL;
	DEBUG("[SASSession] Create app session\n");
	
	if( ( las = FCalloc( 1, sizeof( SASSession ) ) ) != NULL )
	{
		strcpy( las->sas_AuthID, authid );
		las->sas_AppID = appid;
		
		DEBUG("[SASSession] AppSessionCreated, authid %s\n", authid );
		
		SASUList *ali =  FCalloc( 1, sizeof( SASUList ) );
		if( ali != NULL )
		{
			ali->ID = las->sas_NumberGenerator++;
			ali->status = SASID_US_STATUS_NEW;
			ali->usersession = owner;
			strcpy( ali->authid, authid );
			DEBUG("[SASSession] ASN set %s pointer %p\n", ali->authid, ali );
			las->sas_UserSessionList = ali;
			
			las->sas_SASID = (FUQUAD)ali;//( rand() % ULLONG_MAX );
			las->sas_Timer = time( NULL );
			
			las->sas_UserNumber++;
			las->sas_VariablesNumGenerator = 100;
			las->sas_SB = sb;
			
			pthread_mutex_init( &las->sas_SessionsMut, NULL );
			pthread_mutex_init( &las->sas_VariablesMut, NULL );
			
			DEBUG("[AppSessionNew] SAS created: %lu\n", las->sas_SASID );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for SASSession\n");
	}
	DEBUG("[AppSessionNew] End\n");
	
	return las;
}

/**
 * Delete shared application session
 *
 * @param as pointer to session which will be deleted
 */

void SASSessionDelete( SASSession *as )
{
	DEBUG("[SASSessionDelete] Delete app session\n");
	if( as != NULL )
	{
		SASUList *ali = NULL;
		SASUList *rml = NULL;
		
		DEBUG("[SASSessionDelete] AS %lu\n", as->sas_SASID );
		
		DEBUG("[SASSessionDelete] locking as sessionmut\n");
		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			ali = as->sas_UserSessionList;
			rml = ali;
		
			while( ali != NULL )
			{
				DEBUG("[AppSession] Remove session\n");
				rml = ali;
				ali = (SASUList *) ali->node.mln_Succ;
			
				FFree( rml );
				rml = NULL;
			}
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
			DEBUG("[AppSession] unlocking as sessionmut\n");
		}
		
		pthread_mutex_destroy( &as->sas_SessionsMut );
		
		DEBUG("[AppSessionDelete] locking as variable mutex\n");
		
		if( FRIEND_MUTEX_LOCK( &as->sas_VariablesMut ) == 0 )
		{
			INVAREntry *le = as->sas_Variables;
			INVAREntry *re = le;
			while( le != NULL )
			{
				re = le;
				le = (INVAREntry *) le->node.mln_Succ;
			
				INVAREntryDelete( re );
			}
			FRIEND_MUTEX_UNLOCK( &as->sas_VariablesMut );
		}
		pthread_mutex_destroy( &as->sas_VariablesMut );
		
		DEBUG("[AppSessionDelete] app session released\n");
		
		FFree( as );
		as = NULL;
	}
	DEBUG("[SASSessionDelete] App sessions deleted\n");
}

/**
 * Add user session to shared application session
 *
 * @param as application session
 * @param u user session which will be added to application session
 * @param authid authenticationid of person which will be added to application session
 * @return SASUList if success, otherwise NULL
 */

SASUList *SASSessionAddUser( SASSession *as, UserSession *u, char *authid )
{
	DEBUG("[AppSessionAddUser] Add user to to appsession\n");
	FBOOL userAdded = FALSE;
	if( as != NULL && u != NULL )
	{
		SASUList *lali = NULL;
		
		DEBUG("[SASSessionAddUser] AS %lu\n", as->sas_SASID );
		
		DEBUG("[SASSessionAddUser] locking as sessionmut1\n");
		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			lali = (SASUList *)as->sas_UserSessionList;
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
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
			DEBUG("[SASSessionAddUser] unlocking as sessionmut1\n");
		}
		
		DEBUG("User was added: %d\n", userAdded );
		if( userAdded == TRUE )
		{
			if( lali->authid[ 0 ] == 0 )
			{
				as->sas_Timer = time( NULL );
				DEBUG("[SASSessionAddUser] User is already invited but he did not accept previous invitation\n");
				return lali;
			}
			else
			{
				FERROR("User is already invited with session %lu\n", as->sas_SASID );
				return NULL;
			}
		}
		
		SASUList *ali = NULL;
		
		DEBUG("[SASSessionAddUser] locking as sessionmut2\n");
		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			ali = FCalloc( 1, sizeof( SASUList ) );
			
			if( ali != NULL )
			{
				ali->ID = as->sas_NumberGenerator++;

				ali->usersession = u;
				ali->node.mln_Succ = (MinNode *)as->sas_UserSessionList;
				as->sas_UserSessionList = ali;

				if( authid != NULL )
				{
					DEBUG("[SASSessionAddUser] Auth id set %s in ptr %p\n", authid, ali );
					strcpy( ali->authid, authid );
				}
			}
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );

			DEBUG("[SASSessionAddUser] unlocking as sessionmut2\n");
		}

		as->sas_Timer = time( NULL );
		DEBUG("[SASSessionAddUser] return %p\n", ali );
		return ali;
	}
	return NULL;
}

/**
 * Remove user session from shared application session
 * ! This function do not allow to remove owners
 *
 * @param as application session
 * @param u user session which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int SASSessionRemUserSession( SASSession *as, UserSession *u )
{
	if( as != NULL )
	{
		SASUList *ali = NULL;
		
		DEBUG("[SASSessionRemUsersession] AS %lu\n", as->sas_SASID );
		
		if( u != NULL )
		{
			DEBUG("[SASSessionRemUserSession] AppSessionRemUsersession %s\n", u->us_SessionID );
		}
		else
		{
			DEBUG("[SASSessionRemUserSession] remove user session, user session is equal to NULL\n");
			return -1;
		}
		
		DEBUG("[SASSessionRemUserSession] locking as sessionmut3\n");
		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			if( as->sas_Type == SAS_TYPE_OPEN )
			{
				ali = (SASUList *)as->sas_UserSessionList; // we cannot remove owner
			}
			else
			{
				ali = (SASUList *)as->sas_UserSessionList->node.mln_Succ; // we cannot remove owner
			}
			
			SASUList *prevali = as->sas_UserSessionList;
		
			DEBUG("[SASSessionRemUserSession] Session before loop\n");
			while( ali != NULL )
			{
				if( u ==  ali->usersession )
				{
					if( ali == as->sas_UserSessionList )
					{
						as->sas_UserSessionList =(SASUList *)ali->node.mln_Succ;
					}
					else
					{
						prevali->node.mln_Succ = ali->node.mln_Succ;
					}
			
					as->sas_UserNumber--;
					DEBUG("[SASSessionRemUserSession] Session removed, sessions %d\n", as->sas_UserNumber );
			
					FFree( ali );
					break;
				}
				prevali = ali;
				ali = (SASUList *) ali->node.mln_Succ;
				DEBUG("[SASSessionRemUserSession] Session end loop\n");
			}
		
			DEBUG("[SASSessionRemUserSession] locking as sessionmut3\n");
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
		}
		as->sas_Timer = time( NULL );
		
		if( ali == NULL )
		{
			DEBUG("[SASSessionRemUserSession] user is not in SAS user session list\n");
			return -2;
		}
	}
	
	DEBUG("[SASSessionRemUserSession] remove user session, success\n");
	return 0;
}

/**
 * Remove user session from shared application session
 *
 * @param as application session
 * @param u user session which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int SASSessionRemUserSessionAny( SASSession *as, UserSession *u )
{
	if( as != NULL )
	{
		if( u != NULL )
		{
			DEBUG("[SASSessionRemUsersessionAny] AppSessionRemUsersession %s\n", u->us_SessionID );
		}
		else
		{
			DEBUG("[SASSessionRemUsersessionAny] remove user session, user session is equal to NULL\n");
			return -1;
		}
		
		SASUList *ali = NULL;
		SASUList *prevali = NULL;
		
		DEBUG("[AppSessionRemUsersessionAny] AS %lu\n", as->sas_SASID );
		
		DEBUG("[SASSessionRemUserSessionAny] locking as sessionmut4\n");
		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			ali = (SASUList *)as->sas_UserSessionList;
			prevali = as->sas_UserSessionList;
			DEBUG("[SASSessionRemUsersessionAny] Session before loop\n");

			while( ali != NULL )
			{
				if( u ==  ali->usersession )
				{
					if( ali == as->sas_UserSessionList )
					{
						as->sas_UserSessionList =(SASUList *)ali->node.mln_Succ;
					}
					else
					{
						prevali->node.mln_Succ = ali->node.mln_Succ;
					}
				
					as->sas_UserNumber--;
					DEBUG("[SASSessionRemUsersessionAny] Session removed, sessions %d\n", as->sas_UserNumber );
				
					FFree( ali );
					DEBUG("[SASSessionRemUsersessionAny] break\n");
			
					break;
				}
				prevali = ali;
				ali = (SASUList *) ali->node.mln_Succ;
				DEBUG("[SASSessionRemUsersessionAny] Session end loop\n");
			}

			DEBUG("[SASSessionRemUserSessionAny] locking as sessionmut4\n");
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
		}
		as->sas_Timer = time( NULL );
		
		if( ali == NULL )
		{
			DEBUG("[SASSessionRemUsersessionAny] user is not in SAS user session list\n");
			return -2;
		}
	}
	
	DEBUG("[SASSessionRemUsersessionAny] remove user session, success\n");
	return 0;
}

#define WS_MESSAGE_TEMPLATE_USER "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": %s}}}}"

/**
 * Remove user from shared application session
 *
 * @param as application session
 * @param u user (and all his sessions) which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int SASSessionRemUser( SASSession *as, User *u )
{
	if( as != NULL )
	{
		DEBUG("[SASSessionRemUser] AS %lu\n", as->sas_SASID );
		
		DEBUG("[SASSessionRemUser] locking as sessionmut5\n");

		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			SASUList *ali = (SASUList *)as->sas_UserSessionList->node.mln_Succ; // we cannot remove owner
			SASUList *prevali = as->sas_UserSessionList;
		
			while( ali != NULL )
			{
				if( u ==  ali->usersession->us_User  )
				{
					if( ali == as->sas_UserSessionList )
					{
						as->sas_UserSessionList =(SASUList *)ali->node.mln_Succ;
					}
					else
					{
						prevali->node.mln_Succ = ali->node.mln_Succ;
					}
			
					as->sas_UserNumber--;
				}
		
				prevali = ali;
				ali = (SASUList *) ali->node.mln_Succ;
			}
			DEBUG("[SASSessionRemUser] unlocking as sessionmut5\n");
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
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

SASUList *SASSessionAddCurrentUserSession( SASSession *as, UserSession *loggedSession )
{
	// remove spaces and 'weird' chars from entry
	unsigned int i, j=0;
	int  pos = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	SASUList *retListEntry = NULL;
	SystemBase *l = (SystemBase *)as->sas_SB;
	
	UserSession *usrses = NULL;

	//
	// we must check if  user is already in application session
	//

	DEBUG("[SASSessionAddCurrentSession] AS %lu\n", as->sas_SASID );
	DEBUG("[SASSessionAddCurrentSession] locking as sessionmut94\n");
	SASUList *curgusr = NULL;

	if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
	{
		curgusr = as->sas_UserSessionList;
		while( curgusr != NULL )
		{
			//DEBUG("[AppSession] Check users  '%s'='%s'\n", upositions[ i ], curgusr->usersession->us_User->u_Name );
			if( loggedSession == curgusr->usersession )
			{
				break;
			}
			curgusr = (SASUList *) curgusr->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );

		DEBUG("[SASSessionAddCurrentSession] unlocking as sessionmut94\n");
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
		retListEntry = SASSessionAddUser( as, usrses, NULL );

		DEBUG("[SASSessionAddCurrentSession] newsession will be added %p retListEntry %p\n", usrses, retListEntry );
	} // if( usrses != NULL )
	DEBUG("[SASSessionAddCurrentSession] return %p\n", retListEntry );

	return retListEntry;
}

/**
 * Add usersession provided as string to shared application session
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @param sessid invited session
 * @param appname application name string
 * @param msg message string which will appear in invitation
 * @return pointer to SASUList if session was added, otherwise NULL
 */

SASUList *SASSessionAddUsersBySession( SASSession *as, UserSession *loggedSession, char *sessid, char *appname, char *msg )
{
	// remove spaces and 'weird' chars from entry
	unsigned int i, j=0;
	int  pos = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	SASUList *retListEntry = NULL;
	SystemBase *l = (SystemBase *)as->sas_SB;
	
	DEBUG("[SASSessionAddUsersBySession] AS: %lu sessionid: %s\n", as->sas_SASID, sessid );

	if( sessid != NULL )
	{
		UserSession *usrses = NULL;
		SASUList *curgusr = NULL;

		//
		// we must check if  user is already in application session
		//

		DEBUG("[SASSessionAddUsersBySession] locking as sessionmut95\n");
		if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
		{
			curgusr = as->sas_UserSessionList;
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
			FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
			DEBUG("[SASSessionAddUsersBySession] unlocking as sessionmut95\n");
		}

		usrses = USMGetSessionBySessionID( l->sl_USM, sessid );
		
		//
		// user was not added  we must find it in system sessions
		//

		if( curgusr == NULL )
		{
			if( usrses != NULL )
			{
				retListEntry = SASSessionAddUser( as, usrses, NULL );

				DEBUG("[SASSessionAddUsersBySession] newsession will be added %p\n", usrses );

				if( retListEntry != NULL && msg != NULL )
				{
					char tmp[ 512 ];
					int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", usrses->us_User->u_Name, usrses->us_DeviceIdentity );

					char tmpmsg[ 2048 ];
					int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->sas_SASID, msg, loggedSession->us_User->u_Name , appname );

					WebSocketSendMessageInt( usrses, tmpmsg, len );
				}
				
			} // if( usrses != NULL )
		}	// check if userlistadded != NULL
	}
	else
	{
		DEBUG("[SASSessionAddUsersBySession] Userlist is equal to NULL\n");
	}
	return retListEntry;
}

/**
 * Add user or user list provided as string to shared application session
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @param userlist list of users provided as string in json format ['userA','userB',.....]
 * @param appname application name string
 * @param msg message string which will appear in invitation
 * @return list of users provided as string who received invitation
 */

char *SASSessionAddUsersByName( SASSession *as, UserSession *loggedSession, char *userlist, char *appname, char *msg )
{
	// remove spaces and 'weird' chars from entry
	unsigned int i, j=0;
	int  pos = 0;
	unsigned int usersi  = 0;
	char *upositions[ 128 ];
	memset( upositions, 0, sizeof( upositions ) );
	char *userlistadded = NULL;
	
	SystemBase *l = (SystemBase *)as->sas_SB;
	
	DEBUG("[AppSessionAddUsersByName] AS: %lu userlist: %s\n", as->sas_SASID, userlist );

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
		DEBUG("[SASSessionAddUsersByName] Bytes %d for user list will be allocated\n", SHIFT_LEFT( SHIFT_LEFT(usersi, 9), 3 ) );
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
				if( FRIEND_MUTEX_LOCK( &(l->sl_USM->usm_Mutex) ) == 0 )
				{
					UserSession *usrses = l->sl_USM->usm_Sessions;

					//
					// we must check if  user is already in application session
					//

					SASUList *curgusr = NULL;
					DEBUG("[SASSessionAddUsersByName] locking as sessionmut96\n");
					if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
					{
						SASUList *curgusr = as->sas_UserSessionList;
						while( curgusr != NULL )
						{
							//DEBUG("[SASSessionAddUsersByName] Check users  '%s'='%s'\n", upositions[ i ], curgusr->usersession->us_User->u_Name );
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
						FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
						DEBUG("[SASSessionAddUsersByName] unlocking as sessionmut96\n");
					}
				
					//
					// user was not added  we must find it in system sessions
					//

					if( curgusr == NULL )
					{
						while( usrses != NULL )
						{
							// if user is not logged in he will not get invitation
							DEBUG("[SASSessionAddUsersByName] Going throug sessions userptr %p\n", usrses->us_User );

							//FRIEND_MUTEX_LOCK( &usrses->us_Mutex );
							if( usrses->us_User != NULL )
							{
								DEBUG("[SASSessionAddUsersByName] share user name %s --- ptr to list %p\n", usrses->us_User->u_Name, usrses );

								if( strcmp( upositions[ i ], usrses->us_User->u_Name ) == 0 )
								{
									int err = 0;
									char tmp[ 512 ];

									if( usrses->us_WSD == NULL )
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
										SASUList *sli = SASSessionAddUser( as, usrses, NULL );

										DEBUG("[SASSessionAddUsersByName] newsession will be added %p\n", usrses );

										if( sli != NULL )
										{
											int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", usrses->us_User->u_Name, usrses->us_DeviceIdentity );

											if( pos > 0  )
											{
												strcat( userlistadded, "," );
											}

											DEBUG("[SASSessionAddUsersByName] New entry will be added: %s , currentlist size %d\n", tmp, (int)strlen(userlistadded ) );

											strcat( userlistadded, tmp );
											pos++;

											char tmpmsg[ 2048 ];
											int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->sas_SASID, msg, loggedSession->us_User->u_Name , appname );

											WebSocketSendMessageInt( usrses, tmpmsg, len );
										}
									}
								}
							
								//FRIEND_MUTEX_UNLOCK( &usrses->us_Mutex );
							}
							else
							{
								DEBUG("[SASSessionAddUsersByName] Usersession is nott connected to user '%s' userid %lu\n", usrses->us_SessionID, usrses->us_UserID );
							}
							usrses  = (UserSession *)usrses->node.mln_Succ;
						}	//while lusr
					}// if userfound
					else
					{
						UserSession *ses = (UserSession *)curgusr->usersession;
					
						DEBUG("[SASSessionAddUsersByName] Found user session %p wscon %p\n", ses, ses->us_WSD );
					
						if( ses != NULL && ses->us_WSD != NULL && ses != loggedSession )
						{
							char tmp[ 512 ];
							int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", ses->us_User->u_Name, ses->us_DeviceIdentity );
					
							if( pos > 0  )
							{
								strcat( userlistadded, "," );
							}
					
							DEBUG("[SASSessionAddUsersByName] Old entry will be updated: %s , currentlist size %d\n", tmp, (int)strlen(userlistadded ) );
					
							strcat( userlistadded, tmp );
							pos++;
					
							char tmpmsg[ 2048 ];
							int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%lu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->sas_SASID, msg, loggedSession->us_User->u_Name , appname );
					
							WebSocketSendMessageInt( ses, tmpmsg, len );
						}
					}
					FRIEND_MUTEX_UNLOCK( &(l->sl_USM->usm_Mutex) );
				}
			} // for usersi
			strcat( userlistadded,  "]}" );
		}	// check if userlistadded != NULL
	}
	else
	{
		DEBUG("[SASSessionAddUsersByName] Userlist is equal to NULL\n");
	}
	return userlistadded;
}

/**
 * Remove user or user list provided as string from shared application session
 *
 * @param as application session
 * @param loggedSession session of user who is adding other users to application session
 * @param userlist list of users provided as string in json format ['userA','userB',.....]
 * @return 0 when success, otherwise error number
 */

BufString *SASSessionRemUserByNames( SASSession *as, UserSession *loggedSession, char *userlist )
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
	
	DEBUG("[SASSessionRemUserByNames] AS %lu\n", as->sas_SASID );

	if( as != NULL )
	{
		// remove spaces and 'weird' chars from entry
		unsigned int i, j=0;
		
		DEBUG("[SASSessionRemUserByNames] user list: %s\n", userlist );
		
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
		}
	}
	else
	{
		DEBUG("[SASSessionRemUserByNames] as = NULL\n" );
	}

	SASUList **rementr = NULL;
	User *assidAdmin = NULL;
	UserSession *adminSession = NULL;
	SASUList *asul = NULL;
	unsigned int rementrnum = 0;
	
	// find user sessions by username
	// and send message
	
	DEBUG("[SASSessionRemUserByNames] locking as sessionmut97\n");

	if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
	{
		asul = as->sas_UserSessionList;
		int returnEntry = 0;

		DEBUG("[AppSession] Number of entries in SAS %d\n", as->sas_UserNumber );
		if( as->sas_UserNumber > 0 )
		{
			rementr = FCalloc( as->sas_UserNumber+100, sizeof(SASUList *) );

			while( asul != NULL )
			{
				for( i = 0 ; i < usersi ; i++ )
				{
					if( asul->usersession->us_User != NULL )
					{
						DEBUG("[SASSessionRemUserByNames] Checking user '%s'\n", upositions[ i ] );
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
						
							if( asul->usersession == as->sas_UserSessionList->usersession )
							{
								DEBUG("[SASSessionRemUserByNames] Admin will be removed\n");
								adminSession = asul->usersession;
							}
							rementr[ rementrnum++ ] = asul;
						}
					}
				}
				asul = (SASUList *) asul->node.mln_Succ;
			}
		}
		FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );

		DEBUG("[SASSessionRemUserByNames] unlocking as sessionmut97\n");
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
			asul = as->sas_UserSessionList;
			while( asul != NULL )
			{
				int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", asul->authid, as->sas_SASID,  loggedSession->us_User->u_Name, asul->usersession->us_User->u_Name );
				msgsndsize += WebSocketSendMessageInt( asul->usersession, tmp, len );
			
				asul = (SASUList *) asul->node.mln_Succ;
			}
		}
		else
		{
			for( i=0 ; i < rementrnum ; i++ )
			{
				DEBUG("[SASSessionRemUserByNames] authid %s sasid %lu userptr %p usersessptr %p usersessuser ptr %p\n", rementr[ i ]->authid, as->sas_SASID,  loggedSession->us_User, rementr[ i ]->usersession, rementr[ i ]->usersession->us_User );
				int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", rementr[ i ]->authid, as->sas_SASID,  loggedSession->us_User->u_Name, rementr[ i ]->usersession->us_User->u_Name );
				msgsndsize += WebSocketSendMessageInt( rementr[ i ]->usersession, tmp, len );
			
				SASSessionRemUserSession( as, rementr[ i ]->usersession );
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
	SASSession *as;		// app session
	SASUList *sasuentry;		// user session
	
	struct RWSCon *next;
}RWSCon;

/**
 * Remove user from shared application session by websocket connection
 *
 * @param as application session
 * @param lwsc pointer to websocket connection (lwsc structure)
 * @return 0 if success, otherwise error number
 */

int SASSessionRemByWebSocket( SASSession *as,  void *lwsc )
{
	/*
	UserSessionWebsocket *ws = (UserSessionWebsocket *) lwsc;
	RWSCon *root = NULL;
	RWSCon *rwsentr = NULL;
	
	DEBUG("[SASSessionRemByWebSocket] App session remove by WS\n");
	
	if( as != NULL )
	{
		DEBUG("[SASSessionRemByWebSocket] AS %lu\n", as->sas_SASID );
		
		//while( as != NULL )
		//{
			DEBUG("[SASSessionRemByWebSocket] locking as sessionmut98\n");
			FRIEND_MUTEX_LOCK( &(as->sas_SessionsMut) );
			
			SASUList *le = as->sas_UserSessionList;
			while( le != NULL )
			{
				SASUList *le = as->sas_UserSessionList;
				while( le != NULL )
				{
					//FRIEND_MUTEX_UNLOCK( &(as->sas_SessionsMut) );
					
					FRIEND_MUTEX_LOCK( &(le->usersession->us_Mutex) );
					UserSessionWebsocket *lws = le->usersession->us_WSConnections;
					while( lws != NULL )
					{
						if( FRIEND_MUTEX_LOCK( &(le->usersession->us_Mutex) ) == 0 )
						{
							UserSessionWebsocket *lws = le->usersession->us_WSConnections;
							while( lws != NULL )
							{
								if( lws == ws )
								{
									RWSCon *ne = FCalloc( 1, sizeof( RWSCon ) );
									if( ne != NULL )
									{
										//FRIEND_MUTEX_LOCK( &as->sas_SessionsMut );
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
									//FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
						
									break;
								}
								if( lws->wusc_Data == NULL )
								{
									break;
								}
								lws = (UserSessionWebsocket *)lws->node.mln_Succ;
							}
							FRIEND_MUTEX_UNLOCK( &(le->usersession->us_Mutex) );
						}
					}
					FRIEND_MUTEX_UNLOCK( &(le->usersession->us_Mutex) );

				}
				FRIEND_MUTEX_UNLOCK( &(as->sas_SessionsMut) );
			}
			FRIEND_MUTEX_UNLOCK( &(as->sas_SessionsMut) );
			DEBUG("[SASSessionRemByWebSocket] unlocking as sessionmut98\n");
			//as = (SASSession *)as->node.mln_Succ;
		//}
	
		DEBUG("Remove session from SAS, pointer %p\n", root );
		rwsentr = root;
		while( rwsentr != NULL )
		{
			DEBUG("[SASSessionRemByWebSocket] Remove entry and spread message about that\n");
			RWSCon *re = rwsentr;

			rwsentr = rwsentr->next;
		
			if( re != NULL )
			{
				int err = 0;
				// *
			
				err = SASSessionRemUserSession( re->as, re->sasuentry->usersession );
			
				FFree( re );
			}
		}
	}	//  as == NULL
	*/
	/*
	if( ws->wusc_Data != NULL )
	{
		WSCData *data = (WSCData *)ws->wusc_Data;
		int err = AppSessionRemUsersession( as, data->wsc_UserSession );
	}
	*/
	DEBUG("[SASSessionRemByWebSocket] App session remove by WS END\n");
	
	return 0;
}

/**
 * Send message to all shared application session recipients
 *
 * @param as application session
 * @param sender user session which is sending message
 * @param msg pointer to message which will be sent
 * @param length length of the message
 * @return 0 if success, otherwise error number
 */

int SASSessionSendMessage( SASSession *as, UserSession *sender, char *msg, int length, char *dstusers )
{
	int msgsndsize = 0;
	if( as == NULL || sender == NULL )
	{
		DEBUG("[SASSessionSendMessage] AppSession or sender parameter are empty\n");
		return -1;
	}

	DEBUG("[SASSessionSendMessage] AS %lu\n", as->sas_SASID );
	time_t ntime = time( NULL );
	DEBUG("[SASSessionSendMessage] OLD TIME %lld NEW TIME %lld\n", (long long)as->sas_Timer, (long long)ntime );
	if( ( ntime - as->sas_Timer ) > TIMEOUT_APP_SESSION )
	{
		as->sas_Obsolete = TRUE;
	}
	as->sas_Timer = ntime;
	
	if( dstusers == NULL )
	{
		SASUList *ali = as->sas_UserSessionList;
		while( ali != NULL )
		{
			if( ali->usersession == sender )
			{
				// sender should receive response
				DEBUG("[SASSessionSendMessage] SENDER AUTHID %s\n", ali->authid );
			}
			else
			{
				char *newmsg = NULL;
				
				if( ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
				{
					User *usend = sender->us_User;
					
					DEBUG("[SASSessionSendMessage] Sendmessage AUTHID %s\n", ali->authid );
					
					int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, ali->authid, as->sas_SASID, usend->u_Name, msg );
					
					if( ali->usersession != NULL )
					{
						msgsndsize += WebSocketSendMessageInt( ali->usersession, newmsg, newmsgsize );
						if( ali->usersession != NULL && ali->usersession->us_User != NULL )
						{
							DEBUG("[SASSessionSendMessage] FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, ali->usersession->us_User->u_Name, msgsndsize );
						}
					}
					FFree( newmsg );
				}
				else
				{
					FERROR("Cannot allocate memory for message\n");
				}
			}
			DEBUG("[SASSessionSendMessage] in loop \n");
			ali = (SASUList *) ali->node.mln_Succ;
		}
		DEBUG("[SASSessionSendMessage] SENDER\n");
	}
	else  // dstusers != NULL
	{
		int dstuserssize = strlen( dstusers );
		char *quotaName = (char *)FMalloc( dstuserssize );
		
		if( quotaName != NULL )
		{
			SASUList *ali = as->sas_UserSessionList;
			while( ali != NULL )
			{
				if( ali->usersession == sender )
				{
					// sender should receive response
					DEBUG("[SASSessionSendMessage] SENDER AUTHID %s\n", ali->authid );
				}
				else
				{
					UserSession *locusrsess = (UserSession *)ali->usersession;
					if( locusrsess != NULL )
					{
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
						
								DEBUG("[SASSessionSendMessage] Sendmessage AUTHID %s\n", ali->authid );
						
								int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, ali->authid, as->sas_SASID, usend->u_Name, msg );
						
								msgsndsize += WebSocketSendMessageInt( ali->usersession, newmsg, newmsgsize );
								DEBUG("[SASSessionSendMessage] FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, ali->usersession->us_User->u_Name, msgsndsize );
								FFree( newmsg );
							}
							else
							{
							//FERROR("Cannot allocate memory for message\n");
							}
						}
					}
				}
				ali = (SASUList *) ali->node.mln_Succ;
			}
			FFree( quotaName );
		}
	}
	DEBUG("[SASSessionSendMessage] end\n");
	return msgsndsize;
}

/**
 * Send message to shared application session owner
 *
 * @param as application session
 * @param sender user session which is sending message
 * @param msg pointer to message which will be sent
 * @param length length of the message
 * @return 0 if success, otherwise error number
 */

int SASSessionSendOwnerMessage( SASSession *as, UserSession *sender, char *msg, int length )
{
	int msgsndsize = 0;
	if( as == NULL )
	{
		DEBUG("[SASSessionSendOwnerMessage] AppSession parameter is empty\n");
		return -1;
	}
	
	DEBUG("[SASSessionSendOwnerMessage] AS %lu\n", as->sas_SASID );
	time_t ntime = time( NULL );
	DEBUG("[SASSessionSendOwnerMessage] OLD TIME %lld NEW TIME %lld\n", (long long)as->sas_Timer, (long long)ntime );
	if( ( ntime - as->sas_Timer ) > TIMEOUT_APP_SESSION )
	{
		as->sas_Obsolete = TRUE;
	}
	as->sas_Timer = ntime;

	DEBUG("[SASSessionSendOwnerMessage] Send message %s\n", msg );
	
	char *newmsg = NULL;
	
	if( ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
	{
		User *usend = sender->us_User;
		DEBUG("[SASSessionSendOwnerMessage] AS POINTER %p SENDER %p\n", as, usend );
		int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, as->sas_AuthID, as->sas_SASID, usend->u_Name, msg );
		
		//if( FRIEND_MUTEX_LOCK( &(as->sas_SessionsMut) ) == 0 )
		{
			if( as->sas_UserSessionList != NULL )
			{
				msgsndsize += WebSocketSendMessageInt( as->sas_UserSessionList->usersession, newmsg, newmsgsize );
				DEBUG("[SASSessionSendOwnerMessage] FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, as->sas_UserSessionList->usersession->us_User->u_Name, msgsndsize );
			}
			//FRIEND_MUTEX_UNLOCK( &(as->sas_SessionsMut) );
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
 * Send message to all shared application session recipients without additional headers
 *
 * @param as application session
 * @param sender user session which is sending message
 * @param msg pointer to message which will be sent
 * @param length length of the message
 * @return 0 if success, otherwise error number
 */

int SASSessionSendPureMessage( SASSession *as, UserSession *sender, char *msg, int length )
{
	int msgsndsize = 0;
	if( as == NULL || sender == NULL )
	{
		DEBUG("[SASSessionSendPureMessage] AppSession or sender parameter are empty\n");
		return -1;
	}
	
	DEBUG("[SASSessionSendPureMessage] Send message %s\n", msg );
	
	SASUList *ali = as->sas_UserSessionList;
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

SASUList *SASSessionGetListEntryBySession( SASSession *as, UserSession *ses )
{
	DEBUG("[SASSessionGetListEntryBySession] AS %lu\n", as->sas_SASID );
	DEBUG("[SASSessionGetListEntryBySession] locking as sessionmut99\n");
	FRIEND_MUTEX_LOCK( &as->sas_SessionsMut );
	SASUList *li = as->sas_UserSessionList;
		
	// Find invitee user with authid from user list in allowed users
	while( li != NULL )
	{
		li = as->sas_UserSessionList;
		
		// Find invitee user with authid from user list in allowed users
		while( li != NULL )
		{
			DEBUG("[SASSessionGetListEntryBySession] sessionfrom list %p loggeduser session %p\n",  li->usersession, ses );
			if( li->usersession == ses )
			{
				break;
			}
			li = ( SASUList * )li->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
	}

	FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
	DEBUG("[SASSessionGetListEntryBySession] unlocking as sessionmut99\n");
	
	return li;
}
