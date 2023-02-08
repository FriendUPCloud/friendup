/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file device_handling.h
 *  Device handling body
 *
 *  @author PS (Pawel Stefanski)
 *  @date 2015
 */

#include "device_handling.h"
#include <core/functions.h>
#include <util/string.h>
#include <system/fsys/fsys.h>
#include <system/fsys/dosdriver.h>
#include <system/systembase.h>

//
// temporary structure which allow us to send notification
//

typedef struct NotifUser
{
	User		*nu_User;
	MinNode		node;
}NotifUser;

/**
 * Init DeviceManager
 *
 * @param sb pointer to SystemBase
 * @return new allocated DeviceManager structure when success, otherwise NULL
 */

DeviceManager *DeviceManagerNew( void *sb )
{
	DeviceManager *dm;
	if( ( dm = FCalloc( 1, sizeof(DeviceManager) ) ) != NULL )
	{
		dm->dm_SB = sb;
		pthread_mutex_init( &dm->dm_Mutex, NULL );
	}
	return dm;
}

/**
 * Delete DeviceManager
 *
 * @param dm pointer to DeviceManager
 */

void DeviceManagerDelete( DeviceManager *dm )
{
	if( dm != NULL )
	{
		pthread_mutex_destroy( &dm->dm_Mutex );
		FFree( dm );
	}
}

//
//
//

DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, char *name );

void DOSDriverDelete( DOSDriver *ddrive );

/**
 * Scan filesystem directory
 *
 * @param l pointer to SystemBase
 * @return success (0) or fail value (-1)
 */

int RescanHandlers( DeviceManager *dm )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		char tempString[ PATH_MAX ];
		DIR           *d;
		struct dirent *dir;
	
		//
		// clear handlers
		//
	
		FHandler * list = l->sl_Filesystems;
		while( list != NULL )
		{
			FHandler *fh = list;
			list = (FHandler *)list->node.mln_Succ;
			FHandlerDelete( fh );
		}
	
		if( getcwd( tempString, sizeof ( tempString ) ) == NULL )
		{
			FERROR("getcwd failed!");
			exit(5);
		}

		if( l->sl_FSysPath != NULL )
		{
			FFree( l->sl_FSysPath );
		}
		l->sl_FSysPath = FMalloc( 256 );
		if( l->sl_FSysPath == NULL )
		{
			FFree( l );
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return 1;
		}

		strcpy( l->sl_FSysPath, tempString );
		strcat( l->sl_FSysPath, "/fsys/");
	
		INFO( "[RescanHandlers] Trying to find filesystems in %s\n", l->sl_FSysPath );
	
		// all file systems will be avaiable in system.library folder/fsys/ subfolder

		d = opendir( l->sl_FSysPath );
	
		if( d != NULL )
		{
			while( ( dir = readdir( d ) ) != NULL )
			{
				if( strcmp( dir->d_name, "." ) == 0 || strcmp( dir->d_name, ".." ) == 0 )
				{
					continue;
				}
				
				sprintf( tempString, "%s%s", l->sl_FSysPath, dir->d_name );

				DEBUG("[RescanHandlers] %s fullFSYSpath %s\n", dir->d_name, tempString );

				FHandler *locsys = FHandlerCreate( tempString, dir->d_name );
				if( locsys != NULL )
				{
					INFO("[RescanHandlers] New FileHandler added %s\n", locsys->GetPrefix() );
					
					locsys->node.mln_Succ = (MinNode *)l->sl_Filesystems;
					l->sl_Filesystems = locsys;
				}
				else
				{
					DEBUG("[RescanHandlers] Cannot load fsys %s\n", dir->d_name );
				}
			
			}

			closedir( d );
		}
		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	}
	return 0;
}

/**
 * Scan DOSDriver directory
 *
 * @param dm pointer to DeviceManager
 * @return success (0) or fail value (-1)
 */

int RescanDOSDrivers( DeviceManager *dm )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	
	if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		char *fhome = getenv( "FRIEND_HOME");
		char ddrivedirectory[ 1024 ];
		DIR           *d;
		struct dirent *dir;
		
		ddrivedirectory[ 0 ] = 0;
	
		//
		// clear DOSDrivers
		//
		INFO("[RescanDOSDrivers] Scanning for DOSDrivers\n");
	
		DOSDriver * list = l->sl_DOSDrivers;
		while( list != NULL )
		{
			DOSDriver *fh = list;
			list = (DOSDriver *)list->node.mln_Succ;
			DOSDriverDelete( fh );
		}

		if( fhome != NULL )
		{
			strcpy( ddrivedirectory, fhome );
		}
		strcat( ddrivedirectory, "devices/DOSDrivers/");
	
		DEBUG( "[RescanDOSDrivers] Trying to find DOSDrivers in %s\n", ddrivedirectory );
	
		// all DOSDrivers will be avaiable in system.library folder/devices/DOSDrivers/ subfolder

		d = opendir( ddrivedirectory );
	
		if( d == NULL )
		{
			FERROR("[RescanDOSDrivers] Cannot open directory %s\n", ddrivedirectory );
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return 1;
		}
	
		while( ( dir = readdir( d ) ) != NULL )
		{
			if( strcmp( dir->d_name, "." ) == 0 || strcmp( dir->d_name, ".." ) == 0 )
			{
				continue;
			}
			
			char *tempString = FCalloc( 2048, sizeof(char) );
		
			snprintf( tempString, 2047, "%s%s", ddrivedirectory, dir->d_name );

			DEBUG("[RescanDOSDrivers] %s DOSDriver %s\n", dir->d_name, tempString );

			DOSDriver *locd = DOSDriverCreate( l, tempString, dir->d_name );
			if( locd != NULL )
			{
				INFO("[RescanDOSDrivers] New DOSDriver added %s\n", locd->dd_Name );
				locd->node.mln_Succ = (MinNode *)l->sl_DOSDrivers;
				l->sl_DOSDrivers = locd;
			}
			else
			{
				DEBUG("[RescanDOSDrivers] Cannot load DOSDriver %s\n", dir->d_name );
			}
			FFree( tempString );
		}
		closedir( d );
		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	}	
	return 0;
}

/**
 * Mount door for UserGroup in FC
 *
 * @param dm pointer to DeviceManager
 * @param usrgrp pointer to UserGroup to which drive will be added
 * @param notify set to TRUE if you want to notify all users
 * @param devname if provided then only this device will be mounted (if exist)
 * @return success (0) or fail value (not equal to 0)
 */
