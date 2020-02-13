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
 *  Notification Manager
 *
 * file contain definitions related to NotificationManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 08/09/2018
 */

#include "notification_manager.h"
#include <system/systembase.h>
#include <mobile_app/mobile_app.h>
#include <mobile_app/notifications_sink.h>
#include <network/http_client.h>

/**
 * Create new NotificationManager
 *
 * @param sb pointer to SystemBase
 * @return pointer to new NotificationManager structure
 */
NotificationManager *NotificationManagerNew( void *sb )
{
	NotificationManager *nm;
	DEBUG("[NotificationManagerNew] new\n");
	
	if( ( nm = FCalloc( 1, sizeof(NotificationManager) ) ) != NULL )
	{
		nm->nm_SB = sb;
		SystemBase *lsb = (SystemBase *)sb;
		char *login = NULL;
		char *pass = NULL;
		char *host = NULL;
		char *dbname = NULL;
		int port = 3306;
		char *options = NULL;
		
		pthread_mutex_init( &(nm->nm_Mutex), NULL );
		
		nm->nm_APNSSandBox = FALSE;
		
		Props *prop = NULL;
		PropertiesInterface *plib = &(lsb->sl_PropertiesInterface);
		if( plib != NULL && plib->Open != NULL )
		{
			char *ptr = getenv("FRIEND_HOME");
			char *path = FCalloc( 1024, sizeof( char ) );
		
			if( ptr != NULL )
			{
				snprintf( path, 1024, "%scfg/cfg.ini", ptr );
			}
		
			prop = plib->Open( path );
			FFree( path );
		
			if( prop != NULL)
			{
				login = plib->ReadStringNCS( prop, "databaseuser:login", "root" );
				pass = plib->ReadStringNCS( prop, "databaseuser:password", "root" );
				host = plib->ReadStringNCS( prop, "databaseuser:host", "localhost" );
				dbname = plib->ReadStringNCS( prop, "databaseuser:dbname", "FriendMaster" );
				port = plib->ReadIntNCS( prop, "databaseuser:port", 3306 );
				options = plib->ReadStringNCS( prop, "databaseuser:options", NULL );
				
				nm->nm_APNSCert = StringDuplicate( plib->ReadStringNCS( prop, "apple:cert", NULL ) );
				nm->nm_APNSSandBox = plib->ReadBool( prop, "apple:apnssandbox", FALSE );
				
				nm->nm_FirebaseKey = StringDuplicate( plib->ReadStringNCS( prop, "firebase:key", NULL ) );
				nm->nm_FirebaseHost = StringDuplicate( plib->ReadStringNCS( prop, "firebase:host", NULL ) );
		
				nm->nm_SQLLib = (struct SQLLibrary *)LibraryOpen( lsb, lsb->sl_DefaultDBLib, 0 );
				if( nm->nm_SQLLib != NULL )
				{
					int error;
					error = nm->nm_SQLLib->SetOption( nm->nm_SQLLib, options );
					error = nm->nm_SQLLib->Connect( nm->nm_SQLLib, host, dbname, login, pass, port );
				}
				plib->Close( prop );
			}
			
			//
			// external service
			
			pthread_mutex_init( &(nm->nm_ExtServiceMutex), NULL );
			FQInit( &(nm->nm_ExtServiceMessage) );
			
			//
			// run android send thread
			
			pthread_mutex_init( &(nm->nm_AndroidSendMutex), NULL );
			pthread_cond_init( &(nm->nm_AndroidSendCond), NULL );
			FQInit( &(nm->nm_AndroidSendMessages) );
			
			nm->nm_AndroidSendThread = ThreadNew( NotificationAndroidSendingThread, nm, TRUE, NULL );
			
			//
			// run ios send thread
			
			pthread_mutex_init( &(nm->nm_IOSSendMutex), NULL );
			pthread_cond_init( &(nm->nm_IOSSendCond), NULL );
			FQInit( &(nm->nm_IOSSendMessages) );
			
			nm->nm_IOSSendThread = ThreadNew( NotificationIOSSendingThread, nm, TRUE, NULL );
			
			//
			// run main thread
			
			nm->nm_TimeoutThread = ThreadNew( NotificationManagerTimeoutThread, nm, TRUE, NULL );
			
			// test
			//NotificationManagerNotificationSendAndroid( nm, NULL, NULL, NULL, 0, NULL, NULL, NULL );
		} // plib and plib->open != NULL

		//nm_APNSNotificationTimeout_expirationDate = time(NULL) + 86400; // default expiration date set to 1 day
	}	// calloc
	DEBUG("[NotificationManagerNew] end\n");
	return nm;
}

/**
 * Delete NotificationManager
 *
 * @param nm pointer to MobileManager which will be deleted
 */
