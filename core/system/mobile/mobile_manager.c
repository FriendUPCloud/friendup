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
 *  Mobile Manager
 *
 * file contain definitions related to MobileManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 08/09/2018
 */

#include "mobile_manager.h"
#include <system/systembase.h>
#include <mobile_app/mobile_app.h>

/**
 * Create new MobileManager
 *
 * @param sb pointer to SystemBase
 * @return pointer to new MobileManager structure
 */
MobileManager *MobileManagerNew( void *sb )
{
	MobileManager *mm;
	DEBUG("[MobileManagerNew] new\n");
	
	if( ( mm = FCalloc( 1, sizeof(MobileManager) ) ) != NULL )
	{
		mm->mm_SB = sb;
		
		pthread_mutex_init( &(mm->mm_Mutex), NULL );
		
		SystemBase *lsb = (SystemBase *)mm->mm_SB;
	
		SQLLibrary *lsqllib = lsb->LibrarySQLGet( lsb );
		if( lsqllib != NULL )
		{
			int entries;
			mm->mm_UMApps = lsqllib->Load( lsqllib, UserMobileAppDesc, NULL, &entries );
		
			lsb->LibrarySQLDrop( lsb, lsqllib );
		}
		
		UserMobileApp *lma = mm->mm_UMApps;
		while( lma != NULL )
		{
			char msg[ 2048 ];
			
			if( lma->uma_UserID > 0 )
			{
				lma->uma_User = UMGetUserByID( lsb->sl_UM, lma->uma_UserID );
			}
			DEBUG("lsb->l_APNSConnection ptr %p\n", lsb->l_APNSConnection );
			if( lsb->l_APNSConnection != NULL )
			{
				lma->uma_WSClient = lsb->l_APNSConnection->wapns_Connection;
			
				// ASPN connection get only IOS notification
				if( strcmp( lma->uma_Platform, "IOS" ) == 0 )
				{
					int msgsize = snprintf( msg, sizeof(msg), "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"hellooooo\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\"}", "authid", lma->uma_AppToken );
			
					WebsocketClientSendMessage( lsb->l_APNSConnection->wapns_Connection, msg, msgsize );
				}
			}
			//'{"auth":"72e3e9ff5ac019cb41aed52c795d9f4c","action":"notify","payload":"hellooooo","sound":"default","token":"1f3b66d2d16e402b5235e1f6f703b7b2a7aacc265b5af526875551475a90e3fe","badge":1,"category":"whatever"}'
			/*
			DEBUG("[MobileManagerNew] create connection\n");
			lma->uma_WSClient = WebsocketClientNew( sb->l_AppleServerHost, sb->l_AppleServerPort, NULL );
			if( lma->uma_WSClient != NULL )
			{
				if( WebsocketClientConnect( lma->uma_WSClient ) > 0 )
				{
					DEBUG("[MobileManagerNew] connected\n");
				}
				else
				{
					DEBUG("[MobileManagerNew] not connected\n");
				}
			}
			DEBUG("Going to next pointer %p\n", lma );
			*/
			lma = (UserMobileApp *)lma->node.mln_Succ;
		}
	}
	DEBUG("[MobileManagerNew] end\n");
	return mm;
}

/**
 * Delete MobileManager
 *
 * @param mmgr pointer to MobileManager which will be deleted
 */
void MobileManagerDelete( MobileManager *mmgr )
{
	if( mmgr != NULL )
	{
		FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
		
		UserMobileAppDeleteAll( mmgr->mm_UMApps );
		
		FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		
		pthread_mutex_destroy( &(mmgr->mm_Mutex) );
		
		FFree( mmgr );
	}
}

/**
 * Get Token by ID from database
 *
 * @param mmgr pointer to MobileManager
 * @param id id of AppToken
 * @return pointer to structure UserMobileApp
 */
UserMobileApp *MobleManagerGetByTokenDB( MobileManager *mmgr, char *id )
{
	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;
	
	uma = mmgr->mm_UMApps;
	while( uma != NULL )
	{
		if( uma->uma_AppToken != NULL && strcmp( uma->uma_AppToken, id ) == 0 )
		{
			return uma;
		}
		uma = (UserMobileApp *)uma->node.mln_Succ;
	}
	
	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		char where[ 1024 ];
		
		snprintf( where, sizeof(where), "AppToken='%s'", id );
	
		int entries;
		uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		
		if( uma != NULL )
		{
			FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
			
			uma->node.mln_Succ = (MinNode *)mmgr->mm_UMApps;
			mmgr->mm_UMApps = uma;
			
			FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		}
		
		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return uma;
}

