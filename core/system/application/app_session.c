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
			DEBUG("Reading\n");
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
	DEBUG("Create app session\n");
	
	if( ( las = FCalloc( 1, sizeof( AppSession ) ) ) != NULL )
	{
		strcpy( las->as_AuthID, authid );
		las->as_AppID = appid;
		
		DEBUG("AppSessionCreated, authid %s\n", authid );
		
		ASUList *ali =  FCalloc( 1, sizeof( ASUList ) );
		if( ali != NULL )
		{
			ali->ID = las->as_NumberGenerator++;
			ali->status = ASSID_US_STATUS_NEW;
			ali->usersession = owner;
			strcpy( ali->authid, authid );
			DEBUG("ASN set %s pointer %p\n", ali->authid, ali );
			las->as_UserSessionList = ali;
			
			las->as_ASSID = (FUQUAD)ali;//( rand() % ULLONG_MAX );
			las->as_Timer = time( NULL );
			
			las->as_UserNumber++;
			las->as_VariablesNumGenerator = 100;
			las->as_SB = sb;
			
			pthread_mutex_init( &las->as_SessionsMut, NULL );
			pthread_mutex_init( &las->as_VariablesMut, NULL );
			
			//las->as_WritePipe = eventfd(0,0);
			
			//las->as_Thread = ThreadNew( AppSessionThread, ali, TRUE );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for AppSession\n");
	}
	
	return las;
}

/**
 * Delete application session
 *
 * @param as pointer to session which will be deleted
 */

void AppSessionDelete( AppSession *as )
{
	DEBUG("Delete app session\n");
	if( as != NULL )
	{
		//ThreadCancel( as->as_Thread, TRUE );
		//ThreadDelete( as->as_Thread );
		
		DEBUG("Remove sessions\n");
		
		pthread_mutex_lock( &as->as_SessionsMut );
		
		ASUList *ali = as->as_UserSessionList;
		ASUList *rml = ali;
		
		while( ali != NULL )
		{
			rml = ali;
			ali = (ASUList *) ali->node.mln_Succ;
			
			FFree( rml );
			rml = NULL;
		}
		
		pthread_mutex_unlock( &as->as_SessionsMut );
		
		pthread_mutex_destroy( &as->as_SessionsMut );
		
		pthread_mutex_lock( &as->as_VariablesMut );
		
		DEBUG("Remove INVARS\n");
		
		INVAREntry *le = as->as_Variables;
		INVAREntry *re = le;
		while( le != NULL )
		{
			re = le;
			le = (INVAREntry *) le->node.mln_Succ;
			
			INVAREntryDelete( re );
		}
		
		pthread_mutex_unlock( &as->as_VariablesMut );
		
		pthread_mutex_destroy( &as->as_VariablesMut );
		
		FFree( as );
		as = NULL;
	}
	DEBUG("App sessions deleted\n");
}

/**
 * Add user session to application session
 *
 * @param as application session
 * @param u user session which will be added to application session
 * @param authid authenticationid of person which will be added to application session
 * @return 0 if success, otherwise error number
 */

int AppSessionAddUser( AppSession *as, UserSession *u, char *authid )
{
	DEBUG("Add user to to appsession\n");
	FBOOL userAdded = FALSE;
	if( as != NULL && u != NULL )
	{
		pthread_mutex_lock( &as->as_SessionsMut );
		
		ASUList *lali = (ASUList *)as->as_UserSessionList;
		ASUList *endli =lali;
		while( lali != NULL )
		{
			// we check if device was added
			
			if( lali->usersession == u )
			{
				userAdded = TRUE;
				break;
			}
			endli = lali;
			lali = (ASUList *) lali->node.mln_Succ;
		}
		
		pthread_mutex_unlock( &as->as_SessionsMut );
		
		DEBUG("last sessionptr %p\n", endli );
		
		if( userAdded  == TRUE )
		{
			if( lali->authid[ 0 ] == 0 )
			{
				as->as_Timer = time( NULL );
				DEBUG("User is already invited but he did not accept previous invitation\n");
				return 0;
			}
			else
			{
				FERROR("User is already invited with session %llu\n", as->as_ASSID );
				return -1;
			}
		}
		
		pthread_mutex_lock( &as->as_SessionsMut );
		ASUList *ali =  FCalloc( 1, sizeof( ASUList ) );
		
		if( ali != NULL )
		{
			ali->ID = as->as_NumberGenerator++;
			//ali->node.mln_Succ = (MinNode *)as->as_UserList;
			ali->usersession = u;
			endli->node.mln_Succ  =  (MinNode *)ali;
			//as->as_UserList = ali;
			if( authid != NULL )
			{
				DEBUG("Auth id set %s in ptr %p\n", authid, ali );
				strcpy( ali->authid, authid );
			}
		}
		pthread_mutex_unlock( &as->as_SessionsMut );
		
		as->as_Timer = time( NULL );
	}
	return 0;
}

