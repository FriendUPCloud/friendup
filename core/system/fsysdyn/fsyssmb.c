/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <system/systembase.h>
#include <util/log/log.h>
#include <sys/stat.h>
#include <util/buffered_string.h>
#include <dirent.h>
#include <util/string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <system/datatypes/images/image.h>
#include <system/datatypes/images/png.h>
#include <libsmbclient.h> 

#define SUFFIX "fsys"
#define PREFIX "smb"


//
// special structure
//

typedef struct SpecialData
{
	SystemBase			*sb;
	int					fd;
	SMBCCTX				*ctx;
	
	char				*temp;
	char				*server;
	char				*share;
	char				*workgroup;
	char				*username;
	char				*password;
	int					port;
} SpecialData;

//
//
//

void SDDelete( SpecialData *sd )
{
	if( sd == NULL )
	{
		return;
	}
	
	if( sd->temp != NULL )
	{
		FFree( sd->temp );
	}

	if( sd->server != NULL )
	{
		FFree( sd->server );
	}

	if( sd->share != NULL )
	{
		FFree( sd->share );
	}

	if( sd->workgroup != NULL )
	{
		FFree( sd->workgroup );
	}
	
	if( sd->username != NULL )
	{
		FFree( sd->username );
	}

	if( sd->password != NULL )
	{
		FFree( sd->password );
	}
	
	//smbc_close( sd->ctx->f ->fd );
	//libsmbc->fd = -1;
  
	if( sd->ctx != NULL )
	{
		smbc_free_context( sd->ctx, 1 );
	}
	FFree( sd );
}

const char *GetSuffix()
{
	return SUFFIX;
}

const char *GetPrefix()
{
	return PREFIX;
}


static void get_auth_data_fn( SMBCCTX * context, const char * pServer,
 const char * pShare,
 char * pWorkgroup,
 int maxLenWorkgroup,
 char * pUsername,
 int maxLenUsername,
 char * pPassword,
 int maxLenPassword )
{
	static int krb5_set = 1;
	SpecialData *sd = NULL;
	
	if( context != NULL )
	{
		sd = smbc_getOptionUserData( context );
		//printf(" with user data %s", user_data);
	}

	if( strcmp( sd->server, pServer ) == 0 &&
		strcmp( sd->share, pShare ) == 0 &&
		sd->workgroup != NULL &&
		sd->username != NULL )
	{
		strncpy( pWorkgroup, sd->workgroup, maxLenWorkgroup - 1);
		strncpy( pUsername, sd->username, maxLenUsername - 1);
		strncpy( pPassword, sd->password, maxLenPassword - 1);
		return;
	}

	if( krb5_set && getenv("KRB5CCNAME") )
	{
		krb5_set = 0;
		return;
	}

	DEBUG("Workgroup: [%s] \n", pWorkgroup);

	if( sd->workgroup != NULL )
	{
		strncpy(pWorkgroup, sd->workgroup, maxLenWorkgroup - 1);
	}
	
	DEBUG( "Username: [%s] \n", pUsername);
	if( sd->username != NULL )
	{
		strncpy( pUsername, sd->username, maxLenUsername - 1 );
	}

	if( sd->password != NULL )
	{
		strncpy( pPassword, sd->password, maxLenPassword - 1 );
	}
	
	krb5_set = 1;
}

//
// like ssh2fs, smb cannot do login in same time
//

typedef struct HandlerData
{
	pthread_mutex_t					hd_Mutex;
	int initialized;
}HandlerData;

//
// additional stuff
//


char* StringDup( const char* str )
{
	if( str == NULL)
	{
		//DEBUG("Cannot copy string!\n");
		return NULL;
	}
	
	int len = strlen( str );
	char *res = NULL;
	if( ( res = calloc( len+1, sizeof(char) ) ) != NULL )
	{
		strcpy( res, str );
	}
	
	return res;
}

//
// Get filename from path
//

char *GetFileName( const char *path )
{
	char *p = (char *)path;
	int i = strlen( path );

	for(  ; i >= 0 ; i-- )
	{
		if( path[ i ] == '/' )
		{
			p = (char *)&path[ i+1 ];
			return p;
		}
	}
	
	return p;
}

//
//
//

void init( struct FHandler *s )
{
	if( s )
	{
		s->fh_SpecialData = FCalloc( 1, sizeof( HandlerData ) );
		HandlerData *hd = (HandlerData *)s->fh_SpecialData;
		hd->initialized = 0;
		pthread_mutex_init( &hd->hd_Mutex, NULL );
		DEBUG("[FSYSSMB] init\n");
	}
}