int MountFSWorkgroupDrive( DeviceManager *dm, UserGroup *usrgrp, FBOOL notify, char *devname )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	int error = 0;
	char *path = NULL;
	char *name = NULL;
	char *server = NULL;
	char *port = NULL;
	char *uname = NULL;
	char *passwd = NULL;
	char *config = NULL;
	char *type = NULL;
	char *execute = NULL;
	char *userName = NULL;
	FULONG id = 0, factivityID = 0, keysid = 0, userID = 0, userGroupID = 0;
	FLONG storedBytes = 0;
	FLONG storedBytesLeft = 0;
	FLONG readBytesLeft = 0;
	FULONG dbUserID = 0;
	File *retFile = NULL;
	FHandler *filesys = NULL;
	struct tm activityTime;
	memset( &activityTime, 0, sizeof( struct tm ) );
	
	DOSDriver *filedd = NULL;
	FBOOL mount = FALSE;
	
	Log( FLOG_DEBUG, "[MountFSWorkgroupDrive] Mount Group device\n");
	
	// New way of finding type of device
	SQLLibrary *sqllib = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		FBOOL visible = TRUE;
		char *temptext = FCalloc( sizeof(char), 1024 );
		
		// for UserGroup there is different SQL

		if( devname == NULL )
		{
			snprintf( temptext, 1024,
"SELECT \
f.`Type`,f.`Server`,f.`Path`,f.`Port`,f.`Username`,f.`Password`,f.`Config`,f.`ID`,f.`Execute`,f.`StoredBytes`,fsa.`ID`,fsa.`StoredBytesLeft`,fsa.`ReadedBytesLeft`,fsa.`ToDate`, f.`KeysID`, f.`GroupID`, f.`UserID`,f.`Name`,u.Name \
FROM `Filesystem` f left outer join `FilesystemActivity` fsa on f.ID = fsa.FilesystemID and CURDATE() <= fsa.ToDate inner join `FUser` u on f.UserID=u.ID \
WHERE \
f.GroupID='%ld'",
			usrgrp->ug_ID );
		}
		else	// specified device
		{
			snprintf( temptext, 1024,
"SELECT \
f.`Type`,f.`Server`,f.`Path`,f.`Port`,f.`Username`,f.`Password`,f.`Config`,f.`ID`,f.`Execute`,f.`StoredBytes`,fsa.`ID`,fsa.`StoredBytesLeft`,fsa.`ReadedBytesLeft`,fsa.`ToDate`, f.`KeysID`, f.`GroupID`, f.`UserID`,f.`Name`,u.Name \
FROM `Filesystem` f left outer join `FilesystemActivity` fsa on f.ID = fsa.FilesystemID and CURDATE() <= fsa.ToDate inner join `FUser` u on f.UserID=u.ID \
WHERE \
f.GroupID='%ld' AND f.Name='%s'",
			usrgrp->ug_ID, devname );
		}
		
		DEBUG("SQL : '%s'\n", temptext );
	
		void *res = sqllib->Query( sqllib, temptext );
		char **row;
		
		FFree( temptext );
	
		if( res != NULL )
		{
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
			// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

			if( row[ 0 ] != NULL ) type = StringDuplicate( row[ 0 ] );
			
			if( row[ 1 ] != NULL ) server = StringDuplicate( row[  1 ] );
			
			if( row[ 2 ] != NULL ) path = StringDuplicate( row[  2 ] );
			
			if( row[ 3 ] != NULL ) port = StringDuplicate( row[  3 ] );
			
			if( row[ 4 ] != NULL ) uname = StringDuplicate( row[  4 ] );
			
			if( row[ 5 ] != NULL ) passwd = StringDuplicate( row[  5 ] );
			
			if( row[ 6 ] != NULL )
			{
				char *visiblePtr = NULL;
				config = StringDuplicate( row[ 6 ] );
					
				if( config != NULL && ( visiblePtr = strstr( config, "\"Visible\"" ) ) != NULL )
				{
					// "Visible":"on"
					visiblePtr+= 9 + 2;	// name + quote + :
						
					if( strncmp( visiblePtr, "on", 2 ) == 0 )
					{
						visible = TRUE;
					}
					else
					{
						visible = FALSE;
					}
				}
			}
			
			if( row[ 7 ] != NULL ){ char *end; id = strtoul( (char *)row[ 7 ],  &end, 0 ); }
			
			if( row[ 8 ] != NULL ) execute = StringDuplicate( row[ 8 ] );
			
			if( row[ 9 ] != NULL ){ char *end; storedBytes = strtoul( (char *)row[ 9 ],  &end, 0 ); }
			
			if( row[ 10 ] != NULL ){ char *end; factivityID = strtoul( (char *)row[ 10 ],  &end, 0 );}
			
			if( row[ 11 ] != NULL ){ char *end; storedBytesLeft = strtoul( (char *)row[ 11 ],  &end, 0 ); }
			
			if( row[ 12 ] != NULL ){ char *end; readBytesLeft = strtoul( (char *)row[ 12 ],  &end, 0 ); }
			
			if( row[ 13 ] != NULL )
			{
				if( sscanf( (char *)row[ 13 ], "%d-%d-%d", &(activityTime.tm_year), &(activityTime.tm_mon), &(activityTime.tm_mday) ) != EOF )
				{
					activityTime.tm_hour = activityTime.tm_min = activityTime.tm_sec = 0;
				}
			}
			
			if( row[ 14 ] != NULL ){ char *end;keysid = strtoul( (char *)row[ 14 ],  &end, 0 ); }
			
			if( row[ 15 ] != NULL ){ char *end;userGroupID = strtoul( (char *)row[ 15 ],  &end, 0 ); }
			
			if( row[ 16 ] != NULL ){ char *end;dbUserID = strtoul( (char *)row[ 16 ],  &end, 0 ); }
			
			if( row[ 17 ] != NULL ) name = StringDuplicate( row[ 17 ] );
			
			if( row[ 18 ] != NULL ) userName = StringDuplicate( row[ 18 ] );

			DEBUG("[MountFSWorkgroupDrive] Mount drive: %s type: %s\n", name, type );
			
			// we have type of drive
			if( type != NULL )
			{
				//
				// checking if drive is available for group
				//
		
				if( usrgrp != NULL )
				{
					File *fentry = usrgrp->ug_MountedDevs;
					while( fentry != NULL )
					{
						if( id == fentry->f_ID || strcmp( name, fentry->f_Name ) == 0 )
						{
							DEBUG("[MountFSWorkgroupDrive] Device is already mounted2. Name: %s\n", fentry->f_Name );
							break;
						}
						fentry = (File *) fentry->node.mln_Succ;
					}
					
					// drive not found, we can mount it
					
					if( fentry == NULL )
					{
						//
						// Find installed filesystems by type
						//
		
						DOSDriver *ddrive = (DOSDriver *)l->sl_DOSDrivers;
						while( ddrive != NULL )
						{
							if( strcmp( type, ddrive->dd_Name ) == 0 )
							{
								filesys = ddrive->dd_Handler;
								filedd = ddrive;
								break;
							}
							ddrive = (DOSDriver *)ddrive->node.mln_Succ;
						}
						
						//
						// now we have to setup user and create temporary session
						//
						
						UserSession *session = USMCreateTemporarySession( l->sl_USM, NULL, dbUserID, 0 );
						
						if( session != NULL )
						{
							if( filesys != NULL )
							{
								char *mountError = NULL;
								struct TagItem tags[] = {
									{FSys_Mount_Path, (FULONG)path},
									{FSys_Mount_Server, (FULONG)server},
									{FSys_Mount_Port, (FULONG)port},
									{FSys_Mount_Type, (FULONG)type},
									{FSys_Mount_Name, (FULONG)name},
									//{FSys_Mount_Owner,(FULONG)us->us_User},
									{FSys_Mount_LoginUser,(FULONG)uname},
									{FSys_Mount_LoginPass,(FULONG)passwd},
									{FSys_Mount_SysBase,(FULONG)l},
									{FSys_Mount_Config,(FULONG)config},
									{FSys_Mount_UserName,(FULONG)userName},
									{FSys_Mount_UserGroup, (FULONG)usrgrp},
									{FSys_Mount_ID, (FULONG)id},
									{FSys_Mount_UserSession,(FULONG)session},
									{TAG_DONE, TAG_DONE}
								};
							
								//
								// Mount
								// 
	
								retFile = filesys->Mount( filesys, tags, NULL, &mountError );
							
								if( retFile != NULL )
								{
									retFile->f_UserID = dbUserID;
									FileFillSessionID( retFile, session ); 
									retFile->f_UserGroupID = userGroupID;
									retFile->f_ID = id;
									retFile->f_Mounted = mount;
									retFile->f_Config = StringDuplicate( config );
									retFile->f_Visible = visible;
									retFile->f_Execute = StringDuplicate( execute );
									retFile->f_FSysName = StringDuplicate( type );
									retFile->f_BytesStored = storedBytes;
									if( port != NULL )
									{
										retFile->f_DevPort = atoi( port );
									}
									retFile->f_DevServer = StringDuplicate( server );
				
									retFile->f_Activity.fsa_ReadBytesLeft = readBytesLeft;
									retFile->f_Activity.fsa_StoredBytesLeft = storedBytesLeft;
									retFile->f_Activity.fsa_FilesystemID = retFile->f_ID;
									retFile->f_Activity.fsa_ID = factivityID;
									memcpy( &(retFile->f_Activity.fsa_ToDate), &activityTime, sizeof( struct tm ) );
									activityTime.tm_year -= 1900;
									retFile->f_Activity.fsa_ToDateTimeT = mktime( &activityTime );
									retFile->f_KeysID = keysid;
				
									// if user group is passed then drive is shared drive
									if( usrgrp != NULL )
									{
										DEBUG("[MountFSWorkgroupDrive]\t\t\t\tDevice %s will be added to usergroup %s\n", name, usrgrp->ug_Name );
										if( usrgrp->ug_MountedDevs != NULL )
										{
											File *t = usrgrp->ug_MountedDevs;
											usrgrp->ug_MountedDevs = retFile;
											t->node.mln_Pred = ( void *)retFile;
											retFile->node.mln_Succ = ( void *)t;
										}
										else
										{
											usrgrp->ug_MountedDevs = retFile;
										}
									}
								}
							}	// filesys != NULL
							USMDestroyTemporarySession( l->sl_USM, NULL, session );
						}
						
					}	// drive not found
				}	// usergrp is not NULL
			}	// type != NULL
			
			// clean
			
			if( type != NULL ) FFree( type );
			if( port != NULL ) FFree( port );
			if( server != NULL ) FFree( server );
			if( path != NULL ) FFree( path );
			if( passwd != NULL ) FFree( passwd );
			if( uname != NULL ) FFree( uname );
			if( config != NULL ) FFree( config );
			if( execute != NULL ) FFree( execute );
			if( name != NULL ) FFree( name );
			if( userName != NULL ) FFree( userName );
			
		}	// going through all of group drives
		
		sqllib->FreeResult( sqllib, res );
		}

		l->LibrarySQLDrop( l, sqllib );
	}

	if( notify == TRUE )
	{
			/*
			if( usrgrp != NULL )
			{
				GroupUserLink * ugu = usrgrp->ug_UserList;
				while( ugu != NULL )
				{
					UserNotifyFSEvent2( ugu->ugau_User, "refresh", "Mountlist:" );
					
					ugu = (GroupUserLink *)ugu->node.mln_Succ;
				}
			}
			*/
	}

	DEBUG("[MountFSWorkgroupDrive]  END\n" );

	return error;
}

/**
 * Mount door in FC
 *
 * @param dm pointer to DeviceManager
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param mfile pointer to pointer where new created door will be stored
 * @param usr pointer to user which call this function
 * @param mountError pointer where error will be stored if any
 * @param us pointer to session which calls function
 * @param notify should other user must be notify about changes
 * @return success (0) or fail value (not equal to 0)
 */

