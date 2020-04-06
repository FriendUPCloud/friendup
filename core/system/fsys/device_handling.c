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
			FERROR("RescanDOSDrivers: Cannot open directory %s\n", ddrivedirectory );
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return 1;
		}
	
		while( ( dir = readdir( d ) ) != NULL )
		{
			if( strcmp( dir->d_name, "." ) == 0 || strcmp( dir->d_name, ".." ) == 0 )
			{
				continue;
			}
			
			char *tempString = FCalloc( 1024, sizeof(char) );
		
			snprintf( tempString, 1024, "%s%s", ddrivedirectory, dir->d_name );

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

//
// internal function to lock
//

inline static int MountLock( DeviceManager *dm, User *usr )
{
	if( usr != NULL )
	{
		return FRIEND_MUTEX_LOCK( &(usr->u_Mutex) );
	}

	return FRIEND_MUTEX_LOCK( &(dm->dm_Mutex) );
}

inline static int MountUnlock( DeviceManager *dm, User *usr )
{
	if( usr != NULL )
	{
		return FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
	}

	return FRIEND_MUTEX_UNLOCK( &(dm->dm_Mutex) );
}

/**
 * 
 * Mount group device
 * 
 * @param dm pointer to DeviceManager
 * @param usr pointer to User structure to which drive will be attached
 * @param groupID ID of group to which user belong
 * @return error number
 * 
 **/

int UserGroupMountWorkgroupDrives( DeviceManager *dm, User *usr, FULONG groupID )
{
	int error = 0;
	SystemBase *l = (SystemBase *)dm->dm_SB;
	// New way of finding type of device
	SQLLibrary *sqllib = l->LibrarySQLGet( l );
	
	DEBUG("[UserGroupMountWorkgroupDrives] mount--------------------------------------\n");
	
	if( sqllib != NULL )
	{
		char *path = NULL;
		char *name = NULL;
		char *config = NULL;
		char *ctype = NULL, *type = NULL;
		char *execute = NULL;
		FULONG id, storedBytes;
		int j = 0;
		char temptext[ 612 ]; memset( temptext, 0, sizeof(temptext) );
		
		// get drive details
		// drive which have type 'Workgroup' and is attached to the user

		/*
		 (system/fsys/device_handling.c:316) 140366686701312 SQL : 'SELECT `Type`,`Path`,`Config`,f.`ID`,`Execute`,`StoredBytes`,`Name` FROM `Filesystem` f WHERE (f.UserID = '4' OR f.GroupID IN (SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g WHERE g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND ug.UserID = '4' ug.GroupID=4 ) ) AND f.Name = 'H�E�L���' and (f.Owner='0' OR f.Owner IS NULL)'
  (mysqllibrary.c:1070) 140366686701312 Cannot run query: 'SELECT `Type`,`Path`,`Config`,f.`ID`,`Execute`,`StoredBytes`,`Name` FROM `Filesystem` f WHERE (f.UserID = '4' OR f.GroupID IN (SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g WHERE g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND ug.UserID = '4' ug.GroupID=4 ) ) AND f.Name = 'H�E�L���' and (f.Owner='0' OR f.Owner IS NULL)'
  (mysqllibrary.c:1072) 140366686701312 You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'ug.GroupID=4 ) ) AND f.Name = 'H?E?L???' and (f.Owner='0' OR f.Owner IS NULL)' at line 1
  (system/fsys/device_handling.c:319) 140366686701312 [MountSharedDrive] sql executed

		 */
		/*
				sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
"SELECT \
`Type`,`Path`,`Config`,f.`ID`,`Execute`,`StoredBytes`,`Name` \
FROM `Filesystem` f \
WHERE \
(\
f.UserID = '%ld' OR \
f.GroupID IN (\
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%lu' ug.GroupID=%lu \
) \
) \
AND f.Name = '%s' and (f.Owner='0' OR f.Owner IS NULL)",
			usr->u_ID , usr->u_ID, groupID
			);
		 */
	
/*
		sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
"SELECT Type,Path,Config,ID,Execute,StoredBytes,Name FROM Filesystem WHERE GroupID IN (SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g WHERE g.ID = ug.UserGroupID AND g.Type='Workgroup' AND ug.UserID = '%lu' AND ug.UserGroupID=%lu ) and (f.Owner='0' OR f.Owner IS NULL)",
			usr->u_ID, groupID
			);
*/
/*
		sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
"SELECT Type,Path,Config,ID,Execute,StoredBytes,Name FROM Filesystem WHERE GroupID IN (SELECT ug.UserGroupID FROM FUserToGroup ug inner join FUserGroup g on g.ID=ug.UserGroupID WHERE g.Type='Workgroup' AND ug.UserID=%lu AND ug.UserGroupID=%lu ) and (Owner=0 OR Owner IS NULL)", usr->u_ID, groupID
			);
	*/

		sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
"SELECT Type,Path,Config,ID,Execute,StoredBytes,Name FROM Filesystem WHERE Type='SQLWorkgroupDrive' AND GroupID=%lu and (Owner=0 OR Owner IS NULL)", groupID );

		DEBUG("SQL : '%s'\n", temptext );
	
		void *res = sqllib->Query( sqllib, temptext );
		DEBUG("[MountSharedDrive] sql executed, res : %p\n", res );
		
		// get fields from query
		if( res != NULL )
		{
			char **row;
			
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				DEBUG("Inside while\n");
				if( type != NULL ){FFree( type );}
				if( row[ 0 ] != NULL ) type = StringDuplicate( row[ 0 ] );

				if( path != NULL ){FFree( path );}
				if( row[ 1 ] != NULL ) path = StringDuplicate( row[  1 ] );
			
				if( config != NULL ){FFree( config );}
				if( row[ 2 ] != NULL ) config = StringDuplicate( row[ 2 ] );
			
				if( row[ 3 ] != NULL ){ char *end; id = strtoul( (char *)row[ 3 ],  &end, 0 ); }
			
				if( row[ 4 ] != NULL ) execute = StringDuplicate( row[ 4 ] );
			
				if( row[ 5 ] != NULL ){ char *end; storedBytes = strtoul( (char *)row[ 5 ],  &end, 0 ); }
				
				if( row[ 6 ] != NULL ) name = StringDuplicate( row[ 6 ] );
				
				if( usr != NULL )
				{
					DEBUG("[UserGroupMountWorkgroupDrives] User name %s - found row type %s server %s path %s port %s\n", usr->u_Name, row[0], row[1], row[2], row[3] );
				}
			
				//
				// do not allow to mount same drive
				//
		
				int sameDevError = 0;
				File *fentry = NULL;
		
				if( MountLock( dm, usr ) == 0 )
				{
					if( usr != NULL )
					{
						fentry = usr->u_MountedDevs;
					}
					while( fentry != NULL )
					{
						DEBUG("[UserGroupMountWorkgroupDrives] Going through all user drives. Name %s UserID %lu\n", fentry->f_Name, usr->u_ID );
						if( strcmp( name, fentry->f_Name ) == 0 ) //id == fentry->f_ID )
						{
							DEBUG("[UserGroupMountWorkgroupDrives] Device is already mounted. Name: %s ID %lu\n", fentry->f_Name, fentry->f_ID );
							sameDevError = 1;
							break;
						}
						fentry = (File *) fentry->node.mln_Succ;
					}
					MountUnlock( dm, usr );
				}
			
				DEBUG("[UserGroupMountWorkgroupDrives] mount shared, same dev error %d device name: %s\n", sameDevError, name );
		
				if( sameDevError == 0 )
				{
					struct TagItem tags[] = {
						{FSys_Mount_Path, (FULONG)path},
						{FSys_Mount_Type, (FULONG)type},
						{FSys_Mount_Name, (FULONG)name},
						{FSys_Mount_Owner,(FULONG)usr},
						{FSys_Mount_SysBase,(FULONG)l},
						{FSys_Mount_Config,(FULONG)config},
						{FSys_Mount_ID, (FULONG)id},
						{TAG_DONE, TAG_DONE}
					};
					
					// workgroup
					// command=dosaction&action=mount&type=SQLWorkgroupDrive&devname=AdminNotMounted&path=&module=files&sessionid=42b34dddd6f5757077b675f91cb86239c2aba954';
					// command=dosaction&action=mount&type=SQLWorkgroupDrive&devname=AdminNotMounted&path=&module=files&sessionid=42b34dddd6f5757077b675f91cb86239c2aba954'
					
					// command=dosaction&action=mount&type=SQLWorkgroupDrive&devname=AdminNotMounted&path=&module=files&sessionid=42b34dddd6f5757077b675f91cb86239c2aba954' - normal working call'
					// command=dosaction&action=mount&type=SQLWorkgroupDrive&devname=AdminNotMounted&path=&module=files&sessionid=42b34dddd6f5757077b675f91cb86239c2aba954
					
					// home
					// command=dosaction&action=mount&type=SQLDrive&devname=Home&path=&module=files&sessionid=42b34dddd6f5757077b675f91cb86239c2aba954';'
					
					/*
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
			{FSys_Mount_Visible,(FULONG)visible},
			{FSys_Mount_UserName,(FULONG)pname},
			//{FSys_Mount_Execute,(FULONG)execute},
			{FSys_Mount_UserGroup, (FULONG)usrgrp},
			{FSys_Mount_ID, (FULONG)id},
			{FSys_Mount_AdminRights,(FULONG)calledByAdmin},
			{TAG_DONE, TAG_DONE}
					 */
		
					DEBUG( "[MountFS] Filesystem to mount now.\n" );
		
					//
					// Mount
					// 
					FHandler *filesys = NULL;
					//
					// Find installed filesystems by type
					//
		
					DEBUG("[UserGroupMountWorkgroupDrives] find filesystem\n");
					DOSDriver *ddrive = (DOSDriver *)l->sl_DOSDrivers;
					while( ddrive != NULL )
					{
						if( strcmp( type, ddrive->dd_Name ) == 0 )
						{
							filesys = ddrive->dd_Handler;
							break;
						}
						ddrive = (DOSDriver *)ddrive->node.mln_Succ;
					}
		
					DEBUG("[UserGroupMountWorkgroupDrives] before mount call\n");
					char *mountError = NULL;
					File *retFile = filesys->Mount( filesys, tags, usr, &mountError );
					DEBUG("[UserGroupMountWorkgroupDrives] mount device : %p\n", retFile );
					if( retFile != NULL )
					{
						retFile->f_ID = id;
						retFile->f_UserGroupID = groupID;
						
						retFile->f_UserID = usr->u_ID;
						retFile->f_SessionIDPTR = usr->u_MainSessionID;
						retFile->f_Mounted = 1;
						retFile->f_Config = StringDuplicate( config );
						retFile->f_Visible = 1;
						retFile->f_Execute = StringDuplicate( execute );
						retFile->f_FSysName = StringDuplicate( type );
						retFile->f_BytesStored = storedBytes;

						retFile->f_Activity.fsa_FilesystemID = retFile->f_ID;
	
						UserAddDevice( usr, retFile );
					}
		
					if( mountError != NULL )
					{
						FFree( mountError );
					}
				} // sameDevError == 0
			}	// while
			DEBUG("[UserGroupMountWorkgroupDrives]After while\n");
			sqllib->FreeResult( sqllib, res );
		} // res != NULL
		else
		{
			DEBUG("[UserGroupMountWorkgroupDrives] Result = NULL\n");
		}
		
		DEBUG("[UserGroupMountWorkgroupDrives] Before dropping sql\n");
		l->LibrarySQLDrop( l, sqllib );
		
		if( path != NULL ){ FFree( path ); }
		if( name != NULL ){ FFree( name ); }
		if( config != NULL ){ FFree( config ); }
		if( ctype != NULL ){ FFree( ctype ); }
		if( type != NULL ){ FFree( type ); }
		if( execute != NULL ){ FFree( execute ); }
	}
	DEBUG("[UserGroupMountWorkgroupDrives] Return with error %d\n", error );
	
	DEBUG("[UserGroupMountWorkgroupDrives] mount END--------------------------------------\n");
	
	return error;
}