//
//
//

void deinit( struct FHandler *s )
{
	HandlerData *hd = (HandlerData *)s->fh_SpecialData;
	pthread_mutex_destroy( &hd->hd_Mutex );
	FFree( hd );
	DEBUG("[FSYSSMB] deinit\n");
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, UserSession *usrs, char **mountError )
{
	//FERROR("Disabled for a moment\n");
	//return NULL;
	
	File *dev = NULL;
	char *path = NULL, *ulogin = NULL, *upass = NULL;
	char *name = NULL, *host = NULL;
	int port;
	SystemBase *sb = NULL;
	char *usersPath = "smb://localhost/home/";	// example path
	
	if( s == NULL )
	{
		return NULL;
	}
	
	HandlerData *hd = (HandlerData *)s->fh_SpecialData;
	
	DEBUG("[SAMBA] Mounting samba filesystem!\n");
	
	if( ( dev = FCalloc( 1, sizeof( File ) ) ) != NULL )
	{
		struct TagItem *lptr = ti;
		
		//
		// checking passed arguments
		
		while( lptr->ti_Tag != TAG_DONE )
		{
			switch( lptr->ti_Tag )
			{
				case FSys_Mount_Path:
					path = (char *)lptr->ti_Data;
					DEBUG("[SAMBA] Mount FS path set '%s'\n", path );
					break;
				case FSys_Mount_Server:
					host = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_Port:
					port = atol( (char *)lptr->ti_Data );
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_SysBase:
					sb = (SystemBase *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginUser:
					ulogin = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginPass:
					upass = (char *)lptr->ti_Data;
					break;
			}
		
			lptr++;
		}
		
		//
		
		if( host == NULL )//path == NULL || host == NULL || strlen( path ) == 0 )
		{
			FERROR("[ERROR]: Host option not found!\n");
			FFree( dev );
			return NULL;
		}
		
		dev->f_SpecialData = FCalloc( 1, sizeof(SpecialData) );
		SpecialData *locsd = (SpecialData *)dev->f_SpecialData;
		
		locsd->sb = sb;
		
		// we are trying to find if workgroup is in login field
		// if it is we create workgroup variable
		unsigned int i;
		char *wrkgr = NULL;
		for( i=0 ; i < strlen( ulogin ) ; i++ )
		{
			if( ulogin[ i ] == '/' )
			{
				ulogin[ i ] = 0;
				wrkgr = &(ulogin[i+1]);
			}
		}
		
		locsd->username = StringDup( ulogin );
		if( wrkgr != NULL )
		{
			locsd->workgroup = StringDup( wrkgr );
		}
		locsd->password = StringDup( upass );
		locsd->server = StringDup( host );
		locsd->share = StringDup( path );
		locsd->port = port;
		
		locsd->ctx = smbc_new_context();
		if( locsd->ctx == NULL )
		{
			SDDelete( locsd );
			FFree( dev );
			return NULL;
		}
		
		if( !smbc_init_context( locsd->ctx ) )
		{
			SDDelete( locsd );
			FFree( dev );
			return NULL;
		}
		smbc_set_context( locsd->ctx );

		smbc_setOptionUserData( locsd->ctx, locsd );
		smbc_setFunctionAuthDataWithContext( locsd->ctx, get_auth_data_fn );
		DEBUG("[SAMBA] Before samba init\n");
		if( smbc_init( NULL, 0 ) < 0 )
		{
			SDDelete( locsd );
			FFree( dev );
			FERROR("[SAMBA] init fail\n");
			return NULL;
		}
		
		int plen = strlen( path );
		int hlen = strlen( host );
		
		if( ( dev->f_Path = FCalloc( plen+hlen+16, sizeof(char) ) ) != NULL )
		{
			if( path != NULL )
			{
				if( strlen( path ) > 0 )
				{
					snprintf( dev->f_Path, plen+hlen+16, "smb://%s/%s/", host, path );
				}
				else
				{
					snprintf( dev->f_Path, plen+hlen+16, "smb://%s/", host );
				}
			}
			else
			{
				snprintf( dev->f_Path, plen+hlen+16, "smb://%s/", host );
			}
		}
		
		DEBUG("[SAMBA] HOST %s PATH %s both %s\n", host, path, dev->f_Path );
		
		//SMBCFILE *dh = NULL;
		int dh;
		
		smbc_opendir_fn opdir = smbc_getFunctionOpendir( locsd->ctx );
		smbc_closedir_fn closef = smbc_getFunctionClosedir( locsd->ctx );
		
		//if( ( dh = opdir( locsd->ctx, dev->f_Path ) ) == NULL )
		if( ( dh = smbc_opendir( dev->f_Path ) ) < 0 )
		{
			//sb->sl_Error;
			
			FERROR("[SAMBA] Opendir fail! Path: %s\n", dev->f_Path );
			SDDelete( locsd );
			FFree( dev );
			return NULL;
		}
		smbc_closedir( dh );
		//closef( locsd->ctx, dh );
		
		DEBUG("[SAMBA] path is ok '%s'\n", dev->f_Path );
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usrs->us_User;
		dev->f_Name = StringDup( name );
	}
	
	DEBUG("[SAMBA] mount ok\n");
	
	return dev;
}

//
// Only free device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[SAMBA] Release\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			SDDelete( lf->f_SpecialData );
		}

		return 0;
	}
	return -1;
}

