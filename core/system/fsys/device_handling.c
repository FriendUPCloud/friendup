/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/
/**
 *  @file device_handling.h
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

DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, char *name );

void DOSDriverDelete( DOSDriver *ddrive );

/**
 * Scan filesystem directory
 *
 * @param l pointer to SystemBase
 * @return success (0) or fail value (-1)
 */

int RescanHandlers( SystemBase *l )
{
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
	{
		char tempString[ 1024 ];
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
	
		getcwd( tempString, sizeof ( tempString ) );

		if( l->sl_FSysPath != NULL )
		{
			free( l->sl_FSysPath );
		}
		l->sl_FSysPath = calloc( 256, sizeof( char ) );
		if( l->sl_FSysPath == NULL )
		{
			free( l );
			pthread_mutex_unlock( &l->sl_InternalMutex );
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
		pthread_mutex_unlock( &l->sl_InternalMutex );
	}
	return 0;
}

/**
 * Scan DOSDriver directory
 *
 * @param l pointer to SystemBase
 * @return success (0) or fail value (-1)
 */

int RescanDOSDrivers( SystemBase *l )
{
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
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
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return 1;
		}
	
	
		while( ( dir = readdir( d ) ) != NULL )
		{
			char tempString[ 1024 ];
		
			sprintf( tempString, "%s%s", ddrivedirectory, dir->d_name );

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
		}
		closedir( d );
		pthread_mutex_unlock( &l->sl_InternalMutex );
	}	
	return 0;
}

/**
 * Mount SQLWorkgroupDrive for other users
 *
 * @param l pointer to SystemBase
 * @param type type of device
 * @param usr owner
 * @param id device id
 * @param mounted if device should be mounted flag
 * @return success (0) or fail value (not equal to 0)
 */
/*
int CheckAndMountWorkgroupDrive( SystemBase *l, char *type, User *usr, FUQUAD id, int mounted )
{
	if( type && strcmp( type, "SQLWorkgroupDrive" ) == 0 )
	{
		User *tmpUser = l->sl_UM->um_Users;
		while( tmpUser != NULL )
		{
			// Skip current user
			if( tmpUser->u_ID == usr->u_ID )
			{
				//DEBUG( "[MountFS] -- Skipping owner of drive %d (%s).\n", usr->u_ID, usr->u_Name );
				tmpUser = (User *)tmpUser->node.mln_Succ;
				continue;
			}
			
			DEBUG( "[MountFS] -- Checking if %s has drive %s.\n", tmpUser->u_Name, name );
			
			// Test if this user already has this disk
			File *search = tmpUser->u_MountedDevs;
			while( search != NULL )
			{
				DEBUG("[MountFS] -- Find %d current id %d name %s\n", id, search->f_ID, search->f_Name );
				if( search->f_ID == id )
				{
					DEBUG( "[MountFS] -- Found user.\n" );
					search->f_Mounted = mounted; // mount if it isn't
					break;
				}
				search = (File *)search->node.mln_Succ;
			}
			
			// User doesn't have this disk, add it!
			if( search == NULL )
			{
				DEBUG( "[MountFS] -- User %s has not got drive %s. Trying mount.\n", tmpUser->u_Name, name );
				
				pthread_mutex_unlock( &l->sl_InternalMutex );
				
				// Try to mount the device with all privileges
				//DEBUG( "[MountFS] Doing it with session %s\n", retFile->f_SessionID );
				File *dstFile = NULL;
				if( MountFS( l, tl, &dstFile, tmpUser ) != 0 )
				{
					DEBUG( "[MountFS] -- Could not mount device for user %s. Drive was %s.\n", tmpUser->u_Name ? tmpUser->u_Name : "--nousername--", name ? name : "--noname--" );
				}
				
				if( dstFile != NULL )
				{
					if( dstFile->f_FSysName )
					{
						DEBUG("\n\n\n\n---------------- id %lu, reftfs %s  DST\n", dstFile->f_ID, dstFile->f_FSysName );
					}
					else 
					{
						DEBUG( "\n\n\n\n---------------- NO fsys name - ID: %lu..\n", dstFile->f_ID );
					}
				}
				else
				{
					DEBUG( "\n\n\n\n----------- NO dest\n" );
				}
				
				if( pthread_mutex_lock( &l->sl_InternalMutex ) != 0 )
				{
					DEBUG("Go to error\n");
					goto merror;
				}
				DEBUG("lock set\n");
				// Tell user!
				UserNotifyFSEvent2( l, tmpUser, "refresh", "Mountlist:" );
			}
			tmpUser = (User *)tmpUser->node.mln_Succ;
		}
	}
}
*/