//
//
//

static inline int MountFSNoSubMount( DeviceManager *dm, struct TagItem *tl, File **mfile, User *usr, char **mountError, FBOOL calledByAdmin, FBOOL notify )
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
	FLONG readedBytesLeft = 0;
	FULONG dbUserID = 0;
	File *retFile = NULL;
	FHandler *filesys = NULL;
	struct tm activityTime;
	memset( &activityTime, 0, sizeof( struct tm ) );
	
	if( usr != NULL )
	{
		DEBUG("[MountFS] %s: Start - MountFS before lock for user..\n", usr->u_Name );
	}
	
	//if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		DOSDriver *filedd = NULL;
		struct TagItem *ltl = tl;
		FULONG visible = 0;
		char *sessionid = NULL;
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
				case FSys_Mount_User_SessionID:
					sessionid = (char *)ltl->ti_Data;
					break;
				case FSys_Mount_ID:
					dbid = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Mount:
					mount = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Visible:
					visible = (FULONG)ltl->ti_Data;
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
		
		DEBUG("Mount, sessionid passed: '%s'\n", sessionid );
		
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
		
		Log( FLOG_DEBUG, "Mount device\n");
		
		// Setup the sentinel
		Sentinel *sent = l->GetSentinelUser( l );
		int usingSentinel = 0;
		
		// New way of finding type of device
		SQLLibrary *sqllib = l->LibrarySQLGet( l );
		if( sqllib != NULL )
		{
			char temptext[ 612 ]; memset( temptext, 0, sizeof(temptext) );
			
			// for UserGroup there is different SQL
			if( usrgrp != NULL )
			{
				sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
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
				sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
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
						//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
						if( type != NULL ){ FFree( type );}
						l->sl_Error = FSys_Error_SelectFail;
						l->LibrarySQLDrop( l, sqllib );
						return FSys_Error_SelectFail;
					}
					usingSentinel = 1;
				}
				else
				{
					sqllib->FreeResult( sqllib, res );
					//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
					if( type != NULL ){ FFree( type );}
					l->sl_Error = FSys_Error_SelectFail;
					l->LibrarySQLDrop( l, sqllib );
				
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
	
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

				if( type != NULL ){FFree( type );}
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
				if( row[ 6 ] != NULL ) config = StringDuplicate( row[ 6 ] );
				
				if( row[ 7 ] != NULL ){ char *end; id = strtoul( (char *)row[ 7 ],  &end, 0 ); }
				
				if( row[ 8 ] != NULL ) execute = StringDuplicate( row[ 8 ] );
				
				if( row[ 9 ] != NULL ){ char *end; storedBytes = strtoul( (char *)row[ 9 ],  &end, 0 ); }
				
				if( row[ 10 ] != NULL ){ char *end; factivityID = strtoul( (char *)row[ 10 ],  &end, 0 );}
				
				if( row[ 11 ] != NULL ){ char *end; storedBytesLeft = strtoul( (char *)row[ 11 ],  &end, 0 ); }
				
				if( row[ 12 ] != NULL ){ char *end; readedBytesLeft = strtoul( (char *)row[ 12 ],  &end, 0 ); }
				
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
		// old way when FC had control
		//
		
		if( type == NULL )
		{
			if( usr != NULL )
			{
				FERROR("[ERROR]: %s - No type passed\n", usr->u_Name );
			}
			error = l->sl_Error = FSys_Error_NOFSType;
			
			goto merror;
		}
		
		//
		// do not allow to mount same drive
		//
		
		int sameDevError = 0;
		File *fentry = NULL;
		
		if( MountLock( dm, usr ) == 0 )
		{
			if( usr != NULL )
			{
				fentry = usr->u_MountedDevs;
			}
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
		
			//
			// checking if drive is available for group
			//
		
			if( sameDevError == 0 && usrgrp != NULL )
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
			MountUnlock( dm, usr );
		}
		
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

		File *f = NULL;
	
		if( MountLock( dm, usr ) == 0 )
		{
			// super user feauture	
			if( id > 0 && usr != NULL && usr->u_MountedDevs != NULL )
			{
				DEBUG("[MountFS] %s - Starting to check mounted devs!\n", usr->u_Name );
		
				LIST_FOR_EACH( usr->u_MountedDevs, f, File * )
				{
					//DEBUG( "%p is the pointer, %p\n", f, f->f_Name );
					// Only return success here if the found device is already mounted
					if( f->f_Name && strcmp( name, f->f_Name ) == 0 && f->f_Mounted )
					{
						INFO("[MountFS] %s - Root device was on the list, mounted (%s)\n", usr->u_Name, name );
						f->f_Mounted = mount;
						// Renew the session
						//if( f->f_SessionID ){ FFree( f->f_SessionID );}
						// Using sentinel if that's the case
						//if( usingSentinel ){ f->f_SessionID = StringDuplicate( sent->s_User->u_MainSessionID  );}
						// Just use the session id
						//else{ f->f_SessionID = StringDuplicate( sessionid );}
					
						if( usingSentinel ){ f->f_SessionIDPTR = sent->s_User->u_MainSessionID; }
						else{ f->f_SessionIDPTR = sessionid;}
					
						f->f_ID = id;
						if( f->f_FSysName != NULL ){ FFree( f->f_FSysName );}
						f->f_FSysName = StringDuplicate( type );
					
						// Set structure to caller
						if( mfile ){ *mfile = f; }

						error = l->sl_Error = FSys_Error_DeviceAlreadyMounted;
					
						//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
						MountUnlock( dm, usr );
						goto merror;
					}
				}
			}
			//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			MountUnlock( dm, usr );
		}
		//
		// If FHandler not found return NULL
	
		if( filesys == NULL )
		{
			FERROR("[ERROR]: %s - Cannot find FSys fdor device: %s\n", usr->u_Name, name );
			error = l->sl_Error = FSys_Error_NOFSAvaiable;
			goto merror;
		}
		
		//
		// No drive ID from SQL? 
		
		if( id <= 0 )
		{
			FERROR("[ERROR]: %s - Wrong ID of disk was found in Filesystem table!: %ld\n", name, id );
			error = l->sl_Error = FSys_Error_WrongID;
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
			{FSys_Mount_Visible,(FULONG)visible},
			{FSys_Mount_UserName,(FULONG)pname},
			//{FSys_Mount_Execute,(FULONG)execute},
			{FSys_Mount_UserGroup, (FULONG)usrgrp},
			{FSys_Mount_ID, (FULONG)id},
			{FSys_Mount_AdminRights,(FULONG)calledByAdmin},
			{TAG_DONE, TAG_DONE}
		};
		
		//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	
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
			if( usrgrp != NULL )
			{
				GroupUserLink * ugu = usrgrp->ug_UserList;
				while( ugu != NULL )
				{
					UserNotifyFSEvent2( dm, ugu->ugau_User, "refresh", "Mountlist:" );
					
					ugu = (GroupUserLink *)ugu->node.mln_Succ;
				}
			}
		}
		
		//if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
		if( MountLock( dm, usr ) == 0 )
		{
			if( retFile != NULL )
			{
				// Check again in lock if device is already mounted
				
				File *fentry = usr->u_MountedDevs;
				while( fentry != NULL )
				{
					if( id == fentry->f_ID || strcmp( name, fentry->f_Name ) == 0 )
					{
						break;
					}
					fentry = (File *) fentry->node.mln_Succ;
				}
				
				if( fentry != NULL )
				{
					error = l->sl_Error = FSys_Error_DeviceAlreadyMounted;
					FERROR("[MountSubFS] %s - Device is already mounted, name %s type %s\n", usr->u_Name, name, type );
					MountUnlock( dm, usr );
					goto merror;
				}
				
				retFile->f_UserID = dbUserID;
				retFile->f_SessionIDPTR = usr->u_MainSessionID;
				retFile->f_UserGroupID = userGroupID;
				retFile->f_ID = id;
				retFile->f_Mounted = mount;
				retFile->f_Config = StringDuplicate( config );
				retFile->f_Visible = visible ? 1 : 0;
				retFile->f_Execute = StringDuplicate( execute );
				retFile->f_FSysName = StringDuplicate( type );
				retFile->f_BytesStored = storedBytes;
				if( port != NULL )
				{
					retFile->f_DevPort = atoi( port );
				}
				retFile->f_DevServer = StringDuplicate( server );
				
				retFile->f_Activity.fsa_ReadedBytesLeft = readedBytesLeft;
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
					DEBUG("Device will be added to usergroup list\n");
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
				else if( usr != NULL )
				{
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
				}
		
				if( mfile )
				{
					*mfile = retFile;
				}
				
				INFO( "[MountFS] %s - Device '%s' mounted successfully of type %s\n", usr->u_Name, name, type );
			}
			else
			{
				error = l->sl_Error = FSys_Error_CustomError;
				FERROR("[MountFS] %s - Device not mounted name %s type %s\n", usr->u_Name, name, type );
				MountUnlock( dm, usr );
				goto merror;
			}
			MountUnlock( dm, usr );
		}
		
		//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
		// Send notify to user and all his sessions
		if( notify == TRUE )
		{
			UserNotifyFSEvent2( dm, usr, "refresh", "Mountlist:" );
		}
		//FRIEND_MUTEX_LOCK( &dm->dm_Mutex );
		
		DEBUG("[MountFS] %s - Mount device END\n", usr->u_Name );
	}
	
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
	// release device if error appear
	if( retFile != NULL && filesys != NULL )
	{
		filesys->Release( filesys, retFile );
		FileDelete( retFile );

 		*mfile = NULL;	// do not return anything
	}

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
 *
 * @param dm pointer to DeviceManager
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param mfile pointer to pointer where new created door will be stored
 * @param usr pointer to user which call this function
 * @param mountError pointer where error will be stored if any
 * @param notify should other user must be notify about changes
 * @return success (0) or fail value (not equal to 0)
 */

