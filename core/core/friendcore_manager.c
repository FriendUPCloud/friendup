/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 *  Friend Core information system definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 14/10/2015
 * 
 * \defgroup FriendCoreManager Friend Core Manager
 * \ingroup FriendCore 
 * @{
 */

#include "friendcore_manager.h"
#include <core/friend_core.h>
#include <ssh/ssh_server.h>
#include <hardware/network.h>
#include <system/systembase.h>
#include <hardware/machine_info.h>
#include <openssl/rand.h>

//
// currently Friend can create only one core
//

void *FCM;

/**
* Mutex buffer for ssl locking
*/

static pthread_mutex_t *ssl_mutex_buf = NULL;

/**
* Static locking function.
*
* @param mode identifier of the mutex mode to use
* @param n number of the mutex to use
* @param file not used
* @param line not used
*/

static void ssl_locking_function( int mode, int n, const char *file __attribute__((unused)), int line __attribute__((unused)))
{ 
	if( mode & CRYPTO_LOCK )
	{
		FRIEND_MUTEX_LOCK( &ssl_mutex_buf[ n ] );
	}
	else
	{
		FRIEND_MUTEX_UNLOCK( &ssl_mutex_buf[ n ] );
	}
}

/**
* Static ID function.
*
* @return function return thread ID as unsigned long
*/

static unsigned long ssl_id_function( void ) 
{
	return ( ( unsigned long )pthread_self() );
}

//
// BTW we should have one instance of class what is makeing connection and then it should spread work to cores
//

/**
 * Create new FriendCoreManager
 *
 * @return FriendCoreManager
 */

FriendCoreManager *FriendCoreManagerNew()
{
	FriendCoreManager *fcm = NULL;
	DEBUG("[FriendCoreManager] new\n");
	
	if( ( fcm = FCalloc( 1, sizeof( struct FriendCoreManager ) ) ) != NULL )
	{
		// Static locks callbacks
		SSL_library_init();
		// Static locks buffer
		ssl_mutex_buf = FCalloc( CRYPTO_num_locks(), sizeof( pthread_mutex_t ) );
		if( ssl_mutex_buf == NULL)
		{ 
			LOG( FLOG_PANIC, "[FriendCoreNew] Failed to allocate ssl mutex buffer.\n" );
			FFree( fcm );
			return NULL; 
		} 
	
		int i; for( i = 0; i < CRYPTO_num_locks(); i++ )
		{ 
			pthread_mutex_init( &ssl_mutex_buf[ i ], NULL );
		}
	
		OpenSSL_add_all_algorithms();
	
		// Load the error strings for SSL & CRYPTO APIs 
		SSL_load_error_strings();
		
		// Setup static locking.
		CRYPTO_set_locking_callback( ssl_locking_function );
		CRYPTO_set_id_callback( ssl_id_function );
	
		RAND_load_file( "/dev/urandom", 1024 );
		
		//
		// Create FriendCoreID
		//
		
		char *id = GetSystemUniqueId();
		
		DEBUG("[FriendCoreManager] ID Generated\n");
		
		char temp[ FRIEND_CORE_MANAGER_ID_SIZE ];
		{
			int i = 0;
			for( ; i < (int)FRIEND_CORE_MANAGER_ID_SIZE ; i++ )
			{
				temp[i] = 0;
			}
		}
	
		if( getMacAddress( temp ) == 0 )
		{
			
		}

		//struct hostent *he = gethostbyname( "localhost" );
		strncpy( fcm->fcm_ID, temp, 12 );
		if( id != NULL )
		{
			strncat( fcm->fcm_ID, id, (FRIEND_CORE_MANAGER_ID_SIZE-(12+1)) );
			FFree( id );
		}
		else
		{
			strcat( fcm->fcm_ID, "error" );
		}

		for( i=0 ; i<FRIEND_CORE_MANAGER_ID_SIZE; i++ )
		{
			if( fcm->fcm_ID[i ] == 0 )
			{
				fcm->fcm_ID[ i ] = '0';
			}
		}
		fcm->fcm_ID[ FRIEND_CORE_MANAGER_ID_SIZE-1 ] = 0;

		//
		// create services
		//

		fcm->fcm_FCPort = FRIEND_CORE_PORT;
		fcm->fcm_ComPort = FRIEND_COMMUNICATION_PORT;
		fcm->fcm_ComRemotePort = FRIEND_COMMUNICATION_REMOTE_PORT;
		fcm->fcm_WSPort = WEBSOCKET_PORT;
		fcm->fcm_Maxp = EPOLL_MAX_EVENTS;
		fcm->fcm_Bufsize = BUFFER_READ_SIZE;
		fcm->fcm_MaxpCom =  EPOLL_MAX_EVENTS_COMM;
		fcm->fcm_MaxpComRemote = EPOLL_MAX_EVENTS_COMM_REM;
		fcm->fcm_BufsizeCom = BUFFER_READ_SIZE_COMM;

		fcm->fcm_SSLEnabled = FALSE;
		fcm->fcm_WSSSLEnabled = FALSE;
		fcm->fcm_SSLEnabledCommuncation = FALSE;
		fcm->fcm_DisableWS = FALSE;
		
		fcm->fcm_NodeIDGenerator = 2;
		
		fcm->fcm_DisableMobileWS = 0;
		fcm->fcm_DisableExternalWS = 0;
		fcm->fcm_WSExtendedDebug = 0;
		fcm->fcm_WSTimeout = 30;
		fcm->fcm_WSka_time = 0;
		fcm->fcm_WSka_probes = 0;
		fcm->fcm_WSka_interval = 0;
		
		Props *prop = NULL;
		PropertiesInterface *plib = &(SLIB->sl_PropertiesInterface);
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
				fcm->fcm_Maxp = plib->ReadIntNCS( prop, "core:epollevents", EPOLL_MAX_EVENTS );
				fcm->fcm_Bufsize = plib->ReadIntNCS( prop, "core:networkbuffer", BUFFER_READ_SIZE );
				
				fcm->fcm_MaxpCom = plib->ReadIntNCS( prop, "core:epolleventscom", EPOLL_MAX_EVENTS_COMM );
				fcm->fcm_BufsizeCom = plib->ReadIntNCS( prop, "core:networkbuffercom", BUFFER_READ_SIZE_COMM );
				
				fcm->fcm_MaxpComRemote = plib->ReadIntNCS( prop, "core:epolleventscomremote", EPOLL_MAX_EVENTS_COMM );
				
				fcm->fcm_FCPort= plib->ReadIntNCS( prop, "core:port", FRIEND_CORE_PORT );
				fcm->fcm_WSPort = plib->ReadIntNCS( prop, "core:wsport", WEBSOCKET_PORT );
				fcm->fcm_WSMobilePort = plib->ReadIntNCS( prop, "core:wsmobileport", WEBSOCKET_MOBILE_PORT );
				fcm->fcm_WSNotificationPort = plib->ReadIntNCS( prop, "core:wsnotificationport", WEBSOCKET_NOTIFICATION_PORT );
				fcm->fcm_ComPort = plib->ReadIntNCS( prop, "core:communicationPort", FRIEND_COMMUNICATION_PORT );
				fcm->fcm_ComRemotePort = plib->ReadIntNCS( prop, "core:remotecommunicationport", FRIEND_COMMUNICATION_REMOTE_PORT );
				
				fcm->fcm_SSLEnabled = plib->ReadIntNCS( prop, "core:sslenable", 0 );
				fcm->fcm_WSSSLEnabled = plib->ReadIntNCS( prop, "core:wssslenable", 0 );
				fcm->fcm_SSLEnabledCommuncation = plib->ReadIntNCS( prop, "core:communicationsslenable", 1 );
				fcm->fcm_ClusterMaster = plib->ReadIntNCS( prop, "core:clustermaster", 0 );
				
				fcm->fcm_DisableWS = plib->ReadIntNCS( prop, "core:disablews", 0 );
				fcm->fcm_DisableMobileWS = plib->ReadIntNCS( prop, "core:disablemobilews", 0 );
				fcm->fcm_DisableExternalWS = plib->ReadIntNCS( prop, "core:disableexternalws", 0 );
				fcm->fcm_WSExtendedDebug = plib->ReadIntNCS( prop, "core:wsextendeddebug", 0 );
				fcm->fcm_WSTimeout = plib->ReadIntNCS( prop, "core:wstimeout", 30 );
				fcm->fcm_WSka_time = plib->ReadIntNCS( prop, "core:katime", 0 );
				fcm->fcm_WSka_probes = plib->ReadIntNCS( prop, "core:kaprobes", 0 );
				fcm->fcm_WSka_interval = plib->ReadIntNCS( prop, "core:kainterval", 0 );
				
				char *tptr  = plib->ReadStringNCS( prop, "LoginModules:modules", "" );
				if( tptr != NULL )
				{
					SLIB->sl_ModuleNames = StringDuplicate( tptr );
				}
				else
				{
					SLIB->sl_ModuleNames = StringDuplicate( " " );
				}
				
				tptr  = plib->ReadStringNCS( prop, "Core:sshrsakey", NULL );
				if( tptr != NULL )
				{
					fcm->fcm_SSHRSAKey = StringDuplicate( tptr );
				}
				
				tptr  = plib->ReadStringNCS( prop, "Core:sshdsakey", NULL );
				if( tptr != NULL )
				{
					fcm->fcm_SSHDSAKey = StringDuplicate( tptr );
				}
				
				/*
				if( SLIB->sl_ActiveModuleName != NULL )
				{
					FFree( SLIB->sl_ActiveModuleName );
				}
				
				tptr  = plib->ReadString( prop, "LoginModules:use", "fcdb.authmod" );
				if( tptr != NULL )
				{
					SLIB->sl_ActiveModuleName = StringDuplicate( tptr );
				}
				else
				{
					SLIB->sl_ActiveModuleName = StringDuplicate( "fcdb.authmod" );
				}*/
				
				plib->Close( prop );
			}
		}
		
		FCM = fcm;
		
		fcm->fcm_ServiceManager = ServiceManagerNew( fcm );
	}
	return fcm;
}

