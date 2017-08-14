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
	SystemBase *sb;
} SpecialData;


const char *GetSuffix()
{
	return SUFFIX;
}

//
//
//

FBOOL PathHasColon( char *string )
{
	// No literal colon
	int size = strlen( string ) + 1;
	char *dec = FCalloc( size, sizeof( char ) );
	UrlDecode( dec, (const char *)string );
	DEBUG( "[fsysphp] Decoded string for path: %s\n", dec );
	if( strchr( dec, ':' ) != NULL )
	{
		FFree( dec );
		return TRUE;
	}
	FFree( dec );
	return FALSE;
}

//
// Remove dangerous stuff from strings
//

char *FilterPHPVar( char *line )
{
	if( !line ) return NULL;
	
	int len = strlen( line ) + 1;
	int i = 0; for( ; i < len; i++ )
	{
		// Skip escaped characters
		if( i < len - 1 && line[ i ] == '\\' )
		{
			i++;
			continue;
		}
		// Kill unwanted stuff
		if( line[ i ] == '`' )
			line[ i ] = ' ';
		else if( line[ i ] == '"' || line[ i ] == '\n' || line[ i ] == '\r' )
			line[ i ] = ' '; // Eradicate!
	}
	return line;
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
		//DEBUG("[fsysphp] Cannot copy string!\n");
		return NULL;
	}
	
	int len = strlen( str );
	char *res = NULL;
	if( ( res = FCalloc( len + 1, sizeof( char ) ) ) != NULL )
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
	for( ; i >= 0 ; i-- )
	{
		if( path[ i ] == '/' )
		{
			return (char *)&path[ i + 1 ];
		}
	}
	return p;
}

//
// php call, send request, read answer
//

ListString *PHPCall( const char *command, int *length )
{
	DEBUG("[PHPFsys] run app: '%s'\n", command );
	//Log( FLOG_INFO, "[PHPFsys] run app: '%s'\n", command );
	
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		//free( command );
		FERROR("[PHPFsys] cannot open pipe: %s\n", strerror(errno) );
		return NULL;
	}
	
	char *temp = NULL, *result = NULL, *gptr = NULL;
	int size = 0, res = 0, sch = sizeof( char );

#define PHP_READ_SIZE 262144
	
	//DEBUG("[PHPFsys] command launched\n");

	char buf[ PHP_READ_SIZE ]; memset( buf, '\0', PHP_READ_SIZE );
	ListString *data = ListStringNew();
	
	while( !feof( pipe ) )
	{
		// Make a new buffer and read
		size = fread( buf, sch, PHP_READ_SIZE, pipe );
		//DEBUG( "[PHPFsys] Adding %d of data\n", size );
		ListStringAdd( data, buf, size );
	}
	
	// Free pipe if it's there
	pclose( pipe );
	
	ListStringJoin( data );		//we join all string into one buffer

	// Set the length
	if( length != NULL ) *length = data->ls_Size;
	
	//DEBUG( "[fsysphp] Finished PHP call...(%d length)--------------------------%s\n", data->ls_Size, data->ls_Data );
	return data;
}

//
//
//

void init( struct FHandler *s )
{
	DEBUG("[PHPFS] init\n");
}

//
//
//