/**
 * Get Token by ID from database
 *
 * @param mmgr pointer to MobileManager
 * @param id id of UserMobileApp
 * @return pointer to structure UserMobileApp
 */
UserMobileApp *MobleManagerGetByIDDB( MobileManager *mmgr, FULONG id )
{
	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;
	
	uma = mmgr->mm_UMApps;
	while( uma != NULL )
	{
		if( uma->uma_ID == id )
		{
			return uma;
		}
		uma = (UserMobileApp *)uma->node.mln_Succ;
	}
	
	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		char where[ 256 ];
		snprintf( where, sizeof(where), "ID='%lu'", id );
	
		int entries;
		uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		
		if( uma != NULL )
		{
			FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
			
			uma->node.mln_Succ = (MinNode *)mmgr->mm_UMApps;
			mmgr->mm_UMApps = uma;
			
			FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		}
		
		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return uma;
}

/**
 * Get Token by UserID from database
 *
 * @param mmgr pointer to MobileManager
 * @param user_id id of User
 * @return pointer to structure MobileListEntry
 */
MobileListEntry *MobleManagerGetByUserIDDB( MobileManager *mmgr, FULONG user_id )
{
	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;
	MobileListEntry *root = NULL;
	
	FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
	uma = mmgr->mm_UMApps;
	while( uma != NULL )
	{
		if( uma->uma_UserID == user_id )
		{
			MobileListEntry *e = MobileListEntryNew( uma );
			if( e != NULL )
			{
				e->node.mln_Succ = (MinNode *)root;
				root = e;
			}
		}
		uma = (UserMobileApp *)uma->node.mln_Succ;
	}
	FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );

	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		char where[ 256 ];
		snprintf( where, sizeof(where), "UserID='%lu'", user_id );

		int entries;
		uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		
		MobileListEntry *freeEntries = NULL;
		MobileListEntry *addEntries = NULL;
		
		UserMobileApp *le = uma;
		while( le != NULL )
		{
			// we must check if entry exist
			
			MobileListEntry *existEntr = root;
			while( existEntr != NULL )
			{
				if( le->uma_ID == existEntr->mm_UMApp->uma_ID )
				{
					
					break;
				}
				existEntr = (MobileListEntry *)existEntr->node.mln_Succ;
			}
			
			//
			// we have 2 lists
			// one will hold all entries which will be added to global lists
			// second will hold all entries which will be deleted on the end
			//
			
			// entry exist
			if( existEntr != NULL )
			{
				MobileListEntry *e = MobileListEntryNew( le );
				if( e != NULL )
				{
					e->node.mln_Succ = (MinNode *)freeEntries;
					freeEntries = e;
				}
			}
			else	// entry do not exist
			{
				MobileListEntry *e = MobileListEntryNew( le );
				if( e != NULL )
				{
					e->node.mln_Succ = (MinNode *)addEntries;
					addEntries = e;
				}
			}
			
			le = (UserMobileApp *)le->node.mln_Succ;
		}
		
		// release not used entries
		while( freeEntries != NULL )
		{
			MobileListEntry *rel = freeEntries;
			freeEntries = (MobileListEntry *)freeEntries->node.mln_Succ;
			
			UserMobileAppDelete( rel->mm_UMApp );
			FFree( rel );
		}
		
		FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
		
		// add entries to main lists
		while( addEntries != NULL )
		{
			MobileListEntry *add = addEntries;
			addEntries = (MobileListEntry *)addEntries->node.mln_Succ;
			
			add->node.mln_Succ = (MinNode *)root;
			root = add;
		}
		
		FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );

		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return root;
}

