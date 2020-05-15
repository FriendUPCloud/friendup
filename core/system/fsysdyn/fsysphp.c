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
#include <util/newpopen.h>

#define SUFFIX "fsys"
#define PREFIX "php"

//
// special structure
//

#define MODE_READ 1
#define MODE_WRITE 2

typedef struct SpecialData
{
	FILE				*fp;
	char				*type;
	char				*module;
	char				*fname;
	char				*path;
	int					mode;
	SystemBase			*sb;
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
	char *dec = UrlDecodeToMem( string );
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

char *FilterPHPVarLen( char *line, int len )
{
	if( line == NULL )
	{
		return NULL;
	}
	
	int pos = 0;
	char *ptr = line;
	while( *ptr != 0 )
	{
		if( *ptr == '\\' )
		{
			ptr++;
		}
		else
		{
			if( *ptr == '`' )
			{
				*ptr = ' ';
			}
			else if( *ptr == '"' || *ptr == '\n' || *ptr == '\r' )
			{
				*ptr = ' '; // Eradicate!
			}
		}
		ptr++;
		if( (++pos) > len )
		{
			break;
		}
	}
	return line;
}

char *FilterPHPVar( char *line )
{
	if( line == NULL )
	{
		return NULL;
	}
	
	char *ptr = line;
	while( *ptr != 0 )
	{
		if( *ptr == '\\' )
		{
			ptr++;
		}
		else
		{
			if( *ptr == '`' )
			{
				*ptr = ' ';
			}
			else if( *ptr == '"' || *ptr == '\n' || *ptr == '\r' )
			{
				*ptr = ' '; // Eradicate!
			}
		}
		ptr++;
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

//#define PHP_READ_SIZE 262144
//#define PHP_READ_SIZE 2048
#define PHP_READ_SIZE 132144
#define USE_NPOPEN_POLL

//
// php call, send request, read answer
//

ListString *PHPCall( const char *command )
{
	DEBUG("[PHPFsys] run app: '%s'\n", command );
    
	NPOpenFD pofd;
	int err = newpopen( command, &pofd );
	if( err != 0 )
	{
		FERROR("[PHPFsys] cannot open pipe: %s\n", strerror( errno ) );
		return NULL;
	}
	
	char *buf = FMalloc( PHP_READ_SIZE+16 );
	ListString *ls = ListStringNew();
	int errCounter = 0;
	int size = 0;

#ifdef USE_NPOPEN_POLL
	struct pollfd fds[2];

	// watch stdin for input 
	fds[0].fd = pofd.np_FD[ NPOPEN_CONSOLE ];// STDIN_FILENO;
	fds[0].events = POLLIN;

	// watch stdout for ability to write
	fds[1].fd = STDOUT_FILENO;
	fds[1].events = POLLOUT;

	while( TRUE )
	{
		DEBUG("[PHPFsys] in loop\n");
		
		int ret = poll( fds, 2, FILESYSTEM_MOD_TIMEOUT * 1000);

		if( ret == 0 )
		{
			DEBUG("Timeout!\n");
			break;
		}
		else if(  ret < 0 )
		{
			DEBUG("Error\n");
			break;
		}
		size = read( pofd.np_FD[ NPOPEN_CONSOLE ], buf, PHP_READ_SIZE);

		DEBUG( "[PHPFsys] Adding %d of data\n", size );
		if( size > 0 )
		{
			DEBUG( "[PHPFsys] before adding to list\n");
			ListStringAdd( ls, buf, size );
			DEBUG( "[PHPFsys] after adding to list\n");
			//res += size;
		}
		else
		{
			errCounter++;
			DEBUG("ErrCounter: %d\n", errCounter );

			break;
		}
	}
#else
	fd_set set;
	struct timeval timeout;

	// Initialize the timeout data structure. 
	timeout.tv_sec = FILESYSTEM_MOD_TIMEOUT;
	timeout.tv_usec = 0;

	while( TRUE )
	{
		/* Initialize the file descriptor set. */
		FD_ZERO( &set );
		FD_SET( pofd.np_FD[ NPOPEN_CONSOLE ], &set);
		DEBUG("[PHPFsys] in loop\n");
		
		int ret = select( pofd.np_FD[ NPOPEN_CONSOLE ]+1, &set, NULL, NULL, &timeout );
		// Make a new buffer and read
		if( ret == 0 )
		{
			DEBUG("Timeout!\n");
			break;
		}
		else if(  ret < 0 )
		{
			DEBUG("FSYSPHP: SELECT Error\n");
			break;
		}
		size = read( pofd.np_FD[ NPOPEN_CONSOLE ], buf, PHP_READ_SIZE);

		if( size > 0 )
		{
			ListStringAdd( ls, buf, size );
		}
		else
		{
			errCounter++;
			if( errCounter > MOD_NUMBER_TRIES )
			{
				//FERROR("Error in popen, Quit! Command: %s\n", command );
				break;
			}
		}
	}
#endif
	
	FFree( buf );

	// Free pipe if it's there
	newpclose( &pofd );
	
	ListStringJoin( ls );		//we join all string into one buffer

	DEBUG( "[fsysphp] Finished PHP call...(%lu length)-\n", ls->ls_Size );
	return ls;
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

void *Mount( struct FHandler *s, struct TagItem *ti, User *usr, char **mountError )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	char *module = NULL;
	char *type = NULL;
	char *authid = NULL;
	char *userSession = NULL;
	char *empty = "";
//	FULONG id = 0; //not used
	
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
//					id = (FULONG)lptr->ti_Data; //not needed?
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
				case FSys_Mount_User_SessionID:
					userSession = (char *)lptr->ti_Data;
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
			if( usr != NULL && usr->u_MainSessionID != NULL )
			{
				userSession = usr->u_MainSessionID;
			}
			else
			{
				if( userSession == NULL )
				{
					userSession = empty;
				}
			}
			DEBUG( "[fsysphp] Copying session: %s\n", userSession );
			//dev->f_SessionID = StringDup( usr->u_MainSessionID );
			dev->f_SessionIDPTR = userSession;
			sd->type = StringDup( type );
			dev->f_SpecialData = sd;
			sd->sb = sb;
			
			// Calculate length of variables in string
			int cmdLength = strlen( "command=dosaction&action=mount&type=&devname=&path=&module=&sessionid=" ) +
				( type ? strlen( type ) : 0 ) + 
				( name ? strlen( name ) : 0 ) + 
				( path ? strlen( path ) : 0 ) + 
				( module ? strlen( module ) : strlen( "files" ) ) + 
				( strlen( userSession ) ) + 1;
			
			
			// Whole command
			char *command = FCalloc( strlen( "php \"modules/system/module.php\" \"\";" ) + cmdLength + 1, sizeof( char ) );
			
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
						userSession  );
					sprintf( command, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
			
					// Execute!
					//int answerLength = 0;
					ListString *result = PHPCall( command );
					FFree( command );
			
					if( result && result->ls_Size >= 0 )
					{

						DEBUG( "[fsysphp] Return was '%s'\n", result->ls_Data );
						if( strncmp( result->ls_Data, "ok", 2 ) != 0 )
						{
							DEBUG( "[fsysphp] Failed to mount device %s..\n", name );
							//DEBUG( "[fsysphp] Output was: %s\n", result->ls_Data );
							if( sd->module ) FFree( sd->module );
							//if( dev->f_SessionID ) FFree( dev->f_SessionID );
							if( sd->type ) FFree( sd->type );
							if( dev->f_Name ) FFree( dev->f_Name );
							if( dev->f_Path ) FFree( dev->f_Path );
							if( dev->f_DevServer ) FFree( dev->f_DevServer );
							FFree( sd );
							FFree( dev );
							
							if( *mountError == NULL )
							{
								*mountError = StringDup( result->ls_Data );
							}
					
							// Free up buffer
							ListStringDelete( result );
							
							return NULL;
						}
					}
					else
					{
						DEBUG( "[fsysphp] Error mounting device %s..\n", name );
						if( sd->module ) FFree( sd->module );
						//if( dev->f_SessionID ) FFree( dev->f_SessionID );
						if( sd->type ) FFree( sd->type );
						if( dev->f_Name ) FFree( dev->f_Name );
						if( dev->f_Path ) FFree( dev->f_Path );
						if( dev->f_DevServer ) FFree( dev->f_DevServer );
						FFree( sd );
						FFree( dev );
						
						if( *mountError == NULL )
						{
							*mountError = StringDup( "PHP returned empty string" );
						}
				
						// Free up buffer
						if( result )
						{
							ListStringDelete( result );
						}
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
			lf->f_SpecialData = NULL;
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
		DEBUG("[fsysphp] Unmount filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sd = (SpecialData *)lf->f_SpecialData;
		
			// Calculate length of variables in string
			int cmdLength = strlen( "command=dosaction&action=unmount&devname=&module=&sessionid=" ) +
				( lf->f_Name ? strlen( lf->f_Name ) : 0 ) + 
				( sd->module ? strlen( sd->module ) : strlen( "files" ) ) + 
				( lf->f_SessionIDPTR ? strlen( lf->f_SessionIDPTR ) : 0 )
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
						lf->f_Name ? lf->f_Name : "", sd->module ? sd->module : "files", lf->f_SessionIDPTR ? lf->f_SessionIDPTR : "" );
					sprintf( command, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
					FFree( commandCnt );
			
					ListString *result = PHPCall( command );
					
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
	
	char *comm = NULL;
	
	if( strchr( path, ':' ) != NULL )
	{
		int l = strlen( path );
		if( (comm = FCalloc( l + 2, sizeof( char ) )) != NULL )
		{
			memcpy( comm, path, l );
		}
		else return NULL;
		
	}
	else
	{
		if( (comm = FCalloc( strlen( s->f_Name ) + strlen( path ) + 2, sizeof( char ) )) != NULL )
		{
			sprintf( comm, "%s:%s", s->f_Name, path );
		}
		else return NULL;
	}
	
	char *encodedcomm = MarkAndBase64EncodeString( comm );
	FFree( comm );
	
	// Calculate length of variables in string
	int cmdLength = strlen( "type=&module=files&args=false&command=read&authkey=false&sessionid=&path=&mode=" ) +
		( sd->type ? strlen( sd->type ) : 0 ) + 
		( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
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
				sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encodedcomm ? encodedcomm : "", mode ? mode : "" );
			sprintf( command, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
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
				//locfil->f_SessionID = StringDup( s->f_SessionID );
				locfil->f_SessionIDPTR = s->f_SessionIDPTR;
		
				DEBUG("[fsysphp] FileOpened, memory allocated for reading.\n" );
				FFree( command );
				FFree( encodedcomm );
				return locfil;
			}
	
			// Free this one
			FFree( locfil->f_Path );
			locfil->f_Path = NULL;
			FFree( locfil );
			pclose( pipe );
		}
		else
		{
			pclose( pipe );
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
		int lockf = -1;
		struct timeval  tv;
		gettimeofday(&tv, NULL);

		double timeInMill = 
         (tv.tv_sec) * 1000 + (tv.tv_usec) / 1000 ; // convert tv_sec & tv_usec to millisecond

		// Make sure we can make the tmp file unique with lock!
		int retries = 100;
		do
		{
			//snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/%s_read_%d%d%d%d", s->f_SessionIDPTR, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
			snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/Friendup/%s_read_%f%d%d", s->f_SessionIDPTR, timeInMill, rand()%9999, rand()%9999 );
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
				close( lockf );
				return NULL;
			}
		}
		while( TRUE );

		if( lockf == -1 )
		{
			FERROR( "[fsysphp] [FileOpen] Failed to get exclusive lock on lockfile (2).\n" );
			FFree( command );
			FFree( encodedcomm );
			return NULL;
		}
		
		
		DEBUG( "[fsysphp] Success in locking %s\n", tmpfilename );

		// Open the tmp file and get a file lock!

		// Get the data
		//char command[ 1024 ];	// maybe we should count that...

		DEBUG( "[fsysphp] Getting data for tempfile, seen below as command:\n" );
		DEBUG( "[fsysphp] %s\n", command );
		
		ListString *result = PHPCall( command );

		// Open a file pointer
		if( result )
		{
			if( result->ls_Data )
			{
				if( strncmp( result->ls_Data, "fail", 4 ) == 0 )
				{
					FERROR( "[fsysphp] [FileOpen] Failed to get exclusive lock on lockfile. Fail returned.\n" );
					FFree( command );
					FFree( encodedcomm );
					ListStringDelete( result );
					close( lockf );
					unlink( tmpfilename );
					return NULL;
				}
				
				// Write the buffer to the file
				int written = write( lockf, ( void *)result->ls_Data, result->ls_Size );
	
				// Clean out result
				ListStringDelete( result ); result = NULL;

				// Remove lock!
				//fcntl( lockf, F_SETLKW ); // TODO: Why the hell was this here? :-D
				fcntl( lockf, F_UNLCK );
				fchmod( lockf, 0755 );
				close( lockf );
				lockf = -1;
				
				FILE *locfp = NULL;
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
		if( lockf != -1 )
		{
			DEBUG( "[fsysphp] Closing lock..\n" );
			close( lockf );
		}
		unlink( tmpfilename );
	}
	else if( mode[0] == 'w' )
	{
		char tmpfilename[ 712 ];

		// Make sure we can make the tmp file unique
		//do
		//{
		snprintf( tmpfilename, sizeof(tmpfilename), "/tmp/Friendup/%s_write_%d%d%d%d", s->f_SessionIDPTR, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
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
					//locfil->f_SessionID = StringDup( s->f_SessionID );
					locfil->f_SessionIDPTR = s->f_SessionIDPTR;

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
			unlink( tmpfilename );
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
					DEBUG("[fsysphp] Managed to do a pclose.\n" );
				}
				else
				{
					closeerr = fclose( ( FILE *)sd->fp );
					DEBUG("[fsysphp] Managed to do a fclose, file path %s\n", sd->fname );
				}
				sd->fp = NULL;
			}
			
			DEBUG("[fsysphp] CLOSE, file path %s\n", sd->fname );
			
			if( sd->mode == MODE_READ )
			{
				if( lfp->f_Stream == FALSE )
				{
					if( sd->fname != NULL )
					{
						remove( sd->fname );
					}
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
					( lfp->f_SessionIDPTR ? strlen( lfp->f_SessionIDPTR ) : 0 ) +
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
							lfp->f_SessionIDPTR ? lfp->f_SessionIDPTR : "", encPath ? encPath : "", sd->fname ? sd->fname : "" );
						sprintf( command, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
						FFree( commandCnt );
				
						ListString *result = PHPCall( command );
						if( result != NULL )
						{
							if( result->ls_Data[0] == 'f' && result->ls_Data[1] == 'a' && result->ls_Data[2] == 'i' && result->ls_Data[3] == 'l' )
							{
								closeerr = 2;
							}
							
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
		//if( lfp->f_SessionID != NULL ) FFree( lfp->f_SessionID );
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
					sb->sl_SocketInterface.SocketWrite( f->f_Socket, (ptr+23), (FLONG)(result-23) );
				}
				else
				{
					sb->sl_SocketInterface.SocketWrite( f->f_Socket, buffer, (FLONG)result );
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
			( lf->f_SessionIDPTR ? strlen( lf->f_SessionIDPTR ) : 0 ) +
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
					urlPath ? urlPath : "", lf->f_SessionIDPTR ? lf->f_SessionIDPTR : "", urlKey == NULL ? "*" : urlKey );
				sprintf( command, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
				FFree( commandCnt );
	
				ListString *result = PHPCall( command );
				
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
// GetDiskInfo
//

int GetDiskInfo( struct File *s, int64_t *used, int64_t *size )
{
	*used = 0;
	*size = 0;
	return 0;
}
//
// make directory in php file system
//

int MakeDir( struct File *f, const char *path )
{
	int error = 0;
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
			( f->f_SessionIDPTR ? strlen( f->f_SessionIDPTR ) : 0 ) +
			( comm ? strlen( comm ) : 0 ) + 128 + strlen( "php \"modules/system/module.php\" \"\";" );
		
		// Whole command
		char *command = FMalloc( cmdLength );
		
		if( command != NULL )
		{	
			// Just get vars
			char *commandCnt = FMalloc( cmdLength + 1 );
		
			// Generate command string
			if( commandCnt != NULL )
			{
				snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=makedir&sessionid=%s&path=%s",
					f->f_SessionIDPTR ? f->f_SessionIDPTR : "", comm ? comm : "" );
				snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
				FFree( commandCnt );
			
				DEBUG("[fsysphp] MAKEDIR %s\n", command );
	
				ListString *result = PHPCall( command );
		
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
					error = -2;
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
		error = -1;
	}
	return error;
}

//
// Delete
//

FLONG Delete( struct File *s, const char *path )
{
	DEBUG("[fsysphp] Delete %s\n", path);
	if( s != NULL )
	{
		// Fix path
		char *comm = NULL;
		char *commSlash = NULL;
		if( !PathHasColon( (char *)path ) )
		{
			int len = strlen( path ) + strlen( s->f_Name ) + 10;
			char *tmp = FCalloc( len, sizeof( char ) );
			snprintf( tmp, len, "%s:%s", s->f_Name, path );
			comm = MarkAndBase64EncodeString( tmp );
			
			strcat( tmp,  "/" );
			commSlash = MarkAndBase64EncodeString( tmp );
			DEBUG("SLASH DElete %s\n", tmp );
			FFree( tmp );
		}
		else
		{
			int len = strlen( path ) + 10;
			char *tmp = FCalloc( len, sizeof( char ) );
			snprintf( tmp, len, "%s/", path );
			comm = MarkAndBase64EncodeString( path );
			DEBUG("SLASH DElete1 %s\n", tmp );
			commSlash = MarkAndBase64EncodeString( tmp );
			FFree( tmp );
		}
		
		DEBUG("COMM '%s' / '%s'\n", comm, commSlash );
	
		// Calculate length of variables in string
		int cmdLength = strlen( "module=files&command=dosaction&action=delete&sessionid=&path=" ) +
			( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
			( comm ? strlen( comm ) : 0 ) + 128;
	
		// Whole command
		char *command = FMalloc( cmdLength );
		if( command != NULL )
		{
			// Just get vars
			char *commandCnt = FMalloc( cmdLength + 1 );

			// Generate command string
			if( commandCnt != NULL )
			{					
				snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=delete&sessionid=%s&path=%s",
					s->f_SessionIDPTR ? s->f_SessionIDPTR : "", comm ? comm : "" );
				DEBUG("PATH %s\n", commandCnt );
				snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
		
				ListString *result = PHPCall( command );
		
				// TODO: we should parse result to get information about success
				if( result != NULL )
				{
					DEBUG("Delete res: %s\n", result->ls_Data );
					if( result->ls_Data != NULL && strncmp( "fail", result->ls_Data, 4 ) == 0 )
					{
						snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=delete&sessionid=%s&path=%s",
							s->f_SessionIDPTR ? s->f_SessionIDPTR : "", commSlash ? commSlash : "" );
						DEBUG("PATH1 %s\n", commandCnt );
						snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
		
						if( result != NULL )
						{
							ListStringDelete( result );
							result = NULL;
						}
						result = PHPCall( command );
						if( result != NULL )
						{
							DEBUG("Delete res 1: %s\n", result->ls_Data );
						}
						else
						{
							DEBUG("Delete res 1: 0 \n");
						}
					}

					ListStringDelete( result );
				}
				
				FFree( commandCnt );
			}
			
			FFree( command );
			// Success
		}
		FFree( comm );
		FFree( commSlash );
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
	DEBUG("[fsysphp] Rename '%s' to '%s'\n", path, nname );
	
	if( s != NULL )
	{
		char *comm = NULL;
	
		if( ( comm = FMalloc( strlen( path ) + strlen( s->f_Name ) + 16 ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL )
			{
				strcat( comm, path ); 
			}

			char *encPath = MarkAndBase64EncodeString( comm );
			
			strcat( comm, "/" );
			char *encPathSlash = MarkAndBase64EncodeString( comm );
			
			char *newName = MarkAndBase64EncodeString( nname );
			
			// Calculate length of variables in string
			int cmdLength = strlen( "module=files&command=dosaction&action=rename&sessionid=&path=&newname=" ) +
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
				( encPath ? strlen( encPath ) : 0 ) + 
				( newName ? strlen( newName ) : 0 ) + 128 + strlen( "php \"modules/system/module.php\" \"\";" );
			
			// Whole command
			char *command = FMalloc( cmdLength );
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 10, sizeof( char ) );

				// Generate command string
				if( commandCnt != NULL )
				{
					//DEBUG( "Renaming from %s to %s...\n", encPath, newName );
					
					snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=rename&sessionid=%s&path=%s&newname=%s",
						s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPath ? encPath : "", newName ? newName : "" );
					snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );

					ListString *result = PHPCall( command );
		
					if( result != NULL )
					{
						if( result->ls_Data != NULL && strncmp( "fail<!--separate-->", result->ls_Data, 19 ) == 0 )
						{
							snprintf( commandCnt, cmdLength, "module=files&command=dosaction&action=rename&sessionid=%s&path=%s&newname=%s",
								s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPathSlash ? encPathSlash : "", newName ? newName : "" );
							snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
		
							if( result != NULL )
							{
								ListStringDelete( result );
								result = NULL;
							}
							result = PHPCall( command );
						}
						// TODO: we should parse result to get information about success
						if( result != NULL )
						{
							ListStringDelete( result );
						}
					}
				}
				FFree( commandCnt );
				FFree( command );
			}
			
			if( encPath ) FFree( encPath );
			if( encPathSlash ) FFree( encPathSlash );
			if( newName ) FFree( newName );
			
			FFree( comm );
		}
	}
	else
	{
		return -1;
	}
	return 0;
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
	DEBUG("[PHPFS] Info\n");
	
	if( s != NULL )
	{
		char *comm = NULL;
		int len = 64;
		if( path != NULL )
		{
			len += strlen( path );
		}
		
		if( s != NULL && s->f_Name != NULL )
		{
			len += strlen( s->f_Name );
		}
	
		if( ( comm = FMalloc( len ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL )
			{
				strcat( comm, path );
			}
		
			SpecialData *sd = (SpecialData *)s->f_SpecialData;
			
			DEBUG("[PHPFS] info path : %s\n", comm );
	
			char *encPath = MarkAndBase64EncodeString( comm );
			strcat( comm, "/" );
			char *encPathSlash = MarkAndBase64EncodeString( comm );
			FFree( comm );
		
			// Calculate length of variables in string
			int cmdLength = strlen( "type=&module=files&args=false&command=info&authkey=false&sessionid=&path=&subPath=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) + 
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) + 
				( encPath ? strlen( encPath ) : 0 ) + 128 + strlen( "php \"modules/system/module.php\" \"\";" );
			
			// Whole command
			char *command = FMalloc( cmdLength );
				
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FMalloc( cmdLength );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=info&authkey=false&sessionid=%s&path=%s&subPath=",
						sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPath ? encPath : "" );
					
					FilterPHPVar( commandCnt );
					
					snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", commandCnt );
			
					// Execute!
					BufString *bs = NULL;
					ListString *result = PHPCall( command );
					if( result != NULL )
					{
						if( result->ls_Data != NULL && strncmp( "fail<!--separate-->", result->ls_Data, 19 ) == 0 )
						{
							ListStringDelete( result );
							
							snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=info&authkey=false&sessionid=%s&path=%s&subPath=",
								sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPathSlash ? encPathSlash : "" );
							
							FilterPHPVar( commandCnt );
							
							snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", commandCnt );
		
							result = PHPCall( command );
						}
						
						bs = BufStringNewSize( result->ls_Size );
						if( bs != NULL )
						{
							BufStringAddSize( bs, result->ls_Data, result->ls_Size );
						}
						ListStringDelete( result );
					}
					// we should parse result to get information about success
				
					FFree( commandCnt );
					FFree( command );
					FFree( encPath );
					FFree( encPathSlash );
					return bs;
				}
				FFree( command );
			}
			FFree( encPath );
			FFree( encPathSlash );
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
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) + 
				( encComm ? strlen( encComm ) : 0 ) +
				( args ? strlen( args ) : 0 ) + 128;
			
			// Whole command
			char *command = FCalloc(
				strlen( "php \"modules/system/module.php\" \"\";" ) +
				cmdLength + 128, sizeof( char ) );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FCalloc( cmdLength + 1, sizeof( char ) );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&module=files&command=call&authkey=false&sessionid=%s&path=%s&args=%s",
						sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encComm ? encComm : "", args ? args : "" );
					FilterPHPVar( commandCnt );
					sprintf( command, "php 'modules/system/module.php' '%s';", commandCnt );
					FFree( commandCnt );
			
					BufString *bs = NULL;
					ListString *result = PHPCall( command );
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
	DEBUG("[PHPFS] Dir\n");
	if( s != NULL )
	{
		if( s->f_SpecialData == NULL )
		{
			return NULL;
		}
		
		char *comm = NULL;
		if( ( comm = FCalloc( strlen( path ) + strlen( s->f_Name ) + 8, sizeof(char) ) ) != NULL )
		{
			strcpy( comm, s->f_Name );
			strcat( comm, ":" );
		
			if( path != NULL ) strcat( comm, path );
			
			SpecialData *sd = (SpecialData *)s->f_SpecialData;
			
			DEBUG("[PHPFS] dir path : %s\n", comm );
			// Encoded path
			char *encComm = MarkAndBase64EncodeString( comm );
			strcat( comm, "/" );
			char *encPathSlash = MarkAndBase64EncodeString( comm );
			if( !encComm ) encComm = comm;
			else FFree( comm );
			
			// Calculate length of variables in string
			int cmdLength = strlen( "type=&module=files&args=false&command=directory&authkey=false&sessionid=&path=&subPath=" ) +
				( sd->type ? strlen( sd->type ) : 0 ) +
				( s->f_SessionIDPTR ? strlen( s->f_SessionIDPTR ) : 0 ) +
				( encComm ? strlen( encComm ) : 0 ) + 128 + strlen( "php \"modules/system/module.php\" \"\";" );
			
			// Whole command
			char *command = FMalloc(cmdLength );
			
			if( command != NULL )
			{
				// Just get vars
				char *commandCnt = FMalloc( cmdLength + 1 );
			
				// Generate command string
				if( commandCnt != NULL )
				{
					snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=directory&authkey=false&sessionid=%s&path=%s&subPath=",
						sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encComm ? encComm : "" );
					snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
		
					BufString *bs  = NULL;
					ListString *result = PHPCall( command );
					if( result != NULL )
					{
						if( result->ls_Data != NULL && strncmp( "fail<!--separate-->", result->ls_Data, 19 ) == 0 )
						{
							ListStringDelete( result );
							
							snprintf( commandCnt, cmdLength, "type=%s&module=files&args=false&command=directory&authkey=false&sessionid=%s&path=%s&subPath=",
								sd->type ? sd->type : "", s->f_SessionIDPTR ? s->f_SessionIDPTR : "", encPathSlash ? encPathSlash : "" );
							snprintf( command, cmdLength, "php 'modules/system/module.php' '%s';", FilterPHPVar( commandCnt ) );
		
							result = PHPCall( command );
						}
						
						if( result != NULL )
						{
							bs =BufStringNewSize( result->ls_Size );
							if( bs != NULL )
							{
								BufStringAddSize( bs, result->ls_Data, result->ls_Size );
							}
							ListStringDelete( result );
						}
						//DEBUG("Answer %s\n", bs->bs_Buffer );
					}
					
					FFree( commandCnt );
		
					FFree( command );
					FFree( encComm );
					if( encPathSlash != NULL )
					{
						FFree( encPathSlash );
					}
					return bs;
				}
			}
			// we should parse result to get information about success
	
			FFree( encComm );
			if( encPathSlash != NULL )
			{
				FFree( encPathSlash );
			}
			return NULL;
		}
	}
	return NULL;
}