void deinit( struct FHandler *s )
{
	DEBUG("[PHPFS] deinit\n");
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, User *usr )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	//UserSession *us =  NULL;
	//User *usr = NULL;
	char *module = NULL;
	char *type = NULL;
	char *authid = NULL;
	FULONG id = 0;
	
	SystemBase *sb = NULL;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("[fsysphp] Mounting PHPFS filesystem!\n");
	
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
				case FSys_Mount_Server:
					break;
				case FSys_Mount_Port:
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_ID:
					id = (FULONG)lptr->ti_Data;
					break;
				case FSys_Mount_Type:
					type = (char *)lptr->ti_Data;
					//INFO("TYPE PASSED %s size %d\n", type, strlen( type ) );
					break;
				case FSys_Mount_Module:
					module = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_SysBase:
					sb = (SystemBase *)lptr->ti_Data;
					break;
			}
			lptr++;
		}
		
		//
		/*
		if( path == NULL )// || strlen( path ) < 1 )
		{
			DEBUG("[FERROR]: Path option not found!\n");
			free( dev );
			return NULL;
		}
		*/

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
			DEBUG("[fsysphp] phpfs path is ok '%s' (ignore this message, unimplemented!)\n", dev->f_Path );
		}
		
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usr;
		dev->f_Name = StringDup( name );
		
		dev->f_Type = FType_Directory;
		dev->f_Size = 0;
		
		SpecialData *sd = FCalloc( 1, sizeof( SpecialData ) );
		if( sd != NULL )
		{
			sd->module = StringDup( module );
			DEBUG( "Copying session.\n" );
			dev->f_SessionID = StringDup( usr->u_MainSessionID );
			sd->type = StringDup( type );
			dev->f_SpecialData = sd;
			sd->sb = sb;
			
			// Calculate length of variables in string
			int cmdLength = strlen( "command=dosaction&action=mount&type=&devname=&path=&module=&sessionid=" ) +
				( type ? strlen( type ) : 0 ) + 
				( name ? strlen( name ) : 0 ) + 
				( path ? strlen( path ) : 0 ) + 
				( module ? strlen( module ) : strlen( "files" ) ) + 
				( usr->u_MainSessionID ? strlen( usr->u_MainSessionID ) : 0 ) + 1;
			
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "command=dosaction&action=mount&type=%s&devname=%s&path=%s&module=%s&sessionid=%s",
						type ? type : "", 
						name ? name : "", 
						path ? path : "", 
						module ? module : "files", 
						usr->u_MainSessionID ? usr->u_MainSessionID : ""  );
					sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
			
					// Execute!
					int answerLength = 0;
					ListString *result = PHPCall( command, &answerLength );
					FFree( command );
			
					if( result && result->ls_Size >= 0 )
					{

						DEBUG( "[fsysphp] Return was \"%s\"\n", result->ls_Data );
						if( strncmp( result->ls_Data, "ok", 2 ) != 0 )
						{
							DEBUG( "[fsysphp] Failed to mount device %s..\n", name );
							DEBUG( "[fsysphp] Output was: %s\n", result->ls_Data );
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
						DEBUG( "[fsysphp] Error mounting device %s..\n", name );
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
				else
				{
					FFree( command );
				}
			}
		}
		DEBUG("[fsysphp] IS DIRECTORY data filled\n");
	}
	
	DEBUG("[fsysphp] mount ok\n");
	
	return dev;
}

//
// Only free device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[fsysphp] Release filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sd = (SpecialData *)lf->f_SpecialData;
		
			// Free up active device information
			if( sd->module ){ FFree( sd->module ); }
			if( sd->type ){ FFree( sd->type ); }
			FFree( lf->f_SpecialData );
		}
		
		// Free up active device information
		if( lf->f_Name ){ FFree( lf->f_Name ); lf->f_Name = NULL; }
		if( lf->f_Path ){ FFree( lf->f_Path ); lf->f_Path = NULL; }
		if( lf->f_SessionID ){ FFree( lf->f_SessionID ); lf->f_SessionID = NULL; }
	}
	return 0;
}

//
// Unmount device
//

int UnMount( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[fsysphp] Unmount filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sd = (SpecialData *)lf->f_SpecialData;
		
			// Calculate length of variables in string
			int cmdLength = strlen( "command=dosaction&action=unmount&devname=&module=&sessionid=" ) +
				( lf->f_Name ? strlen( lf->f_Name ) : 0 ) + 
				( sd->module ? strlen( sd->module ) : strlen( "files" ) ) + 
				( lf->f_SessionID ? strlen( lf->f_SessionID ) : 0 )
				+ 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "command=dosaction&action=unmount&devname=%s&module=%s&sessionid=%s",
						lf->f_Name ? lf->f_Name : "", sd->module ? sd->module : "files", lf->f_SessionID ? lf->f_SessionID : "" );
					sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
			
					int answerLength = 0;
					ListString *result = PHPCall( command, &answerLength );
					
					FFree( command );
					
					if( result && result->ls_Size >= 0 )
					{
						if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
						{
							DEBUG( "[fsysphp] Failed to unmount device %s..\n", lf->f_Name );
						}
					}
					else
					{
						DEBUG( "[fsysphp] Unknown error unmounting device %s..\n", lf->f_Name );
					}
					if( result ) ListStringDelete( result );
				}
				else FFree( command );
			}
		
			// TODO: we should parse result to get information about success
			
			// Free up active device information
			if( sd->module ) FFree( sd->module );
			if( sd->type ) FFree( sd->type ); 
			FFree( lf->f_SpecialData );
			lf->f_SpecialData = NULL;
		}
		
		// Free up active device information
		if( lf->f_Name )
		{ 
			FFree( lf->f_Name ); 
			lf->f_Name = NULL;
		}
		if( lf->f_Path )
		{ 
			FFree( lf->f_Path ); 
			lf->f_Path = NULL;
		}
		if( lf->f_SessionID ) 
		{
			FFree( lf->f_SessionID ); 
			lf->f_SessionID = NULL;
		}
	}
	return 0;
}