int MountFS( DeviceManager *dm, struct TagItem *tl, File **mfile, User *usr, char **mountError, UserSession *us, FBOOL notify )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	int error = 0;
	char *path = NULL;
	char *name = NULL;
	char *server = NULL;
	char *port = NULL;
	char *uname = NULL;
	char *passwd = NULL;
	char *config = NULL;
	char *ctype = NULL, *type = NULL;
	char *execute = NULL;
	UserGroup *usrgrp = NULL;
	FULONG id = 0, factivityID = 0, keysid = 0, userID = 0, userGroupID = 0;
	FLONG storedBytes = 0;
	FLONG storedBytesLeft = 0;
	FLONG readBytesLeft = 0;
	FULONG dbUserID = 0;
	FHandler *filesys = NULL;
	File *retFile = NULL;
	struct tm activityTime;
	memset( &activityTime, 0, sizeof( struct tm ) );
	NotifUser *rootNotifUser = NULL;
	FBOOL isWorkgroupDrive = FALSE;			// if drive is workgroup drive, it is set to TRUE

	{
		DOSDriver *filedd = NULL;
		struct TagItem *ltl = tl;
		FBOOL visible = TRUE;
		FULONG dbid = 0;
		FBOOL mount = FALSE;
	
		//
		// Get FSys Type to mount
	
		while( ltl->ti_Tag != TAG_DONE )
		{
			switch( ltl->ti_Tag )
			{
				case FSys_Mount_Type:
					ctype = (char*)ltl->ti_Data;
					if( ctype != NULL )
					{
						type = StringDuplicate( ctype );
					}
					break;
				case FSys_Mount_Name:
					name = (char *)ltl->ti_Data;
					break;
				case FSys_Mount_ID:
					dbid = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Mount:
					mount = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_UserID:
					userID = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_UserGroup:
					usrgrp = (UserGroup *)ltl->ti_Data;
					break;
			}
			ltl++;
		}
		
		DEBUG("Mount, sessionid passed: '%s'\n", us->us_SessionID );
		
		if( usr != NULL )
		{
			// if user is not admin then userid will be taken from User object
			if( usr->u_IsAdmin == FALSE )
			{
				userID = usr->u_ID;
			}
			else
			{
				if( userID == 0 )
				{
					userID = usr->u_ID;
				}
			}
		}
	
		if( name == NULL )
		{
			if( usr != NULL )
			{
				FERROR("[ERROR]: %s - No name passed\n", usr->u_Name );
			}
			l->sl_Error = FSys_Error_NOName;
			//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			if( type != NULL ){ FFree( type );}
			return FSys_Error_NOName;
		}

		if( usr == NULL && usrgrp == NULL )
		{
			FERROR("[ERROR]: No user or usergroup passed, cannot put device on mountlist\n" );

			//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			if( type != NULL ){ FFree( type );}
			return FSys_Error_NOUser;
		}
		
		if( usr->u_Status == USER_STATUS_TO_BE_REMOVED )
		{
			return FSys_Error_UserNotLoggedIn;
		}
		
		// check if something is trying to mount drive on user
		
		while( TRUE )
		{
			if( usr->u_MountDriveInProgress == FALSE )
			{
				break;
			}
			usleep( 5000 );
			if( error ++ > 10 )
			{
				break;
			}// using variable which exist
		}
		usr->u_MountDriveInProgress = TRUE;
		error = 0;
		
		USER_LOCK( usr );
		
		Log( FLOG_DEBUG, "Mount device\n");
		
		// Setup the sentinel
		Sentinel *sent = l->GetSentinelUser( l );
		int usingSentinel = 0;
		
		// New way of finding type of device
		SQLLibrary *sqllib = l->LibrarySQLGet( l );
		if( sqllib != NULL )
		{
			//char temptext[ 612 ]; memset( temptext, 0, sizeof(temptext) );
			char *temptext = FCalloc( sizeof(char), 1024 );
			
			// for UserGroup there is different SQL
			if( usrgrp != NULL )
			{
				sqllib->SNPrintF( sqllib, temptext, 1024, //sizeof( temptext ), 
"SELECT \
`Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,f.`ID`,`Execute`,`StoredBytes`,fsa.`ID`,fsa.`StoredBytesLeft`,fsa.`ReadedBytesLeft`,fsa.`ToDate`, f.`KeysID`, f.`GroupID`, f.`UserID` \
FROM `Filesystem` f left outer join `FilesystemActivity` fsa on f.ID = fsa.FilesystemID and CURDATE() <= fsa.ToDate \
WHERE \
f.GroupID = '%ld' \
AND f.Name = '%s'",
				usrgrp->ug_ID , name
				);
			}
			else		// SQL for User
			{
				sqllib->SNPrintF( sqllib, temptext, 1024, //sizeof( temptext ), 
"SELECT \
`Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,f.`ID`,`Execute`,`StoredBytes`,fsa.`ID`,fsa.`StoredBytesLeft`,fsa.`ReadedBytesLeft`,fsa.`ToDate`, f.`KeysID`, f.`GroupID`, f.`UserID` \
FROM `Filesystem` f left outer join `FilesystemActivity` fsa on f.ID = fsa.FilesystemID and CURDATE() <= fsa.ToDate \
WHERE \
(\
f.UserID = '%ld' OR \
f.GroupID IN (\
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%ld' \
) \
) \
AND f.Name = '%s' and (f.Owner='0' OR f.Owner IS NULL)",
				userID , userID, name
				);
			}
			
			DEBUG("SQL : '%s'\n", temptext );
	
			void *res = sqllib->Query( sqllib, temptext );
			if( ( res == NULL || sqllib->NumberOfRows( sqllib, res ) <= 0 ) && usrgrp == NULL )
			{
				FERROR("[MountFS] %s - GetUserDevice fail: database results = NULL\n", usr->u_Name );
				if( sent != NULL && sent->s_User != NULL )
				{
					sqllib->FreeResult( sqllib, res );
					
					DEBUG( "[MountFS] Trying to mount device using sentinel!\n" );
					memset( temptext, '\0', 512 );
					
					if( usrgrp != NULL )
					{
						sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
"SELECT \
`Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,`ID`,`Execute`,`StoredBytes`,fsa.`ID`,fsa.`StoredBytesLeft`,fsa.`ReadedBytesLeft`,fsa.`ToDate`, f.`KeysID`, f.`GroupID`, f.`UserID` \
FROM `Filesystem` f left outer join `FilesystemActivity` fsa on f.ID = fsa.FilesystemID and CURDATE() <= fsa.ToDate \
WHERE \
( \
f.GroupID = '%ld' \
) \
AND f.Name = '%s'",
						usrgrp->ug_ID, name 
						);
					}
					else
					{
						sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
"SELECT \
`Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,`ID`,`Execute`,`StoredBytes`,fsa.`ID`,fsa.`StoredBytesLeft`,fsa.`ReadedBytesLeft`,fsa.`ToDate`, f.`KeysID`, f.`GroupID`, f.`UserID` \
FROM `Filesystem` f left outer join `FilesystemActivity` fsa on f.ID = fsa.FilesystemID and CURDATE() <= fsa.ToDate \
WHERE \
( \
f.UserID = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%ld' \
)\
) \
AND f.Name = '%s'",
						sent->s_User->u_ID, sent->s_User->u_ID, name 
						);
						
					}
					if( ( res = sqllib->Query( sqllib, temptext ) ) == NULL )
					{
						if( type != NULL ){ FFree( type );}
						l->sl_Error = FSys_Error_SelectFail;
						l->LibrarySQLDrop( l, sqllib );
						
						usr->u_MountDriveInProgress = FALSE;
						USER_UNLOCK( usr );
						
						return FSys_Error_SelectFail;
					}
					usingSentinel = 1;
				}
				else
				{
					sqllib->FreeResult( sqllib, res );
					if( type != NULL ){ FFree( type );}
					l->sl_Error = FSys_Error_SelectFail;
					l->LibrarySQLDrop( l, sqllib );
					
					usr->u_MountDriveInProgress = FALSE;
					USER_UNLOCK( usr );
				
					return FSys_Error_SelectFail;
				}
			}
			else
			{
				if( usr != NULL )
				{
					DEBUG( "[MountFS] %s - We actually did get a result!\n", usr->u_Name );
				}
			}
	
			char **row;
			int j = 0;
	
			if( usingSentinel == 1 )
			{
				DEBUG( "[MountFS] %s - We are using sentinel!\n", usr->u_Name );
			}
			
			FFree( temptext );
	
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

				if( type != NULL ){FFree( type ); type = NULL;}
				if( row[ 0 ] != NULL ) type = StringDuplicate( row[ 0 ] );
				
				if( server != NULL ){FFree( server );}
				if( row[ 1 ] != NULL ) server = StringDuplicate( row[  1 ] );
				
				if( path != NULL ){FFree( path );}
				if( row[ 2 ] != NULL ) path = StringDuplicate( row[  2 ] );
				
				if( port != NULL ){FFree( port );}
				if( row[ 3 ] != NULL ) port = StringDuplicate( row[  3 ] );
				
				if( uname != NULL ){FFree( uname );}
				if( row[ 4 ] != NULL ) uname = StringDuplicate( row[  4 ] );
				
				if( passwd != NULL ){FFree( passwd );}
				if( row[ 5 ] != NULL ) passwd = StringDuplicate( row[  5 ] );
				
				if( config != NULL ){FFree( config );}
				if( row[ 6 ] != NULL )
				{
					char *visiblePtr = NULL;
					config = StringDuplicate( row[ 6 ] );
					
					if( config != NULL && ( visiblePtr = strstr( config, "\"Visible\"" ) ) != NULL )
					{
						// "Visible":"on"
						visiblePtr+= 9 + 2;	// name + quote + :

						if( strncmp( visiblePtr, "on", 2 ) == 0 )
						{
							visible = TRUE;
						}
						else
						{
							visible = FALSE;
						}
					}
				}
				
				if( row[ 7 ] != NULL ){ char *end; id = strtoul( (char *)row[ 7 ],  &end, 0 ); }
				
				if( execute != NULL ){FFree( execute );}
				if( row[ 8 ] != NULL ) execute = StringDuplicate( row[ 8 ] );
				
				if( row[ 9 ] != NULL ){ char *end; storedBytes = strtoul( (char *)row[ 9 ],  &end, 0 ); }
				
				if( row[ 10 ] != NULL ){ char *end; factivityID = strtoul( (char *)row[ 10 ],  &end, 0 );}
				
				if( row[ 11 ] != NULL ){ char *end; DEBUG("STOREDBYTESLEFT DEBUG : %s\n", (char *)row[ 11 ] ); storedBytesLeft = strtoul( (char *)row[ 11 ],  &end, 0 ); }
				
				if( row[ 12 ] != NULL ){ char *end; readBytesLeft = strtoul( (char *)row[ 12 ],  &end, 0 ); }
				
				if( row[ 13 ] != NULL )
				{
					if( sscanf( (char *)row[ 13 ], "%d-%d-%d", &(activityTime.tm_year), &(activityTime.tm_mon), &(activityTime.tm_mday) ) != EOF )
					{
						activityTime.tm_hour = activityTime.tm_min = activityTime.tm_sec = 0;
					}
				}
				
				if( row[ 14 ] != NULL ){ char *end;keysid = strtoul( (char *)row[ 14 ],  &end, 0 ); }
				
				if( row[ 15 ] != NULL ){ char *end;userGroupID = strtoul( (char *)row[ 15 ],  &end, 0 ); }
				
				if( row[ 16 ] != NULL ){ char *end;dbUserID = strtoul( (char *)row[ 16 ],  &end, 0 ); }

				if( usr != NULL )
				{
					DEBUG("[MountFS] User name %s - found row type %s server %s path %s port %s\n", usr->u_Name, row[0], row[1], row[2], row[3] );
				}
			}
			
			sqllib->FreeResult( sqllib, res );

			l->LibrarySQLDrop( l, sqllib );
		}
		
		//
		// No drive ID from SQL? 
		//
		
		if( id <= 0 )
		{
			FERROR("[ERROR]: %s - Wrong ID of disk was found in Filesystem table!: %ld\n", name, id );
			error = l->sl_Error = FSys_Error_WrongID;
			goto merror;
		}
		
		//
		// old way when FC had control
		//
		
		if( type == NULL )
		{
			if( usr != NULL )
			{
				FERROR("[ERROR]: %s - No type passed\n", usr->u_Name );
			}
			l->sl_Error = FSys_Error_NOFSType;
			
			goto merror;
		}
		else
		{
			if( type && strcmp( type, "SQLWorkgroupDrive" ) == 0 )
			{
				isWorkgroupDrive = TRUE;
			}
		}
		
		//
		// do not allow to mount same drive
		//
		
		int sameDevError = 0;
		File *fentry = NULL;
		
		if( usr != NULL && isWorkgroupDrive == FALSE )
		{
			USER_UNLOCK( usr );
			USER_CHANGE_ON( usr );

			fentry = usr->u_MountedDevs;

			while( fentry != NULL )
			{
				DEBUG("Going through all user drives. Name %s UserID %lu\n", fentry->f_Name, usr->u_ID );
				if( id == fentry->f_ID )
				{
					*mfile = fentry;
					DEBUG("Device is already mounted. Name: %s ID %lu\n", fentry->f_Name, fentry->f_ID );
					sameDevError = 1;
					break;
				}
				fentry = (File *) fentry->node.mln_Succ;
			}
			
			USER_CHANGE_OFF( usr );
			USER_LOCK( usr );
		}
		else if( isWorkgroupDrive == TRUE )
		{
		
			//
			// checking if drive is available for group
			//
		
			if( usrgrp != NULL )
			{
				File *fentry = usrgrp->ug_MountedDevs;
				while( fentry != NULL )
				{
					if( id == fentry->f_ID || strcmp( name, fentry->f_Name ) == 0 )
					{
						*mfile = fentry;
						DEBUG("Device is already mounted2. Name: %s\n", fentry->f_Name );
						sameDevError = 1;
						break;
					}
					fentry = (File *) fentry->node.mln_Succ;
				}
			}
			else if( userGroupID > 0 )	// user group was not passed as a parameter, so we must get disk from group
			{
				usrgrp = UGMGetGroupByID( l->sl_UGM, userGroupID );
				if( usrgrp != NULL )
				{
					File *fentry = usrgrp->ug_MountedDevs;
					while( fentry != NULL )
					{
						if( id == fentry->f_ID || strcmp( name, fentry->f_Name ) == 0 )
						{
							*mfile = fentry;
							DEBUG("Device is already mounted2. Name: %s\n", fentry->f_Name );
							sameDevError = 1;
							break;
						}
						fentry = (File *) fentry->node.mln_Succ;
					}
				}
			}
			
			
		} // usr != NULL
		
		if( sameDevError == 1 )
		{
			error = l->sl_Error = FSys_Error_DeviceAlreadyMounted;
			
			goto merror;
		}
	
		//
		// Find installed filesystems by type
		//
		
		DOSDriver *ddrive = (DOSDriver *)l->sl_DOSDrivers;
		while( ddrive != NULL )
		{
			if( strcmp( type, ddrive->dd_Name ) == 0 )
			{
				filesys = ddrive->dd_Handler;
				filedd = ddrive;
				break;
			}
			ddrive = (DOSDriver *)ddrive->node.mln_Succ;
		}

		//
		// If FHandler not found return NULL
		//
	
		if( filesys == NULL )
		{
			FERROR("[ERROR]: %s - Cannot find FSys fdor device: %s\n", usr->u_Name, name );
			error = l->sl_Error = FSys_Error_NOFSAvaiable;
			goto merror;
		}
	
		char *pname = NULL;
		if( usr != NULL )
		{
			pname = usr->u_Name;
			INFO("[MountFS] %s - Localtype %s DDriverType %s\n", usr->u_Name, type, filedd->dd_Type );
		}
		
		struct TagItem tags[] = {
			{FSys_Mount_Path, (FULONG)path},
			{FSys_Mount_Server, (FULONG)server},
			{FSys_Mount_Port, (FULONG)port},
			{FSys_Mount_Type, (FULONG)type},
			{FSys_Mount_Name, (FULONG)name},
			{FSys_Mount_Owner,(FULONG)usr},
			{FSys_Mount_LoginUser,(FULONG)uname},
			{FSys_Mount_LoginPass,(FULONG)passwd},
			{FSys_Mount_SysBase,(FULONG)l},
			{FSys_Mount_Config,(FULONG)config},
			{FSys_Mount_UserName,(FULONG)pname},
			//{FSys_Mount_Execute,(FULONG)execute},
			{FSys_Mount_UserGroup, (FULONG)usrgrp},
			{FSys_Mount_ID, (FULONG)id},
			{FSys_Mount_UserSession,(FULONG)us},
			{TAG_DONE, TAG_DONE}
		};

		// Using sentinel?
		User *mountUser = usr;
		if( usingSentinel == 1 )
		{
			mountUser = sent->s_User;
		}
		
		DEBUG( "[MountFS] Filesystem to mount now.\n" );
		
		//
		// Mount
		// 
	
		retFile = filesys->Mount( filesys, tags, mountUser, mountError );
		
		DEBUG( "[MountFS] Filesystem mounted. Pointer to returned device: %p.\n", retFile );
		
		if( notify == TRUE )
		{
			/*
			if( usrgrp != NULL )
			{
				GroupUserLink * ugu = usrgrp->ug_UserList;
				while( ugu != NULL )
				{
					UserNotifyFSEvent2( ugu->ugau_User, "refresh", "Mountlist:" );
					
					ugu = (GroupUserLink *)ugu->node.mln_Succ;
				}
			}
			*/
		}
		
		if( usr != NULL && retFile != NULL )
		{
			retFile->f_UserID = dbUserID;
			FileFillSessionID( retFile, us );
			retFile->f_UserGroupID = userGroupID;
			retFile->f_ID = id;
			retFile->f_Mounted = mount;
			retFile->f_Config = StringDuplicate( config );
			retFile->f_Visible = visible;
			retFile->f_Execute = StringDuplicate( execute );
			retFile->f_FSysName = StringDuplicate( type );
			retFile->f_BytesStored = storedBytes;
			if( port != NULL )
			{
				retFile->f_DevPort = atoi( port );
			}
			retFile->f_DevServer = StringDuplicate( server );
				
			retFile->f_Activity.fsa_ReadBytesLeft = readBytesLeft;
			retFile->f_Activity.fsa_StoredBytesLeft = storedBytesLeft;
			retFile->f_Activity.fsa_FilesystemID = retFile->f_ID;
			retFile->f_Activity.fsa_ID = factivityID;
			memcpy( &(retFile->f_Activity.fsa_ToDate), &activityTime, sizeof( struct tm ) );
			activityTime.tm_year -= 1900;
			retFile->f_Activity.fsa_ToDateTimeT = mktime( &activityTime );
			retFile->f_KeysID = keysid;
			
			if( isWorkgroupDrive == TRUE )
			{
				FBOOL groupCreated = FALSE;
				// group do not exist in memory. We have to load it and add to global list
				if( usrgrp == NULL )
				{
					DEBUG("[Mount] new group will be created\n");
					usrgrp = UGMGetGroupByID( l->sl_UGM, userGroupID );
					if( usrgrp == NULL )
					{
						usrgrp = UGMGetGroupByIDDB( l->sl_UGM, userGroupID );
						if( usrgrp != NULL )
						{
							int err = UGMAddGroup( l->sl_UGM, usrgrp );
						
							DEBUG("[Mount] was group added to global list: %d (0 - ok)\n", err );
						
							groupCreated = TRUE;	// if group is created it is a signal to FC that all users should be connected to it
						}
					}
				}
				if( usrgrp != NULL )
				{
					// if user group is passed then drive is shared drive
					DEBUG("Device will be added to usergroup list\n");
					if( usrgrp->ug_MountedDevs != NULL )
					{
						File *t = usrgrp->ug_MountedDevs;
						usrgrp->ug_MountedDevs = retFile;
						t->node.mln_Pred = ( void *)retFile;
						retFile->node.mln_Succ = ( void *)t;
					
						retFile->f_WorkgroupDrive = TRUE;
					}
					else
					{
						usrgrp->ug_MountedDevs = retFile;
					}
					
					// lets notify users about changes which happened in his group
					if( groupCreated == TRUE )
					{
						UMAddExistingUsersToGroup( l->sl_UM, usrgrp );
					}
					UMNotifyAllUsersInGroup( l->sl_UM, userGroupID, 0 );
				}
			}
			else if( usr != NULL && isWorkgroupDrive == FALSE )
			{
				USER_UNLOCK( usr );
				USER_CHANGE_ON( usr );
				
				DEBUG("Device will be added to user list\n");
				// Without macro
				if( usr->u_MountedDevs != NULL )
				{
					File *t = usr->u_MountedDevs;
					usr->u_MountedDevs = retFile;
					t->node.mln_Pred = ( void *)retFile;
					retFile->node.mln_Succ = ( void *)t;
				}
				else
				{
					usr->u_MountedDevs = retFile;
				}
				
				USER_CHANGE_OFF( usr );
				USER_LOCK( usr );
			}
		
			if( mfile )
			{
				*mfile = retFile;
			}

			INFO( "[MountFS] %s - Device '%s' mounted successfully of type %s\n", usr->u_Name, name, type );
		} // usr != NULL and retFile != NULL
		else
		{
			char *uname = NULL;
			if( usr != NULL )
			{
				uname = usr->u_Name;
			}
			error = l->sl_Error = FSys_Error_CustomError;
			FERROR("[MountFS] %s - Device not mounted name %s type %s\n", uname, name, type );
			goto merror;
		}
		
		// Send notify to user and all his sessions
		if( notify == TRUE && usr != NULL )
		{
			UserNotifyFSEvent2( usr, "refresh", "Mountlist:" );
		}
		
		DEBUG("[MountFS] %s - Mount device END\n", usr->u_Name );
	}
	
	usr->u_MountDriveInProgress = FALSE;
	USER_UNLOCK( usr );
	
	if( type != NULL ) FFree( type );
	if( port != NULL ) FFree( port );
	if( server != NULL ) FFree( server );
	if( path != NULL ) FFree( path );
	if( passwd != NULL ) FFree( passwd );
	if( uname != NULL ) FFree( uname );
	if( config != NULL ) FFree( config );
	if( execute != NULL ) FFree( execute );
	
	return 0;
	