int MountFS( DeviceManager *dm, struct TagItem *tl, File **mfile, User *usr, char **mountError, FBOOL calledByAdmin, FBOOL notify )
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
	FLONG readedBytesLeft = 0;
	FULONG dbUserID = 0;
	FHandler *filesys = NULL;
	File *retFile = NULL;
	struct tm activityTime;
	memset( &activityTime, 0, sizeof( struct tm ) );
	NotifUser *rootNotifUser = NULL;
	
	if( usr != NULL )
	{
		DEBUG("[MountFS] %s: Start - MountFS before lock for user..\n", usr->u_Name );
	}
	
	//if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
	{
		DOSDriver *filedd = NULL;
		struct TagItem *ltl = tl;
		FULONG visible = 0;
		char *sessionid = NULL;
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
				case FSys_Mount_User_SessionID:
					sessionid = (char *)ltl->ti_Data;
					break;
				case FSys_Mount_ID:
					dbid = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Mount:
					mount = (FULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Visible:
					visible = (FULONG)ltl->ti_Data;
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
		
		DEBUG("Mount, sessionid passed: '%s'\n", sessionid );
		
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
		
		Log( FLOG_DEBUG, "Mount device\n");
		
		// Setup the sentinel
		Sentinel *sent = l->GetSentinelUser( l );
		int usingSentinel = 0;
		
		// New way of finding type of device
		SQLLibrary *sqllib = l->LibrarySQLGet( l );
		if( sqllib != NULL )
		{
			char temptext[ 612 ]; memset( temptext, 0, sizeof(temptext) );
			
			// for UserGroup there is different SQL
			if( usrgrp != NULL )
			{
				sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
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
				sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
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
						//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
						if( type != NULL ){ FFree( type );}
						l->sl_Error = FSys_Error_SelectFail;
						l->LibrarySQLDrop( l, sqllib );
						return FSys_Error_SelectFail;
					}
					usingSentinel = 1;
				}
				else
				{
					sqllib->FreeResult( sqllib, res );
					//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
					if( type != NULL ){ FFree( type );}
					l->sl_Error = FSys_Error_SelectFail;
					l->LibrarySQLDrop( l, sqllib );
				
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
	
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

				if( type != NULL ){FFree( type );}
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
				if( row[ 6 ] != NULL ) config = StringDuplicate( row[ 6 ] );
				
				if( row[ 7 ] != NULL ){ char *end; id = strtoul( (char *)row[ 7 ],  &end, 0 ); }
				
				if( row[ 8 ] != NULL ) execute = StringDuplicate( row[ 8 ] );
				
				if( row[ 9 ] != NULL ){ char *end; storedBytes = strtoul( (char *)row[ 9 ],  &end, 0 ); }
				
				if( row[ 10 ] != NULL ){ char *end; factivityID = strtoul( (char *)row[ 10 ],  &end, 0 );}
				
				if( row[ 11 ] != NULL ){ char *end; storedBytesLeft = strtoul( (char *)row[ 11 ],  &end, 0 ); }
				
				if( row[ 12 ] != NULL ){ char *end; readedBytesLeft = strtoul( (char *)row[ 12 ],  &end, 0 ); }
				
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
		
		//
		// do not allow to mount same drive
		//
		
		int sameDevError = 0;
		File *fentry = NULL;
		
		if( MountLock( dm, usr ) == 0 )
		{
			if( usr != NULL )
			{
				fentry = usr->u_MountedDevs;
			}
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
		
			//
			// checking if drive is available for group
			//
		
			if( sameDevError == 0 && usrgrp != NULL )
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
			MountUnlock( dm, usr );
		}
		
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

		File *f = NULL;
	
		if( MountLock( dm, usr ) == 0 )
		{
			// super user feauture	
			if( id > 0 && usr != NULL && usr->u_MountedDevs != NULL )
			{
				DEBUG("[MountFS] %s - Starting to check mounted devs!\n", usr->u_Name );
		
				LIST_FOR_EACH( usr->u_MountedDevs, f, File * )
				{
					//DEBUG( "%p is the pointer, %p\n", f, f->f_Name );
					// Only return success here if the found device is already mounted
					if( f->f_Name && strcmp( name, f->f_Name ) == 0 && f->f_Mounted )
					{
						INFO("[MountFS] %s - Root device was on the list, mounted (%s)\n", usr->u_Name, name );
						f->f_Mounted = mount;
						// Renew the session
						//if( f->f_SessionID ){ FFree( f->f_SessionID );}
						// Using sentinel if that's the case
						//if( usingSentinel ){ f->f_SessionID = StringDuplicate( sent->s_User->u_MainSessionID  );}
						// Just use the session id
						//else{ f->f_SessionID = StringDuplicate( sessionid );}
					
						if( usingSentinel ){ f->f_SessionIDPTR = sent->s_User->u_MainSessionID; }
						else{ f->f_SessionIDPTR = sessionid;}
					
						f->f_ID = id;
						if( f->f_FSysName != NULL ){ FFree( f->f_FSysName );}
						f->f_FSysName = StringDuplicate( type );
					
						// Set structure to caller
						if( mfile ){ *mfile = f; }

						error = l->sl_Error = FSys_Error_DeviceAlreadyMounted;
					
						//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
						MountUnlock( dm, usr );
						goto merror;
					}
				}
			}
			//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			MountUnlock( dm, usr );
		}
		//
		// If FHandler not found return NULL
	
		if( filesys == NULL )
		{
			FERROR("[ERROR]: %s - Cannot find FSys fdor device: %s\n", usr->u_Name, name );
			error = l->sl_Error = FSys_Error_NOFSAvaiable;
			goto merror;
		}
		
		//
		// No drive ID from SQL? 
		
		if( id <= 0 )
		{
			FERROR("[ERROR]: %s - Wrong ID of disk was found in Filesystem table!: %ld\n", name, id );
			error = l->sl_Error = FSys_Error_WrongID;
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
			{FSys_Mount_Visible,(FULONG)visible},
			{FSys_Mount_UserName,(FULONG)pname},
			//{FSys_Mount_Execute,(FULONG)execute},
			{FSys_Mount_UserGroup, (FULONG)usrgrp},
			{FSys_Mount_ID, (FULONG)id},
			{FSys_Mount_AdminRights,(FULONG)calledByAdmin},
			{TAG_DONE, TAG_DONE}
		};
		
		//FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	
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
			if( usrgrp != NULL )
			{
				GroupUserLink * ugu = usrgrp->ug_UserList;
				while( ugu != NULL )
				{
					UserNotifyFSEvent2( dm, ugu->ugau_User, "refresh", "Mountlist:" );
					
					ugu = (GroupUserLink *)ugu->node.mln_Succ;
				}
			}
		}
		
		//if( FRIEND_MUTEX_LOCK( &dm->dm_Mutex ) == 0 )
		if( MountLock( dm, usr ) == 0 )
		{
			if( retFile != NULL )
			{
				// Check again in lock if device is already mounted
				
				File *fentry = usr->u_MountedDevs;
				while( fentry != NULL )
				{
					if( id == fentry->f_ID || strcmp( name, fentry->f_Name ) == 0 )
					{
						break;
					}
					fentry = (File *) fentry->node.mln_Succ;
				}
				if( fentry != NULL )
				{
					error = l->sl_Error = FSys_Error_DeviceAlreadyMounted;
					FERROR("[MountFS] %s - Device is already mounted, name %s type %s\n", usr->u_Name, name, type );
					MountUnlock( dm, usr );
					goto merror;
				}
				
				retFile->f_UserID = dbUserID;
				retFile->f_SessionIDPTR = usr->u_MainSessionID;
				retFile->f_UserGroupID = userGroupID;
				retFile->f_ID = id;
				retFile->f_Mounted = mount;
				retFile->f_Config = StringDuplicate( config );
				retFile->f_Visible = visible ? 1 : 0;
				retFile->f_Execute = StringDuplicate( execute );
				retFile->f_FSysName = StringDuplicate( type );
				retFile->f_BytesStored = storedBytes;
				if( port != NULL )
				{
					retFile->f_DevPort = atoi( port );
				}
				retFile->f_DevServer = StringDuplicate( server );
				
				retFile->f_Activity.fsa_ReadedBytesLeft = readedBytesLeft;
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
					DEBUG("Device will be added to usergroup list\n");
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
				else if( usr != NULL )
				{
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
				}
		
				if( mfile )
				{
					*mfile = retFile;
				}
				
				INFO( "[MountFS] %s - Device '%s' mounted successfully of type %s\n", usr->u_Name, name, type );
				
				// If we're here, we need to test if this drive also needs to be added to
				// other users!

				if( type && strcmp( type, "SQLWorkgroupDrive" ) == 0 )
				{
					User *tmpUser = l->sl_UM->um_Users;
					while( tmpUser != NULL )
					{
						// Skip current user
						if( tmpUser->u_ID == usr->u_ID )
						{
							tmpUser = (User *)tmpUser->node.mln_Succ;
							continue;
						}
						
						// Test if this user already has this disk
						File *search = tmpUser->u_MountedDevs;
						while( search != NULL )
						{
							if( search->f_ID == id )
							{
								DEBUG( "[MountFS] -- Found user.\n" );
								search->f_Mounted = retFile->f_Mounted; // mount if it isn't
								break;
							}
							search = (File *)search->node.mln_Succ;
						}
						
						// User doesn't have this disk, add it!
						if( search == NULL )
						{
							// Try to mount the device with all privileges

							File *dstFile = NULL;
							if( MountFSNoSubMount( dm, tl, &dstFile, tmpUser, mountError, calledByAdmin, notify ) != 0 )
							{
								Log( FLOG_INFO, "[MountFS] -- Could not mount device for user %s. Drive was %s. Pointer to dstFile: %p\n", tmpUser->u_Name ? tmpUser->u_Name : "--nousername--", name ? name : "--noname--", dstFile );
								if( dstFile != NULL )
								{
									//filesys->Release( filesys, dstFile );
								}
							}
							
							// Tell user!
							if( notify == TRUE )
							{
								//UserNotifyFSEvent2( dm, tmpUser, "refresh", "Mountlist:" );
								NotifUser *nun = FCalloc( sizeof(NotifUser), 1 );
								if( nun != NULL )
								{
									nun->nu_User = tmpUser;
									nun->node.mln_Succ = (MinNode *)rootNotifUser;
									rootNotifUser = nun;
								}
							}
						}
						tmpUser = (User *)tmpUser->node.mln_Succ;
					}
				}
		
				INFO( "[MountFS] %s - Device '%s' mounted successfully\n", usr->u_Name, name );
			}
			else
			{
				error = l->sl_Error = FSys_Error_CustomError;
				FERROR("[MountFS] %s - Device not mounted name %s type %s\n", usr->u_Name, name, type );
				MountUnlock( dm, usr );
				goto merror;
			}
			MountUnlock( dm, usr );
		}
		
		// Send notify to user and all his sessions
		if( notify == TRUE )
		{
			UserNotifyFSEvent2( dm, usr, "refresh", "Mountlist:" );
		}
		
		NotifUser *ruser = rootNotifUser;
		NotifUser *cuser = rootNotifUser;
		while( cuser != NULL )
		{
			ruser = cuser;
			UserNotifyFSEvent2( dm, cuser->nu_User, "refresh", "Mountlist:" );
			cuser = (NotifUser *)cuser->node.mln_Succ;
			FFree( ruser );
		}
		
		DEBUG("[MountFS] %s - Mount device END\n", usr->u_Name );
	}
	
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
		char *path = NULL;
		char *name = NULL;
		UserSession *us = NULL;
		FULONG dbid = 0;
		FBOOL mount = FALSE;
		FULONG uid = 0;
	
		DEBUG("[MountFSNoUser] Mount device\n");
	
		//
		// Get FSys Type to mount
	
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
				case FSys_Mount_User_SessionID:
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
	
		// usr->u_SessionID[0] != '0' && usr->u_SessionID[1] != 0
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
					//if( f->f_SessionID ) FFree( f->f_SessionID );
					//f->f_SessionID = StringDuplicate( us->us_SessionID );
					f->f_SessionIDPTR = us->us_SessionID;

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
		
		//	char *prefix = filesys->GetPrefix();
	//		retFile->f_FSysName = StringDuplicateN( prefix, strlen( prefix ) );
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
			FERROR("Device not mounted name %s type %s\n", name, type );
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
		l->sl_Error = 0;

		//
		// Get FSys Type to mount
	
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
		File *remdev = UserRemDeviceByName( usr, name, &errors );
		
		// check if user want to remove his group drive
		
		if( remdev == NULL )
		{
			int i;
			DEBUG("[UnMountFS] --remdevNULL, name : %s\n", name );
			
			UserGroupLink *ugl = usr->u_UserGroupLinks;
			while( ugl != NULL )
			{
				DEBUG("[UnMountFS] --remdev grpname %s\n", ugl->ugl_Group->ug_Name );
				UserGroup *ug = ugl->ugl_Group;
				if( ugl->ugl_Group != NULL )
				{
					File *f = ugl->ugl_Group->ug_MountedDevs;
					File *fprev = ugl->ugl_Group->ug_MountedDevs;
			/*
			for( i=0 ; i < usr->u_GroupsNr ; i++ )
			{
				if( usr->u_Groups[ i ] != NULL )
				{
					DEBUG("[UnMountFS] --remdev grpname %s\n", usr->u_Groups[ i ]->ug_Name );
				
					File *f = usr->u_Groups[ i ]->ug_MountedDevs;
					File *fprev = usr->u_Groups[ i ]->ug_MountedDevs;
					UserGroup *ug = usr->u_Groups[ i ];
					*/
					while( f != NULL )
					{
						DEBUG("[UnMountFS] --file\n");
						if( strcmp( f->f_Name, name ) == 0 )
						{
							DEBUG("[UnMountFS] Device: '%s' removed from usergroup\n", name );
							if( f == ug->ug_MountedDevs )
							{
								ug->ug_MountedDevs = (File *)f->node.mln_Succ;
							}
							else
							{
								fprev->node.mln_Succ = f->node.mln_Succ;
							}
						
							break;
						}
						fprev = f;
						f = (File *)f->node.mln_Succ;
					}
				}	// != NULL
				ugl = (UserGroupLink *) ugl->node.mln_Succ;
			}
		}
		
		// release drive resources
		
		if( remdev != NULL )
		{
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

				if( DeviceUnMount( dm, remdev, usr ) != 0 )
				//if( fsys->UnMount( remdev->f_FSys, remdev, usr ) != 0 )
				{
					FERROR("[UnMountFS] ERROR: Cannot unmount device\n");
			
					FFree( tmp );
					FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
					return FSys_Error_CannotUnmountDevice;
				}
			
				// Notify user and his sessions
				UserNotifyFSEvent2( dm, usr, "refresh", "Mountlist:" );

				FileDelete( remdev );
				// Free up some
				/*
				//if( remdev->f_SessionID ) FFree( remdev->f_SessionID );
				if( remdev->f_Config ) FFree( remdev->f_Config );
				if( remdev->f_FSysName ) FFree( remdev->f_FSysName );
				if( remdev->f_Execute ) FFree( remdev->f_Execute );
				FFree( remdev );
				*/
			
				//int numberEntries = 0;
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
				
				if( unmID > 0 && unmType != NULL && strcmp( unmType, "SQLWorkgroupDrive" ) == 0 && ( usr->u_ID == userID || loggedSession->us_User->u_IsAdmin ) )
				{
					DEBUG("[UnMountFS] Refreshing all user drives for unmount.\n" );
					User *tmpUser = l->sl_UM->um_Users;
					while( tmpUser != NULL )
					{
						if( tmpUser->u_ID != usr->u_ID )
						{
							// Add also to this user
							File *search = tmpUser->u_MountedDevs;
							File *prev = NULL;
					
							while( search != NULL )
							{
								// Here, we found the device in the user's list
								// Can match on name since it's a workgroup drive..
								if( strcmp( search->f_Name, name ) == 0 )
								{
									DEBUG( "[UnMountFS] Found the drive %s on user %s.\n", name, tmpUser->u_Name );
							
									File *succ = (File *)search->node.mln_Succ; // next
									File *pred = (File *)search->node.mln_Pred; // prev
								
									DEBUG( "[UnMountFS] Freeing this defunct device: %s (%s)\n", name, tmpUser->u_Name );
								
									DeviceUnMount( dm, search, usr );
									//fsys->UnMount( search->f_FSys, search, usr );
								
									FileDelete( search );
									/*
									// Free up some
									//if( search->f_SessionID ) FFree( search->f_SessionID );
									if( search->f_Config ) FFree( search->f_Config );
									if( search->f_FSysName ) FFree( search->f_FSysName );
									if( search->f_Execute ) FFree( search->f_Execute );
									if( search->f_DevServer ) FFree( search->f_DevServer );
									FFree( search );
									*/
								
									int doBreak = 0;
								
									// First item
									if( !prev )
									{
										// We have next item
										if( succ )
										{
											tmpUser->u_MountedDevs = succ;
											succ->node.mln_Pred = NULL;
										}
										// Set no next item
										else
										{
											tmpUser->u_MountedDevs = NULL;
										}
										doBreak = 1;
									}
									// Mid item
									else if( prev && succ )
									{
										// Drop current out of list
										prev->node.mln_Succ = (MinNode *) succ;
										succ->node.mln_Pred = (MinNode *)prev;
										doBreak = 1;
									}
									// Last item
									else
									{
										// Place prev
										prev->node.mln_Succ = NULL;
										break;
									}
									if( doBreak == 1 )
									{
										// Tell user!
										UserNotifyFSEvent2( dm, tmpUser, "refresh", "Mountlist:" );
										break;
									}
								}
								prev = search;
								search = (File *) search->node.mln_Succ;
							}
						}
						tmpUser = (User *)tmpUser->node.mln_Succ;
					}
				}
				if( unmType ) FFree( unmType );
			}
			else
			{
				FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
				
				//remdev = UGMRemoveDrive( l->sl_UGM, name );

				return FSys_Error_OpsInProgress;
			}
		}
		else
		{
			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
			return FSys_Error_DeviceNotFound;
		}
	
		DEBUG("[UnMountFS] UnMount device END\n");
		FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
		return result;
	}
	FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );
	return -1; // Need to make error case for this..
}

