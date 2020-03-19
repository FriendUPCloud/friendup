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
//#include <interface/properties_interface.h>
#include <system/systembase.h>
#include <hardware/machine_info.h>

//
// currently Friend can create only one core
//

void *FCM;

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
		FCM = fcm;
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

		int i;
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
		
		Props *prop = NULL;
		PropertiesInterface *plib = &(SLIB->sl_PropertiesInterface);
		//if( ( plib = (struct PropertiesLibrary *)LibraryOpen( SLIB, "properties.library", 0 ) ) != NULL )
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
				fcm->fcm_SSLEnabledCommuncation = plib->ReadIntNCS( prop, "core:communicationsslenable", 0 );
				fcm->fcm_ClusterMaster = plib->ReadIntNCS( prop, "core:clustermaster", 0 );
				
				fcm->fcm_DisableWS = plib->ReadIntNCS( prop, "core:disablews", 0 );
				fcm->fcm_DisableMobileWS = plib->ReadIntNCS( prop, "core:disablemobilews", 0 );
				fcm->fcm_DisableExternalWS = plib->ReadIntNCS( prop, "core:disableexternalws", 0 );
				fcm->fcm_WSExtendedDebug = plib->ReadIntNCS( prop, "core:wsextendeddebug", 0 );
				
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
		// Static locks callbacks
		SSL_library_init();
		
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
		Log(FLOG_INFO, "-----HTTP SSL enabled: %d\n", fcm->fcm_SSLEnabled );
		Log(FLOG_INFO, "-----WS SSL enabled: %d\n", fcm->fcm_WSSSLEnabled );
		Log(FLOG_INFO, "-----Communication SSL enabled: %d\n", fcm->fcm_SSLEnabledCommuncation );
		Log(FLOG_INFO, "-----FCPort: %d\n", fcm->fcm_FCPort );
		Log(FLOG_INFO, "-----WSPort: %d\n", fcm->fcm_WSPort );
		Log(FLOG_INFO, "-----WSMobilePort: %d\n", fcm->fcm_WSMobilePort );
		Log(FLOG_INFO, "-----WSNotificationPort: %d\n", fcm->fcm_WSNotificationPort );
		Log(FLOG_INFO, "-----CommPort: %d\n", fcm->fcm_ComPort );
		Log(FLOG_INFO, "-----CommRemotePort: %d\n", fcm->fcm_ComRemotePort );
		Log(FLOG_INFO, "-----SSH_SERVER_PORT %s\n", SSH_SERVER_PORT );
		Log(FLOG_INFO, "-----SQL connections: %d\n", SLIB->sqlpoolConnections );
		Log(FLOG_INFO, "-----UserFileShareCache (per drive): %ld\n", SLIB->sl_USFCacheMax );
		Log(FLOG_INFO, "-----Cluster Master: %d\n", fcm->fcm_ClusterMaster );
		Log(FLOG_INFO, "-----UserSession timeout: %d\n", SLIB->sl_RemoveSessionsAfterTime );
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
		
		/*
		if( fcm->fcm_DisableWS != TRUE )
		{
			if( ( fcm->fcm_WebSocket = WebSocketNew( SLIB, fcm->fcm_WSPort, fcm->fcm_WSSSLEnabled, 0, fcm->fcm_WSExtendedDebug ) ) != NULL )
			{
				WebSocketStart( fcm->fcm_WebSocket );
			}
			else
			{
				Log( FLOG_FATAL, "Cannot launch websocket server\n");
				return -1;
			}
			
			if( fcm->fcm_DisableMobileWS == 0 )
			{
				if( ( fcm->fcm_WebSocketMobile = WebSocketNew( SLIB, fcm->fcm_WSMobilePort, fcm->fcm_WSSSLEnabled, 1, fcm->fcm_WSExtendedDebug ) ) != NULL )
				{
					WebSocketStart( fcm->fcm_WebSocketMobile );
				}
				else
				{
					Log( FLOG_FATAL, "Cannot launch websocket server\n");
					return -1;
				}
			}
			
			if( fcm->fcm_DisableExternalWS == 0 )
			{
				if( ( fcm->fcm_WebSocketNotification = WebSocketNew( SLIB, fcm->fcm_WSNotificationPort, fcm->fcm_WSSSLEnabled, 2, fcm->fcm_WSExtendedDebug ) ) != NULL )
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
		
		fcm->fcm_SSHServer = SSHServerNew( SLIB, fcm->fcm_SSHRSAKey, fcm->fcm_SSHDSAKey );
		
		fcm->fcm_Shutdown = FALSE;
		
		fcm->fcm_CommService = CommServiceNew( fcm->fcm_ComPort, fcm->fcm_SSLEnabledCommuncation, SLIB, fcm->fcm_MaxpCom, fcm->fcm_BufsizeCom );
		
		if( fcm->fcm_CommService )
		{
			CommServiceStart( fcm->fcm_CommService );
		}
		
		fcm->fcm_CommServiceRemote = CommServiceRemoteNew( fcm->fcm_ComRemotePort, fcm->fcm_SSLEnabledCommuncation, SLIB, fcm->fcm_MaxpComRemote );
		
		if( fcm->fcm_CommServiceRemote )
		{
			CommServiceRemoteStart( fcm->fcm_CommServiceRemote );
		}
		*/
	}
	Log( FLOG_INFO,"FriendCoreManager Initialized\n");
	
	return 0;
}