merror:

	if( filesys != NULL && retFile != NULL )
	{
		filesys->Release( filesys, retFile );
		FileDelete( retFile );
		*mfile = NULL;	// do not return anything
	}
	
	usr->u_MountDriveInProgress = FALSE;
	USER_UNLOCK( usr );

	if( type != NULL ) FFree( type );
	if( port != NULL ) FFree( port );
	if( server != NULL ) FFree( server );
	if( path != NULL ) FFree( path );
	if( passwd != NULL ) FFree( passwd );
	if( uname != NULL ) FFree( uname );
	if( config != NULL ) FFree( config );
	if( execute != NULL ) FFree( execute );

	return error;
}

/**
 * Mount door in FC
 * This function do not need User. It is used for example by file sharing.
 *
 * @param dm pointer to DeviceManager
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param mfile pointer to pointer where new created door will be stored
 * @param mountError pointer where error will be stored if any
 * @return success (0) or fail value (not equal to 0)
 */
int MountFSNoUser( DeviceManager *dm, struct TagItem *tl, File **mfile, char **mountError )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		FHandler *filesys = NULL;
		DOSDriver *filedd = NULL;
		File *retFile = NULL;
		struct TagItem *ltl = tl;
		char *type = NULL;
		char *name = NULL;
		UserSession *us = NULL;
		FULONG dbid = 0;
		FBOOL mount = FALSE;
		FULONG uid = 0;
	
		DEBUG("[MountFSNoUser] Mount device\n");
	
		//
		// Get FSys Type to mount
		//
	
		while( ltl->ti_Tag != TAG_DONE )
		{
			switch( ltl->ti_Tag )
			{
				case FSys_Mount_Type:
					type = (char*)ltl->ti_Data;
					break;
				case FSys_Mount_Name:
					name = (char *)ltl->ti_Data;
					break;
				case FSys_Mount_ID:
					dbid = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Mount:
					mount = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_UserID:
					uid = (FULONG)ltl->ti_Data;
					break;
			}
			ltl++;
		}

		if( type == NULL )
		{
			FERROR("[ERROR]: No type passed\n");
			l->sl_Error = FSys_Error_NOFSType;
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_NOFSType;
		}
	
		if( name == NULL )
		{
			FERROR("[ERROR]: No name passed\n");
			l->sl_Error = FSys_Error_NOName;
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_NOName;
		}

		INFO("[MountFSNoUser] Mount Checking avaiable filesystem(%s)\n", name );
	
		//
		// Find installed filesystems by type
		DOSDriver *ddrive = (DOSDriver *)l->sl_DOSDrivers;
		while( ddrive != NULL )
		{
			if( strcmp( type, ddrive->dd_Name ) == 0 )
			{
				filesys = ddrive->dd_Handler;
				filedd = ddrive;
				break;
			}
			ddrive = (DOSDriver *)ddrive->node.mln_Succ;
		}

		File *f = NULL;
		
		User *usr = NULL;
	
		// super user feauture
		
		if( usr != NULL && usr->u_MountedDevs != NULL )
		{
			INFO( "[MountFSNoUser] Starting to check mounted devs!\n" );
		
			LIST_FOR_EACH( usr->u_MountedDevs, f, File * )
			{
				if( f && f->f_Name && strcmp( name, f->f_Name ) == 0 )
				{
					INFO("[MountFSNoUser] Root device was on the list, mounted (%s)\n", name );
					f->f_Mounted = mount;
					// Renew the session
					FileFillSessionID( f, us );

					// Set structure to caller
					if( mfile ) *mfile = f;
					// Return no error
					FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
					return 0;
				}
			}
		}
	
		//
		// If FHandler not found return NULL
	
		if( filesys == NULL )
		{
			FERROR("[ERROR]: Cannot find FSys: %s\n", name );
			l->sl_Error = FSys_Error_NOFSAvaiable;
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_NOFSAvaiable;
		}
	
		INFO("[MountFSNoUser] Localtype %s DDriverType %s\n", type, filedd->dd_Type );
	
		retFile = filesys->Mount( filesys, tl, NULL, mountError );
	
		if( retFile != NULL )
		{
			retFile->f_ID = dbid;
			retFile->f_Mounted = mount;
		
			if( usr != NULL )
			{
				File *lfile = usr->u_MountedDevs;
				if( lfile == NULL )
				{
					usr->u_MountedDevs = retFile;
					DEBUG("[MountFSNoUser] Device added to start of the list %s\n", retFile->f_Name );
				}
				else
				{
					LIST_ADD_HEAD( usr->u_MountedDevs, retFile );
	
					DEBUG("[MountFSNoUser] Device added to the list\n");
				}
			}
		
			retFile->f_FSysName = StringDuplicate( ddrive->dd_Name );
		
			if( mfile )
			{
				*mfile = retFile;
			}
		
			INFO( "[MountFSNoUser] Device '%s' mounted successfully\n", name );
		}
		else
		{
			l->sl_Error = FSys_Error_NOFSAvaiable;
			FERROR("[MountFSNoUser] Device not mounted name %s type %s\n", name, type );
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_NOFSAvaiable;
		}

		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	}
	return 0;
}

