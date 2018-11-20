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
	
	if( sqllib->Save( sqllib, DoorNotificationDesc, &lck ) != 0 )
	{

	}

	if( lck.dn_Path != NULL )
	{
		FFree( lck.dn_Path );
	}
	
	/*
	char *query = FCalloc( (pathsize*2)+2048, sizeof(char) );
	if( query != NULL )
	{
		sqllib->SNPrintF( query, (pathsize*2)+2048, "INSERT INTO `FDoorNotification` (`OwnerID`, `DeviceID`, `Path`, `Type`, `Time`) VALUES ( %lu, %lu, %s, %d, %lu)", ses->us_ID, device->f_ID, path, type, time(NULL) );
		sqllib->SimpleQuery( sqllib, query );
		FFree( query );
	}
	//INSERT INTO `FriendMaster`.`FDoorNotification` (`ID`, `OwnerID`, `DeviceID`, `Path`, `Type`, `Time`) VALUES (NULL, '1', '2', 'data/drive', '3', '4');
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
		DEBUG("[DoorNotificationCommunicateChanges] Lock communicate changes\n");
		
		DoorNotification *notification = DoorNotificationGetNotificationsFromPath( sqllib, device, path );
		
		sb->LibrarySQLDrop( sb, sqllib );
		
		while( notification != NULL )
		{
			DoorNotification *rem = notification;
			
			DEBUG("[DoorNotificationCommunicateChanges] send door notification to: %lud\n", notification->dn_OwnerID );
			
			USMSendDoorNotification( sb->sl_USM, notification, device, path );
			/*
			UserSession *uses = sb->sl_USM->usm_Sessions;
			while( uses != NULL )
			{
				//DEBUG("Compare owner id's  session %ld  lock session %ld  deviceident %s\n", uses->us_ID, notification->dn_OwnerID, uses->us_DeviceIdentity );
				if( uses->us_ID == notification->dn_OwnerID )
				{
					char *uname = NULL;
					
					if( uses->us_User != NULL )
					{
						uname = uses->us_User->u_Name;
					}
					
					char tmpmsg[ 2048 ];
					int len = snprintf( tmpmsg, sizeof(tmpmsg), "{ \"type\":\"msg\", \"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%lu\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", device->f_ID, device->f_Name, path, uname  );
					
					DEBUG("[DoorNotificationCommunicateChanges] Send message %s function pointer %p sbpointer %p to sessiondevid: %s\n", tmpmsg, sb->WebSocketSendMessage, sb, uses->us_DeviceIdentity );
					sb->WebSocketSendMessage( sb, uses, tmpmsg, len );
					
					RemoteUser *ruser = uses->us_User->u_RemoteUsers;
					while( ruser != NULL )
					{
						DEBUG("Remote user connected: %s\n", ruser->ru_Name );
						RemoteDrive *rdrive = ruser->ru_RemoteDrives;
						
						while( rdrive != NULL )
						{
							DEBUG("Remote drive connected: %s %lu\n", rdrive->rd_LocalName, rdrive->rd_DriveID );
							
							if( rdrive->rd_DriveID == device->f_ID )
							{
								char devid[ 128 ];
								
								int fnamei;
								int fpathi;
								int funamei;
								int fdriveid;
								
								char *fname =  createParameter( "devname", rdrive->rd_RemoteName, &fnamei );
								char *fpath =  createParameter( "path", path, &fpathi );
								char *funame =  createParameter( "usrname", ruser->ru_Name, &funamei );
								char *fdeviceid = createParameterFULONG( "deviceid", rdrive->rd_RemoteID, &fdriveid );
								
								MsgItem tags[] = {
									{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
									{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)sb->fcm->fcm_ID },
									{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
									{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
									{ ID_FNOT, (FULONG)0 , MSG_INTEGER_VALUE },
									{ ID_PARM, (FULONG)0, MSG_GROUP_START },
									{ ID_PRMT, (FULONG) fnamei, (FULONG)fname },
									{ ID_PRMT, (FULONG) fpathi, (FULONG)fpath },
									{ ID_PRMT, (FULONG) funamei, (FULONG)funame },
									{ ID_PRMT, (FULONG) fdriveid, (FULONG)fdeviceid },
									{ MSG_GROUP_END, 0,  0 },
									{ TAG_DONE, TAG_DONE, TAG_DONE }
								};
								
								DataForm *df = DataFormNew( tags );
								if( df != NULL )
								{
									DEBUG("Register device, send notification\n");
								
									BufString *result = SendMessageAndWait( ruser->ru_Connection, df );
									if( result != NULL )
									{
										DEBUG("Received response\n");
										BufStringDelete( result );
									}
									DataFormDelete( df );
								}
								
								FFree( fdeviceid );
								FFree( fname );
								FFree( fpath );
								FFree( funame );
								
								break;
							}
							
							rdrive = (RemoteDrive *)rdrive->node.mln_Succ;
						}
						
						ruser = (RemoteUser *)ruser->node.mln_Succ;
					}
				}
				uses = (UserSession *)uses->node.mln_Succ;
			}
			*/
			
			/*
			// This code is obsolete
			// Notifying other workgroup users
			if( device->f_FSysName != NULL && strcmp( device->f_FSysName, "SQLWorkgroupDrive" ) == 0 )
			{
				UserSession *uses = sb->sl_USM->usm_Sessions;
				while( uses != NULL )
				{
					if( uses->us_ID != locks->dn_OwnerID && uses->us_User != NULL )
					{
						File *search = uses->us_User->u_MountedDevs;
						while( search != NULL )
						{
							if( strcmp( search->f_Name, device->f_Name ) == 0 )
							{
								break;
							}
							search = (File *)search->node.mln_Succ;
						}
						
						// User doesn't have this disk, add it!
						if( search != NULL )
						{
							char tmpmsg[ 2048 ];
							int len = snprintf( tmpmsg, sizeof(tmpmsg), "{ \"type\":\"msg\", \"data\":{\"type\":\"filesystem-change\",\"data\":{\"deviceid\":\"%lu\",\"devname\":\"%s\",\"path\":\"%s\",\"owner\":\"%s\" }}}", search->f_ID, search->f_Name, path, uses->us_User->u_Name  );
					
							WebSocketSendMessage( sb, uses, tmpmsg, len );
						}
					}
					uses = (UserSession *)uses->node.mln_Succ;
				}
			}*/
			
			notification = (DoorNotification *)notification->node.mln_Succ;
			
			DoorNotificationDelete( rem );
		}
	}
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