int FriendCoreManagerInitServices( FriendCoreManager *fcm )
{
	if( fcm->fcm_DisableWS != TRUE )
		{
			if( ( fcm->fcm_WebSocket = WebSocketNew( SLIB, fcm->fcm_WSPort, fcm->fcm_WSSSLEnabled, 0, fcm->fcm_WSExtendedDebug ) ) != NULL )
			{
				WebSocketStart( fcm->fcm_WebSocket );
			}
			else
			{
				Log( FLOG_FATAL, "Cannot launch websocket server\n");
				return -1;
			}
			/*
			if( fcm->fcm_DisableMobileWS == 0 )
			{
				if( ( fcm->fcm_WebSocketMobile = WebSocketNew( SLIB, fcm->fcm_WSMobilePort, fcm->fcm_WSSSLEnabled, 1, fcm->fcm_WSExtendedDebug ) ) != NULL )
				{
					WebSocketStart( fcm->fcm_WebSocketMobile );
				}
				else
				{
					Log( FLOG_FATAL, "Cannot launch websocket server\n");
					return -1;
				}
			}
			*/
			
			if( fcm->fcm_DisableExternalWS == 0 )
			{
				if( ( fcm->fcm_WebSocketNotification = WebSocketNew( SLIB, fcm->fcm_WSNotificationPort, fcm->fcm_WSSSLEnabled, 2, fcm->fcm_WSExtendedDebug ) ) != NULL )
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
		
		fcm->fcm_CommService = CommServiceNew( fcm->fcm_ComPort, fcm->fcm_SSLEnabledCommuncation, SLIB, fcm->fcm_MaxpCom, fcm->fcm_BufsizeCom );
		
		if( fcm->fcm_CommService )
		{
			CommServiceStart( fcm->fcm_CommService );
		}
		
		fcm->fcm_CommServiceRemote = CommServiceRemoteNew( fcm->fcm_ComRemotePort, fcm->fcm_SSLEnabledCommuncation, SLIB, fcm->fcm_MaxpComRemote );
		
		if( fcm->fcm_CommServiceRemote )
		{
			CommServiceRemoteStart( fcm->fcm_CommServiceRemote );
		}
		
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
		DEBUG("[FriendCoreManager] Close remote communcation service\n");
		if( fcm->fcm_CommServiceRemote != NULL )
		{
			CommServiceRemoteDelete( fcm->fcm_CommServiceRemote );
			fcm->fcm_CommServiceRemote = NULL;
		}
		DEBUG("[FriendCoreManager] Close communication service\n");
		if( fcm->fcm_CommService != NULL )
		{
			CommServiceDelete( fcm->fcm_CommService );
			fcm->fcm_CommService = NULL;
		}
		
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
		
		DEBUG("[FriendCoreManager] Closing moble WS\n");
		if( fcm->fcm_WebSocketMobile != NULL )
		{
			WebSocketDelete( fcm->fcm_WebSocketMobile );
			fcm->fcm_WebSocketMobile = NULL;
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

