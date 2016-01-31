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

#include "friendcore_manager.h"
#include <core/friend_core.h>
#include <ssh/ssh_server.h>
#include <hardware/network.h>
#include <properties/propertieslibrary.h>
#include <system/systembase.h>

//
// atm only one core should work
//


#define EPOLL_MAX_EVENTS 1024
#define BUFFER_READ_SIZE 1024 * 8

#define EPOLL_MAX_EVENTS_COMM 1024
#define BUFFER_READ_SIZE_COMM 1024 * 8

#define FRIEND_CORE_PORT	6503
#define WEBSOCKET_PORT	6500

//
// BTW we should have one instance of class what is makeing connection and then it should spread work to cores
//

FriendCoreManager *FriendCoreManagerNew()
{
	FriendCoreManager *fcm = NULL;
	
	if( ( fcm = FCalloc( 1, sizeof( struct FriendCoreManager ) ) ) != NULL )
	{
		int websocketPort = WEBSOCKET_PORT;
		fcm->fcm_ServiceManager = ServiceManagerNew( fcm );
		
		//
		// Create FriendCoreManagerID
		//
		
		char temp[ 64 ];
		SHA256_CTX ctx;
		//sha256_init( &ctx );
	
		if( getMacAddress( temp ) == 0 )
		{
			
		}
		//sha256_update( &ctx, temp, 32 );
		
		//sha256_final( &ctx, fcm->fcm_ID );
		struct hostent *he = gethostbyname( "localhost" );
		strcpy( fcm->fcm_ID, temp );
		strncat( fcm->fcm_ID, he->h_name, 31 );
		
		int i;
		for( i=0 ; i<64; i++ )
		{
			if( fcm->fcm_ID[i ] == 0 )
			{
				fcm->fcm_ID[ i ] = '0';
			}
		}
		fcm->fcm_ID[ 63 ] = 0;
		INFO("FriendCoreManager: name set to: %64s\n", fcm->fcm_ID  );
		
		//
		// create services
		//
		
		int port = FRIEND_CORE_PORT;
		int maxp = EPOLL_MAX_EVENTS;
		int bufsize = BUFFER_READ_SIZE;
		int maxpcom =  EPOLL_MAX_EVENTS_COMM;
		int bufsizecom = BUFFER_READ_SIZE_COMM;

		
		{
			struct PropertiesLibrary *plib = NULL;
			Props *prop = NULL;
			
			SSLEnabled = FALSE;
	
			if( ( plib = (struct PropertiesLibrary *)LibraryOpen( SLIB, "properties.library", 0 ) ) != NULL )
			{
				char *ptr, path[ 1024 ];
				path[ 0 ] = 0;
	
				ptr = getenv("FRIEND_HOME");
				if( ptr != NULL )
				{
					sprintf( path, "%scfg/cfg.ini", ptr );
				}
				
				sprintf( RSA_SERVER_CERT, "%s/crt/certificate.pem", ptr );
				sprintf( RSA_SERVER_KEY, "%s/crt/key.pem", ptr );
				sprintf( RSA_SERVER_CA_CERT, "%s/crt/certificate.pem", ptr );
				sprintf( RSA_SERVER_CA_PATH, "%s/crt/", ptr );

				prop = plib->Open( path );
				if( prop != NULL)
				{
					port= plib->ReadInt( prop, "Core:port", FRIEND_CORE_PORT );
					
					maxp = plib->ReadInt( prop, "Core:epollevents", EPOLL_MAX_EVENTS );
					bufsize = plib->ReadInt( prop, "Core:networkbuffer", BUFFER_READ_SIZE );
					
					maxpcom = plib->ReadInt( prop, "Core:epolleventscom", EPOLL_MAX_EVENTS_COMM );
					bufsizecom = plib->ReadInt( prop, "Core:networkbuffercom", BUFFER_READ_SIZE_COMM );
					
					websocketPort = plib->ReadInt( prop, "Core:wsport", WEBSOCKET_PORT );
					
					SSLEnabled = plib->ReadInt( prop, "Core:SSLEnable", 0 );
					
					char *tptr  = plib->ReadString( prop, "Core:Certpath", "cfg/crt/" );
					if( tptr != NULL )
					{
						if( tptr[ 0 ] == '/' )
						{
							sprintf( RSA_SERVER_CERT, "%s%s", tptr, "certificate.pem" );
							sprintf( RSA_SERVER_KEY, "%s%s", tptr, "key.pem" );
							sprintf( RSA_SERVER_CA_CERT, "%s%s", tptr, "request.pem" );
							sprintf( RSA_SERVER_CA_PATH, "%s%s", tptr, "/" );
						}
						else
						{
							sprintf( RSA_SERVER_CERT, "%s%s%s", ptr, tptr, "certificate.pem" );
							sprintf( RSA_SERVER_KEY, "%s%s%s", ptr, tptr, "key.pem" );
							sprintf( RSA_SERVER_CA_CERT, "%s%s%s", ptr, tptr, "request.pem" );
							sprintf( RSA_SERVER_CA_PATH, "%s%s%s", ptr, tptr, "/" );
						}
					}
					else
					{
						
					}
					
					plib->Close( prop );
				}
				
				LibraryClose( ( struct Library *)plib );
			}
			
			fcm->fcm_FriendCores = FriendCoreNew( port, maxp, bufsize );
		}
		
		if( fcm->fcm_FriendCores == NULL )
		{
			free( fcm );
			ERROR("Cannot create FriendCore!\n");
			return NULL;
		}
		
		#ifdef WEBSOCKETS
		if( ( fcm->fcm_WebSocket = WebSocketNew( fcm,  websocketPort, FALSE ) ) != NULL )
		{
			WebSocketStart( fcm->fcm_WebSocket );
		}
		else
		{
			ERROR("Cannot launch websocket server\n");
		}
		#endif
		
		fcm->fcm_CommServiceServer = CommServiceNew( SERVICE_TYPE_SERVER, fcm, maxpcom, bufsizecom );
		fcm->fcm_CommServiceClient = CommServiceNew( SERVICE_TYPE_CLIENT, fcm, maxpcom, bufsizecom );
		
		fcm->fcm_SSHServer = SSHServerNew();
		
		fcm->fcm_Shutdown = FALSE;
	}
	DEBUG("FriendCoreManager Created\n");
	
	return fcm;
}