//
// Open file
//

void *FileOpen( struct File *s, const char *path, char *mode )
{
	// Read
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	if( !sd ) return NULL;
	
	// Url encoded device name
	char *comm = FCalloc( strlen( s->f_Name ) + strlen( path ) + 2, sizeof( char ) );
	sprintf( comm, "%s:%s", s->f_Name, path );
	char *encodedcomm = MarkAndBase64EncodeString( comm );
	FFree( comm );
	
	// Calculate length of variables in string
	int cmdLength = strlen( "type=&module=files&args=false&command=read&authkey=false&sessionid=&path=&mode=" ) +
		( sd->type ? strlen( sd->type ) : 0 ) + 
		( s->f_SessionID ? strlen( s->f_SessionID ) : 0 ) +
		( encodedcomm ? strlen( encodedcomm ) : 0 ) +
		( mode ? strlen( mode ) : 0 ) + 1;
	
	// Whole command
	char *command = FCalloc(
		strlen( "php \"modules/system/module.php\" \"\";" ) +
		cmdLength + 1, sizeof( char ) );
	
	if( command != NULL )
	{
		// Just get vars
		char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
	
		// Generate command string
		if( commandCnt != NULL )
		{
			snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=read&authkey=false&sessionid=%s&path=%s&mode=%s",
				sd->type ? sd->type : "", s->f_SessionID ? s->f_SessionID : "", encodedcomm ? encodedcomm : "", mode ? mode : "" );
			sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
			FFree( commandCnt );
		}
	}
	// Memory problem, abort!
	else
	{
		FFree( encodedcomm );
		return NULL;
	}
		
	//
	// read stream
	//
	
	if( strcmp( mode, "rs" ) == 0 )
	{
		FILE *pipe = popen( command, "r" );
		if( !pipe )
		{
			FFree( command );
			FFree( encodedcomm );
			FERROR("[PHPFsys] cannot open pipe\n");
			return NULL;
		}
	
		File *locfil = NULL;
		if( ( locfil = FCalloc( 1, sizeof( File ) ) ) != NULL )
		{
			locfil->f_Path = StringDup( path );
	
			if( ( locfil->f_SpecialData = FCalloc( 1, sizeof( SpecialData ) ) ) != NULL )
			{
				sd->fp = pipe; 
				SpecialData *locsd = (SpecialData *)locfil->f_SpecialData;
				locsd->sb = sd->sb;
				locsd->fp = pipe;
				locsd->mode = MODE_READ;
				//locsd->fname = StringDup( tmpfilename );
				locsd->path = StringDup( path );
				locfil->f_SessionID = StringDup( s->f_SessionID );
		
				DEBUG("[fsysphp] FileOpened, memory allocated for reading.\n" );
				FFree( command );
				FFree( encodedcomm );
				return locfil;
			}
	
			// Free this one
			FFree( locfil->f_Path );
			locfil->f_Path = NULL;
			FFree( locfil );
		}
		else
		{
			FFree( command );
			FFree( encodedcomm );
			FERROR("[PHPFsys] cannot alloc memory\n");
			return NULL;
		}
	}
	
	//
	// read to temp file
	//
	
	else if( mode[0] == 'r' || strcmp( mode, "rb" ) == 0 )
	{
		char tmpfilename[ 712 ];
		int lockf;

		// Make sure we can make the tmp file unique with lock!
		int retries = 100;
		do
		{
			snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/%s_read_%d%d%d%d", s->f_SessionID, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
			//DEBUG( "[fsysphp] Trying to lock %s\n", tmpfilename );
			if( ( lockf = open( tmpfilename, O_CREAT|O_EXCL|O_RDWR ) ) >= 0 )
			{
				break;
			}
			unlink( tmpfilename );
			// Failed.. bailing
			if( retries-- <= 0 )
			{
				FERROR( "[fsysphp] [FileOpen] Failed to get exclusive lock on lockfile.\n" );
				FFree( command );
				FFree( encodedcomm );
				return NULL;
			}
		}
		while( TRUE );

		DEBUG( "[fsysphp] Success in locking %s\n", tmpfilename );

		// Open the tmp file and get a file lock!

		// Get the data
		//char command[ 1024 ];	// maybe we should count that...

		DEBUG( "[fsysphp] Getting data for tempfile, seen below as command:\n" );
		DEBUG( "[fsysphp] %s\n", command );

		int answerLength = 0;			
		ListString *result = PHPCall( command, &answerLength );

		// Open a file pointer
		if( result )
		{
			if( result->ls_Data )
			{
				// Write the buffer to the file
				int written = write( lockf, ( void *)result->ls_Data, result->ls_Size );
	
				// Clean out result
				ListStringDelete( result ); result = NULL;

				// Remove lock!
				FILE *locfp = NULL;
				fcntl( lockf, F_SETLKW, F_UNLCK );
				fchmod( lockf, 0755 );
				close( lockf );
				lockf = -1;
	
				if( ( locfp = fopen( tmpfilename, mode ) ) != NULL )
				{
					// Flick the lock off!
					fseek ( locfp, 0, SEEK_SET );
		
					// Ready the file structure
					File *locfil = NULL;
					if( ( locfil = FCalloc( 1, sizeof( File ) ) ) != NULL )
					{
						locfil->f_Path = StringDup( path );
			
						if( ( locfil->f_SpecialData = FCalloc( 1, sizeof( SpecialData ) ) ) != NULL )
						{
							sd->fp = locfp; // TODO: Why is this here??
							SpecialData *locsd = (SpecialData *)locfil->f_SpecialData;
							locsd->sb = sd->sb;
							locsd->fp = locfp;
							locsd->mode = MODE_READ;
							locsd->fname = StringDup( tmpfilename );
							locsd->path = StringDup( path );
							locfil->f_SessionID = StringDup( s->f_SessionID );
		
							DEBUG("[fsysphp] FileOpened, memory allocated for reading.\n" );
							FFree( command );
							FFree( encodedcomm );
							return locfil;
						}
	
						// Free this one
						FFree( locfil->f_Path );
						locfil->f_Path = NULL;
						FFree( locfil );
					}
					// Close the dangling fp
					fclose( locfp );
				}
				else
				{
					FERROR("[fsysphp] Cannot open temporary file %s\n", tmpfilename );
				}
			}
			// Remove result with no data
			else
			{
				ListStringDelete( result );
			}
		}
		else
		{
			FERROR("[fsysphp] Cannot create temporary file %s\n", tmpfilename );
		}
		// Close lock
		if( lockf >= 0 ) 
		{
			DEBUG( "[fsysphp] Closing lock..\n" );
			close( lockf );
		}
	}
	else if( mode[0] == 'w' )
	{
		char tmpfilename[ 712 ];

		// Make sure we can make the tmp file unique
		//do
		//{
		snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/%s_write_%d%d%d%d", s->f_SessionID, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
		//}
		//while( access( tmpfilename, F_OK ) != -1 );

		DEBUG("[fsysphp] WRITE FILE %s\n", tmpfilename );

		FILE *locfp = NULL;
		if( ( locfp = fopen( tmpfilename, "w+" ) ) != NULL )
		{
			File *locfil = NULL;
			if( ( locfil = FCalloc( 1, sizeof( File ) ) ) != NULL )
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

					DEBUG("[fsysphp] FileOpened, memory allocated.. store to file %s fid %p\n", locsd->fname, locfp );
	
					FFree( command );
					FFree( encodedcomm );
					return locfil;
				}
		
				// Free it
				if( locfil->f_Path != NULL )
				{
					FFree( locfil->f_Path );
					locfil->f_Path = NULL;
				}
				FFree( locfil );
			}
			// Close the dangling fp
			fclose( locfp );
		}
		else
		{
			FERROR("Cannot create temporary file %s\n", tmpfilename );
		}
	}
	else
	{
		FERROR("Mode not supported\n");
	}
	FFree( command );
	FFree( encodedcomm );
	
	return NULL;
}

