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

/*

	SystemBase code

*/

#include <core/types.h>
#include <core/library.h>
#include "systembase.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <dirent.h> 
#include <stdio.h> 
#include <unistd.h>
#include <service/service_manager.h>
#include <properties/propertieslibrary.h>
#include <ctype.h>
#include <magic.h>
#include "web_util.h"
#ifdef ENABLE_WEBSOCKETS
#include <network/websocket_client.h>
#endif
#include <system/device_handling.h>
#include <core/functions.h>

#define LIB_NAME "system.library"
#define LIB_VERSION 		1
#define LIB_REVISION		0
#define CONFIG_DIRECTORY	"cfg/"
#define LOGOUT_TIME         86400



DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, const char *name );

void DOSDriverDelete( DOSDriver *ddrive );

int UserDeviceMount( SystemBase *l, MYSQLLibrary *sqllib, User *usr );

//
// global structure
//

struct SystemBase *SLIB;

// Just a little help from our friends
struct stringPart 
{ 
	char *string; 
	int length; 
	void *next;
};

//
// init library
//

SystemBase *SystemInit( void )
{
	struct SystemBase *l = NULL;
	char tempString[ 1024 ];
	DEBUG("SystemBase\n");
	
	{
		char *tmp = getenv( "FRIEND_HOME" );
	}

	if( ( l = calloc( 1, sizeof( struct SystemBase ) ) ) == NULL )
	{
		return NULL;
	}
	
	// init libraries
	
	l->UserLibCounter = 0;
	l->MsqLlibCounter = 0;
	l->AppLibCounter = 0;
	l->PropLibCounter = 0;
	l->ZLibCounter = 0;
	
	// Set mutex
	pthread_mutex_init( &l->mutex, NULL );
	
	//User	 			*sl_Sessions;				// logged users with mounted devices
	
	struct UserLibrary	*ulib   = NULL;
	//struct MYSQLLibrary *sqllib = NULL;
	FriendCoreManager	*fcm    = NULL;				// connection with FriendCores
	
	int 				ulibc;						// counter of opened libraries
	int 				msqllibc;
	
	int					sl_Error;					// last error

	getcwd( tempString, sizeof ( tempString ) );
	
	DEBUG("Systembase: dlinit\n");
	
	l->SystemClose = dlsym ( l->handle, "SystemClose");

	l->SysWebRequest = dlsym( l->handle, "SysWebRequest");

	// execute.library structure
	l->RunMod = dlsym ( l->handle, "RunMod");
	l->RunHM = dlsym ( l->handle, "RunHM");
	l->MountFS = dlsym( l->handle, "MountFS");
	l->UnMountFS = dlsym( l->handle, "UnMountFS");

	l->LibraryUserGet = dlsym( l->handle, "LibraryUserGet");
	l->LibraryUserDrop = dlsym( l->handle, "LibraryUserDrop");
	l->LibraryMYSQLGet = dlsym( l->handle, "LibraryMYSQLGet");
	l->LibraryMYSQLDrop = dlsym( l->handle, "LibraryMYSQLDrop");
	l->LibraryApplicationGet = dlsym( l->handle, "LibraryApplicationGet");
	l->LibraryApplicationDrop = dlsym( l->handle, "LibraryApplicationDrop");
	l->LibraryPropertiesGet = dlsym( l->handle, "LibraryPropertiesGet");
	l->LibraryPropertiesDrop = dlsym( l->handle, "LibraryPropertiesDrop");
	l->LibraryZGet = dlsym( l->handle, "LibraryZGet");
	l->LibraryZDrop = dlsym( l->handle, "LibraryZDrop");
	l->LibraryImageGet = dlsym( l->handle, "LibraryImageGet");
	l->LibraryImageDrop = dlsym( l->handle, "LibraryImageDrop");
	l->UserDeviceMount = dlsym( l->handle, "UserDeviceMount" );
	
	#ifdef ENABLE_WEBSOCKETS
	l->AddWebSocketConnection = dlsym( l->handle, "AddWebSocketConnection");
	#endif
	
	l->GetError = dlsym( l->handle, "GetError" );
	l->SetFriendCoreManager = dlsym( l->handle, "SetFriendCoreManager");

	DEBUG("Systembase: mysqlget\n");
	
	// open mysql.library
	
	l->sqlpool = FCalloc( SQLLIB_POOL_NUMBER, sizeof( SQLConPool) );
	if( l->sqlpool != NULL )
	{
		int i;
		//l->sqllib = l->LibraryMYSQLGet( l );
		for( i=0 ; i < SQLLIB_POOL_NUMBER ; i++ )
		{
			l->sqlpool[i ].sqllib = (struct MYSQLLibrary *)LibraryOpen( l,  "mysql.library", 0 );
		}
	}
	
	DEBUG("Systembase: userlibget\n");
	
		// open user.library
	
	l->ulib = l->LibraryUserGet( l );
	l->ilib = l->LibraryImageGet( l );
	
	DEBUG("Systembase: application get\n");
	
	// open application.library
	
	l->alib = l->LibraryApplicationGet( l );
	//l->alib->SetSQLConnection( l->alib, l->sqllib );
	
	// dictionary
	
	MYSQLLibrary *lsqllib  = l->LibraryMYSQLGet( l );
	if( lsqllib != NULL )
	{
		l->sl_Dictionary = DictionaryNew( lsqllib );
	}
	l->LibraryMYSQLDrop( l, lsqllib );
	
	// modules
	
	l->sl_ModPath = calloc( 1025, sizeof( char ) );
	if( l->sl_ModPath == NULL )
	{
		free( l );
		return NULL;
	}

	strcpy( l->sl_ModPath, tempString );
	// TODO: Used to be /emod only - changed it
	strcat( l->sl_ModPath, "/emod/");
	
	// all modules will be avaiable in system.library folder/emod/ subfolder

	DIR           *d;
	struct dirent *dir;
	d = opendir( l->sl_ModPath );
	
	/*if( d == NULL )
	{
		// try to open files from libs/ directory
		strcpy( l->sl_ModPath, tempString );
		strcat( l->sl_ModPath, "/emod/");
		DEBUG(" Trying to find emods in %s\n", l->sl_ModPath );
		d = opendir( l->sl_ModPath );
	}*/
	
	if( d )
	{
		while( ( dir = readdir( d ) ) != NULL )
		{
			sprintf( tempString, "%s%s", l->sl_ModPath, dir->d_name );

			DEBUG(" %s fullmodpath %s\n", dir->d_name, tempString );
			if( dir->d_name[0] == '.' ) continue;
			
			EModule *locmod = EModuleCreate( tempString, dir->d_name );
			if( locmod != NULL )
			{
				DEBUG("MODCREATED created, adding to list\n");
				if( l->sl_Modules == NULL )
				{
					l->sl_Modules = locmod;
				}
				else
				{
					EModule *lmod = l->sl_Modules;

					while( lmod->node.mln_Succ != NULL )
					{
						lmod = (EModule *)lmod->node.mln_Succ;
						//DEBUG("Parsing modules\n");
					}
					lmod->node.mln_Succ = (struct MinNode *)locmod;	// add new module to list

				}
			}
			else
			{
				//DEBUG("Cannot load mod %s\n", dir->d_name );
			}
		}
		
		closedir( d );
	}
	
	DEBUG("Systembase: before drivers scan\n");
	
	RescanHandlers( l );
	
	RescanDOSDrivers( l );
	
	DEBUG("Systembase: checking logged users\n");
	
	//  get all users active
	
	//struct User *user = NULL;
	char tmpQuery[ 1024 ];
	//time_t t = time(NULL);
	//struct tm tm = *localtime(&t);
	time_t timestamp = time ( NULL );
	
//	if( ( timestamp - user->u_LoggedTime ) < LOGOUT_TIME )

	//printf("now: %d-%d-%d %d:%d:%d\n", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday, tm.tm_hour, tm.tm_min, tm.tm_sec);
	
	MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
	if( sqllib )
	{	
		sprintf( tmpQuery, " LoggedTime > '%lld'", (long long int)(timestamp - LOGOUT_TIME)  );
	
		//l->sl_Sessions = l->ulib->GetAllUsers( l->ulib );
		int entries;
		
		l->sl_Sessions = sqllib->Load( sqllib, UserDesc, tmpQuery, &entries );
		if( l->sl_Sessions != NULL )
		{
			User *tmpUser = l->sl_Sessions;

			while( tmpUser != NULL )
			{
				
				ERROR("\n\n\nAUTOLogged user----------------------------> %ld name %s\n", tmpUser->u_ID, tmpUser->u_Name );
			
				UserDeviceMount( l, sqllib, tmpUser );
			
				tmpUser = (User *)tmpUser->node.mln_Succ;
			}	// checking all users
		
			INFO("Loading logged users\n");
		}
		l->LibraryMYSQLDrop( l, sqllib );
	}
	
	if( ( l->sl_Magic = magic_open(MAGIC_MIME_TYPE|MAGIC_DEBUG) ) != NULL )
	{
		int err = magic_load( l->sl_Magic, NULL );
		DEBUG("Magic load return %d\n", err );
		err = magic_compile(l->sl_Magic, NULL);
		DEBUG("Magic compile return %d\n", err );
	}
	else
	{
		ERROR("Cannot open magic shared lib\n");
	}
	
	// 100 MB
	l->cm = CacheManagerNew( 1000000000 );
	if( l->cm == NULL )
	{
		ERROR("Cannot initialize CacheManager\n");
	}

	return ( void *)l;
}

//
// Close system.library
//