//
// Unmount device
//

int UnMount( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[SAMBA] Unmount\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			
			SDDelete( lf->f_SpecialData );
		}
		return 0;
	}
	return -1;
}

//
// Open file
//

// compilation warning
int lstat(const char *path, struct stat *buf);

void *FileOpen( struct File *s, const char *path, char *mode )
{
	DEBUG("[SAMBA] FileOpen\n");
	// Make relative path
	int pathsize = strlen( path );
	char *commClean = FCalloc( pathsize+10, sizeof( char ) );
	
	int i = 0;
	for( i=0 ; i < pathsize ; i++ )
	{
		if( path[ i ] == ':' )
		{
			break;
		}
	}
	
	if( i < pathsize )
	{
		strcpy( commClean, &(path[ i+1 ]) );
	}
	else
	{
		strcpy( commClean, path );
	}

	int spath = pathsize;//strlen( path );		//commClean before
	int rspath = strlen( s->f_Path );
	File *locfil = NULL;
	char *comm = FCalloc( rspath + spath + 5, sizeof( char ) );
	
	//DEBUG(" comm---size %d\n", rspath + spath + 5 );

	// Create a string that has the real file path of the file
	if( comm != NULL )
	{
		int fd = 0;
		
		if( s->f_Path[ rspath-1 ] == '/' )
		{
			sprintf( comm, "%s%s", s->f_Path, commClean );
		}
		else
		{
			sprintf( comm, "%s/%s", s->f_Path, commClean );
		}
	
		// Make the directories that do not exist
		int slashes = 0, i = 0; for( ; i < spath; i++ )
		{
			if( commClean[i] == '/' )
				slashes++;
		}

		int off = 0, slash = 0;
		if( mode[ 0 ] == 'w' )
		{
			for( i = 0; i < spath; i++ )
			{
				if( commClean[i] == '/' )
				{
					int alsize = rspath + i + 1;
					char *directory = FCalloc( alsize , sizeof( char ) );
					if( directory != NULL )
					{
						snprintf( directory, alsize, "%s%.*s", s->f_Path, i, commClean );

						struct stat filest;
				
						// Create if not exist!
						DEBUG( "Testing if directory exists: %s\n", directory );
						if( smbc_stat( directory, &filest ) == -1 )
						//if( stat( directory, &filest ) == -1 )
						{
							//DEBUG( "Didn't exist: creating dir: %s\n", directory );
							//mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
							smbc_mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
						}
				
						FFree( directory );
					}
					slash++;
				}
			}
		}
		
		FFree( commClean );

		commClean = NULL;

		//
		// read stream
		//
			
		if( strcmp( mode, "rs" ) == 0 )
		{
			//f = fopen( comm, "rb" );
			fd = smbc_open( comm, O_RDONLY, 0666 );
		}
		else
		{
			//f = fopen( comm, mode );
			if( mode[ 0 ] == 'w' )
			{
				fd = smbc_open( comm, O_WRONLY|O_CREAT, 0666 );
			}
			else
			{
				fd = smbc_open( comm, O_RDONLY, 0666 );
			}
		}
		
		if( fd >= 0 )
		{
			// Ready the file structure
			if( ( locfil = FCalloc( sizeof( File ), 1 ) ) != NULL )
			{
				locfil->f_Path = StringDup( path );
			
				locfil->f_SpecialData = FCalloc( sizeof( SpecialData ), 1 );
				
				locfil->f_Stream = s->f_Stream;
			
				SpecialData *sd = (SpecialData *)locfil->f_SpecialData;
			
				if( sd )
				{
					SpecialData *locsd = (SpecialData *)s->f_SpecialData;
					sd->sb = locsd->sb;
					sd->fd = fd;
				}

				// Free temp string
				FFree( comm );
			
				return locfil;
			}
			FFree( comm );
			return NULL;
		}
		else
		{
			FERROR("Cannot open file: %s  mode %s\n", comm, mode );
		}
		FFree( comm );
	}
	
	// Free commClean
	if( commClean )
	{
		FFree( commClean );
	}

	FERROR("Cannot open file %s\n", path );
	
	return NULL;
}