/**
 * Remove user session from application session
 *
 * @param as application session
 * @param us user session which will be removed from application session
 * @return 0 if success, otherwise error number
 */

int AppSessionRemUsersession( AppSession *as, UserSession *u )
{
	if( as != NULL )
	{
		DEBUG("AppSessionRemUsersession %s\n", u->us_SessionID );
		
		pthread_mutex_lock( &as->as_SessionsMut );
		
		ASUList *ali = (ASUList *)as->as_UserSessionList->node.mln_Succ; // we cannot remove owner
		ASUList *prevali = as->as_UserSessionList;
		
		while( ali != NULL )
		{
			if( u ==  ali->usersession  )
			{
				if( ali == as->as_UserSessionList )
				{
					as->as_UserSessionList =(ASUList *)ali->node.mln_Succ;
				}
				else
				{
					prevali->node.mln_Succ = ali->node.mln_Succ;
				}
				
				as->as_UserNumber--;
				DEBUG("Session removed, sessions %d\n", as->as_UserNumber );
				
				FFree( ali );
			
				break;
			}
		
			prevali = ali;
			ali = (ASUList *) ali->node.mln_Succ;
		}
		
		pthread_mutex_unlock( &as->as_SessionsMut );
		as->as_Timer = time( NULL );
	}
	
	return -1;
}

