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

#define SUFFIX "fsys"
#define PREFIX "local"

//
// special structure
//

typedef struct SpecialData
{
	FILE *fp;
}SpecialData;


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
		DEBUG("Cannot copy string!\n");
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
	//s->Info = dlsym( s->handle, "Info" );
}

//
//
//

void deinit( struct FHandler *s )
{
	
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	User *usr = NULL;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("Mounting local filesystem!\n");
	
	if( ( dev = calloc( 1, sizeof( File ) ) ) != NULL )
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
				case FSys_Mount_Host:
					break;
				case FSys_Mount_Port:
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_User:
					usr = (User *)lptr->ti_Data;
					break;
			}
		
			lptr++;
		}
		
		//
		
		if( path == NULL )
		{
			ERROR("[ERROR]: Path option not found!\n");
			free( dev );
			return NULL;
		}
		
		init( s );
		
		// we are trying to open folder/connection
		
		dev->f_Path = StringDup( path );
		DEBUG("LOCALFS: localfs path is ok '%s'\n", dev->f_Path );
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usr;
		dev->f_Name = StringDup( name );
		
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
			dev->f_Type = FType_File;
		}
		
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
			
			free( lf->f_SpecialData );
		}
		
		if( lf->f_Name ){ free( lf->f_Name ); }
		if( lf->f_Path ){ free( lf->f_Path ); }
		
		//if( lf->d_Host ){ free( lf->d_Host ); }
		//if( lf->d_LoginUser ){ free( lf->d_LoginUser ); }
		//if( lf->d_LoginPass ){ free( lf->d_LoginPass ); }
		
		//free( f );
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
			
			free( lf->f_SpecialData );
		}
		
		if( lf->f_Name ){ free( lf->f_Name ); }
		if( lf->f_Path ){ free( lf->f_Path ); }
		
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
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	File *locfil = NULL;
	char *comm = calloc( rspath + spath + 5, sizeof( char ) );
	
	DEBUG("FileOpen new: %s %s\n", s->f_Path, path );
	
	// Create a string that has the real file path of the file
	if( comm != NULL )
	{
		FILE *f = NULL;
		
		if( s->f_Path[ rspath-1 ] == '/' )
		{
			sprintf( comm, "%s%s", s->f_Path, path );
		}
		else
		{
			sprintf( comm, "%s/%s", s->f_Path, path );
		}
	
		// Make the directories that do not exist
		int slashes = 0, i = 0; for( ; i < spath; i++ )
		{
			if( path[i] == '/' )
				slashes++;
		}

		int off = 0, slash = 0;
		for( i = 0; i < spath; i++ )
		{
			if( path[i] == '/' )
			{
				char *directory = calloc( rspath + i + 1, sizeof( char *) );
				sprintf( directory, "%s%.*s", s->f_Path, i, path );
				
				struct stat filest;
				
				// Create if not exist!
				if( stat( directory, &filest ) == -1 )
					mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
				
				free( directory );
				slash++;
			}
		}
		
		DEBUG("FileOpen in progress\n");
		
	
		// Only go on if we can find the file and open it 
		if( ( f = fopen( comm, mode ) ) != NULL )
		{
			// Ready the file structure
			if( ( locfil = calloc( sizeof( File ), 1 ) ) != NULL )
			{
				locfil->f_Path = StringDup( path );
				
				locfil->f_SpecialData = calloc( sizeof( SpecialData ), 1 );
				
				SpecialData *sd = (SpecialData *)locfil->f_SpecialData;
				
				if( sd ) sd->fp = f;
				/*
				struct stat myStat;
				if( lstat( comm, &myStat ) != -1 )
				{
					locfil->f_Buffer = (char *)MakeString( myStat.st_size );
					locfil->f_DataPassed = myStat.st_size;
				}
				else
				{
					locfil->f_Buffer = NULL; //calloc( FILE_MAX_BUFFER, sizeof(char) );
					locfil->f_DataPassed = 0;
				}
				*/
				DEBUG("FileOpened, memory allocated for localfs\n");
				
				// Free temp string
				free( comm );
				
				return locfil;
			}
	
			free( comm );
			return NULL;
		}
		else
		{
			ERROR("Cannot open file: %s  mode %s\n", comm, mode );
		}
		
		free( comm );
	}
	ERROR("Cannot open file %s\n", path );
	
	return NULL;
}