/**
 * Initialize FriendCoreManager
 *
 * @param fcm pointer to FriendCoreManager
 */

int FriendCoreManagerInit( FriendCoreManager *fcm )
{
	if( fcm != NULL )
	{
		if( fcm->fcm_SSLEnabled == 1 )
		{
			// if http works on SSL, WS must work on SSL too
			fcm->fcm_WSSSLEnabled = 1;
		}
		
		Log(FLOG_INFO, "------------------------------------------------------\n");
		Log(FLOG_INFO, "-----FC build: %s\n", APPVERSION );
		Log(FLOG_INFO, "-----FC id: %128s\n", fcm->fcm_ID  );
		Log(FLOG_INFO, "-----FC launched with options\n");
		Log(FLOG_INFO, "-----Cache files: %d\n", SLIB->sl_CacheFiles );
#ifdef USE_WORKERS		
		Log(FLOG_INFO, "-----Workers: %d\n", SLIB->sl_WorkerManager->wm_MaxWorkers );
#endif
		Log(FLOG_INFO, "-----HTTP SSL enabled: %d\n", fcm->fcm_SSLEnabled );
		Log(FLOG_INFO, "-----WS SSL enabled: %d\n", fcm->fcm_WSSSLEnabled );
		Log(FLOG_INFO, "-----Communication SSL enabled: %d\n", fcm->fcm_SSLEnabledCommuncation );
		Log(FLOG_INFO, "-----FCPort: %d\n", fcm->fcm_FCPort );
		
		Log(FLOG_INFO, "-----WSNotificationPort: %d\n", fcm->fcm_WSNotificationPort );
		Log(FLOG_INFO, "-----CommPort: %d\n", fcm->fcm_ComPort );
		Log(FLOG_INFO, "-----CommRemotePort: %d\n", fcm->fcm_ComRemotePort );
		Log(FLOG_INFO, "-----SSH_SERVER_PORT %s\n", SSH_SERVER_PORT );
		Log(FLOG_INFO, "-----SQL connections: %d\n", SLIB->sqlpoolConnections );
		Log(FLOG_INFO, "-----UserFileShareCache (per drive): %ld\n", SLIB->sl_USFCacheMax );
		Log(FLOG_INFO, "-----Cluster Master: %d\n", fcm->fcm_ClusterMaster );
		Log(FLOG_INFO, "-----UserSession timeout: %d\n", SLIB->sl_RemoveSessionsAfterTime );
		
		Log(FLOG_INFO, "-----WSPort: %d\n", fcm->fcm_WSPort );
		Log(FLOG_INFO, "-----WS ka_time: %d\n", fcm->fcm_WSka_time );
		Log(FLOG_INFO, "-----WS ka_probes: %d\n", fcm->fcm_WSka_probes );
		Log(FLOG_INFO, "-----WS ka_interval: %d\n", fcm->fcm_WSka_interval );
		
		if( (SLIB->l_HttpCompressionContent & HTTP_COMPRESSION_DEFLATE ) == HTTP_COMPRESSION_DEFLATE )
		{
			Log(FLOG_INFO, "-----Http deflate compression: on\n" );
		}
		if( (SLIB->l_HttpCompressionContent & HTTP_COMPRESSION_BZIP ) == HTTP_COMPRESSION_BZIP )
		{
			Log(FLOG_INFO, "-----Http bzip compression: on\n" );
		}
		/*
		if( SLIB != NULL && SLIB->sl_ActiveAuthModule != NULL )
		{
			Log(FLOG_INFO, "-----LoginModule %s\n", SLIB->sl_ActiveAuthModule->am_Name );
		}
		else
		{
			Log(FLOG_INFO, "-----LoginModule %s\n", "No module detected" );
		}
		Log(FLOG_INFO, "-----LoginModule for login page %s\n", SLIB->sl_ActiveModuleName );
		*/
		Log(FLOG_INFO, "------------------------------------------------------\n");
		
		fcm->fcm_FriendCores = FriendCoreNew( SLIB, fcm->fcm_CoreIDGenerator++, fcm->fcm_SSLEnabled, fcm->fcm_FCPort, fcm->fcm_Maxp, fcm->fcm_Bufsize, "localhost" );
		
		if( fcm->fcm_SSLEnabled == TRUE )
		{
			fcm->fcm_WSSSLEnabled = TRUE;
		}
		
		if( fcm->fcm_FriendCores == NULL )
		{
			FFree( fcm );
			Log( FLOG_PANIC, "Cannot create FriendCore!\n");
			return 1;
		}
		
		fcm->fcm_FCI = FriendCoreInfoNew( SLIB );
		
		fcm->fcm_Shutdown = FALSE;
	}
	Log( FLOG_INFO,"FriendCoreManager Initialized\n");
	
	return 0;
}

