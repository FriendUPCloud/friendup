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


#include <core/types.h>
#include "comm_service_remote.h"
#include "service.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <signal.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <sys/time.h>
#include <sys/types.h>
#include <sys/mman.h>
#ifdef USE_SELECT

#else
#include <sys/epoll.h>
#endif
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <properties/propertieslibrary.h>
#include <core/friendcore_manager.h>
#include <service/comm_msg.h>
#include <system/systembase.h>

#define FLAGS S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH
#define MAX_MSG 50

//
// cfg/cores.ini
// [Cores]
// servers=localhost@servername1,192.168.12.1@server2

// we must be sure that task will wait until queue will be ready

//pthread_cond_t InitCond = PTHREAD_COND_INITIALIZER;
//pthread_mutex_t InitMutex = PTHREAD_MUTEX_INITIALIZER;

//#define USE_SELECT

//
// Creste new service
//

CommServiceRemote *CommServiceRemoteNew( int port, int secured, void *sb, int maxev )
{
	CommServiceRemote *service = NULL;
	DEBUG2("[CommServiceRemote] CommunicationServiceNew START\n"); 
	
	if( ( service = FCalloc( 1, sizeof( CommServiceRemote ) )  ) != NULL )
	{
		DEBUG2("[CommServiceRemote] CommunicationService created type \n" );
		//service->s_Type = type;
		service->csr_MaxEvents = maxev;
		service->csr_port = port;
		service->csr_secured = secured;
		
		//service->s_outMqfd = -1;
		pipe2( service->csr_sendPipe, 0 );
		pipe2( service->csr_recvPipe, 0 );
		
		service->csr_SB = sb;
		
		pthread_mutex_init( &service->csr_Mutex, NULL );
	}
	else
	{
		Log( FLOG_ERROR, "Cannot allocate memory for communication remote service\n");
	}
	DEBUG2("[CommServiceRemote] CommunicationServiceNew END\n"); 
	
	return service;
}

//
// delete CommServiceRemote
//