//
// Close File
//

int FileClose( struct File *s, void *fp )
{
	if( fp != NULL )
	{
		int closeerr = 0;
		
		File *lfp = ( File *)fp;
		
		if( lfp->f_SpecialData )
		{
			SpecialData *sd = ( SpecialData *)lfp->f_SpecialData;
			
			if( sd->fp )
			{
				if( lfp->f_Stream == TRUE )
				{
					closeerr = pclose( ( FILE *)sd->fp );
				}
				else
				{
					closeerr = fclose( ( FILE *)sd->fp );
				}
				sd->fp = NULL;
			}
			
			DEBUG("[fsysphp] CLOSE, file path %s\n", sd->fname );
			
			if( sd->mode == MODE_READ )
			{
				if( lfp->f_Stream == FALSE )
				{
					remove( sd->fname );
				}
			}
			else if( sd->mode == MODE_WRITE )
			{
				// Url encoded device name
				char *encPath = NULL;
				// Add colon here
				if( !PathHasColon( sd->path ) )
				{
					char *tmpPath = FCalloc( strlen( s->f_Name ) + strlen( sd->path ) + 2, sizeof( char ) );
					sprintf( tmpPath, "%s:%s", s->f_Name, sd->path );
					encPath = MarkAndBase64EncodeString( tmpPath );
					FFree( tmpPath );
				}
				else
				{
					encPath = MarkAndBase64EncodeString( sd->path );
				}
	
				// Calculate length of variables in string
				int cmdLength = strlen( "module=files&command=write&sessionid=&path=&tmpfile=" ) +
					( lfp->f_SessionID ? strlen( lfp->f_SessionID ) : 0 ) +
					( encPath ? strlen( encPath ) : 0 ) + 
					( sd->fname ? strlen( sd->fname ) : 0 ) + 1;
				
				// Whole command
				char *command = FCalloc(
					strlen( "php \"modules/system/module.php\" \"\";" ) +
					cmdLength + 1, sizeof( char ) );
	
				if( command != NULL )
				{
					// Just get vars
					char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
	
					// Generate command string
					if( commandCnt != NULL )
					{
						snprintf( commandCnt, cmdLength, "module=files&command=write&sessionid=%s&path=%s&tmpfile=%s",
							lfp->f_SessionID ? lfp->f_SessionID : "", encPath ? encPath : "", sd->fname ? sd->fname : "" );
						sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
						FFree( commandCnt );
				
						//INFO("Call write command %s\n", command );
						//INFO("\nSDPATH %s\nlf main name %s\n\n", sd->path, s->f_Name ); 
	
						int answerLength = 0;
		
						ListString *result = PHPCall( command, &answerLength );
						if( result != NULL )
						{
							DEBUG( "[fsysphp] Closed file using PHP call.\n" );
							ListStringDelete( result );
						}
					}
					FFree( command );
				}
				
				if( encPath ) FFree( encPath );
				
				remove( sd->fname );
			}
			
			if ( sd->fname != NULL ){ FFree( sd->fname ); sd->fname = NULL; }
			if ( sd->path != NULL ){ FFree( sd->path ); sd->path = NULL; }
			if ( lfp->f_SpecialData != NULL ){ FFree( lfp->f_SpecialData ); lfp->f_SpecialData = NULL; }
		}
		
		if( lfp->f_Path != NULL ){ FFree( lfp->f_Path ); lfp->f_Path = NULL; }
		if( lfp->f_SessionID != NULL ) FFree( lfp->f_SessionID );
		if( lfp->f_Buffer != NULL )    FFree( lfp->f_Buffer );
		
		// And the structure
		FFree( lfp );
		
		DEBUG( "[fsysphp] FileClose: Closing file pointer done.\n" );
		
		return closeerr;
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
	//DEBUG( "[fsysphp] Trying to do some reading( %d )!\n", rsize );
	if( sd != NULL )
	{
		if( f->f_Stream == TRUE )
		{
			SpecialData *sd = (SpecialData *)f->f_SpecialData;
			
			if( feof( sd->fp ) )
			{
				DEBUG("[fsysphp] EOF\n");
				return -1;
			}

			// Make a new buffer and read
			result = fread( buffer, 1, rsize, sd->fp  );
			//DEBUG( "[PHPFsys] Adding %ul of data\n", result );
			
			if( f->f_Socket )
			{
				char *ptr = strstr( buffer, "---http-headers-end---\n" );
				SystemBase *sb = (SystemBase *)sd->sb;
				
				if( ptr != NULL && result > 23 )
				{
					sb->sl_SocketInterface.SocketWrite( f->f_Socket, (ptr+23), (FQUAD)(result-23) );
				}
				else
				{
					sb->sl_SocketInterface.SocketWrite( f->f_Socket, buffer, (FQUAD)result );
				}
			}
		}
		
		//
		// no streaming
		//
		
		else
		{
			if( feof( sd->fp ) )
			{
				DEBUG("[fsysphp] EOF\n");
				return -1;
			}
		
			//DEBUG( "[fsysphp] Ok, lets read %d bytes.\n", rsize );
			result = fread( buffer, 1, rsize, sd->fp );
			//DEBUG( "[fsysphp] Read %d bytes\n", result );
		}
	}
	printf("PHPRead %d\n", result );
	
	return result;
}

//
// write data to file
//

int FileWrite( struct File *f, char *buffer, int size  )
{
	int result = -1;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd != NULL )
	{
		DEBUG("Save to file %s size %d  fileid %p\n", sd->fname, size, sd->fp );
		result = fwrite( buffer, 1, size, sd->fp );
	}

	return result;
}

