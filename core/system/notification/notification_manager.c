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
		
		if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) )	// add node to database and to list
		{
			NotificationDeleteAll( nm->nm_Notifications );
			FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
		}

		pthread_mutex_destroy( &(nm->nm_Mutex) );
		
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
	
	int entries;
	// reading Notification
	n = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationDesc, where, &entries );
	
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
	
	snprintf( where, sizeof(where), "ID='%lu'", ID );
	ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
	
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
	
	snprintf( where, sizeof(where), "ID='%lu' AND Status=%d", ID, status );
	ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
	
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
	
	snprintf( where, sizeof(where), "Status=%d AND UserMobileAppID=%lu", status, umaID );
	ns = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
	
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
	nm->nm_SQLLib->Save( nm->nm_SQLLib, NotificationDesc, n );
	
	if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )	// add node to database and to list
	{
		DEBUG("[NotificationManagerAddNotificationDB] added to list: %lu\n", n->n_ID );
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
	nm->nm_SQLLib->Save( nm->nm_SQLLib, NotificationSentDesc, ns );
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
	char temp[ 1024 ];
	snprintf( temp, sizeof(temp), "DELETE from `FNotification` where `ID`=%lu", nid );
	
	nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
	snprintf( temp, sizeof(temp), "DELETE from `FNotificationSent` where `NotificationID`=%lu", nid );
	
	nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
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
	char temp[ 1024 ];

	snprintf( temp, sizeof(temp), "UPDATE `FNotificationSent` set Status=%d where `ID`=%lu", status, nid );
	
	nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
	return 0;
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
	
	snprintf( temp, sizeof(temp), "DELETE from `FNotification` WHERE Created>%lu", t );
	
	nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
	snprintf( temp, sizeof(temp), "DELETE from `FNotificationSent` where `NotificationID` in(SELECT ID FROM `FNotification` WHERE Created>%lu)", t );
	
	nm->nm_SQLLib->QueryWithoutResults( nm->nm_SQLLib, temp );
	
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
				Log( FLOG_INFO, "Notift will be removed\n" );
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
				Log( FLOG_INFO, "Notift will not be removed (not found)\n" );
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
		time_t locTime = time(NULL);
		
		sleep( 1 );
		counter++;
		if( counter > 10 )	// do checking every 15 seconds
		{
			cleanCoutner++;
			DEBUG("[NotificationManagerTimeoutThread]\t\t\t\t\t\t\t\t\t\t\t counter > 15\n");
			
			if( FRIEND_MUTEX_LOCK( &(nm->nm_Mutex) ) == 0 )
			{
				Notification *notif = nm->nm_Notifications;
				//Notification *nroot = NULL;
			
				INFO( "[NotificationManagerTimeoutThread] checking\n");
				while( notif != NULL )
				{
					Notification *next = (Notification *)notif->node.mln_Succ;
					
					if( (notif->n_Created + 20) <= locTime )		// seems notification is timeouted
					{
						DEBUG("[NotificationManagerTimeoutThread] notification will be deleted %lu\n", notif->n_ID );
						
						if( nm->nm_Notifications == notif )
						{
							nm->nm_Notifications = next;
							if( next != NULL )
							{
								next->node.mln_Pred = NULL;
							}
						}
						else
						{			// prev   -> notif  <- next
							Notification *prev = (Notification *)notif->node.mln_Pred;
							prev->node.mln_Succ = notif->node.mln_Succ;
							if( next != NULL )
							{
								next->node.mln_Pred = (MinNode *)prev;
							}
						}
						
						MobileAppNotifyUserUpdate( nm->nm_SB, notif->n_UserName, notif, 0, NOTIFY_ACTION_TIMEOUT );
						NotificationDelete( notif );
					}
					else
					{
						DEBUG("[NotificationManagerTimeoutThread] notification will stay %lu\n", notif->n_ID );
						//notif->node.mln_Succ = (MinNode *)nroot;
						//nroot = notif;
					}
					
					notif = (Notification *)next;
					//notif = (Notification *)notif->node.mln_Succ;
				}
				//nm->nm_Notifications = nroot;
				
				FRIEND_MUTEX_UNLOCK( &(nm->nm_Mutex) );
			}
			
			DEBUG("[NotificationManagerTimeoutThread] Check Notification!\n");
			counter = 0;
			
			if( cleanCoutner > 2880 )	// 15 * 2880 = 43200 seconds around = 1 day
			{
				NotificationManagerDeleteOldNotificationDB( nm );
				cleanCoutner = 0;
			}
		}
	}
	
	data->t_Launched = FALSE;
}
