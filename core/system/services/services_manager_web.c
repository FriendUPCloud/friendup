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
 *  Service Manager Web body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include <system/services/service_manager.h>
#include <network/protocol_http.h>
#include <network/path.h>
#include <core/friendcore_manager.h>
#include <util/string.h>
#include <dirent.h> 
#include <util/buffered_string.h>
#include <communication/comm_msg.h>

//
// simple structure to hold information about servers
//

typedef struct SServ
{
	struct MinNode node;
	FBYTE id[ FRIEND_CORE_MANAGER_ID_SIZE ];		// id of the device
	char *sinfo;									// pointer to services information
}SServ;

/**
 * ServiceManager web handler
 *
 * @param lsb pointer to SystemBase
 * @param urlpath pointer to memory where table with path is stored
 * @param request pointer to request sent by client
 * @param loggedSession user session which is making a call
 * @return reponse in Http structure
 */

Http *ServicesManagerWebRequest( void *lsb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lsb;
	char *serviceName = NULL;
	int newStatus = -1;
	Service *selService = NULL;
	
	DEBUG("ServiceManagerWebRequest\n");
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/list</H2>List all avaiable services. Function send commands to all connected servers and get information about services avaiable.
	*
	* @param sessionid - (required) session id of logged user
	* @return servers and services avaiable on them in JSON format when success, otherwise error code
	*/
	/// @endcond
	
	if( strcmp( urlpath[ 0 ], "list" ) == 0 )
	{
		int pos = 0;
		BufString *nbs = BufStringNew();
		char *tmp = FCalloc( 8112, sizeof(char) );
		
		DEBUG("[ServiceManagerWebRequest] list all avaiable  services\n");
		
		SServ *servInfo = NULL;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, (FULONG)MSG_GROUP_START },
			{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)l->fcm->fcm_ID },
			{ ID_FRID, (FULONG)0, MSG_INTEGER_VALUE },
			{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
			{ ID_QUER, (FULONG)FC_QUERY_SERVICES , MSG_INTEGER_VALUE },
			{ MSG_GROUP_END, 0,  0 },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};

		DataForm *df = DataFormNew( tags );
		SServ *lss = servInfo;
		
		FConnection *loccon = l->fcm->fcm_CommService->s_Connections;
		while( loccon != NULL )
		{
			DEBUG("[ServiceManagerWebRequest] Sending message to connection %s\n", loccon->fc_Address );
			BufString *bs = SendMessageAndWait( loccon, df );
			if( bs != NULL )
			{
				char *serverdata = bs->bs_Buffer + (COMM_MSG_HEADER_SIZE*4) + FRIEND_CORE_MANAGER_ID_SIZE;
				DataForm *locdf = (DataForm *)serverdata;
				
				DEBUG("Checking RESPONSE\n");
				if( locdf->df_ID == ID_RESP )
				{
					DEBUG("ID_RESP found!\n");
					int size = locdf->df_Size;

					SServ * li = FCalloc( 1, sizeof( SServ ) );
					if( li != NULL )
					{
						memcpy( li->id, bs->bs_Buffer+(COMM_MSG_HEADER_SIZE*2), FRIEND_CORE_MANAGER_ID_SIZE );
						li->sinfo = StringDuplicateN( ((char *)locdf) +COMM_MSG_HEADER_SIZE, size );
				
						if( lss != NULL )
						{
							lss->node.mln_Succ = (struct MinNode *) li;
						}
						else
						{
							if( servInfo == NULL )
							{
								servInfo = li;
								lss = li;
							}
						}
						lss = li;
					}
					else
					{
						FERROR("Cannot allocate memory for service\n");
					}
					
					/*
					int i;
					for( i=0 ; i < bs->bs_Size ; i++ )
					{
						printf("%c ", bs->bs_Buffer[ i ] );
					}
					printf("\n");
					*/
				}
				else
				{
					FERROR("Reponse in message not found!\n");
				}
				BufStringDelete( bs );
			}
			else
			{
				DEBUG("[ServiceManagerWebRequest] NO response received\n");
			}
			loccon = (FConnection *)loccon->node.mln_Succ;
		}
		
		DataFormDelete( df );
		
		//
		// checking services on ALL Friends servers
		//
		/*
		
		
		DEBUG2("[ServiceManagerWebRequest] Get services from all servers\n");
				//const char *t = "hello";
		DataForm *recvdf = CommServiceSendMsg( fcm->fcm_CommService, df );
		
		if( recvdf != NULL)
		{
			DEBUG2("[ServiceManagerWebRequest] DATAFORM Received %ld\n", recvdf->df_Size );
			*/
			
			/*
			unsigned int i=0;
			char *d = (char *)recvdf;
			for( i = 0 ; i < recvdf->df_Size ; i++ )
			{
				printf("%c", d[ i ] );
			}
			printf("end\n");
			*/
			
			/*
		}
		
		DataFormDelete( df );
		
		//
		// we must hold information about servers and services on them
		//
		// prepare request to all servers
		
		
		FBYTE *ld = DataFormFind( recvdf, ID_RESP );
		if( ld != NULL )
		{
			DataForm *respdf = (DataForm *)ld;
			SServ *lss = servInfo;
			
			DEBUG("[ServiceManagerWebRequest] Found information about services\n");
			
			while( respdf->df_ID == ID_RESP )
			{
				DEBUG("[ServiceManagerWebRequest] ServiceManager add entry '%s'\n",  ld+COMM_MSG_HEADER_SIZE + 32 );
				SServ * li = FCalloc( 1, sizeof( SServ ) );
				if( li != NULL )
				{
				
					// we should copy whole string, but atm we are doing copy of name
					//memcpy( li->id, ld+COMM_MSG_HEADER_SIZE , FRIEND_CORE_MANAGER_ID_SIZE );
					memcpy( li->id, ld+COMM_MSG_HEADER_SIZE, FRIEND_CORE_MANAGER_ID_SIZE );
				
					li->sinfo = ld+COMM_MSG_HEADER_SIZE + FRIEND_CORE_MANAGER_ID_SIZE;
				
					if( lss != NULL )
					{
						lss->node.mln_Succ = (struct MinNode *) li;
					}
					else
					{
						if( servInfo == NULL )
						{
							servInfo = li;
							lss = li;
						}
					}
					lss = li;
				
					ld += respdf->df_Size;
					respdf = (DataForm *)ld;
				}
				else
				{
					FERROR("Cannot allocate memory for service\n");
				}
			}
			DEBUG("[ServiceManagerWebRequest] No more server entries\n");
		}
		
		DEBUG("[ServiceManagerWebRequest] Create list of services\n");
		*/
		BufStringAdd( nbs, "{ \"Services\": [" );
		// should be changed later
		Service *ls = l->fcm->fcm_ServiceManager->sm_Services;
		
		//
		// going trough local services
		//
		while( ls != NULL )
		{
			int len;
			char *stat = ls->ServiceGetStatus( ls, &len );
			
			if( pos == 0 )
			{
				snprintf( tmp, 8112, " { \"Name\": \"%s\" , \"Status\": \"%s\" , ", ls->GetName(), stat );
			}
			else
			{
				snprintf( tmp, 8112, ",{ \"Name\": \"%s\" , \"Status\": \"%s\" , ", ls->GetName(), stat );
			}
			BufStringAdd( nbs, tmp );
			
			if( stat != NULL )
			{
				FFree( stat );
			}
			
			DEBUG("[ServiceManagerWebRequest] Service added , server info %p\n", servInfo );
			
			BufStringAdd( nbs, " \"Hosts\" : \"My computer" );
			
			// we add here server on which same service is working
			
			int servicesAdded = 0;
			SServ *checkedServer = servInfo;
			while( checkedServer != NULL )
			{
				if( strstr( checkedServer->sinfo, ls->GetName() ) != NULL )
				{
					BufStringAdd( nbs, "," );
					BufStringAdd( nbs, (const char *)checkedServer->id );
					servicesAdded++;
				}
				checkedServer = (SServ *)checkedServer->node.mln_Succ;
			} // check remote servers
			
			BufStringAdd( nbs, "\" }" );
			
			ls = (Service *)ls->node.mln_Succ;
			pos++;
		}	// going through local services
		
		BufStringAdd( nbs, "] }" );
		
		//
		// send data and release temporary used memory
		//
		
		HttpAddTextContent( response, nbs->bs_Buffer );
		DEBUG("[ServiceManagerWebRequest] list return: '%s', Remove server info entries\n", nbs->bs_Buffer );
		
		BufStringDelete( nbs );
		
		lss = servInfo;
		while( lss != NULL )
		{
			SServ *rem = lss;
			lss = (SServ *)lss->node.mln_Succ;
			if( rem->sinfo != NULL )
			{
				FFree( rem->sinfo );
			}
			FFree( rem );
		}
		
		//DataFormDelete( recvdf );
		DEBUG("[ServiceManagerWebRequest] Return services list!\n");
		
		FFree( tmp );
	}	// list services
	