void CommServiceRemoteDelete( CommServiceRemote *s )
{
	DEBUG2("[CommServiceRemoteDelete] CommunicationServiceDelete\n");
	if( s != NULL )
	{
		s->csr_Quit = TRUE;
		
		DEBUG2("[CommServiceRemoteDelete] : Quit set to TRUE, sending signal\n");
		
		char ch = 'q';
		write( s->csr_WriteCommPipe, &ch, 1);
		
		DEBUG2("[CommServiceRemoteDelete]  close thread\n");
		
		while( s->csr_Thread->t_Launched != FALSE )
		{
			usleep( 500 );
		}
		
		if( s->csr_Thread != NULL )
		{
			ThreadDelete( s->csr_Thread );
		}
		
		DEBUG2("[CommServiceRemoteDelete]  closeing pipes\n");
		
		if( close(  s->csr_sendPipe[0]  ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
		
		if( close( s->csr_sendPipe[1] ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
		
		if( close( s->csr_recvPipe[0] ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
		
		if( close( s->csr_recvPipe[1] ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
		
		DEBUG2("[CommServiceRemoteDelete] : pipes closed\n");
		
		pthread_mutex_destroy( &s->csr_Mutex );
		
		Log( FLOG_ERROR,"[CommServiceRemoteDelete] Communication service closed\n");
		
		FFree( s );
	}
}

//
// Start CommServiceRemote
//

int CommServiceRemoteStart( CommServiceRemote *s )
{
	if( s )
	{	
		Log( FLOG_INFO, "[COMMSERV] Communication service SERVER start\n");
		
		//pthread_mutex_init( &InitMutex, NULL );
		
		s->csr_Thread = ThreadNew( CommServiceRemoteThreadServer, s, TRUE );
		
		DEBUG("[COMMSERV] CommServiceStart, pointer to thread %p\n", s->csr_Thread );
		
		if( s->csr_Thread == NULL )
		{
			FERROR("[COMMSERV] Cannot start CommunicationThread\n");
		}
	}
	return 0;
}

//
// Stop CommServiceRemote
//

int CommServiceRemoteStop( CommServiceRemote *s )
{
	return 0;
}

//
// we handle here all messages from connected remote machine
//

DataForm *ParseMessageCSR( CommServiceRemote *serv, Socket *socket, FBYTE *data, int *len,  FBOOL *isStream )
{
	DataForm *df = (DataForm *)data;
	DataForm *actDataForm = NULL;
	
	if( *len <= 0 )
	{
		DEBUG("[CommServiceRemote] No more data provided, quit!\n");
		return NULL;
	}
	
	FERROR("--------PARSE MESSAGE %c %c %c %c\n", data[0],data[1],data[2],data[3] );
	
	int z;
	for( z = 0 ; z < 48 ; z++ )
	{
		printf("%c -", data[z] );
	}
	printf("\n");
	
	
	FULONG responseID = 0;
	
	if( df->df_ID == ID_FCRE )
	{
		DEBUG("[CommServiceRemote] MAIN HEADER\n");

		*len -= COMM_MSG_HEADER_SIZE;
		
		data += COMM_MSG_HEADER_SIZE;
		df = (DataForm *)data;
		
		if( df->df_ID == ID_FRID )
		{
			responseID = df->df_Size;
			DEBUG("ResponseID set %lu\n", responseID );
		}
		
		data += COMM_MSG_HEADER_SIZE;
		df = (DataForm *)data;
		
		if( df->df_ID == ID_QUER )
		{
			//TODO
			DEBUG("[CommServiceRemote] QUERY FOUND %ld\n", df->df_Size );
			SystemBase *lsb = (SystemBase *)serv->csr_SB;
			FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;//serv->s_FCM;
			
			*len -= df->df_Size;
			data += COMM_MSG_HEADER_SIZE + df->df_Size;
			df = (DataForm *)data;
			
			//
			// Services Information
			//
			
			if( df->df_ID == ID_SVIN )
			{
				DEBUG("[CommServiceRemote] SERVICES INFORMATION\n");
				
				SystemBase *lsb = (SystemBase *)serv->csr_SB;
				FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;//serv->s_FCM;
				Service *lsrv = fcm->fcm_ServiceManager->sm_Services;
				FULONG size = 0;
				
				// getting size of names for a buffer
				
				while( lsrv != NULL )
				{
					DEBUG( "[ParseMessage] Getting lsrv!\n" );
					size += strlen( lsrv->GetName() ) + 1 + COMM_MSG_HEADER_SIZE;
					lsrv = (Service *)lsrv->node.mln_Succ;
				}
				
				// we create buffer now and put names into it
				
				if( size > 0 )
				{
					FBYTE *tmpnames = FCalloc( size, sizeof( char ) );
					if( tmpnames != NULL )
					{
						struct MsgItem tags[] = {
							{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
							{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
							{ ID_RESP, (FULONG)0, (FULONG)0 },
							{ ID_SVIN, (FULONG)0, (FULONG)NULL },
							{ TAG_DONE, TAG_DONE, TAG_DONE }
						};
						
						actDataForm = DataFormNew( tags );
						
						FBYTE *nameptr = tmpnames;
						ID snameinfo = ID_SNAM;
						FULONG snamesize = 0;
						
						lsrv = fcm->fcm_ServiceManager->sm_Services;
						while( lsrv != NULL )
						{
							snamesize = strlen( lsrv->GetName() ) + 1;
							int copyStringSize = snamesize;
							snamesize += COMM_MSG_HEADER_SIZE;
							
							DEBUG("Adding service to answer '%s'\n", lsrv->GetName() );
							
							memcpy( nameptr, &snameinfo, sizeof(FULONG) );
							nameptr += sizeof(FULONG);
							memcpy( nameptr, &snamesize, sizeof(FULONG) );
							nameptr += sizeof(FULONG);
							memcpy( nameptr, lsrv->GetName(), copyStringSize );
							nameptr += copyStringSize;
							
							//size += strlen( lsrv->GetName() ) + 9;
							lsrv = (Service *)lsrv->node.mln_Succ;
						}
						
						DataFormAdd( &actDataForm, tmpnames, size );
						DEBUG("Adding service to message\n");
						
						FFree( tmpnames );
					}
				}
				data += COMM_MSG_HEADER_SIZE;
				*len -= COMM_MSG_HEADER_SIZE;
			}
			
			//
			// system.library calls
			//
			
			else if( df->df_ID == ID_SLIB )
			{
				
				//DEBUG("[COMMSERV] SYSTEM.LIBRARY CALLED\n");
				data += COMM_MSG_HEADER_SIZE;
				df = (DataForm *)data;
				
				// SLIB  + SIZE
				// HTTP HEADER + SIZE
				// AUTH + SIZE
				//{
				// USER + SIZE / PASSWORD + SIZE
				// AUTHID + SIZE
				//}
				// HTTP + SIZE
				//{
				// PATH + SIZE
				// PARM + SIZE
				//{
				//PRMT + SIZE / PRMT + SIZE .......
				//}
				//}
				
				if( df->df_ID == ID_HTTP )
				{
					//DEBUG("HTTP found  %ul\n", df->df_Size );
					Http *http = HttpNew( );
					http->parsedPostContent = HashmapNew();
					char temp[ 1024 ];
					char *pathParts[ 1024 ];
					memset( pathParts, 0, 1024 );
					
					data += COMM_MSG_HEADER_SIZE;
					df = (DataForm *)data;
					
					if( df->df_ID == ID_AUTH )
					{
						//DEBUG("Auth found  %ul\n", df->df_Size );
						data += COMM_MSG_HEADER_SIZE;
						df = (DataForm *)data;
						
						if( df->df_ID == ID_USER )
						{
							//DEBUG("User found size %ul\n", df->df_Size );
							data += COMM_MSG_HEADER_SIZE;
							
							memset( temp, 0, 1024 );
							//strncpy( temp, data, df->df_Size );
							memcpy( temp, data, df->df_Size );
							
							data += df->df_Size;
							df = (DataForm *)data;
							//DEBUG("Size %ul\n", df->df_Size );
							
							if( df->df_ID == ID_PSWD )
							{
								//DEBUG("Password found\n");
								data += COMM_MSG_HEADER_SIZE;
								
								memset( temp, 0, 1024 );
								//strncpy( temp, data, df->df_Size );
								memcpy( temp, data, df->df_Size );
								
								data += df->df_Size;
								df = (DataForm *)data;
							}
							
							//DEBUG("End user\n");
						}
						else if( df->df_ID == ID_APID )
						{
							//DEBUG("APID found\n");
							data += COMM_MSG_HEADER_SIZE;
							
							memset( temp, 0, 1024 );
							//strncpy( temp, data, df->df_Size );
							memcpy( temp, data, df->df_Size );
							
							data += df->df_Size;
							df = (DataForm *)data;
						}
					}
					
					if( df->df_ID == ID_PATH )
					{
						data += COMM_MSG_HEADER_SIZE;
						unsigned int i;
						//printf("--------%20s\n", data );
						
						pathParts[ 0 ] = NULL;
						int part = 1;
						for( i=1; i < df->df_Size ; i++ )
						{
							//printf("%c %d %d\n", data[ i ], data[ i ], i );
							if( data[ i ] == '/' )
							{
								pathParts[ part ] = (char *) &(data[ i+1 ]);
								//DEBUG("PATH PART %s\n", pathParts[ part ] );
								
								part++;
								data[ i ] = 0;
							}
						}
						//DEBUG("Path found %.*s\n", df->df_Size, data );
						
						//memset( temp, 0, 1024 );
						//strncpy( temp, data, df->df_Size );
						
						data += df->df_Size;
						df = (DataForm *)data;
					}
					
					if( df->df_ID == ID_PARM )
					{
						int size = df->df_Size;
						
						//DEBUG("PARAMETERS found\n");
						data += COMM_MSG_HEADER_SIZE;
						df = (DataForm *)data;
						
						while( size > 1 )
						{
							data += COMM_MSG_HEADER_SIZE;
							//DEBUG("Going through parameters\n");
							
							if( df->df_ID == ID_PRMT )
							{
								char *temp = (char *)data;
								int parsize = 0;
								
								unsigned int i;
								char *attr = temp;
								char *val = NULL;
								
								/*
								 *								for( i=0 ; i < df->df_Size ; i++ )
								 *								{
								 *									printf("-%c\n", temp[ i ] );
							}*/
								
								for( i=1 ; i < df->df_Size ; i++ )
								{
									if( temp[ i ] == '=' )
									{
										temp[ i ] = 0;
										val = &(temp[ i+1 ]);
										parsize = df->df_Size - (i+1);
										DEBUG("Message size %d  - parameter size %ld\n", parsize, df->df_Size );
										break;
									}
								}
								
								//DEBUG("New values passed to before %s %s\n", attr, val );
								
								if( attr != NULL && val != NULL )
								{
									char *param = NULL;
									if( ( param = FCalloc( parsize+1, sizeof(char) ) ) != NULL )
									{
										memcpy( param, val, parsize );
										param[ parsize ] = 0;
										DEBUG("Mem allocated for data %p\n",  param );
									}
									//char *param = StringDuplicateN( val, parsize );
									if( HashmapPut( http->parsedPostContent, StringDuplicate( attr ), param ) )
									{
										DEBUG("New values passed to POST - %s - %.10s -\n", attr, val );
									}
								}
								
								data += df->df_Size;
								size -= df->df_Size;
								df = (DataForm *)data;
								//printf("size %d\n", size );
							}
							else
							{
								size--;
								data++;
							}
							//printf("size2 %d\n", size );
						}
					}
					
					http->h_Socket = socket;
					http->h_RequestSource = HTTP_SOURCE_FC;
					http->h_ResponseID = responseID;
					DEBUG2("-----------------------------Calling SYSBASE via CommuncationService: %s\n\n", (pathParts[ 1 ]) );
					
					SystemBase *lsysbase = (SystemBase *) serv->csr_SB;
					if( lsysbase != NULL )
					{
						Http *response = lsysbase->SysWebRequest( lsysbase, &(pathParts[ 1 ]), &http, NULL );
						if( response != NULL )
						{
							*isStream = response->h_Stream;
							MsgItem tags[] = {
								{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
								{ ID_FRID, (FULONG)responseID , MSG_INTEGER_VALUE },
								{ ID_RESP, (FULONG)response->sizeOfContent+1, (FULONG)response->content },
								//{ MSG_GROUP_END, 0,  0 },
								{ TAG_DONE, TAG_DONE, TAG_DONE }
							};
							
							actDataForm = DataFormNew( tags );
							
							DEBUG("Messsage received from systembase, responseid %lu\n", actDataForm[ 1 ].df_Size );
							
							HttpFree( response );
						}
						else
						{
							FERROR("Response was empty!\n");
						}
					}	// Sysbase checking
					HttpFree( http );
				}
			}
			
			//
			// FILE
			//
			
			else if( df->df_ID == ID_FILE )
			{
				
			}
		}
	}
	else
	{
		FERROR("ID is not correct, message was not procesed\n");
	}
	
	DEBUG("[CommServiceRemote] End MSG!\n");
	
	return actDataForm;
}

//
// Service Thread
//

int CommServiceRemoteThreadServer( FThread *ptr )
{
	CommServiceRemote *service = (CommServiceRemote *)ptr->t_Data;
	
	DEBUG("[CommServiceRemote]  Start\n");
	SystemBase *lsysbase = (SystemBase *)service->csr_SB;
	
	service->csr_Socket = SocketOpen( lsysbase, service->csr_secured, service->csr_port, SOCKET_TYPE_SERVER );
	
	if( service->csr_Socket != NULL )
	{
		#ifdef USE_SELECT
		SocketSetBlocking( service->csr_Socket, TRUE );
		#else
		SocketSetBlocking( service->csr_Socket, FALSE );
		#endif
		if( SocketListen( service->csr_Socket ) != 0 )
		{
			SocketClose( service->csr_Socket );
			FERROR("[CommServiceRemote]  Cannot listen on socket!\n");
			return -1;
		}
		
		DEBUG("\n\nCommServiceThreadServer\n\n\n");
		
		#ifdef USE_SELECT
		Socket* incomming = NULL;
		
		int pipefds[2] = {};
		
		pipe2( pipefds, 0 );
		
		service->s_ReadCommPipe = pipefds[ 0 ];
		service->s_WriteCommPipe = pipefds[1];
		
		// make read-end non-blocking
		int flags = fcntl( service->s_ReadCommPipe, F_GETFL, 0 );
		fcntl( service->s_WriteCommPipe, F_SETFL, flags|O_NONBLOCK );
		
		// Read buffer
		char buffer[ service->s_BufferSize ];
		int maxd = service->s_Socket->fd;
		if( service->s_ReadCommPipe > maxd )
		{
			maxd = service->s_ReadCommPipe;
		}
		
		fd_set readfds;
		Socket *socket = service->s_Socket;
		int count = 0;
		
		while( service->s_Cam.cam_Quit != TRUE )
		{
			FD_ZERO( &readfds );
			
			FD_SET( socket->fd, &readfds );
			FD_SET( service->s_ReadCommPipe, &readfds );
			
			DEBUG("Before select, maxd %d\n", maxd );
			
			int activity = select( maxd+1, &readfds, NULL, NULL, NULL );
			
			DEBUG("After select\n");
			
			if( ( activity < 0 ) && ( errno != EINTR ) )
			{
				DEBUG("Select error\n");
			}
			
			if( FD_ISSET( socket->fd, &readfds ) )
			{
				//Socket *sock = SocketAccept( socket );
				
				// accept
				incomming = SocketAccept( service->s_Socket );
				if( incomming == NULL )
				{
					// We have processed all incoming connections.
					if( (errno == EAGAIN ) || ( errno == EWOULDBLOCK) )
					{
						break;
					}
					// Other error
					FERROR("[CommServiceRemote] : cannot accept incoming connection\n");
					break;
				}
				
				if( incomming->protocolCallback == NULL )
					
					DEBUG2("[CommServiceRemote] Socket Connection Accepted\n");
				
				incomming->s_Timeouts = 5;
				incomming->s_Timeoutu = 0;
				if( SocketSetBlocking( incomming, TRUE ) == -1)
				{
					FERROR("[CommServiceRemote]SocketSetBlocking\n");
					SocketClose( incomming );
					continue;
				}
				
				// Set the default protocol callback
				incomming->protocolCallback = (void* (*)( Socket_t* sock, char* bytes, unsigned int size ))&ParseMessage;
				
				//
				// we must check first if its FC communication
				//
				
				count = SocketWaitRead( incomming, (char *)&buffer, service->s_BufferSize, 0, 15 );
				
				if( count > 0 )
				{
					//INFO("C1DATA READED %d\n", (int)count );
					DataForm *df = (DataForm *)buffer;
					
					if( df->df_ID == ID_FCRE )
					{
						FriendCoreManager *lfcm = FCalloc( 1, sizeof( struct FriendCoreManager ) );//FriendCoreManagerNew();
						memcpy( lfcm->fcm_ID, ((FUBYTE *)df)+COMM_MSG_HEADER_SIZE, (FRIEND_CORE_MANAGER_ID_SIZE)*sizeof(FUBYTE) );
						DEBUG2("[CommServiceRemote] FriendOS connected, name '%128s'\n", lfcm->fcm_ID );
						
						//
						// on the end we should accept connection but do not allow to call anything
						// untill admin will accept connection
						//
						
						CommFCConnection *con = CommServiceAddConnection( service, incomming, NULL, lfcm->fcm_ID, SERVICE_CONNECTION_INCOMING );
						
						incomming->s_Data = con;
						
						if( con != NULL )
						{
							con->cfcc_Data = service;
							con->cfcc_Thread = ThreadNew( CommServiceThreadConnection, con, TRUE );
							
							service->s_NumberConnections++;
							FFree( lfcm );
							lfcm = NULL;
						}
						else
						{
							FFree( lfcm );
							lfcm = NULL;
							SocketClose( incomming );
						}
					}
					else
					{
						FERROR("[CommServiceRemote] C1Someone was trying to connect to your machine!\n");
					}
				}
				else
				{
					FERROR("[CommServiceRemote] Cannot read from socket!\n");
					
					continue;
				}
			}
			
			if( FD_ISSET( service->s_ReadCommPipe, &readfds ) )
			{
				// read all bytes from read end of pipe
				char ch;
				int result = 1;
				
				DEBUG2("[CommServiceRemote] Read from pipe!\n");
				
				while( result > 0 )
				{
					result = read( service->s_ReadCommPipe, &ch, 1 );
					DEBUG2("[CommServiceRemote] Read from pipe %c\n", ch );
					if( ch == 'q' )
					{
						//goto service_exit;
						service->s_Cam.cam_Quit = TRUE;
						DEBUG2("[CommServiceRemote] Closing!\n");
						break;
					}
				}
				
				if( service->s_Cam.cam_Quit == TRUE )
				{
					break;
				}
			}
		}	// quit != TRUE
		
		#else
		
		// Create epoll
		service->csr_Epollfd = epoll_create1( 0 );
		if( service->csr_Epollfd == -1 )
		{
			FERROR( "[CommServiceRemote]  poll_create\n" );
			return -1;
		}
		
		// Register for events
		struct epoll_event mevent;
		memset( &mevent, 0, sizeof( mevent ) );
		mevent.data.fd = service->csr_Socket->fd;
		mevent.events = EPOLLIN | EPOLLET;
		
		if( epoll_ctl( service->csr_Epollfd, EPOLL_CTL_ADD, service->csr_Socket->fd, &mevent ) == -1 )
		{
			FERROR( "[CommServiceRemote]  epoll_ctl" );
			return -1;
		}
		
		{
			int eventCount;
			int retval;
			int i;
			
			struct epoll_event currentEvent;
			struct epoll_event* events = (struct epoll_event*) FCalloc( service->csr_MaxEvents, sizeof( struct epoll_event ) );
			ssize_t count;
			Socket* incomming = NULL;

			// add communication ReadCommPipe
			
			int pipefds[2] = {};
			struct epoll_event piev = { 0 };
			
			pipe2( pipefds, 0 );
			
			service->csr_ReadCommPipe = pipefds[ 0 ];
			service->csr_WriteCommPipe = pipefds[1];
			
			// make read-end non-blocking
			int flags = fcntl( service->csr_ReadCommPipe, F_GETFL, 0 );
			fcntl( service->csr_WriteCommPipe, F_SETFL, flags|O_NONBLOCK );
			
			// add the read end to the epoll
			piev.events = EPOLLIN;
			piev.data.fd = service->csr_ReadCommPipe;
			epoll_ctl( service->csr_Epollfd, EPOLL_CTL_ADD, service->csr_ReadCommPipe, &piev );
			
			DEBUG("[CommServiceRemote] , before main loop\n");
			
			while( service->csr_Quit != TRUE )
			{
				// All incomming network events go through here :)
				// Wait for something to happen on any of the sockets we're listening on
				
				#define EPOLL_TIMEOUT 3000
				
				eventCount = epoll_wait( service->csr_Epollfd, events, service->csr_MaxEvents, EPOLL_TIMEOUT );
				
				//DEBUG("event count %d\n", eventCount );
				
				if( eventCount == 0 )
				{
					// timeout not used now
					continue;
				}
				
				for( i = 0; i < eventCount; i++ )
				{
					currentEvent = events[i];
					
					Socket *sock = ( Socket *)currentEvent.data.ptr;
					
					DEBUG("[CommServiceRemote] Event count\n");
					
					if(
						( currentEvent.events & EPOLLERR ) ||
						( currentEvent.events & EPOLLHUP ) ||
						( !( currentEvent.events & EPOLLIN ) ) )
					{
						// An error has occured on this fd, or the socket is not ready for reading (why were we notified then?).
						// TODO: Proper error logging
						FERROR("[CommServiceRemote] FDerror!\n");
						
						CommFCConnection *loccon = NULL;
						loccon = sock->s_Data;

						// Remove event
						epoll_ctl( service->csr_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );

						SocketClose( sock );
						sock = NULL;

						DEBUG("CommService: socket closed\n");
					}

					// Accept incomming connections
					else if( currentEvent.data.fd == service->csr_Socket->fd )
					{
						// We have a notification on the listening socket, which means one or more incoming connections.
						while( TRUE )
						{
							FERROR("-=================RECEIVED========================-\n");
							
							incomming = SocketAccept( service->csr_Socket );
							if( incomming == NULL )
							{
								// We have processed all incoming connections.
								if( (errno == EAGAIN ) || ( errno == EWOULDBLOCK) )
								{
									break;
								}
								// Other error
								FERROR("[CommServiceRemote] : cannot accept incoming connection\n");
								break;
							}

							DEBUG2("[CommServiceRemote] Socket Connection Accepted\n");

							incomming->s_Timeouts = 5;
							incomming->s_Timeoutu = 0;

							// used for not persistent connections
							struct epoll_event event;

							event.data.fd = incomming->fd;//s->s_Socket->fd;
							event.data.ptr = (void *) incomming;
							event.events = EPOLLIN | EPOLLRDHUP | EPOLLET;
							int retval = epoll_ctl( service->csr_Epollfd, EPOLL_CTL_ADD, incomming->fd, &event );
							if( retval == -1 )
							{
								FERROR("[CommServiceRemote] EPOLLctrl error\n");
								return 1;
							}
						}
						
						//
						// checking internal pipe
						//
						
					}
					else if( currentEvent.data.fd == service->csr_ReadCommPipe )
					{
						// read all bytes from read end of pipe
						char ch;
						int result = 1;
						
						DEBUG2("[CommServiceRemote] Hogne Read from pipe!\n");
						
						while( result > 0 )
						{
							result = read( service->csr_ReadCommPipe, &ch, 1 );
							DEBUG2("[CommServiceRemote] Hogne Read from pipe %c\n", ch );
							if( ch == 'q' )
							{
								//goto service_exit;
								service->csr_Quit = TRUE;
								DEBUG2("[CommServiceRemote] Closing!\n");
								break;
							}
						}
						
						if( service->csr_Quit == TRUE )
						{
							break;
						}
					}
					else
					{
						// Remove event // not persistent connection
						epoll_ctl( service->csr_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );
						
						FBYTE *tempBuffer = NULL;
						int tempSize = 0;
						DEBUG("\n\nWait for message on socket\n");
						
						SocketSetBlocking( sock, TRUE );
						
						BufString *bs = NULL;
						if( sock != NULL )
						{
							//bs = SocketReadPackage( sock );
							bs = SocketReadTillEnd( sock, 0, 15 );
						}
						else
						{
							FERROR("Sock == NULL!\n");
						}
						if( bs != NULL )
						{
							count = (int)bs->bs_Size;
							
							DEBUG2("Readede from socket %lu\n", bs->bs_Size );
							
							//DEBUG( "[CommServiceRemote] processing socket with a callback: %s\n", buffer );
							
							DEBUG2("[CommServiceRemote] PROCESSING RECEIVED CALL, DATA READED %d\n", (int)count );
							int dcount = count;
							DataForm *df = (DataForm *)bs->bs_Buffer;
							
							// checking if its FRIEND message
							
							int j = 0;
							if( df->df_ID == ID_FCRE && count > 24 )
							{
								char *id = (char *)&(df[ 2 ].df_ID);

								DEBUG2("ID POS 2 %lu ID_RESP %lu ID_QUERY %lu   ID %c %c %c %c\n", df[ 2 ].df_ID, ID_RESP, ID_QUER, id[0], id[1], id[2], id[3] );
								
								if( df[ 2 ].df_ID == ID_QUER )
								{
									// checking if its a request or response
									//if( count >= (ssize_t)df->df_Size )
									
									// we received whole data
									// Process data
									DataForm *recvDataForm = NULL;
									FBOOL isStream = FALSE;
									
									FERROR("[CommServiceRemote] All data received, processing bytes %d-------------------------------------------PROCESSING ANSWER\n", dcount );
									
									recvDataForm = ParseMessageCSR( service, sock, (FBYTE *)bs->bs_Buffer, (int *)&dcount, &isStream );
									
									DEBUG2("[CommServiceRemote] Data processed-----------------------------------------\n");
									
									// return information
									if( recvDataForm != NULL )
									{
										DEBUG2("[CommServiceRemote] Data received-----------------------------------------%d\n", recvDataForm->df_Size);

										int wrote = 0;
										
										if( isStream == FALSE )
										{
											wrote = SocketWrite( sock, (char *)recvDataForm, recvDataForm->df_Size );
										}
										DEBUG2("[CommServiceRemote] Wrote bytes %d\n", wrote );
										
										// remove data form
										DataFormDelete( recvDataForm );
										BufStringDelete( bs );
									}
									else
									{
										// prepare asnwer
										// everything goes well - no response
										
										DataForm *tmpfrm = DataFormNew( NULL );
										
										FBYTE tdata[ 20 ];
										FULONG *tdatau = (FULONG *)tdata;
										tdatau[ 0 ] = ID_RPOK;
										tdatau[ 1 ] = 20;
										strcpy( (char *)&tdata[ 8 ], "No response" );
										DataFormAdd( &tmpfrm, tdata, 20 );
										
										DEBUG2("[CommServiceRemote] Service, send message to socket, size %d\n", tmpfrm->df_Size );
										
										SocketWrite( sock, (char *)tmpfrm, tmpfrm->df_Size );
										
										DataFormDelete( tmpfrm );
									}
								}
								else if( df[ 2 ].df_ID == ID_FCON )
								{
									INFO("[CommServiceRemote] New connection was set\n");
									BufStringDelete( bs );
								}
								else
								{
									FERROR("[CommServiceRemote] Message uknown!\n");
									BufStringDelete( bs );
								}
								
								DEBUG2("[CommServiceRemote]  end while\n");
								
								if( tempBuffer != NULL )
								{
									FFree( tempBuffer );
									tempBuffer = NULL;
								}
							}
							DEBUG("[CommServiceRemote]  : end2\n");
						}
						DEBUG("[CommServiceRemote]  : end1\n");
						
						SocketClose( sock );
					}
				}//end for through events
			} //end while
			
			DEBUG("[CommServiceRemote]  : Closing internal pipes\n");
			
			if( close( pipefds[0] ) != 0 )
			{
				FERROR("Cannot close pipe\n");
			}
			if( close( pipefds[1] ) != 0 )
			{
				FERROR("Cannot close pipe\n");
			}
			
			// TODO: Free open sockets here
			FFree( events);
			DEBUG( "[CommServiceRemote] Done freeing events" );
			events = NULL;
		}
		DEBUG("[CommServiceRemote] Close sockets\n");
		
		// Close epoll file descriptor
		
		shutdown( service->csr_Epollfd, SHUT_RDWR );
		close( service->csr_Epollfd );
		
		#endif
		
		SocketClose( service->csr_Socket );
	}
	else
	{
		FERROR("[CommServiceRemote] Cannot open socket for communcation thread!\n");
	}
	
	DEBUG("[CommServiceRemote] CommunicationService End\n");
	
	ptr->t_Launched = FALSE;
	
	return 0;
}

//
//
//

DataForm *CommServiceRemoteSendMsg( CommServiceRemote *s, char *address, int port )
{
	return NULL;
}

