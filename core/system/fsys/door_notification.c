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
 *  File/Directory/Door DoorNotification functionalities
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 14/10/2015
 */

#include "door_notification.h"
#include <system/systembase.h>
#include <system/user/user_sessionmanager.h>

#define LOCK_TIMEOUT 100000

/**
 * Create new DoorNotification
 *
 * @return poitner to new DoorNotification structure
 */

DoorNotification *DoorNotificationNew( )
{
	DoorNotification *lck = NULL;
	if( ( lck = FCalloc( 1, sizeof(DoorNotification) ) ) != NULL )
	{
		
	}
	else
	{
		FERROR("Cannot allocate memory for DoorNotification\n");
	}
	return lck;
}

/**
 * Free DoorNotification from memory
 *
 * @param lck pointer to FileLock
 */

void DoorNotificationDelete( DoorNotification *lck )
{
	if( lck != NULL )
	{
		if( lck->dn_Path != NULL )
		{
			FFree( lck->dn_Path );
		}
		FFree( lck );
	}
}

/**
 * Free all locks from memory
 *
 * @param lck pointer to root of FileLock structure
 */

void DoorNotificationDeleteAll( DoorNotification *lck )
{
	DoorNotification *loc = lck;
	DoorNotification *locd = lck;
	while( loc != NULL )
	{
		locd = loc;
		loc = (DoorNotification *)loc->node.mln_Succ;
		
		DoorNotificationDelete( locd );
	}
}

/**
 * Lock path in DB
 *
 * @param sqllib pointer to sql.library
 * @param device pointer to device (root file)
 * @param path path on which lock is set (fullpath)
 * @param type type of lock, check file_lock.h for more details
 * @return Lock id or 0 when error appear
 */

FULONG DoorNotificationStartDB( SQLLibrary *sqllib, File *device, UserSession *ses, char *path, int type )
{
	DoorNotification lck;
	int pathsize = strlen( path );
	
	lck.dn_ID = 0;
	lck.dn_LockTime = 1;// time();
	lck.dn_Path = path;
	lck.dn_Type = type;
	lck.dn_Path = StringDuplicate( path );
	
	// remove / from path
	if( pathsize > 0 )
	{
		if( lck.dn_Path[ pathsize-1 ] == '/' )
		{
			lck.dn_Path[ pathsize-1 ] = 0;
		}
	}
	
	lck.dn_LockTime = time(NULL);
	lck.dn_OwnerID = ses->us_UserID;
	lck.dn_DeviceID = device->f_ID;
	
	char *buffer;
	int len = 512;
	if( lck.dn_Path != NULL )
	{
		len += strlen( lck.dn_Path );
	}
	buffer = FMalloc( len );
	snprintf( buffer, len, "SELECT ID FROM `FDoorNotification` WHERE OwnerID=%lu AND Path='%s' AND DeviceID=%lu", lck.dn_OwnerID, lck.dn_Path, lck.dn_DeviceID );
	
	
	if( sqllib->NumberOfRecordsCustomQuery( sqllib, buffer) < 1 )
	{
		if( sqllib->Save( sqllib, DoorNotificationDesc, &lck ) != 0 )
		{

		}
	}
	FFree( buffer );

	if( lck.dn_Path != NULL )
	{
		FFree( lck.dn_Path );
	}

	/*
	char *query = FCalloc( (pathsize*2)+2048, sizeof(char) );
	if( query != NULL )
	{
		sqllib->SNPrintF( query, (pathsize*2)+2048, "INSERT INTO `FDoorNotification` (`OwnerID`, `DeviceID`, `Path`, `Type`, `Time`) VALUES ( %lu, %lu, %s, %d, %lu)", ses->us_UserID, device->f_ID, path, type, time(NULL) );
		sqllib->SimpleQuery( sqllib, query );
		FFree( query );
	}
	//INSERT INTO `FriendMaster`.`FDoorNotification` (`ID`, `OwnerID`, `DeviceID`, `Path`, `Type`, `Time`) VALUES (NULL, '1', '2', 'data/drive', '3', '4');
	FULONG uid = mysql_insert_id( l->con.sql_Con );
	*/
	/*
	switch( type )	// write locks should also notify read users to read
	{
		case LOCK_READ:
		{
	
		}
		break;

		case LOCK_READ_EXCLUSIVE:
				{
					char tmp[ 1024 ];
					int entries = 0;
					FileLock *dblck = sqllib->Load( sqllib, LockDesc, tmp, &entries );
					FileLock *curlck;
					
					while( dblck )
					{
						curlck = dblck;
						dblck = (FileLock *)dblck->node.mln_Succ;
						
						LockFree( curlck );
					}
				
				}
				break;
				
			case LOCK_WRITE:
				{
					char tmp[ 1024 ];
					//int rec =sqllib->NumberOfRecords( sqllib, tmp );
				}
				break;
		}
	*/
	return lck.dn_ID;
}