char *InfoGet( struct File *f, const char *path, const char *key )
{
	if( f == NULL )
		return NULL;
		
	DEBUG("[fsysphp] Get information\n");
	
	File *lf = ( File *)f;
	if( lf->f_SpecialData )
	{
		SpecialData *sd = (SpecialData *)lf->f_SpecialData;
	
		char *urlPath = MarkAndBase64EncodeString( path );
		char *urlKey = MarkAndBase64EncodeString( key );
		
		// Calculate length of variables in string
		int cmdLength = strlen( "command=infoget&path=&module=files&sessionid=&key=" ) +
			( urlPath ? strlen( urlPath ) : 0 ) +  
			( lf->f_SessionID ? strlen( lf->f_SessionID ) : 0 ) +
			( urlKey == NULL ? 1 : strlen( urlKey ) ) + 1;
		
		// Whole command
		char *command = FCalloc(
			strlen( "php \"modules/system/module.php\" \"\";" ) +
			cmdLength + 1, sizeof( char ) );
		
		if( command != NULL )
		{	
			// Just get vars
			char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
		
			// Generate command string
			if( commandCnt != NULL )
			{
				snprintf( commandCnt, cmdLength, "command=infoget&path=%s&module=files&sessionid=%s&key=%s",
					urlPath ? urlPath : "", lf->f_SessionID ? lf->f_SessionID : "", urlKey == NULL ? "*" : urlKey );
				sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
				FFree( commandCnt );
	
				int answerLength = 0;
				ListString *result = PHPCall( command, &answerLength );
				
				FFree( command );
				
				if( result && result->ls_Size >= 0 )
				{
					if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
					{
						DEBUG( "[fsysphp] Failed to get information..\n" );
					}
					// Success!
					else
					{
						char *res = result->ls_Data;
						result->ls_Data = NULL;
						if( result ) ListStringDelete( result );
						
						if( urlPath ) FFree( urlPath );
						if( urlKey ) FFree( urlKey );
						
						return res;
					}	
				}
				else
				{
					DEBUG( "[fsysphp] Unknown error getting information\n" );
				}
				
				// we should parse result to get information about success
				if( result ) ListStringDelete( result );
				
			}
			else
			{
				FFree( command );
			}
		}
		
		// If we get here, free theze
		if( urlPath ) FFree( urlPath );
		if( urlKey ) FFree( urlKey );
	}
	return NULL;
}