void SystemClose( struct SystemBase *l )
{
	if( l->cm != NULL )
	{
		CacheManagerDelete( l->cm );
	}
	
	// Delete dictionary
	// TODO: More explanation plz :)
	if( l->sl_Dictionary )
	{
		DictionaryDelete( l->sl_Dictionary );
		l->sl_Dictionary = NULL;
	}
	
	// close magic door of awesomeness!
	if( l->sl_Magic != NULL )
	{
		DEBUG( "Closing magic cookie!\n" );
		magic_close( l->sl_Magic );
		l->sl_Magic = NULL;
	}
	
	// Close image library
	l->LibraryImageDrop( l, l->ilib );
	
	// release and free all modules
	EModule *lmod = l->sl_Modules;
	while( lmod != NULL )
	{
		EModule *remm = lmod;
		lmod = (EModule *)lmod->node.mln_Succ;
		DEBUG("Remove module %s\n", remm->Name );
		EModuleDelete( remm );
	}
	
	
	User *usr = l->sl_Sessions;
	User *remusr = usr;
	while( usr != NULL )
	{
		remusr = usr;
		usr = (User *)usr->node.mln_Succ;
		
		if( remusr != NULL )
		{
			File *lf = remusr->u_MountedDevs;
			File *remdev = lf;
			while( lf != NULL )
			{
				remdev = lf;
				lf = (File *)lf->node.mln_Succ;
				
				FHandler *fsys = (FHandler *)remdev->f_FSys;

				if( fsys != NULL && fsys->UnMount != NULL )
				{
					// Only release
					if( fsys->Release( fsys, remdev ) != 0 )
					{
					
					}
				}
				else
				{
					ERROR("Cannot free FSYS (null)\n");
				}
				
				if( remdev->f_SessionID != NULL)
				{
					free( remdev->f_SessionID );
				}
				
				if( remdev->f_FSysName != NULL )
				{
					free( remdev->f_FSysName );
				}
				free( remdev );
			}
			
			DEBUG("Freeuser %s\n", remusr->u_Name );
			
			l->ulib->UserFree( remusr );
			remusr = NULL;
			DEBUG("=====================\n\n\n=================");
		}
	}
	
	l->sl_Sessions = NULL;
	
	// release dosdrivers
	DOSDriver *ldd = l->sl_DOSDrivers;
	while( ldd != NULL )
	{
		DOSDriver *remdd = ldd;
		ldd = (DOSDriver *)ldd->node.mln_Succ;
		DEBUG("Remove DOSDrive %s\n", remdd->dd_Name );
		DOSDriverDelete( remdd );
	}
	
	// release fsystems
	FHandler *lsys = l->sl_Filesystems;
	while( lsys != NULL )
	{
		FHandler *rems = lsys;
		lsys = (FHandler *)lsys->node.mln_Succ;
		DEBUG("Remove fsys %s\n", rems->Name );
		FHandlerDelete( rems );
	}
	
	// Free all users!
	// TODO: Enable this when we're actually ready to free users
	/*User *usr = l->sl_Sessions;
	User *tmp = usr;
	int maxusers = 4096;
	int run = 1, im = 0;
	int userinstance = 0;
	void *FreeUsers[maxusers]; // Backlog
	memset( &FreeUsers, 0, maxusers );
	while( tmp )
	{
		for( im = 0; im < maxusers; im++ )
		{
			if( FreeUsers[im] == tmp )
			{
				ERROR( "Trying to make me double free a user eh?\n" );
				run = 0;
			}
		}
		// Only free when we're allowed
		if( run == 1 )
		{
			l->ulib->UserFree(  tmp );
			FreeUsers[userinstance] = tmp;
			if( tmp == usr->node.mln_Succ )
			{
				ERROR( "We're linking to ourselves! Infinite loop error!\n" );
				break;
			}
			tmp = usr->node.mln_Succ;
			
			// Also, only allow max
			if( userinstance++ >= maxusers ) break;
		}
		// Temporary fix, because users haven't been properly cleaned..
		else
		{
			break;
		}
	}*/
	

	
	// Close user library
	l->LibraryUserDrop( l, l->ulib );
	
	// Application lib
	if( l->alib )
	{
		LibraryClose( l->alib );
	}
	
	// Close mysql library
	DEBUG( "Closing and looking into mysql pool\n" );
	if( l->sqlpool != NULL )
	{
		int i;
		for( i=0 ; i < SQLLIB_POOL_NUMBER ; i++ )
		{
			DEBUG( "Closed mysql library slot %d\n", i );
			LibraryClose( l->sqlpool[i ].sqllib );
		}
		
		free( l->sqlpool );
	}
	
	// release them all strings ;)
	if( l->sl_ModPath )
	{
		free( l->sl_ModPath );
		l->sl_ModPath = NULL;
	}
	if( l->sl_FSysPath )
	{
		free( l->sl_FSysPath );
		l->sl_FSysPath = NULL;
	}
	
	// Close properties.library
	if( l->plib ) 
	{
		DEBUG( "Seems we still have the properties library. Remove it.\n" );
		LibraryClose( l->plib );
	}
	
	// Destroy mutex
	pthread_mutex_destroy( &l->mutex );
	
	DEBUG("System library closed.\n");
}

//
//
//

