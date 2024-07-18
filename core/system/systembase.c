/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file systembase.c
 * 
 *  Systembase functionality
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

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
#include <system/services/service_manager.h>
#include <interface/properties_interface.h>
#include <ctype.h>
#include <magic.h>
#include "web_util.h"
#include <network/user_session_websocket.h>
#include <system/fsys/device_handling.h>
#include <core/functions.h>
#include <util/md5.h>
#include <network/digcalc.h>
#include <network/mime.h>
#include <libwebsockets.h>
#include <system/fsys/door_notification.h>
#include <communication/comm_service.h>
#include <communication/comm_service_remote.h>
#include <libxml2/libxml/tree.h>
#include <libxml2/libxml/parser.h>
#include <hardware/network.h>
#include <libxml2/libxml/xmlversion.h>
#include <unistd.h>
#include <mobile_app/notifications_sink_websocket.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <security/server_checker.h>
#include <network/websocket_client.h>
#include <network/protocol_websocket.h>
#include <util/session_id.h>
#include <db/autoupdate.h>

#define LIB_NAME "system.library"
#define LIB_VERSION 		1
#define LIB_REVISION		0
#define CONFIG_DIRECTORY	"cfg/"

#define MINS1 60
#define MINS5 300
#define MINS6 460
#define MINS30 1800
#define MINS60 MINS6*10
#define MINS360 6*MINS60
#define HOUR12 12*MINS60
#define DAYS1 24*MINS60
#define DAYS5 5*24*MINS60

//#define USE_WORKERS

//
// global structure
//

extern struct SystemBase *SLIB;

//
// definitions
//

DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, const char *name );

void DOSDriverDelete( DOSDriver *ddrive );

void SystemClose( struct SystemBase *l );

Http *SysWebRequest( struct SystemBase *l, char **urlpath, Http **request, UserSession *loggedSession, int *result );

void RemoveOldLogs( SystemBase *l );

FBOOL skipDBUpdate = FALSE;

int globalFriendCorePort = 0;

// internal

void handle_sigchld( int sig )
{
	int saved_errno = errno;
	DEBUG("SIGCHLD handled!\n");
	while( waitpid( (pid_t)(-1), 0, WNOHANG) > 0 ){ }
	errno = saved_errno;
}

/**
 * SystemBase init function
 *
 * @return pointer to SystemBase
 */