/**
 * Unmount door in FC
 *
 * @param dm pointer to DeviceManager
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param usr pointer to User structure. If NULL will be provided user connected to UserSession will be used
 * @param loggedSession pointer to user session which is calling this function
 * @return success (0) or fail value (not equal to 0)
 */

int UnMountFS( DeviceManager *dm, struct TagItem *tl, User *usr, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		int result = 0;
	
		DEBUG("[UnMountFS] UnMount device\n");
	
		struct TagItem *ltl = tl;
		char *name = NULL;
		char *type = NULL;
		FULONG userID = 0;
		FQUAD userGroupID = 0;
		l->sl_Error = 0;

		//
		// Get FSys Type to mount
		//
	
		while( ltl->ti_Tag != TAG_DONE )
		{
			switch( ltl->ti_Tag )
			{
				case FSys_Mount_Name:
					name = ( char *)ltl->ti_Data;
					break;
				case FSys_Mount_Type:
					type = ( char *)ltl->ti_Data;
					break;
				case FSys_Mount_UserGroupID:
					userGroupID = (FQUAD)ltl->ti_Data;
					break;
			}
		
			ltl++;
		}
	
		if( name == NULL )
		{
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_NOName;
		}
	
		DEBUG("[UnMountFS] Unmount before checking users\n");
	
		//USMLogUsersAndDevices( l->sl_USM );

		if( loggedSession == NULL )
		{
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			FERROR("[UnMountFS] User session is null\n");
			return FSys_Error_UserNotLoggedIn;
		}
	
		if( usr == NULL )
		{
			usr = loggedSession->us_User;
		}
		
		int errors = 0;
		File *remdev = NULL;
		
		if( IS_SESSION_ADMIN( loggedSession ) == TRUE && userGroupID > 0 )
		{
			int error = 0;
			
			DEBUG("[UnMountFS] Getting group drive by group ID: %ld\n", userGroupID );
			
			UserGroup *ug = UGMGetGroupByID( l->sl_UGM, userGroupID );
			if( ug != NULL )
			{
				DEBUG("[UnMountFS] Group found: %ld . Lets remove drive: %s\n", userGroupID, name );
				remdev = UserGroupRemDeviceByName( ug, name, &error );
			}
		}
		else
		{
			remdev = UserRemDeviceByName( usr, name, &errors );
		}
		
		// release drive resources
		
		if( remdev != NULL )
		{
			if( remdev->f_WorkgroupDrive == TRUE )
			{
				userGroupID = remdev->f_UserGroupID;
			}
			
			//if( remdev->f_Operations < 1 )
			if( errors != FSys_Error_OpsInProgress )
			{
				Log( FLOG_INFO, "[UnMountFS] Device found, unmounting\n");

				//FHandler *fsys = (FHandler *)remdev->f_FSys;
			
				// If we're here, we need to test if this drive also needs to be removed
				// from other users!
				char *tmp = FCalloc( 1024, sizeof( char ) );
				snprintf( tmp, 1024, "\
SELECT ID,`Type`,UserID FROM `Filesystem` f \
WHERE \
f.Name = '%s' AND \
( \
f.UserID = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND \
ug.UserID = '%ld' \
)\
)\
", name, usr->u_ID, usr->u_ID );

				if( DeviceUnMount( dm, remdev, usr, loggedSession ) != 0 )
				{
					FERROR("[UnMountFS] ERROR: Cannot unmount device\n");
			
					FFree( tmp );
					FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
					return FSys_Error_CannotUnmountDevice;
				}
			
				// Notify user and his sessions
				UserNotifyFSEvent2( usr, "refresh", "Mountlist:" );

				FileDelete( remdev );
				remdev = NULL;

				int unmID = 0;
				char *unmType = NULL;
				
				SQLLibrary *sqllib  = l->LibrarySQLGet( l );
				if( sqllib != NULL )
				{
					void *res = sqllib->Query( sqllib, tmp );
					FFree( tmp );
			
					if( res != NULL )
					{
						char **row;
				
						while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
						{
							char *end;
							unmID = atoi( row[ 0 ] );
							unmType = StringDuplicate( row[ 1 ] );
							userID = strtoul( row[ 2 ], &end, 0);
						}
						sqllib->FreeResult( sqllib, res );
					}
					l->LibrarySQLDrop( l, sqllib );
				}
				
				DEBUG("UNMID: %d Type: %s user ID %lu usrparID %lu isAdmin %d\n", unmID,unmType,usr->u_ID, userID, loggedSession->us_User->u_IsAdmin );
				
				if( unmType ) FFree( unmType );
			}
			else
			{
				FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
				
				//remdev = UGMRemoveDrive( l->sl_UGM, name );

				return FSys_Error_OpsInProgress;
			}
			
			// success, now notify all people
			
			if( userGroupID >= 0 )
			{
				UMNotifyAllUsersInGroup( l->sl_UM, userGroupID, 0 );
			}
		}
		else
		{
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_DeviceNotFound;
		}
	
		DEBUG("[UnMountFS] UnMount device END\n");
		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
		
		//DEBUG("[UnMountFS] Call was done on group \n");
		//if( userGroupID > 0 )
		//{
		//	UMNotifyAllUsersInGroup( l->sl_UM, userGroupID, 0 );
		//}
		
		return result;
	}
	FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	return -1; // Need to make error case for this..
}