void NotificationManagerDelete( NotificationManager *nm )
{
	DEBUG("[NotificationManagerDelete]\n");
	if( nm != NULL )
	{
		// stop getting messages
		
		DEBUG("[NotificationManagerDelete] kill main thread\n");
		
		// kill main notification thread
		if( nm->nm_TimeoutThread != NULL )
		{
			nm->nm_TimeoutThread->t_Quit = TRUE;
			while( TRUE )
			{
				DEBUG("[NotificationManagerDelete] killing main thread\n");
				if( nm->nm_TimeoutThread->t_Launched == FALSE )
				{
					break;
				}
				sleep( 1 );
			}
			DEBUG2("[NotificationManagerDelete]  close thread\n");
		
			ThreadDelete( nm->nm_TimeoutThread );
		}
		
		// remove Android sending thread
		
		if( nm->nm_AndroidSendThread != NULL )
		{
			int tr = 0;
			nm->nm_AndroidSendThread->t_Quit = TRUE;
			if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
			{
				pthread_cond_signal( &(nm->nm_AndroidSendCond) ); // <- wake up!!
				FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
			}
			while( TRUE )
			{
				DEBUG("[NotificationManagerDelete] killing android in use: %d\n", nm->nm_AndroidSendInUse );
				if( nm->nm_AndroidSendInUse <= 0 || ((tr++)> 30 ) )
				{
					break;
				}
				usleep( 500 );
				if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
				{
					nm->nm_AndroidSendThread->t_Quit = TRUE;
					pthread_cond_signal( &(nm->nm_AndroidSendCond) ); // <- wake up!!
					FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
				}
			}
			DEBUG("[NotificationManagerDelete] delete android thread\n");
			ThreadDelete( nm->nm_AndroidSendThread );
		}
		DEBUG("[NotificationManagerDelete] delete done\n");
		pthread_cond_destroy( &(nm->nm_AndroidSendCond) );
		pthread_mutex_destroy( &(nm->nm_AndroidSendMutex) );
		FQDeInit( &(nm->nm_AndroidSendMessages) );
		DEBUG("[NotificationManagerDelete] delete android all stuff released\n");
		
		// remove IOS sending thread
		
		// kill launched thread with messages to be send
		
		if( nm->nm_IOSSendThread != NULL )
		{
			int tr = 0;
			DEBUG("[NotificationManagerDelete] set quit to IOS thread\n");
			nm->nm_IOSSendThread->t_Quit = TRUE;
			if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
			{
				pthread_cond_signal( &(nm->nm_IOSSendCond) ); // <- wake up!!
				FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
			}
			DEBUG("[NotificationManagerDelete] before while\n");
			while( TRUE )
			{
				DEBUG("[NotificationManagerDelete] killing ios in use: %d\n", nm->nm_IOSSendInUse );
				if( nm->nm_IOSSendInUse <= 0 || ((tr++)> 30 ) )
				{
					break;
				}
				usleep( 500 );
				if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
				{
					pthread_cond_signal( &(nm->nm_IOSSendCond) ); // <- wake up!!
					FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
				}
			}
		
			DEBUG("[NotificationManagerDelete] delete IOS thread\n");
			ThreadDelete( nm->nm_IOSSendThread );
		}
		pthread_cond_destroy( &(nm->nm_IOSSendCond) );
		pthread_mutex_destroy( &(nm->nm_IOSSendMutex) );
		FQDeInit( &(nm->nm_IOSSendMessages) );
		
		DEBUG("[NotificationManagerDelete] all threads deleted\n");
		
		//
		// delete external services
		
		pthread_mutex_destroy( &(nm->nm_ExtServiceMutex) );
		FQDeInit( &(nm->nm_ExtServiceMessage) );
		
		DEBUG("[NotificationManagerDelete] external services queue removed\n");
		
		if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	// add node to database and to list
		{
			NotificationDeleteAll( nm->nm_Notifications );
			FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
		}
		DEBUG("[NotificationManagerDelete] all notifications removed\n");

		pthread_mutex_destroy( &(nm->nm_Mutex) );
		
		if( nm->nm_FirebaseHost != NULL )
		{
			FFree( nm->nm_FirebaseHost );
		}
		
		if( nm->nm_FirebaseKey != NULL )
		{
			FFree( nm->nm_FirebaseKey );
		}
		
		if( nm->nm_APNSCert != NULL )
		{
			FFree( nm->nm_APNSCert );
		}
		
		if( nm->nm_SQLLib != NULL )
		{
			LibraryClose( nm->nm_SQLLib );
			nm->nm_SQLLib = NULL;
		}
		
		FFree( nm );
	}
	DEBUG("[NotificationManagerDelete] end\n");
}

/**
 * Get Notification from database
 *
 * @param nm pointer to MobileManager
 * @param id of NotificationID
 * @return pointer to structure UserMobileApp
 */
Notification *NotificationManagerGetDB( NotificationManager *nm,  FULONG id )
{
	Notification *n = NULL;
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char where[ 1024 ];
	
	snprintf( where, sizeof(where), "ID='%lu'", id );
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		int entries;
		// reading Notification
		n = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationDesc, where, &entries );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	
	return n;
}