SystemBase *SystemInit( FBOOL skipDBupdParam )
{
	//char *tmp = "{\"type\":\"authenticate\",\"data\":{\"serviceKey\":\"qwerty123456789\",\"serviceName\":\"presence\"}}";
	//int size = strlen ( tmp );
	//ProcessIncomingRequest( NULL, tmp, size, NULL );
	
	//socket_init_once();

	struct SystemBase *l = NULL;
	char *tempString = FCalloc( PATH_MAX, sizeof(char) );
	Log( FLOG_INFO,  "SystemBase Init\n");
	
	mkdir( DEFAULT_TMP_DIRECTORY, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
	
	if( ( l = FCalloc( 1, sizeof( struct SystemBase ) ) ) == NULL )
	{
		FFree( tempString );
		return NULL;
	}
	
	// init socket interfaces
	
	l->l_SocketISSL.SocketListen = SocketListen;
	l->l_SocketISSL.SocketConnect = SocketConnectSSL;
	l->l_SocketISSL.SocketAccept = SocketAcceptSSL;
	l->l_SocketISSL.SocketAcceptPair = SocketAcceptPairSSL;
	l->l_SocketISSL.SocketSetBlocking = SocketSetBlocking;
	l->l_SocketISSL.SocketRead = SocketReadSSL;
	l->l_SocketISSL.SocketReadBlocked = SocketReadBlockedSSL;
	l->l_SocketISSL.SocketWaitRead = SocketWaitReadSSL;
	l->l_SocketISSL.SocketReadTillEnd = SocketReadTillEndSSL;
	l->l_SocketISSL.SocketWrite = SocketWriteSSL;
	l->l_SocketISSL.SocketWriteCompression = SocketWriteCompressionSSL;
	l->l_SocketISSL.SocketDelete = SocketDeleteSSL;
	l->l_SocketISSL.SocketReadPackage = SocketReadPackageSSL;

	l->l_SocketINOSSL.SocketListen = SocketListen;
	l->l_SocketINOSSL.SocketConnect = SocketConnectNOSSL;
	l->l_SocketINOSSL.SocketAccept = SocketAcceptNOSSL;
	l->l_SocketINOSSL.SocketAcceptPair = SocketAcceptPairNOSSL;
	l->l_SocketINOSSL.SocketSetBlocking = SocketSetBlocking;
	l->l_SocketINOSSL.SocketRead = SocketReadNOSSL;
	l->l_SocketINOSSL.SocketReadBlocked = SocketReadBlockedNOSSL;
	l->l_SocketINOSSL.SocketWaitRead = SocketWaitReadNOSSL;
	l->l_SocketINOSSL.SocketReadTillEnd = SocketReadTillEndNOSSL;
	l->l_SocketINOSSL.SocketWrite = SocketWriteNOSSL;
	l->l_SocketINOSSL.SocketWriteCompression = SocketWriteCompressionNOSSL;
	l->l_SocketINOSSL.SocketDelete = SocketDeleteNOSSL;
	l->l_SocketINOSSL.SocketReadPackage = SocketReadPackageNOSSL;

	// uptime
	l->l_UptimeStart = time( NULL );
	
	PropertiesInterfaceInit( &(l->sl_PropertiesInterface) );
	
	UtilInterfaceInit( &(l->sl_UtilInterface) );
	
	LIBXML_TEST_VERSION;
	
	l->sl_RemoveSessionsAfterTime = 10800;
	
	//
	// sl_Autotask
	//
	
	struct dirent *asdir;
	
	l->sl_AutotaskPath = FCalloc( PATH_MAX, sizeof(char) );
	if( l->sl_AutotaskPath != NULL )
	{
		Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
		Log( FLOG_INFO, "[SystemBase] Starting autoscripts\n");
		Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
		
		// internal
/*
		struct sigaction sa;
		sa.sa_handler = &handle_sigchld;
		sigemptyset(&sa.sa_mask);
		sa.sa_flags = SA_RESTART | SA_NOCLDSTOP;
		if( sigaction(SIGCHLD, &sa, 0) == -1 )
		{
			perror(0);
		}
		*/
		
		if( getcwd( l->sl_AutotaskPath, PATH_MAX ) == NULL )
		{
			Log( FLOG_ERROR, "[SystemInit] getcwd failed!");
			exit(5);
		}
		strcat( l->sl_AutotaskPath, "/autostart/");

		DIR *asd = opendir( l->sl_AutotaskPath );
	 
		if( asd != NULL )
		{
			while( ( asdir = readdir( asd ) ) != NULL )
			{
				if( asdir->d_name[0] == '.' ) continue;
				Log( FLOG_INFO,  "[SystemBase] Reading autostart scripts:  %s\n", asdir->d_name );
			
				snprintf( tempString, PATH_MAX, "%s%s", l->sl_AutotaskPath, asdir->d_name );
				
				Autotask *loctask = AutotaskNew( "/bin/bash", tempString );
				if( loctask != NULL )
				{
					loctask->node.mln_Succ = (MinNode *)l->sl_Autotasks;
					l->sl_Autotasks = loctask;
				}
			}
			closedir( asd );
		}
		
		Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
		Log( FLOG_INFO, "[SystemBase] Starting autoscripts END\n");
		Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	}
	
	SLIB = l;
	
	// init libraries
	
	l->UserLibCounter = 0;
	l->MsqLlibCounter = 0;
	l->AppLibCounter = 0;
	l->PropLibCounter = 0;
	l->ZLibCounter = 0;

	l->sl_AvailableModules = CreateList();
	l->sl_AvailableModules->l_Data = NULL;
	
	// Set mutex
	pthread_mutex_init( &l->sl_InternalMutex, NULL );
	pthread_mutex_init( &l->sl_ResourceMutex, NULL );

	if( getcwd( tempString, PATH_MAX ) == NULL )
	{
		FFree( tempString );
		Log( FLOG_ERROR, "[SystemInit] getcwd failed!");
		exit(5);
	}
	l->handle = dlopen( 0, RTLD_LAZY );
	
	l->SystemClose = SystemClose;

	l->SysWebRequest = SysWebRequest;

	// execute.library structure
	l->RunMod = RunMod;
	l->StreamMod = StreamMod;
	l->MountFS = MountFS;
	l->UnMountFS = UnMountFS;

	l->AuthModuleGet = AuthModuleGet;
	l->AuthModuleDrop = AuthModuleDrop;
	l->LibrarySQLGet = LibrarySQLGet;
	l->LibrarySQLDrop = LibrarySQLDrop;
	l->LibraryApplicationGet = LibraryApplicationGet;
	l->LibraryApplicationDrop = LibraryApplicationDrop;
	l->LibraryZGet = LibraryZGet;
	l->LibraryZDrop = LibraryZDrop;
	l->LibraryImageGet = LibraryImageGet;
	l->LibraryImageDrop = LibraryImageDrop;
	l->UserSessionWebsocketWrite = UserSessionWebsocketWrite;
	l->WebSocketSendMessageInt = WebSocketSendMessageInt;
	l->WebsocketWrite = UserSessionWebsocketWrite;
	l->SendProcessMessage = SendProcessMessage;
	l->GetRootDeviceByName = GetRootDeviceByName;
	l->SystemInitExternal = SystemInitExternal;
	l->GetSentinelUser = GetSentinelUser;
	l->UserDeviceMount = UserDeviceMount;
	l->UserDeviceUnMount = UserDeviceUnMount;
	l->GetError = GetError;
	l->Log = Log;
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Reading configuration\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	// open mysql.library
	
	char *host = "localhost";
	char *login = "root";
	char *pass = "root";
	char *dbname = "FriendMaster";
	int port = 3306;
	char *options = NULL;
	l->sqlpoolConnections = DEFAULT_SQLLIB_POOL_NUMBER;
	Props *prop = NULL;

	// Get a copy of the properties.library
	//struct PropertiesLibrary *plib = ( struct PropertiesLibrary *)l->LibraryPropertiesGet( l );
	PropertiesInterface *plib = &(l->sl_PropertiesInterface);
	
	if( l->sl_ActiveModuleName )
	{
		FFree( l->sl_ActiveModuleName );
	}
	l->sl_ActiveModuleName = StringDuplicate( "fcdb.authmod" );
	l->sl_CacheFiles = TRUE;
	l->sl_UnMountDevicesInDB =TRUE;
	l->sl_SocketTimeout = 10000;
	l->sl_WorkersNumber = WORKERS_MAX;
	l->sl_USFCacheMax = 102400000;
	l->sl_DefaultDBLib = StringDuplicate("mysql.library");
	l->sl_XFrameOption = NULL;
	l->l_EnableHTTPChecker = 0;
	
	strcpy( l->RSA_CLIENT_KEY_PEM, "/home/stefkos/development/friendup/build/testkeys/client.pem" );
	l->RSA_CLIENT_KEY_PEM[ 0 ] = 0;
	
	l->sl_RemoveOldSessionTimeout = 0;
	
	// use deflate compression as default for http calls
	l->l_HttpCompressionContent |= HTTP_COMPRESSION_DEFLATE;
	
	l->l_UpdateLoggedTimeOnUserMax = 10;
	
	if( plib != NULL && plib->Open != NULL )
	{
		char *ptr = getenv("FRIEND_HOME");
		char *path = FCalloc( 1024, sizeof( char ) );
		
		if( ptr != NULL )
		{
			snprintf( path, 1024, "%scfg/cfg.ini", ptr );
		}
		
		DEBUG( "[SystemBase] Opening config file: %s\n", path );
		
		sprintf( l->RSA_SERVER_CERT, "%s/crt/certificate.pem", ptr );
		sprintf( l->RSA_SERVER_KEY, "%s/crt/key.pem", ptr );
		sprintf( l->RSA_SERVER_CA_CERT, "%s/crt/certificate.pem", ptr );
		sprintf( l->RSA_SERVER_CA_PATH, "%s/crt/", ptr );
		
		prop = plib->Open( path );
		FFree( path );
		
		if( prop != NULL)
		{
			char *skipUpdate = plib->ReadStringNCS( prop, "Core:skipDBUpdate", "false" );
			if( skipUpdate != NULL )
			{
				if( strcmp( skipUpdate, "true" ) == 0 )
				{
					skipDBUpdate = TRUE;
				}
			}
			char *tmp = plib->ReadStringNCS( prop, "core:DBLib", "mysql.library" );
			if( tmp != NULL )
			{
				if( l->sl_DefaultDBLib != NULL ){ FFree( l->sl_DefaultDBLib ); }
				l->sl_DefaultDBLib = StringDuplicate( tmp );
			}
			
			DEBUG("[SystemBase] reading login\n");
			login = plib->ReadStringNCS( prop, "databaseuser:login", "root" );
			DEBUG("[SystemBase] user %s\n", login );
			pass = plib->ReadStringNCS( prop, "databaseuser:password", "root" );
			DEBUG("[SystemBase] password %s\n", pass );
			host = plib->ReadStringNCS( prop, "databaseuser:host", "localhost" );
			DEBUG("[SystemBase] host %s\n", host );
			dbname = plib->ReadStringNCS( prop, "databaseuser:dbname", "FriendMaster" );
			DEBUG("[SystemBase] dbname %s\n",dbname );
			port = plib->ReadIntNCS( prop, "databaseuser:port", 3306 );
			DEBUG("[SystemBase] port read %d\n", port );
			l->sqlpoolConnections = plib->ReadIntNCS( prop, "databaseuser:connections", DEFAULT_SQLLIB_POOL_NUMBER );
			DEBUG("[SystemBase] connections read %d\n", l->sqlpoolConnections );
			options = plib->ReadStringNCS( prop, "databaseuser:options", NULL );
			DEBUG("[SystemBase] options %s\n",options );
			
			l->sl_RemoveOldSessionTimeout = plib->ReadIntNCS( prop, "user:timeout", MINS60 );
			
			l->sl_CacheFiles = plib->ReadIntNCS( prop, "Options:CacheFiles", 1 );
			l->sl_UnMountDevicesInDB = plib->ReadIntNCS( prop, "Options:UnmountInDB", 1 );
			l->sl_SocketTimeout  = plib->ReadIntNCS( prop, "core:SSLSocketTimeout", 10000 );
			l->sl_USFCacheMax = plib->ReadIntNCS( prop, "core:USFCachePerDevice", 102400000 );
			
			l->l_UpdateLoggedTimeOnUserMax = plib->ReadIntNCS( prop, "core:updateuserloggedtimeinterval", 10 );
			
			l->l_EnableHTTPChecker = plib->ReadIntNCS( prop, "Options:HttpChecker", 0 );
			
			l->sl_MasterServer = StringDuplicate( plib->ReadStringNCS( prop, "core:masterserveraddress", "home.friendos.com") );
			
			char *tptr  = plib->ReadStringNCS( prop, "core:ClientCert", NULL );
			if( tptr != NULL )
			{
				strcpy( l->RSA_CLIENT_KEY_PEM, tptr );
			}
			
			int val = plib->ReadIntNCS( prop, "core:RequireClientCert", 0 );
			if( val == 1 )
			{
				l->l_SSLAcceptFlags = SSL_VERIFY_PEER | SSL_VERIFY_FAIL_IF_NO_PEER_CERT;
			}
			else
			{
				l->l_SSLAcceptFlags = SSL_VERIFY_PEER;
			}
			
			tptr  = plib->ReadStringNCS( prop, "Core:Certpath", "cfg/crt/" );
			if( tptr != NULL )
			{
				if( tptr[ 0 ] == '/' )
				{
					sprintf( l->RSA_SERVER_CERT, "%s%s", tptr, "certificate.pem" );
					sprintf( l->RSA_SERVER_KEY, "%s%s", tptr, "key.pem" );
					sprintf( l->RSA_SERVER_CA_CERT, "%s%s", tptr, "certificate.pem" );
					sprintf( l->RSA_SERVER_CA_PATH, "%s%s", tptr, "/" );
				}
				else
				{
					sprintf( l->RSA_SERVER_CERT, "%s%s%s", ptr, tptr, "certificate.pem" );
					sprintf( l->RSA_SERVER_KEY, "%s%s%s", ptr, tptr, "key.pem" );
					sprintf( l->RSA_SERVER_CA_CERT, "%s%s%s", ptr, tptr, "certificate.pem" );
					sprintf( l->RSA_SERVER_CA_PATH, "%s%s%s", ptr, tptr, "/" );
				}
			}
			
			// http compression

			tptr  = plib->ReadStringNCS( prop, "core:http_compression", NULL );
			if( tptr != NULL )
			{
				if( strstr( tptr, "deflate" ) != NULL )
				{
					l->l_HttpCompressionContent |= HTTP_COMPRESSION_DEFLATE;
				}
				
				if( strstr( tptr, "bzip" ) != NULL )
				{
					l->l_HttpCompressionContent |= HTTP_COMPRESSION_BZIP;
				}
				
				if( strstr( tptr, "none" ) != NULL )
				{
					l->l_HttpCompressionContent = 0;
				}
			}
			
			l->sl_WorkersNumber = plib->ReadIntNCS( prop, "Core:Workers", WORKERS_MAX );
			if( l->sl_WorkersNumber < WORKERS_MIN )
			{
				l->sl_WorkersNumber = WORKERS_MIN;
			}
			
			if( l->sl_ActiveModuleName != NULL )
			{
				FFree( l->sl_ActiveModuleName );
			}
			
			tptr  = plib->ReadStringNCS( prop, "LoginModules:use", "fcdb.authmod" );
			if( tptr != NULL )
			{
				l->sl_ActiveModuleName = StringDuplicate( tptr );
			}
			else
			{
				l->sl_ActiveModuleName = StringDuplicate( "fcdb.authmod" );
			}

			l->l_AppleServerHost = StringDuplicate( plib->ReadStringNCS( prop, "NotificationService:host", NULL ) );
			
			l->l_AppleServerPort = plib->ReadIntNCS( prop, "NotificationService:port", 9000 );

			tptr = plib->ReadStringNCS( prop, "Core:XFrameOption", NULL );
			if( tptr != NULL )
			{
				l->sl_XFrameOption = StringDuplicate( tptr );
			}
			
			globalFriendCorePort = plib->ReadIntNCS( prop, "core:port", FRIEND_CORE_PORT );
			
			// additional server keys char ** iniparser_getseckeys(dictionary * d, char * s) - gret number of entries in group
			l->l_ServerKeysNum = ReadGroupEntries( prop, "ServiceKeys", &(l->l_ServerKeys), &(l->l_ServerKeyValues) );
		}
		else
		{
			FERROR( "Prop is just NULL!\n" );
		}
		
		/*
		if( FriendCoreLockCheckOrCreate() == FALSE )
		{
			char *ptr = getenv("FRIEND_HOME");
			char path[ 2048 ];
			if( ptr != NULL )
			{
				snprintf( path, sizeof(path), "%s.friend_lock%d", ptr, globalFriendCorePort );
			}
			else
			{
				snprintf( path, sizeof(path), ".friend_lock%d", globalFriendCorePort );
			}
			
			FERROR("Cannot run FriendCore instance on same port\nPlease check if FriendCore is running on same server/port\nPlease check and remove file/dir: '%s' if neccessary\n", path );
			FFree( l );
			LogDelete();
			return NULL;
		}
		*/
		
		Log( FLOG_INFO, "----------------------------------------\n");
		Log( FLOG_INFO, "-----Database configuration-------------\n");
		Log( FLOG_INFO, "-----Host: %s\n", host );
		Log( FLOG_INFO, "-----Port: %d\n", port );
		Log( FLOG_INFO, "-----DBName: %s\n", dbname );
		Log( FLOG_INFO, "-----User: %s\n", login );
		Log( FLOG_INFO, "----------------------------------------\n");

		l->sqlpool = FCalloc( l->sqlpoolConnections, sizeof( SQLConPool) );
		if( l->sqlpool != NULL )
		{
			unsigned int i = 0;
			int error = 0;

			for( ; i < (unsigned int)l->sqlpoolConnections; i++ )
			{
				l->sqlpool[ i ].sqll_Sqllib = (struct SQLLibrary *)LibraryOpen( l, l->sl_DefaultDBLib, 0 );
				if( l->sqlpool[ i ].sqll_Sqllib != NULL )
				{
					l->sqlpool[ i ].sql_ID = i;
					l->sqlpool[ i ].sqll_Sqllib->SetOption( l->sqlpool[ i ].sqll_Sqllib, options );
					error = l->sqlpool[ i ].sqll_Sqllib->Connect( l->sqlpool[ i ].sqll_Sqllib, host, dbname, login, pass, port );
					l->sqlpool[ i ].sqll_Sqllib->l_Slot = i;
					if( error != 0 )
					{
						break;
					}
				}
			}
			
			if( error != 0 )
			{
				i = 0;
				for( ; i < (unsigned int)l->sqlpoolConnections; i++ )
				{
					LibraryClose( l->sqlpool[ i ].sqll_Sqllib );
					l->sqlpool[ i ].sqll_Sqllib = NULL;
				}
			}
		}
		if( prop ) plib->Close( prop );
	
		//l->LibraryPropertiesDrop( l, plib );
	}
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Reading configuration END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	if( l->sqlpool == NULL || l->sqlpool[ 0 ].sqll_Sqllib == NULL )
	{
		Log( FLOG_ERROR, "Cannot open 'mysql.library' in first slot\n");
		FFree( tempString );
		FFree( l->sqlpool );
		FFree( l );
		//LogDelete();
		return NULL;
	}
	
	if( skipDBUpdate == FALSE && skipDBupdParam == FALSE )
	{
		CheckAndUpdateDB( l, UPDATE_DB_TYPE_GLOBAL );
	}
	else
	{
		Log( FLOG_INFO, "----------------------------------------------------\n");
		Log( FLOG_INFO, "---------Autoupdatedatabase process skipped---------\n");
		Log( FLOG_INFO, "----------------------------------------------------\n");
	}
	
	SQLLibrary *lsqllib  = l->LibrarySQLGet( l );
	if( lsqllib != NULL )
	{
		// session timeout
		
		char query[ 1024 ];
		snprintf( query, sizeof(query), "SELECT * FROM `FGlobalVariables` WHERE `Key`='USERSESSION_TIMEOUT'" );
		
		void *res = lsqllib->Query( lsqllib, query );
		if( res != NULL )
		{
			char **row;
			while( ( row = lsqllib->FetchRow( lsqllib, res ) ) ) 
			{
				// Id, Key, Value, Comment, date
			
				DEBUG("[SystemBase] \tFound database entry-> ID '%s' Key '%s', Value '%s', Comment '%s', Date '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ] );
			
				FLONG tmp = atol( row[ 2 ] );
				if( tmp > 30 )
				{
					l->sl_RemoveSessionsAfterTime = tmp;
				}
				else
				{
					l->sl_RemoveSessionsAfterTime = 30;
				}
			}
			lsqllib->FreeResult( lsqllib, res );
		}
		
		// Log size
		
		l->sl_MaxLogsInMB = 0;
		
		snprintf( query, sizeof(query), "SELECT * FROM `FGlobalVariables` WHERE `Key`='MAX_MB_LOGS_SIZE'" );
		
		res = lsqllib->Query( lsqllib, query );
		if( res != NULL )
		{
			char **row;
			while( ( row = lsqllib->FetchRow( lsqllib, res ) ) ) 
			{
				// Id, Key, Value, Comment, date
			
				DEBUG("[SystemBase] \tFound database entry-> ID '%s' Key '%s', Value '%s', Comment '%s', Date '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ] );
			
				FLONG tmp = atol( row[ 2 ] );
				l->sl_MaxLogsInMB = tmp;
			}
			lsqllib->FreeResult( lsqllib, res );
		}
		
		// dictionary
		
		l->sl_Dictionary = DictionaryNew( lsqllib );
		l->LibrarySQLDrop( l, lsqllib );
	}
	else
	{
		Log( FLOG_ERROR, "Cannot open 'mysql.library' instance!\n");
		return NULL;
	}
	
//#ifdef USE_PUSH_NOTIFICATIONS
	/*l->sl_NotificationManager = NotificationManagerNew( l );
	if( l->sl_NotificationManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize sl_NotificationManager\n");
	}*/
	l->sl_NotificationManager = NULL;

	
	l->fcm = FriendCoreManagerNew();

#ifdef USE_WORKERS
	l->sl_WorkerManager = WorkerManagerNew( l->sl_WorkersNumber );
#else
	l->sl_WorkerManager = NULL;
#endif

	if( FriendCoreManagerInit( l->fcm ) != 0 )
	{
		FriendCoreInstance *fci = l->fcm->fcm_FriendCores;
		while( fci != NULL )
		{
			fci->fci_Closed = TRUE;
			
			fci = (FriendCoreInstance *) fci->node.mln_Succ;
		}
		
		if( l->fcm->fcm_WebSocket != NULL )
		{
			WebSocketDelete( l->fcm->fcm_WebSocket );
			l->fcm->fcm_WebSocket = NULL;
		}
		
		if( l->fcm->fcm_WebSocketNotification != NULL )
		{
			WebSocketDelete( l->fcm->fcm_WebSocketNotification );
			l->fcm->fcm_WebSocketNotification = NULL;
		}
		
		Log( FLOG_ERROR, "FriendCoreManagerInit fail!\n");
		SystemClose( l );
		return NULL;
	}
	
	Log( FLOG_INFO,  "[SystemBase] Systembase: Initialize interfaces\n" );
	
	SocketInterfaceInit( &(l->sl_SocketInterface) );
	StringInterfaceInit( &(l->sl_StringInterface) );
	ListStringInterfaceInit( &(l->sl_ListStringInterface) );
	UserSessionManagerInterfaceInit( &(l->sl_UserSessionManagerInterface) );
	UserManagerInterfaceInit( &(l->sl_UserManagerInterface) );
	CommServiceInterfaceInit( &(l->sl_CommServiceInterface) );
	CommServiceRemoteInterfaceInit( &(l->sl_CommServiceRemoteInterface) );

	//l->alib = (struct ApplicationLibrary *)LibraryOpen( l, "application.library", 0 ); //l->LibraryApplicationGet( l );

	l->ilib = l->LibraryImageGet( l );
	
	l->zlib = (ZLibrary *)LibraryOpen( l, "z.library", 0 );
	if( l->zlib == NULL )
	{
		Log( FLOG_ERROR, "[ERROR]: CANNOT OPEN z.library!\n");
	}
	
	l->usblib = (USBLibrary *)LibraryOpen( l, "usb.library", 0 );
	if( l->usblib == NULL )
	{
		Log( FLOG_ERROR, "[ERROR]: CANNOT OPEN usb.library!\n");
        FERROR("Cannot open usb.library!\n");
	}
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create modules\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
//	DIR *d;
	struct dirent *dir;
	
	// modules
	
	l->sl_ModPath = FCalloc( 1025, sizeof( char ) );
	if( l->sl_ModPath == NULL )
	{
		FFree( l );
		Log( FLOG_ERROR, "Cannot allocate memory for module path!\n");
		return NULL;
	}

	strcpy( l->sl_ModPath, tempString );
	strcat( l->sl_ModPath, "/emod/");
	
	// all modules will be avaiable in system.library folder/emod/ subfolder

	DIR *d = opendir( l->sl_ModPath );
	
	if( d )
	{
		while( ( dir = readdir( d ) ) != NULL )
		{
			snprintf( tempString, PATH_MAX, "%s%s", l->sl_ModPath, dir->d_name );

			Log( FLOG_INFO,  "Reading modules:  %s fullmodpath %s\n", dir->d_name, tempString );
			if( dir->d_name[0] == '.' ) continue;
			
			EModule *locmod = EModuleCreate( l, tempString, dir->d_name );
			if( locmod != NULL )
			{
				DEBUG("[SystemBase] mod created, adding to list\n");
				locmod->node.mln_Succ = (MinNode *)l->sl_Modules;
				l->sl_Modules = locmod;
			}
			else
			{
				DEBUG("Cannot load mod %s\n", dir->d_name );
			}
		}
		closedir( d );
	}
	
	//
	// cache'ing PHP module
	//
	
	EModule *lmod = l->sl_Modules;
	
	while( lmod != NULL )
	{
		if( lmod->GetSuffix != NULL )
		{
			if( strcmp( lmod->GetSuffix(), "php" ) == 0 )
			{
				l->sl_PHPModule = lmod;
				break;
			}
		}
		lmod = (EModule *)lmod->node.mln_Succ;
	}
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create modules END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	//
	// login modules
	//
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create authentication modules\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	if (getcwd( tempString, PATH_MAX ) == NULL)
	{
		FFree( tempString );
		Log( FLOG_ERROR, "[SystemInit] getcwd failed!");
		exit(5);
	}
	
	l->sl_LoginModPath = FCalloc( 1025, sizeof( char ) );
	if( l->sl_LoginModPath == NULL )
	{
		FFree( l );
		Log( FLOG_ERROR, "Cannot allocate memory for login module path!\n");
		return NULL;
	}

	strcpy( l->sl_LoginModPath, tempString );
	strcat( l->sl_LoginModPath, "/authmods/");
	
	// all modules will be avaiable in system.library folder/authmods/ subfolder

	l->sl_ActiveAuthModule = NULL;
	
	d = opendir( l->sl_LoginModPath );
	
	if( d != NULL )
	{
		// we are loading default authentication module
		
		AuthMod *locmod = AuthModNew( l,  l->sl_LoginModPath, "fcdb.authmod", 0, NULL );
		if( locmod != NULL )
		{
			l->sl_DefaultAuthModule = locmod;
			l->sl_ActiveAuthModule = locmod;
		}
		
		// loading additional developer modules
		
		while( ( dir = readdir( d ) ) != NULL )
		{
			if( dir->d_name[0] == '.' || strcmp( dir->d_name, "fcdb.authmod" ) == 0 ) continue;
			Log( FLOG_INFO,  "[SystemBase] Reading auth modules:  %s fullauthmodpath %s\n", dir->d_name, tempString );
			
			locmod = AuthModNew( l,  l->sl_LoginModPath, dir->d_name, 0, l->sl_DefaultAuthModule );
			if( locmod != NULL )
			{
				locmod->node.mln_Succ = (MinNode *)l->sl_AuthModules;
				l->sl_AuthModules = locmod;
				
				if( strcmp( locmod->am_Name, l->sl_ActiveModuleName ) == 0 )
				{
					l->sl_ActiveAuthModule = locmod;
					INFO("[SystemBase] Default login module set to : %s\n", l->sl_ActiveAuthModule->am_Name );
					break;
				}
				
				DEBUG("[SystemBase] AUTHMOD created, adding to list\n");
			}
			else
			{
				DEBUG("Cannot load mod %s\n", dir->d_name );
			}
		}
		closedir( d );
	}
	
	if( l->sl_ActiveModuleName != NULL )
	{

	}
	else
	{
		Log( FLOG_ERROR, "Authentication module not provided\n");

		FFree( tempString );
		return NULL;	
	}
	
	l->sl_SecurityManager = SecurityManagerNew( l );
	if( l->sl_SecurityManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize SecurityManager\n");
	}
	
	l->sl_UM = UMNew( l );
	if( l->sl_UM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize UMNew\n");
	}
	
	l->sl_RoleManager = RMNew( l );
	if( l->sl_RoleManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize RMNew\n");
	}
	
	l->sl_DeviceManager = DeviceManagerNew( l );
	if( l->sl_DeviceManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize DeviceManager\n");
	}
	
	Log( FLOG_INFO, "AUTHOD master set to %s\n", l->sl_ActiveAuthModule->am_Name );
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create authentication modules END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create filesystem handlers\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	RescanHandlers( l->sl_DeviceManager );
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create filesystem handlers END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create DOSDrivers\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	RescanDOSDrivers( l->sl_DeviceManager );
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create DOSDrivers END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
#ifdef __DEBUG
	if( ( l->sl_Magic = magic_open(MAGIC_CHECK|MAGIC_MIME_TYPE) ) != NULL )
#else
	if( ( l->sl_Magic = magic_open(MAGIC_NONE|MAGIC_MIME_TYPE) ) != NULL )
#endif
	{
		int err = magic_load( l->sl_Magic, NULL/*use default database*/ ); // @BG-655
		DEBUG("[SystemBase] Magic load return %d\n", err );
		err = magic_compile( l->sl_Magic, NULL/*use default database*/ ); // @BG-655
		DEBUG("[SystemBase] Magic compile return %d\n", err );
	}
	else
	{
		Log( FLOG_ERROR, "[SystemInit] Cannot open magic shared lib\n");
	}
	
	//
	//
	//
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create Managers\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	// create all managers
	
	l->sl_PermissionManager = PermissionManagerNew( l );
	if( l->sl_PermissionManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize PermissionManager\n");
	}
	
	l->sl_WDavTokM = WebdavTokenManagerNew( l );
	if( l->sl_WDavTokM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize WebdavTokenManager\n");
	}
	
	l->sl_KeyM = FKeyManagerNew( l );
	if( l->sl_KeyM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize FKeyManager\n");
	}
	
	l->sl_CacheUFM = CacheUFManagerNew( l->sl_USFCacheMax, 0 );
	if( l->sl_CacheUFM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize CacheUFManager\n");
	}
	
	l->sl_FSM = FSManagerNew( l );
	if( l->sl_FSM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize FSManagerNew\n");
	}
	
	l->sl_USBRemoteManager = USBRemoteManagerNew( l );
	if( l->sl_USBRemoteManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize USBRemoteManagerNew\n");
	}
	
	l->sl_USM = USMNew( l );
	if( l->sl_USM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize USMNew\n");
	}
	
	l->sl_UGM = UGMNew( l );
	if( l->sl_UGM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize UMNew\n");
	}
	
	l->sl_PrinterM = PrinterManagerNew( l );
	if( l->sl_PrinterM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize PrinterManagerNew\n");
	}
	
	l->sl_EventManager = EventManagerNew( l );
	if( l->sl_EventManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize EventManagerNew\n");
	}
	
	l->sl_PIDTM = PIDThreadManagerNew( l );
	if( l->sl_PIDTM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize PIDThreadManagerNew\n");
	}
	
	l->sl_ULM = UserLoggerManagerNew( l );
	if( l->sl_ULM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize UserLoggerManagerNew\n");
	}
	
	// 100 MB
	l->cm = CacheManagerNew( 1000000000 );
	if( l->cm == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize CacheManager\n");
	}
	
	// 
	l->nm = INVARManagerNew();
	if( l->nm == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize INVARManager\n");
	}
	
	l->sl_ApplicationManager = ApplicationManagerNew( l );
	if( l->sl_ApplicationManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize AppSessionManager\n");
	}
	
	l->sl_SASManager = SASManagerNew( l );
	if( l->sl_SASManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize l_SASManager\n");
	}
	
	l->sl_DOSTM = DOSTokenManagerNew( l );
	if( l->sl_DOSTM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize DOSTokenManager\n");
	}
	
	l->sl_CalendarManager = CalendarManagerNew( l );
	if( l->sl_CalendarManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize sl_MobileManager\n");
	}
	
	l->sl_MitraManager = MitraManagerNew( l );
	if( l->sl_MitraManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize Mitra Manager\n");
	}
	
	FriendCoreManagerInitServices( l->fcm );
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Create Managers END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	//
	//
	//
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Register Events\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");

	EventAdd( l->sl_EventManager, "DoorNotificationRemoveEntries", DoorNotificationRemoveEntries, l, time( NULL )+MINS30, MINS30, -1 );
	
	EventAdd( l->sl_EventManager, "USMRemoveOldSessions", UMRemoveOldSessions, l, time( NULL )+l->sl_RemoveOldSessionTimeout, l->sl_RemoveOldSessionTimeout, -1 );	// default 60mins
	//EventAdd( l->sl_EventManager, "USMRemoveOldSessions", USMRemoveOldSessions, l, time( NULL )+l->sl_RemoveOldSessionTimeout, l->sl_RemoveOldSessionTimeout, -1 );	// default 60mins
	// test, to remove
	EventAdd( l->sl_EventManager, "PIDThreadManagerRemoveThreads", PIDThreadManagerRemoveThreads, l->sl_PIDTM, time( NULL )+MINS60, MINS60, -1 );
	EventAdd( l->sl_EventManager, "CacheUFManagerRefresh", CacheUFManagerRefresh, l->sl_CacheUFM, time( NULL )+DAYS5, DAYS5, -1 );
	
	EventAdd( l->sl_EventManager, "WebdavTokenManagerDeleteOld", WebdavTokenManagerDeleteOld, l->sl_WDavTokM, time( NULL )+MINS360, MINS360, -1 );
	
	EventAdd( l->sl_EventManager, "CommServicePING", CommServicePING, l->fcm->fcm_CommService, time( NULL )+MINS1, MINS1, -1 );
	
	EventAdd( l->sl_EventManager, "DOSTokenManagerAutoDelete", DOSTokenManagerAutoDelete, l->sl_DOSTM, time( NULL )+MINS5, MINS5, -1 );
	
	EventAdd( l->sl_EventManager, "RemoveOldLogs", RemoveOldLogs, l, time( NULL )+HOUR12, HOUR12, -1 );
	
	EventAdd( l->sl_EventManager, "UMRemoveOldUserLoginEntries", UMRemoveOldUserLoginEntries, l->sl_UM, time( NULL )+DAYS5, DAYS5, -1 );
	
	EventAdd( l->sl_EventManager, "UMRemoveRemovedUsersData", UMRemoveRemovedUsersData, l->sl_UM, time( NULL )+DAYS5, DAYS5, -1 );
	
	
	//EventAdd( l->sl_EventManager, "SecurityManagerRemoteOldBadSessionCalls", SecurityManagerRemoteOldBadSessionCalls, l->sl_SecurityManager, time( NULL )+MINS60, MINS60, -1 );
	
	//@BG-678 
	//EventAdd( l->sl_EventManager, USMCloseUnusedWebSockets, l->sl_USM, time( NULL )+MINS5, MINS5, -1 );
	
	if( l->l_EnableHTTPChecker == 1 )
	{
		EventAdd( l->sl_EventManager, "CheckServerAndRestart", CheckServerAndRestart, l, time( NULL )+30, 30, -1 );
	}
	
	l->sl_USM->usm_UM = l->sl_UM;
	l->sl_UM->um_USM = l->sl_USM;
	
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	Log( FLOG_INFO, "[SystemBase] Register Events END\n");
	Log( FLOG_INFO, "[SystemBase] ----------------------------------------\n");
	
	Log( FLOG_INFO,  "[SystemBase] base initialized properly\n");
	
	//
	// initialize some late stuff using module - find an admin and init!
	//
	
	{
		char query[ 1024 ];
		char *response = NULL;
		snprintf( query, sizeof(query), "SELECT u.ServerToken FROM `FUser` u, `FUserToGroup` fug, `FUserGroup` g, `FUserSession` s WHERE fug.UserGroupID = g.ID AND fug.UserID = u.ID AND g.Name=\"Admin\" AND g.Type = \"Level\" AND s.UserID = u.ID ORDER BY s.ID DESC LIMIT 1" );
		
		void *res = lsqllib->Query( lsqllib, query );
		if( res != NULL )
		{
			char **row;
			while( ( row = lsqllib->FetchRow( lsqllib, res ) ) ) 
			{
				// Id, Key, Value, Comment, date
			
				char *lrequest = FCalloc( 512, sizeof( char ) );
				snprintf( lrequest, 512, "servertoken=%s&module=system&command=init", row[ 0 ] );
				unsigned long resultLength = 0;
				response = l->RunMod( l, "php", "modules/system/module.php", lrequest, &resultLength );
				FFree( lrequest );
				break;
			}
			lsqllib->FreeResult( lsqllib, res );
		}
		
		if( response != NULL ) FFree( response );
	}
	
	// we cannot open libs inside another init
	FFree( tempString );

	return ( void *)l;
}

/**
 * Just get milliseconds since 1 Jan 1970
 * 
 */

int GetUnixTime()
{
	struct timeval tp;
	gettimeofday( &tp, NULL );
	return tp.tv_sec * 1000 + tp.tv_usec / 1000;
}

/**
 * SystemBase close function
 * @param l pointer to SystemBase
 * 
 */

void SystemClose( SystemBase *l )
{
	if( l == NULL )
	{
		Log( FLOG_ERROR, "[SystemClose] SystemBase is NULL\n");
		return;
	}
	
	/*
	if( l->l_APNSConnection != NULL )
	{
		WebsocketAPNSConnectorDelete( l->l_APNSConnection );
		l->l_APNSConnection = NULL;
	}
	*/
	
	if( l->sl_MobileManager != NULL )
	{
		MobileManagerDelete( l->sl_MobileManager );
	}
	
	DEBUG("[SystemBase] close event manager\n");
	if( l->sl_EventManager != NULL )
	{
		EventManagerDelete( l->sl_EventManager );
	}
	
	if( l->fcm != NULL )
	{
		FriendCoreManagerDelete( l->fcm );
		l->fcm = NULL;
	}
	
	Log( FLOG_INFO, "[SystemBase] SystemClose in progress\n");
	
	if( l->sl_ApplicationManager != NULL )
	{
		ApplicationManagerDelete( l->sl_ApplicationManager );
		l->sl_ApplicationManager = NULL;
	}
	
	// Check if INRAM is initialized
	/*
	if( ( FHandler *)l->sl_INRAM )
	{
		FHandler *fsys = (FHandler *)l->sl_INRAM->f_FSys;

		if( fsys != NULL && fsys->UnMount != NULL )
		{
			// Only release
			if( fsys->Release( fsys, l->sl_INRAM ) != 0 )
			{			
			}
			else
			{
				//FERROR("Not all FS\n");
			}
		}
	
		if( l->nm != NULL )
		{
			INVARManagerDelete( l->nm );
		}
	}*/
	
	if( l->cm != NULL )
	{
		CacheManagerDelete( l->cm );
	}
	
	//
	// Delete dictionary
	//
	
	if( l->sl_Dictionary )
	{
		DictionaryDelete( l->sl_Dictionary );
	}
	
	// Close image library
	l->LibraryImageDrop( l, l->ilib );
	
	// release and free all modules
	EModule *lmod = l->sl_Modules;
	Log( FLOG_INFO,  "[SystemBase] Release modules\n");
	while( lmod != NULL )
	{
		EModule *remm = lmod;
		lmod = (EModule *)lmod->node.mln_Succ;
		DEBUG("[SystemBase] Remove module %s\n", remm->em_Name );
		EModuleDelete( remm );
	}

	DEBUG("Delete Managers\n");
	
//#ifdef USE_PUSH_NOTIFICATIONS
	if( l->sl_NotificationManager != NULL )
	{
		NotificationManagerDelete( l->sl_NotificationManager );
	}
//#endif
	if( l->sl_CalendarManager != NULL )
	{
		CalendarManagerDelete( l->sl_CalendarManager );
	}
	if( l->sl_USM != NULL )
	{
		USMDelete( l->sl_USM );
	}
	if( l->sl_UM != NULL )
	{
		UMDelete( l->sl_UM );
	}
	if( l->sl_UGM != NULL )
	{
		UGMDelete( l->sl_UGM );
	}
	if( l->sl_FSM != NULL )
	{
		FSManagerDelete(  l->sl_FSM );
	}
	if( l->sl_USBRemoteManager != NULL )
	{
		USBRemoteManagerDelete( l->sl_USBRemoteManager );
	}
	if( l->sl_PrinterM != NULL )
	{
		PrinterManagerDelete( l->sl_PrinterM );
	}
	if( l->sl_PIDTM != NULL )
	{
		PIDThreadManagerDelete( l->sl_PIDTM );
	}
	if( l->sl_ULM != NULL )
	{
		UserLoggerManagerDelete( l->sl_ULM );
	}
	if( l->sl_CacheUFM != NULL )
	{
		CacheUFManagerDelete( l->sl_CacheUFM );
	}
	if( l->sl_KeyM != NULL )
	{
		FKeyManagerDelete( l->sl_KeyM );
	}
	if( l->sl_WDavTokM != NULL )
	{
		WebdavTokenManagerDelete( l->sl_WDavTokM );
	}
	if( l->sl_DOSTM != NULL )
	{
		DOSTokenManagerDelete( l->sl_DOSTM );
	}
	if( l->sl_DeviceManager != NULL )
	{
		DeviceManagerDelete( l->sl_DeviceManager );
	}
	if( l->sl_PermissionManager != NULL )
	{
		PermissionManagerDelete( l->sl_PermissionManager );
	}
	if( l->sl_RoleManager != NULL )
	{
		RMDelete( l->sl_RoleManager );
	}
	if( l->sl_SecurityManager != NULL )
	{
		SecurityManagerDelete( l->sl_SecurityManager );
	}
	if( l->sl_SASManager != NULL )
	{
		SASManagerDelete( l->sl_SASManager );
	}
	
	if( l->sl_MitraManager != NULL )
	{
		MitraManagerDelete( l->sl_MitraManager );
	}
	
	// Remove sentinel from active memory
	if( l->sl_Sentinel != NULL )
	{
		if( l->sl_Sentinel->s_ConfigUsername != NULL )
		{
			FFree( l->sl_Sentinel->s_ConfigUsername );
		}
		if( l->sl_Sentinel->s_ConfigPassword != NULL )
		{
			FFree( l->sl_Sentinel->s_ConfigPassword );
		}
		FFree( l->sl_Sentinel );
		l->sl_Sentinel = NULL;
	}
	
	Log( FLOG_INFO, "[SystemBase] Release dosdrivers\n");
	// release dosdrivers
	DOSDriver *ldd = l->sl_DOSDrivers;
	while( ldd != NULL )
	{
		DOSDriver *remdd = ldd;
		ldd = (DOSDriver *)ldd->node.mln_Succ;
		DEBUG("[SystemBase] Remove DOSDrive %s\n", remdd->dd_Name );
		DOSDriverDelete( remdd );
	}
	
	Log( FLOG_INFO,  "[SystemBase] Release filesystems\n");
	// release fsystems
	FHandler *lsys = l->sl_Filesystems;
	while( lsys != NULL )
	{
		FHandler *rems = lsys;
		lsys = (FHandler *)lsys->node.mln_Succ;
		DEBUG("[SystemBase] Remove fsys %s\n", rems->Name );
		FHandlerDelete( rems );
	}
	
	if( l->sl_WorkerManager != NULL )
	{
		DEBUG( "[FriendCore] Shutting down worker manager.\n" );
		WorkerManagerDelete( l->sl_WorkerManager );
		l->sl_WorkerManager = NULL;
	}
	
	// Close user library
	l->AuthModuleDrop( l, l->sl_ActiveAuthModule );
	
	// Remove module name
	if( l->sl_ActiveModuleName != NULL )
	{
		Log( FLOG_INFO, "[SystemBase] Release active module \n");
		FFree( l->sl_ActiveModuleName );
	}
	
	Log( FLOG_INFO,  "[SystemBase] Release authmodules\n");
	// auth
	AuthMod *amod = l->sl_AuthModules;
	AuthMod *rmod = amod;
	while( amod != NULL )
	{
		rmod = amod;
		amod = (AuthMod *)amod->node.mln_Succ;
		AuthModDelete( rmod );
	}
	
	if( l->sl_DefaultAuthModule != NULL )
	{
		AuthModDelete( l->sl_DefaultAuthModule );
	}
	
	Log( FLOG_INFO,  "[SystemBase] Closing application.library\n");
	// Application lib
	
	//if( l->alib != NULL )
	//{
	//	LibraryClose( l->alib );
	//}
	
	if( l->zlib != NULL )
	{
		LibraryClose( (struct Library *)l->zlib );
	}
	
	if( l->usblib != NULL )
	{
		LibraryClose( (struct Library *)l->usblib );
	}
	
	// Close mysql library
	DEBUG( "[SystemBase] Closing and looking into mysql pool\n" );
	if( l->sqlpool != NULL )
	{
		unsigned int i = 0;
		for( ; i < (unsigned int)l->sqlpoolConnections; i++ )
		{
			DEBUG( "[SystemBase] Closed mysql library slot %d\n", i );
			LibraryClose( l->sqlpool[ i ].sqll_Sqllib );
		}
		
		FFree( l->sqlpool );
	}

	// release them all strings ;)
	if( l->sl_ModPath )
	{
		FFree( l->sl_ModPath );
		l->sl_ModPath = NULL;
	}
	if( l->sl_FSysPath )
	{
		FFree( l->sl_FSysPath );
		l->sl_FSysPath = NULL;
	}
	if( l->sl_MasterServer != NULL )
	{
		FFree( l->sl_MasterServer );
		l->sl_MasterServer = NULL;
	}
	
	// close magic door of awesomeness!
	if( l->sl_Magic != NULL )
	{
		DEBUG( "[SystemBase] Closing magic cookie!\n" );
		magic_close( l->sl_Magic );
		l->sl_Magic = NULL;
	}
	
	if( l->sl_ModuleNames != NULL )
	{
		FFree( l->sl_ModuleNames );
	}
	
	// Clear available modules
	if( FRIEND_MUTEX_LOCK( &l->sl_InternalMutex ) == 0 )
	{
		List *ls = l->sl_AvailableModules;
		while( ls != NULL )
		{
			if( ls->l_Data )
			{
				struct ModuleSet *set = ( struct ModuleSet *)ls->l_Data;
				if( set->name )
					FFree( set->name );
				if( set->extension )
					FFree( set->extension );
				FFree( ls->l_Data );
			}
			ls = ls->next;
		}
		FreeList( l->sl_AvailableModules );
		l->sl_AvailableModules = NULL;
		FRIEND_MUTEX_UNLOCK( &l->sl_InternalMutex );
	}
	
	// Destroy mutex
	pthread_mutex_destroy( &l->sl_ResourceMutex );
	pthread_mutex_destroy( &l->sl_InternalMutex );
	
	Autotask *at = l->sl_Autotasks;
	while( at != NULL )
	{
		Autotask *rem = at;
		at = (Autotask *)at->node.mln_Succ;
		
		AutotaskDelete( rem );
	}
	
	// delete autotasks
	if( l->sl_AutotaskPath )
	{
		FFree( l->sl_AutotaskPath );
	}
	
	if( l->sl_DefaultDBLib != NULL )
	{ 
		FFree( l->sl_DefaultDBLib ); 
	}
	
	if( l->sl_XFrameOption != NULL )
	{
		FFree( l->sl_XFrameOption );
	}
	
	if( l->l_AppleServerHost != NULL )
	{
		FFree( l->l_AppleServerHost );
	}
	
	if( l->l_ServerKeysNum > 0 )
	{
		int i;
		for( i=0 ; i < l->l_ServerKeysNum; i++ )
		{
			if( l->l_ServerKeys[i] != NULL )
			{
				FFree( l->l_ServerKeys[i] );
			}
			if( l->l_ServerKeyValues[i] != NULL )
			{
				FFree( l->l_ServerKeyValues[i] );
			}
		}
		FFree( l->l_ServerKeys );
		FFree( l->l_ServerKeyValues );
	}
	
	xmlCleanupParser();
	
	Log( FLOG_INFO,  "[SystemBase] Systembase closed.\n");
	
	FriendCoreLockRelease();
}

/**
 * SystemBase external initialization routine.
 * This function initialize users, groups, devices, etc.
 *
 * @param l to SystemBase
 * @return 0 if everything went fine, otherwise error number
 */

int SystemInitExternal( SystemBase *l )
{
	DEBUG("[SystemBase] SystemInitExternal\n");
	
	USMRemoveOldSessionsinDB( l );

	DEBUG("[SystemBase] init users and all stuff connected to them\n");
	
	{
		//  get all users active
	
		time_t timestamp = time ( NULL );
		
		//
		// get sentinel
		//
		
		// Initialize sentinel structure in active memory
		
		if( l->sl_Sentinel == NULL )
		{
			DEBUG( "[SystemBase] Creating sentinel.\n" );
			PropertiesInterface *plib = &(SLIB->sl_PropertiesInterface);
			Props *prop = plib->Open( "cfg/cfg.ini" );
			if( prop != NULL )
			{
				// Do we even want a sentinel?
				char *userTest = plib->ReadStringNCS( prop, "Core:SentinelUsername", NULL );
				if( userTest != NULL )
				{
					l->sl_Sentinel = FCalloc( 1, sizeof( Sentinel ) );
					if( l->sl_Sentinel != NULL )
					{
						l->sl_Sentinel->s_ConfigUsername = StringDuplicate( userTest );
						l->sl_Sentinel->s_ConfigPassword = StringDuplicate( plib->ReadStringNCS( prop, "Core:SentinelPassword", NULL ) );
					
						memcpy( l->sl_Sentinel->s_FCID, l->fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
					}
				}
				plib->Close( prop );
			}
			
			if( l->sl_Sentinel != NULL )
			{
				if( l->sl_Sentinel->s_ConfigUsername == NULL || l->sl_Sentinel->s_ConfigPassword == NULL )
				{
					if( l->sl_Sentinel->s_ConfigUsername == NULL )
					{
						FFree( l->sl_Sentinel->s_ConfigUsername );
					}
					if( l->sl_Sentinel->s_ConfigPassword == NULL )
					{
						FFree( l->sl_Sentinel->s_ConfigPassword );
					}
					FFree( l->sl_Sentinel );
					l->sl_Sentinel = NULL;
				}
			}
			// PS: Sentinel is logged in in user_sessionmanager.c!
		}
		
		//
		// get all user sessions from DB
		//
	
		l->sl_USM->usm_Sessions = USMGetSessionsByTimeout( l->sl_USM, l->sl_RemoveSessionsAfterTime );
		UserSession *usess = l->sl_USM->usm_Sessions;
		DEBUG("[SystemBase] Got users by timeout\n");
		
		while( usess != NULL )
		{
			DEBUG("[SystemBase] Assigning sessions to users by ID %ld\n", usess->us_ID );
			
			l->sl_USM->usm_SessionCounter++;
			
			// checking if user exist, if not it is created
			User *usr = l->sl_UM->um_Users;
			while( usr != NULL )
			{
				// if user is provided we only setup link
				if( usess->us_UserID == usr->u_ID )
				{
					usess->us_User = usr;
					break;
				}
				usr = (User *) usr->node.mln_Succ;
			}
		
			if( usr == NULL )
			{
				DEBUG("[SystemBase] User is not in memory, it will be loaded from DB\n");
				// user was not found in memory, , must be loaded from DB
				usr = UMUserGetByIDDB( l->sl_UM, usess->us_UserID );
			
				if( usr != NULL )
				{
					usr->node.mln_Succ = (MinNode *)l->sl_UM->um_Users;
					l->sl_UM->um_Users = usr;
			
					UserAddSession( usr, usess );
					usess->us_User = usr;
					
					// Find the sentinel!
					if( l->sl_Sentinel != NULL )
					{
						if( strcmp( usr->u_Name, l->sl_Sentinel->s_ConfigUsername ) == 0 )
						{
							l->sl_Sentinel->s_User = usr;
							DEBUG("[SystemBase] Sentinel user found: %s\n", usr->u_Name );
						}
					}
				}
			}
		
			if( usr != NULL )
			{
				INFO("[SystemBase] User was added to list %s\n", usr->u_Name );
			}
		
			usess = (UserSession *)usess->node.mln_Succ;
		}
		
		//
		// attach sentinel user
		//
		
		if( l->sl_Sentinel != NULL && l->sl_Sentinel->s_User == NULL )
		{
			DEBUG("[SystemBase] Sentinel!= NULL\n");
			FBOOL fromMem = FALSE;
			User *sentuser = UMGetUserByName( l->sl_UM, l->sl_Sentinel->s_ConfigUsername );
			if( sentuser == NULL )
			{
				sentuser = UMGetUserByNameDB( l->sl_UM, l->sl_Sentinel->s_ConfigUsername );
			}
			else
			{
				fromMem = TRUE;
			}
			
			if( sentuser != NULL )
			{
				// add user to list
				if( fromMem == FALSE )
				{
					sentuser->node.mln_Succ = (MinNode *)l->sl_UM->um_Users;
					l->sl_UM->um_Users = sentuser;
				}
				
				DEBUG("[SystemBase] Sentinel user is avaiable\n");
				l->sl_Sentinel->s_User = sentuser;
			}
			else
			{
				DEBUG("[SystemBase] Sentinel user is not avaiable\n");
			}
		}
		
		//
		// Sentinel is set in config but FC cannot find it (user do not exist)
		//
		
		if( l->sl_Sentinel != NULL && l->sl_Sentinel->s_User == NULL )
		{
			if( l->sl_Sentinel->s_ConfigUsername == NULL || l->sl_Sentinel->s_ConfigPassword == NULL )
			{
				if( l->sl_Sentinel->s_ConfigUsername == NULL )
				{
					FFree( l->sl_Sentinel->s_ConfigUsername );
				}
				if( l->sl_Sentinel->s_ConfigPassword == NULL )
				{
					FFree( l->sl_Sentinel->s_ConfigPassword );
				}
				FFree( l->sl_Sentinel );
				l->sl_Sentinel = NULL;
			}
		}
		
		//
		// add remote sentinel session
		//
		
		if( l->sl_Sentinel != NULL && l->sl_Sentinel->s_User != NULL )
		{
			FBOOL foundRemoteSession = FALSE;
			UserSessListEntry *sl = l->sl_Sentinel->s_User->u_SessionsList;
			while( sl != NULL )
			{
				UserSession *locses = sl->us;
				if( strcmp( locses->us_DeviceIdentity, "remote" ) == 0 )
				{
					foundRemoteSession = TRUE;
				}
				sl = (UserSessListEntry *) sl->node.mln_Succ;
			}
			
			// remote session is missing, we are adding it
			
			if( foundRemoteSession == FALSE )
			{
				char *newSessionId = SessionIDGenerate();
				DEBUG("[SystemBase] Remote session will be created for Sentinel\n");
				
				UserSession *ses = UserSessionNew( newSessionId, "remote", l->fcm->fcm_ID );
				//UserSession *ses = UserSessionNew( "remote", "remote" );
				if( ses != NULL )
				{
					ses->us_UserID = l->sl_Sentinel->s_User->u_ID;
					ses->us_LastActionTime = timestamp;
					
					UserAddSession( l->sl_Sentinel->s_User, ses );
					
					USMUserSessionAddToList( l->sl_USM, ses );
				}
				FFree( newSessionId );
			}
		}
		
		UMCheckAndLoadAPIUser( l->sl_UM );
		
		UMInitUsers( l->sl_UM );

		UGMMountGroupDrives( l->sl_UGM );
		
		//UGMMountDrives( l->sl_UGM );	// previous function which was mounting all group drives without SQLWorkgroup
	}
	
	// mount INRAM drive
	/*
	struct TagItem tags[] = {
		{FSys_Mount_Type, (FULONG)"INRAM"},
		{FSys_Mount_Name, (FULONG)"INRAM"},
		{FSys_Mount_User, (FULONG)NULL },
		{FSys_Mount_Owner, (FULONG)NULL },
		{TAG_DONE, TAG_DONE}
	};
	int err = MountFSNoUser( l, (struct TagItem *)&tags, &l->sl_INRAM );
	if( err != 0 )
	{
		Log( FLOG_ERROR,"Cannot mount device, device '%s' will be unmounted. FERROR %d\n", "INRAM", err );
		//l->sl_INRAM->f_Mounted = TRUE;
	}*/
	
	
	// test websocket client connection
	
	// we must launch mobile manager when all sessions and users are loaded
	
	l->sl_MobileManager = MobileManagerNew( l );
	if( l->sl_MobileManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize sl_MobileManager\n");
	}
	
	DEBUG("[SystembaseInitExternal]APNS init\n" );
	
	return 0;
}


typedef struct DevNode
{
	char				*dn_Table[ 10 ];
	MinNode				node;
}DevNode;

/**
 * Load and mount all user doors
 *
 * @param l pointer to SystemBase
 * @param usrses pointer to usersession to which doors belong
 * @param force integer 0 = don't force 1 = force
 * @param unmountIfFail should be device unmounted in DB if mount will fail
 * @param mountError pointer to error message
 * @param notify notify about changes
 * @return 0 if everything went fine, otherwise error number
 */

int UserDeviceMount( SystemBase *l, UserSession *usrses, int force, FBOOL unmountIfFail, char **mountError, FBOOL notify )
{	
	Log( FLOG_INFO, "[UserDeviceMount] Mount user device from Database\n");
	SQLLibrary *sqllib;
	
	if( usrses == NULL || usrses->us_User == NULL )
	{
		DEBUG("[UserDeviceMount] User parameter is empty\n");
		return -1;
	}
	User *usr = usrses->us_User;
	
	if( usr == NULL || usr->u_Status == USER_STATUS_TO_BE_REMOVED )
	{
		DEBUG("[UserDeviceMount] User is NULL or will be removed\n");
		return -2;
	}
	
	if( usr->u_MountedDevs != NULL && force == 0 )
	{
		DEBUG("[UserDeviceMount] Devices are already mounted\n");
		return 0;
	}
	
	sqllib = l->LibrarySQLGet( l );
	if( sqllib == NULL )
	{
		DEBUG("[UserDeviceMount] SQLlib = NULL\n");
		return 0;
	}
	
	if( FRIEND_MUTEX_LOCK( &l->sl_DeviceManager->dm_Mutex ) == 0 )
	{
		char temptext[ 1024 ];
	//char *temptext = FCalloc( 1024, 1 );

		sqllib->SNPrintF( sqllib, temptext, 1024 ,"\
SELECT \
`Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID` \
FROM `Filesystem` f \
WHERE \
( \
f.UserID = '%lu' OR ( \
f.GroupID IN ( \
SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g \
WHERE \
g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND \
ug.UserID = '%ld' \
) \
) \
)AND (f.Mounted=\'1\')", 
usr->u_ID , usr->u_ID, usr->u_ID
	);

//)AND ( (f.Owner='0' OR f.Owner IS NULL) AND f.Mounted=\'1\')", 

		DEBUG("[UserDeviceMount] Finding drives in DB\n");
		void *res = sqllib->Query( sqllib, temptext );
		if( res == NULL )
		{
			Log( FLOG_ERROR,  "[UserDeviceMount] UserDeviceMount fail: database results = NULL\n");
			l->LibrarySQLDrop( l, sqllib );
			FRIEND_MUTEX_UNLOCK( &l->sl_DeviceManager->dm_Mutex );
			return 0;
		}
		DEBUG("[UserDeviceMount] Finding drives in DB no error during select:\n\n");
	
		char **row;
		DevNode *rootDev = NULL;

		while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
		{
			// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

			Log( FLOG_INFO, "[UserDeviceMount] \tFound database -> Name '%s' Type '%s', Server '%s', Port '%s', Path '%s', Mounted '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
		
			// make a list of devices
			DevNode *ne = FCalloc( 1, sizeof(DevNode ) );
			if( ne != NULL )
			{
				ne->dn_Table[ 0 ] = StringDuplicate( row[0] );
				ne->dn_Table[ 1 ] = StringDuplicate( row[1] );
				ne->dn_Table[ 4 ] = StringDuplicate( row[4] );
				ne->dn_Table[ 5 ] = StringDuplicate( row[5] );
				ne->dn_Table[ 7 ] = StringDuplicate( row[7] );
				
				ne->node.mln_Succ = (MinNode *)rootDev;
				rootDev = ne;
			}
		}	// going through all rows
		DEBUG( "[UserDeviceMount] Device mounted for user %s\n\n", usr->u_Name );

		sqllib->FreeResult( sqllib, res );
		l->LibrarySQLDrop( l, sqllib );
		FRIEND_MUTEX_UNLOCK( &l->sl_DeviceManager->dm_Mutex );
		
		// mount all devices
		DevNode *actDev = rootDev;
		DevNode *remDev = rootDev;
		while( actDev != NULL )
		{
			remDev = actDev;
			actDev = (DevNode *)actDev->node.mln_Succ;
			
			int mount = atoi( remDev->dn_Table[ 5 ] );
			int id = atol( remDev->dn_Table[ 7 ] );
			User *owner = NULL;
			
			struct TagItem tags[] = {
				{ FSys_Mount_Path,    (FULONG)remDev->dn_Table[ 4 ] },
				{ FSys_Mount_Server,  (FULONG)NULL },
				{ FSys_Mount_Port,    (FULONG)NULL },
				{ FSys_Mount_Type,    (FULONG)remDev->dn_Table[ 1 ] },
				{ FSys_Mount_Name,    (FULONG)remDev->dn_Table[ 0 ] },
				{ FSys_Mount_UserName, (FULONG)usr->u_Name },
				{ FSys_Mount_Owner,   (FULONG)owner },
				{ FSys_Mount_ID,      (FULONG)id },
				{ FSys_Mount_Mount,   (FULONG)mount },
				{ FSys_Mount_SysBase, (FULONG)SLIB },
				{ FSys_Mount_UserSession, (FULONG)usrses },
				{TAG_DONE, TAG_DONE}
			};

			File *device = NULL;
			DEBUG("[UserDeviceMount] Before mounting\n");
			
			int err = MountFS( l->sl_DeviceManager, (struct TagItem *)&tags, &device, usr, mountError, usrses, notify );

			sqllib = l->LibrarySQLGet( l );
			// if there is error but error is not "device is already mounted"
			if( err != 0 && err != FSys_Error_DeviceAlreadyMounted )
			{
				Log( FLOG_ERROR,"[UserDeviceMount] \tCannot mount device, device '%s' will be unmounted. ERROR %d\n", remDev->dn_Table[ 0 ], err );
				// if unmountIfFail is set
				// and if error is not equal to FSys_Error_CustomError which is returned when main drive is installed but not shareddrive (for other users)
				if( unmountIfFail == TRUE && err != FSys_Error_CustomError )
				{
					//Log( FLOG_INFO, "UserDeviceMount. Device unmounted: %s UserID: %lu 
					
					sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "UPDATE `Filesystem` SET Mounted=0 WHERE ID=%lu", id );
					
					sqllib->QueryWithoutResults( sqllib, temptext );
				}
				else
				{
					//sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "UPDATE `Filesystem` SET Mounted=0 WHERE ID=%lu", id );
					
					//sqllib->QueryWithoutResults( sqllib, temptext );
				}
			}
			else if( device != NULL )
			{
				sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "UPDATE `Filesystem` SET Mounted=1 WHERE ID=%lu", id );
					
				sqllib->QueryWithoutResults( sqllib, temptext );
				device->f_Mounted = TRUE;
			}
			else
			{
				Log( FLOG_ERROR, "[UserDeviceMount] \tCannot set device mounted state. Device = NULL (%s).\n", remDev->dn_Table[ 0 ] );
			}
			l->LibrarySQLDrop( l, sqllib );
			
			if( remDev->dn_Table[ 0 ] != NULL ){ FFree( remDev->dn_Table[ 0 ] ); }
			if( remDev->dn_Table[ 1 ] != NULL ){ FFree( remDev->dn_Table[ 1 ] ); }
			if( remDev->dn_Table[ 4 ] != NULL ){ FFree( remDev->dn_Table[ 4 ] ); }
			if( remDev->dn_Table[ 5 ] != NULL ){ FFree( remDev->dn_Table[ 5 ] ); }
			if( remDev->dn_Table[ 7 ] != NULL ){ FFree( remDev->dn_Table[ 7 ] ); }
			FFree( remDev );
		}

		usr->u_InitialDevMount = TRUE;
	}
	
	return 0;
}

/**
 * Unmount user doors
 *
 * @param l pointer to SystemBase
 * @param sqllib pointer to sql.library UNUSED
 * @param usr pointer to user to which doors belong
 * @return 0 if everything went fine, otherwise error number
 */

int UserDeviceUnMount( SystemBase *l, User *usr, UserSession *ses )
{
	DEBUG("UserDeviceUnMount\n");
	if( usr != NULL )
	{
		USER_CHANGE_ON( usr );
		
		if( usr->u_MountedDevs != NULL )
		{
			File *dev = usr->u_MountedDevs;
			
			usr->u_MountedDevs = NULL; // set it to NULL
			
			USER_CHANGE_OFF( usr );
			
			File *remdev = dev;
			
			while( dev != NULL )
			{
				remdev = dev;
				dev = (File *)dev->node.mln_Succ;
				
				DEBUG("Pointer to remdev: %p in use %d\n", remdev, usr->u_InUse );
				
				DeviceUnMount( l->sl_DeviceManager, remdev, usr, ses );
				
				DEBUG("Pointer to remdev2: %p in use %d\n", remdev, usr->u_InUse );
				
				//FFree( remdev );
				FileDelete( remdev );
			}
		}
		else
		{
			USER_CHANGE_OFF( usr );
		}
		
		//TODO
		// unmount also disks shared by usergroups
	}
	else
	{
		return 1;
	}
	return 0;
}

/**
 * Run module
 *
 * @param l pointer to SystemBase
 * @param type type of module which will be used to make call
 * @param path path to module exe file
 * @param args additional parameters to module
 * @param length pointer to integer where length of answer will be stored
 * @return string with answer from module
 */

char *RunMod( SystemBase *l, const char *type, const char *path, const char *args, unsigned long *length )
{
	char *results = NULL;

	EModule *lmod = l->sl_Modules;
	EModule *workmod = NULL;

	//DEBUG("[SystemBase] Run module '%s'\n", type );

	while( lmod != NULL )
	{
		if( lmod->GetSuffix != NULL )
		{
			if( strcmp( lmod->GetSuffix(), type ) == 0 )
			{
				workmod = lmod;
				break;
			}
		}
		lmod = (EModule *)lmod->node.mln_Succ;
	}

	if( workmod != NULL )
	{
		DEBUG("[SystemBase] Found module '%s', using it\n", lmod->GetSuffix() );
		
		results = lmod->Run( lmod, path, args, length );
	}
	else
	{
		Log( FLOG_ERROR,"Cannot run '%s' script!\n", type );
	}

	return results;
}

/**
 * Run module in streaming mode
 *
 * @param l pointer to SystemBase
 * @param type type of module which will be used to make call
 * @param path path to module exe file
 * @param args additional parameters to module
 * @param response pointer to Http structure for writing server output
 * @return string with answer from module
 */
int StreamMod( SystemBase *l, const char *type, const char *path, const char *args, Http *request, Http **httpResponse )
{
	int dataLength = 0;

	if( !request || !httpResponse )
	{
	    return -1;
	}
	
	EModule *lmod = l->sl_Modules;
	EModule *workmod = NULL;
	
	while( lmod != NULL )
	{
		if( lmod->GetSuffix != NULL )
		{
			if( strcmp( lmod->GetSuffix(), type ) == 0 )
			{
				workmod = lmod;
				break;
			}
		}
		lmod = (EModule *)lmod->node.mln_Succ;
	}

	if( workmod != NULL && lmod->Stream != NULL )
	{
		//DEBUG("[SystemBase] Found module '%s', using it\n", lmod->GetSuffix() );
		
		dataLength = lmod->Stream( lmod, path, args, request, httpResponse );
	}
	else
	{
		Log( FLOG_ERROR,"Cannot stream '%s' script!\n", type );
	}

	return dataLength;
}

/**
 * Get last error from SystemBase
 *
 * @param l to SystemBase
 * @return error number
 */

int GetError( SystemBase *l )
{
	int tmp = l->sl_Error;
	l->sl_Error = 0;
	return tmp;
}

/**
 * Get authentication module
 *
 * @param l pointer to SystemBase
 * @return authentication module
 */

struct AuthMod *AuthModuleGet( SystemBase *l )
{
	return l->sl_ActiveAuthModule;
}

/**
 * Close authentication module UNIMPLEMENTED
 *
 * @param l pointer to SystemBase
 * @param uclose pointer to module which will closed
 */

void AuthModuleDrop( SystemBase *l __attribute__((unused)), AuthMod *uclose __attribute__((unused)))
{
}

/**
 * Get mysql.library from pool
 *
 * @param l pointer to SystemBase
 * @return pointer to mysql.library
 */

SQLLibrary *LibrarySQLGet( SystemBase *l )
{
	SQLLibrary *retlib = NULL;
	int i ;
	int timer = 0;
	
	while( TRUE )
	{
		if( FRIEND_MUTEX_LOCK( &l->sl_ResourceMutex ) == 0 )
		{
			if( l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib->l_InUse == FALSE )
			{
				retlib = l->sqlpool[l->MsqLlibCounter ].sqll_Sqllib;
				DEBUG("retlibptr %p pool %p\n", retlib, l->sqlpool[l->MsqLlibCounter ].sqll_Sqllib );
				int status = retlib->GetStatus( (void *)l->sqlpool[l->MsqLlibCounter ].sqll_Sqllib );
				if( retlib == NULL || status != SQL_STATUS_READY ) //retlib->con.sql_Con->status != MYSQL_STATUS_READY )
				{
					FERROR( "[LibraryMYSQLGet] We found a NULL pointer on slot %d retlib %p status %d!\n", l->MsqLlibCounter, retlib, status );
					// Increment and check
					if( ++l->MsqLlibCounter >= l->sqlpoolConnections ) l->MsqLlibCounter = 0;
					FRIEND_MUTEX_UNLOCK( &l->sl_ResourceMutex );
					// Give some grace time..
					usleep( 0 );
					continue;
				}
				
				l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib->l_InUse = TRUE;
				if( l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib->con.sql_Recconect == TRUE )
				{
					l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib->Reconnect(  l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib );
					l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib->con.sql_Recconect = FALSE;
				}
			
				INFO( "[LibraryMYSQLGet] We found mysql library on slot %d (library %p).\n", l->MsqLlibCounter, l->sqlpool[ l->MsqLlibCounter ].sqll_Sqllib );
			
				// Increment and check
				if( ++l->MsqLlibCounter >= l->sqlpoolConnections )
				{
					l->MsqLlibCounter = 0;
				}
				FRIEND_MUTEX_UNLOCK( &l->sl_ResourceMutex );
				break;
			}
			else
			{
				FRIEND_MUTEX_UNLOCK( &l->sl_ResourceMutex );
			}
		}
		
		timer++;
		// We got too many connections, give grace time
		if( timer >= l->sqlpoolConnections )
		{
			timer = 0;
			usleep( 0 );
		}
		
		l->MsqLlibCounter++;
		if( l->MsqLlibCounter >= l->sqlpoolConnections )
		{
			l->MsqLlibCounter = 0;
		}
		
		/*
		retries++;
		if( retries >= l->sqlpoolConnections )
		{
			if( usingSleep++ >= 32 )
			{
				DEBUG( "All SQL connections are busy!\n" );
				break;
			}
			usleep( 5000 );
		}
		*/
	}
	
	return retlib;
}

/**
 * Drop mysql.library to pool
 *
 * @param l pointer to SystemBase
 * @param lib pointer to mysql.library which will be returned to pool
 */

void LibrarySQLDrop( SystemBase *l, SQLLibrary *lib )
{
	int i = 0;
	int closed = -1;
	
	if( FRIEND_MUTEX_LOCK( &l->sl_ResourceMutex ) == 0 )
	{
		if( lib->l_InUse == TRUE )
		{
			lib->l_InUse = FALSE;
			
			closed = i;
		}
		FRIEND_MUTEX_UNLOCK( &l->sl_ResourceMutex );
	}
		
	if( lib->l_InUse != FALSE )
	{
		DEBUG( "[SystemBase] Mysql library %p is still in use\n", lib );
	}
	
	if( closed != -1 )
	{
		INFO( "[SystemBase] MYSQL library %p slot %d was closed properly.\n", lib, lib->l_Slot );
	}
}

/**
 * Get application.library from SystemBase
 *
 * @param l pointer to SystemBase
 * @return pointer to application.library
 */

ApplicationLibrary *LibraryApplicationGet( SystemBase *l )
{
	if( l->AppLibCounter == 0 )
	{
		l->alib = (struct ApplicationLibrary *)LibraryOpen( l, "application.library", 0 );
		if( l->alib == NULL )
		{
			DEBUG("[SystemBase] CANNOT OPEN application.library!\n");
			return NULL;
		}
	}
	l->AppLibCounter++;

	return l->alib;
}

/**
 * Drop application.library to pool
 *
 * @param l pointer to SystemBase
 * @param aclose pointer to application.library which will be returned to pool
 */

void LibraryApplicationDrop( SystemBase *l, ApplicationLibrary *aclose __attribute__((unused)) )
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

/**
 * Get z.library from SystemBase
 *
 * @param l pointer to SystemBase
 * @return pointer to z.library
 */

ZLibrary *LibraryZGet( SystemBase *l )
{
	/*
	if( l->ZLibCounter == 0 )
	{
		DEBUG("Trying to open z.library!\n");
		
		l->zlib = (ZLibrary *)LibraryOpen( l, "z.library", 0 );
		if( l->zlib == NULL )
		{
			DEBUG("[ERROR]: CANNOT OPEN z.library!\n");
			return NULL;
		}
		
		l->ZLibCounter++;
	}
	DEBUG("z.library opened %p!\n", l->zlib );
	*/
	return l->zlib;
}

/**
 * Drop z.library to pool UNIMPLEMENTED
 *
 * @param l pointer to SystemBase
 * @param closelib pointer to z.library which will be returned to pool
 */

void LibraryZDrop( SystemBase *l __attribute__((unused)), ZLibrary *closelib __attribute__((unused)) )
{
	/*
	if( l->ZLibCounter > 0 )
	{
		l->ZLibCounter--;
	}
	else
	{
		*/
		
	//}
}

/**
 * Get image.library from SystemBase
 *
 * @param l pointer to SystemBase
 * @return pointer to image.library
 */

ImageLibrary *LibraryImageGet( SystemBase *l )
{
	if( l->ImageLibCounter == 0 )
	{
		DEBUG("[SystemBase] Trying to open image.library!\n");
		
		l->ilib = (ImageLibrary *)LibraryOpen( l, "image.library", 0 );
		if( l->ilib == NULL )
		{
			DEBUG("[SystemBase] Cannot open image.library!\n");
			return NULL;
		}
		l->ImageLibCounter++;
	}
	DEBUG("[SystemBase] image.library opened %p!\n", l->ilib );
	
	return l->ilib;
}

/**
 * Drop image.library to pool
 *
 * @param l pointer to SystemBase
 * @param closelib pointer to image.library which will be returned to pool
 */

void LibraryImageDrop( SystemBase *l, ImageLibrary *closelib __attribute__((unused)) )
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

/**
 * Get Sentinel User from System
 * 
 * @param l pointer to SystemBase
 * @return Sentinel user
 */

Sentinel* GetSentinelUser( SystemBase* l )
{
	if( l != NULL )
	{
		return l->sl_Sentinel;
	}
	return NULL;
}

/**
 * Send message via websockets
 *
 * @param usersession recipient of 
 * @param msg message which will be send
 * @param len length of the message
 * @return 0 if message was sent otherwise error number
 */

int WebSocketSendMessageInt( UserSession *usersession, char *msg, int len )
{
	unsigned char *buf;
	int bytes = 0;
	
	{
		buf = (unsigned char *)FCalloc( len + 128 + 24, sizeof( unsigned char ) );
		if( buf != NULL )
		{
			memcpy( buf, msg, len );

			if( usersession->us_WSD != NULL && usersession->us_WebSocketStatus == WEBSOCKET_SERVER_CLIENT_STATUS_ENABLED )
			{
				int ret = UserSessionWebsocketWrite( usersession, buf, len, LWS_WRITE_TEXT );
				if( ret > 0 )
				{
					bytes += ret;
				}
			}
			else
			{
				DEBUG("Websocket is disabled, dataptr: %p\n", msg );
			}
			FFree( buf );
		}
		else
		{
			Log( FLOG_ERROR,"Cannot allocate memory for message\n");

			return 0;
		}
	}
	
	return bytes;
}

/**
 * Send data
 *
 * @param request pointer to Http request message
 * @param data pointer to String
 * @return number of bytes which user want to send
 */

int SendProcessMessage( Http *request, char *data, int len )
{
	DEBUG("[SystemBase] SendProcessMessage\n");
	
	if( request->http_RequestSource == HTTP_SOURCE_HTTP_TO_WS )
	{
		DEBUG("[SystemBase] SendProcessMessage to WS: %s\n", data );
		
		PIDThread *pidt = (PIDThread *)request->http_PIDThread;
		char *sendbuf;
		int msglen = len+1024;
		
		if( ( sendbuf = FCalloc( msglen, sizeof( char ) ) ) != NULL )
		{
			int newmsglen = snprintf( sendbuf, msglen, "{\"type\":\"msg\", \"data\":{\"type\":\"%lu\",\"data\":{%.*s}}}", pidt->pt_PID, len, data );
			SystemBase *sb = (SystemBase *)pidt->pt_SB;
			
			DEBUG("[SystemBase] SendProcessMessage message '%s'\n", sendbuf );
			
			UserSessionWebsocketWrite( pidt->pt_UserSession, (unsigned char *)sendbuf, newmsglen, LWS_WRITE_TEXT);
			
			FFree( sendbuf );
		}
	}
	else
	{
		
	}
	DEBUG("SendProcessMessage end\n");
	
	return 0;
}

/**
 * Check if another FriendCore is working or launch it and create lock which prevent to launch another FriendCore on same port.
 * 
 * @return TRUE if lock can be created
 */

FBOOL FriendCoreLockCheckOrCreate( )
{
	char *ptr = getenv("FRIEND_HOME");
	char path[ 2048 ];
	if( ptr != NULL )
	{
		int size = snprintf( path, sizeof(path), "%s.friend_lock%d", ptr, globalFriendCorePort );
		if( mkdir( path, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH ) == 0 )
		{
			return TRUE;
		}
		else
		{
			return FALSE;
		}
	}

	return FALSE;
}

/**
 * Release FriendCore lock
 */
void FriendCoreLockRelease()
{
	char *ptr = getenv("FRIEND_HOME");
	char path[ 2048 ];
	if( ptr != NULL )
	{
		int size = snprintf( path, sizeof(path), "%s.friend_lock%d", ptr, globalFriendCorePort );
		LocFileDeleteWithSubs( path );
	}
}

#define NORMAL_COLOR  "\x1B[0m"
#define GREEN  "\x1B[32m"
#define BLUE  "\x1B[34m"

#define LFILENAME_MAX_LENGTH 256

typedef struct LFile
{
	char		lf_Name[ LFILENAME_MAX_LENGTH ];
	size_t		lf_Size;
	size_t		lf_ModDate;
}LFile;


static int LFileCompare(const void * a, const void * b)
{
    LFile *aa = (LFile *)a;
	LFile *bb = (LFile *)b;
	if( aa->lf_ModDate > bb->lf_ModDate ) return -1;
	else return 1;
}

/**
 * Remove old logs from log directory
 *
 * @param l pointer to SystemBase
 */

void RemoveOldLogs( SystemBase *l )
{
 	//l->sl_MaxLogsInMB = 40; // test 40MB
	if( l->sl_MaxLogsInMB > 0 )
	{
		int numberOfFiles = 0;
		int64_t bytes = 0;
		
		DIR * d; // open the path
		if( ( d = opendir("log/")) != NULL )
		{
			struct dirent * dir;
			while( (dir = readdir(d)) != NULL ) 
			{
				if( strcmp( dir->d_name,".")==0 || strcmp(dir->d_name,"..") ==0 )continue;
			
				if( dir->d_type == 0x8 && (strncmp( dir->d_name, "friend_core", 11 ) == 0) ) // if the type is not directory just print it with blue
				{
					char path[ 1024 ];
					snprintf( path, sizeof(path), "log/%s", dir->d_name );
				
					struct stat attr;
					stat( path, &attr );
				
					numberOfFiles++;
					bytes += attr.st_size;
				}
			}
			closedir( d ); // finally close the directory
		} // opendir
		
		int maxLogsBytes = l->sl_MaxLogsInMB * 1024 * 1000;
		// too much logs (in MB)
		if( bytes > maxLogsBytes )
		{
			LFile *files = FCalloc( numberOfFiles, sizeof(LFile) );
			if( files != NULL )
			{
				LFile **filesPtr = FCalloc( numberOfFiles, sizeof(LFile *) );
				if( filesPtr != NULL )
				{
					int pos = 0;
					if( ( d = opendir("log/")) != NULL )
					{
						struct dirent * dir;
						while( (dir = readdir(d)) != NULL ) 
						{
							if( strcmp( dir->d_name,".")==0 || strcmp(dir->d_name,"..") ==0 )continue;
	   
							if( dir->d_type == 0x8 && (strncmp( dir->d_name, "friend_core", 11 ) == 0) ) // if the type is not directory just print it with blue
							{
								snprintf( files[ pos ].lf_Name, LFILENAME_MAX_LENGTH, "log/%.250s", dir->d_name );
								struct stat attr;
								stat( files[ pos ].lf_Name, &attr );
								files[ pos ].lf_Size = attr.st_size;
								files[ pos ].lf_ModDate = attr.st_mtime;
								filesPtr[ pos ] = &files[ pos ];
								pos++;
							}
						}
						closedir( d ); // finally close the directory
						
						qsort( filesPtr, (sizeof(filesPtr)/sizeof(LFile **)), sizeof (LFile *), LFileCompare);
					} // opendir
					
					int i;
					for( i = 0 ; i < numberOfFiles ; i++ )
					{
						
						DEBUG1("maxbytes %lu will survive %d MB %lu\n", bytes, maxLogsBytes, (FULONG)(bytes/(1024*1000)) );
						if( bytes > maxLogsBytes )
						{
							DEBUG1("Delete file %s modification date %lu\n", filesPtr[ i ]->lf_Name, filesPtr[ i ]->lf_ModDate );
							remove( filesPtr[ i ]->lf_Name );
							bytes -= filesPtr[ i ]->lf_Size;
						}
						else
						{
							DEBUG("No more files to remove\n");
							break;
						}
					}
					
					FFree( filesPtr );
				}
				FFree( files );
			}
		}
		
	}
}