//
// FriendCoreManager destructor
//

void FriendCoreManagerDelete( FriendCoreManager *fcm )
{
	DEBUG("FriendCoreManager END - start\n");
	if( fcm != NULL )
	{	
		DEBUG("FriendCore Shutdown\n");
		FriendCoreShutdown( fcm->fcm_FriendCores );
		DEBUG("FriendCore shutdown finished\n");
				
		#ifdef WEBSOCKETS
		WebSocketFree( fcm->fcm_WebSocket );
		#endif
		
		DEBUG("FCM Close client\n");
		CommServiceDelete( fcm->fcm_CommServiceClient );
		DEBUG("FCM Close server\n");
		CommServiceDelete( fcm->fcm_CommServiceServer );
		
		DEBUG("FCM Close services\n");
		if( fcm->fcm_ServiceManager != NULL )
		{
			ServiceManagerDelete( fcm->fcm_ServiceManager );
		}
		
		DEBUG("FCM Close SSH Server\n");
		SSHServerDelete( fcm->fcm_SSHServer );
		
		FFree( fcm );
	}
	
	DEBUG("FriendCoreManager END - Reads: %d Writes: %d\n", _reads, _writes );
}

//
// run system
//

ULONG FriendCoreManagerRun( FriendCoreManager *fcm )
{
	// This will block until the core is shut down
	DEBUG("Starting cores...\n");
	
	if( fcm != NULL )
	{
		
		if( fcm->fcm_CommServiceServer )
		{
			CommServiceStart( fcm->fcm_CommServiceServer );
		}
		
		if( fcm->fcm_CommServiceClient )
		{
			CommServiceStart( fcm->fcm_CommServiceClient );
		}
		
		//test
			
		//const char *t = "hello";
		//CommServiceSendMsg( fcm->fcm_CommServiceClient, t, 6 );
	 
		
		
		if( fcm->fcm_FriendCores )
		{
			fcm->fcm_FriendCoresRunning++;
			FriendCoreRun( fcm->fcm_FriendCores );
			fcm->fcm_FriendCoresRunning--;
		}
	}

	return 0;
}