/**
 * Get Notification and NotificationSent from database by notification sent ID
 *
 * @param nm pointer to MobileManager
 * @param notifSentId id of AppToken
 * @return pointer to structure UserMobileApp
 */
Notification *NotificationManagerGetTreeByNotifSentDB( NotificationManager *nm,  FULONG notifSentId )
{
	Notification *n = NULL;
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char where[ 1024 ];
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		DEBUG("NotificationManagerGetTreeByNotifSentDB id %lu start\n", notifSentId );
	
		snprintf( where, sizeof(where), "ID='%lu'", notifSentId );
	
		int entries;
	
		NotificationSent *notifSent = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
		DEBUG("NotificationManagerGetTreeByNotifSentDB found ptr %p\n", notifSent );
		if( notifSent != NULL )
		{
			snprintf( where, sizeof(where), "ID='%lu'", notifSent->ns_NotificationID );
			n = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationDesc, where, &entries );
			DEBUG("NotificationManagerGetTreeByNotifSentDB found notifsent ptr %p\n", n );
			if( n != NULL )
			{
				n->n_NotificationsSent = notifSent;
			}
		}
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	DEBUG("NotificationManagerGetTreeByNotifSentDB id start\n" );
	
	return n;
}

/**
 * Get NotificationSent from database by notification sent ID
 *
 * @param nm pointer to MobileManager
 * @param ID id of Notification
 * @return pointer to structure UserMobileApp
 */
NotificationSent *NotificationManagerGetNotificationsSentDB( NotificationManager *nm,  FULONG ID )
{
	NotificationSent *ns = NULL;
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char where[ 1024 ];
	int entries;
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		snprintf( where, sizeof(where), "ID='%lu'", ID );
		ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return ns;
}

/**
 * Get NotificationSent from database by notification sent ID and status
 *
 * @param nm pointer to MobileManager
 * @param ID id of Notification
 * @param status id of NotificationSent status
 * @return pointer to structure UserMobileApp
 */
NotificationSent *NotificationManagerGetNotificationsSentByStatusDB( NotificationManager *nm,  FULONG ID, int status )
{
	NotificationSent *ns = NULL;
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char where[ 1024 ];
	int entries;
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		snprintf( where, sizeof(where), "ID='%lu' AND Status=%d", ID, status );
		ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return ns;
}

/**
 * Get NotificationSent from database by notification sent ID and status
 *
 * @param nm pointer to MobileManager
 * @param status id of NotificationSent status
 * @param umaID UserMobileApp ID
 * @return pointer to structure UserMobileApp
 */
NotificationSent *NotificationManagerGetNotificationsSentByStatusAndUMAIDDB( NotificationManager *nm, int status, FULONG umaID )
{
	NotificationSent *ns = NULL;
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char where[ 1024 ];
	int entries;
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		snprintf( where, sizeof(where), "Status=%d AND UserMobileAppID=%lu", status, umaID );
		ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
		
	return ns;
}

/**
 * Get NotificationSent from database by notification sent ID, platform and status
 *
 * @param nm pointer to MobileManager
 * @param status id of NotificationSent status
 * @param umaID UserMobileApp ID
 * @return pointer to structure UserMobileApp
 */
NotificationSent *NotificationManagerGetNotificationsSentByStatusPlatformAndUMAIDDB( NotificationManager *nm, int status, int platform, FULONG umaID )
{
	NotificationSent *ns = NULL;
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char where[ 1024 ];
	int entries;
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		if( platform <= 0 )
		{
			snprintf( where, sizeof(where), "Status=%d AND UserMobileAppID=%lu", status, umaID );
		}
		else
		{
			snprintf( where, sizeof(where), "Status=%d AND UserMobileAppID=%lu AND Target=%d", status, umaID, platform );
		}
		DEBUG("WHERE: >%s<\n", where );
		ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	DEBUG("NotificationManagerGetNotificationsSentByStatusPlatformAndUMAIDDB found entries: %d\n", entries );
		
	return ns;
}

/**
 * Save Notification in database
 *
 * @param nm pointer to MobileManager
 * @param n pointer to Notification structure which will be stored
 * @return 0 when success, otherwise error number
 */
