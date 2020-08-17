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
 *  WebSocket apns connector
 *
 * file contain all functitons related to apns connector
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 26/11/2018
 */

#include "websocket_apns_connector.h"
#include <util/string.h>
#include <system/systembase.h>

extern SystemBase *SLIB;

//
//
//

WebsocketAPNSConnector *WebsocketAPNSConnectorNew( char *host, int port )
{
	WebsocketAPNSConnector *APNSConnection;
	
	if( ( APNSConnection = FCalloc( 1, sizeof(WebsocketAPNSConnector) ) ) != NULL )
	{
		APNSConnection->wapns_Connection = WebsocketClientNew( host, port, NULL );
		if( APNSConnection->wapns_Connection != NULL )
		{
			APNSConnection->wapns_Host = StringDuplicate( host );
			APNSConnection->wapns_Port = port;
			
			if( WebsocketClientConnect( APNSConnection->wapns_Connection ) == 0 )
			{
				DEBUG("APNS server connected\n");
			}
			else
			{
				DEBUG("APNS server not connected\n");
			}
			
			APNSConnection->wapnsc_Thread = ThreadNew( WebsocketAPNSConnectorThread, APNSConnection, TRUE, NULL );
			if( APNSConnection->wapnsc_Thread == NULL )
			{
				FERROR("[WorkerRun] Cannot create APNS connection thread!\n");
			}
		}
		else
		{
			FERROR("Cannot create WebsocketConnectionClient\n");
			FFree( APNSConnection );
			return NULL;
		}
	}
	return APNSConnection;
}

//
//
//

void WebsocketAPNSConnectorDelete( WebsocketAPNSConnector *wr )
{
	if( wr != NULL )
	{
		wr->wapnsc_Quit = TRUE;
		
		if( wr->wapnsc_Thread != NULL )
		{
			//while( wr->wapnsc_Thread->t_Launched != FALSE )
			{
			//	usleep( 500 );
			}
			
			ThreadDelete( wr->wapnsc_Thread );
			
			wr->wapnsc_Thread = NULL;
		}
		
		if( wr->wapns_Connection != NULL )
		{
			WebsocketClientDelete( wr->wapns_Connection );
		}
		
		if( wr->wapns_Host != NULL )
		{
			FFree( wr->wapns_Host );
		}
		
		FFree( wr );
	}
}

//
//
//

void WebsocketAPNSConnectorThread( FThread *data )
{
	pthread_detach( pthread_self() );
	
	WebsocketAPNSConnector *con = (WebsocketAPNSConnector *)data->t_Data;
	int delayTillNextAction = 0;
	
	while( data->t_Quit != TRUE )
	{
		if( delayTillNextAction <= 0 )
		{
			if( con->wapns_Connection == NULL )
			{
				DEBUG("APNS:Connection is NULL\n");
				con->wapns_Connection = WebsocketClientNew( con->wapns_Host, con->wapns_Port, NULL );
				con->wapns_Connection->wc_ToRemove = FALSE;
			
				if( WebsocketClientConnect( con->wapns_Connection ) == 0 )
				{
					DEBUG("APNS server connected\n");
				}
				else
				{
					DEBUG("APNS server not connected\n");
				}
				delayTillNextAction = 30;
			}
			else 
			{
				if( con->wapns_Connection->ws_Context == NULL )
				{
					DEBUG("APNS:Context is NULL\n");
					if( WebsocketClientConnect( con->wapns_Connection ) == 0 )
					{
						DEBUG("APNS server connected\n");
					}
					else
					{
						DEBUG("APNS server not connected\n");
					}
					delayTillNextAction = 30;
				}
				else if( con->wapns_Connection->wc_ToRemove == TRUE )
				{
					DEBUG("APNS Websocket connection will be removed\n");
					WebsocketClientDelete( con->wapns_Connection );
					con->wapns_Connection = WebsocketClientNew( con->wapns_Host, con->wapns_Port, NULL );
					con->wapns_Connection->wc_ToRemove = FALSE;
			
					if( WebsocketClientConnect( con->wapns_Connection ) == 0 )
					{
						DEBUG("APNS server connected\n");
					}
					else
					{
						DEBUG("APNS server not connected\n");
					}
					delayTillNextAction = 30;
				}
				else
				{
					//DEBUG("Context to remove is not null and toremove is not set\n");
				}
			}
		}
		sleep( 1 );
		if( delayTillNextAction > -2 )
		{
			delayTillNextAction--;
		}
		if( SLIB->fcm->fcm_Shutdown == TRUE )
		{
			INFO("System shutdown in progress\n");
			break;
		}
	}
	data->t_Launched = FALSE;
	pthread_exit( NULL );
}
