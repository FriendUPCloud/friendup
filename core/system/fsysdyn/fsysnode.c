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
#include <math.h>
#include <fcntl.h>
#include <system/systembase.h>
#include <util/log/log.h>
#include <util/list.h>
#include <util/buffered_string.h>
#include <util/list_string.h>
#include <util/string.h>
#include <sys/file.h>
#include <sys/stat.h>
#include <dirent.h>

#define SUFFIX "fsys"
#define PREFIX "node"

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
	DEBUG( "[fsysnode] Decoded string for path: %s\n", dec );
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

char *FilterNodeVar( char *line )
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
		//DEBUG("[fsysnode] Cannot copy string!\n");
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
// node call, send request, read answer
//

ListString *NodeCall( const char *command, int *length )
{
	DEBUG("[NodeFsys] run app: '%s'\n", command );
	//Log( FLOG_INFO, "[nodeFsys] run app: '%s'\n", command );
	
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		//free( command );
		FERROR("[NodeFsys] cannot open pipe: %s\n", strerror(errno) );
		return NULL;
	}
	
	char *temp = NULL, *result = NULL, *gptr = NULL;
	int size = 0, res = 0, sch = sizeof( char );

#define NODE_READ_SIZE 262144
	
	//DEBUG("[nodeFsys] command launched\n");

	char buf[ NODE_READ_SIZE ]; memset( buf, '\0', NODE_READ_SIZE );
	ListString *data = ListStringNew();
	
	while( !feof( pipe ) )
	{
		// Make a new buffer and read
		size = fread( buf, sch, NODE_READ_SIZE, pipe );
		//DEBUG( "[nodeFsys] Adding %d of data\n", size );
		ListStringAdd( data, buf, size );
	}
	
	// Free pipe if it's there
	pclose( pipe );
	
	ListStringJoin( data );		//we join all string into one buffer

	// Set the length
	if( length != NULL ) *length = data->ls_Size;
	
	//DEBUG( "[fsysnode] Finished node call...(%d length)--------------------------%s\n", data->ls_Size, data->ls_Data );
	return data;
}

//
//
//

void init( struct FHandler *s )
{
	DEBUG("[NODEFS] init\n");
}

//
//
//