/**
 * Mount door in database
 *
 * @param dm pointer to DeviceManager
 * @param rootDev pointer to device (root file)
 * @param mount if device didnt fail during mounting value must be set to 1, otherwise 0
 * @return success (0) or fail value (not equal to 0)
 */

int DeviceMountDB( DeviceManager *dm, File *rootDev, FBOOL mount )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		SQLLibrary *sqllib  = l->LibrarySQLGet( l );
		
		if( sqllib == NULL )
		{
			FERROR("[DeviceMountDB] Cannot get mysql.library slot!\n");
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return -10;
		}
		Filesystem *filesys = NULL;
		User *owner = (User *)rootDev->f_User;
	
		char where[ 1024 ];
		int entries;
		
		sqllib->SNPrintF( sqllib, 
			where, sizeof(where), "\
(\
f.UserID = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%ld' \
)\
) \
AND LOWER(f.Name) = LOWER('%s') \
", 
			owner->u_ID, owner->u_ID, rootDev->f_Name 
		);
	
		filesys = sqllib->Load( sqllib, FilesystemDesc, where, &entries );
		if( filesys != NULL )
		{
			filesys->fs_Mounted = mount;
			int error = 0;
		
			if( ( error = sqllib->Save( sqllib, FilesystemDesc, filesys ) ) != 0 )
			{
				FERROR("[DeviceMountDB] Cannot update entry to database, code %d\n", error );
			}
			else
			{
				INFO("[DeviceMountDB] Filesystem %s updated in database\n", rootDev->f_Name );
			}
		
			FilesystemDelete( filesys );
		}
		else
		{
			if( ( filesys = FCalloc( 1, sizeof( Filesystem ) ) ) != NULL )
			{
				filesys->fs_Name = rootDev->f_Name;
				filesys->fs_DeviceID = rootDev->f_SharedFile->f_ID;
				filesys->fs_UserID = owner->u_ID;
				filesys->fs_Mounted = mount;
				filesys->fs_Path = rootDev->f_Path;
				filesys->fs_StoredBytes = rootDev->f_BytesStored;
			
				int error = 0;
			
				if( ( error = sqllib->Save( sqllib, FilesystemDesc, filesys ) ) != 0 )
				{
					FERROR("[DeviceMountDB] Cannot add entry to database, code %d\n", error );
				}
				else
				{
					INFO("[DeviceMountDB] Filesystem %s added to database\n", rootDev->f_Name );
				}
			
				FFree( filesys );
			}
		}
		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	
		char temptext[ 1024 ];
		sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), "SELECT * FROM `Filesystem` f \
WHERE \
f.Name = '%s' AND \
( \
f.UserID = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND \
ug.UserID = '%ld' \
)\
)\
		", rootDev->f_Name, owner->u_ID, owner->u_ID );

		void *res = sqllib->Query( sqllib, temptext );
		char **row;
		int numberEntries = 0;
	
		while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
		{
			numberEntries++;
		}
		sqllib->FreeResult( sqllib, res );

		l->LibrarySQLDrop( l, sqllib );
	}
	return 0;
}

/**
 * Get device by userid
 *
 * @param dm pointer to DeviceManager
 * @param sqllib pointer to sql.library
 * @param fsysid filesystem id
 * @param uid user ID to which device is assigned
 * @param us pointer to User Session
 * @param devname device name
 * @param mountError pointer to place where error string will be stored
 * @return when device exist and its avaiable then pointer to it is returned
 */

File *GetUserDeviceByFSysUserIDDevName( DeviceManager *dm, SQLLibrary *sqllib, FULONG fsysid, FULONG uid, UserSession *us, const char *devname, char **mountError )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	File *device = NULL;
	char temptext[ 512 ];
	FBOOL gotGlobalSQL = TRUE;
	
	if( sqllib == NULL )
	{
		gotGlobalSQL = FALSE;
		sqllib = l->LibrarySQLGet( l );
	}
	
	DEBUG("[GetUserDeviceByFSysUserIDDevName] start\n");
	// if fsysid is provided we should try to find device by it
	if( fsysid > 0 )
	{
		sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "\
SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
FROM `Filesystem` \
WHERE `ID`='%ld'", fsysid );
	}
	else
	{
		sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "\
SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
FROM `Filesystem` \
WHERE (`UserID`=%ld OR `GroupID` in( select GroupID from FUserToGroup where UserID=%ld ) ) AND `Name`='%s'", uid, uid, devname );
	}

	void *res = sqllib->Query( sqllib, temptext );
	if( res == NULL )
	{
		// remember to release sql if local one was used
		if( gotGlobalSQL == FALSE )
		{
			l->LibrarySQLDrop( l, sqllib );
		}
		FERROR("GetUserDevice fail: database results = NULL\n");
		return NULL;
	}
	
	char **row;

	// check if device is already on list
	INFO("[GetUserDeviceByUserID] Mount user device from Database\n");
	
	int j = 0;
	
	while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
	//if( ( row = sqllib->FetchRow( sqllib, res ) ) != NULL )
	{
		// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted
		//row = res->row[ j ];
		DEBUG("[GetUserDeviceByUserID] Database -> Name '%s' Type '%s', Server '%s', Port '%s', Path '%s', Mounted '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
		
		DEBUG("[GetUserDeviceByUserID] %s is %s\n", row[ 0 ], atoi( row[ 5 ] ) == 1 ? "mounted" : "not mounted" );
		int mount = atoi( row[ 5 ] );
		int id = atoi( row[ 7 ] );
		User *owner = NULL;

		// We need to get the sessionId if we can!
		
		User *tuser = UMGetUserByID( l->sl_UM, uid );
		
		// Done fetching sessionid =)
		
		char *path = StringDuplicate( row[ 4 ] );
		char *type = StringDuplicate( row[ 1 ] );
		char *name = StringDuplicate( row[ 0 ] );
		
		sqllib->FreeResult( sqllib, res );
	
		// if library came as parameter do not release it
		if( gotGlobalSQL == FALSE )
		{
			l->LibrarySQLDrop( l, sqllib );
		}
		
		if( tuser != NULL )
		{
			struct TagItem tags[] = {
				{FSys_Mount_Path, (FULONG)path},
				{FSys_Mount_Server, (FULONG)NULL},
				{FSys_Mount_Port, (FULONG)NULL},
				{FSys_Mount_Type, (FULONG)type},
				{FSys_Mount_Name, (FULONG)name},
				{FSys_Mount_UserSession, (FULONG)us },
				//{FSys_Mount_User_SessionID, (FULONG)tuser->u_ID },
				{FSys_Mount_Owner, (FULONG)owner },
				{FSys_Mount_ID, (FULONG)id },
				{FSys_Mount_Mount, (FULONG)mount },
				{FSys_Mount_SysBase,(FULONG)l},
				{TAG_DONE, TAG_DONE}
			};

			int err = MountFS( dm, (struct TagItem *)&tags, &device, tuser, mountError, us, TRUE );
			if( err != 0 )
			{
				if( l->sl_Error == FSys_Error_DeviceAlreadyMounted )
				{
					INFO("[GetUserDeviceByUserID] Device is already mounted\n");
				}
				else
				{
					FERROR("[GetUserDeviceByUserID] Cannot mount device, device '%s' will be unmounted. ERROR %d\n", name, err );
				}
			}
			else
			{
				//FERROR( "Cannot set device mounted state. Device = NULL (%s).\n", row[0] );
			}
		}
		else
		{
			FERROR("[GetUserDeviceByUserID] User do not exist, cannot mount drive\n");
		}
		
		if( path != NULL ) FFree( path );
		if( type != NULL ) FFree( type );
		if( name != NULL ) FFree( name );
	}	// going through all rows
	//else
	//{
		// remember to release sql if local one was used
		if( gotGlobalSQL == FALSE )
		{
			l->LibrarySQLDrop( l, sqllib );
		}
	//}
	
	DEBUG( "[GetUserDeviceByUserID] Successfully freed.\n" );
	
	return device;
}