int UserDeviceMount( SystemBase *l, MYSQLLibrary *sqllib, User *usr )
{
	char temptext[ 512 ];

	//sprintf( temptext, "SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID` FROM `Filesystem` f WHERE f.UserID = '%ld'", usr->u_ID );
	sprintf( temptext, "SELECT `Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID` FROM `Filesystem` f WHERE f.UserID = '%ld' and f.Mounted = '1'", usr->u_ID );
	MYSQL_RES *res = sqllib->Select( sqllib, temptext );
	if( res == NULL ) return 0;
	
	MYSQL_ROW row;

	// check if device is already on list
	INFO("Mount user device from Database\n");
	
	int j=0;
	if( usr->u_MountedDevs != NULL )
	{
		/*
		File *f;
		
		LIST_FOR_EACH( usr->u_MountedDevs, f )
		{
			
		}
		*/
	}
	
	while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
	{
		// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted
		//row = res->row[ j ];
		DEBUG("Database -> Name '%s' Type '%s', Server '%s', Port '%s', Path '%s', Mounted '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
		
		DEBUG( "%s is %s\n", row[ 0 ], atoi( row[ 5 ] ) == 1 ? "mounted" : "not mounted" );
		int mount = atoi( row[ 5 ] );
		int id = 0;
		User *owner = NULL;
		/*
		if( row[ 6 ] != NULL )
		{
			ULONG ownid = (ULONG) atol( row[ 6 ] );
			
			DEBUG("----------------------- %ld  usrid %ld\n", ownid, usr->u_ID );
			
			if( usr->u_ID !=  ownid )
			{
				User *locusr = NULL;
				LIST_FOR_EACH( l->sl_Sessions, locusr )
				{
					if( locusr->u_ID == ownid )
					{
						owner = locusr;
						break;
					}
				} // for each user
			}
			
			if( owner == NULL )
			{
				owner = l->ulib->UserGetByID( l->ulib, ownid );
				if( owner != NULL )
				{
					LIST_ADD_HEAD( l->sl_Sessions, owner );
				}
				else
				{
					ERROR("UserDeviceMount: Cannot find user with ID %ld\n", ownid );
				}
			}
		}*/
		
		// Only mount it if it's required!
		//if( mount == 1 )
		{
			struct TagItem tags[] = {
				{FSys_Mount_Path, (ULONG)row[ 4 ]},
				{FSys_Mount_Host, (ULONG)NULL},
				{FSys_Mount_Port, (ULONG)NULL},
				{FSys_Mount_Type, (ULONG)row[ 1 ]},
				{FSys_Mount_Name, (ULONG)row[ 0 ]},
				{FSys_Mount_User, (ULONG)usr },
				{FSys_Mount_Owner, (ULONG)owner },
				{FSys_Mount_ID, (ULONG)id },
				{FSys_Mount_Mount, (ULONG)mount },
				{TAG_DONE, TAG_DONE}
			};

			File *device = NULL;
			int err = MountFS( l, (struct TagItem *)&tags, &device );
			if( err != 0 )
			{
				ERROR("Cannot mount device, device '%s' will be unmounted. ERROR %d\n", row[ 0 ], err );
				if( mount == 1 )
				{
					sprintf( temptext, "UPDATE Filesystem SET `Mounted` = '0' WHERE `UserID` = '%ld' AND LOWER(`Name`) = LOWER('%s')", 
					usr->u_ID, (char *)row[ 0 ] );
					MYSQL_RES *resx = sqllib->Select( sqllib, temptext );
				}
			}
			else if( device )
			{
				device->f_Mounted = TRUE;
			}
			else
			{
				ERROR( "Cannot set device mounted state. Device = NULL (%s).\n", row[0] );
			}
		}	
	}	// going through all rows
	DEBUG( "Device mounted for user %s\n", usr->u_Name );

	sqllib->FreeResult( sqllib, res );
	
	DEBUG( "Successfully freed.\n" );
	
	usr->u_InitialDevMount = TRUE;
	
	return 0;
}


//
// set Friend Core Manager
//

void SetFriendCoreManager( struct SystemBase *l, FriendCoreManager *lfcm )
{
	if( l != NULL )
	{
		l->fcm = lfcm;
	}
}

//
// UnMount device
//


int deinit( struct SystemBase *l )			// unmount FS
{
	int result = 0;
	
	DEBUG("deinit FS\n");
	

	DEBUG("deinit FS END\n");
	
	return result;
}

//
// run/execute command
//

char *RunMod( struct SystemBase *l, const char *mime, const char *path, const char *args, unsigned long int *length )
{
	char tmpQuery[ 255 ];
	int pathlen = strlen( path );
	char *results = NULL;
	DEBUG("SYSLIB RUN: System.library run\n");

	EModule *lmod = l->sl_Modules;
	EModule *workmod = NULL;

	DEBUG("SYSLIB RUN: Checking modules %s\n", mime );

	while( lmod != NULL )
	{
		if( lmod->GetSuffix != NULL )
		{
			DEBUG("SEARCHING FILESYSTEM %s found %s\n", mime, lmod->GetSuffix() );
		
			if( strcmp( lmod->GetSuffix(), mime ) == 0 )
			{
				workmod = lmod;
				break;
			}
		}
		lmod = (EModule *)lmod->node.mln_Succ;
	}

	if( workmod != NULL )
	{
		DEBUG("SYSLIB RUN: Found module %s, using it\n", lmod->GetSuffix() );
		
		results = lmod->Run( lmod, path, args, length );
	}
	else
	{
		ERROR("Cannot run %s script!!!\n", mime );
	}

	//DEBUG("SYSLIB RUN: end, result %s\n", results );

	return results;
}

//
// Execute function
//

unsigned int RunHM( struct SystemBase *l, const char *mime, const char *path, struct Hashmap *hm )
{

	return 0;
}

//
//
//

HashmapElement *GetHEReq( Http *request, char *param )
{
	HashmapElement *tst = HashmapGet( request->parsedPostContent, param );
	if( tst == NULL ) tst = HashmapGet( request->query, param );
	
	return tst;
}

//
// network handler
//

Http *SysWebRequest( struct SystemBase *l, char **urlpath, Http* request )
{
	int result = 0;
	Http *response = NULL;
	User *loggedUser = NULL;
	BOOL userAdded = FALSE;
	
	INFO("Webreq func: %s\n", urlpath[ 0 ] );
	
	char sessionid[ 256 ];
	
	// Check for sessionid by sessionid specificly or authid
	if( strcmp( urlpath[ 0 ], "login" ) != 0 )
	{
		char *authid = NULL;
		
		DEBUG( "Getting mysql..\n" );
		
		MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
		
		DEBUG( "Finding login info.\n" );
		
		HashmapElement *tst = GetHEReq( request, "sessionid" );
		HashmapElement *ast = GetHEReq( request, "authid" );
		if( tst == NULL && ast == NULL )
		{			
			l->LibraryMYSQLDrop( l, sqllib );	
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE,(ULONG)StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION,(ULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE }
			};
			char *data = "{ \"ErrorMessage\": \"could not find sessionid or authid\" }";
			response = HttpNewSimple( HTTP_200_OK, tags );
			HttpAddTextContent( response, data );
			ERROR( "Could not log in, no sessionid or authid.. (404, %p, %p)\n", tst, ast );
			return response;
		}
		// Ah, we got our session
		if( tst )
		{
			sprintf( sessionid, "%s", (char *)tst->data );
			DEBUG( "Finding sessionid %s.\n", sessionid );
		}
		// Get it by authid
		else if( ast )
		{
			DEBUG( "Testing SQL by authid. %s\n", (char *)ast->data );
			
			DEBUG( "We got the SQL library.\n" );
			// Get authid from mysql
			if( sqllib )
			{
				char q[ 1024 ];
				sprintf( q, 
					"SELECT u.SessionID FROM FUser u, FUserApplication a WHERE a.AuthID=\"%s\" AND a.UserID = u.ID LIMIT 1",
					( char *)ast->data 
				);
				MYSQL_RES *res = sqllib->Select( sqllib, q );
				MYSQL_ROW row;
				if( ( row = sqllib->FetchRow( sqllib, res ) ) )
				{
					sprintf( sessionid, "%s", row[ 0 ] );
				}
				sqllib->FreeResult( sqllib, res );
				DEBUG( "Trying to drop library\n" );
				
				DEBUG( "We dropped the mysql library\n" );
			}
			DEBUG( "Ok, SQL phase complete\n" );
		}
		
		if( sessionid == NULL )
		{
			ERROR("Sessionid == NULL!\n");
		}
		else
		{
			time_t timestamp = time ( NULL );
			User *curusr = l->sl_Sessions;
			int userFound = 0;
				
			//DEBUG("user found, mounting device\n");
				
			while( curusr != NULL )
			{
				DEBUG("CHECK user: %s sessionid %s matched on %s\n", curusr->u_Name, curusr->u_SessionID, sessionid );
				if( curusr->u_SessionID && strcmp( curusr->u_SessionID, sessionid ) == 0 )
				{
					// TODO: Reenable this once it works......
					/*if( ( timestamp - curusr->u_LoggedTime ) > LOGOUT_TIME )
					{
						Http_t* response = HttpNewSimple( 
							HTTP_200_OK, 4,
							"Content-Type", StringDuplicate( "text/plain" ),
							"Connection", StringDuplicate( "close" )
						);
					
						ERROR("User timeout\n");
						HttpAddTextContent( response, "{ \"ErrorMessage\": \"timeout!\"}" );
					
						HttpWriteAndFree( response, sock );
					
						return 200;
					}
					else
					{
						curusr->u_LoggedTime = timestamp;
					}*/
					loggedUser = curusr;
					userAdded = TRUE;		// there is no need to free resources
					break;
				}
				
				curusr = (User *)curusr->node.mln_Succ;
			}
		}
		if( loggedUser == NULL )
		{
			//INFO("Webreq func: %s\n", func );
			ERROR("User not found !\n");
			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			DEBUG("Create response\n");
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple(  HTTP_200_OK,  tags );
			
			DEBUG("Set text\n");
			char *data = "{ \"ErrorMessage\": \"user not found\"}";
			HttpAddTextContent( response, data );
			DEBUG("Write and quit\n");
				
			//HttpWriteAndFree( response );
			
			l->LibraryMYSQLDrop( l, sqllib );
			DEBUG("MYSQL released\n");
			return response;
		}
		else
		{
			time_t timestamp = time ( NULL );
			char tmpQuery[ 255 ];
			sprintf( tmpQuery, "UPDATE FUser SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionid );
			MYSQL_RES *res = sqllib->Select( sqllib, tmpQuery );
			UserDeviceMount( l, sqllib, loggedUser );
			sqllib->FreeResult( sqllib, res );
		}
		l->LibraryMYSQLDrop( l, sqllib );
	}
	
	if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) ERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "ok<!--separate-->{ \"HELP\": \"commands: \n" 
				"- user: \n" 
				"\tcreate - create user in database\n" 
				"\tlogin - login user to system\n"
				"\tlogout - logout user from system\n\n"
				"- module - run module\n\n"
				"- device:\n"
				"\tmount - mount device\n"
				"\tunmount - unmount device\n\n"
				"\tlist - list all mounted devices\n"
				"\tlistsys - take all avaiable file systems\n"
				"- file:\n"
				"\tinfo - get information about file/directory\n"
				"\tdir - get all files in directory\n"
				"\trename - rename file or directory\n"
				"\tdelete - delete all files or directory (and all data in directory)\n"
				"\tmakedir - make new directory\n"
				"\texec - run command\n"
				"\tread - read bytes from file\n"
				"\twrite - write files to file\n"
				"\"}" );
		
		//HttpWriteAndFree( response );
		result = 200;
	
	}
	else if( strcmp(  urlpath[ 0 ], "login" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) ERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
	
		DEBUG("Login function\n");
					
		if( request->parsedPostContent != NULL )
		{
			char *usrname = NULL;
			char *pass = NULL;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = (char *)el->data;
			}

			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				pass = (char *)el->data;
			}

			if( usrname != NULL && pass != NULL )
			{
			
				//DEBUG("Found logged user under address %p\n", logusr );
				/*
				//if user is logged in, we skip his authentication(we should check timestamp)
				if( logusr != NULL )
				{
					break;
				}*/
			
				DEBUG("Authenticate %s\n", usrname );
				if( l->ulib != NULL )
				{
					User *tuser = l->sl_Sessions;
					User *dstusr = NULL;
					if( tuser != NULL  )
					{
						while( tuser != NULL )
						{
							// Check both username and password
							if( strcmp( usrname, tuser->u_Name ) == 0 && l->ulib->CheckPassword( l->ulib, tuser, pass ) == TRUE )
								//strcmp( pass, tuser->u_Password ) == 0 )
							{
								dstusr = tuser;
								break;
							}
							tuser = (User *)tuser->node.mln_Succ;
						}
					}
					
					if( dstusr == NULL )
					{
						DEBUG("Authenticate\n");
						loggedUser = l->ulib->Authenticate( l->ulib, NULL, usrname, pass, NULL );
						
						//
						// user not logged in previously, we must add it to list
						// 
						if( loggedUser != NULL )
						{
							if( l->sl_Sessions == NULL )	// list is empty
							{
								l->sl_Sessions = loggedUser;
							}
							else
							{
								ERROR("\n\n\nSECOND USER\nsessid %s\n\n\n", loggedUser->u_SessionID );
				
								//lastuser->node.mln_Succ = (struct MinNode *)loggedUser;
								//loggedUser->node.mln_Pred = (struct MinNode *)lastuser;
								loggedUser->node.mln_Succ = (struct MinNode *)l->sl_Sessions;
								l->sl_Sessions = loggedUser;
							}
							/*
							else
							{	// user logged in, update information
								time_t timestamp = time ( NULL );
								loggedUser->u_LoggedTime = timestamp;
							}*/
			
							MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
							UserDeviceMount( l, sqllib, loggedUser );
							userAdded = TRUE;
							l->LibraryMYSQLDrop( l, sqllib );
						
						}
		
					}
					else
					{
						loggedUser = l->ulib->Authenticate( l->ulib, dstusr, usrname, pass, NULL );
						
						if( loggedUser->u_InitialDevMount == FALSE )
						{
							MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
							UserDeviceMount( l, sqllib, loggedUser );
							l->LibraryMYSQLDrop( l, sqllib );
						}
						/*
						loggedUser = dstusr;
						
						char tmp[ 256 ];
						sprintf( tmp, 
							"{ \"ErrorMessage\": \"%d\", \"sessionid\": \"%s\", \"userid\": \"%ld\", \"fullName\": \"%s\" }",
							loggedUser->u_Error, loggedUser->u_SessionID, loggedUser->u_ID, loggedUser->u_FullName
						);	// check user.library to display errors
						HttpAddTextContent( response, tmp );

						return response;*/
					}
					
					if( loggedUser != NULL )
					{
						INFO("User authenticated %s sessionid %s \n", loggedUser->u_Name, loggedUser->u_SessionID );
						
						char tmp[ 256 ];
						sprintf( tmp, 
							"{ \"ErrorMessage\": \"%d\", \"sessionid\": \"%s\", \"userid\": \"%ld\", \"fullName\": \"%s\" }",
							loggedUser->u_Error, loggedUser->u_SessionID, loggedUser->u_ID, loggedUser->u_FullName
						);	// check user.library to display errors
						HttpAddTextContent( response, tmp );
					}
					else
					{
						ERROR("[ERROR] User not found by user.library\n" );
						HttpAddTextContent( response, "LERR: -1" );			// out of memory/user not found
					}
				}
				else
				{
					ERROR("[ERROR] User.library is not opened\n" );
					HttpAddTextContent( response, "{ \"ErrorMessage\": \"user.library is not opened!\"}" );
				}
				DEBUG("After auth\n");
			}
			else
			{
				ERROR("[ERROR] username or password not found\n" );
				HttpAddTextContent( response, "{ \"ErrorMessage\": \"Username or Password not found!\"}" );
			}
		}
		else
		{
			ERROR("[ERROR] no data in POST\n");
		}
		DEBUG("user login response\n");

		
		//HttpWriteAndFree( response );
		result = 200;
	
	}
	else if( strcmp(  urlpath[ 0 ], "user" ) == 0 )
	{
		char *usr = NULL;
		char *pass = NULL;
		
		if( strcmp( urlpath[ 1 ], "create" ) == 0 )
		{
		
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			if( l->ulib == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );
				goto error;

				//return response;
			}
		
			HashmapElement *el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usr = (char *)el->data;
			}

			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				pass = (char *)el->data;
			}
		
			if( usr == NULL || pass == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Username or Password not found!\"}" );
			}
			else
			{
				User *luser = calloc( 1, sizeof( User ) );
				luser->u_Name = usr;
				luser->u_Password = pass;
				
				int error = l->ulib->UserCreate( l->ulib, luser );
			
				if( error == 0 )
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"CreateUser\": \"sucess\" }" );
				}
				else
				{

					char tmp[ 20 ];
					sprintf( tmp, "ok<!--separate-->{ \"ErrorMessage\": \"%d\"}", error );	// check user.library to display errors
					HttpAddTextContent( response, tmp );
				}
				
				if( luser )
				{
					free( luser );
				}
			}
		
			//HttpWriteAndFree( response );
		
			result = 200;

		}
		//
		// logout
		//
		else if( strcmp( urlpath[ 1 ], "logout" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			User *logusr = l->sl_Sessions;
			User *remusr = NULL;
		
			DEBUG( "[systembase.c] Logging out!!\n" );
		
			HashmapElement *el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				char *usrname = (char *)el->data;
			
				if( logusr == NULL )
				{
				
				}
				else
				{	// list is not empty
					while( logusr != NULL )
					{
						if( strcmp( logusr->u_Name, usrname ) == 0 )
						{
							remusr = logusr;
							break;
						}
						logusr = (User *)logusr->node.mln_Succ;
					}
				
					//
					// we found user which must be removed
					//
				
					if( remusr != NULL )
					{
						if( remusr->node.mln_Pred == NULL )	// user is root user!
						{
							l->sl_Sessions = (User *)remusr->node.mln_Succ;
							if( remusr->node.mln_Succ != NULL )
							{
								((User *)remusr->node.mln_Succ)->node.mln_Pred = NULL;
							}
						}
						else
						{
							User *next = ((User *)remusr->node.mln_Succ);
							User *prev = ((User *)remusr->node.mln_Pred);
							next->node.mln_Pred = (struct MinNode *)prev;
							prev->node.mln_Succ = (struct MinNode *)next;
						}
						
						l->ulib->UserDelete( l->ulib, remusr );
						remusr = NULL;
					}
				}
				if( l->ulib != NULL )
				{
					l->ulib->Logout( l->ulib, usrname );
				}
				else
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );
				}
			}
		
			//HttpWriteAndFree( response );
			result = 200;
		}
	}
	//
	// Polling a module!
	//
	else if( strcmp( urlpath[ 0 ], "module" ) == 0 )
	{
		DEBUG( "[MODULE] Testing to use a module!\n" );
		
		// Now go ahead
		struct stat f;
		char *data = NULL;
		unsigned long int dataLength = 0;
		DEBUG( "[MODULE] Trying modules folder..." );
		if( stat( "modules", &f ) != -1 )
		{
			if( S_ISDIR( f.st_mode ) )
			{
				// 2. Check if module folder exists in modules/
				HashmapElement *he = HttpGetPOSTParameter( request, "module" );
				if( he == NULL ) he = HashmapGet( request->query, "module" );
				
				if( he != NULL )
				{
					char *module = ( char *)he->data;
					char *path = calloc( 256, sizeof( char ) );
					sprintf( path, "modules/%s", module );
					if( stat( path, &f ) != -1 )
					{
						// 3. Determine interpreter (or native code)
						DIR *fdir = NULL;
						struct dirent *fdirent = NULL;
						char *modType = NULL;
						
						if( ( fdir = opendir( path ) ) != NULL )
						{
							while( ( fdirent = readdir( fdir ) ) )
							{
								char *component = calloc( 7, sizeof( char ) );
								sprintf( component, "%.*s", 6, fdirent->d_name );
								//DEBUG( "[MODULE] Let\'s test \"%s\"\n", component );
								// Ah we have a module!
								if( strcmp( component, "module" ) == 0 )
								{
									int hasExt = 0;
									int dlen = strlen( fdirent->d_name );
									int ie = 0;
									for( ; ie < dlen; ie++ )
									{
										if( fdirent->d_name[ie] == '.' )
										{
											hasExt = ie;
										}
									}
									// Has extension!
									if( hasExt > 0 )
									{
										int extlen = dlen - 7;
										if( modType ) free( modType );
										modType = calloc( extlen + 1, sizeof( char ) );
										ie = 0; int md = 0, typec = 0;
										for( ; ie < dlen; ie++ )
										{
											if( md == 0 && fdirent->d_name[ie] == '.' )
											{
												md = 1;
											}
											else if ( md == 1 )
											{
												modType[typec++] = fdirent->d_name[ie];
											}
										}
										//DEBUG( "[MODULE] Module is of type %s\n", modType );
									}
								}
								free( component );
							}
							closedir( fdir );
						}
		
						// 4. Execute with interpreter (or execute native code)
						if( modType != NULL )
						{
							//DEBUG( "[MODULE] Executing %s module!", modType );
							char *modulePath = calloc( 256, sizeof( char ) );
							sprintf( modulePath, "%s/module.%s", path, modType );
							if( 
								strcmp( modType, "php" ) == 0 || 
								strcmp( modType, "jar" ) == 0 ||
								strcmp( modType, "py" ) == 0
							)
							{
								data = RunMod( 
									SLIB, modType, modulePath, 
									request->content != NULL ? request->content : request->uri->queryRaw, 
									&dataLength 
								);
								
								if( data != NULL )
								{
									//DEBUG( "[MODULE] Ok, we got result with length of %d\n", (int)strlen( data ) );
									
									// 5. Piped response will be output!
									char *ltype  = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Type"   ) : NULL;
									char *length = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Length" ) : NULL;
			
									DEBUG("TYPE %s LENGTH %s\n", ltype, length );
									
									//
									// TODO
									// there are some problems here with getting 'length' string correctly
									//==6660==    at 0x4C2D9C0: memcpy@@GLIBC_2.14 (vg_replace_strmem.c:915)
//==6660==    by 0x41D99E: StringDuplicateN (string.c:103)
//==6660==    by 0x42EC1C: SysWebRequest (systembase.c:1396)
//==6660==    by 0x410E75: ProtocolHttp (protocol_http.c:412)
//==6660==    by 0x4084A5: SocketCallHandler (friend_core.c:534)
//==6660==    by 0x55390A3: start_thread (pthread_create.c:309)
//==6660==    by 0x687604C: clone (clone.S:111)
//==6660==  Address 0x11b94b92 is 0 bytes after a block of size 2 alloc'd
///==6660==    at 0x4C2AD10: calloc (vg_replace_malloc.c:623)
//==6660==    by 0x42EB68: SysWebRequest (systembase.c:1374)
//==6660==    by 0x410E75: ProtocolHttp (protocol_http.c:412)
//==6660==    by 0x4084A5: SocketCallHandler (friend_core.c:534)
//==6660==    by 0x55390A3: start_thread (pthread_create.c:309)
//==6660==    by 0x687604C: clone (clone.S:111)

									
									char *datastart = strstr( data, "---http-headers-end---" );
									if( datastart != NULL )
									{
										datastart += 23;
										if( length == NULL )
										{	
											length = calloc( 64, 1 );
											sprintf( length, "%ld", dataLength - ( datastart - data ) );
											char *trimmed = calloc( strlen( length ), 1 );
											sprintf( trimmed, "%s", length );
											free( length );
											length = trimmed;
										}
									}
			
									DEBUG("Length : %s\n", length );
			
									if( ltype != NULL )
									{
										DEBUG( "[System.library] We found Content-Type: %s\n", ltype );
									}
									else
									{
										DEBUG( "[System.library] We found no Content-Type header in data.\n" );
									}
									
									if( ltype != NULL && length != NULL )
									{
										struct TagItem tags[] = {
											{ HTTP_HEADER_CONTENT_TYPE, (ULONG)StringDuplicateN( ltype, strlen( ltype ) ) },
											{ HTTP_HEADER_CONTENT_LENGTH, (ULONG)StringDuplicateN( length, strlen( length ) ) },
											{ HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
											{ TAG_DONE, TAG_DONE }
										};
		
										if( response != NULL )
										{
											ERROR("RESPONSE ERROR ALREADY SET (freeing)\n");
											HttpFree( response );
										}
										response = HttpNewSimple( HTTP_200_OK, tags );
										
										if( response )
										{
											char *next;
											int calSize = strtol (length, &next, 10);
											if ((next == length) || (*next != '\0')) 
											{
												ERROR("Lenght of message == 0\n");
											}
											else
											{
												//int calSize = atoi( length );
												DEBUG("file size counted %d\n", calSize );
												char *returnData = calloc( calSize, sizeof( BYTE ) );
												if( returnData != NULL )
												{
													//DEBUG("MEMAlocated %s\n", datastart );
													memcpy( returnData, datastart, calSize*sizeof(BYTE) );
													HttpSetContent( response, returnData, calSize );
												}
											}
										}
										free( data );
									}
									else
									{
										DEBUG("Create default response\n");
										
										struct TagItem tags[] = {
											{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  ( ltype != NULL ? StringDuplicateN( ltype, strlen( ltype ) ) : StringDuplicate( "text/plain" ) ) },
											{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
											{TAG_DONE, TAG_DONE}
										};
		
										if( response != NULL )
										{
											ERROR("RESPONSE ERROR ALREADY SET (freeing)\n");
											HttpFree( response );
										}
										response = HttpNewSimple( HTTP_200_OK,  tags );
										
										if( response != NULL )
										{
											HttpSetContent( response, data, dataLength );
										}
										else
										{
											free( data );
										}
									}
			
									DEBUG("Send message to socket\n");
									//HttpWriteAndFree( response );
									//response = NULL;
			
									if( ltype ){ free( ltype ); ltype = NULL;}
									if( length ){ free( length ); length = NULL; }
			
									result = 200;
								}
								else
								{
									ERROR("[System.library] ERROR returned data is NULL\n");
									result = 404;
								}
							}
							DEBUG("Free rest\n");
							if( modulePath )
							{
								free( modulePath );
								modulePath = NULL;
							}
							
							if( modType != NULL )
							{
								free( modType );
								modType = NULL;
							}
						}
					}
					DEBUG("Freee path\n");
					free( path );
				}
			}
		}
		
		DEBUG("Module executed...\n");
	}
	else if( strcmp( urlpath[ 0 ], "device" ) == 0 )
	{
		//
		// device commands
		//
		
		if( strcmp( urlpath[ 1 ], "mount" ) == 0 )
		{
			char *devname = NULL;
			char *path = NULL;
			char *type = NULL;
		
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			DEBUG("Mount\n");
			
			if( l->ulib == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );

				goto error;
				//return response;
			}
		
			HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
			if( el != NULL )
			{
				devname = (char *)el->data;
			}
		
			el = HttpGetPOSTParameter( request, "path" );
			if( el != NULL )
			{
				path = (char *)el->data;
				char *lpath;
				if( path != NULL )
				{
					if( ( lpath = calloc( strlen( path ) + 1, sizeof(char) ) ) != NULL )
					{
						UrlDecode( lpath, path );
						strcpy( path, lpath );
					}
				}
				else // path == NULL
				{
					//strcpy( path, "." );
				}
			}
		
			el = HttpGetPOSTParameter( request, "type" );
			if( el != NULL )
			{
				type = (char *)el->data;
			}
			
			int mountError = 0;
		
			if( sessionid == NULL || devname == NULL || type == NULL )
			{
				ERROR("One of required arguments is missing: sessionid, devname, type\n");
				// required arguments missing
				HttpAddTextContent( response, "{ \"ErrorMessage\": \"Required arguments is missing sessionid, devname, type\"}" );
			}
			else
			{
				//
				// user is logged in, we can mount device for him
				//
				
				char *module = NULL;
				el = HttpGetPOSTParameter( request, "module" );
				if( el != NULL )
				{
					module = (char *)el->data;
				}
				
				if( loggedUser != NULL )
				{
					struct TagItem tags[] = {
						{FSys_Mount_Path, (ULONG)path},
						{FSys_Mount_Host, (ULONG)NULL},
						{FSys_Mount_Port, (ULONG)NULL},
						{FSys_Mount_Type, (ULONG)type},
						{FSys_Mount_Name, (ULONG)devname},
						{FSys_Mount_User, (ULONG)loggedUser},
						{FSys_Mount_Module,(ULONG)module},
						{FSys_Mount_Owner,(ULONG)loggedUser},
						{FSys_Mount_Mount, (ULONG)TRUE },
						{TAG_DONE, TAG_DONE}
					};
					
					File *mountedDev = NULL;
					
					int mountError = MountFS( l, (struct TagItem *)&tags, &mountedDev );
			
					// This is ok!
					if( mountError != 0 && mountError != FSys_Error_DeviceAlreadyMounted )
					{
						DEBUG("Cannot mount already mounted filesystem!\n");
						HttpAddTextContent( response, "ok<!--separate-->ErrorMessage: Device already mounted." );
						
						mountError = 1;
					}
					else
					{
						if( mountError == FSys_Error_DeviceAlreadyMounted )
						{
							DEBUG( "We will mount this bastard, even if it's already mounted!\n" );
						}
						
						char tmp[ 100 ];
						sprintf( tmp, "ok<!--separate-->Mouting error: %d (already mounted)\n", l->GetError( l ) );
						HttpAddTextContent( response, tmp );
					}	// mount failed
					
					//TODO
					// we must check if dvice should be moutned
					// NB: ALWAYS mount when asked to and allowed to
					if( mountedDev != NULL )
					{
						char temptext[ 512 ];
						sprintf( temptext, "UPDATE `Filesystem` SET `Mounted` = '1' WHERE `UserID` = '%ld' AND LOWER(`Name`) = LOWER('%s')", loggedUser->u_ID, devname );
						MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
						if( sqllib )
						{
							MYSQL_RES *res = sqllib->Select( sqllib, temptext );
							l->LibraryMYSQLDrop( l, sqllib );
						}
						
						mountedDev->f_Mounted = TRUE;
					}
					
				}
				else
				{	// user not found , he is not logged in
					DEBUG("Cannot mount device for not logged in user\n");
					HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Cannot mount device for not logged user\"}" );
				}
			}		// check mount parameters
		
			//HttpWriteAndFree( response );
			result = 200;
			
			//
			// unmount
			//
		}
		else if( strcmp( urlpath[ 1 ], "unmount" ) == 0 )
		{
			char *devname = NULL;
			int mountError = 0;
		
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			if( l->ulib == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );

				goto error;
				//return response;
			}
		
			HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
			if( el != NULL )
			{
				devname = (char *)el->data;
			}
		
			if( devname == NULL || sessionid == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Device name or sessionID are empty\"}" );
			}
			else
			{
				if( loggedUser != NULL )
				{
					struct TagItem tags[] = {
						{FSys_Mount_Name, (ULONG)devname },
						{FSys_Mount_User, (ULONG)loggedUser },
						{TAG_DONE, TAG_DONE }
					};
					mountError = -1;
				
					File *f = NULL;
					LIST_FOR_EACH( loggedUser->u_MountedDevs, f )
					{
						if( strcmp( devname, f->f_Name ) == 0 )
						{
							mountError = 0;
							f->f_Mounted = FALSE;
						}
					}
					
					//mountError = UnMountFS( l, (struct TagItem *)&tags );
					
					// default handle
					if( mountError != 0 )
					{
						//int err = DefFSHandle( l, func, request, sock );
						//if( err != 0 )
						{
							char tmp[ 100 ];
						/*
							int err = l->GetError( l );
							if( err == 0 )
							{
								sprintf( tmp, "ok<!--separate-->{\"error\":\"unmounting unmounted volume\"}" );
							}
							else*/
							{
								sprintf( tmp, "ok<!--separate-->{\"ErrorMessage\":\"%d\"}", mountError );
							} 
							HttpAddTextContent( response, tmp );
						}
					}		// mounting via php proxy
					else	// there was no error while mounting device
					{
						char temptext[ 512 ];
				
						MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
						sprintf( temptext, "UPDATE Filesystem SET `Mounted` = '0' WHERE `UserID` = '%ld' and LOWER(`Name`) = LOWER('%s')", loggedUser->u_ID, devname );
						MYSQL_RES *res = sqllib->Select( sqllib, temptext );
						l->LibraryMYSQLDrop( l, sqllib );
						
						//HttpWriteAndFree( response, sock );
						HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Device unmounted\"}" );
						result = 200;
					}
					
					//char tmp[ 100 ];
				//	sprintf( tmp, "UnMouting error: %d\n", l->GetError( l ) );
					//HttpAddTextContent( response, tmp );
				}	
				else
				{
					ERROR("User session is invalid\n");
					HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"User not logged in, cannot unmount device\"}" );
				}
			}
			
			//HttpWriteAndFree( response );
			result = 200;
			DEBUG("End unmount\n");
			
			//
			// share device
			//
			
		}
		//TODO
		// rewrite code to use db not sl_Sessions
		else if( strcmp( urlpath[ 1 ], "share" ) == 0 )
		{
			char *devname = NULL;
			char *username = NULL;
		
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			if( l->ulib == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );

				goto error;
				//return response;
			}
		
			HashmapElement *el = HttpGetPOSTParameter( request, "devname" );
			if( el != NULL )
			{
				devname = (char *)el->data;
			}
			
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				username = (char *)el->data;
			}
			
			if( devname == NULL || username == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Device name or Username are empty\"}" );
				ERROR("Devname or username are empty! Cannot share device\n");
				goto error;
				//return response;
			}
			else
			{
				// first we must find user
				//  to which we will share our device
				
				User *user = NULL;
				
				LIST_FOR_EACH( l->sl_Sessions, user )
				{
					if( strcmp( username, user->u_Name ) == 0 )
					{
						break;
					}
				}
				
				if( user == NULL )
				{
					// new user added to session
					user = l->ulib->UserGet( l->ulib, username );
					if( user != NULL )
					{
						LIST_ADD_HEAD( l->sl_Sessions, user );
					}
					else
					{
						ERROR("Cannot find user with name %s in database\n", username );
						HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"User account do not exists\"}" );
						goto error;
						//return response;
					}
				}
				
				File *rootDev = NULL;
				
				LIST_FOR_EACH( loggedUser->u_MountedDevs, rootDev )
				{
					if(  strcmp(rootDev->f_Name, devname ) == 0 )
					{
						INFO("Device for sharing found: %s\n", devname );
						break;
					}
				}
				
				
				if( user != NULL && rootDev != NULL )
				{
					DEBUG("Sharing device in progress\n");
					
					if( user->u_InitialDevMount == FALSE )
					{
						DEBUG("Devices were not mounted for user. They will be mounted now\n");
						
						MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
						UserDeviceMount( l, sqllib, user );
						l->LibraryMYSQLDrop( l, sqllib );
					}
					
					File *file = FCalloc( 1, sizeof( File ) );
					if( file != NULL )
					{
						char fileName[ 512 ];
						sprintf( fileName, "%s_%s", loggedUser->u_Name, devname );
						
						file->f_Name = StringDuplicate( fileName );	// shared name
						file->f_SharedFile = rootDev;
						file->f_User = loggedUser;		// user which is sharing device
						
						LIST_ADD_HEAD( user->u_MountedDevs, file );
						
						int err;
						if( ( err = DeviceMountDB( l, file, TRUE ) ) != 0 )
						{
							ERROR("Cannot share device, error %d\n", err );
						}
						else
						{
							INFO("Device %s shared successfully\n", devname );
						}
					}
				}
				else
				{
					ERROR("User account do not exist!Sharing device option is not possible\n");
					HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"User account do not exists\"}" );
					goto error;
					//return response;
				}

				
				 char tmp[ 100 ];
				char temptext[ 512 ];
				sprintf( tmp, "ok<!--separate-->Mouting error: %d (already mounted)\n", l->GetError( l ) );
					
				HttpAddTextContent( response, tmp );
				/*
				sprintf( temptext, "UPDATE `Filesystem` SET `Mounted` = '1' WHERE `UserID` = '%ld' AND LOWER(`Name`) = LOWER('%s')", loggedUser->u_ID, devname );
								
				MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
				MYSQL_RES *res = sqllib->Select( sqllib, temptext );
				l->LibraryMYSQLDrop( l, sqllib );
				*/
			}
			
			//
			// list mounted devices
			//
		}
		else if( strcmp( urlpath[ 1 ], "list" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			 response = HttpNewSimple(  HTTP_200_OK,  tags );
		
			if( l->ulib == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );
				//HttpWriteAndFree( response );

				goto error;
				//return response;
			}
		
			if( sessionid == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Device name or sessionID are empty\"}" );
			}
			else
			{
			
				User *logusr = l->ulib->IsSessionValid( l->ulib, sessionid );
				User *curusr = l->sl_Sessions;
				//int found = 0;
				
				DEBUG("user found, listing devices\n");
				
				while( curusr != NULL )
				{
					DEBUG("Checking user logged in list %s\n", curusr->u_Name );
					if( strcmp( curusr->u_Name, logusr->u_Name ) == 0 )		// user is logged in
					{
						//found = 1;
						break;
					}
					curusr = (User *)curusr->node.mln_Succ;
				}

				if( curusr != NULL )
				{
					File *dev = curusr->u_MountedDevs;
					BufString *bs = BufStringNew();
					BufStringAdd( bs, "{ " );
					int devnr = 0;
					char tmp[ 256 ];
					
					while( dev != NULL )
					{
						FHandler *sys = (FHandler *)dev->f_FSys;
						
						if( devnr == 0 )
						{
							sprintf( tmp, "{ \"Name\": \"%s\" , \"Path\":\"%s\" , \"FSys\":\"%s\" } \n", dev->f_Name, dev->f_Path, sys->Name );
							
						}
						else
						{
							sprintf( tmp, ", { \"Name\": \"%s\" , \"Path\":\"%s\" , \"FSys\":\"%s\" } \n", dev->f_Name, dev->f_Path, sys->Name );
						}
						BufStringAdd( bs, tmp );
						
						devnr++;
						dev = (File *)dev->node.mln_Succ;
					}
					BufStringAdd( bs, " }" );
					
					HttpAddTextContent( response, bs->bs_Buffer );
					
					BufStringDelete( bs );
				}
				else
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"User not logged in\"}" );
				}
			}
			
			//HttpWriteAndFree( response );
			result = 200;
			
		}
		else if( strcmp( urlpath[ 1 ], "listsys" ) == 0 )
		{
			
			//
			// list all filesystems
			//
			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicate( "text/html" ) },
				{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL ) ERROR("RESPONSE \n");
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			if( l->ulib == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );
				//HttpWriteAndFree( response );
				/*
				if( urlpath != NULL )
				{
					PathFree( urlpath );
					urlpath = NULL;
				}*/
				goto error;
