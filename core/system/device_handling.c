/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#include "device_handling.h"
#include <core/functions.h>
#include <util/string.h>
#include <system/handler/fsys.h>
#include <system/handler/dosdriver.h>

DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, char *name );
void DOSDriverDelete( DOSDriver *ddrive );

//
// Scan Filesystems directory
//

int RescanHandlers( SystemBase *l )
{
	if( pthread_mutex_lock( &l->mutex ) == 0 )
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
			pthread_mutex_unlock( &l->mutex );
			return 1;
		}

		strcpy( l->sl_FSysPath, tempString );
		// TODO: Used to be only /fsys
		strcat( l->sl_FSysPath, "/fsys/");
	
		INFO( "Trying to find filesystems in %s\n", l->sl_FSysPath );
	
		// all file systems will be avaiable in system.library folder/fsys/ subfolder

		d = opendir( l->sl_FSysPath );
	
		// TODO: Used to be only /fsys
		/*if( d == NULL )
		{
			// try to open files from libs/ directory
			strcpy( l->sl_FSysPath, tempString );
			strcat( l->sl_FSysPath, "/libs/fsys/");
			d = opendir( l->sl_FSysPath );
		}*/
	
	
		if( d != NULL )
		{
			while( ( dir = readdir( d ) ) != NULL )
			{
				sprintf( tempString, "%s%s", l->sl_FSysPath, dir->d_name );

				DEBUG(" %s fullFSYSpath %s\n", dir->d_name, tempString );

				FHandler *locsys = FHandlerCreate( tempString, dir->d_name );
				if( locsys != NULL )
				{
					INFO("New FileHandler added %s\n", locsys->GetPrefix() );
					if( l->sl_Filesystems == NULL )
					{
						l->sl_Filesystems = locsys;
					}
					else
					{
						locsys->node.mln_Succ = (MinNode *)l->sl_Filesystems;
						l->sl_Filesystems = locsys;
					}
				
					/*
					if( l->sl_Filesystems == NULL )
					{
						l->sl_Filesystems = locsys;
					}
					else
					{
						FSys *lmod = l->sl_Filesystems;

						while( lmod->node.mln_Succ != NULL )
						{
							lmod = (FSys *)lmod->node.mln_Succ;
							DEBUG("Parsing filesystems\n");
						}
						lmod->node.mln_Succ = (struct MinNode *)locsys;	// add new module to list
					}*/
				}
				else
				{
					DEBUG("Cannot load fsys %s\n", dir->d_name );
				}
			
			}

			closedir( d );
		}
		pthread_mutex_unlock( &l->mutex );
	}
	return 0;
}

//
// Scan DOSDrivers directory
//

int RescanDOSDrivers( SystemBase *l )
{
	if( pthread_mutex_lock( &l->mutex ) == 0 )
	{
		char *fhome = getenv( "FRIEND_HOME");
		char ddrivedirectory[ 1024 ];
		DIR           *d;
		struct dirent *dir;
	
		//
		// clear DOSDrivers
		//
		INFO("Scanning for DOSDrivers\n");
	
		DOSDriver * list = l->sl_DOSDrivers;
		while( list != NULL )
		{
			DOSDriver *fh = list;
			list = (DOSDriver *)list->node.mln_Succ;
			DOSDriverDelete( fh );
		}

		strcpy( ddrivedirectory, fhome );
		strcat( ddrivedirectory, "devices/DOSDrivers/");
	
		DEBUG( "Trying to find DOSDrivers in %s\n", ddrivedirectory );
	
		// all DOSDrivers will be avaiable in system.library folder/devices/DOSDrivers/ subfolder

		d = opendir( ddrivedirectory );
	
		if( d == NULL )
		{
			ERROR("RescanDOSDrivers: Cannot open directory %s\n", ddrivedirectory );
			pthread_mutex_unlock( &l->mutex );
			return 1;
		}
	
	
		while( ( dir = readdir( d ) ) != NULL )
		{
			char tempString[ 1024 ];
		
			sprintf( tempString, "%s%s", ddrivedirectory, dir->d_name );

			DEBUG(" %s DOSDriver %s\n", dir->d_name, tempString );

			DOSDriver *locd = DOSDriverCreate( l, tempString, dir->d_name );
			if( locd != NULL )
			{
				INFO("New DOSDriver added %s\n", locd->dd_Name );
				if( l->sl_DOSDrivers == NULL )
				{
					l->sl_DOSDrivers = locd;
				}
				else
				{
					locd->node.mln_Succ =(MinNode *) l->sl_DOSDrivers;
					l->sl_DOSDrivers = locd;
				}	
			}
			else
			{
				DEBUG("Cannot load DOSDriver %s\n", dir->d_name );
			}
		}
		closedir( d );
		pthread_mutex_unlock( &l->mutex );
	}	
	return 0;
}