/**
 * Get file by path
 *
 * @param usr pointer to user to which devices belong
 * @param dstpath pointer to pointer where file path will be stored (without device)
 * @param path path to file
 * @return when device exist and its avaiable then pointer to it is returned
 */

// NB: This one is not thread safe. Lock mutex before use!
File *GetFileByPath( User *usr, char **dstpath, const char *path )
{
	File *fhand = NULL;
	char ddrivename[ 256 ];

	int dpos = ColonPosition( path );
	strncpy( ddrivename, path, dpos );
	ddrivename[ dpos ] = 0;

	// Make sure we have a valid path!
	int pl = strlen( path );
	int i = 0; int success = 0;
	for( ; i < pl; i++ )
	{
		if( path[i] == ':' )
		{
			success++;
			break;
		}
	}
	if( success <= 0 )
	{
		FERROR("Path is not correct\n");
		return NULL;
	}

	*dstpath = (char *)&path[ dpos + 1 ];
	DEBUG("[GetFileByPath] Get handle by path!\n");

	if( usr != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &usr->u_Mutex) == 0 )
		{
			File *ldr = usr->u_MountedDevs;
			while( ldr != NULL )
			{ 
				if( strcmp( ldr->f_Name, ddrivename ) == 0 )
				{
					fhand = ldr;
					break;
				}
				ldr = (File *) ldr->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
		}
	}
	return fhand;
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
			FERROR("Cannot get mysql.library slot!\n");
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
				FERROR("Cannot update entry to database, code %d\n", error );
			}
			else
			{
				INFO("Filesystem %s updated in database\n", rootDev->f_Name );
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
					FERROR("Cannot add entry to database, code %d\n", error );
				}
				else
				{
					INFO("Filesystem %s added to database\n", rootDev->f_Name );
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
 * @param uid user ID to which device is assigned
 * @param devname device name
 * @param mountError pointer to place where error string will be stored
 * @return when device exist and its avaiable then pointer to it is returned
 */

File *GetUserDeviceByUserID( DeviceManager *dm, SQLLibrary *sqllib, FULONG uid, const char *devname, char **mountError )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	File *device = NULL;
	char temptext[ 512 ];
	
	sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "\
SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
FROM `Filesystem` \
WHERE `UserID` = '%ld' AND `Name` = '%s'", uid, devname );

	void *res = sqllib->Query( sqllib, temptext );
	if( res == NULL )
	{
		FERROR("GetUserDevice fail: database results = NULL\n");
		return NULL;
	}
	
	char **row;

	// check if device is already on list
	INFO("[GetUserDeviceByUserID] Mount user device from Database\n");
	
	int j = 0;
	
	while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
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
		
		char *masterSession = NULL;
		if( tuser != NULL )
		{
			masterSession = tuser->u_MainSessionID;
			struct TagItem tags[] = {
				{FSys_Mount_Path, (FULONG)row[ 4 ]},
				{FSys_Mount_Server, (FULONG)NULL},
				{FSys_Mount_Port, (FULONG)NULL},
				{FSys_Mount_Type, (FULONG)row[ 1 ]},
				{FSys_Mount_Name, (FULONG)row[ 0 ]},
				{FSys_Mount_User_SessionID, (FULONG)masterSession },
				//{FSys_Mount_User_SessionID, (FULONG)tuser->u_ID },
				{FSys_Mount_Owner, (FULONG)owner },
				{FSys_Mount_ID, (FULONG)id },
				{FSys_Mount_Mount, (FULONG)mount },
				{FSys_Mount_SysBase,(FULONG)l},
				{TAG_DONE, TAG_DONE}
			};

			int err = MountFS( dm, (struct TagItem *)&tags, &device, tuser, mountError, tuser->u_IsAdmin, TRUE );
			if( err != 0 )
			{
				if( l->sl_Error == FSys_Error_DeviceAlreadyMounted )
				{
					INFO("[GetUserDeviceByUserID] Device is already mounted\n");
				}
				else
				{
					FERROR("Cannot mount device, device '%s' will be unmounted. ERROR %d\n", row[ 0 ], err );
				}
			}
			else
			{
				//FERROR( "Cannot set device mounted state. Device = NULL (%s).\n", row[0] );
			}
		}
		else
		{
			FERROR("User do not exist, cannot mount drive\n");
		}
	}	// going through all rows

	sqllib->FreeResult( sqllib, res );
	
	DEBUG( "[GetUserDeviceByUserID] Successfully freed.\n" );
	
	return device;
}