//				return response;
			}
		
			if( sessionid == NULL )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Device name or sessionID are empty\"}" );
			}
			else
			{
			
				User *logusr = l->ulib->IsSessionValid( l->ulib, sessionid );
				User *curusr = l->sl_Sessions;
				int found = 0;
				
				DEBUG("user found, listing devices\n");
				
				while( curusr != NULL )
				{
					DEBUG("Checking user logged in list %s\n", curusr->u_Name );
					if( strcmp( curusr->u_Name, logusr->u_Name ) == 0 )		// user is logged in
					{
						found = 1;
						break;
					}
					curusr = (User *)curusr->node.mln_Succ;
				}

				if( found == 1 )
				{
					FHandler *fsys = l->sl_Filesystems;
					BufString *bs = BufStringNew();
					BufStringAdd( bs, "{ " );
					int fsysnr = 0;
					char tmp[ 256 ];
					
					while( fsys != NULL )
					{
						if( fsysnr == 0 )
						{
							sprintf( tmp, "{ \"Name\": \"%s\" } \n", fsys->Name );
							
						}
						else
						{
							sprintf( tmp, ", { \"Name\": \"%s\" } \n", fsys->Name );
						}
						BufStringAdd( bs, tmp );
						
						fsysnr++;
						fsys = (FHandler *)fsys->node.mln_Succ;
					}
					BufStringAdd( bs, " }" );
					
					HttpAddTextContent( response, bs->bs_Buffer );
					
					BufStringDelete( bs );
				}
				else
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"User not logged in\"}" );
				}
			}
			
			//HttpWriteAndFree( response );
			result = 200;
		}
		else
		{
			// TODO: This makes the system crash!
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (ULONG)StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE }
			};
			response = HttpNewSimple( HTTP_200_OK, tags );
			HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Device function do not exist\"}" );
		}
		
		//
		// FILES
		//
		
	}
	else if( strcmp( urlpath[ 0 ], "file" ) == 0 )
	{
		char *path = NULL;
		INFO("SYSTEMBASE FILE\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicateN( "text/html", 9 ) },
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicateN( "close", 5 ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) ERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( l->ulib == NULL )
		{
			DEBUG( "User library is NULL!\n" );
			HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"user.library is not opened!\"}" );

			goto error;
			//return response;
		}
		
		if( urlpath[ 1 ] == NULL )
		{
			DEBUG( "URL path is NULL!\n" );
			HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"second part of url is null!\"}" );

			goto error;
			//return response;
		}
		
		HashmapElement *el = HttpGetPOSTParameter( request, "path" );
		if( el == NULL ) el = HashmapGet( request->query, "path" );
		
		if( el != NULL )
		{
			path = (char *)el->data;
		}
		
		if( strcmp( urlpath[ 1 ], "copy" ) == 0 )
		{
			el = HttpGetPOSTParameter( request, "from" );
			if( el == NULL ) el = HashmapGet( request->query, "from" );
		
			if( el != NULL )
			{
				path = (char *)el->data;
			}
		}
		
		if( sessionid == NULL || path == NULL )
		{
			DEBUG("No session id or path %p %p\n", sessionid, path );
			HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Path or sessionID are empty\"}" );
		}
		else
		{
			
			if( loggedUser == NULL )
			{
				HttpAddTextContent( response, "fail<!--separate-->{ \"ErrorMessage\": \"User not logged in\"}" );
				
				//HttpWriteAndFree( response );
				result = 200;
				// TODO: Find out, do we need to free dbusr here? Or it leaks!
				//l->ulib->UserFree( l->ulib, dbusr );
				goto error;
			}
			
			DEBUG("Checking mounted devices\n");
			
			File *lDev = loggedUser->u_MountedDevs;
			
			DEBUG("LDEV %p\n", lDev );
			
			File *actDev = NULL;
			char devname[ 256 ];
			memset( devname, '\0', 256 );
			char *lpath = NULL;
			
			// TODO: devname is 0 in length. Why strlen it?
			if( ( lpath = FCalloc( strlen( path ) + strlen( devname ) + 10, sizeof(char) ) ) != NULL )
			{
				UrlDecode( lpath, path );
				DEBUG("original path %s\n", path );
			
				int dpos = doublePosition( lpath );
				strncpy( devname, lpath, dpos );
				devname[ dpos ] = 0;
			
				DEBUG( "Device name '%s' Logguser name %s  ---- path %s\n", devname, loggedUser->u_Name, path );
				FFree( lpath );
				lpath = NULL;
			}
			//
			
			DEBUG( "Check if device is mounted for user\n" );
			
			// Special case! System reverts to mod calls
			int specialCase = 0;
			if( strcmp( devname, "System" ) == 0 )
			{
				unsigned long int resultLength = 0;
				char *request = calloc( 1, 512 );
				sprintf( request, "module=system&command=systempath&sessionid=%s&path=%s", loggedUser->u_SessionID, path );
				
				char *returnData = RunMod( 
					SLIB, "php", "modules/system/module.php", 
					request, 
					&resultLength
				);
				
				free( request );
				
				if( returnData )
				{
					specialCase = 1;
					HttpAddTextContent( response, returnData );
					result = 200;
					DEBUG( "Ok, we added: %s\n", returnData );
					free( returnData );
				}
			}
			
			if( specialCase == 0 )
			{
				//
				// Check mounted devices for user
				actDev = GetRootDeviceByName( loggedUser, devname );
				/*
				while( lDev != NULL )
				{
					//DEBUG("Checking dev act ptr %p next ptr %p\n", lDev, lDev->node.mln_Succ ); 
					DEBUG("devname %s  ldevname %s lfile \n", devname, lDev->f_Name );
				
					if( strcmp( devname, lDev->f_Name ) == 0 )
					{
						actDev = lDev;
						DEBUG("Found file name '%s' path '%s' (%s)\n", 
							actDev->f_Name, actDev->f_Path, actDev->f_FSysName );
						break;
					}
					lDev = (File *)lDev->node.mln_Succ;
				}*/
			
			
				// TODO: Custom stuff (should probably be in the actual FS)
				// TODO: devname is 0 in length. Why strlen it?
				if( actDev != NULL )
				{
					DEBUG( "ok, next up is to see if the filesystem wants special treatment... PATH %\n" );
					if( ( lpath = FCalloc( strlen( path ) + 255, sizeof(char) ) ) != NULL )
					{
						UrlDecode( lpath, path );
		
						int dpos = doublePosition( lpath );
			
						// Local filesystem wants a unix path string
						//if( strcmp( actDev->f_FSysName, "local" ) == 0 )
						{
							strcpy( path, &lpath[ dpos + 1 ] ); // TODO: Remove this, we're not fucking with the path
						}
						DEBUG( "Local filesystem wanted this path: \'%s\'\n", path );
						FFree( lpath );
						lpath = NULL;
					}
		
					DEBUG( "File found pointer %p DEVNAME %s\n", actDev, devname );
			
					//
					// checking file commands
					//
				
					DEBUG( "Checking 3rd part from path '%s' - path '%s'\n", urlpath[ 0 ], path );
				
					//
					// INFO
					//
				
					if( strcmp( urlpath[ 1 ], "info" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG("Filesystem taken from file\n");
						BufString *resp = actFS->Info( actDev, path );
						DEBUG("info command on FSYS: %s called\n", actFS->GetPrefix() );
					
						if( resp != NULL )
						{
							HttpAddTextContent( response, resp->bs_Buffer );
						
							BufStringDelete( resp );
						}
					
						//
						// DIR
						//
					
					}
					else if( strcmp( urlpath[ 1 ], "dir" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG( "[system.library] Filesystem taken from file, doing dir on %s\n", path );
						BufString *resp = actFS->Dir( actDev, path );
						DEBUG("[system.library] info command on FSYS: %s called\n", actFS->GetPrefix() );
					
						if( resp != NULL)
						{
							if( resp->bs_Buffer )
							{
								DEBUG("Return from FS %s\n", resp->bs_Buffer );
								HttpAddTextContent( response, resp->bs_Buffer );
							}
							BufStringDelete( resp );
						}
					
						DEBUG( "There was no answer...\n" );
				
						//
						// Rename
						//
				
					}
					else if( strcmp( urlpath[ 1 ], "rename" ) == 0 )
					{
						char *nname = NULL;
						el = HttpGetPOSTParameter( request, "newname" );
						if( el == NULL ) el = HashmapGet( request->query, "newname" );
						if( el != NULL )
						{
							nname = (char *)el->data;
						}
					
						if( nname != NULL )
						{
							FHandler *actFS = (FHandler *)actDev->f_FSys;
							DEBUG("Filesystem RENAME\n");
						
							char tmp[ 100 ];
						
							int error = actFS->Rename( actDev, path, nname );
							sprintf( tmp, "ok<!--separate-->{ \"ErrorMessage\": \"%d\"}", error );
						
							DEBUG("info command on FSYS: %s RENAME\n", actFS->GetPrefix() );
					
							HttpAddTextContent( response, tmp );
						}
						else
						{
							HttpAddTextContent( response, "{ \"ErrorMessage\": \"nname parameter is missing\" }" );
						}
					
						//
						// Delete
						//
					
					}
					else if( strcmp( urlpath[ 1 ], "delete" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG("Filesystem DELETE\n");
					
						char tmp[ 100 ];
						
						int error = actFS->Delete( actDev, path );
						sprintf( tmp, "ok<!--separate-->{ \"ErrorMessage\": \"%d\"}", error );
						DEBUG("info command on FSYS: %s DELETE\n", actFS->GetPrefix() );
					
						HttpAddTextContent( response, tmp );
					
						//
						// MakeDir
						//
					
					}
					else if( strcmp( urlpath[ 1 ], "makedir" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG("Filesystem MAKEDIR\n");
					
						char tmp[ 100 ];
					
						char *lpath = UrlDecodeToMem( path );
						if( lpath != NULL )
						{
							int error = actFS->MakeDir( actDev, lpath );
							sprintf( tmp, "ok<!--separate-->{ \"ErrorMessage\": \"%d\"}", error );
							DEBUG("info command on FSYS: %s MAKEDIR\n", actFS->GetPrefix() );
					
							HttpAddTextContent( response, tmp );
						
							free( lpath );
						}
						else
						{
							HttpAddTextContent( response, "Cannot allocate memory for decoded path\n" );
						}
						//
						// Execute
						//
					
					}
					else if( strcmp( urlpath[ 1 ], "exec" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG("Filesystem EXEC\n");
						char *resp = (char *)actFS->Execute( actDev, path, NULL );	// last parameter is arguments
						DEBUG("info command on FSYS: %s EXEC\n", actFS->GetPrefix() );
					
						if( resp != NULL )
						{
							HttpAddTextContent( response, resp );
						
							free( resp );
						}
					}
				
					//
					// file read
					//
				
					else if( strcmp( urlpath[ 1 ], "read" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
					
						char *mode = NULL;
						char *offset = NULL;
						char *bytes = NULL;
					
						DEBUG("Filesystem taken from file\n");
					
						el = HttpGetPOSTParameter( request, "mode" );
						if( el == NULL ) el = HashmapGet( request->query, "mode" );
						if( el != NULL )
						{
							mode = (char *)el->data;
						}
					
						el = HttpGetPOSTParameter( request, "offset" );
						if( el == NULL ) el = HashmapGet( request->query, "offset" );
						if( el != NULL )
						{
							offset = (char *)el->data;
						}
					
						el = HttpGetPOSTParameter( request, "bytes" );
						if( el == NULL ) el = HashmapGet( request->query, "bytes" );
						if( el != NULL )
						{
							bytes = (char *)el->data;
						}
					
						if( mode != NULL && mode[0] == 'r' )
						{
							File *fp = (File *)actFS->FileOpen( actDev, path, mode );
						
							// Success?
							if( fp != NULL )
							{
								int dataread = 0;
							
								struct stringPart *head = NULL;
								struct stringPart *curr = NULL;
							
								fp->f_Raw = 0;
								if( strcmp( mode, "rb" ) == 0 )
								{
									fp->f_Raw = 1;
								}
							
								//we want to read only part of data
								#define FS_READ_BUFFER 262144
								int totalBytes = 0;
							
								if( offset != NULL && bytes != NULL )
								{
									int offsetint = atoi( offset );
									int bytesint = atoi( bytes );
								
									if( actFS->FileSeek( fp, offsetint ) != -1 )
									{
										if( !head )
										{
											head = FCalloc( 1, sizeof( struct stringPart ) );
											curr = NULL;
										}
										int readbytes = FS_READ_BUFFER;
										if( bytesint < readbytes )
										{
											readbytes = bytesint;
										}
									
										char *dataBuffer = FCalloc( readbytes, sizeof( char ) );
									
										while( ( dataread = actFS->FileRead( fp, dataBuffer, readbytes ) ) != -1 )
										{
											if( dataread == 0 ) continue;
										
											// Mind our list
											if( curr == NULL )
											{
												curr = head;
											}
											else
											{
												curr->next = FCalloc( 1, sizeof( struct stringPart ) );
												curr = curr->next;
											}
										
											// Add data
											curr->string = dataBuffer;
											dataBuffer = NULL;
										
											// Make sure we only read as much as we need
											bytesint -= dataread;
											if( bytesint > 0 ) 
											{
												break;
											}
											if( bytesint < readbytes )
											{
												readbytes = bytesint;
											}
											curr->length = readbytes;
											totalBytes += readbytes;
											dataBuffer = calloc( readbytes, sizeof( char ) );
										}
										if( dataBuffer ) free( dataBuffer );
									}
								}
								else // we want to read whole file
								{
									if( !head )
									{
										head = FCalloc( 1, sizeof( struct stringPart ) );
										curr = NULL;
									}
								
									int readbytes = FS_READ_BUFFER;
									char *dataBuffer = FCalloc( readbytes, sizeof( char ) ); 
								
									while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
									{
										if( dataread == 0 ) continue;
									
										// Mind our list
										if( curr == NULL ) curr = head;
										else
										{
											curr->next = FCalloc( 1, sizeof( struct stringPart ) );
											curr = curr->next;
										}
									
										// Add data
										curr->string = dataBuffer;
										curr->length = dataread;
										totalBytes += dataread;
									
										dataBuffer = FCalloc( readbytes, sizeof( char ) );
									}
									if( dataBuffer )
									{
										FFree( dataBuffer );
									}
							
								}	// end of reading part or whole file
							
								// Close the file
								actFS->FileClose( actDev, fp );
							
								if( head && totalBytes > 0 )
								{	
									// Combine all parts into one buffer
									curr = head;
									char *finalBuffer = FCalloc( totalBytes + 1, sizeof( char ) );
									char *outputBuf = finalBuffer;
									int offBuf = 0;
									struct stringPart *tmp = NULL;
								
									while( curr != NULL )
									{
										memcpy( finalBuffer + offBuf, curr->string, curr->length );
										free( curr->string );
										tmp = curr->next;
										offBuf += curr->length;
										free( curr );
										curr = tmp;
									}
								
									// Try to skip embedded headers
									char *ptr = strstr( finalBuffer, "---http-headers-end---\n" );
									if( ptr != NULL )
									{
										// With the diff, move offset and set correct size
										int diff = ( ptr - finalBuffer ) + 23;
										totalBytes = ( (int)finalBuffer - diff) + 1;
										outputBuf = FCalloc( totalBytes, sizeof( char ) );
										memcpy( outputBuf, ptr + 23, totalBytes );
										free( finalBuffer );
									}
								
									// Correct mime from data
									const char *mime = NULL;
									char *fallbackMime = NULL;
									if( l->sl_Magic != NULL && outputBuf != NULL )
									{
										//INFO("FILE READ BYTE %c %c %c %c\n", outputBuf[ 0 ], outputBuf[ 1 ], outputBuf[ 2 ], outputBuf[ 3 ] );
										int bytes = totalBytes;
										if( bytes > 16 ){ bytes = 16; }
										mime = magic_buffer( l->sl_Magic, outputBuf, bytes );
										DEBUG( "Ok, reading file as %s\n", mime == NULL ? "text/plain" : mime );
									}
									// Just in case!
									if( mime == NULL )
									{
										if( strstr( path, ".pdf" ) || strstr( path, ".PDF" ) )
											fallbackMime = StringDuplicate( "application/pdf" );
										else if( strstr( path, ".wav" ) || strstr( path, ".WAV" ) )
											fallbackMime = StringDuplicate( "audio/wav" );
										else if( strstr( path, ".mp3" ) || strstr( path, ".MP3" ) )
											fallbackMime = StringDuplicate( "audio/mp3" );
										else if( strstr( path, ".ogg" ) || strstr( path, ".OGG" ) )
											fallbackMime = StringDuplicate( "audio/ogg" );
										else if( strstr( path, ".ogv" ) || strstr( path, ".OGV" ) )
											fallbackMime = StringDuplicate( "video/ogg" );
										else if( strstr( path, ".jpg" ) || strstr( path, ".JPG" ) )
											fallbackMime = StringDuplicate( "image/jpeg" );
										else if( strstr( path, ".jpeg" ) || strstr( path, ".JPEG" ) )
											fallbackMime = StringDuplicate( "image/jpeg" );
										else if( strstr( path, ".avi" ) || strstr( path, ".AVI" ) )
											fallbackMime = StringDuplicate( "video/avi" );
										else if( strstr( path, ".mp4" ) || strstr( path, ".MP4" ) )
											fallbackMime = StringDuplicate( "video/mp4" );
										else if( strstr( path, ".mov" ) || strstr( path, ".MOV" ) )
											fallbackMime = StringDuplicate( "video/quicktime" );
										else if( strstr( path, ".wmv" ) || strstr( path, ".WMV" ) )
											fallbackMime = StringDuplicate( "video/ms-video" );
										else if( strstr( path, ".html" ) || strstr( path, ".HTML" ) )
											fallbackMime = StringDuplicate( "text/html" );
										else
											fallbackMime = StringDuplicate( "text/plain" );
									}
								
									HttpFree( response );
									response = NULL;
								
									struct TagItem tags[] = {
										{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  (fallbackMime ?  fallbackMime: StringDuplicate( mime )) },
										{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
										{TAG_DONE, TAG_DONE}
									};
		
									if( response != NULL ) ERROR("RESPONSE \n");
									response = HttpNewSimple( HTTP_200_OK,  tags );
									/*
									// Free the fallback
									if( fallbackMime ) 
									{
										free( fallbackMime );
										fallbackMime = NULL;
									}*/
								
									INFO("READ RETURN BYTES %d  - %s\n", totalBytes, mime );
									HttpSetContent( response, outputBuf, totalBytes );
								}
								else
								{
									HttpAddTextContent( response, "fail<!--separate-->{ \"ErrorMessage\": \"nCannot allocate memory for File\" }" );
								}
							}
							else
							{
								HttpAddTextContent( response, "fail<!--separate-->{ \"ErrorMessage\": \"nCannot open file\" }" );
							}
						
							DEBUG("Open command on FSYS: %s called\n", actFS->GetPrefix() );
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{ \"ErrorMessage\": \"nmode parameter is missing\" }" );
						}
				
					}
				
					//
					// file write
					//
				
					else if( strcmp( urlpath[ 1 ], "write" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						char *mode = NULL;
						char *fdata = NULL;
					
						el = HashmapGet( request->parsedPostContent, "mode" );
						if( el == NULL ) el = HashmapGet( request->query, "mode" );
						if( el != NULL )
						{
							mode = (char *)el->data;
						}
					
						el =  HashmapGet( request->parsedPostContent, "data" );
						if( el == NULL ) el = HashmapGet( request->query, "data" );
						if( el != NULL )
						{
							fdata = (char *)el->data;
						}
					
						// Urldecode if need 
						el = HashmapGet( request->parsedPostContent, "encoding" );
						int flength = 0;
						if( !el ) el = HashmapGet( request->query, "encoding" );
						if( el && strcmp( el->data, "url" ) == 0 )
						{
							char *destf = calloc( strlen( fdata ) + 1, sizeof( char ) );
							int l = UrlDecode( destf, fdata );
							fdata = destf;
						}
						// TODO: Test UNSTABLE CODE
						/*// Base64 instead
						else if( el && strcmp( el->data, "base64" ) == 0 )
						{
							fdata = Base64Decode( fdata, strlen( fdata ), &flength );
						}
						int dataSize = flength > 0 ? flength : strlen( fdata );
						*/
						int dataSize = strlen( fdata );
					
						if( mode != NULL && fdata != NULL )
						{
							char tmp[ 100 ];
						
							File *fp = (File *)actFS->FileOpen( actDev, path, mode );
						
							if( fp != NULL )
							{
								int size = actFS->FileWrite( fp, fdata, dataSize );
								if( size > 0 )
								{
									sprintf( tmp, "ok<!--separate-->{ \"FileDataStored\" : \"%d\" } ", size );
									HttpAddTextContent( response, tmp );
								}
								else
								{
									HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"nCannot allocate memory for File\" }" );
								}
								actFS->FileClose( actDev, fp );
							}
							else
							{
								HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"nCannot open file\" }" );
							}
						
							DEBUG("Open command on FSYS: %s called\n", actFS->GetPrefix() );
						}
						else
						{
							HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"nmode parameter is missing\" }" );
						}
				
						//
						// copy
						//
				
					}
					else if( strcmp( urlpath[ 1 ], "copy" ) == 0 )
					{
						char *topath = NULL;
						el = HashmapGet( request->parsedPostContent, "to" );
						if( el == NULL ) el = HashmapGet( request->query, "to" );
						if( el != NULL )
						{
							topath = (char *)el->data;
						
							char *tpath;
							if( ( tpath = calloc( strlen( topath ) + 10 + 256, sizeof(char) ) ) != NULL )
							{
								UrlDecode( tpath, topath );
								strcpy( topath, tpath );
								free( tpath );
							}
						
							INFO("COPY!\n");

							FHandler *dsthand;
							char *srcpath, *dstpath;
					
							File *copyFile;
					
							//srchand = GetHandlerByPath( dbusr, &dstpath, path );
							DEBUG( "Getting file by path: %s\n", path );
							File *dstrootf = GetFileByPath( loggedUser, &dstpath, topath );

							DEBUG("COPY from %s TO %s\n", path, topath );
						
							if( dstrootf != NULL )
							{
								dsthand = dstrootf->f_FSys;
								FHandler *actFS = (FHandler *)actDev->f_FSys;
							
								int rsize = 0;
							
								DEBUG("COPY from %s TO %s 1\n", path, topath );
							
								if( dstpath[ strlen( dstpath ) - 1 ] != '/' )	// simple copy file
								{
									File *rfp = (File *)actFS->FileOpen( actDev, path, "rb" );
									File *wfp = (File *)dsthand->FileOpen( dstrootf, dstpath, "w+" );
									if( rfp != NULL && wfp != NULL )
									{
										// Using a big buffer!
										char dataBuffer[ 524288 ];
										int dataread = 0, written = 0;
										char *bs = calloc( 524289, sizeof( char ) );

										while( ( dataread = actFS->FileRead( rfp, dataBuffer, 524288 ) ) > 0 )
										{
											if( dataread > 0 )
											{
												written += dsthand->FileWrite( wfp, dataBuffer, dataread );
											}
										}
								
										// Free up temp buffer
										free( bs );
								
										DEBUG( "Wrote %d bytes.\n", written );
										DEBUG("File Opened\n");
								
									}
									else
									{
										DEBUG( "We could not do anything with the bad file pointers..\n" );
									}
									if( rfp )
									{
										actFS->FileClose( actDev, rfp );
									}
									if( wfp )
									{
										dsthand->FileClose( dstrootf, wfp );
									}
								}
								else		// make directory
								{
									FHandler *dsthand = (FHandler *)dstrootf->f_FSys;
									DEBUG("Filesystem MAKEDIR (%s)\n", topath);
					
									char tmp[ 100 ];
					
									int error = dsthand->MakeDir( dstrootf, topath );
									sprintf( tmp, "ok<!--separate-->{ \"ErrorMessage\": \"%d\"}", error );
									DEBUG("info command on FSYS: %s MAKEDIR\n", dsthand->GetPrefix() );
					
									HttpAddTextContent( response, tmp );
								}
							}
						}
					}	// "file" copy
				
					//
					// file upload
					//
				
					else if( strcmp( urlpath[ 1 ], "upload" ) == 0 )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
					
						INFO("Uploading file\n");
						int uploadedFiles = 0;
						char *tmpPath;
						if( path == NULL )
						{
							ERROR("PATH == NULL\n");
						}
						if( ( tmpPath = (char *) calloc( strlen(path)+2048, sizeof(char) ) ) != NULL )
						{
							HttpFile *file = request->h_FileList;
							while( file != NULL )
							{
								sprintf( tmpPath, "%s%s", path, file->hf_FileName );
								DEBUG("Trying to save file %s\n", tmpPath );
						
								File *fp = (File *)actFS->FileOpen( actDev, tmpPath, "wb" );
								if( fp != NULL )
								{
									actFS->FileWrite( fp, file->hf_Data, file->hf_FileSize );
									actFS->FileClose( actDev, fp );
								
									uploadedFiles++;
								}
								else
								{
									ERROR("Cannot open file to store %s\n", path );
								}
						
								file = (HttpFile *) file->node.mln_Succ;
							} // while, goging through files
						
							DEBUG("Free path\n");
							free( tmpPath );
						}
						else
						{
							ERROR("Cannot allocate memory for path buffer\n");
						}
						
						{
							char tmp[ 1024 ];
						
							sprintf( tmp, "ok<!--separate-->{ \"Uploaded files\": \"%d\"}", uploadedFiles );
					
							HttpAddTextContent( response, tmp );
							result = 200;
						}
						DEBUG("Upload done\n");
					}		// file/upload
				
					else
					{
						DEBUG("NOT MOUNTED!\n");
						HttpAddTextContent( response, "fail<!--separate-->{ \"ErrorMessage\": \"Device not mounted\" }" );
					}
				}
			}
		}
		
		//HttpWriteAndFree( response );
		result = 200;
		
		
		//DEBUG("==================================\n\n\n\n\n");
	}
	
	//
	// admin stuff
	//
	
	else if( strcmp( urlpath[ 0 ], "admin" ) == 0 )
	{
		char *path = NULL;
		DEBUG("ADMIN\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (ULONG)  StringDuplicateN( "text/html", 9 ) },
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicateN( "close", 5 ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) ERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( urlpath[ 1 ] == NULL )
		{
			DEBUG( "URL path is NULL!\n" );
			HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"second part of url is null!\"}" );

			goto error;
			//return response;
		}
		
		if( strcmp( urlpath[ 1 ], "info" ) == 0 )
		{
			BufString *bs = NULL;
			
			FriendCoreManager *fcm = (FriendCoreManager *) l->fcm;
			bs = FriendCoreInfoGet( fcm->fcm_FCI );
			
			if( bs != NULL )
			{
				HttpAddTextContent( response, bs->bs_Buffer );			
				result = 200;
				
				BufStringDelete( bs );
			}
			else
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"Cannot get information from FriendCoreInfo!\"}" );
			}
		}
	}
	
	//
	// atm we want to handle all calls to services via system.library
	//
	
	else if( strcmp( urlpath[ 0 ], "services" ) == 0 )
	{
		response =  ServiceManagerWebRequest( l->fcm, &(urlpath[1]), request );
	}
	
	//
	// handle application calls
	//
	
	else if( strcmp(  urlpath[ 0 ], "app" ) == 0 )
	{
		DEBUG("Appcall Systemlibptr %p applibptr %p\n", l, l->alib );
		response = l->alib->AppWebRequest( l->alib, &(urlpath[ 1 ]), request );
	}
	
	//
	// handle image calls
	//
	
	else if( strcmp(  urlpath[ 0 ], "image" ) == 0 )
	{
		DEBUG("Image calls Systemlibptr %p imagelib %p\n", l, l->ilib );
		response = l->ilib->WebRequest( l->ilib, loggedUser , &(urlpath[ 1 ]), request );
	}
	
	//
	// clear cache
	//
	
	else if( strcmp(  urlpath[ 0 ], "clearcache" ) == 0 )
	{
		DEBUG("Clear cache\n", l, l->ilib );
		CacheManagerClearCache( l->cm );
	}
	
	//
	// error
	//
	
	else	// if file, services, etc.
	{
		ERROR("Function not found %s\n", urlpath[ 0 ] );
		
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) ERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
		HttpAddTextContent( response, "ok<!--separate-->{ \"ErrorMessage\": \"nFunction not found\" }" );
	
		goto error;
	}
	
	if( loggedUser )
	{
		DEBUG("WebRequest end OK result: %d  loggeduser %p\n", result, loggedUser );
		if( l->sl_Sessions )
		{
			//INFO("USER %s SESSIONS %p\n", loggedUser->u_Name, l->sl_Sessions );
		}
		else
		{
			//INFO( "USER %s HAS NO SESSION ANYMORE!!!\n", loggedUser->u_Name );
		}
	}
	
	// Ok, we will handle this one!
	if( result == 404 )
	{
		DEBUG( "Closing socket with Http404!!" );
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (ULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};	
		
		if( response != NULL ) ERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
		//HttpWriteAndFree( response );
	}
	DEBUG("Response pointer %p\n", response );
	if( userAdded == FALSE && loggedUser != NULL )
	//if( loggedUser != NULL )
	{
		//UserLibrary *ulib = l->LibraryUserGet( l );
		//ulib->UserFree( loggedUser );
		//loggedUser = NULL;
	}
	
	return response;
	