MobileListEntry *MobleManagerGetByUserIDDBPlatform( MobileManager *mmgr, FULONG user_id, int type )
{
	char *mobileType = NULL;
	if( type == MOBILE_APP_TYPE_ANDROID )
	{
		mobileType = "Android";
	}
	else if( type == MOBILE_APP_TYPE_IOS )
	{
		mobileType = "ios";
	}
	else if( type == MOBILE_APP_TYPE_WINDOWS )
	{
		mobileType = "Windows";
	}
	else
	{
		return NULL;
	}
	
	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;
	MobileListEntry *root = NULL;
	
	FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
	uma = mmgr->mm_UMApps;
	while( uma != NULL )
	{
		if( uma->uma_UserID == user_id && strcmp( uma->uma_Platform, mobileType ) == 0 )
		{
			MobileListEntry *e = MobileListEntryNew( uma );
			if( e != NULL )
			{
				e->node.mln_Succ = (MinNode *)root;
				root = e;
			}
		}
		uma = (UserMobileApp *)uma->node.mln_Succ;
	}
	FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );

	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		char where[ 512 ];
		snprintf( where, sizeof(where), "UserID='%lu' AND Platform='%s'", user_id, mobileType );

		int entries;
		uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		
		MobileListEntry *freeEntries = NULL;
		MobileListEntry *addEntries = NULL;
		
		UserMobileApp *le = uma;
		while( le != NULL )
		{
			// we must check if entry exist
			
			MobileListEntry *existEntr = root;
			while( existEntr != NULL )
			{
				if( le->uma_ID == existEntr->mm_UMApp->uma_ID )
				{
					
					break;
				}
				existEntr = (MobileListEntry *)existEntr->node.mln_Succ;
			}
			
			//
			// we have 2 lists
			// one will hold all entries which will be added to global lists
			// second will hold all entries which will be deleted on the end
			//
			
			// entry exist
			if( existEntr != NULL )
			{
				MobileListEntry *e = MobileListEntryNew( le );
				if( e != NULL )
				{
					e->node.mln_Succ = (MinNode *)freeEntries;
					freeEntries = e;
				}
			}
			else	// entry do not exist
			{
				MobileListEntry *e = MobileListEntryNew( le );
				if( e != NULL )
				{
					e->node.mln_Succ = (MinNode *)addEntries;
					addEntries = e;
				}
			}
			
			le = (UserMobileApp *)le->node.mln_Succ;
		}
		
		// release not used entries
		while( freeEntries != NULL )
		{
			MobileListEntry *rel = freeEntries;
			freeEntries = (MobileListEntry *)freeEntries->node.mln_Succ;
			
			UserMobileAppDelete( rel->mm_UMApp );
			FFree( rel );
		}
		
		FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
		
		// add entries to main lists
		while( addEntries != NULL )
		{
			MobileListEntry *add = addEntries;
			addEntries = (MobileListEntry *)addEntries->node.mln_Succ;
			
			add->node.mln_Succ = (MinNode *)root;
			root = add;
		}
		
		FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );

		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return root;
}


/**
 * Refresh token list in memory
 *
 * @param mmgr pointer to MobileManager
 */
void MobileManagerRefreshCache( MobileManager *mmgr )
{
	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;
	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{

		int entries;
		uma = lsqllib->Load( lsqllib, UserMobileAppDesc, NULL, &entries );
		
		if( uma != NULL )
		{
			FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) );
			
			UserMobileAppDeleteAll( mmgr->mm_UMApps );
			mmgr->mm_UMApps = uma;
			
			FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		}
		
		sb->LibrarySQLDrop( sb, lsqllib );
	}
}

/**
 * Add mobile app to main list
 *
 * @param mm pointer to MobileManager
 * @param app pointer to UserMobileApp which will be added to list
 * @return 0 when entry was added, 1 when entry is in list, otherwise error number
 */
int MobileManagerAddUMA( MobileManager *mm, UserMobileApp *app )
{
	if( app != NULL )
	{
		FRIEND_MUTEX_LOCK( &(mm->mm_Mutex) );
		
		UserMobileApp *lap = mm->mm_UMApps;
		while( lap != NULL )
		{
			if( app->uma_ID == lap->uma_ID )
			{
				break;
			}
			lap = (UserMobileApp *)lap->node.mln_Succ;
		}

		// add entry only when its not on the list
		if( lap == NULL )
		{
			app->node.mln_Succ = (MinNode *)mm->mm_UMApps;
			mm->mm_UMApps = app;
			
			FRIEND_MUTEX_UNLOCK( &(mm->mm_Mutex) );
			return 0;
		}
		
		FRIEND_MUTEX_UNLOCK( &(mm->mm_Mutex) );
	}
	else
	{
		return -1;
	}
	return 1;
}