/**
 * Send notification to users when filesystem event will happen
 *
 * @param dm pointer to DeviceManager
 * @param u user
 * @param evt event type (char *)
 * @param path path to file
 */

void UserNotifyFSEvent2( DeviceManager *dm, User *u, char *evt, char *path )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	//return; //test
	DEBUG("[UserNotifyFSEvent2] start\n");
	// Produce message
	char *prototype = "{\"type\":\"msg\",\"data\":{\"type\":\"\",\"path\":\"\"}}";
	int globmlen = strlen( prototype ) + strlen( path ) + strlen( evt ) + 128;
	char *message = FCalloc( globmlen, sizeof(char) );

	if( message != NULL && u != NULL )
	{
		DEBUG("[UserNotifyFSEvent2] Send notification to user: %s id: %lu\n", u->u_Name, u->u_ID );
		int mlen = snprintf( message, globmlen, "{\"type\":\"msg\",\"data\":{\"type\":\"%s\",\"data\":{\"path\":\"%s\"}}}", evt, path );
		
		if( FRIEND_MUTEX_LOCK( &(u->u_Mutex) ) == 0 )
		{
			UserSessListEntry *list = u->u_SessionsList;
			while( list != NULL )
			{
				if( list->us != NULL )
				{
					if( list->us != NULL )
					{
						WebSocketSendMessage( l, list->us, message, mlen );
					}
					else
					{
						INFO("Cannot send WS message: %s\n", message );
					}
				}
				list = (UserSessListEntry *)list->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(u->u_Mutex) );
		}
	}
	
	if( message != NULL )
	{
		FFree( message );
	}
	
	DEBUG("[UserNotifyFSEvent2] end\n");
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
					if( !userlist[i] ) break;
					UserSession *u = userlist[i];
					WebSocketSendMessage( l, u, message, msglen );
				}
			}
			FFree( message );
		}
		FFree( devName );
	}
}