void deinit( struct FHandler *s )
{
	DEBUG("[NODEFS] deinit\n");
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, User *usr, char **mountError )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	char *module = NULL;
	char *type = NULL;
	UserSession *us = NULL;
	
	SystemBase *sb = NULL;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("[fsysnode] Mounting NodeFS filesystem!\n");
	
	if( ( dev = FCalloc( 1, sizeof( File ) ) ) != NULL )
	{
		struct TagItem *lptr = ti;
		
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
//					id = (FULONG)lptr->ti_Data; //not used?
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
				case FSys_Mount_UserSession:
					us = (UserSession *)lptr->ti_Data;
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
			DEBUG("[fsysnode] nodefs path is ok '%s' (ignore this message, unimplemented!)\n", dev->f_Path );
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
			FileFillSessionID( dev, us );
			sd->type = StringDup( type );
			dev->f_SpecialData = sd;
			sd->sb = sb;
			
			// Calculate length of variables in string
			int cmdLength = strlen( "command=dosaction&action=mount&type=&devname=&path=&sessionid=" ) +
				( type ? strlen( type ) : 0 ) + 
				( name ? strlen( name ) : 0 ) + 
				( path ? strlen( path ) : 0 ) + 
				( module ? strlen( module ) : strlen( "files" ) ) + 
				( us ? strlen( us->us_SessionID ) : 0 ) + 1;
			
			
			// Whole command
			char *command = FCalloc(
				strlen( "node \"modules/node/module.js\" \"\";" ) +
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
						us->us_SessionID ? us->us_SessionID : ""  );
					sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
					FFree( commandCnt );
			
					// Execute!
					int answerLength = 0;
					ListString *result = NodeCall( command, &answerLength );
					FFree( command );
			
					if( result && result->ls_Size >= 0 )
					{

						DEBUG( "[fsysnode] Return was \"%s\"\n", result->ls_Data );
						if( strncmp( result->ls_Data, "ok", 2 ) != 0 )
						{
							DEBUG( "[fsysnode] Failed to mount device %s..\n", name );
							DEBUG( "[fsysnode] Output was: %s\n", result->ls_Data );
							if( sd->module ) FFree( sd->module );
							//if( dev->f_SessionID ) FFree( dev->f_SessionID );
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
						DEBUG( "[fsysnode] Error mounting device %s..\n", name );
						if( sd->module ) FFree( sd->module );
						//if( dev->f_SessionID ) FFree( dev->f_SessionID );
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
		DEBUG("[fsysnode] IS DIRECTORY data filled\n");
	}
	
	DEBUG("[fsysnode] mount ok\n");
	
	return dev;
}

//
// Only free device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[fsysnode] Release filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sd = (SpecialData *)lf->f_SpecialData;
		
			// Free up active device information
			if( sd->module ){ FFree( sd->module ); }
			if( sd->type ){ FFree( sd->type ); }
			FFree( lf->f_SpecialData );
		}
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
		DEBUG("[fsysnode] Unmount filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sd = (SpecialData *)lf->f_SpecialData;
		
			// Calculate length of variables in string
			int cmdLength = strlen( "command=dosaction&action=unmount&devname=&sessionid=" ) +
				( lf->f_Name ? strlen( lf->f_Name ) : 0 ) + 
				( sd->module ? strlen( sd->module ) : strlen( "files" ) ) + 
				( lf->f_SessionIDPTR ? strlen( lf->f_SessionIDPTR ) : 0 )
				+ 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "node \"modules/node/module.js\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "command=dosaction&action=unmount&devname=%s&module=%s&sessionid=%s",
						lf->f_Name ? lf->f_Name : "", sd->module ? sd->module : "files", lf->f_SessionIDPTR ? lf->f_SessionIDPTR : "" );
					sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
					FFree( commandCnt );
			
					int answerLength = 0;
					ListString *result = NodeCall( command, &answerLength );
					
					FFree( command );
					
					if( result && result->ls_Size >= 0 )
					{
						if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
						{
							DEBUG( "[fsysnode] Failed to unmount device %s..\n", lf->f_Name );
						}
					}
					else
					{
						DEBUG( "[fsysnode] Unknown error unmounting device %s..\n", lf->f_Name );
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
	if( comm == NULL )
	{
		return NULL;
	}
	sprintf( comm, "%s:%s", s->f_Name, path );
	char *encodedcomm = MarkAndBase64EncodeString( comm );
	FFree( comm );
	
	// Calculate length of variables in string
	int cmdLength = strlen( "type=&args=false&command=read&authkey=false&sessionid=&path=&mode=" ) +
		( sd->type ? strlen( sd->type ) : 0 ) + 
		( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
		( encodedcomm ? strlen( encodedcomm ) : 0 ) +
		( mode ? strlen( mode ) : 0 ) + 1;
	
	// Whole command
	char *command = FCalloc(
		strlen( "node \"modules/node/module.js\" \"\";" ) +
		cmdLength + 1, sizeof( char ) );
	
	if( command != NULL )
	{
		// Just get vars
		char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
	
		// Generate command string
		if( commandCnt != NULL )
		{
			snprintf( commandCnt, cmdLength, "type=%s&args=false&command=read&authkey=false&sessionid=%s&path=%s&mode=%s",
				sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encodedcomm ? encodedcomm : "", mode ? mode : "" );
			sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
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
			FERROR("[NODEFsys] cannot open pipe\n");
			return NULL;
		}
	
		File *locfil = NULL;
		if( ( locfil = FCalloc( 1, sizeof( File ) ) ) != NULL )
		{
			locfil->f_Path = StringDup( path );
	
			if( ( locfil->f_SpecialData = FCalloc( 1, sizeof( SpecialData ) ) ) != NULL )
			{
				sd->fp = pipe; 

				if( locfil->f_SpecialData != NULL )
				{
					((SpecialData *)locfil->f_SpecialData)->sb = sd->sb;
					((SpecialData *)locfil->f_SpecialData)->fp = pipe;
					((SpecialData *)locfil->f_SpecialData)->mode = MODE_READ;
					//locsd->fname = StringDup( tmpfilename );
					((SpecialData *)locfil->f_SpecialData)->path = StringDup( path );
					//locfil->f_SessionID = StringDup( s->f_SessionID );
				}
				locfil->f_SessionIDPTR = s->f_SessionIDPTR;
		
				DEBUG("[fsysnode] FileOpened, memory allocated for reading.\n" );
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
			FERROR("[NODEFsys] cannot alloc memory\n");
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
			snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/%s_read_%d%d%d%d", s->f_SessionIDPTR, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
			//DEBUG( "[fsysnode] Trying to lock %s\n", tmpfilename );
			if( ( lockf = open( tmpfilename, O_CREAT|O_EXCL|O_RDWR ) ) >= 0 )
			{
				break;
			}
			unlink( tmpfilename );
			// Failed.. bailing
			if( retries-- <= 0 )
			{
				FERROR( "[fsysnode] [FileOpen] Failed to get exclusive lock on lockfile: %s.\n", tmpfilename );
				FFree( command );
				FFree( encodedcomm );
				return NULL;
			}
		}
		while( TRUE );

		DEBUG( "[fsysnode] Success in locking %s\n", tmpfilename );

		// Open the tmp file and get a file lock!

		// Get the data
		//char command[ 1024 ];	// maybe we should count that...

		DEBUG( "[fsysnode] Getting data for tempfile, seen below as command:\n" );
		DEBUG( "[fsysnode] %s\n", command );

		int answerLength = 0;			
		ListString *result = NodeCall( command, &answerLength );

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
				//fcntl( lockf, F_SETLKW, F_UNLCK );
				//fchmod( lockf, 0755 );
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
							//locfil->f_SessionID = StringDup( s->f_SessionID );
							locfil->f_SessionIDPTR = s->f_SessionIDPTR;
		
							DEBUG("[fsysnode] FileOpened, memory allocated for reading.\n" );
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
					FERROR("[fsysnode] Cannot open temporary file %s\n", tmpfilename );
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
			FERROR("[fsysnode] Cannot create temporary file %s\n", tmpfilename );
		}
		// Close lock
		if( lockf >= 0 ) 
		{
			DEBUG( "[fsysnode] Closing lock..\n" );
			close( lockf );
		}
	}
	else if( mode[0] == 'w' )
	{
		char tmpfilename[ 712 ];

		// Make sure we can make the tmp file unique
		//do
		//{
		snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/%s_write_%d%d%d%d", s->f_SessionIDPTR, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
		//}
		//while( access( tmpfilename, F_OK ) != -1 );

		DEBUG("[fsysnode] WRITE FILE %s\n", tmpfilename );

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
					//locfil->f_SessionID = StringDup( s->f_SessionID );
					locfil->f_SessionIDPTR = s->f_SessionIDPTR;

					DEBUG("[fsysnode] FileOpened, memory allocated.. store to file %s fid %p\n", locsd->fname, locfp );
	
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
			
			DEBUG("[fsysnode] CLOSE, file path %s\n", sd->fname );
			
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
				int cmdLength = strlen( "command=write&sessionid=&path=&tmpfile=" ) +
					( lfp->f_SessionIDPTR ? strlen( lfp->f_SessionIDPTR ) : 0 ) +
					( encPath ? strlen( encPath ) : 0 ) + 
					( sd->fname ? strlen( sd->fname ) : 0 ) + 1;
				
				// Whole command
				char *command = FCalloc(
					strlen( "node \"modules/node/module.js\" \"\";" ) +
					cmdLength + 1, sizeof( char ) );
	
				if( command != NULL )
				{
					// Just get vars
					char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
	
					// Generate command string
					if( commandCnt != NULL )
					{
						snprintf( commandCnt, cmdLength, "command=write&sessionid=%s&path=%s&tmpfile=%s",
							lfp->f_SessionIDPTR ? lfp->f_SessionIDPTR : "", encPath ? encPath : "", sd->fname ? sd->fname : "" );
						sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
						FFree( commandCnt );
				
						//INFO("Call write command %s\n", command );
						//INFO("\nSDPATH %s\nlf main name %s\n\n", sd->path, s->f_Name ); 
	
						int answerLength = 0;
		
						ListString *result = NodeCall( command, &answerLength );
						if( result != NULL )
						{
							DEBUG( "[fsysnode] Closed file using node call.\n" );
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
		//if( lfp->f_SessionID != NULL ) FFree( lfp->f_SessionID );
		if( lfp->f_Buffer != NULL )    FFree( lfp->f_Buffer );
		
		// And the structure
		FFree( lfp );
		
		DEBUG( "[fsysnode] FileClose: Closing file pointer done.\n" );
		
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
	//DEBUG( "[fsysnode] Trying to do some reading( %d )!\n", rsize );
	if( sd != NULL )
	{
		if( f->f_Stream == TRUE )
		{
			SpecialData *sd = (SpecialData *)f->f_SpecialData;
			
			if( feof( sd->fp ) )
			{
				DEBUG("[fsysnode] EOF\n");
				return -1;
			}

			// Make a new buffer and read
			result = fread( buffer, 1, rsize, sd->fp  );
			//DEBUG( "[NODEFsys] Adding %ul of data\n", result );
			
			if( f->f_Socket )
			{
				char *ptr = strstr( buffer, "---http-headers-end---\n" );

				if( ptr != NULL && result > 23 )
				{
					f->f_Socket->s_Interface->SocketWrite( f->f_Socket, (ptr+23), (FLONG)(result-23) );
				}
				else
				{
					f->f_Socket->s_Interface->SocketWrite( f->f_Socket, buffer, (FLONG)result );
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
				DEBUG("[fsysnode] EOF\n");
				return -1;
			}
		
			//DEBUG( "[fsysnode] Ok, lets read %d bytes.\n", rsize );
			result = fread( buffer, 1, rsize, sd->fp );
			//DEBUG( "[fsysnode] Read %d bytes\n", result );
		}
	}
	printf("NODERead %d\n", result );
	
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
		
	DEBUG("[fsysnode] Get information\n");
	
	File *lf = ( File *)f;
	if( lf->f_SpecialData )
	{
		SpecialData *sd = (SpecialData *)lf->f_SpecialData;
	
		char *urlPath = MarkAndBase64EncodeString( path );
		char *urlKey = MarkAndBase64EncodeString( key );
		
		// Calculate length of variables in string
		int cmdLength = strlen( "command=infoget&path=&sessionid=&key=" ) +
			( urlPath ? strlen( urlPath ) : 0 ) +  
			( lf->f_SessionIDPTR ? strlen( lf->f_SessionIDPTR ) : 0 ) +
			( urlKey == NULL ? 1 : strlen( urlKey ) ) + 1;
		
		// Whole command
		char *command = FCalloc(
			strlen( "node \"modules/node/module.js\" \"\";" ) +
			cmdLength + 1, sizeof( char ) );
		
		if( command != NULL )
		{	
			// Just get vars
			char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
		
			// Generate command string
			if( commandCnt != NULL )
			{
				snprintf( commandCnt, cmdLength, "command=infoget&path=%s&sessionid=%s&key=%s",
					urlPath ? urlPath : "", lf->f_SessionIDPTR ? lf->f_SessionIDPTR : "", urlKey == NULL ? "*" : urlKey );
				sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
				FFree( commandCnt );
	
				int answerLength = 0;
				ListString *result = NodeCall( command, &answerLength );
				
				FFree( command );
				
				if( result && result->ls_Size >= 0 )
				{
					if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
					{
						DEBUG( "[fsysnode] Failed to get information..\n" );
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
					DEBUG( "[fsysnode] Unknown error getting information\n" );
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
// GetDiskInfo
//

int GetDiskInfo( struct File *s, int64_t *used, int64_t *size )
{
	*used = 0;
	*size = 0;
	return 0;
}
//
// make directory in node file system
//

int MakeDir( struct File *f, const char *path )
{
	int error = 0;
	DEBUG("[fsysnode] makedir filesystem\n");
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
		int cmdLength = strlen( "command=dosaction&action=makedir&sessionid=&path=" ) +
			( f->f_SessionIDPTR ? strlen( f->f_SessionIDPTR ) : 0 ) +
			( comm ? strlen( comm ) : 0 ) + 1;
		
		// Whole command
		char *command = FCalloc(
			strlen( "node \"modules/node/module.js\" \"\";" ) +
			cmdLength + 1, sizeof( char ) );
		
		if( command != NULL )
		{	
			// Just get vars
			char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
		
			// Generate command string
			if( commandCnt != NULL )
			{
				snprintf( commandCnt, cmdLength, "command=dosaction&action=makedir&sessionid=%s&path=%s",
					f->f_SessionIDPTR ? f->f_SessionIDPTR : "", comm ? comm : "" );
				sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
				FFree( commandCnt );
			
				DEBUG("[fsysnode] MAKEDIR %s\n", command );
	
				int answerLength = 0;
		
				ListString *result = NodeCall( command, &answerLength );
		
				if( result && result->ls_Size >= 0 )
				{
					// TODO: Handle, especially "already exists" reasoning
					if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
					{
						FERROR( "[fsysnode] nodefs: Failed to execute makedir '%s' on device '%s'\n", comm, f->f_Name );
						//FERROR( "[fsysnode] nodefs said: %s\n", result->ls_Data );
					
						// TODO: Also return FERROR! :)
						ListStringDelete( result );
						FFree( command );
						FFree( comm );
						return -1;
					}
				}
				else
				{
					error = -2;
					FERROR( "[fsysnode] Unknown error unmounting device %s..\n", f->f_Name );
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
		error = -1;
	}
	return error;
}

//
// Delete
//

FLONG Delete( struct File *s, const char *path )
{
	DEBUG("[fsysnode] Delete %s\n", path);
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
		int cmdLength = strlen( "command=dosaction&action=delete&sessionid=&path=" ) +
			( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
			( comm ? strlen( comm ) : 0 ) + 1;
	
		// Whole command
		char *command = FCalloc(
			strlen( "node \"modules/node/module.js\" \"\";" ) +
			cmdLength + 1, sizeof( char ) );

		if( command != NULL )
		{
			// Just get vars
			char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );

			// Generate command string
			if( commandCnt != NULL )
			{					
				snprintf( commandCnt, cmdLength, "command=dosaction&action=delete&sessionid=%s&path=%s",
					s->f_SessionIDPTR ? s->f_SessionIDPTR : "", comm ? comm : "" );
				sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
				FFree( commandCnt );
		
				SpecialData *sd = (SpecialData *)s->f_SpecialData;
		
				int answerLength = 0;
				ListString *result = NodeCall( command, &answerLength );
		
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
	DEBUG("[fsysnode] Rename %s to %s\n", path, nname );
	
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
			int cmdLength = strlen( "command=dosaction&action=rename&sessionid=&path=&newname=" ) +
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
				( encPath ? strlen( encPath ) : 0 ) + 
				( newName ? strlen( newName ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "node \"modules/node/module.js\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );

			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );

				// Generate command string
				if( commandCnt != NULL )
				{
					//DEBUG( "Renaming from %s to %s...\n", encPath, newName );
					
					snprintf( commandCnt, cmdLength, "command=dosaction&action=rename&sessionid=%s&path=%s&newname=%s",
						s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPath ? encPath : "", newName ? newName : "" );
					sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
					FFree( commandCnt );
					
					int answerLength = 0;
					ListString *result = NodeCall( command, &answerLength );
		
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
	DEBUG("[fsysnode] Copy!\n");
	
	
	DEBUG("[fsysnode] Copy END\n");
	
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
// Get information about last file changes (seconds from 1970)
//

FLONG GetChangeTimestamp( struct File *s, const char *path )
{
	return (FLONG)0;
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
			int cmdLength = strlen( "args=false&command=info&authkey=false&sessionid=&path=&subPath=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) + 
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) + 
				( encPath ? strlen( encPath ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "node \"modules/node/module.js\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
				
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&args=false&command=info&authkey=false&sessionid=%s&path=%s&subPath=",
						sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPath ? encPath : "" );
					sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
					FFree( commandCnt );
			
					// Execute!
					int answerLength = 0;
					BufString *bs = NULL;
					ListString *result = NodeCall( command, &answerLength );
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
			int cmdLength = strlen( "command=call&authkey=false&sessionid=&path=&args=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) + 
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) + 
				( encComm ? strlen( encComm ) : 0 ) +
				( args ? strlen( args ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "node \"modules/node/module.js\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&command=call&authkey=false&sessionid=%s&path=%s&args=%s",
						sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encComm ? encComm : "", args ? args : "" );
					sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
					FFree( commandCnt );
			
					int answerLength = 0;
					BufString *bs = NULL;
					ListString *result = NodeCall( command, &answerLength );
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
			int cmdLength = strlen( "type=&args=false&command=directory&authkey=false&sessionid=&path=&subPath=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) +
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
				( encComm ? strlen( encComm ) : 0 ) + 1;
			
			// Whole command
			char *command = FCalloc(
				strlen( "node \"modules/node/module.js\" \"\";" ) +
				cmdLength + 1, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&args=false&command=directory&authkey=false&sessionid=%s&path=%s&subPath=",
						sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encComm ? encComm : "" );
					sprintf( command, "node \"modules/node/module.js\" \"%s\";", FilterNodeVar( commandCnt ) );
					FFree( commandCnt );
		
					int answerLength;
					BufString *bs  = NULL;
					ListString *result = NodeCall( command, &answerLength );
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