/**
 * Lock path in DB
 *
 * @param sqllib pointer to sql.library
 * @param device pointer to device (root file)
 * @param path path on which lock is set (fullpath)
 * @param id of entry which will be updated in DB
 * @return 0 when success, otherwise error number
 */

int DoorNotificationUpdateDB( SQLLibrary *sqllib, File *device __attribute__((unused)), char *path, FULONG id )
{
	int querysize = 0;
	
	if( path != NULL  )
	{
		querysize = 512  + (2*strlen( path ));
	}
	else
	{
		FERROR("Path is null!\n");
		return 2;			// if access is not set then everything is allowed
	}
	
	char *tmpQuery;
	DoorNotification *rootLock = NULL;
	DoorNotification *lastLock = NULL;
	
	if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
	{
		sprintf( tmpQuery, "UPDATE `FDoorNotification` SET Path='%s' WHERE ID=%lu", path, id );

		int error = sqllib->QueryWithoutResults( sqllib, tmpQuery );
		
		FFree( tmpQuery );
		
		return error;
	}
	return 1;
}

/**
 * Remove lock from database
 *
 * @param sqllib pointer to sql.library
 * @param id of lock which will be removed from DB
 * @return 0 if everything went fine, otherwise error number
 */

int DoorNotificationRemoveDB( SQLLibrary *sqllib, FULONG id )
{
	char temp[ 1024 ];
	snprintf( temp, sizeof(temp), "DELETE from `FDoorNotification` where `ID`=%lu", id );
	
	return sqllib->QueryWithoutResults( sqllib, temp );
}

/**
 * Lock path in DB
 *
 * @param sqllib pointer to sql.library
 * @param device pointer to device (root file)
 * @param path path on which lock is set (fullpath)
 * @return Lock id or 0 when error appear
 */

DoorNotification *DoorNotificationGetNotificationsFromPath( SQLLibrary *sqllib, File *device, char *path )
{
	int querysize = 0;
	
	if( path != NULL  )
	{
		querysize = 512  + (2*strlen( path ));
	}
	else
	{
		FERROR("Path is null!\n");
		return NULL;			// if access is not set then everything is allowed
	}
	
	char *tmpQuery;
	DoorNotification *rootLock = NULL;
	DoorNotification *lastLock = NULL;
	
	if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
	{
		FBOOL rootPath = TRUE;
		
		unsigned int i;
		unsigned int lastSlashPosition = 0;
		for( i=0 ; i < strlen(path) ; i++ )
		{
			if( path[ i ] == '/' )
			{
				rootPath = FALSE;
				lastSlashPosition = i;
			}
		}

		// file is not in subfolder
		if( lastSlashPosition == 0 )
		{
			sqllib->SNPrintF( sqllib, tmpQuery, querysize, "SELECT Distinct ID,OwnerID,Type FROM `FDoorNotification` \
WHERE Path = '' AND DeviceID = %lu ", device->f_ID );
		}
		else
		{
			char *parentPath = StringDuplicate( path );
			if( parentPath != NULL )
			{
				parentPath[ lastSlashPosition ] = 0;
				
				sqllib->SNPrintF( sqllib, tmpQuery, querysize, "SELECT Distinct ID,OwnerID,Type FROM `FDoorNotification` \
WHERE (Path='%s' OR Path='%s' ) \
AND DeviceID = %lu", path, parentPath, device->f_ID );
				FFree( parentPath );
			}
		}

		void *res = sqllib->Query( sqllib, tmpQuery );
		
		if( res != NULL )
		{
			if( sqllib->NumberOfRows( sqllib, res ) > 0 )
			{
				char **row = NULL;
				// OwnerID , Type
				
				while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
				{
					char *next;
					// ownerid, type
					DoorNotification *local = DoorNotificationNew();
					if( local != NULL )
					{
						char *next;
						local->dn_ID = (FULONG)strtol( row[ 0 ], &next, 0);
						local->dn_OwnerID = (FULONG)strtol( row[ 1 ], &next, 0);
						local->dn_Type = (FULONG)strtol( row[ 2 ], &next, 0);
						
						if( rootLock == NULL )
						{
							rootLock = local;
							lastLock = rootLock;
						}
						else
						{
							lastLock->node.mln_Succ = (MinNode *)local;
							lastLock = local;
						}
					}
				}
			}
			// number of rows > 0
			// checking default access
			else
			{

			}
			
			sqllib->FreeResult( sqllib, res );
		}
		FFree( tmpQuery );
	}
	return rootLock;
}

