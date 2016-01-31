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
#include <math.h>
#include <fcntl.h>
#include "systembase.h"
#include <util/log/log.h>
#include <util/list.h>
#include <util/buffered_string.h>
#include <util/list_string.h>
#include <util/string.h>
#include <sys/file.h>
#include <sys/stat.h>
#include <dirent.h>

#define SUFFIX "fsys"
#define PREFIX "php"

//
// special structure
//

#define MODE_READ 1
#define MODE_WRITE 2

typedef struct SpecialData
{
	FILE *fp;
	char *type;
	char *module;
	//char *SessionID;
	char *fname;
	char *path;
	int mode;
} SpecialData;


const char *GetSuffix()
{
	return SUFFIX;
}

//
//
//

bool PathHasColon( unsigned char *string )
{
	// No literal colon
	char *dec = FCalloc( 1, strlen( string ) + 1 );
	UrlDecode( dec, (const char *)string );
	DEBUG( "Decoded string for path: %s\n", dec );
	if( strchr( dec, ':' ) != NULL )
	{
		return TRUE;
	}
	return FALSE;
}

//
//
//

const char *GetPrefix()
{
	return PREFIX;
}

//
// additional stuff
//

// TODO: We already have StringDuplicate()
char* StringDup( const char* str )
{
	if( str == NULL)
	{
		DEBUG("Cannot copy string!\n");
		return NULL;
	}
	
	int len = strlen( str );
	char *res = NULL;
	if( ( res = FCalloc( len + 1, sizeof(char) ) ) != NULL )
	{
		return strcpy( res, str );
	}
	return NULL;
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
// php call, send request, read answer
//

ListString *PHPCall( const char *command, int *length )
{
	DEBUG( "[PHPFsys] run app: '%s'\n", command );
	
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		//free( command );
		ERROR("[PHPFsys] cannot open pipe\n");
		return NULL;
	}
	
	char *temp = NULL;
	char *result = NULL;
	char *gptr = NULL;
	ULONG size = 0;
	ULONG res = 0;

	
#define PHP_READ_SIZE 131072
	
	DEBUG("[PHPFsys] command launched\n");

	char buf[ PHP_READ_SIZE ]; memset( buf, '\0', PHP_READ_SIZE );
	ListString *data = ListStringNew();
	
	while( !feof( pipe ) )
	{
		// Make a new buffer and read
		size = fread( buf, sizeof(char), PHP_READ_SIZE, pipe );
		ListStringAdd( data, buf, size );
	}
	
	// Free pipe if it's there
	pclose( pipe );
	
	ListStringJoin( data );		//we join all string into one buffer
	// Set the length
	if( length != NULL )
	{
		*length = data->ls_Size;
	}
	
	DEBUG( "Finished PHP call...(%d length)--------------------------%s\n", data->ls_Size, data->ls_Data );
	
	return data;
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
	char *module = NULL;
	char *type = NULL;
	char *authid = NULL;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("Mounting PHPFS filesystem!\n");
	
	if( ( dev = FCalloc( 1, sizeof( File ) ) ) != NULL )
	{
		struct TagItem *lptr = ti;
		
		// typical mount call
		//   'php "modules/system/module.php" "type=corvo&devname=HomeSql&path=&module=system&unmount=%5Bobject%20Object%5D&sessionid=0eff3a525c8e0495301f7418bd6b6ce358a995e6";'
		
		//
		// checking passed arguments
		//
		
		while( lptr->ti_Tag != TAG_DONE )
		{
			switch( lptr->ti_Tag )
			{
				//printf("TAG %x\n", lptr->ti_Tag);
				case FSys_Mount_Path:
					path = (char *)lptr->ti_Data;
					//DEBUG("Mount FS path set '%s'  len %d\n", path, strlen( path ) );
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
				case FSys_Mount_Type:
					type = (char *)lptr->ti_Data;
					//INFO("TYPE PASSED %s size %d\n", type, strlen( type ) );
					break;
				case FSys_Mount_Module:
					module = (char *)lptr->ti_Data;
					break;
			}
			lptr++;
		}
		
		//
		/*
		if( path == NULL )// || strlen( path ) < 1 )
		{
			DEBUG("[ERROR]: Path option not found!\n");
			free( dev );
			return NULL;
		}
		*/
		init( s );
		
		// we are trying to open folder/connection
		
		if( path != NULL )
		{
			if( strlen( path ) < 1 )
			{
				dev->f_Path = calloc( 2, sizeof(char) );
			}
			else
			{
				dev->f_Path = StringDup( path );
			}
			DEBUG("PHPFS: localfs path is ok '%s' (ignore this message, unimplemented!)\n", dev->f_Path );
		}
		
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usr;
		dev->f_Name = StringDup( name );
		
		dev->f_Type = FType_Directory;
		dev->f_Size = 0;
		
		SpecialData *sd = calloc( 1, sizeof( SpecialData ) );
		if( sd != NULL )
		{
			sd->module = StringDup( module );
			dev->f_SessionID = StringDup( usr->u_SessionID );
			sd->type = StringDup( type );
			dev->f_SpecialData = sd;
			
			char command[ 2048 ];	// maybe we should count that...
		
			sprintf( command, "php \"modules/system/module.php\" \"command=mount&type=%s&devname=%s&path=%s&module=%s&sessionid=%s\";",
				 type, name, path, module, usr->u_SessionID
			);
		
			int answerLength;
			ListString *result = PHPCall( command, &answerLength );
		
			if( result && result->ls_Size >= 0 )
			{

				DEBUG( "phpfs: Return was \"%s\"\n", result->ls_Data );
				if( strncmp( result->ls_Data, "ok", 2 ) != 0 )
				{
					DEBUG( "phpfs: Failed to mount device %s..\n", name );
					DEBUG( "phpfs: Output was: %s\n", result->ls_Data );
					if( sd->module ) FFree( sd->module );
					if( dev->f_SessionID ) FFree( dev->f_SessionID );
					if( sd->type ) FFree( sd->type );
					if( dev->f_Name ) FFree( dev->f_Name );
					if( dev->f_Path ) FFree( dev->f_Path );
					FFree( sd );
					FFree( dev );
					
					// Free up buffer
					ListStringDelete( result );
					
					return NULL;
				}
			}
			else
			{
				DEBUG( "phpfs: Error mounting device %s..\n", name );
				if( sd->module ) FFree( sd->module );
				if( dev->f_SessionID ) FFree( dev->f_SessionID );
				if( sd->type ) FFree( sd->type );
				if( dev->f_Name ) FFree( dev->f_Name );
				if( dev->f_Path ) FFree( dev->f_Path );
				FFree( sd );
				FFree( dev );
				
				// Free up buffer
				if( result ) ListStringDelete( result );
				return NULL;
			}
		
			if( result ) ListStringDelete( result );
		}
		DEBUG("PHPFS IS DIRECTORY data filled\n");
	}
	
	DEBUG("LOCALFS localfs mount ok\n");
	
	return dev;
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
			SpecialData *sd = (SpecialData *)lf->f_SpecialData;
		
			char command[ 2048 ];	// maybe we should count that...

			sprintf( command, "php \"modules/system/module.php\" \"command=unmount&devname=%s&module=%s&sessionid=%s\";",
				lf->f_Name,  sd->module, lf->f_SessionID
			);
		
			int answerLength;
			ListString *result = PHPCall( command, &answerLength );
			if( result && result->ls_Size >= 0 )
			{
				if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
				{
					DEBUG( "phpfs: Failed to unmount device %s..\n", lf->f_Name );
				}
			}
			else
			{
				DEBUG( "phpfs: Unknown error unmounting device %s..\n", lf->f_Name );
			}
		
			// we should parse result to get information about success
		
			if( result ) ListStringDelete( result );
			
			// Free up active device information
			if( sd->module ) FFree( sd->module );
			if( lf->f_SessionID ) FFree( lf->f_SessionID );
			if( sd->type ) FFree( sd->type );
			FFree( lf->f_SpecialData );
		}
		
		// Free up active device information
		if( lf->f_Name ){ FFree( lf->f_Name ); }
		if( lf->f_Path ){ FFree( lf->f_Path ); }

	}
	return 0;
}