int FriendCoreManagerInitServices( FriendCoreManager *fcm )
{
	if( fcm->fcm_DisableWS != TRUE )
	{
		if( ( fcm->fcm_WebSocket = WebSocketNew( SLIB, fcm->fcm_WSPort, fcm->fcm_WSSSLEnabled, WEBSOCKET_TYPE_BROWSER, fcm->fcm_WSExtendedDebug, fcm->fcm_WSTimeout, fcm->fcm_WSka_time, fcm->fcm_WSka_probes, fcm->fcm_WSka_interval ) ) != NULL )
		{
			WebSocketStart( fcm->fcm_WebSocket );
		}
		else
		{
			Log( FLOG_FATAL, "Cannot launch websocket server\n");
			return -1;
		}
		
		if( fcm->fcm_DisableExternalWS == 0 )
		{
			if( ( fcm->fcm_WebSocketNotification = WebSocketNew( SLIB, fcm->fcm_WSNotificationPort, FALSE, WEBSOCKET_TYPE_EXTERNAL, fcm->fcm_WSExtendedDebug, fcm->fcm_WSTimeout, fcm->fcm_WSka_time, fcm->fcm_WSka_probes, fcm->fcm_WSka_interval ) ) != NULL )
			{
				WebSocketStart( fcm->fcm_WebSocketNotification );
			}
			else
			{
				Log( FLOG_FATAL, "Cannot launch websocket server\n");
				return -1;
			}
		}
	}

	SLIB->fcm = fcm;
	fcm->fcm_SB = SLIB;
	
	Log( FLOG_INFO,"Start SSH console\n");

#ifdef ENABLE_SSH
	fcm->fcm_SSHServer = SSHServerNew( SLIB, fcm->fcm_SSHRSAKey, fcm->fcm_SSHDSAKey );
#endif
	
	fcm->fcm_Shutdown = FALSE;
	
#ifdef COMMUNICATION_SERVICE
	fcm->fcm_CommService = CommServiceNew( fcm->fcm_ComPort, fcm->fcm_SSLEnabledCommuncation, SLIB, fcm->fcm_MaxpCom, fcm->fcm_BufsizeCom );
	
	if( fcm->fcm_CommService )
	{
		CommServiceStart( fcm->fcm_CommService );
	}
#endif

#ifdef COMMUNICATION_REM_SERVICE
	fcm->fcm_CommServiceRemote = CommServiceRemoteNew( fcm->fcm_ComRemotePort, fcm->fcm_SSLEnabledCommuncation, SLIB, fcm->fcm_MaxpComRemote );
	
	if( fcm->fcm_CommServiceRemote )
	{
		CommServiceRemoteStart( fcm->fcm_CommServiceRemote );
	}
#endif
	
	return 0;
}