//
// Close File
//

int FileClose( struct File *s, void *fp )
{	
	if( fp != NULL )
	{
		int close = 0;
		
		File *lfp = ( File *)fp;
		
		if( lfp->f_SpecialData )
		{
			SpecialData *sd = ( SpecialData *)lfp->f_SpecialData;
			//close = fclose( ( FILE *)sd->fp );
			close = smbc_close( sd->fd );
			free( lfp->f_SpecialData );
		}
		
		if( lfp->f_Path ) free( lfp->f_Path );
		if( lfp->f_Buffer ) free( lfp->f_Buffer );
		free( lfp );
		
		DEBUG( "[SAMBA]: Closing file pointer.\n" );
		
		return close;
	}
	
	return - 1;
}

//
// Read data from file
//

int FileRead( struct File *f, char *buffer, int rsize )
{
	int result = -2;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd != NULL )
	{
		result = smbc_read( sd->fd, buffer, rsize );
		DEBUG("[SMBFS]:File Read %d\n", result );
		
		if( f->f_Stream == TRUE )
		{
			sd->sb->sl_SocketInterface.SocketWrite( f->f_Socket, buffer, (FLONG)result );
		}
		
		if( result == 0 )	// if smb return 0 then its the end of the file
		{
			return -1;
		}
	}
	
	return result;
}

//
// write data to file
//

int FileWrite( struct File *f, char *buffer, int wsize )
{
	int result = -1;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd )
	{
		result = smbc_write( sd->fd, buffer, wsize );
		//result = fwrite( buffer, 1, wsize, sd->fp );
	}
	//return fwrite( b, size, 1, fp );
	return result;
}

//
// seek
//

int FileSeek( struct File *s, int pos )
{
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	if( sd )
	{
		return smbc_lseek( sd->fd, pos, SEEK_SET );
		//return fseek( sd->fp, pos, SEEK_SET );
	}
	return -1;
}

//
// GetDiskInfo
//

int GetDiskInfo( struct File *s, int64_t *used, int64_t *size )
{
	*used = 0;
	*size = 0;
	return 0;
}

//
// make directory in local file system
//

