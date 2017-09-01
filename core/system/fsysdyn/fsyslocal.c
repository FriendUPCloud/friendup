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

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include "systembase.h"
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

#define SUFFIX "fsys"
#define PREFIX "local"

//
// special structure
//

typedef struct SpecialData
{
	FILE                                        *fp;
	SystemBase                                  *sb;
} SpecialData;


const char *GetSuffix()
{
	return SUFFIX;
}

const char *GetPrefix()
{
	return PREFIX;
}

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
	DEBUG("[FSYSLOCAL] init\n");
}

//
//
//

void deinit( struct FHandler *s )
{
	DEBUG("[FSYSLOCAL] deinit\n");
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, UserSession *usrs )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	SystemBase *sb = NULL;
	//FBOOL isAdmin = FALSE;
	char *usersPath = "/home/friendusers/";
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("Mounting local filesystem!\n");
	
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
					DEBUG("Mount FS path set '%s'\n", path );
					break;
				case FSys_Mount_Server:
					break;
				case FSys_Mount_Port:
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_SysBase:
					sb = (SystemBase *)lptr->ti_Data;
					break;
				case FSys_Mount_AdminRights:
					//isAdmin = (FBOOL)lptr->ti_Data;
					break;
					/*
				case FSys_Mount_User:
					usr = (User *)lptr->ti_Data;
					break;
					*/
			}
		
			lptr++;
		}
		
		//
		
		if( path == NULL || strlen( path ) == 0 )
		{
			FERROR("[ERROR]: Path option not found!\n");
			FFree( dev );
			return NULL;
		}
		
		struct stat st;
		if( stat( path, &st ) == 0 && S_ISDIR( st.st_mode ) )
		{
			DEBUG("Mounting localfsys, Its directory FSYS: %s!\n", s->GetPrefix() );
			
			dev->f_Type = FType_Directory;
			dev->f_Size = 0;
			
			DEBUG("LOCALFS IS DIRECTORY data filled\n");
		}
		else
		{
			FFree( dev );
			return NULL;
		}
		/*
		if( isAdmin == TRUE )
		{
			
		}
		else
		{
			if( strncmp( path, usersPath, strlen( usersPath ) ) == 0 )
			{
				// path is correct, user can use it
			}
			else
			{
				path = usersPath;
			}
		}
		*/
		
		// we are trying to open folder/connection
		
		unsigned int pathlen = strlen( path );
		dev->f_Path = FCalloc( pathlen + 10, sizeof(char) );
		strcpy( dev->f_Path, path );
		if( path[ pathlen-1 ] != '/' )
		{
			strcat( dev->f_Path, "/" );
		}
		//dev->f_Path = StringDup( path );
		DEBUG("LOCALFS: localfs path is ok '%s'\n", dev->f_Path );
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usrs->us_User;
		dev->f_Name = StringDup( name );
		dev->f_SpecialData = FCalloc( 1, sizeof(SpecialData) );
		
		SpecialData *locsd = (SpecialData *)dev->f_SpecialData;
		locsd->sb = sb;
		
		
		
	}
	
	DEBUG("LOCALFS localfs mount ok\n");
	
	return dev;
}