/**
 * Mount door in FC
 *
 * @param l pointer to SystemBase
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param mfile pointer to pointer where new created door will be stored
 * @param usr pointer to user which call this function
 * @return success (0) or fail value (not equal to 0)
 */

int MountFS( SystemBase *l, struct TagItem *tl, File **mfile, User *usr )
{
	char *path = NULL;
	char *name = NULL;
	char *server = NULL;
	char *port = NULL;
	char *uname = NULL;
	char *passwd = NULL;
	char *config = NULL;
	char *ctype = NULL, *type = NULL;
	char *execute = NULL;
	FULONG id = 0;
	
	DEBUG("[MountFS] %s: Start - MountFS before lock for user..\n", usr->u_Name );
		
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
	{
		FHandler *filesys = NULL;
		DOSDriver *filedd = NULL;
		File *retFile = NULL;
		struct TagItem *ltl = tl;
		FULONG visible = 0;
		FBOOL isAdim = UMUserIsAdmin( l->sl_UM, NULL, usr );
		char *sessionid = NULL;
		FULONG dbid = 0;
		FBOOL mount = FALSE;
	
		Log( FLOG_DEBUG, "Mount device\n");
	
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
				//case FSys_Mount_Execute:
				//	execute = ( char *)ltl->ti_Data;
				//	break;
			}

			ltl++;
		}
	
		if( name == NULL )
		{
			FERROR("[ERROR]: %s - No name passed\n", usr->u_Name );
			l->sl_Error = FSys_Error_NOName;
			pthread_mutex_unlock( &l->sl_InternalMutex );
			if( type != NULL ){ FFree( type );}
			return FSys_Error_NOName;
		}

		if( usr == NULL )
		{
			FERROR("[ERROR]: %s - No user passed, cannot put device on mountlist\n", usr->u_Name );

			pthread_mutex_unlock( &l->sl_InternalMutex );
			if( type != NULL ){ FFree( type );}
			return FSys_Error_NOUser;
		}
		
		// Setup the sentinel
		Sentinel *sent = l->GetSentinelUser( l );
		int usingSentinel = 0;
		
		// New way of finding type of device
		MYSQLLibrary *sqllib = l->LibraryMYSQLGet( l );
		if( sqllib != NULL )
		{
			char temptext[ 512 ]; memset( temptext, 0, sizeof(temptext) );
			
			sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
			//snprintf( temptext, sizeof( temptext ), 
				"SELECT \
					`Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,`ID`,`Execute` \
				FROM `Filesystem` f\
				WHERE\
				(\
					f.UserID = '%ld' OR\
					f.GroupID IN (\
						SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
						WHERE \
							g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
							ug.UserID = '%ld'\
					)\
				)\
				AND f.Name = '%s'",
				usr->u_ID , usr->u_ID, name
			);
	
			MYSQL_RES *res = sqllib->Query( sqllib, temptext );
			if( res == NULL || sqllib->NumberOfRows( sqllib, res ) <= 0 )
			{
				FERROR("[MountFS] %s - GetUserDevice fail: database results = NULL\n", usr->u_Name );
				if( sent != NULL && sent->s_User != NULL )
				{
					sqllib->FreeResult( sqllib, res );
					
					DEBUG( "[MountFS] Trying to mount device using sentinel!\n" );
					memset( temptext, '\0', 512 );
					sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), 
					//snprintf( temptext, sizeof( temptext ), 
						"SELECT \
							`Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,`ID`,`Execute` \
						FROM `Filesystem` f\
						WHERE\
						(\
							f.UserID = '%ld' OR\
							f.GroupID IN (\
								SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
								WHERE \
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
									ug.UserID = '%ld'\
							)\
						)\
						AND f.Name = '%s'",
						sent->s_User->u_ID, sent->s_User->u_ID, name 
					);
					if( ( res = sqllib->Query( sqllib, temptext ) ) == NULL )
					{
						pthread_mutex_unlock( &l->sl_InternalMutex );
						if( type != NULL ){ FFree( type );}
						l->sl_Error = FSys_Error_SelectFail;
						l->LibraryMYSQLDrop( l, sqllib );
						return FSys_Error_SelectFail;
					}
					usingSentinel = 1;
				}
				else
				{
					pthread_mutex_unlock( &l->sl_InternalMutex );
					if( type != NULL ){ FFree( type );}
					l->sl_Error = FSys_Error_SelectFail;
					l->LibraryMYSQLDrop( l, sqllib );
				
					return FSys_Error_SelectFail;
				}
			}
			else
			{
				DEBUG( "[MountFS] %s - We actually did get a result!\n", usr->u_Name );
			}
	
			MYSQL_ROW row;
			int j = 0;
	
			if( usingSentinel == 1 )
			{
				DEBUG( "[MountFS] %s - We are using sentinel!\n", usr->u_Name );
			}
	
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

				if( type != NULL )
				{
					FFree( type );
				}
				if( row[ 0 ] != NULL ) 
				{
					type = StringDuplicate( row[ 0 ] );
				}
				
				if( server != NULL )
				{
					FFree( server );
				}
				if( row[ 1 ] != NULL ) server = StringDuplicate( row[  1 ] );
				
				if( path != NULL )
				{
					FFree( path );
				}
				if( row[ 2 ] != NULL ) path = StringDuplicate( row[  2 ] );
				
				if( port != NULL )
				{
					FFree( port );
				}
				if( row[ 3 ] != NULL ) port = StringDuplicate( row[  3 ] );
				
				if( uname != NULL )
				{
					FFree( uname );
				}
				if( row[ 4 ] != NULL ) uname = StringDuplicate( row[  4 ] );
				
				if( passwd != NULL )
				{
					FFree( passwd );
				}
				if( row[ 5 ] != NULL ) passwd = StringDuplicate( row[  5 ] );
				
				if( config != NULL )
				{
					FFree( config );
				}
				if( row[ 6 ] != NULL ) config = StringDuplicate( row[ 6 ] );
				
				if( row[ 7 ] != NULL )
				{
					char *end;
					id = strtoul( (char *)row[ 7 ],  &end, 0 );
				}
				
				if( row[ 8 ] != NULL ) execute = StringDuplicate( row[ 8 ] );
				
				DEBUG("[MountFS] User name %s - found row type %s server %s path %s port %s\n", usr->u_Name, row[0], row[1], row[2], row[3] );
			}
			
			sqllib->FreeResult( sqllib, res );

			l->LibraryMYSQLDrop( l, sqllib );
		}
		
		 // old way when FC had control
		if( type == NULL )
		{
			FERROR("[ERROR]: %s - No type passed\n", usr->u_Name );
			l->sl_Error = FSys_Error_NOFSType;
			
			goto merror;
		}
		
		// do not allow to mount same drive
		
		File *fentry = usr->u_MountedDevs;
		while( fentry != NULL )
		{
			if( id == fentry->f_ID )
			{
				*mfile = fentry;
				DEBUG("Device is already mounted\n");
				l->sl_Error = FSys_Error_DeviceAlreadyMounted;
				
				goto merror;
			}
			fentry = (File *) fentry->node.mln_Succ;
		}
	
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
					if( f->f_SessionID )
					{
						FFree( f->f_SessionID );
					}
					// Using sentinel if that's the case
					if( usingSentinel )
					{
						f->f_SessionID = StringDuplicate( sent->s_User->u_MainSessionID  );
					}
					// Just use the session id
					else
					{
						f->f_SessionID = StringDuplicate( sessionid );
					}
					
					f->f_ID = id;
					if( f->f_FSysName != NULL )
					{
						FFree( f->f_FSysName );
					}
					f->f_FSysName = StringDuplicate( type );
					
					// Set structure to caller
					if( mfile )
					{
						*mfile = f;
					}

					l->sl_Error = FSys_Error_DeviceAlreadyMounted;
					
					goto merror;
				}
			}
		}
		//
		// If FHandler not found return NULL
	
		if( filesys == NULL )
		{
			FERROR("[ERROR]: %s - Cannot find FSys fdor device: %s\n", usr->u_Name, name );
			l->sl_Error = FSys_Error_NOFSAvaiable;
			goto merror;
		}
		
		//
		// No drive from SQL? 
		
		if( id <= 0 )
		{
			FERROR("[ERROR]: %s - Could not find file system!: %s\n", usr->u_Name, name );
			l->sl_Error = FSys_Error_NOFSAvaiable;
			goto merror;
		}
	
		INFO("[MountFS] %s - Localtype %s DDriverType %s\n", usr->u_Name, type, filedd->dd_Type );
		
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
			{FSys_Mount_UserName,(FULONG)usr->u_Name},
			//{FSys_Mount_Execute,(FULONG)execute},
			{FSys_Mount_ID, (FULONG)id},
			{FSys_Mount_AdminRights,(FULONG)isAdim},
			{TAG_DONE, TAG_DONE}
		};
		
		pthread_mutex_unlock( &l->sl_InternalMutex );
	
		// Using sentinel?
		User *mountUser = usr;
		if( usingSentinel == 1 )
		{
			mountUser = sent->s_User;
		}
		
		DEBUG( "[MountFS] Filesystem to mount now.\n" );
	
		retFile = filesys->Mount( filesys, tags, mountUser );
		
		DEBUG( "[MountFS] Filesystem mounted. Pointer to returned device: %p.\n", retFile );
		
		if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
		{
			if( retFile != NULL )
			{
				retFile->f_ID = id;
				retFile->f_Mounted = mount;
				retFile->f_Config = StringDuplicate( config );
				retFile->f_Visible = visible ? 1 : 0;
				retFile->f_Execute = StringDuplicate( execute );
				retFile->f_FSysName = StringDuplicate( type );
				
				if( usr != NULL )
				{
					File *lfile = usr->u_MountedDevs;
					
					// Macro way - less understandable! (for me) m0ns00n
					/*if( lfile == NULL )
					{
						usr->u_MountedDevs = retFile;
					}
					else
					{
						LIST_ADD_HEAD( usr->u_MountedDevs, retFile );
					}*/
					
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
							pthread_mutex_unlock( &l->sl_InternalMutex );
							
							// Try to mount the device with all privileges
							//DEBUG( "[MountFS] Doing it with session %s\n", retFile->f_SessionID );
							File *dstFile = NULL;
							if( MountFS( l, tl, &dstFile, tmpUser ) != 0 )
							{
								INFO( "[MountFS] -- Could not mount device for user %s. Drive was %s.\n", tmpUser->u_Name ? tmpUser->u_Name : "--nousername--", name ? name : "--noname--" );
							}
							
							if( pthread_mutex_lock( &l->sl_InternalMutex ) != 0 )
							{
								DEBUG("Go to error\n");
								goto merror;
							}
							DEBUG("lock set\n");
							// Tell user!
							UserNotifyFSEvent2( l, tmpUser, "refresh", "Mountlist:" );
						}
						tmpUser = (User *)tmpUser->node.mln_Succ;
					}
				}
		
				INFO( "[MountFS] %s - Device '%s' mounted successfully\n", usr->u_Name, name );
			}
			else
			{
				l->sl_Error = FSys_Error_NOFSAvaiable;
				FERROR("[MountFS] %s - Device not mounted name %s type %s\n", usr->u_Name, name, type );
				
				goto merror;
			}
		}
		
		// Send notify to user and all his sessions
		UserNotifyFSEvent2( l, usr, "refresh", "Mountlist:" );
		
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
	pthread_mutex_unlock( &l->sl_InternalMutex );
	
	return 0;
	