error:
	
	DEBUG("WebRequest end ERROR\n");
	if( userAdded == FALSE && loggedUser != NULL )
	//if( loggedUser != NULL )
	{
		//UserLibrary *ulib = l->LibraryUserGet( l );
		//ulib->UserFree( loggedUser );
		//loggedUser = NULL;
	}
	
	return response;
}


//
// get error
//

int GetError( struct SystemBase *l )
{
	int tmp = l->sl_Error;
	l->sl_Error = 0;
	return tmp;
}


//
// Open Library
//

struct UserLibrary *LibraryUserGet( struct SystemBase *l )
{
	if( l->UserLibCounter == 0 )
	{
		DEBUG("Trying to open user.library, base ptr %p!\n", l );
		
		l->ulib = (struct UserLibrary *)LibraryOpen( l, "user.library", 0 );
		if( l->ulib == NULL )
		{
			DEBUG("[ERROR]: CANNOT OPEN USER.library!\n");
			return NULL;
		}
		l->UserLibCounter++;
	}
	DEBUG( "What's up doc?\n" );
	DEBUG( "User.library opened %d!\n", l->UserLibCounter );
	return l->ulib;
}

//
// Close Library
//

void LibraryUserDrop( struct SystemBase *l, UserLibrary *uclose )
{
	if( l->UserLibCounter > 0 )
	{
		l->UserLibCounter--;
	}
	else
	{
		LibraryClose( (struct Library *)l->ulib );
	}
}	


