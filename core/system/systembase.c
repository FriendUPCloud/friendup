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
#include <unistd.h>
#include <system/services/service_manager.h>
#include <properties/propertieslibrary.h>
#include <ctype.h>
#include <magic.h>
#include "web_util.h"
#include <network/websocket_client.h>
#include <system/fsys/device_handling.h>
#include <core/functions.h>
#include <util/md5.h>
#include <network/digcalc.h>
#include <network/mime.h>
#include <private-libwebsockets.h>
#include <system/fsys/door_notification.h>
#include <communication/comm_service.h>
#include <communication/comm_service_remote.h>

#define LIB_NAME "system.library"
#define LIB_VERSION 		1
#define LIB_REVISION		0
#define CONFIG_DIRECTORY	"cfg/"
//#define LOGOUT_TIME         86400	// one day
//#define LOGOUT_TIME         3600 // one hour


//
// global structure
//

struct SystemBase *SLIB;

//
// definitions
//

DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, const char *name );

void DOSDriverDelete( DOSDriver *ddrive );

void SetFriendCoreManager( struct SystemBase *l, FriendCoreManager *lfcm );

void SystemClose( struct SystemBase *l );

Http *SysWebRequest( struct SystemBase *l, char **urlpath, Http **request, UserSession *loggedSession );

FBOOL skipDBUpdate = FALSE;

/**
 * SystemBase init function
 *
 * @return pointer to SystemBase
 */