merror:
	if( type != NULL ) FFree( type );
	if( port != NULL ) FFree( port );
	if( server != NULL ) FFree( server );
	if( path != NULL ) FFree( path );
	if( passwd != NULL ) FFree( passwd );
	if( uname != NULL ) FFree( uname );
	if( config != NULL ) FFree( config );
	if( execute != NULL ) FFree( execute );
	pthread_mutex_unlock( &l->sl_InternalMutex );

	return l->sl_Error;
}

/**
 * Mount door in FC
 * This function do not need User. It is used for example by file sharing.
 *
 * @param l pointer to SystemBase
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param mfile pointer to pointer where new created door will be stored
 * @return success (0) or fail value (not equal to 0)
 */


int MountFSNoUser( struct SystemBase *l, struct TagItem *tl, File **mfile )
{
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
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
			}
			ltl++;
		}

		if( type == NULL )
		{
			FERROR("[ERROR]: No type passed\n");
			l->sl_Error = FSys_Error_NOFSType;
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return FSys_Error_NOFSType;
		}
	
		if( name == NULL )
		{
			FERROR("[ERROR]: No name passed\n");
			l->sl_Error = FSys_Error_NOName;
			pthread_mutex_unlock( &l->sl_InternalMutex );
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
					if( f->f_SessionID ) free( f->f_SessionID );
					f->f_SessionID = StringDuplicate( us->us_SessionID );

					// Set structure to caller
					if( mfile ) *mfile = f;
					// Return no error
					pthread_mutex_unlock( &l->sl_InternalMutex );
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
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return FSys_Error_NOFSAvaiable;
		}
	
		INFO("[MountFSNoUser] Localtype %s DDriverType %s\n", type, filedd->dd_Type );
	
		retFile = filesys->Mount( filesys, tl, NULL );
	
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
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return FSys_Error_NOFSAvaiable;
		}

		pthread_mutex_unlock( &l->sl_InternalMutex );
	}
	return 0;
}