//
// Close File
//

int FileClose( struct File *s, void *fp )
{	
	if( fp )
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
	DEBUG("MakeDir!\n");
	
	int rspath = strlen( s->f_Path );
	int spath = strlen( path );
	
	// Create a string that has the real file path of the file
	if( path != NULL )
	{
		// Make the directories that do not exist
		int slashes = 0, i = 0; for( ; i < spath; i++ )
		{
			if( path[i] == '/' )
				slashes++;
		}

		if( slashes > 0 )
		{
			int off = 0, slash = 0;
			for( i = 0; i < spath; i++ )
			{
				if( path[i] == '/' )
				{
					char *directory = calloc( rspath + i + 1, sizeof( char *) );
					sprintf( directory, "%s%.*s", s->f_Path, i, path );
				
					struct stat filest;
				
					// Create if not exist!
					if( stat( directory, &filest ) == -1 )
					{
						mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
						DEBUG( "Making directory %s\n", directory );
					}
					else
					{
						DEBUG( "Not making dir %s\n", directory );
					}
				
					free( directory );
					slash++;
				}
			}
		}
		// Ok, no slashes
		else
		{
			char *directory = calloc( rspath + spath + 1, sizeof( char *) );
					sprintf( directory, "%s%s", s->f_Path, path );
			mkdir( directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
			free( directory ); 
		}
		return 0;
	}
	
	return -1;
}

//
// rm files/dirs
//

int RemoveDirectory(const char *path)
{
	DIR *d = opendir( path );
	size_t path_len = strlen( path );
	int r = -1;

	if (d)
	{
		struct dirent *p;
		r = 0;

		while (!r && (p=readdir(d)))
		{
			int r2 = -1;
			char *buf;
			size_t len;

			/* Skip the names "." and ".." as we don't want to recurse on them. */
			if (!strcmp(p->d_name, ".") || !strcmp(p->d_name, "..") )
			{
				continue;
			}

			len = path_len + strlen(p->d_name) + 2; 
			buf = calloc(len , sizeof(char));

			if (buf)
			{
				struct stat statbuf;

				snprintf(buf, len, "%s/%s", path, p->d_name);

				if (!stat(buf, &statbuf))
				{
					if (S_ISDIR(statbuf.st_mode))
					{
						r2 = RemoveDirectory(buf);
					}
					else
					{
						r2 = unlink(buf);
						remove( buf );
					}
				}
				free(buf);
			}
			r = r2;
		}
		closedir(d);
	}
	else // file
	{
		DEBUG("Remove file %s\n", path );
		remove( path );
	}

	if (!r)
	{
		r = rmdir(path);
	}

	return r;
}

//
// Delete
//

int Delete( struct File *s, const char *path )
{
	DEBUG("Delete!\n");
	
	//BufString *bs = BufStringNew();
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	//int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	DEBUG("Delete new path size %d\n", rspath + spath );
	
	if( ( comm = calloc( rspath + spath + 10, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		
		if( comm[ strlen( comm ) -1] != '/' )
		{
			strcat( comm, "/" );
		}
		strcat( comm, path );
	
		DEBUG("Delete file or directory %s!\n", comm );
	
		int ret = RemoveDirectory( comm );

		free( comm );
		return ret;
	}
	
	DEBUG("Delete END\n");
	
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
		targetPath = calloc( spath, sizeof( char ) );
		sprintf( targetPath, "%.*s", spath - 1, path );
	}
	else
	{
		targetPath = calloc( spath + 1, sizeof( char ) ); 
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
	char *source = calloc( rspath + spath + 1, sizeof( char ) );
	sprintf( source, "%s%s", s->f_Path, targetPath );
	
	// 3. Ok if we have sub folder or not, add it to our destination
	char *dest = NULL;
	if( hasSubFolder > 0 )
	{
		dest = calloc( rspath + off + strlen( nname ) + 1, sizeof( char ) );
		sprintf( dest, "%.*s", rspath, s->f_Path );
		sprintf( dest + rspath, "%.*s", off, targetPath );
		sprintf( dest + rspath + off, "%s", nname );
	}
	else 
	{
		dest = calloc( rspath + strlen( nname ) + 1, sizeof( char ) );
		sprintf( dest, "%s", s->f_Path );
		sprintf( dest + rspath, "%s", nname );
	}
	
	// 4. Execute!
	DEBUG( "executing: rename %s %s\n", source, dest );
	int res = rename( source, dest );
	
	// 5. Free up
	free( source );
	free( dest );
	free( targetPath );
	
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
					while( (size = fread( buffer, BUF_MAX, sizeof( BYTE ), fsrc ) ) > 0 )
					{
						if( fwrite( buffer, sizeof(BYTE), size, fdst ) != size )
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

	ULONG res = 0;
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
						printf("Cannot alloc mem result.\n");
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
				//res += (ULONG)size;
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

void FillStat( BufString *bs, struct stat *s, File *d, const char *path )
{
	char tmp[ 1024 ];
	int rootSize = strlen( d->f_Path );
	int pathSize = strlen( path );
	
	//DEBUG("FILLSTAT path '%s' rootpath '%s'  %d\n", path, d->f_Path, path[ strlen( d->f_Path ) ] );
			
	BufStringAdd( bs, "{" );
	sprintf( tmp, " \"Filename\":\"%s\",", GetFileName( path ) );
	BufStringAdd( bs, tmp );
	
	//DEBUG( "FILLSTAT filename set\n");
	
	if( rootSize != pathSize )
	{
		if( S_ISDIR( s->st_mode ) )
		{
			sprintf( tmp, "\"Path\":\"%s:%s/\",", d->f_Name, &path[ strlen( d->f_Path ) ] );
		}
		else
		{
			sprintf( tmp, "\"Path\":\"%s:%s\",", d->f_Name, &path[ strlen( d->f_Path ) ] );
		}
	}
	else
	{
		sprintf( tmp, "\"Path\":\"%s:\",", d->f_Name );
	}
	
	//DEBUG( "FILLSTAT fullname set\n");
	
	BufStringAdd( bs, tmp );
	sprintf( tmp, "\"Filesize\": %d,",(int) s->st_size );
	BufStringAdd( bs, tmp );
	
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
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("Info!\n");
	
	BufString *bs = BufStringNew();
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	BufStringAdd( bs, "ok<!--separate-->");
	
	DEBUG("Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = calloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		//strcat( comm, &(path[ doub+2 ]) );
		strcat( comm, path );
		
		DEBUG("PATH created %s\n", comm );
	
		struct stat ls;
		
		if( stat( comm, &ls ) == 0 )
		{
			DEBUG("LOCAL file stat %s\n", comm );
			FillStat( bs, &ls, s, comm );
		}
		else
		{
			DEBUG("LOCAL file stat FAIL %s\n", comm );
			BufStringAdd( bs, "{ \"ErrorMessage\": \"File or directory do not exist\"}" );
		}
		
		free( comm );
	}
	
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
	
	if( ( comm = calloc( rspath +512, sizeof(char) ) ) != NULL )
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
	
		char tempString[ 1024 ];
		DIR           *d;
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
						FillStat( bs, &ls, s, tempString );
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
		
		free( comm );
	}
	DEBUG("Dir END\n");
	
	return bs;
}