/**
 * Mount door in FC by table row
 *
 * @param dm pointer to DeviceManager
 * @param usr pointer to user which call this function
 * @param row database row entryf
 * @param mountUser pointer to user which is mounting device
 * @return success (0) or fail value (not equal to 0)
 */
int MountDoorByRow( DeviceManager *dm, User *usr, char **row, User *mountUser __attribute__((unused)))
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	l->sl_Error = 0;
	
	if( usr != NULL && row != NULL )
	{
		char *type = NULL;
		char *server = NULL;
		char *path = NULL;
		char *port = NULL;
		char *uname = NULL;
		char *passwd = NULL;
		char *config = NULL;
		char *name = NULL;
		char *execute = NULL;
		FULONG id = 0;
		File *mount = NULL;
		FHandler *filesys = NULL;
		FBOOL visible = TRUE;
		
		if( row[ 0 ] != NULL ) { type = StringDuplicate( row[ 0 ] ); }
		if( row[ 1 ] != NULL ){ server = StringDuplicate( row[  1 ] ); }
		if( row[ 2 ] != NULL ){ path = StringDuplicate( row[  2 ] ); }
		if( row[ 3 ] != NULL ){ port = StringDuplicate( row[  3 ] ); }
		if( row[ 4 ] != NULL ){ uname = StringDuplicate( row[  4 ] ); }
		if( row[ 5 ] != NULL ){ passwd = StringDuplicate( row[  5 ] ); }
		if( row[ 6 ] != NULL ){ config = StringDuplicate( row[ 6 ] ); }
		if( row[ 7 ] != NULL )
		{
			char *end;
			id = strtoul( (char *)row[ 7 ],  &end, 0 );
		}
		
		if( row[ 8 ] != NULL ){ name = StringDuplicate( row[ 8 ] ); }
		if( row[ 9 ] != NULL ){ execute = StringDuplicate( row[ 9 ] ); }
		
		if( type !=NULL && id != 0 )
		{
			File *fentry = usr->u_MountedDevs;
			while( fentry != NULL )
			{
				if( id == fentry->f_ID )
				{
					l->sl_Error = FSys_Error_DeviceAlreadyMounted;
					
					goto mfeerror;
				}
				fentry = (File *) fentry->node.mln_Succ;
			}
			
			DEBUG("[MountDoorByRow] %s - User is not null!\n", usr->u_Name );
			
			//INFO("Mount Checking avaiable filesystem(%s)\n", name );
			
			//
			// Find installed filesystems by type
			DOSDriver *ddrive = (DOSDriver *)l->sl_DOSDrivers;
			// FHandler *efsys = NULL;
			while( ddrive != NULL )
			{
				DEBUG("[MountDoorByRow] %s - Mount check DOSDRIVERS FIND TYPE %s ddrivename %s\n", usr->u_Name, type, ddrive->dd_Name );
				if( strcmp( type, ddrive->dd_Name ) == 0 )
				{
					filesys = ddrive->dd_Handler;
					break;
				}
				ddrive = (DOSDriver *)ddrive->node.mln_Succ;
			}
			
			
			if( filesys == NULL )
			{
				FERROR("[ERROR]: %s - Cannot find FSys fdor device: %s\n", usr->u_Name, name );
				l->sl_Error = FSys_Error_NOFSAvaiable;
				goto mfeerror;
			}
			
			//
			// No drive from SQL? 
			
			if( id <= 0 )
			{
				FERROR("[ERROR]: %s - Could not find file system!: %s\n", usr->u_Name, name );
				l->sl_Error = FSys_Error_NOFSAvaiable;
				goto mfeerror;
			}
			
			//
			// parse config string
			//
			
			if( config != NULL )
			{
				
			}
			
			//INFO("[MountFS] %s - Localtype %s DDriverType %s\n", usr->u_Name, type, filedd->dd_Type );
			
			struct TagItem tags[] = {
				{FSys_Mount_Path, (FULONG)path},
				{FSys_Mount_Server, (FULONG)server},
				{FSys_Mount_Port, (FULONG)port},
				{FSys_Mount_Type, (FULONG)type},
				{FSys_Mount_Name, (FULONG)name},
				//{FSys_Mount_User, (FULONG)usr},
				{FSys_Mount_Owner,(FULONG)usr},
				{FSys_Mount_LoginUser,(FULONG)uname},
				{FSys_Mount_LoginPass,(FULONG)passwd},
				{FSys_Mount_SysBase,(FULONG)l},
				{FSys_Mount_Config,(FULONG)config},
				{FSys_Mount_Visible,(FULONG)visible},
				{FSys_Mount_UserName, (FULONG)usr->u_Name },
				{FSys_Mount_ID, (FULONG)id},
				{TAG_DONE, TAG_DONE}
			};

			// Using sentinel?
			/*
			User *mountUser = usr;
			if( usingSentinel == 1 )
			{
				mountUser = sent->s_User;
			}
			
			retFile = filesys->Mount( filesys, tags, mountUser );
			*/
		}
		
		DEBUG("[MountDoorByRow] %s - found row type %s server %s path %s port %s\n", usr->u_Name, row[0], row[1], row[2], row[3] );
		
		mfeerror:
		
		if( type != NULL ) FFree( type );
		if( port != NULL ) FFree( port );
		if( server != NULL ) FFree( server );
		if( path != NULL ) FFree( path );
		if( passwd != NULL ) FFree( passwd );
		if( uname != NULL ) FFree( uname );
		if( config != NULL ) FFree( config );
		if( execute != NULL ) FFree( execute );
	}
	
	return l->sl_Error;
}