#define WS_MESSAGE_TEMPLATE_USER "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%llu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": %s}}}}"

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
		pthread_mutex_lock( &as->as_SessionsMut );
		
		ASUList *ali = (ASUList *)as->as_UserSessionList->node.mln_Succ; // we cannot remove owner
		ASUList *prevali = as->as_UserSessionList;
		
		while( ali != NULL )
		{
			if( u ==  ali->usersession->us_User  )
			{
				if( ali == as->as_UserSessionList )
				{
					as->as_UserSessionList =(ASUList *)ali->node.mln_Succ;
				}
				else
				{
					prevali->node.mln_Succ = ali->node.mln_Succ;
				}
			
				as->as_UserNumber--;
				//break;
			}
		
			prevali = ali;
			ali = (ASUList *) ali->node.mln_Succ;
		}
		
		pthread_mutex_unlock( &as->as_SessionsMut );
	}
	
	return 0;
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
	
	DEBUG("------------> %s\n", userlist );
	
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
		
		DEBUG("------------after > %s\n", userlist );
		
		upositions[ 0 ] = userlist;
		usersi = 1;
		
		listsize = strlen( userlist );
		
		for( i = 1 ; i < listsize; i++ )
		{
			if( userlist[ i ] == ',' )
			{
				DEBUG("entry found!\n");
				userlist[ i ] = 0;
				upositions[ usersi++ ] = &(userlist[ i+1 ]);
			}
		}
		
		// I assume that user can have max 8 sessions - usersi * 512 * 8
		DEBUG("Bytes %d for users will be allocated\n", ( usersi << 9 ) << 3 );
		userlistadded = FCalloc( ( usersi << 9 ) << 3, sizeof(char) );
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

				pthread_mutex_lock( &as->as_SessionsMut );
				
				ASUList *curgusr = as->as_UserSessionList;
				while( curgusr != NULL )
				{
					FERROR("Check users  '%s'='%s'\n", upositions[ i ], curgusr->usersession->us_User->u_Name );
					if( strcmp( upositions[ i ], curgusr->usersession->us_User->u_Name  ) == 0  )
					{
						DEBUG("User found\n");

						if( curgusr->status == ASSID_US_STATUS_NEW )
						{
							curgusr->status = ASSID_US_INVITED;
						}
						break;
					}
					curgusr = (ASUList *) curgusr->node.mln_Succ;
				}
				pthread_mutex_unlock( &as->as_SessionsMut );

				//
				// user was not added  we must find it in system sessions
				//

				if( curgusr == NULL )
				{
					while( usrses != NULL )
					{
						// if user is not logged in he will not get invitation
						DEBUG("Going throug sessions userptr %p\n", usrses->us_User );

						if( usrses->us_User != NULL )
						{
							DEBUG("share ---------------------- %s --- ptr to list %p\n", usrses->us_User->u_Name, usrses );

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
									err = AppSessionAddUser( as, usrses, NULL );

									DEBUG("newsession will be added %p\n", usrses );

									if( err == 0 )
									{
										int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", usrses->us_User->u_Name, usrses->us_DeviceIdentity );

										if( pos > 0  )
										{
											strcat( userlistadded, "," );
										}

										DEBUG("New entry will be added: %s , currentlist size %d\n", tmp, (int)strlen(userlistadded ) );

										strcat( userlistadded, tmp );
										pos++;

										char tmpmsg[ 2048 ];
										int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%llu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->as_ASSID, msg, loggedSession->us_User->u_Name , appname );
										//TODO add application name

										WebSocketSendMessageInt( usrses, tmpmsg, len );
									}
								}
							}
						}
						else
						{
							DEBUG("Usersession is nott connected to user '%s' userid %lu\n", usrses->us_SessionID, usrses->us_UserID );
						}
						usrses  = (UserSession *)usrses->node.mln_Succ;
					}	//while lusr
				}// if userfound
				else
				{
					UserSession *ses = (UserSession *)curgusr->usersession;
					
					DEBUG("Found user session %p wscon %p\n", ses, ses->us_WSConnections );
					
					if( ses != NULL && ses->us_WSConnections != NULL && ses != loggedSession )
					{
						char tmp[ 512 ];
						int tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"deviceid\":\"%s\",\"result\":\"invited\"}", ses->us_User->u_Name, ses->us_DeviceIdentity );
					
						if( pos > 0  )
						{
							strcat( userlistadded, "," );
						}
					
						DEBUG("Old entry will be updated: %s , currentlist size %d\n", tmp, (int)strlen(userlistadded ) );
					
						strcat( userlistadded, tmp );
						pos++;
					
						char tmpmsg[ 2048 ];
						int len = sprintf( tmpmsg, "{ \"type\":\"msg\", \"data\":{\"type\":\"sasid-request\",\"data\":{\"sasid\":\"%llu\",\"message\":\"%s\",\"owner\":\"%s\" ,\"appname\":\"%s\"}}}", as->as_ASSID, msg, loggedSession->us_User->u_Name , appname );
						//TODO add application name
					
						WebSocketSendMessageInt( ses, tmpmsg, len );
					}
				}
			} // for usersi
			strcat( userlistadded,  "]}" );
		}	// check if userlistadded != NULL
	}
	else
	{
		DEBUG("Userlist is equal to NULL\n");
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

	if( as != NULL )
	{
		// remove spaces and 'weird' chars from entry
		unsigned int i, j=0;
		
		DEBUG("------------> %s\n", userlist );
		
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
			
			DEBUG("------------after > %s\n", userlist );
			
			upositions[ 0 ] = userlist;
			usersi = 1;
			
			listsize = strlen( userlist );
				
			for( i = 1 ; i < listsize; i++ )
			{
				if( userlist[ i ] == ',' )
				{
					DEBUG("entry found!\n");
					userlist[ i ] = 0;
					upositions[ usersi++ ] = &(userlist[ i+1 ]);
				}
			}
			
			//userlistadded = FCalloc( usersi * 512, sizeof(char) );
		}
	}
	else
	{
		DEBUG("as = NULL\n" );
	}
	
	// find user sessions by username
	// and send message
	
	pthread_mutex_lock( &as->as_SessionsMut );
	
	UserSession *adminSession = NULL;
	char tmp[ 1024 ];
	int msgsndsize = 0;
	ASUList *asul = as->as_UserSessionList;
	ASUList **rementr = NULL;
	unsigned int rementrnum = 0;
	int returnEntry = 0;
	
	DEBUG("Number of entries in AS %d\n", as->as_UserNumber );
	
	if( as->as_UserNumber > 0 )
	{
		rementr = FCalloc( as->as_UserNumber+100, sizeof(ASUList *) );
		
		User *assidAdmin = NULL;
	
		while( asul != NULL )
		{
			for( i = 0 ; i < usersi ; i++ )
			{
				if( asul->usersession->us_User != NULL )
				{
					DEBUG("Checking user '%s'\n", upositions[ i ] );
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
							DEBUG("Admin will be removed\n");
							adminSession = asul->usersession;
						}
						rementr[ rementrnum++ ] = asul;
					}
				}
			}

			asul = (ASUList *) asul->node.mln_Succ;
		}
	}
	
	pthread_mutex_unlock( &as->as_SessionsMut );
	
	//
	// we want to remove admin
	//
	
	if( rementr != NULL )
	{
		if( adminSession != NULL )
		{
			asul = as->as_UserSessionList;
			while( asul != NULL )
			{
				int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%llu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", asul->authid, as->as_ASSID,  loggedSession->us_User->u_Name, asul->usersession->us_User->u_Name );
				msgsndsize += WebSocketSendMessageInt( asul->usersession, tmp, len );
			
				asul = (ASUList *) asul->node.mln_Succ;
			}
		}
		else
		{
			for( i=0 ; i < rementrnum ; i++ )
			{
				DEBUG(" authid %s sasid %lu userptr %p usersessptr %p usersessuser ptr %p\n", (unsigned long)rementr[ i ]->authid, as->as_ASSID,  loggedSession->us_User, rementr[ i ]->usersession, rementr[ i ]->usersession->us_User );
				int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%llu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", rementr[ i ]->authid, as->as_ASSID,  loggedSession->us_User->u_Name, rementr[ i ]->usersession->us_User->u_Name );
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
	ASUList *us;		// user session
	
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
	WebsocketClient *ws = (WebsocketClient *) lwsc;
	RWSCon *root = NULL;
	RWSCon *rwsentr = NULL;
	
	DEBUG("App session remove by WS\n");
	
	while( as != NULL )
	{
		ASUList *le = as->as_UserSessionList;
		while( le != NULL )
		{
			DEBUG("Going through US\n");
			if( le->usersession != NULL )
			{
				WebsocketClient *lws = le->usersession->us_WSConnections;
				while( lws != NULL )
				{
					if( lws == ws )
					{
						RWSCon *ne = FCalloc( 1, sizeof( RWSCon ) );
						if( ne != NULL )
						{
							ne->as = as;
							ne->us = le;
							
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
						
						break;
					}
					lws = (WebsocketClient *)lws->node.mln_Succ;
				}
			}
			le = (ASUList *)le->node.mln_Succ;
		}
		
		as = (AppSession *)as->node.mln_Succ;
	}
	
	rwsentr = root;
	while( rwsentr != NULL )
	{
		DEBUG("Remove entry and send message\n");
		RWSCon *re = rwsentr;

		rwsentr = rwsentr->next;
		
		if( re != NULL )
		{
			char tmpmsg[ 255 ];
			int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", re->us->usersession->us_User->u_Name );
			
			DEBUG("Session found and will be removed\n");
			int err = 0;
			
			if( re->as->as_UserSessionList == re->us )
			{
				err = AppSessionSendMessage( as, re->us->usersession, tmpmsg, msgsize );
			}
			else
			{
				err = AppSessionSendOwnerMessage( as, re->us->usersession, tmpmsg, msgsize );
			}
			
			err = AppSessionRemUsersession( as, re->us->usersession );
			
			FFree( re );
		}
		
	}
	
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

int AppSessionSendMessage( AppSession *as, UserSession *sender, char *msg, int length )
{
	int msgsndsize = 0;
	if( as == NULL || sender == NULL )
	{
		DEBUG("AppSession or sender parameter are empty\n");
		return -1;
	}
	
	DEBUG("Send message %s\n", msg );
	
	time_t ntime = time( NULL );
	FERROR("OLD TIME %lld NEW TIME %lld\n", (long long)as->as_Timer, (long long)ntime );
	if( ( ntime - as->as_Timer ) > TIMEOUT_APP_SESSION )
	{
		as->as_Obsolete = TRUE;
	}
	as->as_Timer = ntime;
	
	FERROR("DEBUG %s\n", msg );
	
	ASUList *ali = as->as_UserSessionList;
	while( ali != NULL )
	{
		if( ali->usersession == sender )
		{
			// sender should receive response
			DEBUG("SENDER AUTHID %s\n", ali->authid );
		}
		else
		{
			char *newmsg = NULL;
			
			if( ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
			{
				User *usend = sender->us_User;
				
				DEBUG("Sendmessage AUTHID %s\n", ali->authid );
				
				int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, ali->authid, as->as_ASSID, usend->u_Name, msg );
				
				msgsndsize += WebSocketSendMessageInt( ali->usersession, newmsg, newmsgsize );
				DEBUG("FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, ali->usersession->us_User->u_Name, msgsndsize );
				FFree( newmsg );
			}
			else
			{
				FERROR("Cannot allocate memory for message\n");
			}
		}
			
		ali = (ASUList *) ali->node.mln_Succ;
	}
	
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
		DEBUG("AppSession parameter is empty\n");
		return -1;
	}
	
	time_t ntime = time( NULL );
	FERROR("OLD TIME %lld NEW TIME %lld\n", (long long)as->as_Timer, (long long)ntime );
	if( ( ntime - as->as_Timer ) > TIMEOUT_APP_SESSION )
	{
		as->as_Obsolete = TRUE;
	}
	as->as_Timer = ntime;
	
	FERROR("SEND OWNER MESAGE\n");
	DEBUG("Send message %s\n", msg );
	
	char *newmsg = NULL;
	
	if( ( newmsg = FCalloc( length+256, sizeof(char) ) ) != NULL )
	{
		User *usend = sender->us_User;
		DEBUG("AS POINTER %p SENDER %p\n", as, usend );
		int newmsgsize = sprintf( newmsg, WS_MESSAGE_TEMPLATE_USER, as->as_AuthID, as->as_ASSID, usend->u_Name, msg );
				
		msgsndsize += WebSocketSendMessageInt( as->as_UserSessionList->usersession, newmsg, newmsgsize );
		DEBUG("FROM %s  TO %s  MESSAGE SIZE %d\n", usend->u_Name, as->as_UserSessionList->usersession->us_User->u_Name, msgsndsize );
		//FERROR("Message sent to user %s size %d  to user %s\n", as->as_UserList->user->u_Name, msgsndsize, as->as_UserList->user->u_Name );
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
		DEBUG("AppSession or sender parameter are empty\n");
		return -1;
	}
	
	DEBUG("Send message %s\n", msg );
	
	ASUList *ali = as->as_UserSessionList;
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
			DEBUG("Message sent to user %s size %d\n", ali->usersession->us_User->u_Name, msgsndsize );
		}
			
		ali = (ASUList *) ali->node.mln_Succ;
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

ASUList *GetListEntryBySession( AppSession *as, UserSession *ses )
{
	pthread_mutex_lock( &as->as_SessionsMut );
	ASUList *li = as->as_UserSessionList;
		
	// Find invitee user with authid from user list in allowed users
	while( li != NULL )
	{
		DEBUG(" sessionfrom list %p loggeduser session %p\n",  li->usersession, ses );
		if( li->usersession == ses )
		{
			break;
		}
		li = ( ASUList * )li->node.mln_Succ;
	}
	pthread_mutex_unlock( &as->as_SessionsMut );
	
	return li;
}