int InfoSet( struct File *s, const char *path, const char *key, const char *value )
{
	return -1;
}

//
// make directory in php file system
//

int MakeDir( struct File *f, const char *path )
{
	DEBUG("[fsysphp] makedir filesystem\n");
	if( f != NULL && f->f_SpecialData != NULL )
	{
		SpecialData *sd = (SpecialData *)f->f_SpecialData;
		
		char *comm = NULL;
		if( !PathHasColon( (char *) path ) )
		{
			int len = strlen( path ) + strlen( f->f_Name ) + 2;
			char *tmp = FCalloc( len, sizeof( char ) );
			snprintf( tmp, len, "%s:%s", f->f_Name, path );
			comm = MarkAndBase64EncodeString( tmp );
			FFree( tmp );
		}
		else
		{
			comm = MarkAndBase64EncodeString( path );
		}
		
		// Calculate length of variables in string
		int cmdLength = strlen( "module=files&command=dosaction&action=makedir&sessionid=&path=" ) +
			( f->f_SessionID ? strlen( f->f_SessionID ) : 0 ) +
			( comm ? strlen( comm ) : 0 ) + 1;
		
		// Whole command
		char *command = FCalloc(
			strlen( "php \"modules/system/module.php\" \"\";" ) +
			cmdLength + 1, sizeof( char ) );
		
		if( command != NULL )
		{	
			// Just get vars
			char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
		
			// Generate command string
			if( commandCnt != NULL )
			{
				snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=makedir&sessionid=%s&path=%s",
					f->f_SessionID ? f->f_SessionID : "", comm ? comm : "" );
				sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
				FFree( commandCnt );
			
				DEBUG("[fsysphp] MAKEDIR %s\n", command );
	
				int answerLength = 0;
		
				ListString *result = PHPCall( command, &answerLength );
		
				if( result && result->ls_Size >= 0 )
				{
					// TODO: Handle, especially "already exists" reasoning
					if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
					{
						FERROR( "[fsysphp] phpfs: Failed to execute makedir '%s' on device '%s'\n", comm, f->f_Name );
						//FERROR( "[fsysphp] phpfs said: %s\n", result->ls_Data );
					
						// TODO: Also return FERROR! :)
						ListStringDelete( result );
						FFree( command );
						FFree( comm );
						return -1;
					}
				}
				else
				{
					FERROR( "[fsysphp] Unknown error unmounting device %s..\n", f->f_Name );
				}
				
				// TODO: we should parse result to get information about success
				if( result ) ListStringDelete( result );
			}
			
			FFree( command );
		}
		FFree( comm );
	}
	else
	{
		return -1;
	}
	return 1;
}