#define ELEMENT_NAME 0
#define ELEMENT_COMMAND 1
	
	//HashmapElement *el =  HashmapGet( request->parsedPostContent, "Name" );
	//if( el != NULL )
	{
		serviceName = urlpath[ ELEMENT_NAME ]; //el->data;
		
		Service *ls = l->fcm->fcm_ServiceManager->sm_Services;
		while( ls != NULL )
		{
			DEBUG("[ServiceManagerWebRequest] Checking avaiable services %s pointer %p\n", ls->GetName(), ls );
			if( strcmp( ls->GetName(), serviceName ) == 0 )
			{
				selService = ls;
				INFO("[ServiceManagerWebRequest] ServiceFound\n");
				break;
			}
			ls = (Service *)ls->node.mln_Succ;
		}
	}
	
	if( serviceName == NULL )
	{
		FERROR( "ServiceName parameter is missing!\n" );
		char buffer[ 256 ];
		char buffer1[ 256 ];
		snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "ServiceName (in url)" );
		snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
		HttpAddTextContent( response, buffer );
		
		return response;
	}
	/*
	el =  HashmapGet( request->parsedPostContent, "status" );
	if( el != NULL )
	{
		if( (char *)el->data != NULL )
		{
			if( strcmp( (char *)el->data, "start" ) == 0 )
			{
				newStatus = SERVICE_STARTED;
			}else if( strcmp( (char *)el->data, "stop" ) == 0 )
			{
				newStatus = SERVICE_STOPPED;
			}else if( strcmp( (char *)el->data, "pause" ) == 0 )
			{
				newStatus = SERVICE_PAUSED;
			}
		}
	}*/
	
	if( selService == NULL || strlen(serviceName) <= 0 )
	{
		FERROR( "Service not found or service name parameter is missing!\n" );
		char buffer[ 256 ];
		snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SERVICE_OR_SERVNAME_NOT_FOUND] , DICT_SERVICE_OR_SERVNAME_NOT_FOUND );
		HttpAddTextContent( response, buffer );

		return response;
	}
	
	int error = 0;
	
	DEBUG("[ServiceManagerWebRequest] ---------------------------------%s----servicename %s servicename from service %s\n", urlpath[0], serviceName, selService->GetName() );
	
	selService->s_USW = request->http_WSocket;
	
	DEBUG( "[ServiceManagerWebRequest]  Command OK %s !\n", urlpath[ ELEMENT_COMMAND ] );
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/start</H2>Start service
	*
	* @param sessionid - (required) session id of logged user
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	if( strcmp( urlpath[ ELEMENT_COMMAND ], "start" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			if( selService->ServiceStart != NULL )
			{
				DEBUG("[ServiceManagerWebRequest] SERVICE START\n");
				selService->ServiceStart( selService );
			}
			else
			{
				error = 1;
			}
		
			HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/stop</H2>Stop service
	*
	* @param sessionid - (required) session id of logged user
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "stop" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			if( selService->ServiceStop != NULL )
			{
				HashmapElement *el;
				char *data = NULL;
			
				el =  HashmapGet( request->http_ParsedPostContent, "data" );
				if( el != NULL )
				{
					data = el->hme_Data;
				}
			
				selService->ServiceStop( selService, data );	
			}
			else
			{
				error = 1;
			}
			HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/pause</H2>Pause service
	*
	* @param sessionid - (required) session id of logged user
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "pause" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			error = 2;
			HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/install</H2>Install service
	*
	* @param sessionid - (required) session id of logged user
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "install" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			if( selService->ServiceInstall != NULL )
			{
				selService->ServiceInstall( selService );
			}
			else
			{
				error = 1;
			}
		
			HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/uninstall</H2>Uninstall service
	*
	* @param sessionid - (required) session id of logged user
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "uninstall" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			if( selService->ServiceUninstall != NULL )
			{
				selService->ServiceUninstall( selService );
			}
			else
			{
				error = 1;
			}
		
			HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/status</H2>Get status of service
	*
	* @param sessionid - (required) session id of logged user
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "status" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			int len;
		
			if( selService->ServiceGetStatus != NULL )
			{
				selService->ServiceGetStatus( selService, &len );
			}
			else
			{
				error = 1;
			}
		
			HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/command</H2>Send command to service
	*
	* @param sessionid - (required) session id of logged user
	* @param cmd - command passed to service
	* @param servers - if not avaiable then command will be send to all FC with current service. If parameter will be avaiable then command will be passed to servers separated by comma
	* @return { Status:ok } when success, otherwise error code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "command" ) == 0 )
	{

		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			HashmapElement *el;
			char *ret = NULL;
		
			el =  HashmapGet( request->http_ParsedPostContent, "cmd" );

			if( el != NULL && el->hme_Data != NULL )
			{
				char *cmd = el->hme_Data;
				char *serv  = NULL;
			
				el =  HashmapGet( request->http_ParsedPostContent, "servers" );
				if( el != NULL && el->hme_Data != NULL )
				{
					serv  = el->hme_Data;
				}

				if( serv == NULL )
				{
					// temporary call
					ret = selService->ServiceCommand( selService, "ALL", cmd, request->http_ParsedPostContent );
				}
				else
				{
					ret = selService->ServiceCommand( selService, serv, cmd, request->http_ParsedPostContent );
				}

				if( ret != NULL )
				{
					HttpSetContent( response, ret, strlen( ret ) );
				}
				else
				{
					HttpAddTextContent( response, "{ \"Status\": \"ok\"}" );
				}
			}
			else
			{
				error = 2;
			}
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/services/\<service_name\>/getwebgui</H2>Get service user interface (html form)
	*
	* @param sessionid - (required) session id of logged user
	* @return GUI form when success, empty \<div\>\<\div\> when gui is not avaiable
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ ELEMENT_COMMAND ], "getwebguii" ) == 0 )
	{
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			DEBUG("[ServiceManagerWebRequest] GetWebGUI\n");
			char *lresp = selService->ServiceGetWebGUI( selService );
			if( lresp != NULL )
			{
				DEBUG("[ServiceManagerWebRequest] Service response %s\n", lresp );
				HttpAddTextContent( response, lresp );
			}
			else
			{
				HttpAddTextContent( response, "<div> </div>" );
			}
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}

	return response;
}