//
// Mount device
//

int MountFS( struct SystemBase *l, struct TagItem *tl, File **mfile )
{
	if( pthread_mutex_lock( &l->mutex ) == 0 )
	{
		FHandler *filesys = NULL;
		DOSDriver *filedd = NULL;
		File *retFile = NULL;
		struct TagItem *ltl = tl;
		char *type = NULL;
		char *path = NULL;
		char *name = NULL;
		User *usr = NULL;
		ULONG dbid = 0;
		BOOL mount = FALSE;
	
		DEBUG("Mount device\n");
	
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
				case FSys_Mount_User:
					usr = (User *)ltl->ti_Data;
					break;
				case FSys_Mount_ID:
					dbid = (ULONG)ltl->ti_Data;
					break;
				case FSys_Mount_Mount:
					mount = (ULONG)ltl->ti_Data;
					break;
			}
		
			//DEBUG("Switch\n");
			ltl++;
		}
		DEBUG("End switch\n");
	
		if( type == NULL )
		{
			ERROR("[ERROR]: No type passed\n");
			l->sl_Error = FSys_Error_NOFSType;
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOFSType;
		}
	
		if( name == NULL )
		{
			ERROR("[ERROR]: No name passed\n");
			l->sl_Error = FSys_Error_NOName;
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOName;
		}
	
		if( usr == NULL )
		{
			ERROR("[ERROR]: No user passed, cannot mount device\n");
			l->sl_Error = FSys_Error_NOUser;
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOUser;
		}
		/*
		File *lf = usr->u_MountedDevs;

		while( lf != NULL )
		{
			if( strcmp( lf->f_Name, name ) == 0 )
			{
				usr = NULL;	// dont want to make another local variable
			}
			lf = (File *)lf->node.mln_Succ;
			DEBUG("Switch 2\n");
		}*/
	
		DEBUG("User is not null!\n");
	
		INFO("Mount Checking avaiable filesystem(%s)\n", name );
	
		//
		// Find installed filesystems by type
		DOSDriver *ddrive = (DOSDriver *)l->sl_DOSDrivers;
	//	FHandler *efsys = NULL;
		while( ddrive != NULL )
		{
			DEBUG("Mount check DOSDRIVERS FIND TYPE %s ddrivename %s\n", type, ddrive->dd_Name );
		
			if( strcmp( type, ddrive->dd_Name ) == 0 )
			{
				filesys = ddrive->dd_Handler;
				filedd = ddrive;
				break;
			}
			ddrive = (DOSDriver *)ddrive->node.mln_Succ;
		}

		DEBUG("Mount Filesystem found %p\n", filesys );
	
		File *f = NULL;
	
		if( usr->u_MountedDevs != NULL )
		{
			INFO( "Starting to check mounted devs!\n" );
			/*f = usr->u_MountedDevs;
			do
			{
				INFO("LEGACY CHECK NAME %s\n", f->f_Name );
				if( strcmp( name, f->f_Name ) == 0 )
				{
					INFO("Root device was on the list, mounted\n");
					f->f_Mounted = TRUE;
					return 0;
				}
			}
			while( ( f = f->node.mln_Succ ) != NULL );*/
		
			LIST_FOR_EACH( usr->u_MountedDevs, f )
			{
				INFO("CHECK NAME %s (%s)\n", f->f_Name, f->f_Mounted ? "mounted" : "not mounted" );
				if( strcmp( name, f->f_Name ) == 0 )
				{
					INFO("Root device was on the list, mounted (%s)\n", name );
					f->f_Mounted = mount;
					// Renew the session
					if( f->f_SessionID ) free( f->f_SessionID );
					f->f_SessionID = StringDuplicate( usr->u_SessionID );
					DEBUG( "Can we access caller?\n" );
					// Set structure to caller
					if( mfile ) *mfile = f;
					// Return no error
					DEBUG( "Ok, returning now, because this was ok... :)\n" );
					pthread_mutex_unlock( &l->mutex );
					return 0;
				}
			}
		}
	
		//
		// If FHandler not found return NULL
	
		if( filesys == NULL )
		{
			ERROR("[ERROR]: Cannot find FSys: %s\n", name );
			l->sl_Error = FSys_Error_NOFSAvaiable;
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOFSAvaiable;
		}
	
		INFO("Localtype %s DDriverType %s\n", type, filedd->dd_Type );
	
		retFile = filesys->Mount( filesys, tl );
	
		if( retFile != NULL )
		{
			retFile->f_ID = dbid;
			retFile->f_Mounted = mount;
		
			File *lfile = usr->u_MountedDevs;
			if( lfile == NULL )
			{
				usr->u_MountedDevs = retFile;
				DEBUG("Device added to start of the list %s\n", retFile->f_Name );
			}
			else
			{
				LIST_ADD_HEAD( usr->u_MountedDevs, retFile );

				DEBUG("Device added to the list\n");
			}
		
			char *prefix = filesys->GetPrefix();
			retFile->f_FSysName = StringDuplicateN( prefix, strlen( prefix ) );
		
			if( mfile )
			{
				*mfile = retFile;
			}
		
			INFO( "Device '%s' mounted successfully\n", name );
		}
		else
		{
			l->sl_Error = FSys_Error_NOFSAvaiable;
			ERROR("Device not mounted name %s type %s\n", name, type );
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOFSAvaiable;
		}
	
		DEBUG("Mount device END\n");
		pthread_mutex_unlock( &l->mutex );
	}
	return 0;
}