//
// Delete
//

int Delete( struct File *s, const char *path )
{
	DEBUG("[fsysphp] Delete %s\n", path);
	if( s != NULL )
	{
		// Fix path
		char *comm = NULL;
		if( !PathHasColon( (char *)path ) )
		{
			int len = strlen( path ) + strlen( s->f_Name ) + 2;
			char *tmp = FCalloc( len, sizeof( char ) );
			snprintf( tmp, len, "%s:%s", s->f_Name, path );
			comm = MarkAndBase64EncodeString( tmp );
			FFree( tmp );
		}
		else
		{
			comm = MarkAndBase64EncodeString( path );
		}
	
		// Calculate length of variables in string
		int cmdLength = strlen( "module=files&command=dosaction&action=delete&sessionid=&path=" ) +
			( s->f_SessionID ? strlen( s->f_SessionID ) : 0 ) +
			( comm ? strlen( comm ) : 0 ) + 1;
	
		// Whole command
		char *command = FCalloc(
			strlen( "php \"modules/system/module.php\" \"\";" ) +
			cmdLength + 1, sizeof( char ) );

		if( command != NULL )
		{
			// Just get vars
			char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );

			// Generate command string
			if( commandCnt != NULL )
			{					
				snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=delete&sessionid=%s&path=%s",
					s->f_SessionID ? s->f_SessionID : "", comm ? comm : "" );
				sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
				FFree( commandCnt );
		
				SpecialData *sd = (SpecialData *)s->f_SpecialData;
		
				int answerLength = 0;
				ListString *result = PHPCall( command, &answerLength );
		
				// TODO: we should parse result to get information about success
				if( result )
				{
					ListStringDelete( result );
				}
			}
			
			FFree( command );
			// Success
		}
		FFree( comm );
	}
	else
	{
		return -1;
	}
	return 0;
}

//
// Rename
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("[fsysphp] Rename %s to %s\n", path, nname );
	
	if( s != NULL )
	{
		char *comm = NULL;
	
		if( ( comm = FCalloc( strlen( path ) + strlen( s->f_Name ) + 2, sizeof(char) ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL )
			{
				strcat( comm, path ); 
			}
		
			SpecialData *sd = (SpecialData *)s->f_SpecialData;
	
			char *encPath = MarkAndBase64EncodeString( comm );
			
			char *newName = MarkAndBase64EncodeString( nname );
			
	
			// Calculate length of variables in string
			int cmdLength = strlen( "module=files&command=dosaction&action=rename&sessionid=&path=&newname=" ) +
				( s->f_SessionID ? strlen( s->f_SessionID ) : 0 ) +
				( encPath ? strlen( encPath ) : 0 ) + 
				( newName ? strlen( newName ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );

			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );

				// Generate command string
				if( commandCnt != NULL )
				{
					//DEBUG( "Renaming from %s to %s...\n", encPath, newName );
					
					snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=rename&sessionid=%s&path=%s&newname=%s",
						s->f_SessionID ? s->f_SessionID : "", encPath ? encPath : "", newName ? newName : "" );
					sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
					
					int answerLength = 0;
					ListString *result = PHPCall( command, &answerLength );
		
					// TODO: we should parse result to get information about success
					if( result )
					{
						ListStringDelete( result );
					}
				}
				FFree( command );
			}
			
			if( encPath ) FFree( encPath );
			if( newName ) FFree( newName );
			
			FFree( comm );
		}
	}
	else
	{
		return -1;
	}
	return 1;
}


//
// Copy file from source to destination
//