/**
 * Unmount door in FC
 *
 * @param l pointer to SystemBase
 * @param tl list to tagitems (table of attributes) like FSys_Mount_Mount, FSys_Mount_Name etc. For more details check systembase heder.
 * @param usrs pointer to user session which is calling this function
 * @return success (0) or fail value (not equal to 0)
 */

int UnMountFS( struct SystemBase *l, struct TagItem *tl, UserSession *usrs )
{
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
	{
		int result = 0;
	
		DEBUG("[UnMountFS] UnMount device\n");
	
		struct TagItem *ltl = tl;
		char *name = NULL;
		char *type = NULL;
		//User *usr = NULL;
		//UserSession *us = NULL;
		//int found = 0;
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
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return FSys_Error_NOName;
		}
	
		/*
		if( usrs == NULL )
		{
			INFO("Device will be unmounted, but not removed from user mounted device list\n");
			//pthread_mutex_unlock( &l->mutex );
			//return FSys_Error_NOUser;
		}*/
	
		DEBUG("[UnMountFS] Unmount before checking users\n");
	
		USMLogUsersAndDevices( l->sl_USM );

		if( usrs == NULL )
		{
			pthread_mutex_unlock( &l->sl_InternalMutex );
			FERROR("[UnMountFS] User session is null\n");
			return FSys_Error_UserNotLoggedIn;
		}
	
		User *usr = usrs->us_User;
		int errors = 0;
		File *remdev = UserRemDeviceByName( usr, name, &errors );
		/*
		File *lf = usr->u_MountedDevs;
		File *lastone = NULL;
		File *remdev = NULL;
		if( lf == NULL )
		{
			FERROR( "[UnMountFS] Seems we have NO mounted devs for user %s!\n", usr->u_Name );
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return FSys_Error_NODevForUser;
		}
	
		while( lf != NULL )
		{
			if( strcmp( lf->f_Name, name ) == 0 )
			{
				remdev = lf;
				break;
			}
			lastone = lf;
			lf = (File *)lf->node.mln_Succ;
		}*/
	
		
		if( remdev != NULL )
		{
			if( remdev->f_Operations < 1 )
			{
				DEBUG("[UnMountFS] Device found, unmounting\n");

				FHandler *fsys = (FHandler *)remdev->f_FSys;
			
				// If we're here, we need to test if this drive also needs to be removed
				// from other users!
				char *tmp = FCalloc( 1024, sizeof( char ) );
				snprintf( tmp, 1024, "\
					SELECT ID, `Type` FROM `Filesystem` f\
					WHERE\
						f.Name = '%s' AND\
						(\
							f.UserID = '%ld' OR\
							f.GroupID IN (\
								SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
								WHERE \
								g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND\
								ug.UserID = '%ld'\
							)\
						)\
					", name, usrs->us_User->u_ID, usrs->us_User->u_ID );

				if( fsys->UnMount( remdev->f_FSys, remdev, usr ) != 0 )
				{
					FERROR("[UnMountFS] ERROR: Cannot unmount device\n");
			
					FFree( tmp );
					pthread_mutex_unlock( &l->sl_InternalMutex );
					return FSys_Error_CannotUnmountDevice;
				}
			
				// Notify user and his sessions
				UserNotifyFSEvent2( l, usr, "refresh", "Mountlist:" );
		/*
			if( usr->u_MountedDevs == remdev )		// checking if its our first entry
			{
				File *next = (File*)remdev->node.mln_Succ;
				usr->u_MountedDevs = (File *)next;
				if( next != NULL )
				{
					next->node.mln_Pred = NULL;
				}
			}
			else
			{
				File *next = (File *)remdev->node.mln_Succ;
				//next->node.mln_Pred = (struct MinNode *)prev;
				if( lastone != NULL )
				{
					lastone->node.mln_Succ = (struct MinNode *)next;
				}
			}
			*/

				// Free up some
				if( remdev->f_SessionID ) FFree( remdev->f_SessionID );
				if( remdev->f_Config ) FFree( remdev->f_Config );
				if( remdev->f_FSysName ) FFree( remdev->f_FSysName );
				if( remdev->f_Execute ) FFree( remdev->f_Execute );
				FFree( remdev );
			
				int numberEntries = 0;
				int unmID = 0;
				char *unmType = NULL;
				
				MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
				if( sqllib != NULL )
				{
					MYSQL_RES *res = sqllib->Query( sqllib, tmp );
					FFree( tmp );
			
					if( res != NULL )
					{
						MYSQL_ROW row;
				
						while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
						{
							unmID = atoi( row[0] );
							unmType = StringDuplicate( row[1] );
						}
						sqllib->FreeResult( sqllib, res );
					}
					l->LibraryMYSQLDrop( l, sqllib );
				}
				
				if( unmID > 0 && unmType != NULL && strcmp( unmType, "SQLWorkgroupDrive" ) == 0 )
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
								
									fsys->UnMount( search->f_FSys, search, usr );
								
									// Free up some
									if( search->f_SessionID ) FFree( search->f_SessionID );
									if( search->f_Config ) FFree( search->f_Config );
									if( search->f_FSysName ) FFree( search->f_FSysName );
									if( search->f_Execute ) FFree( search->f_Execute );
									FFree( search );
								
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
										UserNotifyFSEvent2( l, tmpUser, "refresh", "Mountlist:" );
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
				pthread_mutex_unlock( &l->sl_InternalMutex );
				return FSys_Error_OpsInProgress;
			}
		}
		else
		{
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return FSys_Error_DeviceNotFound;
		}
	
		DEBUG("[UnMountFS] UnMount device END\n");
		pthread_mutex_unlock( &l->sl_InternalMutex );
		return result;
	}
	pthread_mutex_unlock( &l->sl_InternalMutex );
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
	return fhand;
}

