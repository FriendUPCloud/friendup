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
 *  CommunicationService body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 20/06/2017
 */

#include <core/types.h>
#include "comm_service.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <signal.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <sys/time.h>
#include <sys/types.h>
#include <sys/mman.h>
#ifndef USE_SELECT
#include <sys/epoll.h>
#endif
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <properties/propertieslibrary.h>
#include <core/friendcore_manager.h>
#include <communication/comm_msg.h>
#include <system/systembase.h>

/**
 * Parse and run incomming Service messages
 *
 * @param serv pointer to CommuncationService
 * @param socket pointer to socket which will be used to stream response (if required)
 * @param data pointer to data where incoming message is stored
 * @param len pointer to incoming message size
 * @param isStream pointer to information if messsage will be streamed
 * @return pointer to DataForm (response message)
 */
/*
DataForm *ParseMessage( CommService *serv, Socket *socket, FBYTE *data, int *len,  FBOOL *isStream )
{
	DataForm *df = (DataForm *)data;
	DataForm *actDataForm = NULL;
	
	if( *len <= 0 )
	{
		DEBUG("[ParseMessage] No more data provided, quit!\n");
		return NULL;
	}
	
	FULONG responseID = 0;
	
	if( df->df_ID == ID_FCRE )
	{
		DEBUG("[ParseMessage] Found main header\n");
		
		*len -= COMM_MSG_HEADER_SIZE;
		
		data += COMM_MSG_HEADER_SIZE;
		df = (DataForm *)data;
		
		if( df->df_ID == ID_FRID )
		{
			responseID = df->df_Size;
			DEBUG("[ParseMessage] ResponseID set %lu\n", responseID );
		}
		
		data += COMM_MSG_HEADER_SIZE;
		df = (DataForm *)data;
		
		if( df->df_ID == ID_QUER )
		{
			DEBUG("[ParseMessage] QUERY FOUND %ld\n", df->df_Size );
			SystemBase *lsb = (SystemBase *)serv->s_SB;
			FriendCoreManager *fcm = lsb->fcm;//serv->s_FCM;
			//
			 //*			MsgItem tags[] = {
			// *				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
			// *				{ ID_FRID, 0, 0 },
			// *					{ ID_RESP, (FULONG)64, (FULONG)fcm->fcm_ID },
			// *				{ MSG_GROUP_END, 0,  0 },
		//	 *				{ TAG_DONE, TAG_DONE, TAG_DONE }
	//	};
		
		//actDataForm = DataFormNew( tags );
		
			
			//*len -= df->df_Size;
			//data += COMM_MSG_HEADER_SIZE + df->df_Size;
			//df = (DataForm *)data;
			
			//
			// Services Information
			//
			
			if( df->df_Size == FC_QUERY_SERVICES )
			{
				DEBUG("[ParseMessage] Found services information query\n");
				
				SystemBase *lsb = (SystemBase *)serv->s_SB;
				FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;//serv->s_FCM;
				Service *lsrv = fcm->fcm_ServiceManager->sm_Services;
				FULONG size = 0;
				
				// getting size of names for a buffer
				
				while( lsrv != NULL )
				{
					DEBUG( "[ParseMessage] Getting lsrv information\n" );
					size += strlen( lsrv->GetName() ) + 1 + COMM_MSG_HEADER_SIZE;
					lsrv = (Service *)lsrv->node.mln_Succ;
				}
				
				// we create buffer now and put names into it
				
				if( size > 0 )
				{
					FBYTE *tmpnames = FCalloc( size, sizeof( char ) );
					if( tmpnames != NULL )
					{
						struct MsgItem tags[] = {
							{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
							{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
							{ ID_RESP, (FULONG)0, (FULONG)0 },
							{ ID_SVIN, (FULONG)0, (FULONG)NULL },
							{ TAG_DONE, TAG_DONE, TAG_DONE }
						};
						
						actDataForm = DataFormNew( tags );
						
						FBYTE *nameptr = tmpnames;
						ID snameinfo = ID_SNAM;
						FULONG snamesize = 0;
						
						lsrv = fcm->fcm_ServiceManager->sm_Services;
						while( lsrv != NULL )
						{
							snamesize = strlen( lsrv->GetName() ) + 1;
							int copyStringSize = snamesize;
							snamesize += COMM_MSG_HEADER_SIZE;
							
							DEBUG("[ParseMessage] Adding service to answer '%s'\n", lsrv->GetName() );
							
							memcpy( nameptr, &snameinfo, sizeof(FULONG) );
							nameptr += sizeof(FULONG);
							memcpy( nameptr, &snamesize, sizeof(FULONG) );
							nameptr += sizeof(FULONG);
							memcpy( nameptr, lsrv->GetName(), copyStringSize );
							nameptr += copyStringSize;
							
							lsrv = (Service *)lsrv->node.mln_Succ;
						}
						
						DataFormAdd( &actDataForm, tmpnames, size );
						DEBUG("[ParseMessage] Adding service to message\n");
						
						FFree( tmpnames );
					}
				}
				data += COMM_MSG_HEADER_SIZE;
				*len -= COMM_MSG_HEADER_SIZE;
			}
			
			//
			// system.library calls
			//
			
			else if( df->df_ID == ID_SLIB )
			{
				
				DEBUG("[ParseMessage] Systembase called\n");
				data += COMM_MSG_HEADER_SIZE;
				df = (DataForm *)data;
				
				// SLIB  + SIZE
				// HTTP HEADER + SIZE
				// AUTH + SIZE
				//{
				// USER + SIZE / PASSWORD + SIZE
				// AUTHID + SIZE
				//}
				// HTTP + SIZE
				//{
				// PATH + SIZE
				// PARM + SIZE
				//{
				//PRMT + SIZE / PRMT + SIZE .......
				//}
				//}
				
				if( df->df_ID == ID_HTTP )
				{
					Http *http = HttpNew( );
					http->parsedPostContent = HashmapNew();
					char temp[ 1024 ];
					char *pathParts[ 1024 ];
					memset( pathParts, 0, 1024 );
					
					data += COMM_MSG_HEADER_SIZE;
					df = (DataForm *)data;
					
					if( df->df_ID == ID_AUTH )
					{
						data += COMM_MSG_HEADER_SIZE;
						df = (DataForm *)data;
						
						if( df->df_ID == ID_USER )
						{
							data += COMM_MSG_HEADER_SIZE;
							
							memset( temp, 0, 1024 );
							//strncpy( temp, data, df->df_Size );
							memcpy( temp, data, df->df_Size );
							
							data += df->df_Size;
							df = (DataForm *)data;
							
							if( df->df_ID == ID_PSWD )
							{
								data += COMM_MSG_HEADER_SIZE;
								
								memset( temp, 0, 1024 );
								//strncpy( temp, data, df->df_Size );
								memcpy( temp, data, df->df_Size );
								
								data += df->df_Size;
								df = (DataForm *)data;
							}
						}
						else if( df->df_ID == ID_APID )
						{
							data += COMM_MSG_HEADER_SIZE;
							
							memset( temp, 0, 1024 );
							//strncpy( temp, data, df->df_Size );
							memcpy( temp, data, df->df_Size );
							
							data += df->df_Size;
							df = (DataForm *)data;
						}
					}
					
					if( df->df_ID == ID_PATH )
					{
						data += COMM_MSG_HEADER_SIZE;
						unsigned int i;
						
						pathParts[ 0 ] = NULL;
						int part = 1;
						for( i=1; i < df->df_Size ; i++ )
						{
							if( data[ i ] == '/' )
							{
								pathParts[ part ] = (char *) &(data[ i+1 ]);
								
								part++;
								data[ i ] = 0;
							}
						}

						//memset( temp, 0, 1024 );
						//strncpy( temp, data, df->df_Size );
						
						data += df->df_Size;
						df = (DataForm *)data;
					}
					
					if( df->df_ID == ID_PARM )
					{
						int size = df->df_Size;

						data += COMM_MSG_HEADER_SIZE;
						df = (DataForm *)data;
						
						while( size > 1 )
						{
							data += COMM_MSG_HEADER_SIZE;
							
							if( df->df_ID == ID_PRMT )
							{
								char *temp = (char *)data;
								int parsize = 0;
								
								unsigned int i;
								char *attr = temp;
								char *val = NULL;
								
								
								for( i=1 ; i < df->df_Size ; i++ )
								{
									if( temp[ i ] == '=' )
									{
										temp[ i ] = 0;
										val = &(temp[ i+1 ]);
										parsize = df->df_Size - (i+1);
										DEBUG("[ParseMessage] Message size %d  - parameter size %ld\n", parsize, df->df_Size );
										break;
									}
								}
								
								//DEBUG("New values passed to before %s %s\n", attr, val );
								
								if( attr != NULL && val != NULL )
								{
									char *param = NULL;
									if( ( param = FCalloc( parsize+1, sizeof(char) ) ) != NULL )
									{
										memcpy( param, val, parsize );
										param[ parsize ] = 0;
										DEBUG("[ParseMessage] Mem allocated for data %p\n",  param );
									}
									//char *param = StringDuplicateN( val, parsize );
									if( HashmapPut( http->parsedPostContent, StringDuplicate( attr ), param ) )
									{
										DEBUG("[ParseMessage] New values passed to POST - %s - %.10s -\n", attr, val );
									}
								}
								
								data += df->df_Size;
								size -= df->df_Size;
								df = (DataForm *)data;
							}
							else
							{
								size--;
								data++;
							}
						}
					}
					
					http->h_Socket = socket;
					http->h_RequestSource = HTTP_SOURCE_FC;
					http->h_ResponseID = responseID;
					DEBUG2("-----------------------------Calling SYSBASE via CommuncationService: %s\n", (pathParts[ 1 ]) );
					
					SystemBase *lsysbase = (SystemBase *) serv->s_SB;
					if( lsysbase != NULL )
					{
						int respcode = 0;
						Http *response = lsysbase->SysWebRequest( lsysbase, &(pathParts[ 1 ]), &http, NULL, &respcode );
						if( response != NULL )
						{
							*isStream = response->h_Stream;
							MsgItem tags[] = {
								{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
								{ ID_FRID, (FULONG)responseID , MSG_INTEGER_VALUE },
								{ ID_RESP, (FULONG)response->sizeOfContent+1, (FULONG)response->content },
								//{ MSG_GROUP_END, 0,  0 },
								{ TAG_DONE, TAG_DONE, TAG_DONE }
							};
							
							actDataForm = DataFormNew( tags );
							
							DEBUG("[ParseMessage] Messsage received from systembase, responseid %lu\n", actDataForm[ 1 ].df_Size );
							
							HttpFree( response );
						}
						else
						{
							FERROR("Response was empty!\n");
						}
					}	// Sysbase checking
					HttpFree( http );
				}
			}
			
			//
			// FILE
			//
			
			else if( df->df_ID == ID_FILE )
			{
				
			}
		}
	}
	else
	{
		FERROR("ID is not correct, message was not procesed\n");
	}
	
	DEBUG("[ParseMessage] End MSG!\n");
	
	return actDataForm;
}
*/