SystemBase *SystemInit( void )
{
	struct SystemBase *l = NULL;
	char tempString[ 1024 ];
	Log( FLOG_INFO,  "SystemBase Init\n");

	if( ( l = FCalloc( 1, sizeof( struct SystemBase ) ) ) == NULL )
	{
		return NULL;
	}
	
	SLIB = l;
	
	// init libraries
	
	l->UserLibCounter = 0;
	l->MsqLlibCounter = 0;
	l->AppLibCounter = 0;
	l->PropLibCounter = 0;
	l->ZLibCounter = 0;
	
	// Set mutex
	pthread_mutex_init( &l->sl_InternalMutex, NULL );
	pthread_mutex_init( &l->sl_ResourceMutex, NULL );
	int 				msqllibc;
	int				sl_Error;					// last error

	getcwd( tempString, sizeof ( tempString ) );
	l->handle = dlopen( 0, RTLD_LAZY );
	
	l->SystemClose = SystemClose;

	l->SysWebRequest = SysWebRequest;

	// execute.library structure
	l->RunMod = RunMod;
	l->MountFS = MountFS;
	l->UnMountFS = UnMountFS;

	l->AuthModuleGet = AuthModuleGet;
	l->AuthModuleDrop = AuthModuleDrop;
	l->LibraryMYSQLGet = LibraryMYSQLGet;
	l->LibraryMYSQLDrop = LibraryMYSQLDrop;
	l->LibraryApplicationGet = LibraryApplicationGet;
	l->LibraryApplicationDrop = LibraryApplicationDrop;
	l->LibraryPropertiesGet = LibraryPropertiesGet;
	l->LibraryPropertiesDrop = LibraryPropertiesDrop;
	l->LibraryZGet = LibraryZGet;
	l->LibraryZDrop = LibraryZDrop;
	l->LibraryImageGet = LibraryImageGet;
	l->LibraryImageDrop = LibraryImageDrop;
	l->WebSocketSendMessage = WebSocketSendMessage;
	l->WebSocketSendMessageInt = WebSocketSendMessageInt;
	l->WebsocketWrite = WebsocketWrite;
	l->SendProcessMessage = SendProcessMessage;
	l->SystemInitExternal = SystemInitExternal;
	l->RunMod = RunMod;
	l->GetSentinelUser = GetSentinelUser;
	l->UserDeviceMount = UserDeviceMount;
	l->UserDeviceUnMount = UserDeviceUnMount;
	l->AddWebSocketConnection = AddWebSocketConnection;
	l->GetError = GetError;
	l->SetFriendCoreManager = SetFriendCoreManager;
	l->Log = Log;

	Log( FLOG_INFO,  "Systembase: Create SQL pooled connections\n");
	
	// open mysql.library
	
	char *host = "localhost";
	char *login = "root";
	char *pass = "root";
	char *dbname = "FriendMaster";
	int port = 3306;
	l->sqlpoolConnections = DEFAULT_SQLLIB_POOL_NUMBER;
	Props *prop = NULL;

	// Get a copy of the properties.library
	struct PropertiesLibrary *plib = ( struct PropertiesLibrary *)l->LibraryPropertiesGet( l );
	
	if( l->sl_ActiveModuleName )
	{
		FFree( l->sl_ActiveModuleName );
	}
	l->sl_ActiveModuleName = StringDuplicate( "fcdb.authmod" );
	l->sl_CacheFiles = TRUE;
	l->sl_UnMountDevicesInDB =TRUE;
	l->sl_SocketTimeout = 10000;
	l->sl_WorkersNumber = WORKERS_MAX;
	
	//DEBUG("Plibcheck %p lsb %p\n", plib, lsb );
	if( plib != NULL && plib->Open != NULL )
	{
		char *ptr = getenv("FRIEND_HOME");
		char *path = FCalloc( 1000, sizeof( char ) );
		
		if( ptr != NULL )
		{
			sprintf( path, "%scfg/cfg.ini", ptr );
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
			char *skipUpdate = plib->ReadString( prop, "Core:skipDBUpdate", "false" );
			if( skipUpdate != NULL )
			{
				if( strcmp( skipUpdate, "true" ) == 0 )
				{
					skipDBUpdate = TRUE;
				}
			}
			
			DEBUG("[SystemBase] reading login\n");
			login = plib->ReadString( prop, "DatabaseUser:login", "root" );
			DEBUG("[SystemBase] user %s\n", login );
			pass = plib->ReadString( prop, "DatabaseUser:password", "root" );
			DEBUG("[SystemBase] password %s\n", pass );
			host = plib->ReadString( prop, "DatabaseUser:host", "localhost" );
			DEBUG("[SystemBase] host %s\n", host );
			dbname = plib->ReadString( prop, "DatabaseUser:dbname", "FriendMaster" );
			DEBUG("[SystemBase] dbname %s\n",dbname );
			port = plib->ReadInt( prop, "DatabaseUser:port", 3306 );
			DEBUG("[SystemBase] port read %d\n", port );
			l->sqlpoolConnections = plib->ReadInt( prop, "DatabaseUser:connections", DEFAULT_SQLLIB_POOL_NUMBER );
			DEBUG("[SystemBase] connections read %d\n", l->sqlpoolConnections );
			
			l->sl_CacheFiles = plib->ReadInt( prop, "Options:CacheFiles", 1 );
			l->sl_UnMountDevicesInDB = plib->ReadInt( prop, "Options:UnmountInDB", 1 );
			l->sl_SocketTimeout  = plib->ReadInt( prop, "Core:SSLSocketTimeout", 10000 );
			
			char *tptr  = plib->ReadString( prop, "Core:Certpath", "cfg/crt/" );
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
			
			l->sl_WorkersNumber = plib->ReadInt( prop, "Core:workers", WORKERS_MAX );
			if( l->sl_WorkersNumber < WORKERS_MIN )
			{
				l->sl_WorkersNumber = WORKERS_MIN;
			}
			
			if( l->sl_ActiveModuleName != NULL )
			{
				FFree( l->sl_ActiveModuleName );
			}
			
			tptr  = plib->ReadString( prop, "LoginModules:use", "fcdb.authmod" );
			if( tptr != NULL )
			{
				l->sl_ActiveModuleName = StringDuplicate( tptr );
			}
			else
			{
				l->sl_ActiveModuleName = StringDuplicate( "fcdb.authmod" );
			}
		}
		else
		{
			FERROR( "Prop is just NULL!\n" );
		}

		l->sqlpool = FCalloc( l->sqlpoolConnections, sizeof( SQLConPool) );
		if( l->sqlpool != NULL )
		{
			unsigned int i = 0;

			for( ; i < (unsigned int)l->sqlpoolConnections; i++ )
			{
				l->sqlpool[i ].sqllib = (struct MYSQLLibrary *)LibraryOpen( l,  "mysql.library", 0 );
				if( l->sqlpool[i ].sqllib != NULL )
				{
					l->sqlpool[i ].sqllib->Connect( l->sqlpool[i ].sqllib, host, dbname, login, pass, port );
				}
			}
		}
		if( prop ) plib->Close( prop );
	
		l->LibraryPropertiesDrop( l, plib );
	}
	
	if( l->sqlpool[ 0 ].sqllib == NULL )
	{
		FERROR("Cannot open 'mysql.library' in first slot\n");
		FFree( l->sqlpool );
		FFree( l );
		LogDelete();
		return NULL;
	}
	
	l->sl_WorkerManager = WorkerManagerNew( l->sl_WorkersNumber );
	l->fcm = FriendCoreManagerNew();
	
	Log( FLOG_INFO,  "[SystemBase] Systembase: Initialize interfaces\n" );
	
	SocketInterfaceInit( &(l->sl_SocketInterface) );
	StringInterfaceInit( &(l->sl_StringInterface) );
	ListStringInterfaceInit( &(l->sl_ListStringInterface) );
	UserSessionManagerInterfaceInit( &(l->sl_UserSessionManagerInterface) );
	UserManagerInterfaceInit( &(l->sl_UserManagerInterface) );
	CommServiceInterfaceInit( &(l->sl_CommServiceInterface) );
	CommServiceRemoteInterfaceInit( &(l->sl_CommServiceRemoteInterface) );

	l->alib = l->LibraryApplicationGet( l );
	// dictionary
	
	MYSQLLibrary *lsqllib  = l->LibraryMYSQLGet( l );
	if( lsqllib != NULL )
	{
		l->sl_Dictionary = DictionaryNew( lsqllib );
	}
	else
	{
		FERROR("Cannot open 'mysql.library' instance!\n");
		return NULL;
	}
	l->LibraryMYSQLDrop( l, lsqllib );

	l->ilib = l->LibraryImageGet( l );
	
	l->zlib = (ZLibrary *)LibraryOpen( l, "z.library", 0 );
	if( l->zlib == NULL )
	{
		FERROR("[ERROR]: CANNOT OPEN z.library!\n");
	}
	
	DIR *d;
	struct dirent *dir;
	
	// modules
	
	l->sl_ModPath = FCalloc( 1025, sizeof( char ) );
	if( l->sl_ModPath == NULL )
	{
		FFree( l );
		return NULL;
	}

	strcpy( l->sl_ModPath, tempString );
	strcat( l->sl_ModPath, "/emod/");
	
	// all modules will be avaiable in system.library folder/emod/ subfolder

	d = opendir( l->sl_ModPath );
	
	if( d )
	{
		while( ( dir = readdir( d ) ) != NULL )
		{
			sprintf( tempString, "%s%s", l->sl_ModPath, dir->d_name );

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
			//DEBUG("SEARCHING FILESYSTEM %s found %s\n", type, lmod->GetSuffix() );
			
			if( strcmp( lmod->GetSuffix(), "php" ) == 0 )
			{
				l->sl_PHPModule = lmod;
				break;
			}
		}
		lmod = (EModule *)lmod->node.mln_Succ;
	}
	
	//
	// login modules
	//
	
	getcwd( tempString, sizeof ( tempString ) );
	
	l->sl_LoginModPath = FCalloc( 1025, sizeof( char ) );
	if( l->sl_LoginModPath == NULL )
	{
		FFree( l );
		FERROR("Cannot allocate memory for login module path!\n");
		return NULL;
	}

	strcpy( l->sl_LoginModPath, tempString );
	strcat( l->sl_LoginModPath, "/authmods/");
	
	// all modules will be avaiable in system.library folder/emod/ subfolder

	l->sl_ActiveAuthModule = l->sl_AuthModules;
	
	d = opendir( l->sl_LoginModPath );
	
	if( d != NULL )
	{
		while( ( dir = readdir( d ) ) != NULL )
		{
			if( dir->d_name[0] == '.' ) continue;
			Log( FLOG_INFO,  "[SystemBase] Reading auth modules:  %s fullauthmodpath %s\n", dir->d_name, tempString );
			
			AuthMod *locmod = AuthModNew( l,  l->sl_LoginModPath, dir->d_name, 0 );
			if( locmod != NULL )
			{
				locmod->node.mln_Succ = (MinNode *)l->sl_AuthModules;
				l->sl_AuthModules = locmod;
				DEBUG("[SystemBase] AUTHMOD created, adding to list\n");
			}
			else
			{
				DEBUG("Cannot load mod %s\n", dir->d_name );
			}
		}
		closedir( d );
	}
	
	char defaultAuth[ 128 ];
	defaultAuth[ 0 ] = 0;
	char *def = NULL;
	strcpy( defaultAuth, "fcdb.authmod" );
	
/*
	{
		struct PropertiesLibrary *plib = NULL;
		Props *prop = NULL;
	
		if( ( plib = (struct PropertiesLibrary *)LibraryOpen( l, "properties.library", 0 ) ) != NULL )
		{
			char *ptr, path[ 1024 ];
			path[ 0 ] = 0;
	
			ptr = getenv("FRIEND_HOME");
			if( ptr != NULL )
			{
				sprintf( path, "%scfg/cfg.ini", ptr );
			}

			prop = plib->Open( path );
			if( prop != NULL)
			{

				char *tmp  = plib->ReadString( prop, "LoginModules:use", "fcdb.authmod" );
				if( tmp != NULL )
				{
					strcpy( defaultAuth, tmp );
				}
				
				plib->Close( prop );
			}
			
			LibraryClose( ( struct Library *)plib );
		}
	}
*/
	if( l->sl_ActiveModuleName != NULL )
	{
		def = l->sl_ActiveModuleName;
	}
	else
	{
		def = defaultAuth;
		l->sl_ActiveModuleName = StringDuplicate( def );
	}
	// Get auth module
	if( def != NULL )
	{
		AuthMod *mod = l->sl_AuthModules;
		
		while( mod != NULL )
		{
			// atm we only need authname to get proper login page
			if( strcmp( mod->am_Name, defaultAuth ) == 0 ) //l->sl_ActiveModuleName ) == 0 )
			{
				l->sl_ActiveAuthModule = mod;
				INFO("[SystemBase] Default login module set to : %s\n", l->sl_ActiveAuthModule->am_Name );
				break;
			}
			mod = (AuthMod *) mod->node.mln_Succ;
		}
		
		if( l->sl_ActiveAuthModule == NULL )
		{
			FFree( l->sl_ActiveModuleName );
			l->sl_ActiveModuleName = NULL;
			FERROR("ActiveAuthModule = NULL!\n");
			return NULL;
		}
	}
	else
	{
		FERROR("Default path not provided\n");
		return NULL;	
	}
	
	Log( FLOG_INFO, "AUTHOD master set to %s\n", l->sl_ActiveAuthModule->am_Name );
	
	// open fcdb.logmod
	
	l->sl_ActiveAuthModule = l->AuthModuleGet( l );
	
	Log( FLOG_INFO,  "[SystemBase] scanning drivers\n");
	
	RescanHandlers( l );
	
	RescanDOSDrivers( l );
	
	if( ( l->sl_Magic = magic_open(MAGIC_CHECK|MAGIC_MIME_TYPE) ) != NULL )
	{
		int err = magic_load( l->sl_Magic, "/usr/share/file/magic.mgc" );
		DEBUG("[SystemBase] Magic load return %d\n", err );
		err = magic_compile( l->sl_Magic, "/usr/share/file/magic.mgc" );
		DEBUG("[SystemBase] Magic compile return %d\n", err );
	}
	else
	{
		FERROR("Cannot open magic shared lib\n");
	}
	
	//
	//
	//
	
	Log( FLOG_INFO,  "[SystemBase] create managers\n");
	
	// create all managers
	
	l->sl_FSM = FSManagerNew( l );
	if( l->sl_FSM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize FSManagerNew\n");
	}
	
	l->sl_USB = USBManagerNew( l );
	if( l->sl_USB == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize USBManagerNew\n");
	}
	
	l->sl_USM = USMNew( l );
	if( l->sl_USM == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize USMNew\n");
	}
	
	l->sl_UM = UMNew( l );
	if( l->sl_UM == NULL )
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
	
	l->sl_AppSessionManager = AppSessionManagerNew();
	if( l->sl_AppSessionManager == NULL )
	{
		Log( FLOG_ERROR, "Cannot initialize AppSessionManager\n");
	}
	
	//
	//
	//
	
	Log( FLOG_INFO,  "[SystemBase] create default events\n");
	
	#define MINS5 300
	#define MINS6 460
	#define MINS30 1800
	#define MINS60 MINS6*10
	#define MINS360 6*MINS60

	EventAdd( l->sl_EventManager, DoorNotificationRemoveEntries, l, time( NULL )+MINS30, MINS30, -1 );
	EventAdd( l->sl_EventManager, USMRemoveOldSessions, l, time( NULL )+MINS360, MINS360, -1 );
	// test, to remove
	//EventAdd( l->sl_EventManager, USMRemoveOldSessions, l, time( NULL )+130, 130, -1 );
	EventAdd( l->sl_EventManager, PIDThreadManagerRemoveThreads, l->sl_PIDTM, time( NULL )+MINS60, MINS60, -1 );
	
	l->sl_USM->usm_UM = l->sl_UM;
	l->sl_UM->um_USM = l->sl_USM;
	
	Log( FLOG_INFO,  "[SystemBase] base initialized properly\n");
	
	// we cannot open libs inside another init
	
	//
	// sl_Autotask
	//
	
	l->sl_AutotaskPath = FCalloc( 1024, sizeof(char) );
	if( l->sl_AutotaskPath != NULL )
	{
		getcwd( l->sl_AutotaskPath, sizeof ( tempString ) );
		strcat( l->sl_AutotaskPath, "/autostart/");

		d = opendir( l->sl_AutotaskPath );
	 
		if( d != NULL )
		{
			while( ( dir = readdir( d ) ) != NULL )
			{
				if( dir->d_name[0] == '.' ) continue;
				Log( FLOG_INFO,  "[SystemBase] Reading autostart scripts:  %s\n", dir->d_name );
			
				snprintf( tempString, sizeof(tempString), "%s%s", l->sl_AutotaskPath, dir->d_name );
				
				Autotask *loctask = AutotaskNew( "/bin/bash", tempString );
				if( loctask != NULL )
				{
					loctask->node.mln_Succ = (MinNode *)l->sl_Autotasks;
					l->sl_Autotasks = loctask;
				}
			}
			closedir( d );
		}
	}

	return ( void *)l;
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
		FERROR("SystemBase is NULL\n");
		return;
	}
	
	Log( FLOG_INFO, "[SystemBase] SystemClose in progress\n");
	
	if( l->sl_AppSessionManager != NULL )
	{
		AppSessionManagerDelete( l->sl_AppSessionManager );
		l->sl_AppSessionManager = NULL;
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
	
	DEBUG("[SystemBase] close event manager\n");
	if( l->sl_EventManager != NULL )
	{
		EventManagerDelete( l->sl_EventManager );
	}
	
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
		l->sl_Dictionary = NULL;
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
		DEBUG("[SystemBase] Remove module %s\n", remm->Name );
		EModuleDelete( remm );
	}

	if( l->sl_USM != NULL )
	{
		USMDelete( l->sl_USM );
	}
	if( l->sl_UM != NULL )
	{
		UMDelete(  l->sl_UM );
	}
	if( l->sl_FSM != NULL )
	{
		FSManagerDelete(  l->sl_FSM );
	}
	if( l->sl_USB != NULL )
	{
		USBManagerDelete( l->sl_USB );
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
	
	FriendCoreManagerDelete( l->fcm );
	
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
	
	Log( FLOG_INFO,  "[SystemBase] Closing application.library\n");
	// Application lib
	if( l->alib != NULL )
	{
		LibraryClose( l->alib );
	}
	
	if( l->zlib != NULL )
	{
		LibraryClose( (struct Library *)l->zlib );
	}
	
	// Close mysql library
	DEBUG( "[SystemBase] Closing and looking into mysql pool\n" );
	if( l->sqlpool != NULL )
	{
		unsigned int i = 0;
		for( ; i < (unsigned int)l->sqlpoolConnections; i++ )
		{
			DEBUG( "[SystemBase] Closed mysql library slot %d\n", i );
			LibraryClose( l->sqlpool[ i ].sqllib );
		}
		
		FFree( l->sqlpool );
	}
	mysql_library_end();
	
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
	
	// Close properties.library
	if( l->plib ) 
	{
		DEBUG( "[SystemBase] Seems we still have the properties library. Remove it.\n" );
		LibraryClose( l->plib );
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
	
	Log( FLOG_INFO,  "[SystemBase] Systembase closed.\n");
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
	
	if( skipDBUpdate == FALSE )
	{
		CheckAndUpdateDB( l );
	}
	
	DEBUG("[SystemBase] init users and all stuff connected to them\n");
	MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
	if( sqllib != NULL )
	{
		//  get all users active
	
		time_t timestamp = time ( NULL );
	
		Log( FLOG_INFO,  "[SystemBase] Loading groups from DB\n");
	
		l->sl_UM->um_UserGroups = LoadGroups( l );
		
		//
		// get sentinel
		//
		
		// Initialize sentinel structure in active memory
		
		if( l->sl_Sentinel == NULL )
		{
			DEBUG( "[SystemBase] Creating sentinel.\n" );
			Props *prop = SLIB->plib->Open( "cfg/cfg.ini" );
			if( prop != NULL )
			{
				// Do we even want a sentinel?
				char *userTest = SLIB->plib->ReadString( prop, "Core:SentinelUsername", NULL );
				if( userTest != NULL )
				{
					l->sl_Sentinel = FCalloc( 1, sizeof( Sentinel ) );
					if( l->sl_Sentinel != NULL )
					{
						l->sl_Sentinel->s_ConfigUsername = StringDuplicate( userTest );
						l->sl_Sentinel->s_ConfigPassword = StringDuplicate( SLIB->plib->ReadString( prop, "Core:SentinelPassword", NULL ) );
					
						memcpy( l->sl_Sentinel->s_FCID, l->fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
					}
				}
				SLIB->plib->Close( prop );
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
	
		l->sl_USM->usm_Sessions = USMGetSessionsByTimeout( l->sl_USM, LOGOUT_TIME );
		UserSession *usess = l->sl_USM->usm_Sessions;
		DEBUG("[SystemBase] Got users by timeout\n");
		
		while( usess != NULL )
		{
			DEBUG("[SystemBase] Assigning sessions to users by ID %ld\n", usess->us_ID );
			
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
				DEBUG("[SystemBase] REMOTE SESSION WILL BE CREATED FOR SENTINEL\n");
				
				UserSession *ses = UserSessionNew( "remote", "remote" );
				if( ses != NULL )
				{
					ses->us_UserID = l->sl_Sentinel->s_User->u_ID;
					ses->us_LoggedTime = timestamp;
					
					UserAddSession( l->sl_Sentinel->s_User, ses );
					
					UserSession *nextses = NULL;
					if( l->sl_USM->usm_Sessions != NULL )
					{
						l->sl_USM->usm_Sessions->node.mln_Succ;
					}
					ses->node.mln_Succ = (MinNode *)l->sl_USM->usm_Sessions;
					l->sl_USM->usm_Sessions = ses;
					if( nextses != NULL )
					{
						nextses->node.mln_Pred = (MinNode *)ses;
					}
					
					//
					//if( sqllib->NumberOfRecordsCustomQuery( sqllib, "select * from `FUserSession` where UserID='1' AND DeviceIdentity='remote'") < 1)
					//{
					//	sqllib->Save( sqllib, UserSessionDesc, ses );
					//}
					//
				}
			}
			
			//
			// regenerate sessionid for User
			//
			
			if(  (timestamp - l->sl_Sentinel->s_User->u_LoggedTime) > LOGOUT_TIME )
			{
				UserRegenerateSessionID( l->sl_Sentinel->s_User, NULL );
			}
		}
	
		User *tmpUser = l->sl_UM->um_Users;
		while( tmpUser != NULL )
		{
			DEBUG( "[SystemBase] FINDING DRIVES FOR USER %s.....\n\n", tmpUser->u_Name );
			UserDeviceMount( l, sqllib, tmpUser, 1 );
			DEBUG( "[SystemBase] DONE FINDING DRIVES FOR USER %s.....\n\n", tmpUser->u_Name );
			tmpUser = (User *)tmpUser->node.mln_Succ;
		}
		
		l->LibraryMYSQLDrop( l, sqllib );
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
	
	return 0;
}

//
// we need structure which will hold name of scripts and their numbers
//

typedef struct DBUpdateEntry
{
	int number;
	char name[ 512 ];
}DBUpdateEntry;

/**
 * Check and Update FC database
 *
 * @param sb pointer to SystemBase
 */

void CheckAndUpdateDB( struct SystemBase *l )
{
	DEBUG("------------------------------------------------------------------------\n");
	DEBUG("---------Autoupdatedatabase in progress-------------\n");
	MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
	if( sqllib != NULL )
	{
		int startUpdatePosition = 0;
		int orgStartUpdateposition = -1;
		
		char query[ 1024 ];
		snprintf( query, sizeof(query), "SELECT * FROM `FGlobalVariables` WHERE `Key`='DB_VERSION'" );
		
		MYSQL_RES *res = sqllib->Query( sqllib, query );
		if( res != NULL )
		{
			MYSQL_ROW row;
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				// Id, Key, Value, Comment, date
			
				DEBUG("[SystemBase] \tFound database entry-> ID '%s' Key '%s', Value '%s', Comment '%s', Date '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ] );
			
				orgStartUpdateposition = startUpdatePosition = atoi( row[ 2 ] );
			}
			sqllib->FreeResult( sqllib, res );
		}
		
		DEBUG("[SystemBase] CheckAndUpdateDB: %d\n", startUpdatePosition );
		
		DIR *dp = NULL;
		struct dirent *dptr;
		int numberOfFiles = 0;
		
		DEBUG("[SystemBase] UpdateDB found directory\n");
		
		if( ( dp = opendir( "sqlupdatescripts" ) ) != NULL )
		{
			while( ( dptr = readdir( dp ) ) != NULL )
			{
				if( strcmp( dptr->d_name, "." ) == 0 || strcmp( dptr->d_name, ".." ) == 0 )
				{
					continue;
				}
				
				numberOfFiles++;
			}
			closedir( dp );
		}
		
		DBUpdateEntry *dbentries;
		
		if( ( dbentries = FCalloc( numberOfFiles, sizeof(DBUpdateEntry) ) ) != NULL )
		{
			int position = 0;
			
			if( ( dp = opendir( "sqlupdatescripts" ) ) != NULL )
			{
				DEBUG("[SystemBase] UpdateDB found directory 1\n");
				while( ( dptr = readdir( dp ) ) != NULL )
				{
					char number[ 512 ];
					unsigned int i;
				
					if( strcmp( dptr->d_name, "." ) == 0 || strcmp( dptr->d_name, ".." ) == 0 )
					{
						continue;
					}
				
					// we must extract number from filename
					strcpy( number, dptr->d_name );
					for( i=0 ; i < strlen( number ) ; i++ )
					{
						if( number[ i ] == '_' )
						{
							number[ i ] = 0;
							break;
						}
					}
					
					dbentries[ position ].number = atoi( number );
					if( dbentries[ position ].number > startUpdatePosition )
					{
						DEBUG("[SystemBase] Found script with number %d, script added: %s\n", dbentries[ position ].number, dptr->d_name );
						strcpy( dbentries[ position ].name, dptr->d_name );
						position++;
					}
				}
				closedir( dp );
			}
			
			DEBUG("[SystemBase] Directories parsed startUpdatePosition: %d position %d\n", startUpdatePosition, position );
			
			// we must run script which holds changes
			startUpdatePosition++;
			char *lastSQLname = NULL;
			int error = 0;
			// now FC will update DB script after script
			int i;
			for( i=0 ; i < position ; i++ )
			{
				int j;
				for( j=0; j < position ; j++ )
				{
					DEBUG("[SystemBase] Checking numbers, start: %d actual: %d\n", startUpdatePosition, dbentries[j].number );
					if( startUpdatePosition == dbentries[j].number )
					{
						FILE *fp;
						char scriptfname[ 712 ];
						snprintf( scriptfname, sizeof( scriptfname ), "sqlupdatescripts/%s", dbentries[j].name );
						DEBUG("[SystemBase] Found script with ID %d\n", startUpdatePosition );
						
						if( ( fp = fopen( scriptfname, "rb" ) ) != NULL )
						{
							fseek( fp, 0, SEEK_END );
							long fsize = ftell( fp );
							fseek( fp, 0, SEEK_SET );
							
							DEBUG("[SystemBase] File opened\n");
							
							char *script;
							if( ( script = FCalloc( fsize+1, sizeof(char) ) ) != NULL )
							{
								int readedbytes = 0;
								if( ( readedbytes = fread( script, fsize, 1, fp ) ) > 0 )
								{
									char *command = script;
									int i;

									for( i=1 ; i < fsize ; i++ )
									{
										if( script[ i ] == ';' )
										{
											script[ i ] = 0;
											DEBUG("[SystemBase] Running script: %s from file: %s on database\n", command, scriptfname ); 
											if( strlen( command) > 10 )
											{
												if( sqllib->QueryWithoutResults( sqllib, command ) != 0 )
												{
													error = 1;
												}
												else
												{
													lastSQLname = dbentries[j].name;
												}
											}
											command = &script[ i+1 ];
										}
									}
									
									DEBUG("[SystemBase] Running script2 : %s from file: %s on database\n", command, scriptfname ); 
									if( strlen( command) > 10 )
									{
										if( sqllib->QueryWithoutResults( sqllib, command ) != 0 )
										{
											error = 1;
										}
										else
										{
											lastSQLname = dbentries[j].name;
										}
									}
								}
								FFree( script );
							}
							
							fclose( fp );
						}
						
						break;
					}
					
					if( error == 1 )
					{
						break;
					}
				}
				
				if( error == 1 )
				{
					break;
				}
				startUpdatePosition++;
			}
			
			// we must update which update was last
			startUpdatePosition--;
			
			if( orgStartUpdateposition != startUpdatePosition && lastSQLname != NULL )
			{
				DEBUG("[SystemBase] Last script will be updated in DB\n");
				snprintf( query, sizeof(query), "UPDATE `FGlobalVariables` SET `Value`='%d', `Date`='%lu', `Comment`='%s' WHERE `Key`='DB_VERSION'", startUpdatePosition, time(NULL), lastSQLname );
				sqllib->QueryWithoutResults( sqllib, query );
			}
			
			FFree( dbentries );
		}
		
		l->LibraryMYSQLDrop( l, sqllib );
	}
}

/**
 * Load all groups from FGroup table to FC
 *
 * @param sb pointer to SystemBase
 * @return list of groups
 */

UserGroup *LoadGroups( struct SystemBase *sb )
{
	UserGroup *groups = NULL;
	UserGroup *newGroup = NULL, *lastGroup = NULL;
	
	MYSQLLibrary *sqlLib = sb->LibraryMYSQLGet( sb );
	if( sqlLib != NULL )
	{
		int entries;
		groups = sqlLib->Load( sqlLib, GroupDesc, NULL, &entries );
		sb->LibraryMYSQLDrop( sb, sqlLib );
	}
	return groups;
}

/**
 * Load and mount all user doors
 *
 * @param l pointer to SystemBase
 * @param sqllib pointer to sql.library
 * @param usr pointer to user to which doors belong
 * @param force integer 0 = don't force 1 = force
 * @return 0 if everything went fine, otherwise error number
 */

int UserDeviceMount( SystemBase *l, MYSQLLibrary *sqllib, User *usr, int force )
{	
	Log( FLOG_INFO,  "[UserDeviceMount] Mount user device from Database\n");
	
	if( usr == NULL )
	{
		DEBUG("[UserDeviceMount] User parameter is empty\n");
		return -1;
	}
	
	if( usr->u_MountedDevs != NULL && force == 0 )
	{
		DEBUG("[UserDeviceMount] Devices are already mounted\n");
		return 0;
	}
	
	char temptext[ 1024 ];

	sqllib->SNPrintF( sqllib, temptext, sizeof(temptext) ,"\
		SELECT \
			`Name`, `Type`, `Server`, `Port`, `Path`, `Mounted`, `UserID`, `ID`\
		FROM `Filesystem` f\
		WHERE\
		(\
			f.UserID = '%ld' OR\
			f.GroupID IN (\
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
				WHERE \
					g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
					ug.UserID = '%ld'\
			)\
		)\
		AND f.Mounted = \'1\'", 
		usr->u_ID , usr->u_ID
	);
	DEBUG("[UserDeviceMount] Finding drives in DB\n");
	MYSQL_RES *res = sqllib->Query( sqllib, temptext );
	if( res == NULL )
	{
		Log( FLOG_ERROR,  "[UserDeviceMount] UserDeviceMount fail: database results = NULL\n");
		return 0;
	}
	DEBUG("[UserDeviceMount] Finding drives in DB no error during select:\n\n");
	
	if( pthread_mutex_lock( &l->sl_InternalMutex ) == 0 )
	{
		MYSQL_ROW row;
		while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
		{
			// Id, UserId, Name, Type, ShrtDesc, Server, Port, Path, Username, Password, Mounted

			DEBUG("[UserDeviceMount] \tFound database -> Name '%s' Type '%s', Server '%s', Port '%s', Path '%s', Mounted '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
		
			int mount = atoi( row[ 5 ] );
			int id = atol( row[ 7 ] );
			User *owner = NULL;

			struct TagItem tags[] = {
				{ FSys_Mount_Path,    (FULONG)row[ 4 ] },
				{ FSys_Mount_Server,  (FULONG)NULL },
				{ FSys_Mount_Port,    (FULONG)NULL },
				{ FSys_Mount_Type,    (FULONG)row[ 1 ] },
				{ FSys_Mount_Name,    (FULONG)row[ 0 ] },
				{ FSys_Mount_UserName, (FULONG)usr->u_Name },
				{ FSys_Mount_Owner,   (FULONG)owner },
				{ FSys_Mount_ID,      (FULONG)id },
				{ FSys_Mount_Mount,   (FULONG)mount },
				{ FSys_Mount_SysBase, (FULONG)SLIB },
				{ FSys_Mount_Visible, (FULONG)1 },     // Assume visible
				//{ FSys_Mount_Execute, (FULONG)NULL },  // Assume no executable
				{TAG_DONE, TAG_DONE}
			};

			pthread_mutex_unlock( &l->sl_InternalMutex );

			File *device = NULL;
			DEBUG("[UserDeviceMount] \tBefore mounting\n");
			int err = MountFS( l, (struct TagItem *)&tags, &device, usr );

			pthread_mutex_lock( &l->sl_InternalMutex );

			if( err != 0 && err != FSys_Error_DeviceAlreadyMounted )
			{
				Log( FLOG_ERROR,"[UserDeviceMount] \tCannot mount device, device '%s' will be unmounted. ERROR %d\n", row[ 0 ], err );
				if( mount == 1 )
				{
					//sprintf( temptext, "
					
					sqllib->SNPrintF( sqllib, temptext, sizeof(temptext), "\
						UPDATE Filesystem f SET `Mounted` = '0'\
						WHERE\
						(\
							f.UserID = '%ld' OR\
							f.GroupID IN (\
								SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g\
								WHERE \
									g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND\
									ug.UserID = '%ld'\
							)\
						)\
						AND LOWER(f.Name) = LOWER('%s')", 
						usr->u_ID, usr->u_ID, (char *)row[ 0 ] 
					);
					MYSQL_RES *resx = sqllib->Query( sqllib, temptext );
					if( resx != NULL )
					{
						sqllib->FreeResult( sqllib, resx );
					}
				}
			}
			else if( device )
			{
				device->f_Mounted = TRUE;
			}
			else
			{
				Log( FLOG_ERROR, "[UserDeviceMount] \tCannot set device mounted state. Device = NULL (%s).\n", row[0] );
			}	
		}	// going through all rows
		DEBUG( "[UserDeviceMount] Device mounted for user %s\n\n", usr->u_Name );

		sqllib->FreeResult( sqllib, res );

		usr->u_InitialDevMount = TRUE;

		pthread_mutex_unlock( &l->sl_InternalMutex );
	}
	
	return 0;
}

/**
 * Unmount user doors
 *
 * @param l pointer to SystemBase
 * @param sqllib pointer to sql.library
 * @param usr pointer to user to which doors belong
 * @return 0 if everything went fine, otherwise error number
 */

int UserDeviceUnMount( SystemBase *l, MYSQLLibrary *sqllib, User *usr )
{
	DEBUG("UserDeviceUnMount\n");
	if( usr != NULL )
	{
		if( usr->u_MountedDevs != NULL )
		{
			File *dev = usr->u_MountedDevs;
			File *remdev = dev;
			
			while( dev != NULL )
			{
				remdev = dev;
				dev = (File *)dev->node.mln_Succ;
				
				FHandler *handler = remdev->f_FSys;
				if( handler != NULL )
				{
					handler->UnMount( handler, remdev, usr );
				}
				
				FFree( remdev );
			}
		}
	}
	else
	{
		return 1;
	}
	return 0;
}

/**
 * Set pointer to FrriendCoreManager
 *
 * @param l pointer to SystemBase
 * @param lfcm pointer to FriendCoreManager
 */

void SetFriendCoreManager( SystemBase *l, FriendCoreManager *lfcm )
{
	if( l != NULL )
	{
		l->fcm = lfcm;
	}
}

/**
 * Run module
 *
 * @param l pointer to SystemBase
 * @param type type of module which will be used to make call
 * @param path path to module exe file
 * @param args additional parameters to module
 * @param pointer to integer where length of answer will be stored
 * @return string with answer from module
 */

char *RunMod( SystemBase *l, const char *type, const char *path, const char *args, unsigned long *length )
{
	char tmpQuery[ 255 ];
	int pathlen = strlen( path );
	char *results = NULL;

	EModule *lmod = l->sl_Modules;
	EModule *workmod = NULL;

	DEBUG("[SystemBase] Checking modules '%s'\n", type );

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
 * Close authentication module
 *
 * @param l pointer to SystemBase
 * @param uclose pointer to module which will closed
 */

void AuthModuleDrop( SystemBase *l, AuthMod *uclose )
{
}

/**
 * Get mysql.library from pool
 *
 * @param l pointer to SystemBase
 * @return pointer to mysql.library
 */

MYSQLLibrary *LibraryMYSQLGet( SystemBase *l )
{
	MYSQLLibrary *retlib = NULL;
	int i ;
	int timer = 0;
	int retries = 0;
	int usingSleep = 0;
	
	while( TRUE )
	{
		if( pthread_mutex_lock( &l->sl_ResourceMutex ) == 0 )
		{
			if( l->sqlpool[ l->MsqLlibCounter ].inUse == FALSE )
			{
				pthread_mutex_unlock( &l->sl_ResourceMutex );
			
				pthread_mutex_lock( &l->sl_ResourceMutex );
				retlib = l->sqlpool[l->MsqLlibCounter ].sqllib;
				if( retlib == NULL || retlib->con.sql_Con->status != MYSQL_STATUS_READY )
				{
					FERROR( "[LibraryMYSQLGet] We found a NULL pointer on slot %d!\n", l->MsqLlibCounter );
					// Increment and check
					if( ++l->MsqLlibCounter >= l->sqlpoolConnections ) l->MsqLlibCounter = 0;
					pthread_mutex_unlock( &l->sl_ResourceMutex );
					continue;
				}
				l->sqlpool[ l->MsqLlibCounter ].inUse = TRUE;
				if( l->sqlpool[ l->MsqLlibCounter ].sqllib->con.sql_Recconect == TRUE )
				{
					l->sqlpool[ l->MsqLlibCounter ].sqllib->Reconnect(  l->sqlpool[ l->MsqLlibCounter ].sqllib );
					l->sqlpool[ l->MsqLlibCounter ].sqllib->con.sql_Recconect = FALSE;
				}
			
				INFO( "[LibraryMYSQLGet] We found mysql library on slot %d.\n", l->MsqLlibCounter );
			
				// Increment and check
				if( ++l->MsqLlibCounter >= l->sqlpoolConnections ) l->MsqLlibCounter = 0;
				pthread_mutex_unlock( &l->sl_ResourceMutex );
				break;
			}
			else
			{
				pthread_mutex_unlock( &l->sl_ResourceMutex );
			}
		}
		
		timer++;
		if( timer >= l->sqlpoolConnections )
		{
			timer = 0;
			usleep( 20000 );
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
 * @param mclose pointer to mysql.library which will be returned to pool
 */

void LibraryMYSQLDrop( SystemBase *l, MYSQLLibrary *mclose )
{
	int i = 0;
	int closed = -1;
	
	for( ; i < l->sqlpoolConnections ; i++ )
	{
		if( l->sqlpool[ i ].sqllib == mclose )
		{
			pthread_mutex_lock( &l->sl_ResourceMutex );
			l->sqlpool[ i ].inUse = FALSE;
			pthread_mutex_unlock( &l->sl_ResourceMutex );
			closed = i;
		}
		
		if( l->sqlpool[ i ].inUse != FALSE )
		{
			DEBUG( "[SystemBase] Mysql slot %d is still in use\n", i );
		}
	}
	
	if( closed != -1 )
	{
		INFO( "[SystemBase] MYSQL slot %d was closed properly.\n", closed );
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

void LibraryApplicationDrop( SystemBase *l, ApplicationLibrary *aclose )
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
 * Get properties.library from SystemBase
 *
 * @param l pointer to SystemBase
 * @return pointer to properties.library
 */

PropertiesLibrary *LibraryPropertiesGet( SystemBase *l )
{
	if( l->PropLibCounter == 0 )
	{
		l->plib = (PropertiesLibrary *)LibraryOpen( l, "properties.library", 0 );
		if( l->plib == NULL )
		{
			DEBUG("[SystemBase] CANNOT OPEN properties.library!\n");
			return NULL;
		}
		DEBUG("[SystemBase] properties.library opened %p (count %d)!\n", l->plib, l->PropLibCounter );
		
		// We start on 1, just so that we leave one open until quitting (will be
		// closed when system deinits..)
		
		l->PropLibCounter = 1;
	}
	l->PropLibCounter++;

	return l->plib;
}

/**
 * Drop properties.library to pool
 *
 * @param l pointer to SystemBase
 * @param pclose pointer to properties.library which will be returned to pool
 */

void LibraryPropertiesDrop( SystemBase *l, PropertiesLibrary *pclose )
{
	if( l->PropLibCounter > 0 )
	{
		l->PropLibCounter--;
	}
	else if ( l->PropLibCounter == 0 )
	{
		DEBUG( "[SystemBase] Finally close properties.library\n" );
		LibraryClose( (struct Library *)l->plib );
		l->plib = NULL;
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
 * Drop z.library to pool
 *
 * @param l pointer to SystemBase
 * @param aclose pointer to z.library which will be returned to pool
 */

void LibraryZDrop( SystemBase *l, ZLibrary *closelib )
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
			DEBUG("[SystemBase] CANNOT OPEN image.library!\n");
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
 * @param aclose pointer to image.library which will be returned to pool
 */

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

/**
 * Get Sentinel User from System
 * 
 * @param l pointer to SystemBase
 * @return Sentinel user
 */

Sentinel* GetSentinelUser(SystemBase* l)
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
 * @param l pointer to SystemBase
 * @param usersession recipient of 
 * @param msg message which will be send
 * @param len length of the message
 * @return 0 if message was sent otherwise error number
 */

int WebSocketSendMessage( SystemBase *l, UserSession *usersession, char *msg, int len )
{
	unsigned char *buf;
	int bytes = 0;
	
	//DEBUG("\n\n\nWebSocketSendMessage start %p device %s\n", usersession, usersession->us_DeviceIdentity );
	
	//if( pthread_mutex_lock( &usersession->us_WSMutex ) == 0 )
	{
		buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( unsigned char ) );
		if( buf != NULL )
		{
			memcpy( buf + LWS_SEND_BUFFER_PRE_PADDING, msg,  len );
		
			DEBUG("[SystemBase] Writing to websockets, string '%s' size %d\n",msg, len );

			WebsocketClient *wsc = usersession->us_WSConnections;
			while( wsc != NULL )
			{
				DEBUG("[SystemBase] Writing to websockets, pointer to ws %p\n", wsc->wc_Wsi );
				if( wsc->wc_Wsi != NULL )
				{
					bytes += WebsocketWrite( wsc->wc_Wsi , buf + LWS_SEND_BUFFER_PRE_PADDING , len, LWS_WRITE_TEXT, usersession );
					//bytes += lws_write( wsc->wc_Wsi , buf + LWS_SEND_BUFFER_PRE_PADDING , len, LWS_WRITE_TEXT );
				}
				else
				{
					DEBUG("[SystemBase] User session do not have WS connection\n");
				}
				wsc = (WebsocketClient *)wsc->node.mln_Succ;
			}
		
			FFree( buf );
		}
		else
		{
			Log( FLOG_ERROR,"Cannot allocate memory for message\n");
			//pthread_mutex_unlock( &usersession->us_WSMutex );
			return 0;
		}
		//pthread_mutex_unlock( &usersession->us_WSMutex );
	}
	DEBUG("[SystemBase] WebSocketSendMessage end, wrote %d bytes\n", bytes );
	
	return bytes;
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
	
	//if( pthread_mutex_lock( &usersession->us_WSMutex ) == 0 )
	{
		buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len + LWS_SEND_BUFFER_POST_PADDING + 128+24, sizeof( unsigned char ) );
		if( buf != NULL )
		{
			memcpy( buf + LWS_SEND_BUFFER_PRE_PADDING, msg,  len );

			WebsocketClient *wsc = usersession->us_WSConnections;
		
			DEBUG("[SystemBase] Writing to websockets, string '%s' size %d ptr to websocket connection %p\n",msg, len, wsc );
		
			while( wsc != NULL )
			{
				DEBUG("[SystemBase] send message to user session %p, pointer to websocket connection %p\n", usersession, wsc->wc_Wsi );
				if( wsc->wc_Wsi != NULL )
				{
					//bytes += lws_write( wsc->wc_Wsi , buf + LWS_SEND_BUFFER_PRE_PADDING , len, LWS_WRITE_TEXT );
					bytes += WebsocketWrite( wsc->wc_Wsi , buf + LWS_SEND_BUFFER_PRE_PADDING , len, LWS_WRITE_TEXT, usersession );
				}//
				wsc = (WebsocketClient *)wsc->node.mln_Succ;
			}
		
			FFree( buf );
		}
		else
		{
			Log( FLOG_ERROR,"Cannot allocate memory for message\n");
		
			//pthread_mutex_unlock( &usersession->us_WSMutex );
		
			return 0;
		}
		//pthread_mutex_unlock( &usersession->us_WSMutex );
	}
	
	return bytes;
}

/**
 * Add websocket connection to user session
 *
 * @param l pointer to SystemBase
 * @param wsi pointer to libwebsockets
 * @param sessionid sessionid to which 
 * @param len length of the message
 * @return 0 if connection was added without problems otherwise error number
 */

int AddWebSocketConnection( SystemBase *l, struct lws *wsi, const char *sessionid, const char *authid, FCWSData *data )
{
	if( l->sl_USM == NULL )
	{
		return -1;
	}
	
	UserSession *actUserSess = NULL;
	char lsessionid[ DEFAULT_SESSION_ID_SIZE ];
	
	Log( FLOG_INFO, "[SystemBase] Addwebsocket connection. SessionID %s. Authid %s\n", sessionid, authid );
	
	if( authid != NULL )
	{
		MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );

		// Get authid from mysql
		if( sqllib != NULL )
		{
			char qery[ 1024 ];
			
			sqllib->SNPrintF( sqllib, qery,  sizeof(qery), \
				 "SELECT * FROM ( ( SELECT u.SessionID FROM FUserSession u, FUserApplication a WHERE a.AuthID=\"%s\" AND a.UserID = u.UserID LIMIT 1 ) \
				UNION ( SELECT u2.SessionID FROM FUserSession u2, Filesystem f WHERE f.Config LIKE \"%s%s%s\" AND u2.UserID = f.UserID LIMIT 1 ) ) z LIMIT 1",
				( char *)authid, "%", ( char *)authid, "%"
			);

			MYSQL_RES *res = sqllib->Query( sqllib, qery );
			if( res != NULL )
			{
				DEBUG("[SystemBase] Called %s\n",  qery );
				
				MYSQL_ROW row;
				if( ( row = sqllib->FetchRow( sqllib, res ) ) )
				{
					snprintf( lsessionid, sizeof(lsessionid), "%s", row[ 0 ] );
					sessionid = lsessionid;
				}
				sqllib->FreeResult( sqllib, res );
			}
			l->LibraryMYSQLDrop( l, sqllib );
		}
		DEBUG( "[SystemBase] Ok, SQL phase complete\n" );
	}
	
	actUserSess = USMGetSessionBySessionID( l->sl_USM, (char *)sessionid );
	
	if( actUserSess == NULL )
	{
		Log( FLOG_ERROR,"Cannot find user in session with sessionid %s\n", sessionid );
		return -1;
	}
	
	DEBUG("[SystemBase] AddWSCon session pointer %p\n", actUserSess );
	pthread_mutex_lock( &actUserSess->us_WSMutex );
	
	WebsocketClient *listEntry = actUserSess->us_WSConnections;
	while( listEntry != NULL )
	{
		DEBUG("[SystemBase] wsclientptr %p\n", listEntry );
		if( listEntry->wc_Wsi == wsi )
		{
			break;
		}
		listEntry = (WebsocketClient *)listEntry->node.mln_Succ;
	}
	
	DEBUG("[SystemBase] AddWSCon entry found %p\n", listEntry );
	
	if( listEntry != NULL )
	{
		INFO("[SystemBase] User already have this websocket connection\n");
		pthread_mutex_unlock( &actUserSess->us_WSMutex );
		return 1;
	}
	
	WebsocketClient *nwsc = FCalloc( 1, sizeof( WebsocketClient ) );
	if( nwsc != NULL )
	{
		DEBUG("[SystemBase] AddWSCon new connection created\n");
		nwsc->wc_Wsi = wsi;
		nwsc->node.mln_Succ = (MinNode *)actUserSess->us_WSConnections;
		actUserSess->us_WSConnections = nwsc;
		
		User *actUser = actUserSess->us_User;
		if( actUser != NULL )
		{
			Log( FLOG_INFO,"[SystemBase] WebSocket connection set for user %s  sessionid %s\n", actUser->u_Name, actUserSess->us_SessionID );

			INFO("[SystemBase] ADD WEBSOCKET CONNECTION TO USER %s\n\n",  actUser->u_Name );
		}
		else
		{
			FERROR("User sessions %s is not attached to user %lu\n", actUserSess->us_SessionID, actUserSess->us_UserID );
		}

		data->fcd_ActiveSession = actUserSess;
		data->fcd_WSClient  = nwsc;
		data->fcd_SystemBase = l;
		nwsc->wc_WebsocketsData = data;
	}
	else
	{
		Log( FLOG_ERROR,"Cannot allocate memory for WebsocketClient\n");
		pthread_mutex_unlock( &actUserSess->us_WSMutex );
		return 2;
	}
	pthread_mutex_unlock( &actUserSess->us_WSMutex );
	return 0;
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
	
	if( request->h_RequestSource == HTTP_SOURCE_HTTP_TO_WS )
	{
		DEBUG("[SystemBase] SendProcessMessage to WS: %s\n", data );
		
		PIDThread *pidt = (PIDThread *)request->h_PIDThread;
		char *sendbuf;
		int msglen = len+1024;
		
		if( ( sendbuf = FCalloc( msglen, sizeof( char ) ) ) != NULL )
		{
			int newmsglen = snprintf( sendbuf, msglen, "{\"type\":\"msg\", \"data\":{\"type\":\"%llu\",\"data\":{%.*s}}}", pidt->pt_PID, len, data );
			SystemBase *sb = (SystemBase *)pidt->pt_SB;
			
			DEBUG("[SystemBase] SendProcessMessage message '%s'\n", sendbuf );
			
			sb->WebSocketSendMessage( sb, pidt->pt_UserSession, sendbuf, newmsglen );
			
			FFree( sendbuf );
		}
	}
	else
	{
		DEBUG("SendProcessMessage end\n");
	}
	
	return 0;
}