int Copy( struct File *s, const char *dst, const char *src )
{
	int error = 0;
	DEBUG("[fsysphp] Copy!\n");
	
	
	DEBUG("[fsysphp] Copy END\n");
	
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
	char *comm = NULL;
	
	if( s != NULL )
	{
		char *comm = NULL;
	
		if( ( comm = FCalloc( strlen( path ) + strlen( s->f_Name ) + 2, sizeof(char) ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL )
				strcat( comm, path ); 
		
			SpecialData *sd = (SpecialData *)s->f_SpecialData;
	
			char *encPath = MarkAndBase64EncodeString( comm ); FFree( comm );
		
			// Calculate length of variables in string
			int cmdLength = strlen( "type=&module=files&args=false&command=info&authkey=false&sessionid=&path=&subPath=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) + 
				( s->f_SessionID ? strlen( s->f_SessionID ) : 0 ) + 
				( encPath ? strlen( encPath ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
				
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=info&authkey=false&sessionid=%s&path=%s&subPath=",
						sd->type ? sd->type : "", s->f_SessionID ? s->f_SessionID : "", encPath ? encPath : "" );
					sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
			
					// Execute!
					int answerLength = 0;
					BufString *bs = NULL;
					ListString *result = PHPCall( command, &answerLength );
					if( result != NULL )
					{
						bs = BufStringNewSize( result->ls_Size );
						if( bs != NULL )
						{
							BufStringAddSize( bs, result->ls_Data, result->ls_Size );
						}
						ListStringDelete( result );
					}
					// we should parse result to get information about success
				
					FFree( command );
					FFree( encPath );
					return bs;
				}
				FFree( command );
			}
			FFree( encPath );
		}
	}
	return NULL;
}

//
// Call a library on filesystem
//

BufString *Call( File *s, const char *path, char *args )
{
	if( s != NULL )
	{
		char *comm = NULL;
		if( ( comm = FCalloc( strlen( path ) + strlen( s->f_Name ) + 2, sizeof(char) ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL ) strcat( comm, path );
			
			SpecialData *sd = (SpecialData *)s->f_SpecialData;
			
			// Encoded path
			char *encComm = MarkAndBase64EncodeString( comm );
			if( !encComm ) encComm = comm;
			else FFree( comm );
	
			// Calculate length of variables in string
			int cmdLength = strlen( "type=&module=files&command=call&authkey=false&sessionid=&path=&args=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) + 
				( s->f_SessionID ? strlen( s->f_SessionID ) : 0 ) + 
				( encComm ? strlen( encComm ) : 0 ) +
				( args ? strlen( args ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&module=files&command=call&authkey=false&sessionid=%s&path=%s&args=%s",
						sd->type ? sd->type : "", s->f_SessionID ? s->f_SessionID : "", encComm ? encComm : "", args ? args : "" );
					sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
			
					int answerLength = 0;
					BufString *bs = NULL;
					ListString *result = PHPCall( command, &answerLength );
					if( result != NULL )
					{
						bs =BufStringNewSize( result->ls_Size );
						if( bs != NULL )
						{
							BufStringAddSize( bs, result->ls_Data, result->ls_Size );
						}
						ListStringDelete( result );
					}
					// we should parse result to get information about success
	
					FFree( encComm );
					FFree( command );
					return bs;
				}
				FFree( command );
			}
			if( encComm ) FFree( encComm );
		}
	}
	return NULL;
}

//
// return content of directory
//
	
BufString *Dir( File *s, const char *path )
{
	if( s != NULL )
	{
		char *comm = NULL;
		if( ( comm = FCalloc( strlen( path ) + strlen( s->f_Name ) + 2, sizeof(char) ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL ) strcat( comm, path );
			
			SpecialData *sd = (SpecialData *)s->f_SpecialData;
			
			// Encoded path
			char *encComm = MarkAndBase64EncodeString( comm );
			if( !encComm ) encComm = comm;
			else FFree( comm );
			
			// Calculate length of variables in string
			int cmdLength = strlen( "type=&module=files&args=false&command=directory&authkey=false&sessionid=&path=&subPath=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) +
				( s->f_SessionID ? strlen( s->f_SessionID ) : 0 ) +
				( encComm ? strlen( encComm ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=directory&authkey=false&sessionid=%s&path=%s&subPath=",
						sd->type ? sd->type : "", s->f_SessionID ? s->f_SessionID : "", encComm ? encComm : "" );
					sprintf( command, "php \"modules/system/module.php\" \"%s\";", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
		
					int answerLength;
					BufString *bs  = NULL;
					ListString *result = PHPCall( command, &answerLength );
					if( result != NULL )
					{
						bs =BufStringNewSize( result->ls_Size );
						if( bs != NULL )
						{
							BufStringAddSize( bs, result->ls_Data, result->ls_Size );
						}
						ListStringDelete( result );
					}
		
					FFree( command );
					FFree( encComm );
					return bs;
				}
			}
			// we should parse result to get information about success
	
			FFree( encComm );
			return NULL;
		}
	}
	return NULL;
}