int NotificationManagerAddNotificationDB( NotificationManager *nm, Notification *n )
{
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	// add node to database and to list
	{
		nm->nm_SQLLib->Save( nm->nm_SQLLib, NotificationDesc, n );
	
		DEBUG("[NotificationManagerAddNotificationDB] added to list: %lu\n", n->n_ID );

		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Add notification to list
 *
 * @param nm pointer to MobileManager
 * @param n pointer to Notification structure which will be stored
 * @return 0 when success, otherwise error number
 */
int NotificationManagerAddToList( NotificationManager *nm, Notification *n )
{
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	// add node to database and to list
	{
		DEBUG("[NotificationManagerAddToList] added to list: %lu\n", n->n_ID );
		n->node.mln_Succ = (MinNode *) nm->nm_Notifications;
		if( nm->nm_Notifications != NULL )
		{
			nm->nm_Notifications->node.mln_Pred = (MinNode *)n;
		}
		nm->nm_Notifications = n;
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Save NotificationSent in database
 *
 * @param nm pointer to MobileManager
 * @param ns pointer to NotificationSent structure which will be stored
 * @return 0 when success, otherwise error number
 */
int NotificationManagerAddNotificationSentDB( NotificationManager *nm, NotificationSent *ns )
{
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		nm->nm_SQLLib->Save( nm->nm_SQLLib, NotificationSentDesc, ns );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Delete Notification and NotificationSent connected to it from DB
 * 
 * @param nm pointer to NotificationManager
 * @param nid id of Notification which will be deleted (and connected NotificationSent to it)
 * @return 0 when success, otherwise error number
 */
int NotificationManagerDeleteNotificationDB( NotificationManager *nm, FULONG nid )
{
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		char temp[ 1024 ];
		snprintf( temp, sizeof(temp), "DELETE from `FNotification` where `ID`=%lu", nid );
	
		nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
		snprintf( temp, sizeof(temp), "DELETE from `FNotificationSent` where `NotificationID`=%lu", nid );
	
		nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Delete NotificationSent connected to it from DB
 * 
 * @param nm pointer to NotificationManager
 * @param nid id of NotificationSent which will be deleted
 * @return 0 when success, otherwise error number
 */
int NotificationManagerDeleteNotificationSentDB( NotificationManager *nm, FULONG nid )
{
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		char temp[ 1024 ];

		snprintf( temp, sizeof(temp), "DELETE from `FNotificationSent` where `ID`=%lu", nid );
	
		nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Update NotificationSent status in DB
 * 
 * @param nm pointer to NotificationManager
 * @param nid id of Notification which will get new status
 * @param status new status
 * @return 0 when success, otherwise error number
 */
int NotificationManagerNotificationSentSetStatusDB( NotificationManager *nm, FULONG nid, int status )
{
	if( status < 0 || status >= NOTIFICATION_SENT_STATUS_MAX )
	{
		return -1;
	}
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		char temp[ 1024 ];

		snprintf( temp, sizeof(temp), "UPDATE `FNotificationSent` set Status=%d where `ID`=%lu", status, nid );
	
		nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Add external server connection
 * 
 * @param nm pointer to NotificationManager
 * @param con pointer to data connection
 * @return 0 when success, otherwise error number
 */

int NotificationManagerAddExternalConnection( NotificationManager *nm, void *con )
{
	DEBUG("[NotificationManagerAddExternalConnection] Add connection!\n");
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		ExternalServerConnection *esc = FCalloc( 1, sizeof(ExternalServerConnection) );
		if( esc != NULL )
		{
			esc->esc_Connection = con;
			esc->node.mln_Succ = (MinNode *)nm->nm_ESConnections;
			nm->nm_ESConnections = esc;
		}
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Remove external server connection
 * 
 * @param nm pointer to NotificationManager
 * @param con pointer to data connection which will be removed
 * @return 0 when success, otherwise error number
 */

int NotificationManagerRemoveExternalConnection( NotificationManager *nm, void *con )
{
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		ExternalServerConnection *escroot = NULL;
		ExternalServerConnection *esc = nm->nm_ESConnections;
		while( esc != NULL )
		{
			ExternalServerConnection *oldesc = esc;
			esc = (ExternalServerConnection *)esc->node.mln_Succ;
			
			if( con == oldesc->esc_Connection )
			{
				FFree( oldesc );
			}
			else
			{
				oldesc->node.mln_Succ = (MinNode *)escroot;
				escroot = oldesc;
			}
		}
		nm->nm_ESConnections = escroot;
		
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Send message to external servers
 * 
 * @param nm pointer to NotificationManager
 * @param sername server name to which message will be sent. NULL means that message will be send to all connections.
 * @param msg message which will be send to servers
 * @param len message length
 * @return 0 when success, otherwise error number
 */

int NotificationManagerSendInformationToConnections( NotificationManager *nm, char *sername, char *msg, int len )
{
	int ret = 0;
	ExternalServerConnection *con = nm->nm_ESConnections;
	if( sername == NULL ) // send to all servers
	{
		while( con != NULL )
		{
			ret += WriteMessageToServers( con->esc_Connection, (unsigned char *)msg, len );
			con = (ExternalServerConnection *)con->node.mln_Succ;
		}
	}
	else
	{
		while( con != NULL )
		{
			ret += WriteMessageToServers( con->esc_Connection, (unsigned char *)msg, len );
			con = (ExternalServerConnection *)con->node.mln_Succ;
		}
	}
	return ret;
}

/**
 * Send message to external servers
 * 
 * @param nm pointer to NotificationManager
 * @param req Http request
 * @param sername server name to which message will be sent. NULL means that message will be send to all connections.
 * @param reqid if call was request id is not null. Otherwise its information to external service
 * @param sertype service type
 * @param func function
 * @param action name
 * @param msg message which will be send to servers
 * @return number bytes when success, otherwise error number (less and below 0 )
 */

int NotificationManagerSendEventToConnections( NotificationManager *nm, Http *req, char *sername, const char *reqid, const char *sertype, const char *func, const char *action, char *msg )
{
	if( reqid == NULL )
	{
		if( sertype == NULL || func == NULL || action == NULL || msg == NULL )
		{
			FERROR("Message missing parameters\n");
			return 0;
		}
	}
	
	if( req != NULL && req->h_RequestSource == HTTP_SOURCE_EXTERNAL_SERVER )
	{
		INFO( "Request comes from external server\n");
		return 0;
	}
	
	/*
	{
type : 'reply',
data : {
     requestId : <string>,
    result : <data>,
OR
    error : <error>,
    }
}
	 */
	
	int ret = 0;
	int msglen = 512 + strlen( msg );
	if( func != NULL )
	{
		msglen += strlen( func );
	}
	if( sertype != NULL )
	{
		msglen += strlen( sertype );
	}
	if( action != NULL )
	{
		msglen += strlen( action );
	}
	if( reqid != NULL )
	{
		msglen += strlen( reqid );
	}
	char *dstMsg = FMalloc( msglen );
	
	if( dstMsg != NULL )
	{
		int dstsize = 0;
		
		if( reqid != NULL )
		{
			dstsize = snprintf( dstMsg, msglen, "{\"type\":\"reply\",\"data\":{\"requestId\":\"%s\",\"result\":%s}}", reqid, msg );
		}
		else
		{
			dstsize = snprintf( dstMsg, msglen, "{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"data\":%s}}}", sertype, func, action, msg );
		}
		
		Log( FLOG_INFO, "[NotificationManagerSendEventToConnections] Send message: '%s'\n", dstMsg );
		
		ExternalServerConnection *con = nm->nm_ESConnections;
		if( sername == NULL ) // send to all servers
		{
			DEBUG("Server name = NULL\n");
			while( con != NULL )
			{
				DataQWSIM *en = (DataQWSIM *)con->esc_Connection;
				
				DEBUG("Msg sent to: %s\n", en->d_ServerName );
				ret += WriteMessageToServers( con->esc_Connection, (unsigned char *)dstMsg, dstsize );
				con = (ExternalServerConnection *)con->node.mln_Succ;
			}
		}
		else
		{
			DEBUG("Server name != NULL\n");
			while( con != NULL )
			{
				ret += WriteMessageToServers( con->esc_Connection, (unsigned char *)dstMsg, dstsize );
				con = (ExternalServerConnection *)con->node.mln_Succ;
			}
		}
		FFree( dstMsg );
	}
	return ret;
}

/**
 * Send message to external servers
 * 
 * @param nm pointer to NotificationManager
 * @param req Http request
 * @param us user session
 * @param sername server name to which message will be sent. NULL means that message will be send to all connections.
 * @param type type of message
 * @param group message group
 * @param action action
 * @param params additional parameters
 * @return response
 */

char *NotificationManagerSendRequestToConnections( NotificationManager *nm, Http *req, UserSession *us, char *sername, const char *type, const char *group, const char *action, const char *params )
{
	//char *retMessage = NULL;
	BufString *retMsg = BufStringNew();
	
	if( req != NULL && req->h_RequestSource == HTTP_SOURCE_EXTERNAL_SERVER )
	{
		INFO( "Request comes from external server\n");
		return NULL;
	}
	
	/*
{
   type : 'path',
   data : {
       type : 'to',
       data : {
            type : 'thing'
            requestId : 'id-string'
            data : {
                  request parameters
	}}}}
	 */
	
	int msglen = 728 + strlen( params );
	if( type != NULL )
	{
		msglen += strlen( type );
	}
	if( group != NULL )
	{
		msglen += strlen( group );
	}
	if( action != NULL )
	{
		msglen += strlen( action );
	}

	char *dstMsg = FMalloc( msglen );
	int ret = 0;
	
	if( dstMsg != NULL )
	{
		int sentMessageTo = 0;	// number of receipients
		int dstsize = 0;
		char *reqID = FCalloc( 128, sizeof(char) );

		ExternalServerConnection *con = nm->nm_ESConnections;
		if( sername == NULL ) // send to all servers
		{
			DEBUG("Server name = NULL\n");
			while( con != NULL )
			{
				DataQWSIM *en = (DataQWSIM *)con->esc_Connection;
				
				snprintf( reqID, 128, "EXTSER_%lu%d_ID", time(NULL), rand()%999999 );
				dstsize = snprintf( dstMsg, msglen, "{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"requestId\":\"%s\",\"data\":{%s,\"originUserId\":\"%s\"}}}}", type, group, action, reqID, params, us->us_User->u_UUID );
		
				Log( FLOG_INFO, "[NotificationManagerSendRequestToConnections] Send message: '%s'\n", dstMsg );
				
				DEBUG("Msg sent to: %s\n", en->d_ServerName );
				ret += WriteMessageToServers( con->esc_Connection, (unsigned char *)dstMsg, dstsize );
				con = (ExternalServerConnection *)con->node.mln_Succ;
				
				sentMessageTo++;
			}
		}
		else
		{
			DEBUG("Server name != NULL\n");
			while( con != NULL )
			{
				snprintf( reqID, 128, "EXTSER_%lu%d_ID", time(NULL), rand()%999999 );
				dstsize = snprintf( dstMsg, msglen, "{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"requestId\":\"%s\",\"data\":{%s,\"originUserId\":\"%s\"}}}}", type, group, action, reqID, params, us->us_User->u_UUID );
		
				Log( FLOG_INFO, "[NotificationManagerSendRequestToConnections] Send message: '%s'\n", dstMsg );
				
				ret += WriteMessageToServers( con->esc_Connection, (unsigned char *)dstMsg, dstsize );
				con = (ExternalServerConnection *)con->node.mln_Succ;
				
				sentMessageTo++;
			}
		}
		FFree( dstMsg );
		
		//
		// wait for response
		//
		
		if( sentMessageTo > 0 )
		{
			int secs = 0;
			while( TRUE )
			{
				// response
				FQEntry *foundEntry = NULL;
			
				DEBUG("[Notify Service] check queue\n");
			
				if( FRIEND_MUTEX_LOCK( &(nm->nm_ExtServiceMutex)) == 0 )
				{
					FQEntry *qe = nm->nm_ExtServiceMessage.fq_First;
					// we will build new linked list
					FQEntry *qenroot = NULL;
					while( qe != NULL )
					{
						FQEntry *locentry = qe;
						qe = (FQEntry *)qe->node.mln_Succ;
						DEBUG("Going through entries\n");
					
						// check if its same reqid
						// if same return response
						if( locentry->fq_RequestID != NULL && strcmp( locentry->fq_RequestID, reqID ) == 0 )
						{
							DEBUG("Found entry by requestid : %s\n", reqID );
							foundEntry = locentry;
						}
						// if msg is older then 30 seconds remove it
						else if( (time(NULL) - locentry->fq_Timestamp) > 30  )	// message is older then 30 seconds
						{
							DEBUG("Delete old message\n");
							if( locentry->fq_Data != NULL )
							{
								FFree( locentry->fq_Data );
							}
							if( locentry->fq_RequestID != NULL )
							{
								FFree( locentry->fq_RequestID );
							}
							FFree( locentry );
						}
						// otherwise leave message
						else
						{
							DEBUG("Leave message in queue\n");
							locentry->node.mln_Succ = (MinNode *)qenroot;
							qenroot = locentry;
						}
					}
					// assign new list to root
					nm->nm_ExtServiceMessage.fq_First = qenroot;
				
					FRIEND_MUTEX_UNLOCK( &(nm->nm_ExtServiceMutex));
				}
			
				DEBUG("[Notify Service] found entry %p\n", foundEntry );
			
				// if entry was found we can come back with response
				if( foundEntry != NULL )
				{
					if( retMsg->bs_Size > 0 )
					{
						BufStringAddSize( retMsg, ",", 1 );
					}
					BufStringAdd( retMsg, (char *)foundEntry->fq_Data );
				
					if( foundEntry->fq_RequestID != NULL )
					{
						FFree( foundEntry->fq_RequestID );
					}
					if( foundEntry->fq_Data != NULL )
					{
						FFree( foundEntry->fq_Data );
					}
					FFree( foundEntry );
				
					// if message was send to more then one servers we are waiting for reply
					sentMessageTo--;
				
					if( sentMessageTo <= 0 )
					{
						DEBUG("[Notify Service] All responses recevied, quit loop\n");
						break;
					}
				}
			
				sleep( 1 );
				//usleep( 50000 );
				if( secs++ >30 )	// around 15 seconds
				{
					const char *timeoutResp = "{\"result\":-1,\"error\",\"Timeout\"}";
					BufStringAdd( retMsg, timeoutResp );
					FERROR("Timeout\n");
					break; 
				} 
			} // while TRUE
			DEBUG("[Notify Service] ret message: %s\n", retMsg->bs_Buffer );
		}
		else // message was not send
		{
			const char *timeoutResp = "{\"result\":-2,\"error\",\"No Connection\"}";
			BufStringAdd( retMsg, timeoutResp );
			FERROR("No connection\n");
		}
	}
	
	// assign response to return string and delete bufstring
	char *retMessage = retMsg->bs_Buffer;
	retMsg->bs_Buffer = NULL;
	BufStringDelete( retMsg );
	
	return retMessage;
}

/**
 * Add incoming message from external service to response queue
 * 
 * @param nm pointer to NotificationManager
 * @param reqid - request ID (remember to pass parameter in allocated memory)
 * @param message - message (remember to pass parameter in allocated memory)
 * @return 0 when success, otherwise error number
 */
int NotificationManagerAddIncomingRequestES( NotificationManager *nm, char *reqid, char *message )
{
	// allocate memory for new entry
	FQEntry *newEntry = FCalloc( 1, sizeof( FQEntry ) );
	
	DEBUG("[NotificationManagerAddIncomingRequestES] requestid : %s message: %s\n", reqid, message );
	
	if( newEntry != NULL )
	{
		newEntry->fq_Data = (unsigned char *)message;
		newEntry->fq_Timestamp = time(NULL);
		newEntry->fq_RequestID = reqid;
		
		if( FRIEND_MUTEX_LOCK( &(nm->nm_ExtServiceMutex)) == 0 )
		{
			newEntry->node.mln_Succ = (MinNode *)nm->nm_ExtServiceMessage.fq_First;
			nm->nm_ExtServiceMessage.fq_First = newEntry;
			FRIEND_MUTEX_UNLOCK( &(nm->nm_ExtServiceMutex));
			
			DEBUG("[NotificationManagerAddIncomingRequestES] new entry added to list\n");
			return 0;
		}
	}
	return 1;
}

/**
 * Find and delete old Notifications with NotificationsSent (old = 14 days)
 * 
 * @param nm pointer to NotificationManager
 * @return 0 when success, otherwise error number
 */
int NotificationManagerDeleteOldNotificationDB( NotificationManager *nm )
{
	char temp[ 1024 ];
	time_t t = time( NULL );
	time_t diff = 60 * 60 * 24 * 14; //1209600 = 14 days in seconds
	t -= diff;		// time when entry was created < time minus diff
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	
	{
		snprintf( temp, sizeof(temp), "DELETE from `FNotification` WHERE Created>%lu", t );
	
		nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
		snprintf( temp, sizeof(temp), "DELETE from `FNotificationSent` where `NotificationID` in(SELECT ID FROM `FNotification` WHERE Created>%lu)", t );
	
		nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
	}
	return 0;
}

/**
 * Remove Notification by notification sent ID
 * 
 * @param nm pointer to NotificationManager
 * @param nsid id of NotificationSent which will be removed from checking queue
 * @return Notification structure when founded otherwise NULL
 */
Notification *NotificationManagerRemoveNotification( NotificationManager *nm, FULONG nsid )
{
	Notification *ret = NULL;
	Notification *notIt = nm->nm_Notifications;
	Notification *notPrevIt = nm->nm_Notifications;
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )
	{
		Log( FLOG_INFO, "NotificationManagerRemoveNotification remove %lu\n", nsid );
		
		while( notIt != NULL )
		{
			NotificationSent *lnsIt = notIt->n_NotificationsSent;
			while( lnsIt != NULL )
			{
				if( nsid == lnsIt->ns_ID )
				{
					break;
				}
				lnsIt = (NotificationSent *)lnsIt->node.mln_Succ;
			}
			
			// entry was found
			if( lnsIt != NULL )
			{
				Log( FLOG_INFO, "Notify will be removed: NSID %ld NID %lu\n", lnsIt->ns_ID, lnsIt->ns_NotificationID );
				if( notIt == nm->nm_Notifications )	// current notification is first, we set it as next
				{
					nm->nm_Notifications = (Notification *) nm->nm_Notifications->node.mln_Succ;
				}
				else	// set next in previous node to next of current one
				{
					notPrevIt->node.mln_Succ = notIt->node.mln_Succ;
				}
				break;	// go out from while loop
			}
			else
			{
				Log( FLOG_INFO, "Notify will not be removed (not found)\n" );
			}
			notPrevIt = notIt;
			notIt = (Notification *)notIt->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
		Log( FLOG_INFO, "NotificationManagerRemoveNotification remove end %lu\n", nsid );
	}
	
	return ret;
}

//
//
//

typedef struct DelListEntry
{
	Notification *dle_NotificationPtr;
	MinNode node;
}DelListEntry;

typedef struct SendNotifThreadData
{
	DelListEntry				*sntd_RootNotification;
	DelListEntry				*sntd_LastNotification;
	NotificationManager			*sntd_NM;
}SendNotifThreadData;
//
// Send message to devices thread
//

void NotificationSendThread( FThread *data )
{
	SendNotifThreadData *nstd = (SendNotifThreadData *)data->t_Data;
	NotificationManager *nm = nstd->sntd_NM;
	DelListEntry *le = nstd->sntd_RootNotification;
	while( le != NULL )
	{
		DelListEntry *nextentry = (DelListEntry *)le->node.mln_Succ;
		
		Notification *dnotif = le->dle_NotificationPtr;
		
		if( dnotif != NULL )
		{
			DEBUG1("Msg will be sent! ID: %lu content: %s and deleted\n", dnotif->n_ID, dnotif->n_Content );
		
			MobileAppNotifyUserUpdate( nstd->sntd_NM->nm_SB, dnotif->n_UserName, dnotif, NOTIFY_ACTION_TIMEOUT );
			NotificationDelete( dnotif );
			le->dle_NotificationPtr = NULL;
		}
		
		FFree( le );
		
		le = nextentry;
	}
	FFree( nstd );
	
	nm->nm_NumberOfLaunchedThreads--;
}

//
// Timeout thread
//

void NotificationManagerTimeoutThread( FThread *data )
{
	data->t_Launched = TRUE;
	NotificationManager *nm = (NotificationManager *)data->t_Data;
	int counter = 0;		// responsible for launching Notifcation checker
	int cleanCoutner = 0;	// responisble for launching Notification DB cleaner
	
	while( data->t_Quit != TRUE )
	{
		sleep( 1 );
		counter++;
		if( counter > TIME_OF_CHECKING_NOTIFICATIONS )	// do checking every 15 seconds
		{
			SendNotifThreadData *sntd = FCalloc( 1, sizeof( SendNotifThreadData ) );
			sntd->sntd_NM = nm;
			//DelListEntry *rootDeleteList = NULL;
			//DelListEntry *lastDeleteListEntry = NULL;
			
			cleanCoutner++;
			DEBUG("[NotificationManagerTimeoutThread]\t\t\t\t\t\t\t\t\t\t\t counter > 15\n");
			int toDel = 0;
			int allEntries = 0;
			
			if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )
			{
				Notification *notifStayRoot = NULL;
				Notification *notifStayLast = NULL;
				
				Notification *notif = nm->nm_Notifications;

				INFO( "[NotificationManagerTimeoutThread] checking\n");
				while( notif != NULL )
				{
					DEBUG("Notification ID: %lu\n", notif->n_ID );
					Notification *next = (Notification *)notif->node.mln_Succ;
					allEntries++;
					
					time_t locTime = time(NULL);
					// + 20
					if( (notif->n_Created + TIME_OF_OLDER_MESSAGES_TO_REMOVE) <= locTime )		
						// seems notification is timeouted
						// notify all users it wasnt read
					{
						DEBUG("[NotificationManagerTimeoutThread] notification will be deleted %lu\n", notif->n_ID );
						
						DEBUG("Remove notification for user: %s\n", notif->n_UserName );
						toDel++;
						
						// add entries to list, entries will be updated and deleted
						DelListEntry *le = FCalloc( 1, sizeof(DelListEntry) );
						if( le != NULL )
						{
							le->dle_NotificationPtr = notif;
						
							if( sntd->sntd_RootNotification == NULL )
							{
								sntd->sntd_RootNotification = le;
								sntd->sntd_LastNotification = le;
							}
							else
							{
								sntd->sntd_LastNotification->node.mln_Succ = (MinNode *)le;
								sntd->sntd_LastNotification = le;
							}
						}
					}
					else
					{
						DEBUG("[NotificationManagerTimeoutThread] notification will stay %lu\n", notif->n_ID );
						notif->node.mln_Succ = NULL;	// to be sure it is not connected to anything
						notif->node.mln_Pred = NULL;
						
						// we create new list which will overwrite old one
						if( notifStayRoot == NULL )
						{
							notifStayRoot = notif;
							notifStayLast = notif;
						}
						else
						{
							notifStayLast->node.mln_Succ = (MinNode *)notif;
							notifStayLast = notif;
						}
					}
					
					notif = (Notification *)next;
				}
				
				nm->nm_Notifications = notifStayRoot;
				
				FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
			}
			
			// update and remove list of entries
			DEBUG("[NotificationManagerTimeoutThread]\t\t\t\t\t\t\t\t\t\t\t update and remove list of entries: %d all entries %d\n", toDel, allEntries );
			
			// seems there is no new notification to delete
			if( sntd->sntd_RootNotification == NULL )
			{
				FFree( sntd );
				sntd = NULL;
			}
			else if( data->t_Quit != TRUE )
			{
				if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )
				{
					nm->nm_NumberOfLaunchedThreads++;
					FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
				}
				FThread *t = ThreadNew( NotificationSendThread, sntd, TRUE, NULL );
			}
			/*
			DelListEntry *le = rootDeleteList;
			while( le != NULL )
			{
				DelListEntry *nextentry = (DelListEntry *)le->node.mln_Succ;
				
				Notification *dnotif = le->dle_NotificationPtr;
				
				if( dnotif != NULL )
				{
					DEBUG1("Msg will be sent! ID: %lu content: %s and deleted\n", dnotif->n_ID, dnotif->n_Content );
				
					MobileAppNotifyUserUpdate( nm->nm_SB, dnotif->n_UserName, dnotif, 0, NOTIFY_ACTION_TIMEOUT );
					NotificationDelete( dnotif );
					le->dle_NotificationPtr = NULL;
				}
				
				FFree( le );
				
				le = nextentry;
			}
			DEBUG("[NotificationManagerTimeoutThread]\t\t\t\t\t\t\t\t\t\t\t update and remove list of entries END\n" );
			*/
			DEBUG("[NotificationManagerTimeoutThread] Check Notification!\n");
			counter = 0;
			
			// 86400 - one day in seconds , 3600 *24
			if( cleanCoutner > 17280 )	// 86400 seconds / 10 second interval * 2 days
			{
				NotificationManagerDeleteOldNotificationDB( nm );
				cleanCoutner = 0;
			}
		}
	}
	
	data->t_Launched = FALSE;
}
