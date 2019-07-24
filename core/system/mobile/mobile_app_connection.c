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
 *  Mobile Application Connection
 *
 * file contain body related to MobileAppConnection
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/12/2018
 */

#include "mobile_app_connection.h"
#include <util/session_id.h>
#include <mutex/mutex_manager.h>

/**
 * Create MobileAppConnection
 *
 * @param wsi pointer to WebSockets
 * @param umaID id of user mobile application
 * @param userSession pointer to UserSession structure
 * @return pointer to new created list of MobileAppConnection
 */
MobileAppConnection *MobileAppConnectionNew( void *wsi, FULONG umaID, void *userSession )
{
	//create struct holding this connection
	MobileAppConnection *newConnection = FCalloc(sizeof(MobileAppConnection), 1);
	if( newConnection != NULL )
	{
		char *session_id = SessionIDGenerate();
		newConnection->mac_SessionID = session_id;
		newConnection->mac_LastCommunicationTimestamp = time(NULL);
		newConnection->mac_WebsocketPtr = wsi;
		newConnection->mac_UserMobileAppID = umaID;
		newConnection->mac_UserSession = userSession;
		
		pthread_mutex_init( &newConnection->mac_Mutex, NULL );

		FQInit( &(newConnection->mac_Queue) );
	}
	return newConnection;
}

/**
 * Delete MobileAppConnection
 *
 * @param mac pointer to MobileAppConnection which will be deleted
 */
void MobileAppConnectionDelete( MobileAppConnection *mac )
{
	mac->mac_WebsocketPtr = NULL;
	mac->mac_Used = 0;
	
	//DEBUG("Freeing up connection from slot %d (last comm %ld)\n", connectionIndex, connections->umac_Connection[connectionIndex]->mac_LastCommunicationTimestamp );
	
	if( FRIEND_MUTEX_LOCK( &(mac->mac_Mutex) ) == 0 )
	{
		FQueue *fq = &(mac->mac_Queue);
		//FQDeInitFree( &(mac->mac_Queue) );
	
		{
			FQEntry *q = fq->fq_First; 
			while( q != NULL )
			{
				DEBUG("RElease me!\n");
				void *r = q; 
				if( q->fq_Data != NULL )
				{
					FFree( q->fq_Data ); 
				}
				q = (FQEntry *)q->node.mln_Succ; 
				FFree( r ); 
			} 
			fq->fq_First = NULL; 
			fq->fq_Last = NULL; 
		}
		FRIEND_MUTEX_UNLOCK( &(mac->mac_Mutex) );
	}
	
	pthread_mutex_destroy( &(mac->mac_Mutex) );
	
	FFree( mac->mac_SessionID );
	FFree( mac );
}