/**
 * Send notification to users when filesystem event will happen
 *
 * @param dm pointer to DeviceManager
 * @param evt event type (char *)
 * @param path path to file
 */

void UserNotifyFSEvent( DeviceManager *dm, char *evt, char *path )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	//return; //test
	
	// Find the devname of path
	int pass = 0, i = 0;
	char *devName = NULL;
	int len = strlen( path );
	for( i = 0; i < len; i++ )
	{
		if( path[i] == ':' )
		{
			// Redefine len to mean length of devname
			// ready the devname variable
			len = i;
		}
	}
	if( len <= 0 ) return;
	
	// Copy the path into devName
	devName = FCalloc( 1, len );
	if( devName != NULL )
	{
		strncpy( devName, path, len );
		//sprintf( devName, "%.*s", len, path );
	
		// Find all users of said filesystem
		// TODO: Write this code..
	
		int userlength = 0;
		UserSession **userlist = NULL;
	
		// Produce message
		char *prototype = "{\"type\":\"notification\",\"data\":{\"type\":\"filechange\",\"path\":\"\"}}";
		char *message = FCalloc( 1, strlen( prototype ) + strlen( path ) );
		if( message != NULL )
		{
			int msglen = sprintf( message, "{\"type\":\"notification\",\"data\":{\"type\":\"filechange\",\"path\":\"%s\"}}", path );
	
			if( evt == NULL && userlength > 0 )
			{
				for( i = 0; i < userlength; i++ )
				{
					if( !userlist[i] )
					{
						break;
					}
					UserSession *u = userlist[i];
					UserSessionWebsocketWrite( u, (unsigned char *)message, msglen, LWS_WRITE_TEXT);
				}
			}
			FFree( message );
		}
		FFree( devName );
	}
}

/**
 * Refresh user disk (difference between DB and FC)
 *
 * @param dm pointer to DeviceManager
 * @param us pointer to user session which call this function
 * @param bs pointer to BufferString when results will be stored
 * @param mountError pointer to place where error will be stored
 * @return success (0) or fail value (not equal to 0)
 */
int RefreshUserDrives( DeviceManager *dm, UserSession *us, BufString *bs, char **mountError )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	FULONG *ids = FCalloc( 512, sizeof( FULONG ) );
	int idsEntries = 0;
	
	User *u = us->us_User;
	
	// ask about all drives in DB
	
	char *query = FCalloc( 1024, sizeof(char) );
	if( query != NULL )
	{
		SQLLibrary *sqllib  = l->LibrarySQLGet( l );
		if( sqllib != NULL )
		{
			sqllib->SNPrintF( sqllib, query, 1024, "\
SELECT `Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,`ID`,`Name`,`Execute`,`Mounted` FROM Filesystem f WHERE ( \
f.UserID = '%ld' OR \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%lu' \
)\
)",  u->u_ID, u->u_ID );
			
			DEBUG("[RefreshUserDrives] Query which will be used to find devices %s\n", query );
			
			char *visible = NULL;

			int pos = 0;
			
			if( bs != NULL )
			{
				BufStringAdd( bs, "ok<!--separate-->{\"Result\":[" );
			}
			
			void *res = sqllib->Query( sqllib, query );
			if( res != NULL  )
			{
				char **row;
				
				while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
				{
					char temp[ 512 ];
					FULONG id = 0;
					if( row[ 7 ] != NULL )
					{
						id = atol( row[ 7 ] );
					}
					
					DEBUG("[RefreshUserDrives] Mounting device: %s\n", row[ 8 ] );
					
					int mounted = 0;
					if( row[ 10 ] != NULL )
					{
						mounted = atoi( row[ 10 ] );
					}
					
					char *config = row[ 6 ];
					if( config != NULL )
					{
						visible = GetStringFromJSON( config, "\"Visible\"" );
					}
					
					File *locdev = u->u_MountedDevs;
					while( locdev != NULL )
					{
						if( id == locdev->f_ID )
						{
							// found entry on list, there is no need to mount it again
							break;
						}
						locdev = (File *) locdev->node.mln_Succ;
					}
					
					FBOOL removeDisk = FALSE;
					
					if( locdev == NULL )
					{
						if( mounted == 1 )
						{
							// type 0, server 1, path 2, port 3, username 4, password 5, config 6, id 7, name 8, execute 9
							struct TagItem tags[] = {
								{ FSys_Mount_Path,				(FULONG)row[ 2 ] },
								{ FSys_Mount_Server,			(FULONG)row[ 1 ] },
								{ FSys_Mount_Port,				(FULONG)row[ 3 ] },
								{ FSys_Mount_Type,				(FULONG)row[ 0 ] },
								{ FSys_Mount_Name,				(FULONG)row[ 8 ] },
								{ FSys_Mount_UserSession,		(FULONG)us }, // us->us_SessionID },
								{ FSys_Mount_Owner,				(FULONG)u },
								{ FSys_Mount_Mount,				(FULONG)TRUE },
								{ FSys_Mount_SysBase,			(FULONG)l },
								{ FSys_Mount_UserName,			(FULONG)u->u_Name },
								{ TAG_DONE, TAG_DONE }
							};
					
							File *mountedDev = NULL;
					
							int lmountError = MountFS( dm, (struct TagItem *)&tags, &mountedDev, u, mountError, us, TRUE );
					
							if( bs != NULL )
							{
								int size = 0;
								if( pos == 0 )
								{
									size = snprintf( temp, sizeof(temp), "{\"name\":\"%s\",\"error\":%d }", row[ 8 ], lmountError );
								}
								else
								{
									size = snprintf( temp, sizeof(temp), ",{\"name\":\"%s\",\"error\":%d }", row[ 8 ], lmountError );
								}
					
								DEBUG("[RefreshUserDrives] Device mounted %s\n", temp );
						
								BufStringAddSize( bs, temp, size );
							}
							
							ids[ idsEntries++ ] = id;
						
							pos++;
						}
						else		// mounted = 0
						{
							removeDisk = TRUE;
						}
					}
					else		// device found on list. There is no need to mount it
					{
						ids[ idsEntries++ ] = locdev->f_ID;
					}
					
					// disk should not be avaiable for the user
					
					if( removeDisk == TRUE )
					{
						File *tmpdev = NULL;
						File *olddev = NULL;
						
						if( FRIEND_MUTEX_LOCK(&u->u_Mutex) == 0 )
						{
							tmpdev = u->u_MountedDevs;
							olddev = tmpdev;
						
							while( tmpdev != NULL )
							{
								if( id == tmpdev->f_ID )
								{
									if( tmpdev == u->u_MountedDevs )
									{
										u->u_MountedDevs = (File *)tmpdev->node.mln_Succ;
									}
									else
									{
										olddev->node.mln_Succ = tmpdev->node.mln_Succ;
									}
									break;
								}
								olddev = tmpdev;
								tmpdev = (File *) tmpdev->node.mln_Succ;
							}
							FRIEND_MUTEX_UNLOCK(&u->u_Mutex);
						}
						
						if( tmpdev != NULL )
						{
							DeviceRelease( dm, tmpdev );
							FileDelete( tmpdev );
							tmpdev = NULL;
						}
					}
					
					if( visible != NULL )
					{
						FFree( visible );
						visible = NULL;
					}
				}
				
				sqllib->FreeResult( sqllib, res );
			}
			else
			{
				INFO("[RefreshUserDrives] No entries found in database\n");
			}
			
			if( bs != NULL )
			{
				DEBUG("[RefreshUserDrives] Response set to: %s\n", bs->bs_Buffer );
				BufStringAdd( bs, "]}" );
			}
			
			l->LibrarySQLDrop( l, sqllib );
		}
		
		DEBUG("[RefreshUserDrives] query released\n");
		FFree( query );
	}
	
	int i=0;
	FBOOL found = FALSE;
	
	File *tmpdev = u->u_MountedDevs;
	File *olddev = tmpdev;
	while( tmpdev != NULL )
	{
		File *next = (File *) tmpdev->node.mln_Succ;
		
		found = FALSE;
		
		for( i=0 ; i < idsEntries ; i++ )
		{
			if( ids[ i ] == tmpdev->f_ID )
			{
				found = TRUE;
			}
		}
		
		if( found == FALSE )
		{
			DEBUG("[RefreshUserDrives] Found device = FALSE\n");
			if( tmpdev == u->u_MountedDevs )
			{
				u->u_MountedDevs = (File *)tmpdev->node.mln_Succ;
			}
			else
			{
				olddev->node.mln_Succ = tmpdev->node.mln_Succ;
			}
			
			DeviceRelease( dm, tmpdev );

			FileDelete( tmpdev );
			tmpdev = NULL;
		}
		
		if( tmpdev != NULL )
		{
			olddev = tmpdev;
		}
		tmpdev = next;
	}
	
	FFree( ids );
		
	return 0;
}

/**
 * Release device resources
 *
 * @param dm pointer to DeviceManager
 * @param rootDev pointer to device root file
 * @return success (0) or fail value (not equal to 0)
 */