//
// Open file
//

void *FileOpen( struct File *s, const char *path, char *mode )
{
	
	//Read

	//system.library/module?module=files&command=read&sessionid=78346h89379376&path=some:directory/file.txt
	
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	
	if( sd != NULL )
	{
		if( mode[0] == 'r' || strcmp( mode, "rb" ) == 0 )
		{
			char tmpfilename[ 712 ];
			int lockf;
			
			// Make sure we can make the tmp file unique with lock!
			int retries = 100;
			do
			{
				sprintf( tmpfilename, "/tmp/%s_read_%d%d%d%d", s->f_SessionID, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
				DEBUG( "Trying to lock %s\n", tmpfilename );
				if( ( lockf = open( tmpfilename, O_CREAT|O_EXCL|O_RDWR ) ) >= 0 )
					break;
				unlink( tmpfilename );
				// Failed.. bailing
				if( retries-- <= 0 )
				{
					ERROR( "[FileOpen] Failed to get exclusive lock on lockfile.\n" );
					return NULL;
				}
			}
			while( TRUE );
			
			DEBUG( "Success in locking %s\n", tmpfilename );
			
			// Open the tmp file and get a file lock!
			
			// Get the data
			char command[ 1024 ];	// maybe we should count that...

			sprintf( command, 
				"php \"modules/system/module.php\" \"type=%s&module=files&args=false&command=read&authkey=false&sessionid=%s&path=%s&mode=%s\";",
				sd->type, s->f_SessionID, path, mode
			);
		
			DEBUG( "Getting data for tempfile, seen below as command:\n" );
			DEBUG( "%s\n", command );
			
			int answerLength = 0;			
			ListString *result = PHPCall( command, &answerLength );
			
			// Open a file pointer
			if( result && result->ls_Data )
			{
				// Write the buffer to the file
				int written = write( lockf, ( void *)result->ls_Data, result->ls_Size );
				
				// Clean out result
				ListStringDelete( result ); result = NULL;
		
				// Remove lock!
				FILE *locfp = NULL;
				fcntl( lockf, F_SETLKW, F_UNLCK );
				fchmod( lockf, 0755 );
				close( lockf ); lockf = -1;
				
				if( ( locfp = fopen( tmpfilename, mode ) ) != NULL )
				{
					// Flick the lock off!
					fseek ( locfp, 0, SEEK_SET );
					
					// Ready the file structure
					File *locfil = NULL;
					if( ( locfil = FCalloc( 1, sizeof( File ) ) ) != NULL )
					{
						locfil->f_Path = StringDup( path );
						
						if( (locfil->f_SpecialData = FCalloc( 1, sizeof( SpecialData ) ) ) != NULL )
						{
							sd->fp = locfp;
							SpecialData *locsd = (SpecialData *)locfil->f_SpecialData;
							locsd->fp = locfp;
							locsd->mode = MODE_READ;
							locsd->fname = StringDup( tmpfilename );
							locsd->path = StringDup( path );
							locfil->f_SessionID = StringDup( s->f_SessionID );
					
							DEBUG("FileOpened, memory allocated for reading.\n" );
							return locfil;
						}
				
						// Free this one
						FFree( locfil->f_Path );
						FFree( locfil );
					}
					// Close the dangling fp
					fclose( locfp );
				}
				else
				{
					ERROR("Cannot open temporary file %s\n", tmpfilename );
				}
			}
			else
			{
				ERROR("Cannot create temporary file %s\n", tmpfilename );
			}
			// Close lock
			if( lockf >= 0 ) 
			{
				DEBUG( "Closing lock..\n" );
				close( lockf );
			}
		}
		else if( mode[0] == 'w' )
		{
			char tmpfilename[ 712 ];
			
			
			// Make sure we can make the tmp file unique
			do
			{
				sprintf( tmpfilename, "/tmp/%s_write_%d%d%d%d", s->f_SessionID, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
			}
			while( access( tmpfilename, F_OK ) != -1 );
			
			DEBUG("WRITE FILE %s\n", tmpfilename );
			
			FILE *locfp;
			if( ( locfp = fopen( tmpfilename, "w+" ) ) != NULL )
			{
				File *locfil = NULL;
	
				if( ( locfil = FCalloc( sizeof( File ), 1 ) ) != NULL )
				{
					locfil->f_Path = StringDup( path );
				
					if( ( locfil->f_SpecialData = FCalloc( 1, sizeof( SpecialData ) ) ) != NULL )
					{
						SpecialData *locsd = (SpecialData *)locfil->f_SpecialData;
						locsd->fp = locfp;
						locsd->mode = MODE_WRITE;
						locsd->fname = StringDup( tmpfilename );
						locsd->path = StringDup( path );
						locfil->f_SessionID = StringDup( s->f_SessionID );

						DEBUG("FileOpened, memory allocated\n");
				
						return locfil;
					}
					
					// Free it
					FFree( locfil->f_Path );
					FFree( locfil );
				}
				// Close the dangling fp
				fclose( locfp );
			}
			else
			{
				ERROR("Cannot create temporary file %s\n", tmpfilename );
			}
		}
		else
		{
			ERROR("Mode not supported\n");
		}
	}
	
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
			
			if( sd->fp )
			{
				close = fclose( ( FILE *)sd->fp );
				sd->fp = NULL;
			}
			
			DEBUG("CLOSE, file path %s\n", sd->fname );
			
			if( sd->mode == MODE_READ )
			{
				remove( sd->fname );
			}
			else if( sd->mode == MODE_WRITE )
			{
				
				//Write

				//system.library/module?module=files&command=write&sessionid=87b6y897vg6897&path=some:directory/file.txt&data=data
				SpecialData *globalsd = (SpecialData *)s->f_SpecialData;
				
				char command[ 2048 ];
				
				if( PathHasColon( sd->path ) )
				{
					sprintf( command, "php \"modules/system/module.php\" \"module=files&command=write&sessionid=%s&path=%s&tmpfile=%s\";",
						lfp->f_SessionID, sd->path, sd->fname );
				}
				else
				{
					sprintf( command, "php \"modules/system/module.php\" \"module=files&command=write&sessionid=%s&path=%s:%s&tmpfile=%s\";",
						lfp->f_SessionID, s->f_Name, sd->path, sd->fname
					);
				}
				//INFO("Call write command %s\n", command );
				//INFO("\nSDPATH %s\nlf main name %s\n\n", sd->path, s->f_Name ); 
	
				int answerLength = 0;
		
				ListString *result = PHPCall( command, &answerLength );
				if( result != NULL )
				{
					if( result->ls_Data && result->ls_Size > 0 )
					{
						DEBUG("CHECK PHPCLOSE %.*s\n", result->ls_Size, result->ls_Data );
					}
					ListStringDelete( result );
				}
				
				remove( sd->fname );
			}
			
			FFree( sd->fname );
			FFree( sd->path );
			
			FFree( lfp->f_SpecialData );
		}
		
		if( lfp->f_Path ) FFree( lfp->f_Path );
		if( lfp->f_SessionID ) FFree( lfp->f_SessionID );
		if( lfp->f_Buffer ) FFree( lfp->f_Buffer );
		
		// And the structure
		FFree( lfp );
		
		DEBUG( "FileClose: Closing file pointer.\n" );
		
		return close;
	}
	
	return 0;
}