/**
 * Parse and run incomming Service messages
 *
 * @param sb poitner to SystemBase
 * @param con pointer to communication connection
 * @param df pointer to DataForm
 * @param reqid request ID
 * @return return new DataForm when success, otherwise NULL
 */

DataForm *ParseAndExecuteRequest( void *sb, CommFCConnection *con, DataForm *df, FULONG reqid )
{
	SystemBase *lsb = (SystemBase *)sb;
	DataForm *respdf = NULL;
	
	FERROR("\t\t[ParseAndExecuteRequest] ParseAndExecuteRequest con %p\n", con );
	
	if( df->df_ID == ID_CMMD )
	{
		DEBUG("[ParseAndExecuteRequest] Command received\n");
		df++;
	}
	else
	{
		FERROR("Command not recognized!\n");
		return NULL;
	}
	
	FULONG command = df->df_ID;
	FULONG param = df->df_Size;
	
	Hashmap *paramhm = HashmapNew();
	
	/*
	 int iuname = sprintf( luname, "username=%s", uname );           *
	 int iauthid = sprintf( lauthid, "authid=%s", authid );
	 int ilocuname = sprintf( llocuname, "locusername=%s", locuname );
	 */
	
	/*
	int ilocalDevName = sprintf( llocalDevName, "locdevname=%s", localDevName );
	int iremoteDevName = sprintf( lremoteDevName, "remotedevname=%s", remoteDevName );
	*/
	
	df++;
	
	if( df->df_ID == ID_PARM )
	{
		DEBUG("[ParseAndExecuteRequest] Found parameters\n");
		char *data = (char *)df;
		int size = df->df_Size;
		
		data += COMM_MSG_HEADER_SIZE;
		df = (DataForm *)data;
		
		while( size > 1 )
		{
			data += COMM_MSG_HEADER_SIZE;
			if( df->df_ID == ID_PRMT )
			{
				char *temp = (char *)data;
				int parsize = 0;
				
				unsigned int i;
				char *attr = temp;
				char *val = NULL;

				for( i=1 ; i < df->df_Size ; i++ )
				{
					if( temp[ i ] == '=' )
					{
						temp[ i ] = 0;
						val = &(temp[ i+1 ]);
						parsize = df->df_Size - (i+1);
						DEBUG("[ParseAndExecuteRequest] Message size %d  - parameter size %ld\n", parsize, df->df_Size );
						break;
					}
				}
				
				if( attr != NULL && val != NULL )
				{
					char *param = NULL;
					if( ( param = FCalloc( parsize+1, sizeof(char) ) ) != NULL )
					{
						memcpy( param, val, parsize );
						param[ parsize ] = 0;
						DEBUG("[ParseAndExecuteRequest] Mem allocated for data %p\n",  param );
					}

					if( HashmapPut( paramhm, StringDuplicate( attr ), param ) )
					{
						DEBUG("[ParseAndExecuteRequest] New values - %s - %.10s -\n", attr, val );
					}
				}
				
				data += df->df_Size;
				size -= df->df_Size;
				df = (DataForm *)data;
			}
			else
			{
				size--;
				data++;
			}
		}
	}

	switch( command )
	{
		case ID_RUSR:	// register drive
			break;
		case ID_UUSR:	// unregister drive
			break;
		case ID_RDRI:	// register drive
			DEBUG("[ParseAndExecuteRequest] Register drive\n");
			FULONG deviceid = 0;
			char *strdevid = HashmapGetData( paramhm, "deviceid" );
			if( strdevid != NULL )
			{
				char *next;
				deviceid = strtoul( strdevid, &next, 0 );
			}
			//int UMAddRemoteDriveToUser( UserManager *um, CommFCConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG id );
			int error = UMAddRemoteDriveToUser( lsb->sl_UM, con, HashmapGetData( paramhm, "username" ), HashmapGetData( paramhm, "locusername" ), HashmapGetData( paramhm, "authid" ), HashmapGetData( paramhm, "remotedevname" ), HashmapGetData( paramhm, "remotedevname" ), HashmapGetData( paramhm, "locdevname" ), deviceid );
			break;
		case ID_UDRI:	// unregister drive
			break;
		case ID_FNOT:
			INFO("Notification received\n");
			
			char *locuname = HashmapGetData( paramhm, "usrname" );
			char *locpath = HashmapGetData( paramhm, "path" );
			char *locdevname = HashmapGetData( paramhm, "devname" );
			char *locdeviceid = HashmapGetData( paramhm, "deviceid" );
			
			User *usr = lsb->sl_UM->um_Users;
			while( usr != NULL )
			{
				//DEBUG("Compare owner id's  session %ld  lock session %ld  deviceident %s\n", uses->us_ID, notification->dn_OwnerID, uses->us_DeviceIdentity );
				if( strcmp( locuname, usr->u_Name) == 0 )
				{
					UserSessListEntry *ul = usr->u_SessionsList;
					
					char tmpmsg[ 2048 ];
					
					while( ul != NULL )
					{
						UserSession *session = (UserSession *)ul->us;
						
						int len = snprintf( tmpmsg, sizeof(tmpmsg), "{ \"type\":\"msg\", \"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%s\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", locdeviceid, locdevname, locpath, locuname  );
					
						//FERROR("[DoorNotificationCommunicateChanges] Send message %s function pointer %p sbpointer %p to sessiondevid: %s\n", tmpmsg, sb->WebSocketSendMessage, sb, session->us_DeviceIdentity );
						lsb->WebSocketSendMessage( sb, session, tmpmsg, len );
						
						ul = (UserSessListEntry *)ul->node.mln_Succ;
					}
				}
				
				usr = (User *)usr->node.mln_Succ;
			}
			break;
			
		case ID_QUER:
			DEBUG("[ParseMessage] Found services information query %x\n", df->df_Size );
			
			FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;//serv->s_FCM;
			
			if( param == FC_QUERY_SERVICES )
			{
				DEBUG("[ParseMessage] Found services information query 1\n");
				Service *lsrv = fcm->fcm_ServiceManager->sm_Services;
			
				BufString *bs = BufStringNew();
			
				// we create buffer now and put names into it

				int pos = 0;
				lsrv = fcm->fcm_ServiceManager->sm_Services;
			
				BufStringAddSize( bs, "{", 1 );
			
				while( lsrv != NULL )
				{
					char temp[ 128 ];
					int size = 0;
				
					if( pos == 0 )
					{
						size = snprintf( temp, sizeof(temp), "\"service\"=\"%s\"", lsrv->GetName() );
					}
					else
					{
						size = snprintf( temp, sizeof(temp), ",\"service\"=\"%s\"", lsrv->GetName() );
					}
					BufStringAddSize( bs, temp, size );
				
					lsrv = (Service *)lsrv->node.mln_Succ;
					pos++;
				}
				BufStringAddSize( bs, "}", 1 );
			
				MsgItem tags[] = {
					{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
					{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
					{ ID_FCRI, (FULONG)reqid , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)FC_QUERY_SERVICES, MSG_INTEGER_VALUE },
					{ ID_RESP, (FULONG)bs->bs_Size+1, (FULONG)bs->bs_Buffer },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				};
			
				DEBUG( "[ParseMessage] Prepare response with id: %lu buffer: %s\n", reqid, bs->bs_Buffer );
			
				respdf = DataFormNew( tags );
			
				BufStringDelete( bs );
			}
			else if( param == FC_QUERY_GEOLOC )
			{
				
			}
			else if( param == FC_QUERY_FRIENDCORE_INFO )
			{
				BufString *bs = FriendCoreInfoGet( lsb );
				
				MsgItem tags[] = {
					{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
					{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
					{ ID_FCRI, (FULONG)reqid , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)FC_QUERY_FRIENDCORE_INFO, MSG_INTEGER_VALUE },
					{ ID_RESP, (FULONG)bs->bs_Size+1, (FULONG)bs->bs_Buffer },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				};
			
				DEBUG( "[ParseMessage] Prepare response with id: %lu\n", reqid );
			
				respdf = DataFormNew( tags );
			
				BufStringDelete( bs );
			}
		break;
	}
	HashmapFree( paramhm );

	return respdf;
}