int MakeDir( struct File *s, const char *path )
{
	DEBUG("[SAMBAMakeDir]\n");
	int error = 0;
	
	int rspath = strlen( s->f_Path );
	int spath = strlen( path )+1;
	char *newPath;
	
	if( ( newPath = FCalloc( rspath+10, sizeof(char) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for new path\n");
		return -2;
	}
	
	strcpy( newPath, s->f_Path );
	if( s->f_Path[ rspath-1 ] != '/' )
	{
		strcat( newPath, "/" );
	}
	
	DEBUG("----------------------> '%s'\n", path );
	
	// Create a string that has the real file path of the file
	if( path != NULL )
	{
		char *directory = FCalloc( rspath + spath, sizeof( char ) );
		if( directory != NULL )
		{
			// Make the directories that do not exist
			int slashes = 0, i = 0; for( ; i < spath; i++ )
			{
				if( path[i] == '/' )
				{
					slashes++;
				}
			}

			if( slashes > 0 )
			{
				int off = 0, slash = 0;
				for( i = 0; i < spath; i++ )
				{
					if( path[i] == '/' )
					{
						sprintf( directory, "%s%.*s", newPath, i, path );

						struct stat filest;
				
						// Create if not exist!
						if( smbc_stat( directory, &filest ) == -1 )
						{
							smbc_mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
							DEBUG( "Making directory %s\n", directory );
						}
						else if( S_ISREG( filest.st_mode) )
						{
							FERROR( "Cannot create directory: %s, it is a file probably.\n", directory );
							error = 0; // there is no error if directory exist
						}
						else
						{
						}
					}
					slash++;
				}
			}
			//
			// We created directories to sign '/'
			// Now we create directory for fullpath
			//else
			//{

			struct stat filest;
				
			sprintf( directory, "%s%s", newPath, path );
			smbc_mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
				
			if( smbc_stat( directory, &filest ) == 0 )
			{
				mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
				DEBUG( "Making directory %s\n", directory );
			}
			else
			{
				INFO( "Cannot create directory: %s , fullpath\n", directory );
				error = 0;
			}
			FFree( directory );
		}
		FFree( newPath );
		return error;
	}
	FFree( newPath );
	
	return -1;
}

//
// rm files/dirs
//

FLONG RemoveDirectorySAMBA( SpecialData *sdat, const char *path )
{
	size_t path_len = strlen( path );
	FLONG r = 0;
	
	smbc_unlink_fn unlfun = smbc_getFunctionUnlink( sdat->ctx );
	smbc_readdir_fn readdfun = smbc_getFunctionReaddir( sdat->ctx );
	smbc_closedir_fn closedfun = smbc_getFunctionClosedir( sdat->ctx );
	smbc_opendir_fn opendfun = smbc_getFunctionOpendir( sdat->ctx );

	//int dh = smbc_opendir( path );
	//if( dh >= 0 )
	SMBCFILE *dh = opendfun( sdat->ctx, path );
	if( dh != NULL )
	{
		struct smbc_dirent *sdir = NULL;
		r = 0;

		while( TRUE )
		{
			char *buf;
			size_t len;
			
			// sdir = smbc_readdir( dh );
			sdir = readdfun( sdat->ctx, dh );
			if( !sdir )
			{
				break;
			}
			
			DEBUG("[SAMBA]: in directory %s\n", sdir->name );

			/* Skip the names "." and ".." as we don't want to recurse on them. */
			if( !strcmp( sdir->name, ".") || !strcmp( sdir->name, ".." ) )
			{
				continue;
			}

			len = path_len + strlen( sdir->name ) + 2; 
			buf = FCalloc(len , sizeof(char));

			if( buf != NULL )
			{
				struct stat statbuf;

				snprintf(buf, len, "%s/%s", path, sdir->name);
				DEBUG("To delete: %s\n", buf );

				if( smbc_stat( buf, &statbuf ) == 0 )
				{
					if (S_ISDIR(statbuf.st_mode))
					{
						r += RemoveDirectorySAMBA( sdat, buf );
					}
					else
					{
						r += statbuf.st_size;
						//smbc_unlink( buf );
						unlfun( sdat->ctx, path );
					}
				}
				FFree(buf);
			}
		}
		//smbc_closedir( dh );
		closedfun( sdat->ctx, dh );

		//smbc_unlink( path );
		unlfun( sdat->ctx, path );
	}
	else // file
	{
		DEBUG("Remove file %s\n", path );
		
		struct stat statbuf;
		if( smbc_stat( path, &statbuf ) == 0 )
		{
			r += statbuf.st_size;
		}
		//smbc_unlink( path );
		unlfun( sdat->ctx, path );
	}

	return r;
}

//
// Delete
//

FLONG Delete( struct File *s, const char *path )
{
	DEBUG("[SAMBA] start!\n");
	
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	char *comm = NULL;
	
	DEBUG("[SAMBA] new path size %d\n", rspath + spath );
	
	if( ( comm = FCalloc( rspath + spath + 10, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		
		if( comm[ strlen( comm ) -1] != '/' )
		{
			strcat( comm, "/" );
		}
		strcat( comm, path );
	
		DEBUG("[SAMBA] file or directory '%s'\n", comm );
	
		FLONG ret = RemoveDirectorySAMBA( s->f_SpecialData, comm );

		FFree( comm );
		return ret;
	}
	
	DEBUG("[SAMBA] END\n");
	
	return 0;
}

//
// Rename
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("[SAMBA] Rename!\n");
	char *newname = NULL;
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	// 1a. is the source a folder? If so, remove trailing /
	char *targetPath = NULL;
	
	if( path[spath-1] == '/' )
	{
		targetPath = FCalloc( spath, sizeof( char ) );
		sprintf( targetPath, "%.*s", spath - 1, path );
	}
	else
	{
		targetPath = FCalloc( spath + 1, sizeof( char ) ); 
		sprintf( targetPath, "%.*s", spath, path );
	}
	
	// 1b. Do we have a sub folder in path?
	int hasSubFolder = 0;
	int off = 0;
	int c = 0; for( ; c < spath; c++ )
	{
		if( targetPath[c] == '/' )
		{
			hasSubFolder++;
			off = c + 1;
		}
	}
	
	// 2. Full path of source
	char *source = FCalloc( rspath + spath + 1, sizeof( char ) );
	sprintf( source, "%s%s", s->f_Path, targetPath );
	
	// 3. Ok if we have sub folder or not, add it to our destination
	char *dest = NULL;
	if( hasSubFolder > 0 )
	{
		dest = FCalloc( rspath + off + strlen( nname ) + 1, sizeof( char ) );
		sprintf( dest, "%.*s", rspath, s->f_Path );
		sprintf( dest + rspath, "%.*s", off, targetPath );
		sprintf( dest + rspath + off, "%s", nname );
	}
	else 
	{
		dest = FCalloc( rspath + strlen( nname ) + 1, sizeof( char ) );
		sprintf( dest, "%s", s->f_Path );
		sprintf( dest + rspath, "%s", nname );
	}
	
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	DEBUG( "[SAMBA] executing: rename %s %s\n", source, dest );
	
	smbc_rename_fn renfun = smbc_getFunctionRename( sdat->ctx );
	int res = renfun( sdat->ctx, source, sdat->ctx, dest );
	
	//int res = smbc_rename( source, dest );
	
	// 5. Free up
	FFree( source );
	FFree( dest );
	FFree( targetPath );
	
	return res;
}


//
// Copy file from source to destination
//

int Copy( struct File *s, const char *dst, const char *src )
{
	DEBUG("[SAMBA] Copy!\n");
	
	return 0;
}

//
// Execute file
//

#define BUFFER_SIZE 1024

FILE *popen( const char *c, const char *r );

char *Execute( struct File *s, const char *path, const char *args )
{
	return NULL;
}

//
// Fill buffer with data from stat
//

void FillStatSAMBA( BufString *bs, struct stat *s, File *d, const char *path )
{
	char tmp[ 1024 ];
	int rootSize = strlen( d->f_Path );
	int pathSize = strlen( path );
	
	SpecialData *sd = (SpecialData *)d->f_SpecialData;
	SystemBase *sb = (SystemBase *)sd->sb;
	
	char *fname;
	char *tptr = GetFileName( path );
	
	if( ( fname = sb->sl_StringInterface.EscapeStringToJSON( tptr ) ) == NULL )
	{
		fname = tptr;
	}
	
	BufStringAdd( bs, "{" );
	snprintf( tmp, 1023, " \"Filename\":\"%s\",",fname );
	BufStringAdd( bs, tmp );
	
	//DEBUG( "FILLSTAT filename set\n");
	
	if( rootSize != pathSize )
	{
		char *tmpname;
		char *pptr = (char *)&path[ strlen( d->f_Path ) ];
		if( ( tmpname = sb->sl_StringInterface.EscapeStringToJSON( pptr ) ) == NULL )
		{
			tmpname = pptr;
		}
		if( S_ISDIR( s->st_mode ) )
		{
			snprintf( tmp, 1023, "\"Path\":\"%s/\",", tmpname );
		}
		else
		{
			snprintf( tmp, 1023, "\"Path\":\"%s\",", tmpname );
		}
		if( tmpname != pptr )
		{
			FFree( tmpname );
		}
	}
	else
	{
		char *tmpname;
		if( ( tmpname = sb->sl_StringInterface.EscapeStringToJSON( d->f_Name ) ) == NULL )
		{
			tmpname = d->f_Name;
		}
		snprintf( tmp, 1023, "\"Path\":\"%s:\",", tmpname );
		if( tmpname != d->f_Name )
		{
			FFree( tmpname );
		}
	}

	BufStringAdd( bs, tmp );
	snprintf( tmp, 1023, "\"Filesize\": %ld,", s->st_size );
	BufStringAdd( bs, tmp );
	
	char *timeStr = FCalloc( 40, sizeof( char ) );
	strftime( timeStr, 36, "%Y-%m-%d %H:%M:%S", localtime( &s->st_mtime ) );
	snprintf( tmp, 1023, "\"DateModified\": \"%s\",", timeStr );
	BufStringAdd( bs, tmp );
	strftime( timeStr, 36, "%Y-%m-%d %H:%M:%S", localtime( &s->st_ctime ) );
	snprintf( tmp, 1023, "\"DateCreated\": \"%s\",", timeStr );
	BufStringAdd( bs, tmp );
	FFree( timeStr );
	
	if( S_ISDIR( s->st_mode ) )
	{
		BufStringAdd( bs,  "\"MetaType\":\"Directory\",\"Type\":\"Directory\" }" );
	}
	else
	{
		BufStringAdd( bs, "\"MetaType\":\"File\",\"Type\":\"File\" }" );
	}
	
	if( fname != tptr )
	{
		FFree( fname );
	}
}

//
// Get information about last file changes (seconds from 1970)
//

FLONG GetChangeTimestamp( struct File *s, const char *path )
{
	DEBUG("[SAMBA] Info!\n");
	FLONG ret = -1;
	
	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( s->f_Path );
	
	DEBUG("[SAMBA] Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("[SAMBA] Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );

		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}

		if( path != NULL )
		{
			strcat( comm, path );
		}
			
		DEBUG("[SAMBA] PATH created %s\n", comm );
	
		struct stat ls;
		
		if( smbc_stat( comm, &ls ) == 0 )
		{
			DEBUG("[SAMBA] file stat %s\n", comm );
			ret = (FLONG)ls.st_mtimensec;
			
		}
		else
		{
			DEBUG("[SAMBA] file stat FAIL %s\n", comm );
		}
		
		FFree( comm );
	}
	
	DEBUG("[SAMBA] Info END\n");

	return (FLONG)ret;
}

//
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("[SAMBA] Info!\n");
	
	BufString *bs = BufStringNew();
	
	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( s->f_Path );
	
	BufStringAdd( bs, "ok<!--separate-->");
	
	DEBUG("[SAMBA] Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("[SAMBA] Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	int globlen = rspath + spath + 512;
	
	if( ( comm = FCalloc( globlen, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );

		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}

		if( path != NULL )
		{
			strcat( comm, path );
		}
			
		DEBUG("[SAMBA] PATH created %s\n", comm );
	
		struct stat ls;
		
		if( smbc_stat( comm, &ls ) == 0 )
		{
			DEBUG("[SAMBA] file stat %s\n", comm );
			FillStatSAMBA( bs, &ls, s, comm );
		}
		else
		{
			SpecialData *locsd = (SpecialData *)s->f_SpecialData;
			SystemBase *l = (SystemBase *)locsd->sb;
			DEBUG("[SAMBA] file stat FAIL %s\n", comm );
			
			globlen += 512;
			char *buffer = FMalloc( globlen );
			int size = 0;
			if( buffer != NULL )
			{
				size = snprintf( buffer, globlen, "{ \"response\": \"%s\", \"code\":\"%d\",\"path\":\"%s\" }", l->sl_Dictionary->d_Msg[DICT_FILE_OR_DIRECTORY_DO_NOT_EXIST] , DICT_FILE_OR_DIRECTORY_DO_NOT_EXIST, comm );
			
				BufStringAddSize( bs, buffer, size );
				FFree( buffer );
			}
			//BufStringAdd( bs, "{ \"response\": \"File or directory do not exist\"}" );
		}
		
		FFree( comm );
	}
	
	DEBUG("[SAMBA] Info END\n");
	
	return bs;
}

//
// Call a library
//

BufString *Call( File *s, const char *path, char *args )
{
	DEBUG("[SAMBA] Call!\n");
	BufString *bs = BufStringNew();
	BufStringAdd( bs, "fail<!--separate-->");	
	DEBUG("[SAMBA] Call END\n");
	return bs;
}

//
// return content of directory
//
	
BufString *Dir( File *s, const char *path )
{
	BufString *bs = BufStringNew();
	
	int rspath = strlen( s->f_Path );
	
	DEBUG("[SAMBA] Dir!\n");
	
	// user is trying to get access to not his directory

	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	char *tempString = FCalloc( rspath +512, sizeof(char) );
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		DEBUG("-------------- %s-----------\n", s->f_Path );
		strcpy( comm, s->f_Path );
		if( comm[ strlen( comm ) -1 ] != '/' && s->f_Path[ strlen(s->f_Path)-1 ] != '/' )
		{
			DEBUG("[SAMBA] Added '/\n");
			strcat( comm, "/" );
		}
		
		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}
		
 		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			DEBUG("[SAMBA] end was not endeed /\n");
			strcat( comm, "/" );
		}
	
		//SMBCFILE *dh = NULL;
		int dh = 0;
		struct smbc_dirent *sdir = NULL;
		
		DEBUG("[SAMBA] DIR -> directory '%s' for path '%s' devname '%s' double %d devpath '%s'\n", comm, path, s->f_Name, doub, s->f_Path );
		
		dh = smbc_opendir( comm );
		
		//if( dh != NULL )
		if( dh >= 0 )
		{
			int pos = 0;
			
			BufStringAdd( bs, "ok<!--separate-->");
			BufStringAdd( bs, "[" );
			while( TRUE )
			{
				sdir = smbc_readdir( dh );
				if( !sdir )
				{
					break;
				}
				
				sprintf( tempString, "%s%s", comm, sdir->name );
				struct stat ls;
				
				if( smbc_stat( tempString, &ls ) == 0 )
				//if( stat( tempString, &ls ) == 0 )
				{
					if( !(strcmp( sdir->name, "." ) == 0 || strcmp( sdir->name, ".." ) == 0 ) )
					{
						if( pos != 0 )
						{
							BufStringAdd( bs, "," );
						}
						FillStatSAMBA( bs, &ls, s, tempString );
						pos++;
					}
				}
			}
			BufStringAdd( bs, "]" );
			
			smbc_closedir( dh );
			
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->Could not open directory.");
		}
		
		FFree( comm );
	}
	FFree( tempString );
	DEBUG("[SAMBA] Dir END\n");
	
	return bs;
}

