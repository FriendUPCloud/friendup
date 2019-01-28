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
		
				nm->nm_SQLLib = (struct SQLLibrary *)LibraryOpen( lsb, lsb->sl_DefaultDBLib, 0 );
				if( nm->nm_SQLLib != NULL )
				{
					int error;
					error = nm->nm_SQLLib->SetOption( nm->nm_SQLLib, options );
					error = nm->nm_SQLLib->Connect( nm->nm_SQLLib, host, dbname, login, pass, port );
				}
				plib->Close( prop );
			}
			
			nm->nm_TimeoutThread = ThreadNew( NotificationManagerTimeoutThread, nm, TRUE, NULL );
		} // plib and plib->open != NULL
		
		nm->nm_APNSSandBox = FALSE;

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
	if( nm != NULL )
	{
		if( nm->nm_TimeoutThread != NULL )
		{
			nm->nm_TimeoutThread->t_Quit = TRUE;
			while( TRUE )
			{
				if( nm->nm_TimeoutThread->t_Launched == FALSE )
				{
					break;
				}
				sleep( 1 );
			}
			DEBUG2("[NotificationManagerDelete]  close thread\n");
		
			ThreadDelete( nm->nm_TimeoutThread );
		}
		
		if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	// add node to database and to list
		{
			NotificationDeleteAll( nm->nm_Notifications );
			FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
		}

		pthread_mutex_destroy( &(nm->nm_Mutex) );
		
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
	DEBUG("\n\n\n\n\n\n[NotificationManagerAddExternalConnection] Add connection!\n");
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
 * @param sertype service type
 * @param func function
 * @param action name
 * @param msg message which will be send to servers
 * @return number bytes when success, otherwise error number (less and below 0 )
 */

int NotificationManagerSendEventToConnections( NotificationManager *nm, Http *req, char *sername, const char *sertype, const char *func, const char *action, char *msg )
{
	if( sertype == NULL || func == NULL || action == NULL || msg == NULL )
	{
	
		FERROR("Message missing parameters\n");
		return 0;
	}
	
	if( req != NULL && req->h_RequestSource == HTTP_SOURCE_EXTERNAL_SERVER )
	{
		INFO( "Request comes from external server\n");
		return 0;
	}
	
	int ret = 0;
	int msglen = 512 + strlen( sertype ) + strlen( func ) + strlen( action ) + strlen( msg );
	char *dstMsg = FMalloc( msglen );
	
	if( dstMsg != NULL )
	{
		int dstsize = snprintf( dstMsg, msglen, "{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"data\":{\"type\":\"%s\",\"data\":%s}}}", sertype, func, action, msg );
		
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

typedef struct DelListEntry
{
	Notification *dle_NotificationPtr;
	MinNode node;
}DelListEntry;

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
		if( counter > 10 )	// do checking every 15 seconds
		{
			DelListEntry *rootDeleteList = NULL;
			DelListEntry *lastDeleteListEntry = NULL;
			
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
						
							if( rootDeleteList == NULL )
							{
								rootDeleteList = le;
								lastDeleteListEntry = le;
							}
							else
							{
								lastDeleteListEntry->node.mln_Succ = (MinNode *)le;
								lastDeleteListEntry = le;
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

//
//
//

#define APN_TOKEN_BINARY_SIZE 32
#define APN_TOKEN_LENGTH 64

//
//
//



int hex2int(char ch)
{
    if (ch >= '0' && ch <= '9')
        return ch - '0';
    if (ch >= 'A' && ch <= 'F')
        return ch - 'A' + 10;
    if (ch >= 'a' && ch <= 'f')
        return ch - 'a' + 10;
    return -1;
}

char *TokenToBinary( const char *token )
{
	char inputCharVector[ 256 ];
	memset( inputCharVector, 0, sizeof(inputCharVector) );
	int len = strlen( token );
    int i, j;
	
	//Convert the string to the hex vector string

	/*converting str character into Hex and adding into strH*/
    for( i=0 ; i<len ;i++ )
    { 
		char val = 0;
        val = hex2int( token[ i ] );
		inputCharVector[i] = val;
    }
    
	char *buffer = (char *)malloc( 34 );
	int location = 0;
	memset( buffer, 0, 34 );
    
	unsigned value;
	unsigned data[4];

	for( i = 0; i < len; i += 8)
	{
		memset(data, 0, 4);
		data[0] = (inputCharVector[i] << 4) | (inputCharVector[i + 1]);
		data[1] = (inputCharVector[i + 2] << 4) | (inputCharVector[i + 3]);
		data[2] = (inputCharVector[i + 4] << 4) | (inputCharVector[i + 5]);
		data[3] = (inputCharVector[i + 6] << 4) | (inputCharVector[i + 7]);
        
		value = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
        
		value = htonl(value);

		memcpy( &buffer[location], &value, sizeof(unsigned) );
		
		location += sizeof(unsigned);
	}

	buffer[ 32 ] = '0';
	buffer[ 33 ] = 0;

	return buffer;
}
/*
char *TokenToBinary( const char *token )
{
	if( token == NULL )
	{
		return NULL;
	}

	char *binaryToken = malloc( APN_TOKEN_BINARY_SIZE );
	if( !binaryToken )
	{
		errno = ENOMEM;
		return NULL;
	}
    memset( binaryToken, 0, APN_TOKEN_BINARY_SIZE);

	uint16_t j = 0;
	uint16_t i = 0;
	for( ; i < APN_TOKEN_BINARY_SIZE * 2; i += 2, j++ )
	{
		char tmp[3] = {token[i], token[i + 1], '\0'};
		uint32_t tmp_binary = 0;
		sscanf(tmp, "%x", &tmp_binary);
		binaryToken[j] = (uint8_t) tmp_binary;
	}
    return binaryToken;
}
*/

#define IOS_MAX_MSG_SIZE sizeof (uint8_t) + sizeof (uint32_t) + sizeof (uint32_t) + sizeof (uint16_t) + DEVICE_BINARY_SIZE + sizeof (uint16_t) + MAXPAYLOAD_SIZE

// Source: https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/LegacyFormat.html
FBOOL SendPayload( NotificationManager *nm, SSL *sslPtr, char *deviceTokenBinary, char *payloadBuff, size_t payloadLength )
{
	DEBUG("Send payload\n");
	FBOOL rtn = FALSE;
	if( sslPtr && deviceTokenBinary && payloadBuff && payloadLength )
	{
		uint8_t command = 1; /* command number */
		char *binaryMessageBuff;
		if( ( binaryMessageBuff = FMalloc( IOS_MAX_MSG_SIZE ) ) != NULL )
		{
			// message format is, |COMMAND|ID|EXPIRY|TOKENLEN|TOKEN|PAYLOADLEN|PAYLOAD|
			char *binaryMessagePt = binaryMessageBuff;
			uint32_t whicheverOrderIWantToGetBackInAErrorResponse_ID = 1234;
			uint32_t networkOrderExpiryEpochUTC = htonl( nm->nm_APNSNotificationTimeout );
			uint16_t networkOrderTokenLength = htons(DEVICE_BINARY_SIZE);
			uint16_t networkOrderPayloadLength = htons(payloadLength);
        
			// command
			*binaryMessagePt++ = command;
        
			// provider preference ordered ID 
			memcpy(binaryMessagePt, &whicheverOrderIWantToGetBackInAErrorResponse_ID, sizeof (uint32_t));
			binaryMessagePt += sizeof (uint32_t);
        
			// expiry date network order 
			memcpy(binaryMessagePt, &networkOrderExpiryEpochUTC, sizeof (uint32_t));
			binaryMessagePt += sizeof (uint32_t);
        
			// token length network order
			memcpy(binaryMessagePt, &networkOrderTokenLength, sizeof (uint16_t));
			binaryMessagePt += sizeof (uint16_t);
        
			// device token
			memcpy(binaryMessagePt, deviceTokenBinary, DEVICE_BINARY_SIZE);
			binaryMessagePt += DEVICE_BINARY_SIZE;
        
			// payload length network order 
			memcpy(binaryMessagePt, &networkOrderPayloadLength, sizeof (uint16_t));
			binaryMessagePt += sizeof (uint16_t);
        
			// payload 
			memcpy(binaryMessagePt, payloadBuff, payloadLength);
			binaryMessagePt += payloadLength;
        
			int result = SSL_write(sslPtr, binaryMessageBuff, (binaryMessagePt - binaryMessageBuff));
			if( result > 0 )
			{
				DEBUG("Msg sent\n");
				rtn = true;
				//cout<< "SSL_write():" << result<< endl;
			}
			else
			{
				int errorCode = SSL_get_error(sslPtr, result);
				DEBUG( "Failed to write in SSL, error code: %d\n", errorCode );
			}
			FFree( binaryMessageBuff );
		}
    }
    return rtn;
}

/**
 * Send notification to APNS server
 * 
 * @param nm pointer to NotificationManager
 * @param title title
 * @param content content of message
 * @param sound sound name
 * @param badge badge
 * @param app application name
 * @param extras user data
 * @param tokens device tokens separated by coma
 * @return 0 when success, otherwise error number
 */

int NotificationManagerNotificationSendIOS( NotificationManager *nm, const char *title, const char *content, const char *sound, int badge, const char *app, const char *extras, char *tokens )
{
	char *startToken = tokens;
	char *curToken = tokens+1;
	SSL_CTX *ctx;
	SSL *ssl;
	int sockfd;
	struct hostent *he;
	struct sockaddr_in sa;
	
	if( tokens == NULL || strlen( tokens ) < 6 )
	{
		return 21;
	}
	
	DEBUG("Send notifications IOS, cert path >%s< - content %s title: %s\n", nm->nm_APNSCert, content, title );
	
	nm->nm_APNSNotificationTimeout = time(NULL) + 86400; // default expiration date set to 1 day
    
	SSLeay_add_ssl_algorithms();
	SSL_load_error_strings();
	ctx = SSL_CTX_new(TLSv1_method());
	if( !ctx )
	{
		FERROR("SSL_CTX_new()...failed\n");
		return 1;
	}
    
	if( SSL_CTX_load_verify_locations( ctx, NULL, ".") <= 0 )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 2;
	}
    
	if( SSL_CTX_use_certificate_file(ctx, nm->nm_APNSCert, SSL_FILETYPE_PEM) <= 0)
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 3;
	}
    
	if( SSL_CTX_use_PrivateKey_file(ctx, nm->nm_APNSCert, SSL_FILETYPE_PEM ) <= 0)
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 4;
	}
    
	if( SSL_CTX_check_private_key( ctx ) <= 0 )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 5;
	}
    
	sockfd = socket( AF_INET, SOCK_STREAM, 0 );
	if( sockfd == -1 )
	{
		FERROR("socket()...-1\n");
		SSL_CTX_free( ctx );
 		return 6;
	}
    
	sa.sin_family = AF_INET;
	if( nm->nm_APNSSandBox )
	{
		he = gethostbyname( APNS_SANDBOX_HOST );
	}
	else
	{
		he = gethostbyname( APNS_HOST );
	}
    
	if( !he )
	{
		close( sockfd );
		SSL_CTX_free( ctx );
		return 7;
	}
	
	memcpy( &sa.sin_addr.s_addr, he->h_addr_list[0], he->h_length );
	
	//sa.sin_addr.s_addr = inet_addr( inet_ntoa(*((struct in_addr *) he->h_addr_list[0])));
	
	if( nm->nm_APNSSandBox )
	{
		sa.sin_port = htons(APNS_SANDBOX_PORT);
	}
	else
	{
		sa.sin_port = htons(APNS_PORT);
	}
    
	if( connect(sockfd, (struct sockaddr *) &sa, sizeof(sa)) == -1 )
	{
		close(sockfd);
		SSL_CTX_free( ctx );
		return 8;
	}
	
	DEBUG("Connected to APNS server\n");
    
	ssl = SSL_new(ctx);
	SSL_set_fd(ssl, sockfd);
	if( SSL_connect(ssl) == -1 )
	{
		shutdown(sockfd, 2);
		close(sockfd);
		SSL_CTX_free( ctx );
		return 9;
	}
	
	int successNumber = 0;
	int failedNumber = 0;		
			
	char *pushContent = FMalloc( MAXPAYLOAD_SIZE );
	if( pushContent != NULL )
	{
		while( TRUE )
		{
			// go through all tokens separated by , (coma)
			// and send message to them
			if( *curToken == 0 || *curToken == ',' )
			{
				if( *curToken != 0 )
				{
					*curToken = 0;
				}
			
				DEBUG("Send message to : >%s<\n", startToken );
			
				int pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\"},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, extras );
			
				char *tok = TokenToBinary( startToken );
				DEBUG("Send payload, token pointer %p token '%s'\n", tok, startToken );
				if( tok != NULL )
				{
					if( !SendPayload( nm, ssl, tok, pushContent, pushContentLen ) )
					{
						failedNumber++;
					}
					else
					{
						successNumber++;
					}
					FFree( tok );
				}

				startToken = curToken+1;
			
				if( *curToken == 0 )
				{
					break;
				}
				curToken++;
			}
			curToken++;
		}
		FFree( pushContent );
	}
	
	DEBUG("Notifications sent: %d fail: %d\n", successNumber, failedNumber );
	
	SSL_shutdown(ssl);
	SSL_free(ssl);
	close(sockfd);
	SSL_CTX_free(ctx);
	
	return 0;
}