//
// Seek
//

int FileSeek( struct File *s, int pos )
{
	return 0;
}

//
// Read data from file
//

int FileRead( struct File *f, char *buffer, int rsize )
{
	int result = -2;
	
	//DEBUG( "FileRead: Starting to read file.\n" );
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	DEBUG( "Trying to do some reading( %d )!\n", rsize );
	if( sd != NULL )
	{
		if( feof( sd->fp ) )
		{
			ERROR("EOF\n");
			return -1;
		}
		
		DEBUG( "Ok, lets read %d bytes.\n", rsize );
		result = fread( buffer, 1, rsize, sd->fp );
		printf( "[fsysphp] Read %d bytes\n", result );
	}
	
	return result;
}

//
// write data to file
//

int FileWrite( struct File *f, char *buffer, int size  )
{
	int result = -1;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd )
	{
		result = fwrite( buffer, 1, size, sd->fp );
	}

	return result;
}

//
// make directory in local file system
//

int MakeDir( struct File *f, const char *path )
{
	DEBUG("makedir filesystem\n");
	if( f != NULL && f->f_SpecialData != NULL )
	{
		SpecialData *sd = (SpecialData *)f->f_SpecialData;
	
		char command[ 2048 ];	// maybe we should count that...
		
		///system.library/module?module=files&command=dosaction&action=makedir&sessionid=2ffg3987t093843948&path=some:directory/newdir
		
		sprintf( command, "php \"modules/system/module.php\" \"module=files&command=dosaction&action=makedir&sessionid=%s&path=%s\";",
			f->f_SessionID, path
		);
		
		DEBUG("MAKEDIR %s\n", command );
	
		int answerLength = 0;
		
		ListString *result = PHPCall( command, &answerLength );
		
		if( result && result->ls_Size >= 0 )
		{
			if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
			{
				ERROR( "phpfs: Failed to execute makedir on device %s..\n", f->f_Name );
			}
		}
		else
		{
			ERROR( "phpfs: Unknown error unmounting device %s..\n", f->f_Name );
		}
	
		// TODO: we should parse result to get information about success
		if( result ) ListStringDelete( result );
	}

	return -1;
}