//
// Get metadata
//

char *InfoGet( struct File *f, const char *path, const char *key )
{
	/*
	DEBUG("MetaGet!\n");
	char *deviceEndPtr = (char *)path;
	
	BufString *bs = BufStringNew();
	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( f->f_Path );
	char *retval = NULL;
	
	while( *deviceEndPtr != ':' )
	{
		deviceEndPtr++;
		if( *deviceEndPtr == 0 )
		{
			break;
		}
	}
	deviceEndPtr++;
	
	DEBUG("MetaGet!\n");
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, f->f_Path, f->f_Name );
	
	int doub = strlen( f->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, f->f_Path );
		
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		//strcat( comm, &(path[ doub+2 ]) );
		if( deviceEndPtr != NULL )
		{
			strcat( comm, deviceEndPtr );
		}
		
		strcat( comm, ".info" );
		
		DEBUG("PATH created %s\n", comm );
		
		FImage *img = ImageLoadPNG( comm );
		if( img != NULL )
		{
			BufStringAdd( bs, "ok<!--separate-->");
			
			KeyValueList *comment = img->fi_Comments;
			while( comment != NULL )
			{
				int size = 64;
				char *entry = NULL;
				
				if( comment->key != NULL )
				{
					size += strlen( comment->key );
				}
				if( comment->value != NULL )
				{
					size += strlen( comment->value );
				}
				
				DEBUG("Compare %s - %s\n", key, comment->key );
				if( strcmp( key, comment->key ) == 0 )
				{
					BufStringAdd( bs, comment->value );
					DEBUG("Added %s\n", bs->bs_Buffer );
					break;
				}
				// return ALL values
				
				comment = (KeyValueList *) comment->node.mln_Succ;
			}
			
			ImageDelete( img );
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->");
		}
		
		FFree( comm );
	}
	else
	{
		BufStringAdd( bs, "fail<!--separate-->");
	}
	
	DEBUG("Info END\n");
	
	char *ret = bs->bs_Buffer;
	bs->bs_Buffer = NULL;
	BufStringDelete( bs );
	
	return ret;
	*/
	return NULL;
}