int DeviceRelease( DeviceManager *dm, File *rootDev )
{
	if( rootDev == NULL )
	{
		return 3;
	}
	SystemBase *l = (SystemBase *)dm->dm_SB;
	int errRet = 0;
	
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 256 ];
	
		snprintf( temptext, sizeof(temptext), "UPDATE `Filesystem` SET `StoredBytes` = '%ld' WHERE `ID` = '%lu'", rootDev->f_BytesStored, rootDev->f_ID );
		sqllib->QueryWithoutResults( sqllib, temptext );
		
		snprintf( temptext, sizeof(temptext), "UPDATE `FilesystemActivity` SET `StoredBytesLeft`='%ld',`ReadedBytesLeft`='%ld' WHERE `FilesystemID` = '%lu'", rootDev->f_Activity.fsa_StoredBytesLeft, rootDev->f_Activity.fsa_ReadBytesLeft, rootDev->f_ID );
	
		FHandler *fsys = (FHandler *)rootDev->f_FSys;

		if( fsys != NULL && fsys->Release != NULL )
		{
			errRet = fsys->Release( fsys, rootDev );
		}
		else
		{
			errRet = 1;
		}
		l->LibrarySQLDrop( l, sqllib );
	}
	else
	{
		return 2;
	}
	
	return errRet;
}

/**
 * UnMount device resources
 *
 * @param dm pointer to DeviceManager
 * @param rootDev pointer to device root file
 * @param usr pointer to User structure (device owner)
 * @param ses session which will be used to unmount device
 * @return success (0) or fail value (not equal to 0)
 */
int DeviceUnMount( DeviceManager *dm, File *rootDev, User *usr, UserSession *ses )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	int errRet = 0;
	
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		char *temptext = FMalloc( 512 );
		if( temptext != NULL )
		{
			snprintf( temptext, 512, "UPDATE `Filesystem` SET `StoredBytes`=%ld WHERE `ID`=%lu", rootDev->f_BytesStored, rootDev->f_ID );
			sqllib->QueryWithoutResults( sqllib, temptext );
		
			snprintf( temptext, 512, "UPDATE `FilesystemActivity` SET `StoredBytesLeft`=%ld,`ReadedBytesLeft`=%ld WHERE `ID`=%lu", rootDev->f_Activity.fsa_StoredBytesLeft, rootDev->f_Activity.fsa_ReadBytesLeft, rootDev->f_Activity.fsa_ID );
			sqllib->QueryWithoutResults( sqllib, temptext );
		
			Log( FLOG_INFO, "DeviceUnMount: %s\n", temptext );
			
			FFree( temptext );
		}
		
		FHandler *fsys = (FHandler *)rootDev->f_FSys;

		if( fsys != NULL && fsys->UnMount != NULL )
		{
			FileFillSessionID( rootDev, ses );

			errRet = fsys->UnMount( fsys, rootDev, usr );
		}
		else
		{
			errRet = 1;
		}
		l->LibrarySQLDrop( l, sqllib );
	}
	else
	{
		return 2;
	}
	
	return errRet;
}

/**
 * Get root device by name
 *
 * @param usr user to which device belong
 * @param ses UserSession. If passed sessionid from UserSession is assigned to device
 * @param devname device name
 * @return pointer to device (File *)
 */

File *GetRootDeviceByName( User *usr, UserSession *ses, char *devname )
{
	//
	// Check mounted devices for user
	
	if( usr == NULL )
	{
		FERROR("[GetRootDEviceByName] user == NULL\n");
		return NULL;
	}

	File *lDev = NULL;
	File *actDev = NULL;
	
	USER_LOCK( usr );
	
	lDev = usr->u_MountedDevs;
	
	if( usr->u_MountedDevs == NULL )
	{
		FERROR( "[GetRootDEviceByName]Looks like we have NO mounted devs..\n" );
	}
	
	while( lDev != NULL )
	{
		if( lDev->f_Name && strcmp( devname, lDev->f_Name ) == 0 ) //&& lDev->f_Mounted == TRUE )
		{
			if( lDev->f_SharedFile == NULL )
			//if( usr == lDev->f_User )		// if its our current user then we compare name
			{
				actDev = lDev;
			}
			else
			{
				actDev = lDev->f_SharedFile;
			}
			INFO("[GetRootDEviceByName]Found file name '%s' path '%s' (%s)\n", actDev->f_Name, actDev->f_Path, actDev->f_FSysName );
			break;
		}
		lDev = (File *)lDev->node.mln_Succ;
	}
	
	if( actDev == NULL )
	{
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		while( ugl != NULL )
		{
			if( ugl->ugl_Group != NULL )
			{
				lDev = ugl->ugl_Group->ug_MountedDevs;
				while( lDev != NULL )
				{
					if( lDev->f_Name && strcmp( devname, lDev->f_Name ) == 0 ) //&& lDev->f_Mounted == TRUE )
					{
						if( lDev->f_SharedFile == NULL )
						{
							actDev = lDev;
						}
						else
						{
							actDev = lDev->f_SharedFile;
						}
						break;
					}
					lDev = (File *)lDev->node.mln_Succ;
				}
				if( actDev != NULL )
				{
					break;
				}
			} // usr->u_Groups[ i ] != NULL
			ugl = (UserGroupLink *)ugl->node.mln_Succ;
		}
	}
	
	USER_UNLOCK( usr );
	
	if( actDev == NULL )
	{
		FERROR( "[GetRootDEviceByName]Cannot find mounted device by name: %s\n", devname );
	}
	else if( ses != NULL )
	{
		FileFillSessionID( actDev, ses );
	}
	
	return actDev;
}

/**
 * Load and mount all usergroup doors
 *
 * @param dm pointer to DeviceManager
 * @param sqllib pointer to sql.library
 * @param usrgrp pointer to usergroup to which doors belong
 * @param usr pointer to User. If user is not in FC list it will be added
 * @param us pointer to User Session
 * @param mountError pointer to error message
 * @return 0 if everything went fine, otherwise error number
 */

int UserGroupDeviceMount( DeviceManager *dm, SQLLibrary *sqllib, UserGroup *usrgrp, User *usr, UserSession *us, char **mountError )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	Log( FLOG_INFO,  "[UserGroupDeviceMount] Mount user device from Database\n");
	
	if( usrgrp == NULL )
	{
		DEBUG("[UserGroupDeviceMount] User parameter is empty\n");
		return -1;
	}
	
	if( usrgrp->ug_MountedDevs != NULL )
	{
		DEBUG("[UserGroupDeviceMount] Devices are already mounted\n");
		return 0;
	}
	
	char temptext[ 1024 ];

	sqllib->SNPrintF( sqllib, temptext, sizeof(temptext) ,"\
SELECT \
`Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
FROM `Filesystem` f \
WHERE \
( \
f.GroupID = '%ld' \
) \
AND f.Mounted = \'1\' AND f.Type <> 'SQLWorkgroupDrive' AND f.Owner<>'0'", 
usrgrp->ug_ID
	);
	DEBUG("[UserGroupDeviceMount] Finding drives in DB\n");
	void *res = sqllib->Query( sqllib, temptext );
	if( res == NULL )
	{
		Log( FLOG_ERROR, "[UserGroupDeviceMount] fail: database results = NULL\n");
		return 0;
	}
	DEBUG("[UserGroupDeviceMount] Finding drives in DB no error during select:\n\n");
	
	if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		char **row;
		while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
		{
			// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

			DEBUG("[UserGroupDeviceMount] \tFound database -> Name '%s' Type '%s', Server '%s', Port '%s', Path '%s', Mounted '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
		
			int mount = atoi( row[ 5 ] );
			int id = atol( row[ 7 ] );
			int userID = atol( row[ 6 ] );
			
			// if user is not passed then we must add him, becaouse he is drive owner
			if( usr == NULL )
			{
				usr = UMGetUserByID( l->sl_UM, userID );
				if( usr == NULL )
				{
					usr = UMGetUserByIDDB( l->sl_UM, userID );
				}
				
				if( usr != NULL )
				{
					UMAddUser( l->sl_UM, usr );
				}
			}
			
			//DEBUG("Usergroup mount: pass sessionid: '%s'\n", us->us_SessionID );
			
			struct TagItem tags[] = {
				{ FSys_Mount_Path,				(FULONG)row[ 4 ] },
				{ FSys_Mount_Server,			(FULONG)NULL },
				{ FSys_Mount_Port,				(FULONG)NULL },
				{ FSys_Mount_Type,				(FULONG)row[ 1 ] },
				{ FSys_Mount_Name,				(FULONG)row[ 0 ] },
				{ FSys_Mount_UserGroup,			(FULONG)usrgrp },
				{ FSys_Mount_Owner,				(FULONG)usr },
				{ FSys_Mount_ID,				(FULONG)id },
				{ FSys_Mount_Mount,				(FULONG)mount },
				{ FSys_Mount_SysBase,			(FULONG)SLIB },
				{ FSys_Mount_UserSession,		(FULONG)us },    // Assume visible
				{ TAG_DONE, TAG_DONE }
			};

			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );

			File *device = NULL;
			DEBUG("[UserGroupDeviceMount] Before mounting\n");
			int err = MountFS( dm, (struct TagItem *)&tags, &device, usr, mountError, us, TRUE );

			FRIEND_MUTEX_LOCK( &dm->dm_Mutex );

			if( err != 0 && err != FSys_Error_DeviceAlreadyMounted )
			{
				Log( FLOG_ERROR,"[UserGroupDeviceMount] \tCannot mount device, device '%s' will be unmounted. ERROR %d\n", row[ 0 ], err );
				if( mount == 1 )
				{

				}
			}
			else if( device )
			{
				device->f_Mounted = TRUE;
			}
			else
			{
				Log( FLOG_ERROR, "[UserGroupDeviceMount] \tCannot set device mounted state. Device = NULL (%s).\n", row[0] );
			}	
		}	// going through all rows
		DEBUG( "[UserGroupDeviceMount] Devices mounted for usergroup %s\n", usrgrp->ug_Name );

		sqllib->FreeResult( sqllib, res );

		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	}
	
	return 0;
}