//
// Open Library
//

struct MYSQLLibrary *LibraryMYSQLGet( struct SystemBase *l )
{
	struct MYSQLLibrary *retlib = NULL;
	int i ;
	int timer = 0;
	int retries = 0;
	
	while( TRUE )
	{
		if( l->sqlpool[ l->MsqLlibCounter ].inUse == FALSE )
		{
			retlib = l->sqlpool[l->MsqLlibCounter ].sqllib;
			l->sqlpool[ l->MsqLlibCounter ].inUse = TRUE;
			 
			//INFO( "We found mysql library on slot %d ---------->>\n", l->MsqLlibCounter );
			
			l->MsqLlibCounter++;
			if( l->MsqLlibCounter >= SQLLIB_POOL_NUMBER ) l->MsqLlibCounter = 0;
			break;
		}
		
		timer++;
		if( timer >= SQLLIB_POOL_NUMBER )
		{
			timer = 0;
			usleep( 10000 );
		}
		
		l->MsqLlibCounter++;
		if( l->MsqLlibCounter >= SQLLIB_POOL_NUMBER )
		{
			l->MsqLlibCounter = 0;
			retries = 0;
		}
		
		//DEBUG( "Still trying (%d)!\n", retries++ );
		if( retries >= SQLLIB_POOL_NUMBER )
		{
			DEBUG( "PANIC PANIC PANIC! CRASH CRASH CRASH! OUT OF SLOTS! SOME CODE DOES NOT DROP THE SQL LIB! USE LUBE ON BRAIN!\n" );
		}
	}
	
