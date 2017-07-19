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

/** @file
 *
 *  Friend Core information system definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 14/10/2015
 */

#include "friendcore_manager.h"
#include <core/friend_core.h>
#include <ssh/ssh_server.h>
#include <hardware/network.h>
#include <properties/propertieslibrary.h>
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
	DEBUG("FriendCoreManagerNew\n");
	
	if( ( fcm = FCalloc( 1, sizeof( struct FriendCoreManager ) ) ) != NULL )
	{
		fcm->fcm_ServiceManager = ServiceManagerNew( fcm );
		FCM = fcm;
		//
		// Create FriendCoreID
		//
		
		char *id = GetSystemUniqueId();
		
		DEBUG("[FriendCoreManager] ID Generated\n");
		
		char temp[ FRIEND_CORE_MANAGER_ID_SIZE ];
		//SHA256_CTX ctx;
		
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

		{
			struct PropertiesLibrary *plib = NULL;
			Props *prop = NULL;
	
			if( ( plib = (struct PropertiesLibrary *)LibraryOpen( SLIB, "properties.library", 0 ) ) != NULL )
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
					fcm->fcm_Maxp = plib->ReadInt( prop, "Core:epollevents", EPOLL_MAX_EVENTS );
					fcm->fcm_Bufsize = plib->ReadInt( prop, "Core:networkbuffer", BUFFER_READ_SIZE );
					
					fcm->fcm_MaxpCom = plib->ReadInt( prop, "Core:epolleventscom", EPOLL_MAX_EVENTS_COMM );
					fcm->fcm_BufsizeCom = plib->ReadInt( prop, "Core:networkbuffercom", BUFFER_READ_SIZE_COMM );
					
					fcm->fcm_MaxpComRemote = plib->ReadInt( prop, "Core:epolleventscomremote", EPOLL_MAX_EVENTS_COMM );
					
					fcm->fcm_FCPort= plib->ReadInt( prop, "Core:port", FRIEND_CORE_PORT );
					fcm->fcm_WSPort = plib->ReadInt( prop, "Core:wsport", WEBSOCKET_PORT );
					fcm->fcm_ComPort = plib->ReadInt( prop, "Core:cport", FRIEND_COMMUNICATION_PORT );
					fcm->fcm_ComRemotePort = plib->ReadInt( prop, "Core:cremoteport", FRIEND_COMMUNICATION_REMOTE_PORT );
					
					fcm->fcm_SSLEnabled = plib->ReadInt( prop, "Core:SSLEnable", 0 );
					fcm->fcm_WSSSLEnabled = plib->ReadInt( prop, "Core:WSSSLEnable", 0 );
					fcm->fcm_SSLEnabledCommuncation = plib->ReadInt( prop, "Core:CSSLEnable", 0 );

					char *tptr  = plib->ReadString( prop, "LoginModules:modules", "" );
					if( tptr != NULL )
					{
						SLIB->sl_ModuleNames = StringDuplicate( tptr );
					}
					else
					{
						SLIB->sl_ModuleNames = StringDuplicate( " " );
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
				
				LibraryClose( ( struct Library *)plib );
			}
			
			fcm->fcm_FriendCores = FriendCoreNew( SLIB, fcm->fcm_SSLEnabled, fcm->fcm_FCPort, fcm->fcm_Maxp, fcm->fcm_Bufsize, "localhost" );
		}
		
		if( fcm->fcm_SSLEnabled == TRUE )
		{
			fcm->fcm_WSSSLEnabled = TRUE;
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
		Log(FLOG_INFO, "-----CommPort: %d\n", fcm->fcm_ComPort );
		Log(FLOG_INFO, "-----CommRemotePort: %d\n", fcm->fcm_ComRemotePort );
		Log(FLOG_INFO, "-----SSH_SERVER_PORT %s\n", SSH_SERVER_PORT );
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
		
		if( fcm->fcm_FriendCores == NULL )
		{
			free( fcm );
			Log( FLOG_PANIC, "Cannot create FriendCore!\n");
			return NULL;
		}
		
		fcm->fcm_FCI = FriendCoreInfoNew( fcm );
		
		fcm->fcm_Shutdown = FALSE;
		
		if( ( fcm->fcm_WebSocket = WebSocketNew( SLIB,  fcm->fcm_WSPort, fcm->fcm_WSSSLEnabled ) ) != NULL )
		{
			WebSocketStart( fcm->fcm_WebSocket );
		}
		else
		{
			Log( FLOG_FATAL, "Cannot launch websocket server\n");
		}
		
		//usleep( 100000 );
		
		SLIB->fcm = fcm;
		fcm->fcm_SB = SLIB;
		
		//usleep( 100000 );
		Log( FLOG_INFO,"Start SSH console\n");
		
		fcm->fcm_SSHServer = SSHServerNew( SLIB );
		
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

		// wait, be sure that services started
		//usleep( 5000000 );
	}
	Log( FLOG_INFO,"FriendCoreManager Created\n");
	
	return fcm;
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
		CommServiceRemoteDelete( fcm->fcm_CommServiceRemote );
		DEBUG("FriendCoreManager Close client\n");
		CommServiceDelete( fcm->fcm_CommService );
		DEBUG("FriendCoreManager Close client\n");
		//CommServiceDelete( fcm->fcm_CommServiceClient );
		DEBUG("FriendCoreManager Close server\n");
		//CommServiceDelete( fcm->fcm_CommServiceServer );
		
		DEBUG("Closing connections : Outgoing\n");
		
		if( fcm->fcm_WebSocket != NULL )
		{
			WebSocketDelete( fcm->fcm_WebSocket );
			fcm->fcm_WebSocket = NULL;
		}
		
		DEBUG("FriendCoreManager Shutdown\n");
		FriendCoreShutdown( fcm->fcm_FriendCores );
		
		DEBUG("FriendCoreManager shutdown finished\n");
		
		DEBUG("FriendCoreManager Close services\n");
		if( fcm->fcm_ServiceManager != NULL )
		{
			ServiceManagerDelete( fcm->fcm_ServiceManager );
		}
		
		DEBUG("FriendCoreManager Close SSH Server\n");
		SSHServerDelete( fcm->fcm_SSHServer );
		
		DEBUG("FriendCoreManager Close FriendCoreInfo\n");
		if( fcm->fcm_FCI != NULL )
		{
			FriendCoreInfoDelete( fcm->fcm_FCI );
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


