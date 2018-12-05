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
		SystemBase *lsb = (SystemBase *)lsb;
		char *login = NULL;
		char *pass = NULL;
		char *host = NULL;
		char *dbname = NULL;
		int port = 3306;
		char *options = NULL;
		
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
	
	snprintf( where, sizeof(where), "ID='%lu'", notifSentId );
	
	int entries;
	
	NotificationSent *notifSent = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationSentDesc, where, &entries );
	if( notifSent != NULL )
	{
		snprintf( where, sizeof(where), "ID='%lu'", notifSent->ns_NotificationID );
		n = nm->nm_SQLLib->Load( nm->nm_SQLLib, NotificationDesc, where, &entries );
		if( n != NULL )
		{
			n->n_NotificationsSent = notifSent;
		}
	}
	
	return n;
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