//
// Only free device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("Release filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			
			FFree( lf->f_SpecialData );
		}
		
		if( lf->f_Name ){ FFree( lf->f_Name ); }
		if( lf->f_Path ){ FFree( lf->f_Path ); }

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
		DEBUG("Unmount filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			
			FFree( lf->f_SpecialData );
		}
		
		if( lf->f_Name ){ FFree( lf->f_Name ); lf->f_Name = NULL;}
		if( lf->f_Path ){ FFree( lf->f_Path ); lf->f_Path = NULL; }
		
		//if( lf->d_Host ){ free( lf->d_Host ); }
		//if( lf->d_LoginUser ){ free( lf->d_LoginUser ); }
		//if( lf->d_LoginPass ){ free( lf->d_LoginPass ); }
		
		//free( f );
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
	// Make relative path
	int pathsize = strlen( path );
	char *commClean = FCalloc( pathsize+10, sizeof( char ) );
	int il = pathsize, imode = 0, in = 0;
	int ii = 0; for( ; ii < il; ii++ )
	{
		if( imode == 0 && path[ii] == ':' )
		{
			imode = 1; continue;
		}
		else if( imode == 1 )
		{
			commClean[in++] = path[ii];
		}
	}
	// ---- DEBUG( "Fixing the path to be a relative one: %s\n", commClean );
	if( imode != 1 )
	{
		// ---- DEBUG( "Just using the path. No colon was found.\n" );
		//sprintf( commClean, "%s", path );
		strcpy( commClean, path );
	}

	int spath = strlen( commClean );
	int rspath = strlen( s->f_Path );
	File *locfil = NULL;
	char *comm = FCalloc( rspath + spath + 5, sizeof( char ) );
	
	DEBUG(" comm---size %d\n", rspath + spath + 5 );
	
	// ---- DEBUG( "FileOpen new: %s %s\n", s->f_Path, commClean );
	
	// Remove the filename from commclean in a clean path
	char *cleanPath = NULL;
	il = strlen( commClean ); imode = 0, ii = il;
	for( ; il > 0; il-- )
	{
		if( imode == 0 && ( commClean[il] == '/' || commClean[il] == ':' ) )
		{
			imode = 1;
			cleanPath = FCalloc( il+10, sizeof( char ) );
			break;
		}
	}
	if( imode == 1 ) sprintf( cleanPath, "%.*s", il, commClean );
	
	// Create a string that has the real file path of the file
	if( comm != NULL )
	{
		FILE *f = NULL;
		
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

		// ---- DEBUG( "New filepath: %s\n", cleanPath );
		
		int off = 0, slash = 0;
		for( i = 0; i < spath; i++ )
		{
			if( path[i] == '/' )
			{
				int alsize = rspath + i + 1;
				DEBUG("Allocate %d\n", alsize );
				char *directory = FCalloc( alsize , sizeof( char ) );
				if( directory != NULL )
				{
					snprintf( directory, alsize, "%s%.*s", s->f_Path, i, cleanPath );
				
					struct stat filest;
				
					// Create if not exist!
					//DEBUG( "Testing if directory exists: %s\n", directory );
					if( stat( directory, &filest ) == -1 )
					{
						//DEBUG( "Didn't exist: creating dir: %s\n", directory );
						mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
					}
				
					FFree( directory );
				}
				slash++;
			}
		}
		
		FFree( commClean );
		if( cleanPath != NULL )
		{
			FFree( cleanPath );
		}
		commClean = NULL;
		cleanPath = NULL;
		
		DEBUG("FileOpen in progress\n");
		
		//
		// Only go on if we can find the file and open it 
		//
		
		//
		// read stream
		//
			
		if( strcmp( mode, "rs" ) == 0 )
		{
			f = fopen( comm, "rb" );
		}
		else
		{
			f = fopen( comm, mode );
		}
		
		if( f != NULL )
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
					sd->fp = f;
				}
				DEBUG("FileOpened, memory allocated for localfs\n");
			
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
	if( cleanPath )
	{
		FFree( cleanPath );
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
			close = fclose( ( FILE *)sd->fp );
			free( lfp->f_SpecialData );
		}
		
		if( lfp->f_Path ) free( lfp->f_Path );
		if( lfp->f_Buffer ) free( lfp->f_Buffer );
		free( lfp );
		
		DEBUG( "FileClose: Closing file pointer.\n" );
		
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
		if( feof( sd->fp ) )
		{
			return -1;
		}
		result = fread( buffer, 1, rsize, sd->fp );
		
		if( f->f_Stream == TRUE )
		{
			sd->sb->sl_SocketInterface.SocketWrite( f->f_Socket, buffer, (FQUAD)result );
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
		result = fwrite( buffer, 1, wsize, sd->fp );
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
		return fseek( sd->fp, pos, SEEK_SET );
	}
	return -1;
}

//
// make directory in local file system
//