	return retlib;
}

//
// Close Library
//

void LibraryMYSQLDrop( struct SystemBase *l, MYSQLLibrary *mclose )
{
	int i = 0;
	int closed = -1;
	
	
	for( ; i < SQLLIB_POOL_NUMBER ; i++ )
	{
		if( l->sqlpool[ i ].sqllib == mclose )
		{
			l->sqlpool[ i ].inUse = FALSE;
			closed = i;
			//break;
		}
		if( l->sqlpool[ i ].inUse != FALSE )
		{
			DEBUG( "Mysql slot %d is still in use\n", i );
		}
	}
	
	if( closed != -1 )
	{
		//INFO( "We closed mysql slot %d ------------------------------------------- <\n", closed );
	}
	 
	
	/*if( l->MsqLlibCounter > 0 )
	{
		l->MsqLlibCounter--;
	}
	else
	{
		LibraryClose( (struct Library *)l->sqllib );
	}*/
}

//
// Open Library
//

struct ApplicationLibrary *LibraryApplicationGet( struct SystemBase *l )
{
	if( l->AppLibCounter == 0 )
	{
		DEBUG("Trying to open application.library!\n");
		
		l->alib = (struct ApplicationLibrary *)LibraryOpen( l, "application.library", 0 );
		if( l->alib == NULL )
		{
			DEBUG("[ERROR]: CANNOT OPEN application.library!\n");
			return NULL;
		}
	}
	l->AppLibCounter++;
	DEBUG("application.library opened %p!\n", l->alib );
	