//
// Delete
//

int Delete( struct File *s, const char *path )
{
	DEBUG("Delete %s\n", path);
	
	if( s != NULL )
	{
		SpecialData *sd = (SpecialData *)s->f_SpecialData;
	
		char command[ 1024 ];	// maybe we should count that...
		
		sprintf( command, "php \"modules/system/module.php\" \"module=files&command=dosaction&action=delete&sessionid=%s&path=%s\";",
			s->f_SessionID, path
		);
		
		int answerLength;
		ListString *result = PHPCall( command, &answerLength );
		
		// TODO: we should parse result to get information about success
		if( result ) ListStringDelete( result );
		
		// Success
		return 1;
	}
	return -1;
}

//
// Rename
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("Rename %s to %s\n", path, nname );
	
	if( s != NULL )
	{
		SpecialData *sd = (SpecialData *)s->f_SpecialData;
	
		char command[ 1024 ];	// maybe we should count that...
		
		sprintf( command, "php \"modules/system/module.php\" \"module=files&command=dosaction&action=rename&sessionid=%s&path=%s&newname=%s\";",
			s->f_SessionID, path, nname
		);
		
		int answerLength = 0;
		ListString *result = PHPCall( command, &answerLength );
		
		// TODO: we should parse result to get information about success
		if( result ) ListStringDelete( result );
		
		// Success
		return 1;
	}
	return -1;
}


//
// Copy file from source to destination
//

int Copy( struct File *s, const char *dst, const char *src )
{
	int error = 0;
	DEBUG("Copy!\n");
	
	
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
	
	return NULL;
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
		strcat( comm, &(path[ doub+2 ]) );
		
		DEBUG("PATH created %s\n", comm );
	
		struct stat ls;
		
		if( stat( comm, &ls ) == 0 )
		{
			//FillStat( bs, &ls, s, comm );
		}
		else
		{
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
	if( s != NULL )
	{
		SpecialData *sd = (SpecialData *)s->f_SpecialData;
	
		char command[ 1024 ];	// maybe we should count that...
		
		sprintf( command, "php \"modules/system/module.php\" \"type=%s&module=files&args=false&command=directory&authkey=false&sessionid=%s&path=%s&subPath=\";",
			sd->type, s->f_SessionID, path
		);
		
		int answerLength;
		ListString *result = PHPCall( command, &answerLength );
		BufString *bs =BufStringNewSize( result->ls_Size );
		BufStringAddSize( bs, result->ls_Data, result->ls_Size );
		ListStringDelete( result );
		
		// we should parse result to get information about success
	
		return bs;
	}
	return NULL;
}
