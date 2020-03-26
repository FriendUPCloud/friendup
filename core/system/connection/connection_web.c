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
 *  Connection Web body
 *
 *  All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/12/2017
 */

#include <core/types.h>
#include <core/nodes.h>
#include "connection_web.h"

#include <system/fsys/device_handling.h>
#include <core/functions.h>
#include <util/md5.h>
#include <network/digcalc.h>
#include <network/mime.h>
#include <system/invar/invar_manager.h>
#include <system/application/application_web.h>
#include <system/user/user_manager.h>
#include <system/fsys/fs_manager.h>
#include <system/fsys/fs_manager_web.h>
#include <system/fsys/fs_remote_manager_web.h>
#include <core/pid_thread_web.h>
#include <system/fsys/device_manager_web.h>
#include <network/mime.h>
#include <hardware/usb/usb_device_web.h>
#include <system/fsys/door_notification.h>

/**
 * Network handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session
 * @param result pointer to integer where error number will be returned
 * @return http response
 */
Http *ConnectionWebRequest( void *m, char **urlpath, Http **request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	DEBUG("[ConnectionWebRequest] start\n");
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicateN( "text/html", 9 ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
		{ TAG_DONE, TAG_DONE}
	};
	
	if( response != NULL )
	{
		FERROR("RESPONSE admin\n");
		HttpFree( response );
	}
	response = HttpNewSimple( HTTP_200_OK, tags );
	
	if( urlpath[ 1 ] == NULL )
	{
		FERROR( "URL path is NULL!\n" );
		
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_PATH_PARAMETER_IS_EMPTY] , DICT_PATH_PARAMETER_IS_EMPTY );
		HttpAddTextContent( response, dictmsgbuf );
		
		goto error;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/connection/list</H2>Get information about FC connections
	*
	* @param sessionid - (required) session id of logged user
	* @param id - provide if you want to get information about specific connection
	* @return function return information about FriendCore connection
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "list" ) == 0 )
	{
		HashmapElement *el = NULL;
		char *fname = NULL;
		char *temp = FMalloc( 2048 );
		int pos = 0;
		
		el = GetHEReq( *request, "id" );
		if( el != NULL && el->hme_Data )
		{
			fname = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE && temp != NULL )
		{
			BufString *bs = BufStringNew();

			BufStringAddSize( bs, "ok<!--separate-->[", 18 );

			// add other FC connections
			
			FConnection *actCon = l->fcm->fcm_CommService->s_Connections;
			while( actCon != NULL )
			{
				FBOOL addText = FALSE;
				if( fname != NULL )
				{
					if( strcmp( fname, actCon->fc_Name ) == 0 )
					{
						addText = TRUE;
					}
				}
				else
				{
					addText = TRUE;
				}

				if( addText == TRUE )
				{
					int size = 0;
					
					if( pos == 0 )
					{
						size = snprintf( temp, 2048, "{\"id\":%lu,\"name\":\"%s\",\"address\":\"%s\",\"fcid\":\"%s\",\"dstfcid\":\"%s\",\"type\":\"%d\",\"ping\":%lu,\"status\":%d,\"PEM\":\"%s\"}", actCon->fc_ID, actCon->fc_Name, actCon->fc_Address, NO_NULL( actCon->fc_FCID ), NO_NULL( actCon->fc_DestinationFCID ), actCon->fc_Type, actCon->fc_PINGTime, actCon->fc_Status, NO_NULL( actCon->fc_PEM ) );
					}
					else
					{
						size = snprintf( temp, 2048, ",{\"id\":%lu,\"name\":\"%s\",\"address\":\"%s\",\"fcid\":\"%s\",\"dstfcid\":\"%s\",\"type\":\"%d\",\"ping\":%lu,\"status\":%d,\"PEM\":\"%s\"}", actCon->fc_ID, actCon->fc_Name, actCon->fc_Address, NO_NULL( actCon->fc_FCID ), NO_NULL( actCon->fc_DestinationFCID ), actCon->fc_Type, actCon->fc_PINGTime, actCon->fc_Status, NO_NULL( actCon->fc_PEM ) );
					}
					
					DEBUG("TEMPADD: %s\n", temp );
					
					pos++;
				
					BufStringAddSize( bs, temp, size );
				}	// addText = TRUE
				
				actCon = (FConnection *)actCon->node.mln_Succ;
			}
			
			BufStringAddSize( bs, "]", 1 );
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"result\":\"User dont have access to functionality\"}" );
		}
		
		if( fname != NULL )
		{
			FFree( fname );
		}
		
		if( temp != NULL )
		{
			FFree( temp );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/connection/listcluster</H2>Get information about FCCluster connections
	*
	* @param sessionid - (required) session id of logged user
	* @param address - provide internet address you want to get information about specific connection
	* @return function return information about FriendCore connection
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "listcluster" ) == 0 )
	{
		HashmapElement *el = NULL;
		char *addr = NULL;
		char *temp = FMalloc( 2048 );
		int pos = 0;
		
		el = GetHEReq( *request, "address" );
		if( el != NULL && el->hme_Data )
		{
			addr = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE && temp != NULL )
		{
			BufString *bs = BufStringNew();

			BufStringAddSize( bs, "ok<!--separate-->[", 18 );

			// add other FC connections
			
			ClusterNode *cnode = l->fcm->fcm_ClusterNodes;
			while( cnode != NULL )
			{
				FBOOL addText = FALSE;
				if( addr != NULL )
				{
					if( strcmp( addr, cnode->cn_Address ) == 0 )
					{
						addText = TRUE;
					}
				}
				else
				{
					addText = TRUE;
				}

				if( addText == TRUE )
				{
					int size = 0;
					
					if( pos == 0 )
					{
						size = snprintf( temp, 2048, "{\"id\":\"%lu\",\"FCID\":\"%s\",\"address\":\"%s\",\"nodeid\":\"%d\",\"status\":\"%d\"}", cnode->cn_ID, cnode->cn_FCID, cnode->cn_Address, cnode->cn_NodeID, cnode->cn_Status );
					}
					else
					{
						size = snprintf( temp, 2048, ",{\"id\":\"%lu\",\"FCID\":\"%s\",\"address\":\"%s\",\"nodeid\":\"%d\",\"status\":\"%d\"}", cnode->cn_ID, cnode->cn_FCID, cnode->cn_Address, cnode->cn_NodeID, cnode->cn_Status );
					}
					
					DEBUG("TEMPADD: %s\n", temp );
					
					pos++;
				
					BufStringAddSize( bs, temp, size );
				}	// addText = TRUE
				
				cnode = (ClusterNode *)cnode->node.mln_Succ;
			}
			
			BufStringAddSize( bs, "]", 1 );
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"result\":\"User dont have access to functionality\"}" );
		}
		
		if( addr != NULL )
		{
			FFree( addr );
		}
		
		if( temp != NULL )
		{
			FFree( temp );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/connection/add</H2>add new FCConnection
	*
	* @param sessionid - (required) session id of logged user
	* @param address - (required) internet address (ip or DNS name)
	* @param name - (required) name which describe new connection
	* @param type - type of connection, avaiable values are: 
	* 	0 - normal server,
		1 - cluster node,
		2 - cluster master,
		3 - master of Friend servers
	* @return return code 59 if everything was created without problems, otherwise error number
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "add" ) == 0 )
	{
		HashmapElement *el = NULL;
		char *address = NULL, *name = NULL;
		int type = -1;
		char dictmsgbuf[ 256 ];
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
		{
			el =  HashmapGet( (*request)->http_ParsedPostContent, "address" );
			if( el != NULL )
			{
				address = UrlDecodeToMem( ( char *)el->hme_Data );
			}
		
			el =  HashmapGet( (*request)->http_ParsedPostContent, "name" );
			if( el != NULL )
			{
				name = UrlDecodeToMem( ( char *)el->hme_Data );
			}
		
			el =  HashmapGet( (*request)->http_ParsedPostContent, "type" );
			if( el != NULL )
			{
				type = atoi( ( char *)el->hme_Data );
			}
		
			if( address != NULL && name != NULL )
			{
				FConnection *ccon = l->fcm->fcm_CommService->s_Connections;
				while( ccon != NULL )
				{
					if( strcmp( name, ccon->fc_Name ) == 0 )
					{
						break;
					}
					ccon = (FConnection *) ccon->node.mln_Succ;
				}
				
				if( ccon == NULL )
				{
					CommService *service = l->fcm->fcm_CommService;
			
					DEBUG("[admin/connadd] trying to setup connection to Friend Master Server: %s\n", address );
			
					Socket *newsock = SocketConnectHost( l, service->s_secured, address, service->s_port );
					//if( newsock != NULL )
					{
						DEBUG("[connection/add] Connection to Master FriendNode created on port: %d\n", service->s_port);
						
						int nodeMaster = 0;
						if( type == SERVER_TYPE_NODE_MASTER )
						{
							nodeMaster = 1;
						}

						FConnection *con = CommServiceAddConnection( service, newsock, name, address, NULL, SERVER_CONNECTION_OUTGOING, nodeMaster );
						if( con != NULL )
						{
							SQLLibrary *lsqllib = l->LibrarySQLGet( l );
							if( lsqllib != NULL )
							{
								char where[ 1024 ];
								snprintf( where, 1024, " FConnection where FCID='%s' AND Type=0", con->fc_FCID );
								
								
								if( type != -1 )
								{
									con->fc_ServerType = type;
								}
								
								int number = lsqllib->NumberOfRecords( lsqllib, FConnectionDesc, where );
								DEBUG("[connection/add] Number of connection found in DB %d\n", number );
								if( number == 0 )
								{
									CommServiceRegisterEvent( con, newsock );
									lsqllib->Save( lsqllib, FConnectionDesc, con );
								
									snprintf( dictmsgbuf, sizeof(dictmsgbuf), "ok<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_CREATED] , DICT_CONNECTION_CREATED );
									
									// Send information about attached connection
									
									int iname = 6;
									if( name != NULL )
									{
										iname += strlen( name );
									}
									int iaddress = 9;
									if( address != NULL )
									{
										iaddress += strlen( address );
									}
									
									char *pname = FCalloc( iname, sizeof(char) );
									char *paddress = FCalloc( iaddress, sizeof(char) );
									strcpy( pname, "name=" );
									if( name != NULL )
									{
										strcpy( &pname[ 5 ], name );
									}
									strcpy( paddress, "address=" );
									if( address != NULL )
									{
										strcpy( &paddress[ 8 ], address );
									}
									
									ClusterNode *cn = l->fcm->fcm_ClusterNodes;
									FriendCoreManager *fcm = l->fcm;
									
									/*
									while( cn != NULL )
									{
										// send information that new connection was added
										if( cn->cn_CurrentNode == FALSE && cn->cn_Connection != NULL )
										{
											MsgItem tags[] = {
												{ ID_FCRE, (uint64_t)0, (uint64_t)MSG_GROUP_START },
													{ ID_FCID, (uint64_t)FRIEND_CORE_MANAGER_ID_SIZE,  (uint64_t)fcm->fcm_ID },
													{ ID_FRID, (uint64_t)0, MSG_INTEGER_VALUE },
													{ ID_CMMD, (uint64_t)0, MSG_INTEGER_VALUE },
													{ ID_ANDE, (uint64_t)0, MSG_INTEGER_VALUE },
													{ ID_PARM, (FULONG)0, MSG_GROUP_START },
														{ ID_PRMT, (FULONG) iname,  (FULONG)pname },
														{ ID_PRMT, (FULONG) iaddress, (FULONG)paddress },
													{ MSG_GROUP_END, 0,  0 },
												{ MSG_GROUP_END, 0,  0 },
												{ TAG_DONE, TAG_DONE, TAG_DONE }
											};
	
											DataForm * df = DataFormNew( tags );

											BufString *result = SendMessageAndWait( con, df );
											DataFormDelete( df );
	
											if( result != NULL )
											{
												if( result->bs_Size > 0 )
												{
												}
											}
										}
										
										cn = (ClusterNode *)cn->node.mln_Succ;
									}
									*/

									if( paddress != NULL )
									{
										FFree( paddress );
									}
									
									if( pname != NULL )
									{
										FFree( pname );
									}
								}
								else
								{
									lsqllib->Update( lsqllib, FConnectionDesc, con );
								
									snprintf( dictmsgbuf, sizeof(dictmsgbuf), "ok<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_REUSED] , DICT_CONNECTION_REUSED );
								}
								
								SLIB->LibrarySQLDrop( SLIB, lsqllib );
							}
							else
							{
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
							}
						}
						else
						{
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FCCONNECTION_CANNOT_CREATE] , DICT_FCCONNECTION_CANNOT_CREATE );
						}
					}
				}
				else
				{
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_ALREADY_EXIST] , DICT_CONNECTION_ALREADY_EXIST );
				}
			}
			else
			{
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "name, address" );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			}
			
			if( name != NULL )
			{
				FFree( name );
			}
			
			if( address != NULL )
			{
				FFree( address );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
		}
		
		HttpAddTextContent( response, dictmsgbuf );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/connection/edit</H2>edit FCConnection
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of entry which you want to update
	* @param address - internet address
	* @param name - name of connection
	* @param destinationfcid - Friend Core ID of destination server
	* @param pem - ssl key in "pem" format
	* @param clusterid - id in cluster
	* @param approved - 1 if server was approved by admin, 0 - if not
	* @param servertype - type of connection, avaiable values are: 
	* 	0 - normal server,
		1 - cluster node,
		2 - cluster master,
		3 - master of Friend servers
	* @return return code 0 if everything was updated without problems, otherwise error number
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "edit" ) == 0 )
	{
		HashmapElement *el = NULL;
		FULONG id = 0;
		char dictmsgbuf[ 256 ];
		char *address = NULL, *destFCID = NULL, *PEM = NULL, *serverType = NULL, *clusterID = NULL, *name = NULL;
		int approved = -1;
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
		{
			el =  HashmapGet( (*request)->http_ParsedPostContent, "id" );
			if( el != NULL )
			{
				char *end;
				id = strtol( ( char *)el->hme_Data,  &end, 0 );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "address" );
			if( el != NULL )
			{
				address = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "destinationfcid" );
			if( el != NULL )
			{
				destFCID = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "pem" );
			if( el != NULL )
			{
				PEM = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "servertype" );
			if( el != NULL )
			{
				serverType = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "clusterid" );
			if( el != NULL )
			{
				clusterID = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "name" );
			if( el != NULL )
			{
				name = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "approved" );
			if( el != NULL )
			{
				approved = atoi( ( char *)el->hme_Data );
			}
			
			if( id > 0 )
			{
				CommService *s = l->fcm->fcm_CommService;
				
				FRIEND_MUTEX_LOCK( &s->s_Mutex );
				FConnection *con = s->s_Connections;
				FConnection *selcon = NULL;
				
				while( con != NULL )
				{
					// we must find entry which we want to edit
					if( con->fc_ID == id )
					{
						selcon = con;
					}
					
					// we cannot use same name (used by other connections)
					if( name != NULL && strcmp( con->fc_Name, name ) == 0 && con->fc_ID != id )
					{
						break;
					}
					con = (FConnection *)con->node.mln_Succ;
				}
				FRIEND_MUTEX_UNLOCK( &s->s_Mutex );
				
				if( con == NULL )	// connection with this name not found
				{
					if( selcon != NULL )
					{
						char *address = NULL, *destFCID = NULL, *PEM = NULL, *serverType = NULL, *clusterID = NULL, *name = NULL;
						
						if( address != NULL )
						{
							if( selcon->fc_Address != NULL )
							{
								FFree( selcon->fc_Address );
								selcon->fc_Address = NULL;
							}
							
							if( strlen( address ) > 1 )
							{
								selcon->fc_Address = StringDuplicate( address );
							}
						}
						
						if( destFCID != NULL )
						{
							if( selcon->fc_DestinationFCID != NULL )
							{
								FFree( selcon->fc_DestinationFCID );
								selcon->fc_DestinationFCID = NULL;
							}
							
							if( strlen( destFCID ) > 1 )
							{
								selcon->fc_DestinationFCID = StringDuplicate( destFCID );
							}
						}
						
						if( PEM != NULL )
						{
							if( selcon->fc_PEM != NULL )
							{
								FFree( selcon->fc_PEM );
								selcon->fc_PEM = NULL;
							}
							
							if( strlen( destFCID ) > 1 )
							{
								selcon->fc_PEM = StringDuplicate( PEM );
							}
						}
						
						if( serverType != NULL )
						{
							selcon->fc_ServerType = atoi( serverType );
						}
						
						if( clusterID != NULL )
						{
							selcon->fc_ClusterID = atoi( clusterID );
						}
						
						if( name != NULL )
						{
							if( selcon->fc_Name != NULL )
							{
								FFree( selcon->fc_Name );
								selcon->fc_Name = NULL;
							}
							
							if( strlen( destFCID ) > 1 )
							{
								selcon->fc_Name = StringDuplicate( name );
							}
						}
						
						if( approved > -1 )
						{
							selcon->fc_ConnectionApproved = approved;
						}

						SQLLibrary *lsqllib = SLIB->LibrarySQLGet( SLIB );
						if( lsqllib != NULL )
						{
							int err = lsqllib->Update( lsqllib, FConnectionDesc, selcon );
							
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"success\", \"code\":\"0\" }" );
							
							SLIB->LibrarySQLDrop( SLIB, lsqllib );
						}
						else
						{
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
						}
					}
					else
					{
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_NOT_FOUND] , DICT_CONNECTION_NOT_FOUND );
					}
				}
				else
				{
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_ALREADY_EXIST] , DICT_CONNECTION_ALREADY_EXIST );
				}
			}
			else
			{
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id" );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			}
		}
		else
		{
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
		}
		
		HttpAddTextContent( response, dictmsgbuf );
		
		if( address != NULL ){ FFree( address ); }
		if( destFCID != NULL ){ FFree( destFCID ); }
		if( PEM != NULL ){ FFree( PEM ); }
		if( serverType != NULL ){ FFree( serverType ); }
		if( clusterID != NULL ){ FFree( clusterID ); }
		if( name != NULL ){ FFree( name ); }
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/connection/add</H2>add new FCConnection
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required if name is not provided) id of entry which you want to remove (disconnect)
	* @param name - (required if id is not provided) name of entry which you want to remove (disconnect) 

	* @return return code 63 if everything was created without problems, otherwise error number
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "delete" ) == 0 )
	{
		HashmapElement *el = NULL;
		FULONG id = 0;
		char *name = NULL;
		char dictmsgbuf[ 256 ];
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
		{
			el =  HashmapGet( (*request)->http_ParsedPostContent, "id" );
			if( el != NULL )
			{
				char *end;
				id = strtol( ( char *)el->hme_Data,  &end, 0 );
			}
			
			el =  HashmapGet( (*request)->http_ParsedPostContent, "name" );
			if( el != NULL )
			{
				name = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			if( id > 0 || name != NULL )
			{
				CommService *s = l->fcm->fcm_CommService;
				
				FRIEND_MUTEX_LOCK( &s->s_Mutex );
				FConnection *con = s->s_Connections;
				
				DEBUG("[ConnectionWeb] remove connection id: %lu name: %s\n", id, name );
				
				if( id > 0 )
				{
					while( con != NULL )
					{
						if( con->fc_ID == id )
						{
							break;
						}
						con = (FConnection *)con->node.mln_Succ;
					}
				}
				else if( name != NULL )
				{
					while( con != NULL )
					{
						if( strcmp( con->fc_Name, name ) == 0 )
						{
							break;
						}
						con = (FConnection *)con->node.mln_Succ;
					}
				}
				FRIEND_MUTEX_UNLOCK( &s->s_Mutex );
				
				if( con != NULL )
				{
					DEBUG("[ConnectionWeb] connection found, will be removed\n" );
					
					SQLLibrary *lsqllib = SLIB->LibrarySQLGet( SLIB );
					if( lsqllib != NULL )
					{
						lsqllib->Delete( lsqllib, FConnectionDesc, con );
						
						int err = CommServiceDelConnection( s, con, con->fc_Socket );
						if( err == 0 )
						{
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "ok<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_DELETED] , DICT_CONNECTION_DELETED );
							
							DEBUG("[ConnectionWeb] Connection deleted\n");
						}
						else
						{
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_DELETE_CONNECTION], err );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_DELETE_CONNECTION );
							
							DEBUG("[ConnectionWeb] Connection not deleted, error: %d\n", err );
						}
						
						SLIB->LibrarySQLDrop( SLIB, lsqllib );
					}
					else
					{
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
					}
				}
				else
				{
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CONNECTION_NOT_FOUND] , DICT_CONNECTION_NOT_FOUND );
				}
			}
			else
			{
				if( id < 1 )
				{
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id" );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
				}
				else if( name == NULL )
				{
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "name" );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
				}
			}
		}
		else
		{
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
		}
		
		if( name != NULL )
		{
			FFree( name );
		}
		
		HttpAddTextContent( response, dictmsgbuf );
	}
	
		//
		// function not found
		//
		
	error:
	
	return response;
}