//
// UnMount device
//

int UnMountFS( struct SystemBase *l, struct TagItem *tl )
{
	if( pthread_mutex_lock( &l->mutex ) == 0 )
	{
		int result = 0;
	
		DEBUG("UnMount device\n");
	
		struct TagItem *ltl = tl;
		char *name = NULL;
		User *usr = NULL;
		//int found = 0;
		l->sl_Error = 0;

		//
		// Get FSys Type to mount
	
		while( ltl->ti_Tag != TAG_DONE )
		{
			switch( ltl->ti_Tag )
			{
				case FSys_Mount_Name:
					name = (char *)ltl->ti_Data;
				break;
				case FSys_Mount_User:
					usr = (User *)ltl->ti_Data;
				break;
			}
		
			ltl++;
		}
	
		if( name == NULL )
		{
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOName;
		}
	
		if( usr == NULL )
		{
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NOUser;
		}
	
		DEBUG("Unmount before checking users\n");
	
		User *lu = l->sl_Sessions;
		while( lu != NULL )
		{
			INFO("Unmounting checking users %s\n", lu->u_Name );
		
			File *lf = lu->u_MountedDevs;
			while( lf != NULL )
			{
				INFO("Device %s\n", lf->f_Name );
				lf = (File *)lf->node.mln_Succ;
			}
		
			lu = (User *)lu->node.mln_Succ;
		}
	
		LIST_FOR_EACH( l->sl_Sessions, lu )
		{
			if( strcmp( usr->u_Name, lu->u_Name ) == 0 )
			{
				break;
			}
			lu = (User *)lu->node.mln_Succ;
		}
	
		if( lu == NULL )
		{
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_UserNotLoggedIn;
		}
	
		DEBUG("Unmount user found, checking devices\n");
	
		File *lf = lu->u_MountedDevs;
		File *lastone = NULL;
		File *remdev = NULL;
		if( lf == NULL )
		{
			ERROR( "Seems we have NO mounted devs for user %s!\n", lu->u_Name );
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_NODevForUser;
		}
	
		while( lf != NULL )
		{
			DEBUG( "Checking fs in list %s == %s...\n", lf->f_Name, name );
			if( strcmp( lf->f_Name, name ) == 0 )
			{
				DEBUG( "Found one (%s == %s)\n", lf->f_Name, name );
				remdev = lf;
				break;
			}
			lastone = lf;
			lf = (File *)lf->node.mln_Succ;
		}
	
		if( remdev != NULL )
		{
			DEBUG("Unmount device found, unmounting\n");
		
			DEBUG("UnMount device2\n");
			FHandler *fsys = (FHandler *)remdev->f_FSys;

			if( fsys->UnMount( remdev->f_FSys, remdev ) != 0 )
			{
				ERROR("ERROR: Cannot unmount device\n");
			
				pthread_mutex_unlock( &l->mutex );
				return FSys_Error_CannotUnmountDevice;
			}
		
			if( lu->u_MountedDevs == remdev )		// checking if its our first entry
			{
				File *next = (File*)remdev->node.mln_Succ;
				lu->u_MountedDevs = (File *)next;
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
		
			if( remdev->f_SessionID )
			{
				free( remdev->f_SessionID );
			}
		
			if( remdev->f_FSysName )
			{
				free( remdev->f_FSysName );
			}
			free( remdev );
		
			DEBUG("UnMount device3\n");
			//free( remdev );	//unmount free
		}
		else
		{
			pthread_mutex_unlock( &l->mutex );
			return FSys_Error_DeviceNotFound;
		}
	
		DEBUG("UnMount device END\n");
		pthread_mutex_unlock( &l->mutex );
		return result;
	}
	return -1; // Need to make error case for this..
}


//
// Get DOSDrive and path by path
//

// NB: This one is not thread safe. Lock mutex before use!
File *GetFileByPath( User *usr, char **dstpath, const char *path )
{
	
	File *fhand = NULL;
	char ddrivename[ 256 ];

	int dpos = doublePosition( path );
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
		ERROR("Path is not correct\n");
		return NULL;
	}

	*dstpath = (char *)&path[ dpos + 1 ];
	DEBUG("Get handle by path!\n");

	File *ldr = usr->u_MountedDevs;
	while( ldr != NULL )
	{ 
		DEBUG("GETHANDLER BY %s - %s\n", ldr->f_Name, ddrivename );
		if( strcmp( ldr->f_Name, ddrivename ) == 0 )
		{
			fhand = ldr;
			break;
		}
	
		ldr = (File *) ldr->node.mln_Succ;
	}
	return fhand;
}