//
// set metadata
//

int InfoSet( File *f, const char *path, const char *key, const char *value )
{
	/*
	char *deviceEndPtr = (char *)path;
	DEBUG("MetaGet!\n");

	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( f->f_Path );
	
	DEBUG("MetaSet!\n");
	while( *deviceEndPtr != ':' )
	{
		deviceEndPtr++;
		if( *deviceEndPtr == 0 )
		{
			break;
		}
	}
	deviceEndPtr++;
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, f->f_Path, f->f_Name );
	
	int doub = strlen( f->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, f->f_Path );
		
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		//strcat( comm, &(path[ doub+2 ]) );
		if( deviceEndPtr != NULL )
		{
			strcat( comm, deviceEndPtr );
		}
		
		strcat( comm, ".info" );
		
		DEBUG("PATH created %s\n", comm );
		
		char *parameters = NULL;
		unsigned int msgsize = strlen( key );
		
		if( ( parameters = StringDuplicateN( (char *)key, msgsize ) ) != NULL )
		{
			FImage *img = ImageLoadPNG( comm );
			// icon not found, loading default one
			if( img == NULL )
			{
				img = ImageLoadPNG( "resources/iconthemes/friendup/40/doc_unknown.png" );
			}
		
			if( img != NULL )
			{
				unsigned int i;
				char *attr = parameters;
				char *val = NULL;
			
				// when first parameter contain data in format   key=
				DEBUG("Image add comment key %s value %s\n", key, value );
				
				//if( attr != NULL && val != NULL )
				if( key != NULL && value != NULL )
				{
					ImageAddComment( img, (char *)key, (char *)value );
				}

				ImageSavePNG( img, comm );
			
				ImageDelete( img );
			}
			FFree( parameters );
		}
		
		FFree( comm );
	}
	
	DEBUG("Info END\n");
	*/
	
	return 0;
}