/**
 * Mount door in database
 *
 * @param l pointer to SystemBase
 * @param rootDev pointer to device (root file)
 * @param mount if device didnt fail during mounting value must be set to 1, otherwise 0
 * @return success (0) or fail value (not equal to 0)
 */

int DeviceMountDB( SystemBase *l, File *rootDev, FBOOL mount )
{
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
	{
		MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
		
		if( sqllib == NULL )
		{
			FERROR("Cannot get mysql.library slot!\n");
			pthread_mutex_unlock( &l->sl_InternalMutex );
			return -10;
		}
		Filesystem *filesys = NULL;
		User *owner = (User *)rootDev->f_User;
	
		char where[ 1024 ];
		int entries;
		
		sqllib->SNPrintF( sqllib, 
			where, sizeof(where), "\
			(\
				f.UserID = '%ld' OR\
				f.GroupID IN (\
					SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
					WHERE \
						g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
						ug.UserID = '%ld'\
				)\
			)\
			AND LOWER(f.Name) = LOWER('%s')\
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
	
		char temptext[ 1024 ];
		sqllib->SNPrintF( sqllib, temptext, sizeof( temptext ), "SELECT * FROM `Filesystem` f\
		WHERE\
			f.Name = '%s' AND\
			(\
				f.UserID = '%ld' OR\
				f.GroupID IN (\
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
				WHERE \
				g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND\
				ug.UserID = '%ld'\
			)\
		)\
		", rootDev->f_Name, owner->u_ID, owner->u_ID );
		/*
		sprintf( temptext, "SELECT * FROM `Filesystem` f\
		WHERE\
			f.Name = '%s' AND\
			(\
				f.UserID = '%ld' OR\
				f.GroupID IN (\
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
				WHERE \
					g.ID = ug.UserGroupID AND g.Type = 'Workgroup' AND\
					ug.UserID = '%ld'\
				)\
			)\
		", rootDev->f_Name, owner->u_ID, owner->u_ID );
		*/
		MYSQL_RES *res = sqllib->Query( sqllib, temptext );
		MYSQL_ROW row;
		int numberEntries = 0;
	
		while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
		{
			numberEntries++;
		}
		sqllib->FreeResult( sqllib, res );
		/*
		// if device was not found then we must add it
	
		if( numberEntries == 0 )
		{
			sprintf( finalQuery, "INSERT INTO %s ( %s ) VALUES( %s )", (char *)descr[ 1 ], tableQuery, dataQuery );
		}
		else		// device found, lets update entry
		{
			sprintf( temptext, "UPDATE `Filesystem` SET `Mounted` = '%d' WHERE `UserID` = '%ld' AND LOWER(`Name`) = LOWER('%s')", mount,  owner->u_ID, rootDev->f_Name );
		}
	
		//int res = sqllib->NumberOfRecords( sqllib, FilesystemDesc, temptext );
		//sqllib->Save( sqllib, FilesystemDesc, rootDev );
		*/
		l->LibraryMYSQLDrop( l, sqllib );
		pthread_mutex_unlock( &l->sl_InternalMutex );
	}	
	return 0;
}