//
// mount device in database
//

int DeviceMountDB( SystemBase *l, File *rootDev, BOOL mount )
{
	if( pthread_mutex_lock( &l->mutex ) == 0 )
	{
		MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
		Filesystem *filesys = NULL;
		User *owner = (User *)rootDev->f_User;
	
		char where[ 1024 ];
		int entries;
		sprintf( where, " f.UserID = '%ld' AND LOWER(f.Name) = LOWER('%s')", owner->u_ID, rootDev->f_Name );
	
		filesys = sqllib->Load( sqllib, FilesystemDesc, where, &entries );
		if( filesys != NULL )
		{
			filesys->fs_Mounted = mount;
			int error = 0;
		
			if( ( error = sqllib->Save( sqllib, FilesystemDesc, filesys ) ) != 0 )
			{
				ERROR("Cannot update entry to database, code %d\n", error );
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
					ERROR("Cannot add entry to database, code %d\n", error );
				}
				else
				{
					INFO("Filesystem %s added to database\n", rootDev->f_Name );
				}
			
				FFree( filesys );
			}
		}
	
	
		char temptext[ 1024 ];
		sprintf( temptext, "SELECT * FROM `Filesystem` f WHERE f.UserID = '%ld' AND f.Name = '%s'", owner->u_ID, rootDev->f_Name );
	
		MYSQL_RES *res = sqllib->Select( sqllib, temptext );
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
		pthread_mutex_unlock( &l->mutex );
	}	
	return 0;
}

