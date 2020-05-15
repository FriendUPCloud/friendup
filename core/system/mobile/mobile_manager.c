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
#include <util/session_id.h>

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
			
			UserMobileApp *lma = mm->mm_UMApps;
			while( lma != NULL )
			{
				DEBUG("Send message to device %s\n", lma->uma_Platform );
				lma = (UserMobileApp *)lma->node.mln_Succ;
			}
		}
		
		DEBUG("lsb->l_APNSConnection ptr %p\n", lsb->l_APNSConnection );
		if( lsb->l_APNSConnection != NULL )
		{
			UserMobileApp *lma = mm->mm_UMApps;
			while( lma != NULL )
			{
				char msg[ 2048 ];
			
				if( lma->uma_UserID > 0 )
				{
					lma->uma_User = UMGetUserByID( lsb->sl_UM, lma->uma_UserID );
				}
			
				lma->uma_WSClient = lsb->l_APNSConnection->wapns_Connection;
			
				// ASPN connection get only IOS notification
				if( strcmp( lma->uma_Platform, MobileAppType[ MOBILE_APP_TYPE_IOS ] ) == 0 )
				{
					int msgsize = snprintf( msg, sizeof(msg), "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"hellooooo\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\"}", "authid", lma->uma_AppToken );
			
					WebsocketClientSendMessage( lsb->l_APNSConnection->wapns_Connection, msg, msgsize );
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
		if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
		{
			UserMobileAppDeleteAll( mmgr->mm_UMApps );
		
			FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		}
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
			if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
			{
				uma->node.mln_Succ = (MinNode *)mmgr->mm_UMApps;
				mmgr->mm_UMApps = uma;
			
				FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
			}
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
			if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
			{
				uma->node.mln_Succ = (MinNode *)mmgr->mm_UMApps;
				mmgr->mm_UMApps = uma;
			
				FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
			}
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
	
	if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
	{
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
	}

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
		
		if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
		{
			// add entries to main lists
			while( addEntries != NULL )
			{
				MobileListEntry *add = addEntries;
				addEntries = (MobileListEntry *)addEntries->node.mln_Succ;
			
				add->node.mln_Succ = (MinNode *)root;
				root = add;
			}
		
			FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		}

		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return root;
}

/**
 * Get User Mobile Apps by using user name field
 *
 * @param mmgr pointer to MobileManager
 * @param sqllib pointer to SQLLibrary
 * @param userName name of user to which mobile apps belong
 * @param mobileType type of devices
 * @return pointer to new created list of UserMobileApp
 */
UserMobileApp *GetMobileAppByUserName( MobileManager *mmgr, SQLLibrary *sqllib, char *userName, char *mobileType )
{
	UserMobileApp *root = NULL;
	char query[ 256 ];
	
	snprintf( query, sizeof(query), "SELECT fma.* FROM `FUserMobileApp` fma inner join `FUser` u on fma.UserID=u.ID WHERE u.Name = '%s'", userName );
	// 1   3  apptoken1  appversion1   IOS   version1  215.148.12.6  1536761135   0
	// SELECT fma.* FROM `FUserMobileApp` fma inner join `FUser` u on fma.UserID=u.ID WHERE u.Name = 'pawel';
	
	void *res = sqllib->Query( sqllib, query );
	
	if( res != NULL )
	{
		char **row;
		int rownr = 0;
		while( ( row = sqllib->FetchRow( sqllib, res ) ) )
		{
			// create new structure
			UserMobileApp *nmapp = UserMobileAppNew();
			// fill structure with data
			if( row[ 0 ] != NULL ){		// ID
				char *end;
				nmapp->uma_ID = strtoul( row[0], &end, 0 );
			}
			if( row[ 1 ] != NULL ){		// UserID
				char *end;
				nmapp->uma_UserID = strtoul( row[1], &end, 0 );
			}
			if( row[ 2 ] != NULL ){		// AppToken
				nmapp->uma_AppToken = StringDuplicate( (char *)row[2] );
			}
			if( row[ 3 ] != NULL ){		// version
				nmapp->uma_AppToken = StringDuplicate( (char *)row[3] );
			}
			if( row[ 4 ] != NULL ){		// platform
				nmapp->uma_Platform = StringDuplicate( (char *)row[4] );
			}
			if( row[ 5 ] != NULL ){		// platform version
				nmapp->uma_PlatformVersion = StringDuplicate( (char *)row[5] );
			}
			if( row[ 6 ] != NULL ){		// Core
				nmapp->uma_Core = StringDuplicate( (char *)row[6] );
			}
			if( row[ 7 ] != NULL ){		// create TS
				char *end;
				nmapp->uma_CreateTS = strtoul( row[7], &end, 0 );
			}
			if( row[ 8 ] != NULL ){		// last start TS
				char *end;
				nmapp->uma_LastStartTS = strtoul( row[8], &end, 0 );
			}
			
			// add entry to list
			nmapp->node.mln_Succ = (MinNode *) root;
			root = nmapp;
		}
		sqllib->FreeResult( sqllib, res );
	}
	
	return root;
}

/**
 * Get User Mobile App ID by deviceID
 *
 * @param mmgr pointer to MobileManager
 * @param sqllib pointer to SQLLibrary
 * @param userID user ID
 * @param deviceid deviceid
 * @return ID of UMA or 0 when function fail
 */
FULONG MobileManagerGetUMAIDByDeviceIDAndUserName( MobileManager *mmgr, SQLLibrary *sqllib, FULONG userID, const char *deviceid )
{
	UserMobileApp *root = NULL;
	char query[ 256 ];
	FULONG tokID = 0;
	
	snprintf( query, sizeof(query), "SELECT ID FROM `FUserMobileApp` WHERE UserID=%lu AND DeviceID='%s'", userID, deviceid );

	void *res = sqllib->Query( sqllib, query );
	
	if( res != NULL )
	{
		char **row;

		while( ( row = sqllib->FetchRow( sqllib, res ) ) )
		{
			if( row[ 0 ] != NULL ){		// ID
				char *end;
				tokID = strtoul( row[0], &end, 0 );
			}
		}
		sqllib->FreeResult( sqllib, res );
	}
	
	return tokID;
}

/**
 * Get User Mobile App ID by token
 *
 * @param mmgr pointer to MobileManager
 * @param sqllib pointer to SQLLibrary
 * @param userID user ID
 * @param token application token
 * @return ID of UMA or 0 when function fail
 */
FULONG MobileManagerGetUMAIDByTokenAndUserName( MobileManager *mmgr, SQLLibrary *sqllib, FULONG userID, const char *token )
{
	UserMobileApp *root = NULL;
	char query[ 256 ];
	FULONG tokID = 0;
	
	snprintf( query, sizeof(query), "SELECT ID FROM `FUserMobileApp` WHERE UserID=%lu AND AppToken='%s'", userID, token );

	void *res = sqllib->Query( sqllib, query );
	
	if( res != NULL )
	{
		char **row;

		while( ( row = sqllib->FetchRow( sqllib, res ) ) )
		{
			if( row[ 0 ] != NULL ){		// ID
				char *end;
				tokID = strtoul( row[0], &end, 0 );
			}
		}
		sqllib->FreeResult( sqllib, res );
	}
	
	return tokID;
}

/**
 * Get User Mobile Connections from database by user name and platform
 *
 * @param mmgr pointer to MobileManager
 * @param user_id id of user to which mobile apps belong
 * @param userName name of user to which mobile apps belong
 * @param type type of mobile apps
 * @return pointer to new created list of MobileListEntry
 */
MobileListEntry *MobleManagerGetByUserNameDBPlatform( MobileManager *mmgr, FULONG user_id, char *userName, int type )
{
	if( type < 0 || type >= MOBILE_APP_TYPE_MAX )
	{
		return NULL;
	}
	char *mobileType = NULL;
	mobileType = MobileAppType[ type ];
	
	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;
	MobileListEntry *root = NULL;
	
	if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
	{
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
	}

	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{

		//char where[ 512 ];
		//snprintf( where, sizeof(where), "UserID='%lu' AND Platform='%s'", user_id, mobileType );
		uma = GetMobileAppByUserName( mmgr, lsqllib, userName, mobileType );

		//int entries;
		//uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		
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
		
		if( FRIEND_MUTEX_LOCK( &(mmgr->mm_Mutex) ) == 0 )
		{
		
			// add entries to main lists
			while( addEntries != NULL )
			{
				MobileListEntry *add = addEntries;
				addEntries = (MobileListEntry *)addEntries->node.mln_Succ;
			
				add->node.mln_Succ = (MinNode *)root;
				root = add;
			}
		
			FRIEND_MUTEX_UNLOCK( &(mmgr->mm_Mutex) );
		}
		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return root;
}

/**
 * Get User Mobile Connections from database by user id and platform
 *
 * @param mmgr pointer to MobileManager
 * @param user_id id of user to which mobile apps belong
 * @param type type of mobile apps
 * @return pointer to new created list of MobileListEntry
 */
MobileListEntry *MobleManagerGetByUserIDDBPlatform( MobileManager *mmgr, FULONG user_id, int type )
{
	if( type < 0 || type >= MOBILE_APP_TYPE_MAX )
	{
		return NULL;
	}
	char *mobileType = NULL;
	mobileType = MobileAppType[ type ];

	
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
		// 1   3  apptoken1  appversion1   IOS   version1  215.148.12.6  1536761135   0
		// SELECT fma.* FROM `FUserMobileApp` fma inner join `FUser` u on fma.UserID=u.ID WHERE u.Name = 'pawel';
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

/**
 * Get User Mobile AppTokens from database by user
 *
 * @param mmgr pointer to MobileManager
 * @param userID ID of user to which mobile apps belong
 * @return comma separated app tokens
 */
char *MobleManagerGetIOSAppTokensDBm( MobileManager *mmgr, FULONG userID )
{
	char *results = NULL;
	BufString *bs = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;

	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		char *query = FMalloc( 1048 );
		query[ 1024 ] = 0;
		lsqllib->SNPrintF( lsqllib, query, 1024, "select uma.AppToken from FUserMobileApp uma where uma.Platform='iOS' AND uma.Status=0 AND uma.UserID=%lu", userID );
		void *res = lsqllib->Query( lsqllib, query );
		if( res != NULL )
		{
			char **row;
			
			while( ( row = lsqllib->FetchRow( lsqllib, res ) ) )
			{
				if( row[0] != NULL )
				{
					if( bs == NULL )
					{
						bs = BufStringNew();
						BufStringAdd( bs, row[0] );
					}
					else
					{
						if( strlen( row[0] ) > 0 )
						{
							BufStringAddSize( bs, ",", 1 );
							BufStringAdd( bs, row[0] );
						}
					}
				} // row[0] != NULL
			}
			lsqllib->FreeResult( lsqllib, res );
		}
		
		FFree( query );
		sb->LibrarySQLDrop( sb, lsqllib );
	}
	
	if( bs != NULL )
	{
		results = bs->bs_Buffer;
		bs->bs_Buffer = NULL;
		BufStringDelete( bs );
	}
	
	return results;	
}

/**
 * Get User Mobile Connections from database by user ID and platform
 *
 * @param mmgr pointer to MobileManager
 * @param userID ID of user to which mobile apps belong
 * @param type type of mobile apps
 * @param status status of device
 * @param logged set TRUE if you want to get devices on which users are logged in
 * @return pointer to new created list of MobileListEntry
 */
UserMobileApp *MobleManagerGetMobileAppByUserPlatformDBm( MobileManager *mmgr, FULONG userID, int type, int status, FBOOL logged )
{
	if( type < 0 || type >= MOBILE_APP_TYPE_MAX )
	{
		return NULL;
	}
	char *mobileType = NULL;
	mobileType = MobileAppType[ type ];
	
	DEBUG("--------------MobleManagerGetMobileAppByUserPlatformDBm\n");

	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;

	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		// if we want entries where user is logged in we must also connect his mobiledevice with usersession
		if( logged == TRUE )
		{
// required
//			lns->ns_UserMobileAppID = lma->uma_ID;
//			lma->uma_AppToken 
			char *qery = FMalloc( 1048 );
			qery[ 1024 ] = 0;
			lsqllib->SNPrintF( lsqllib, qery, 1024, "select uma.ID,uma.AppToken from FUserMobileApp uma inner join FUserSession us on uma.UserID=us.UserID where uma.Platform='%s' AND uma.Status=0 AND uma.UserID=%lu AND us.DeviceIdentity LIKE CONCAT('%', uma.AppToken, '%') AND LENGTH( uma.AppToken ) > 0 GROUP BY uma.ID", mobileType, userID );
			void *res = lsqllib->Query( lsqllib, qery );
			if( res != NULL )
			{
				char **row;
				while( ( row = lsqllib->FetchRow( lsqllib, res ) ) )
				{
					DEBUG("ROW\n");
					UserMobileApp *local = FCalloc( 1, sizeof(UserMobileApp) );
					if( local != NULL )
					{
						if( row[ 0 ] != NULL )
						{
							char *end;
							local->uma_ID = strtoul( row[0], &end, 0 );
						}

						local->uma_AppToken = StringDuplicate( row[ 1 ] );
						DEBUG("ADDED: %s ID: %lu\n", local->uma_AppToken, local->uma_ID );

						// add entry to list
						local->node.mln_Succ = (MinNode *) uma;
						uma = local;
					}
				}
				lsqllib->FreeResult( lsqllib, res );
			}

			// select * from FUserMobileApp where UserID = XX AND Platform = Ios AND status = 0
			// FUserSession DeviceIdentity = touch_ios_app_5dca3266e489bfb672bba0aa86cc993a459f63dd65a4237514c75206444619f9
			//
			// select uma.* from FUserMobileApp uma inner join FUserSession us on uma.UserID=us.UserID where uma.Platform='iOS' AND uma.Status=0 AND uma.UserID=%lu uma.AppToken LIKE CONCAT('%', us.DeviceIdentity, '%')
			//
			//select uma.* from FUserMobileApp uma inner join FUserSession us on uma.UserID=us.UserID where uma.Platform='iOS' AND uma.Status=0 AND uma.UserID=%lu uma.AppToken LIKE CONCAT('%', us.DeviceIdentity, '%')
			//select uma.* from FUserMobileApp uma inner join FUserSession us on uma.UserID=us.UserID where Status=0 AND us.DeviceIdentity like uma.AppToken
			//
			// THIS one is ok
			//
			//select uma.* from FUserMobileApp uma inner join FUserSession us on uma.UserID=us.UserID where uma.Platform='iOS' AND uma.Status=0 AND uma.UserID=%lu AND uma.AppToken LIKE CONCAT('%', us.DeviceIdentity, '%')
		}
		else
		{
			char where[ 512 ];
			snprintf( where, sizeof(where), "UserID='%lu' AND Platform='%s' AND Status=%d", userID, mobileType, status );
			
			int entries;
			uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		}
		
		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return uma;
}

/**
 * Get User Mobile Connections from database by user ID and platform
 *
 * @param mmgr pointer to MobileManager
 * @param userID ID of user to which mobile apps belong
 * @param type type of mobile apps
 * @param status status of device
 * @param notifID Notification ID, if provided (>0) then NotificationSent will be stored which every message
 * @return pointer to tokens in buffered string
 */
BufString *MobleManagerAppTokensByUserPlatformDB( MobileManager *mmgr, FULONG userID, int type, int status, FULONG notifID )
{
	char *mobileType = NULL;
	if( type < 0 || type >= MOBILE_APP_TYPE_MAX )
	{
		Log( FLOG_ERROR, "Cannot get tokens where type < 0 || type >= MOBILE_APP_TYPE_MAX" );
		return NULL;
	}
	
	mobileType = MobileAppType[ type ];
	
	DEBUG("--------------MobleManagerAppTokensByUserPlatformDB\n");

	if( mmgr == NULL || mmgr->mm_SB == NULL )
	{
		Log( FLOG_ERROR, "mmgr or pointer to SB is NULL!\n");
		return NULL;
	}
	
	BufString *bs = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;

	SQLLibrary *lsqllib = sb->LibrarySQLGet( sb );
	if( lsqllib != NULL )
	{
		
#define LOCAL_TMP_LEN 512
		BufString *sqlInsertBs = NULL;
		char *qery = FMalloc( 1048 );
		char *temp = FMalloc( LOCAL_TMP_LEN );
		char *temp2= FMalloc( LOCAL_TMP_LEN );
		if( qery != NULL && temp != NULL && temp2 != NULL )
		{
			lsqllib->SNPrintF( lsqllib, qery, 1024, "select uma.ID,uma.AppToken from FUserMobileApp uma where uma.Platform='%s' AND uma.Status=0 AND uma.UserID=%lu AND LENGTH( uma.AppToken ) > 0 GROUP BY uma.ID", mobileType, userID );
			void *res = lsqllib->Query( lsqllib, qery );
			if( res != NULL )
			{
				if( notifID > 0 )
				{
					sqlInsertBs = BufStringNew();
				}

				int pos = 0;
				char **row;
				while( ( row = lsqllib->FetchRow( lsqllib, res ) ) )
				{
					int sizeAdd = 0;
					int temp2size = 0;
				
					if( pos == 0 )
					{
						sizeAdd = snprintf( temp, LOCAL_TMP_LEN, "\"%s\"", row[1] );
						if( notifID > 0 )
						{
							temp2size = snprintf( temp2, LOCAL_TMP_LEN, "INSERT INTO FNotificationSent (NotificationID,RequestID,UserMobileAppID,Target,Status) VALUES ( %lu, 0, %s, 1, 1)", notifID, row[0] );
						}
					}
					else
					{
						sizeAdd = snprintf( temp, LOCAL_TMP_LEN, ",\"%s\"", row[1] );
						if( notifID > 0 )
						{
							temp2size = snprintf( temp2, LOCAL_TMP_LEN, ",( %lu, 0, %s, 1, 1)", notifID, row[0] );
						}
					}
				
					// if notifID was provided then we create SQL which will store sent messages in FNotificationSent table
					if( notifID > 0 )
					{
						BufStringAddSize( sqlInsertBs, temp2, temp2size );
					}
				
					pos++;
					if( bs == NULL )
					{
						bs = BufStringNew();
					}
					BufStringAddSize( bs, temp, sizeAdd );
				}	// while
				lsqllib->FreeResult( lsqllib, res );
		
				if( notifID > 0 )
				{
					DEBUG("Insert NotificationSent into database\n");
					if( sqlInsertBs->bs_Size > 0 )
					{
						BufStringAddSize( sqlInsertBs, ";", 1 );
						lsqllib->QueryWithoutResults( lsqllib, sqlInsertBs->bs_Buffer );
					}
					BufStringDelete( sqlInsertBs );
				}
			}	// res != NULL
			FFree( qery );
		}
		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return bs;
}

/**
 * Get User Mobile Connections from database by user name, platform and ID is not in
 *
 * @param mmgr pointer to MobileManager
 * @param userID ID of user to which mobile apps belong
 * @param type type of mobile apps
 * @param status status of device
 * @param ids ids of usermobileapps which will not be taken from DB
 * @return pointer to new created list of MobileListEntry
 */
UserMobileApp *MobleManagerGetMobileAppByUserPlatformAndNotInDBm( MobileManager *mmgr, FULONG userID, int type, int status, const char *ids )
{
	if( type < 0 || type >= MOBILE_APP_TYPE_MAX )
	{
		return NULL;
	}
	char *mobileType = NULL;
	mobileType = MobileAppType[ type ];

	UserMobileApp *uma = NULL;
	SystemBase *sb = (SystemBase *)mmgr->mm_SB;

	SQLLibrary *lsqllib = sb->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		int size = 512 + strlen( ids );
		char *where = FMalloc( size+1 );
		if( ids == NULL || strlen( ids ) <= 0 )
		{
			snprintf( where, size, "UserID='%lu' AND Platform='%s' AND Status=%d", userID, mobileType, status );
		}
		else
		{
			snprintf( where, size, "UserID='%lu' AND Platform='%s' AND ID not in(%s) AND Status=%d", userID, mobileType, ids, status );
		}

		int entries;
		uma = lsqllib->Load( lsqllib, UserMobileAppDesc, where, &entries );
		FFree( where );

		sb->LibrarySQLDrop( sb, lsqllib );
	}
	return uma;
}