/**
 * Get device by userid
 *
 * @param l pointer to SystemBase
 * @param sqllib pointer to sql.library
 * @param uid user ID to which device is assigned
 * @param devname device name
 * @return when device exist and its avaiable then pointer to it is returned
 */

File *GetUserDeviceByUserID( SystemBase *l, MYSQLLibrary *sqllib, FULONG uid, const char *devname )
{
	File *device = NULL;
	char temptext[ 512 ];
	
	sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "\
		SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
		FROM `Filesystem` \
		WHERE `UserID` = '%ld' AND `Name` = '%s'", uid, devname );

	//sprintf( temptext, "SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID` FROM `Filesystem` f WHERE f.UserID = '%ld'", usr->u_ID );
	/*
	sprintf( temptext, "
		SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
		FROM `Filesystem` \
		WHERE `UserID` = '%ld' AND `Name` = '%s'", uid, devname );
	*/
	MYSQL_RES *res = sqllib->Query( sqllib, temptext );
	if( res == NULL )
	{
		FERROR("GetUserDevice fail: database results = NULL\n");
		return NULL;
	}
	
	MYSQL_ROW row;

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

			int err = MountFS( l, (struct TagItem *)&tags, &device, tuser );
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
 * @param sb pointer to SystemBase
 * @param user user
 * @param evt event type (char *)
 * @param path path to file
 * @return nothing
 */

void UserNotifyFSEvent2( SystemBase *sb, User *u, char *evt, char *path )
{
	DEBUG("[UserNotifyFSEvent2] start\n");
	// Produce message
	char *prototype = "{\"type\":\"msg\",\"data\":{\"type\":\"\",\"path\":\"\"}}";
	int mlen = strlen( prototype ) + strlen( path ) + strlen( evt ) + 1;
	char message[ mlen ];
	memset( message, '\0', mlen );

	if( message != NULL )
	{
		snprintf( message, mlen, "{\"type\":\"msg\",\"data\":{\"type\":\"%s\",\"path\":\"%s\"}}", evt, path );
		UserSessListEntry *list = u->u_SessionsList;
		while( list != NULL )
		{
			if( list->us != NULL )
			{
				if( list->us != NULL )
				{
					WebSocketSendMessage( sb, list->us, message, strlen( message ) );
				}
				else
				{
					INFO("Cannot send WS message: %s\n", message );
				}
			}
			list = (UserSessListEntry *)list->node.mln_Succ;
		}
	}
	DEBUG("[UserNotifyFSEvent2] end\n");
}

/**
 * Send notification to users when filesystem event will happen
 *
 * @param sb pointer to SystemBase
 * @param evt event type (char *)
 * @param path path to file
 * @return nothing
 */

void UserNotifyFSEvent( SystemBase *sb, char *evt, char *path )
{
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
		sprintf( devName, "%.*s", len, path );
	
		// Find all users of said filesystem
		// TODO: Write this code..
	
		int userlength = 0;
		UserSession **userlist = NULL;
	
		// Produce message
		char *prototype = "{\"type\":\"notification\",\"data\":{\"type\":\"filechange\",\"path\":\"\"}}";
		char *message = FCalloc( 1, strlen( prototype ) + strlen( path ) );
		if( message != NULL )
		{
			sprintf( message, "{\"type\":\"notification\",\"data\":{\"type\":\"filechange\",\"path\":\"%s\"}}", path );
	
			if( evt == NULL && userlength > 0 )
			{
				for( i = 0; i < userlength; i++ )
				{
					if( !userlist[i] ) break;
					UserSession *u = userlist[i];
					sb->WebSocketSendMessage( sb, u, message, strlen( message ) );
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
 * @param l pointer to systembase
 * @param usr pointer to user which call this function
 * @param row database row entry
 * @param mountUser pointer to user which is mounting device
 * @param param to user session which called function
 * @return success (0) or fail value (not equal to 0)
 */
int MountDoorByRow( SystemBase *l, User *usr, MYSQL_ROW row, User *mountUser )
{
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
			
			pthread_mutex_unlock( &l->sl_InternalMutex );
			
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
 * @param l pointer to systembase
 * @param u pointer to user which call this function
 * @param bs pointer to BufferString when results will be stored
 * @return success (0) or fail value (not equal to 0)
 */
int RefreshUserDrives( SystemBase *l, User *u, BufString *bs )
{
	FULONG *ids = FCalloc( 512, sizeof( FULONG ) );
	int idsEntries = 0;
	
	// ask about all drives in DB
	
	char *query = FCalloc( 1024, sizeof(char) );
	if( query != NULL )
	{
		MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
		if( sqllib != NULL )
		{
			sqllib->SNPrintF( sqllib, query, 1024, "\
				SELECT `Type`,`Server`,`Path`,`Port`,`Username`,`Password`,`Config`,`ID`,`Name`,`Execute`,`Mounted` FROM Filesystem f WHERE (\
					f.UserID = '%ld' OR\
					f.GroupID IN (\
						SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g WHERE \
							g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
							ug.UserID = '%lu'\
					)\
				)",  u->u_ID, u->u_ID );
			
			DEBUG("[RefreshUserDrives] Query which will be used to find devices %s\n", query );
			
			char *visible = NULL;

			int pos = 0;
			
			if( bs != NULL )
			{
				BufStringAdd( bs, "ok<!--separate-->{\"Result\":[" );
			}
			
			MYSQL_RES *res = sqllib->Query( sqllib, query );
			if( res != NULL  )
			{
				MYSQL_ROW row;
				
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
					
							int mountError = MountFS( l, (struct TagItem *)&tags, &mountedDev, u );
					
							if( bs != NULL )
							{
								int size = 0;
								if( pos == 0 )
								{
									size = snprintf( temp, sizeof(temp), "{\"name\":\"%s\", \"error\":%d }", row[ 8 ], mountError );
								}
								else
								{
									size = snprintf( temp, sizeof(temp), ",{\"name\":\"%s\", \"error\":%d }", row[ 8 ], mountError );
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
						File *tmpdev = u->u_MountedDevs;
						File *olddev = tmpdev;
						
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
								
								FHandler *remfs = tmpdev->f_FSys;
								if( remfs != NULL )
								{
									remfs->Release( remfs, tmpdev );
								}
								FileDelete( tmpdev );
								tmpdev = NULL;
								
								break;
							}
							olddev = tmpdev;
							tmpdev = (File *) tmpdev->node.mln_Succ;
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
			
			l->LibraryMYSQLDrop( l, sqllib );
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
			
			FHandler *remfs = tmpdev->f_FSys;
			if( remfs != NULL )
			{
				remfs->Release( remfs, tmpdev );
			}
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