int MakeDir( struct File *s, const char *path )
{
	INFO("MakeDir!\n");
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
	
	DEBUG("----------------------> %s\n", path );
	
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
						//char *directory = calloc( rspath + i , sizeof( char *) );
						//if( directory != NULL )
						//{
						sprintf( directory, "%s%.*s", newPath, i, path );
						
						FERROR("PATH CREATED %s   NPATH %s   PATH %s\n", directory,  newPath, path );
				
						struct stat filest;
				
						// Create if not exist!
						if( stat( directory, &filest ) == -1 )
						{
							mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
							DEBUG( "Making directory %s\n", directory );
						}
						else
						{
							FERROR( "Cannot create directory: %s\n", directory );
							error = 1;
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
			mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
				
			// Create if not exist!
			if( stat( directory, &filest ) == -1 )
			{
				mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
				DEBUG( "Making directory %s\n", directory );
			}
			else
			{
				FERROR( "Cannot create directory: %s , fullpath\n", directory );
				error = 1;
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

FQUAD RemoveDirectory(const char *path)
{
	DIR *d = opendir( path );
	size_t path_len = strlen( path );
	FQUAD r = 0;

	if( d )
	{
		struct dirent *p;
		r = 0;

		while( !r && ( p = readdir( d ) ) )
		{
			char *buf;
			size_t len;

			/* Skip the names "." and ".." as we don't want to recurse on them. */
			if (!strcmp(p->d_name, ".") || !strcmp(p->d_name, "..") )
			{
				continue;
			}

			len = path_len + strlen(p->d_name) + 2; 
			buf = FCalloc(len , sizeof(char));

			if( buf != NULL )
			{
				struct stat statbuf;

				snprintf(buf, len, "%s/%s", path, p->d_name);

				if (!stat(buf, &statbuf))
				{
					if (S_ISDIR(statbuf.st_mode))
					{
						r += RemoveDirectory(buf);
					}
					else
					{
						r += statbuf.st_size;
						unlink( buf );
						remove( buf );
					}
				}
				FFree(buf);
			}
		}
		closedir(d);

		rmdir(path);
	}
	else // file
	{
		DEBUG("Remove file %s\n", path );
		
		struct stat statbuf;
		if( !stat( path, &statbuf ) )
		{
			r += statbuf.st_size;
		}
		remove( path );
	}

	return r;
}

//
// Delete
//

FQUAD Delete( struct File *s, const char *path )
{
	DEBUG("[LocalfsDelete] start!\n");
	
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	char *comm = NULL;
	
	DEBUG("[LocalfsDelete] new path size %d\n", rspath + spath );
	
	if( ( comm = FCalloc( rspath + spath + 10, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		
		if( comm[ strlen( comm ) -1] != '/' )
		{
			strcat( comm, "/" );
		}
		strcat( comm, path );
	
		DEBUG("[LocalfsDelete] file or directory %s!\n", comm );
	
		FQUAD ret = RemoveDirectory( comm );

		FFree( comm );
		return ret;
	}
	
	DEBUG("[LocalfsDelete] END\n");
	
	return 0;
}

//
// Rename
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("Rename!\n");
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
	
	// 4. Execute!
	DEBUG( "executing: rename %s %s\n", source, dest );
	int res = rename( source, dest );
	
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
	DEBUG("Copy!\n");
	
	int spath = strlen( src );
	int dpath = strlen( dst );
	int rspath = strlen( s->f_Path );
	
	char *fnamedst = NULL;
	char *fnamesrc = NULL;
	FILE *fsrc, *fdst;
	int error = 0;
	
	DEBUG("Delete new path size %d\n", rspath + spath );
	
	if( ( fnamesrc = calloc( rspath + spath + 20, sizeof(char) ) ) != NULL )
	{
		if( ( fnamedst = calloc( rspath + dpath + 20, sizeof(char) ) ) != NULL )
		{
			strcpy( fnamesrc, s->f_Path );
			if( fnamesrc[ strlen( fnamesrc ) -1] != '/' )
			{
				strcat( fnamesrc, "/" );
			}
			strcat( fnamesrc, dst );
			
			strcpy( fnamedst, s->f_Path );
			if( fnamedst[ strlen( fnamedst ) -1] != '/' )
			{
				strcat( fnamedst, "/" );
			}
			strcat( fnamedst, dst );
			
			if( ( fdst = fopen( fnamedst, "wb" ) ) !=  NULL )
			{
#define BUF_MAX 16000
				
				char buffer[ BUF_MAX ];
				unsigned int size;
				
				if( ( fsrc = fopen( fnamesrc, "rb" ) ) !=  NULL )
				{
					while( (size = fread( buffer, BUF_MAX, sizeof( FBYTE ), fsrc ) ) > 0 )
					{
						if( fwrite( buffer, sizeof(FBYTE), size, fdst ) != size )
						{
							//oops("Write error to ", destination);
						}
					}
					fclose( fsrc );
				}
				else
				{
					error = 1;
				}
				fclose( fdst );
			}
			else
			{
				error = 2;
			}
			free( fnamedst );
		}
		else
		{
			error = 3;
		}
		free( fnamesrc );
	}
	else
	{
		error = 4;
	}
	
	DEBUG("Copy END\n");
	
	return error;
}

//
// Execute file
//

#define BUFFER_SIZE 1024

FILE *popen( const char *c, const char *r );

char *Execute( struct File *s, const char *path, const char *args )
{
	DEBUG("SYS mod run\n");

	FULONG res = 0;
	char command[ BUFFER_SIZE ];
	char *temp = NULL;
	char *result = NULL;
    unsigned long size = 0;

	//
	//
	// we are calling native application and read output from it
	//
	//
	
	
	//void pclose( FILE *f );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = calloc( strlen( s->f_Path ) + strlen(path), sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		strcat( comm, &(path[ doub+2 ]) );

		sprintf( command, "%s %s", comm, args );

		FILE* pipe = popen( command, "r");
		if( !pipe )
		{
			return 0;
		}

		char buffer[ BUFFER_SIZE ];
    
		while( !feof( pipe ) ) 
		{
			char *gptr;

			if( ( gptr = fgets( buffer, BUFFER_SIZE, pipe ) ) != NULL )
			{
				size = strlen( buffer );
				//DEBUG("inside buffer '%s' size %d\n", buffer, size );

				if( result == NULL )
				{
					if( ( result = calloc( size+1, sizeof(char) ) ) != NULL ){
						memcpy( result, buffer, size );
						result[ size ] = 0;

						res += size;
                    //DEBUG("SYS: copy %d  res %d\n", size, res );
					}
					else
					{
						DEBUG("Cannot alloc mem result.\n");
					}
				}
				else
				{
					//DEBUG("TEMP res size %d %s\n", res, temp );
					if( ( temp = calloc( res+1, sizeof(char) ) ) != NULL )
					{
						memcpy( temp, result, res );
						//DEBUG("Data copy %s\n", temp );
						if( result != NULL ){ free( result ); result = NULL; }
						//DEBUG("before result calloc\n");
						if( ( result = calloc( res+size+1, sizeof(char) ) ) != NULL )
						{
							memcpy( result, temp, res );
							memcpy( &(result[ res ]), buffer, size );

							//DEBUG("res %d size %d result %s\n", res, size, result );
							res += size;
						}

						free( temp );
						temp = NULL;
					}
				}
				//res += (FULONG)size;
			}
		}
		pclose( pipe );
	}
	else
	{
		return NULL;
	}

	return result;
}

//
// Fill buffer with data from stat
//

void FillStatLocal( BufString *bs, struct stat *s, File *d, const char *path )
{
	char tmp[ 1024 ];
	int rootSize = strlen( d->f_Path );
	int pathSize = strlen( path );
	
	//DEBUG("FILLSTAT path '%s' rootpath '%s'  %d\n", path, d->f_Path, path[ strlen( d->f_Path ) ] );
			
	BufStringAdd( bs, "{" );
	snprintf( tmp, 1023, " \"Filename\":\"%s\",", GetFileName( path ) );
	BufStringAdd( bs, tmp );
	
	//DEBUG( "FILLSTAT filename set\n");
	
	if( rootSize != pathSize )
	{
		if( S_ISDIR( s->st_mode ) )
		{
			snprintf( tmp, 1023, "\"Path\":\"%s/\",", &path[ strlen( d->f_Path ) ] );
		}
		else
		{
			snprintf( tmp, 1023, "\"Path\":\"%s\",", &path[ strlen( d->f_Path ) ] );
		}
	}
	else
	{
		snprintf( tmp, 1023, "\"Path\":\"%s:\",", d->f_Name );
	}
	
	//DEBUG( "FILLSTAT fullname set\n");
	
	BufStringAdd( bs, tmp );
	snprintf( tmp, 1023, "\"Filesize\": %d,",(int) s->st_size );
	BufStringAdd( bs, tmp );
	
	char *timeStr = FCalloc( 40, sizeof( char ) );
	strftime( timeStr, 36, "%Y-%m-%d %H:%M:%S", localtime( &s->st_mtime ) );
	snprintf( tmp, 1023, "\"DateModified\": \"%s\",", timeStr );
	BufStringAdd( bs, tmp );
	FFree( timeStr );
	
	//DEBUG( "FILLSTAT filesize set\n");
	
	if( S_ISDIR( s->st_mode ) )
	{
		BufStringAdd( bs,  "\"MetaType\":\"Directory\",\"Type\":\"Directory\" }" );
	}
	else
	{
		BufStringAdd( bs, "\"MetaType\":\"File\",\"Type\":\"File\" }" );
	}
	
	//DEBUG( "FILLSTAT END\n");
}

//
// Get information about last file changes (seconds from 1970)
//

FQUAD GetChangeTimestamp( struct File *s, const char *path )
{
	struct stat result;
	if( stat( path, &result) == 0 )
	{
		return (FQUAD)result.st_mtimensec;
	}
	return (FQUAD)-1;
}

//
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("Info!\n");
	
	BufString *bs = BufStringNew();
	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( s->f_Path );
	
	BufStringAdd( bs, "ok<!--separate-->");
	
	DEBUG("Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );

		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		//strcat( comm, &(path[ doub+2 ]) );
		if( path != NULL )
		{
			strcat( comm, path );
		}
			
		DEBUG("PATH created %s\n", comm );
	
		struct stat ls;
		
		if( stat( comm, &ls ) == 0 )
		{
			DEBUG("LOCAL file stat %s\n", comm );
			FillStatLocal( bs, &ls, s, comm );
		}
		else
		{
			DEBUG("LOCAL file stat FAIL %s\n", comm );
			BufStringAdd( bs, "{ \"response\": \"File or directory do not exist\"}" );
		}
		
		FFree( comm );
	}
	
	DEBUG("Info END\n");
	
	return bs;
}

//
// Call a library
//

BufString *Call( File *s, const char *path, char *args )
{
	DEBUG("Info!\n");
	BufString *bs = BufStringNew();
	BufStringAdd( bs, "fail<!--separate-->");	
	DEBUG("Info END\n");
	return bs;
}

//
// return content of directory
//
	
BufString *Dir( File *s, const char *path )
{
	BufString *bs = BufStringNew();
	
	int rspath = strlen( s->f_Path );
	
	DEBUG("Dir!\n");
	
	// user is trying to get access to not his directory
	
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	char *tempString = FCalloc( rspath +512, sizeof(char) );
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		if( comm[ strlen( comm ) -1 ] != '/' && s->f_Path[ strlen(s->f_Path)-1 ] != '/' )
		{
			DEBUG("Added '/\n");
			strcat( comm, "/" );
		}
		
		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}
		
 		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			DEBUG("end was not endeed /\n");
			strcat( comm, "/" );
		}
	
		DIR *d;
		struct dirent *dir;
		
		DEBUG("DIR -> directory '%s' for path '%s' devname '%s' double %d devpath '%s'\n", comm, path, s->f_Name, doub, s->f_Path );
		
		d = opendir( comm );
		
		if( d )
		{
			int pos = 0;
			
			BufStringAdd( bs, "ok<!--separate-->");
			
			//BufStringAdd( bs, "ok<!--separate-->[" );
			BufStringAdd( bs, "[" );
			while ((dir = readdir(d)) != NULL)
			{
				
				if( dir->d_name[ 0 ] == '/' )
				{
					sprintf( tempString, "%s%s", comm, &(dir->d_name[1]) );
				}
				else
				{
					sprintf( tempString, "%s%s", comm, dir->d_name );
				}
				
				struct stat ls;
				
				//DEBUG("---------------> %s\n", dir->d_name );
		
				if( stat( tempString, &ls ) == 0 )
				{
					if( !(strcmp( dir->d_name, "." ) == 0 || strcmp( dir->d_name, ".." ) == 0 ) )
					{
						if( pos != 0 )
						{
							BufStringAdd( bs, "," );
						}
						FillStatLocal( bs, &ls, s, tempString );
						pos++;
					}
				}
			}
			BufStringAdd( bs, "]" );
			
			closedir( d );
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->Could not open directory.");
		}
		
		FFree( comm );
	}
	FFree( tempString );
	DEBUG("Dir END\n");
	
	return bs;
}

//
// Get metadata
//

char *InfoGet( struct File *f, const char *path, const char *key )
{
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
				/*
				if( ( entry = FCalloc( size, sizeof(char) ) ) != NULL )
				{
					int ssize = 0;
					
					if( img->fi_Comments == comment )
					{
						ssize = sprintf( entry, "%s=%s", comment->key, comment->value );
					}
					else
					{
						ssize = sprintf( entry, ",%s=%s", comment->key, comment->value );
					}
					BufStringAddSize( bs, entry, ssize );
					FFree( entry );
				}*/
				
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
}

//
// set metadata
//

int InfoSet( File *f, const char *path, const char *key, const char *value )
{
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
				/*
				for( i=1 ; i < msgsize ; i++ )
				{
					if( parameters[ i ] == '=' )
					{
						parameters[ i ] = 0;
						val = &(parameters[ i+1 ]);
					}
					else if( parameters[ i ] == ';' )
					{
						parameters[ i ] = 0;
						attr = &parameters[ i+1 ];
					
						if( attr != NULL && val != NULL )
						{
							ImageAddComment( img, attr, val );
						}
					}
				}

				if( attr != NULL && val != NULL )
				{
					ImageAddComment( img, attr, val );
				}
				*/
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
	
	return 0;
}