	return l->alib;
}

//
// Close Library
//

void LibraryApplicationDrop( struct SystemBase *l, ApplicationLibrary *aclose )
{
	if( l->AppLibCounter > 0 )
	{
		l->AppLibCounter--;
	}
	else
	{
		LibraryClose( (struct Library *)l->alib );
	}
}

//
// Open Library
//

struct PropertiesLibrary *LibraryPropertiesGet( struct SystemBase *l )
{
	if( l->PropLibCounter == 0 )
	{
		DEBUG("Trying to open properties.library!\n");
		
		l->plib = (struct PropertiesLibrary *)LibraryOpen( l, "properties.library", 0 );
		if( l->plib == NULL )
		{
			DEBUG("[ERROR]: CANNOT OPEN properties.library!\n");
			return NULL;
		}
		DEBUG("properties.library opened %p (count %d)!\n", l->plib, l->PropLibCounter );
		
		// We start on 1, just so that we leave one open until quitting (will be
		// closed when system deinits..)
		l->PropLibCounter = 1;
	}
	l->PropLibCounter++;
	
	DEBUG( "properties.library gotten (already open) %d!\n", l->PropLibCounter );	
	return l->plib;
}

//
// Close Library
//

void LibraryPropertiesDrop( struct SystemBase *l, PropertiesLibrary *pclose )
{
	if( l->PropLibCounter > 0 )
	{
		l->PropLibCounter--;
	}
	else if ( l->PropLibCounter == 0 )
	{
		DEBUG( "Finally close properties.library\n" );
		LibraryClose( (struct Library *)l->plib );
		l->plib = NULL;
	}
	DEBUG( "properties.library - we have %d instances.\n", l->PropLibCounter );
}


//
// Open Library
//

struct ZLibrary *LibraryZGet( SystemBase *l )
{
	if( l->ZLibCounter == 0 )
	{
		DEBUG("Trying to open z.library!\n");
		
		l->zlib = (struct ZLibrary *)LibraryOpen( l, "z.library", 0 );
		if( l->zlib == NULL )
		{
			DEBUG("[ERROR]: CANNOT OPEN z.library!\n");
			return NULL;
		}
		l->ZLibCounter++;
	}
	DEBUG("z.library opened %p!\n", l->zlib );
	
	return l->zlib;
}

//
// Close Library
//

void LibraryZDrop( SystemBase *l, ZLibrary *closelib )
{
	if( l->ZLibCounter > 0 )
	{
		l->ZLibCounter--;
	}
	else
	{
		LibraryClose( (struct Library *)l->zlib );
	}
}

//
// Open Library
//

struct ImageLibrary *LibraryImageGet( SystemBase *l )
{
	if( l->ImageLibCounter == 0 )
	{
		DEBUG("Trying to open image.library!\n");
		
		l->ilib = (struct ImageLibrary *)LibraryOpen( l, "image.library", 0 );
		if( l->ilib == NULL )
		{
			DEBUG("[ERROR]: CANNOT OPEN image.library!\n");
			return NULL;
		}
		l->ImageLibCounter++;
	}
	DEBUG("image.library opened %p!\n", l->ilib );
	
	return l->ilib;
}

//
// Close Library
//

void LibraryImageDrop( SystemBase *l, ImageLibrary *closelib )
{
	if( l->ImageLibCounter > 0 )
	{
		l->ImageLibCounter--;
	}
	else
	{
		LibraryClose( (struct Library *)l->ilib );
	}
}

//
// send message to user websockets
//

#ifdef ENABLE_WEBSOCKETS

int WebSocketSendMessage( struct SystemBase *l, User *user, char *msg, int len )
{
	unsigned char *buf;
	
	buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len +LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
	if( buf != NULL )
	{
		memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, msg,  len );
		
		DEBUG("Writing to websockets, string %s size %d\n",msg, len );

		WebsocketClient *wsc = user->u_WSConnections;
		while( wsc != NULL )
		{
			int n = libwebsocket_write( wsc->wc_Wsi , buf + LWS_SEND_BUFFER_PRE_PADDING , len, LWS_WRITE_TEXT);
			wsc = (WebsocketClient *)wsc->node.mln_Succ;
		}
		
		FFree( buf );
	}
	else
	{
		ERROR("Cannot allocate memory for message\n");
		return 1;
	}
	
	return 0;
}

//
// add websocket connection for user
//

int AddWebSocketConnection(  struct SystemBase *l, struct libwebsocket *wsi, const char *sessionid )
{
	User *actUser = NULL;
	User *usr = l->sl_Sessions;
	while( usr != NULL )
	{
		if( strcmp( usr->u_SessionID, sessionid ) == 0 )
		{
			actUser = usr;
		}
		usr = (User *) usr->node.mln_Succ;
	}
	
	if( actUser == NULL )
	{
		ERROR("Cannot find user in session with sessionid %s\n", sessionid );
		return -1;
	}
	
	BOOL found = FALSE;
	WebsocketClient *listEntry = actUser->u_WSConnections;
	while( listEntry != NULL )
	{
		if( listEntry->wc_Wsi == wsi )
		{
			found = TRUE;
		}
		listEntry = (WebsocketClient *)listEntry->node.mln_Succ;
	}
	
	if( found == TRUE )
	{
		INFO("User already have this websocket connection\n");
		return 1;
	}
	
	WebsocketClient *nwsc = FCalloc( 1, sizeof( WebsocketClient ) );
	if( nwsc != NULL )
	{
		nwsc->wc_Wsi = wsi;
		nwsc->node.mln_Succ = (MinNode *)actUser->u_WSConnections;
		actUser->u_WSConnections = nwsc;
		INFO("WebSocket connection set for user %s\n", actUser->u_Name );
	}
	else
	{
		ERROR("Cannot allocate memory for WebsocketClient\n");
		return 2;
	}
	return 0;
}

#endif