/**
 * FriendCoreManager destructor
 *
 * @param fcm pointer to FriendCoreManager
 */

void FriendCoreManagerDelete( FriendCoreManager *fcm )
{
	Log( FLOG_INFO,"FriendCoreManager Delete\n");
	if( fcm != NULL )
	{
#ifdef COMMUNICATION_REM_SERVICE
		DEBUG("[FriendCoreManager] Close remote communcation service\n");
		if( fcm->fcm_CommServiceRemote != NULL )
		{
			CommServiceRemoteDelete( fcm->fcm_CommServiceRemote );
			fcm->fcm_CommServiceRemote = NULL;
		}
#endif
#ifdef COMMUNICATION_SERVICE
		DEBUG("[FriendCoreManager] Close communication service\n");
		if( fcm->fcm_CommService != NULL )
		{
			CommServiceDelete( fcm->fcm_CommService );
			fcm->fcm_CommService = NULL;
		}
#endif
		
		DEBUG("[FriendCoreManager] Closing websockets notification channel\n");
		
		if( fcm->fcm_WebSocketNotification != NULL )
		{
			WebSocketDelete( fcm->fcm_WebSocketNotification );
			fcm->fcm_WebSocketNotification = NULL;
		}
		
		DEBUG("[FriendCoreManager] Closing WS\n");
		if( fcm->fcm_WebSocket != NULL )
		{
			WebSocketDelete( fcm->fcm_WebSocket );
			fcm->fcm_WebSocket = NULL;
		}
		
		DEBUG("[FriendCoreManager] Shutdown\n");
		if( fcm->fcm_FriendCores != NULL )
		{
			FriendCoreShutdown( fcm->fcm_FriendCores );
			fcm->fcm_FriendCores = NULL;
		}
		
		DEBUG("[FriendCoreManager] shutdown finished\n");
		
		DEBUG("[FriendCoreManager] Close services\n");
		if( fcm->fcm_ServiceManager != NULL )
		{
			ServiceManagerDelete( fcm->fcm_ServiceManager );
			fcm->fcm_ServiceManager = NULL;
		}
		
		DEBUG("[FriendCoreManager] Close SSH Server\n");
		if( fcm->fcm_SSHServer != NULL )
		{
#ifdef ENABLE_SSH
			SSHServerDelete( fcm->fcm_SSHServer );
			fcm->fcm_SSHServer = NULL;
#endif
		}
		
		DEBUG("[FriendCoreManager] Close FriendCoreInfo\n");
		if( fcm->fcm_FCI != NULL )
		{
			FriendCoreInfoDelete( fcm->fcm_FCI );
			fcm->fcm_FCI = NULL;
		}
		
		DEBUG("[FriendCoreManager] Close ConnectionInfo\n");
		// delete all informations about connections
		//ConnectionInfoDeleteAll( fcm->fcm_ConnectionsInformation );
		DEBUG("[FriendCoreManager] Close cluster nodes handling\n");
		// delete information about FC in ClusterNode
		if( fcm->fcm_ClusterNodes != NULL )
		{
			ClusterNodeDeleteAll( fcm->fcm_ClusterNodes );
			fcm->fcm_ClusterNodes = NULL;
		}

		if( fcm->fcm_SSHRSAKey != NULL )
		{
			FFree( fcm->fcm_SSHRSAKey );
		}
		
		if( fcm->fcm_SSHDSAKey != NULL )
		{
			FFree( fcm->fcm_SSHDSAKey );
		}
			
		if( ssl_mutex_buf != NULL )
		{
			FFree( ssl_mutex_buf );
			ssl_mutex_buf = NULL;
		}
		
		ERR_free_strings( );
		
		EVP_cleanup( );
		SSL_COMP_free_compression_methods();
		COMP_zlib_cleanup();
		//ERR_remove_state(0);
		//ERR_remove_thread_state(NULL);

		ERR_free_strings();
		CRYPTO_cleanup_all_ex_data();
		
		FFree( fcm );
	}
	
	Log( FLOG_INFO, "FriendCoreManager Closed\n");
}

/**
 * Run FriendCores
 *
 * @param fcm pointer to FriendCoreManager
 * @return 0 when all cores were launched, otherwise error number
 */

FULONG FriendCoreManagerRun( FriendCoreManager *fcm )
{
	// This will block until the core is shut down
	Log( FLOG_INFO, "FriendCoreManager Run\n");
	
	if( fcm != NULL )
	{
		if( fcm->fcm_FriendCores )
		{
			fcm->fcm_FriendCoresRunning++;
			FriendCoreRun( fcm->fcm_FriendCores );
			fcm->fcm_FriendCoresRunning--;
		}
	}

	return 0;
}

/**
 * shutdown FriendCoreManager
 *
 * @param fcm pointer to FriendCoreManager
 */

void FriendCoreManagerShutdown( FriendCoreManager *fcm )
{
	if( fcm != NULL )
	{
		FriendCoreInstance *fc = fcm->fcm_FriendCores;
		while( fc != NULL )
		{
			fc->fci_Shutdown = TRUE;
			write( fc->fci_WriteCorePipe, "q", 1 );
			
			fc = (FriendCoreInstance *) fc->node.mln_Succ;
		}
	}
}

/**@}*/
// End of FriendCoreManager Doxygen group