/**
 * Send notification to users about changes in the path
 *
 * @param lsb pointer to SystemBase
 * @param ses pointer to UserSession
 * @param device pointer to device (root file)
 * @param path path on which lock is set (fullpath)
 * @return Lock id or 0 when error appear
 */

int DoorNotificationCommunicateChanges( void *lsb, UserSession *ses __attribute__((unused)), File *device, char *path )
{
	SystemBase *sb = (SystemBase *)lsb;

	if( device == NULL )
	{
		FERROR("File structure is equal to NULL!\n");
		return 1;
	}
	
	SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		char *pathNoDevice = path;
		unsigned int i;
		for( i=2; i < strlen( path ) ; i++ )
		{
			if( path[ i ] == ':' )
			{
				pathNoDevice = &(path[ i+1 ]);
				break;
			}
		}
		DEBUG("[DoorNotificationCommunicateChanges] Lock communicate changes: %s\n", pathNoDevice );
		
		DoorNotification *notification = DoorNotificationGetNotificationsFromPath( sqllib, device, pathNoDevice );
		
		sb->LibrarySQLDrop( sb, sqllib );
		
		while( notification != NULL )
		{
			DoorNotification *rem = notification;
			
			DEBUG("[DoorNotificationCommunicateChanges] send door notification to: %lu\n", notification->dn_OwnerID );
			
			USMSendDoorNotification( sb->sl_USM, notification, ses, device, path );
			
			notification = (DoorNotification *)notification->node.mln_Succ;
			
			DoorNotificationDelete( rem );
		}
	}
	DEBUG("[DoorNotificationCommunicateChanges] Lock communicate changes END\n");
	return 0;
}

/**
 * Remove old DoorNotifications from DB
 *
 * @param lsb pointer to SystemBase
 * @return 0 when success, otherwise error number
 */

int DoorNotificationRemoveEntries( void *lsb )
{
	SystemBase *sb = (SystemBase *)lsb;
	DEBUG("DoorNotificationRemoveEntries LSB %p\n", lsb );
	SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		DEBUG("[DoorNotificationRemoveEntries] start\n");
		char temp[ 1024 ];
		time_t acttime = time( NULL );
		
		// we remove old entries older then 24 hours
		snprintf( temp, sizeof(temp), "DELETE from `FDoorNotification` WHERE (%lu-Time)>86400", acttime );
		
		sqllib->QueryWithoutResults( sqllib, temp );
		
		sb->LibrarySQLDrop( sb, sqllib );
	}
	//pthread_exit( 0 );
	return 0;
}


/**
 * Remove old DoorNotifications from DB by userid
 *
 * @param lsb pointer to SystemBase
 * @param uid user id
 * @return 0 when success, otherwise error number
 */

int DoorNotificationRemoveEntriesByUser( void *lsb, FULONG uid )
{
	pthread_detach( pthread_self() );
	SystemBase *sb = (SystemBase *)lsb;
	SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
	if( sqllib != NULL )
	{
		DEBUG("[DoorNotificationRemoveEntriesByUser] start, userID %lu\n", uid );
		char temp[ 1024 ];
		
		// we remove old entries every 5 mins
		snprintf( temp, sizeof(temp), "DELETE from `FDoorNotification` WHERE OwnerID=%lu", uid );
		
		int error = sqllib->QueryWithoutResults( sqllib, temp );
		if( error != 0 )
		{
			DEBUG("[DoorNotificationRemoveEntriesByUser] Cannot call query\n");
		}
		
		sb->LibrarySQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Remove old DoorNotifications from DB by userid UNIMPLEMENTED
 *
 * @param lsb pointer to SystemBase
 * @param owner user object
 * @param sessions user sessions list
 * @param path path on which lock is set (fullpath)
 * @return 0 when success, otherwise error number
 */
int DoorNotificationCommunicateDiskUpdate( void *lsb __attribute__((unused)), User *owner __attribute__((unused)), UserSession *sessions __attribute__((unused)), File *device __attribute__((unused)))
{
	return 0;
}