/**
 * Refresh user disk (difference between DB and FC)
 *
 * @param dm pointer to DeviceManager
 * @param u pointer to user which call this function
 * @param bs pointer to BufferString when results will be stored
 * @param mountError pointer to place where error will be stored
 * @return success (0) or fail value (not equal to 0)
 */
int RefreshUserDrives( DeviceManager *dm, User *u, BufString *bs, char **mountError )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	FULONG *ids = FCalloc( 512, sizeof( FULONG ) );
	int idsEntries = 0;
	
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
								{ FSys_Mount_Path,           (FULONG)row[ 2 ] },
								{ FSys_Mount_Server,         (FULONG)row[ 1 ] },
								{ FSys_Mount_Port,           (FULONG)row[ 3 ] },
								{ FSys_Mount_Type,           (FULONG)row[ 0 ] },
								{ FSys_Mount_Name,           (FULONG)row[ 8 ] },
								{ FSys_Mount_User_SessionID, (FULONG)u->u_MainSessionID },
								{ FSys_Mount_Owner,          (FULONG)u },
								{ FSys_Mount_Mount,          (FULONG)TRUE },
								{ FSys_Mount_SysBase,        (FULONG)l },
								{ FSys_Mount_UserName, (FULONG)u->u_Name },
								{ FSys_Mount_Visible,        visible == NULL ? (FULONG)1 : (FULONG)0 },
								{ TAG_DONE, TAG_DONE }
							};
					
							File *mountedDev = NULL;
					
							int lmountError = MountFS( dm, (struct TagItem *)&tags, &mountedDev, u, mountError, u->u_IsAdmin, TRUE );
					
							if( bs != NULL )
							{
								int size = 0;
								if( pos == 0 )
								{
									size = snprintf( temp, sizeof(temp), "{\"name\":\"%s\", \"error\":%d }", row[ 8 ], lmountError );
								}
								else
								{
									size = snprintf( temp, sizeof(temp), ",{\"name\":\"%s\", \"error\":%d }", row[ 8 ], lmountError );
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
	SystemBase *l = (SystemBase *)dm->dm_SB;
	int errRet = 0;
	
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 256 ];
	
		snprintf( temptext, sizeof(temptext), "UPDATE `Filesystem` SET `StoredBytes` = '%ld' WHERE `ID` = '%lu'", rootDev->f_BytesStored, rootDev->f_ID );
		sqllib->QueryWithoutResults( sqllib, temptext );
		
		snprintf( temptext, sizeof(temptext), "UPDATE `FilesystemActivity` SET `StoredBytesLeft`='%ld',`ReadedBytesLeft`='%ld' WHERE `FilesystemID` = '%lu'", rootDev->f_Activity.fsa_StoredBytesLeft, rootDev->f_Activity.fsa_ReadedBytesLeft, rootDev->f_ID );
	
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
 * @return success (0) or fail value (not equal to 0)
 */
int DeviceUnMount( DeviceManager *dm, File *rootDev, User *usr )
{
	SystemBase *l = (SystemBase *)dm->dm_SB;
	int errRet = 0;
	
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 256 ];
	
		snprintf( temptext, sizeof(temptext), "UPDATE `Filesystem` SET `StoredBytes` = '%ld' WHERE `ID` = '%lu'", rootDev->f_BytesStored, rootDev->f_ID );
		sqllib->QueryWithoutResults( sqllib, temptext );
		
		snprintf( temptext, sizeof(temptext), "UPDATE `FilesystemActivity` SET `StoredBytesLeft`='%ld',`ReadedBytesLeft`='%ld' WHERE `ID` = '%lu'", rootDev->f_Activity.fsa_StoredBytesLeft, rootDev->f_Activity.fsa_ReadedBytesLeft, rootDev->f_Activity.fsa_ID );
		sqllib->QueryWithoutResults( sqllib, temptext );

		Log( FLOG_INFO, "DeviceUnMount: %s\n", temptext );
		
		FHandler *fsys = (FHandler *)rootDev->f_FSys;

		if( fsys != NULL && fsys->UnMount != NULL )
		{
			rootDev->f_SessionIDPTR = usr->u_MainSessionID;
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
 * @param devname device name
 * @return pointer to device (File *)
 */

File *GetRootDeviceByName( User *usr, char *devname )
{
	//
	// Check mounted devices for user
	
	if( usr == NULL )
	{
		FERROR("GetRootDEviceByName: user == NULL\n");
		return NULL;
	}

	File *lDev = NULL;
	File *actDev = NULL;
	if( FRIEND_MUTEX_LOCK( &usr->u_Mutex ) == 0 )
	{
		lDev = usr->u_MountedDevs;
	
		if( usr->u_MountedDevs == NULL )
		{
			FERROR( "Looks like we have NO mounted devs..\n" );
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
				INFO("Found file name '%s' path '%s' (%s)\n", actDev->f_Name, actDev->f_Path, actDev->f_FSysName );
				break;
			}
			lDev = (File *)lDev->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
	}
	
	if( actDev == NULL )
	{
		//int i;
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		while( ugl != NULL )
		//for( i=0 ; i < usr->u_GroupsNr ; i++ )
		{
			//if( usr->u_Groups[ i ] != NULL )
			if( ugl->ugl_Group != NULL )
			{
				lDev = ugl->ugl_Group->ug_MountedDevs;
				//lDev = usr->u_Groups[ i ]->ug_MountedDevs;
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
	
	if( actDev == NULL )
	{
		FERROR( "Cannot find mounted device by name: %s\n", devname );
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
 * @param mountError pointer to error message
 * @return 0 if everything went fine, otherwise error number
 */

int UserGroupDeviceMount( DeviceManager *dm, SQLLibrary *sqllib, UserGroup *usrgrp, User *usr, char **mountError )
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
		Log( FLOG_ERROR,  "[UserGroupDeviceMount] fail: database results = NULL\n");
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
			char *sessionID = NULL;
			
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
			
			if( usr != NULL )
			{
				sessionID = usr->u_MainSessionID;
			}
			
			DEBUG("Usergroup mount: pass sessionid: '%s'\n", sessionID );
			
			struct TagItem tags[] = {
				{ FSys_Mount_Path,    (FULONG)row[ 4 ] },
				{ FSys_Mount_Server,  (FULONG)NULL },
				{ FSys_Mount_Port,    (FULONG)NULL },
				{ FSys_Mount_Type,    (FULONG)row[ 1 ] },
				{ FSys_Mount_Name,    (FULONG)row[ 0 ] },
				{ FSys_Mount_UserGroup, (FULONG)usrgrp },
				{ FSys_Mount_Owner,   (FULONG)usr },
				{ FSys_Mount_ID,      (FULONG)id },
				{ FSys_Mount_Mount,   (FULONG)mount },
				{ FSys_Mount_SysBase, (FULONG)SLIB },
				{ FSys_Mount_User_SessionID, (FULONG)sessionID },
				{ FSys_Mount_Visible, (FULONG)1 },     // Assume visible
				{TAG_DONE, TAG_DONE}
			};

			FRIEND_MUTEX_UNLOCK( &dm->dm_Mutex );

			File *device = NULL;
			DEBUG("[UserGroupDeviceMount] Before mounting\n");
			int err = MountFS( dm, (struct TagItem *)&tags, &device, usr, mountError, TRUE, TRUE );

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


