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
#include <interface/properties_interface.h>
#include <core/friendcore_manager.h>
#include <communication/comm_msg.h>
#include <system/systembase.h>
#include <system/systembase_web.h>

// disable debug
//#undef __DEBUG

/**
 * Parse and run incomming Service messages
 *
 * @param sb poitner to SystemBase
 * @param con pointer to communication connection
 * @param df pointer to DataForm
 * @param reqid request ID
 * @return return new DataForm when success, otherwise NULL
 */

DataForm *ParseAndExecuteRequest( void *sb, FConnection *con, DataForm *df, FULONG reqid )
{
	SystemBase *lsb = (SystemBase *)sb;
	DataForm *respdf = NULL;
	
	DEBUG("[ParseAndExecuteRequest] ParseAndExecuteRequest con %p\n", con );
	
	if( df->df_ID == ID_CMMD )
	{
		DEBUG("[ParseAndExecuteRequest] Command received\n");
		df++;
		
		if( df->df_ID == ID_PING )
		{
			uint64_t ptime = df->df_Size;
			
			DEBUG("PINGRECV data %lu size %lu id %x\n", df->df_Data, df->df_Size, (unsigned int)df->df_ID );
			
			df += 2;
			// get number of user sessions
			if( df->df_ID == ID_WSES && con->fc_Data != NULL )
			{
				ClusterNode *cn = (ClusterNode *)con->fc_Data;
				cn->cn_UserSessionsCount = df->df_Size;
				DEBUG("[ParseAndExecuteRequest] Number of sessions on another core: %d\n", cn->cn_UserSessionsCount );
			}
			
			MsgItem tags[] = {
				{ ID_FCRE,  (uint64_t)0, (uint64_t)MSG_GROUP_START },
				{ ID_FCID, (uint64_t)FRIEND_CORE_MANAGER_ID_SIZE, (uint64_t)lsb->fcm->fcm_ID },
				{ ID_FCRI, (uint64_t)reqid , MSG_INTEGER_VALUE },
				{ ID_PING, (uint64_t)ptime, MSG_INTEGER_VALUE },
				{ ID_FINF, (uint64_t)0, (uint64_t)MSG_GROUP_START },
					{ ID_WSES, (uint64_t)lsb->sl_USM->usm_SessionCounter , MSG_INTEGER_VALUE },
				{ MSG_GROUP_END, 0,  0 },
				{ TAG_DONE, TAG_DONE, TAG_DONE }
			};
		
			DEBUG( "[ParseMessage] PING response id: %lu time received: %lu num of local sessions: %d num of remote sessions %lu\n", reqid, ptime, lsb->sl_USM->usm_SessionCounter, df->df_Size );
			
			return DataFormNew( tags );
		}
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
	
	//DEBUG("[ParseAndExecuteRequest] dfid %ld - %d\n", df->df_ID, ID_PARM );
	
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
				
				DEBUG("[ParseAndExecuteRequest] PARAMETER: %s\n", temp );

				for( i=1 ; i < df->df_Size ; i++ )
				{
					//printf("%c ", temp[ i ] );
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
						DEBUG("[ParseAndExecuteRequest] Mem allocated for data %p - %s\n",  param, param );
					}

					if( HashmapPut( paramhm, StringDuplicate( attr ), param ) == MAP_OK )
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
			
			User *usr = UMGetUserByName( lsb->sl_UM, locuname );
			if( usr != NULL )
			{
				USER_LOCK( usr );
				UserSessListEntry *ul = usr->u_SessionsList;
				
				char tmpmsg[ 2048 ];
				
				while( ul != NULL )
				{
					UserSession *session = (UserSession *)ul->us;
				
					int len = snprintf( tmpmsg, sizeof(tmpmsg), "{\"type\":\"msg\",\"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%s\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", locdeviceid, locdevname, locpath, locuname  );
					
					lsb->UserSessionWebsocketWrite( session, (unsigned char *)tmpmsg, len, LWS_WRITE_TEXT );
					
					ul = (UserSessListEntry *)ul->node.mln_Succ;
				}
				USER_UNLOCK( usr );
			}
			
			break;
			
		case ID_QUER:
			DEBUG("[ParseMessage] Found services information query %x\n", (unsigned int)df->df_Size );
			
			FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;//serv->s_FCM;
			
			if( param == FC_QUERY_SERVICES )
			{
				DEBUG( "[ParseMessage] Query services call: %lu\n", reqid );
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
				DEBUG( "[ParseMessage] Geoloc call: %lu\n", reqid );
			}
			else if( param == FC_QUERY_FRIENDCORE_INFO )
			{
				BufString *bs = FriendCoreInfoGet( lsb->fcm->fcm_FCI );
				
				DEBUG( "[ParseMessage] FriendCore get info call: %lu\n", reqid );
				
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
			else if( param == FC_QUERY_FRIENDCORE_SYNC )
			{
				DEBUG( "[ParseMessage] Synchronize call: %lu\n", reqid );
				df++;	// we have to jump to next section to read sessionid
				
				char *sessionid = HashmapGetData( paramhm, "sessionid" );
				if( sessionid != NULL )
				{
					char *fsinfo;	// filesystem info
					char *uri = HashmapGetData( paramhm, "uri" );
					
					if( uri != NULL )
					{
						int res = 0;
						char *urlpath[ 20 ];
						int pos = 0;
						Http *req = HttpNew();
						if( req != NULL )
						{
							req->http_ParsedPostContent = paramhm;
							paramhm = NULL;	// it is released on the end but we will release it with HttpFree
						
							// we have to parse uri (path) to get it and put in proper way in the table
							int i;
							int urilen = strlen( uri );
						
							memset( urlpath, 0, sizeof( urlpath ) );
							urlpath[ 0 ] = uri;
						
							DEBUG( "[ParseMessage] Synchronize URI param: %s\n", uri );
						
							for( i=1 ; i < urilen ; i++ )
							{
								//printf("%c  -", uri[ i ] );
								if( uri[ i ] == '/' )
								{
									//DEBUG("->%s \n", urlpath[ pos ] );
									uri[ i ] = 0;
									i++;
									pos++;
									urlpath[ pos ] = &uri[ i ];
								}
							}
						
							UserSession *uses = USMGetSessionBySessionID( lsb->sl_USM, sessionid );
						
							req->http_RequestSource = HTTP_SOURCE_NODE_SERVER;
						
							Http *resp = SysWebRequest( lsb, &urlpath[ 1 ], &req, uses, &res );
							if( resp != NULL )
							{
								MsgItem tags[] = {
									{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
									{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
									{ ID_FCRI, (FULONG)reqid , MSG_INTEGER_VALUE },
									{ ID_QUER, (FULONG)FC_QUERY_FRIENDCORE_SYNC, MSG_INTEGER_VALUE },
									{ ID_RESP, (FULONG)strlen( resp->http_Content ) +1, (FULONG)resp->http_Content },
									{ TAG_DONE, TAG_DONE, TAG_DONE }
								};
			
								DEBUG( "[ParseMessage] Prepare response with id: %lu\n", reqid );
			
								respdf = DataFormNew( tags );
							
								HttpFree( resp );
							}
							HttpFree( req );
						}
					}
					else if( ( fsinfo = HashmapGetData( paramhm, "fschange" ) ) != NULL ) 
					{
						UserSession *uses = USMGetSessionBySessionID( lsb->sl_USM, sessionid );
						if( uses != NULL )
						{
							if( uses->us_User != NULL )
							{
								char *devid = HashmapGetData( paramhm, "devid" );
								char *devname = HashmapGetData( paramhm, "devname" );
								char *owner = HashmapGetData( paramhm, "owner" );
								char *path = HashmapGetData( paramhm, "path" );
								
								if( devid != NULL && devname != NULL && owner != NULL )
								{
									int globmlen = 128 + strlen( devid ) + strlen( devname ) + strlen( owner );
									if( path != NULL )
									{
										globmlen += strlen( path );
									}
									char *message = FCalloc( 1, globmlen );
									
									if( message != NULL )
									{
										USER_LOCK( uses->us_User );
			
										DEBUG("[ParseMessage] Send notification to user: %s id: %lu\n", uses->us_User->u_Name, uses->us_UserID );
										
										int mlen = 0;
										if( path != NULL )
										{
											mlen = snprintf( message, globmlen, "{\"type\":\"msg\",\"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%s\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\"}}}", devid, devname, path, owner  );
										}
										else
										{
											mlen = snprintf( message, globmlen, "{\"type\":\"msg\",\"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%s\",\"devname\":\"%s\",\"path\":\"\",\"owner\":\"%s\"}}}", devid, devname, owner  );
										}
										
										DEBUG("Send notification about changes in path: %s\n", path );
			
										UserSessListEntry *list = uses->us_User->u_SessionsList;
										while( list != NULL )
										{
											if( list->us != NULL )
											{
												UserSessionWebsocketWrite( list->us, (unsigned char *)message, mlen, LWS_WRITE_TEXT);
											}
											else
											{
												INFO("[ParseMessage] Cannot send WS message: %s\n", message );
											}
											list = (UserSessListEntry *)list->node.mln_Succ;
										}
										FFree( message );
									}
									USER_UNLOCK( uses->us_User );
								}
							}	// user != NULL
						}
						
						MsgItem tags[] = {
							{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
							{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
							{ ID_FCRI, (FULONG)reqid , MSG_INTEGER_VALUE },
							{ ID_QUER, (FULONG)FC_QUERY_FRIENDCORE_SYNC, MSG_INTEGER_VALUE },
							{ ID_RESP, (FULONG)3, (FULONG)"ok" },
							{ TAG_DONE, TAG_DONE, TAG_DONE }
						};

						respdf = DataFormNew( tags );
					}
				}
			}
		break;
	}
	HashmapFree( paramhm );

	return respdf;
}
