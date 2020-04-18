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
 *  CommunicationRemoteService body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/06/2017
 */
#include <core/types.h>
#include "comm_service_remote.h"
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
#include <interface/properties_interface.h>
#include <core/friendcore_manager.h>
#include <communication/comm_msg.h>
#include <system/systembase.h>
#include <system/admin/admin_manager.h>

#define FLAGS S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH
#define MAX_MSG 50

/**
 * Create remote communication service
 *
 * @param port port number on which connection will be set
 * @param secured if set to 0 connection will not be secured, otherwise it will
 * @param sb pointer to SystemBase
 * @param maxev number of maximum events
 * @return new CommServiceRemote structure when success, otherwise NULL
 */
CommServiceRemote *CommServiceRemoteNew( int port, int secured, void *sb, int maxev )
{
	CommServiceRemote *service = NULL;
	DEBUG2("[CommServiceRemote] CommunicationServiceNew START\n"); 
	
	if( ( service = FCalloc( 1, sizeof( CommServiceRemote ) )  ) != NULL )
	{
		DEBUG2("[CommServiceRemote] CommunicationService created type \n" );
		service->csr_MaxEvents = maxev;
		service->csr_port = port;
		service->csr_secured = secured;
		
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

/**
 * Delete remote communication service
 *
 * @param s pointer to CommServiceRemote which will be deleted
 */
void CommServiceRemoteDelete( CommServiceRemote *s )
{
	DEBUG2("[CommServiceRemote] CommunicationServiceDelete\n");
	if( s != NULL )
	{
		s->csr_Quit = TRUE;
		
		DEBUG2("[CommServiceRemote] Quit set to TRUE, sending signal\n");
		
		char ch = 'q';
		write( s->csr_WriteCommPipe, &ch, 1);
		
		DEBUG2("[CommServiceRemote] close thread\n");
		
		while( s->csr_Thread->t_Launched != FALSE )
		{
			usleep( 500 );
		}
		
		if( s->csr_Thread != NULL )
		{
			ThreadDelete( s->csr_Thread );
		}
		
		DEBUG2("[CommServiceRemote] closing pipes\n");
		
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
		
		DEBUG2("[CommServiceRemote] pipes closed\n");
		
		pthread_mutex_destroy( &s->csr_Mutex );
		
		Log( FLOG_ERROR,"[CommServiceRemote] Communication service closed\n");
		
		FFree( s );
	}
}

/**
 * Start Remote Communication Service
 *
 * @param s pointer to CommServiceRemote which will be started
 * @return 0 when function will end with success, otherwise err number
 */
int CommServiceRemoteStart( CommServiceRemote *s )
{
	if( s )
	{	
		Log( FLOG_INFO, "[CommServiceRemote] Communication service SERVER start\n");
		
		//pthread_mutex_init( &InitMutex, NULL );
		
		s->csr_Thread = ThreadNew( CommServiceRemoteThreadServer, s, TRUE, NULL );
		
		DEBUG("[CommServiceRemote] CommServiceStart, pointer to thread %p\n", s->csr_Thread );
		
		if( s->csr_Thread == NULL )
		{
			FERROR("[CommServiceRemote] Cannot start CommunicationThread\n");
		}
	}
	return 0;
}

/**
 * Stop Remote Communication Service UNIMPLEMENTED
 *
 * @param s pointer to CommServiceRemote which will be stopped
 * @return 0 when function will end with success, otherwise err number
 */
int CommServiceRemoteStop( CommServiceRemote *s __attribute__((unused)) )
{
	return 0;
}

/**
 * Parse incomming messages from another connected friend user
 *
 * @param serv pointer to CommServiceRemote
 * @param socket pointer to socket where reponse will be send
 * @param data received data
 * @param len pointer to interger value with size of data. Value will be decreased by parsed bytes
 * @param isStream pointer to variable which will hold information if data can be streamed
 * @return DataForm with reponse structure when message will be parsed without errors, otherwise NULL
 */
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
	
	//DEBUG
	/*
	int z;
	for( z = 0 ; z < 48 ; z++ )
	{
		printf("%c -", data[z] );
	}
	printf("\n");
	*/
	
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
			DEBUG("[CommServiceRemote] ResponseID set %lu\n", responseID );
		}
		
		data += COMM_MSG_HEADER_SIZE;
		df = (DataForm *)data;
		
		if( df->df_ID == ID_QUER )
		{
			DEBUG("[CommServiceRemote] QUERY FOUND %ld\n", df->df_Size );
			SystemBase *lsb = (SystemBase *)serv->csr_SB;
			FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;//serv->s_FCM;
			
			*len -= df->df_Size;
			data += COMM_MSG_HEADER_SIZE + df->df_Size;
			df = (DataForm *)data;
			
			/*
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
					DEBUG("[CommServiceRemote] Getting lsrv!\n" );
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
							{ ID_FCRI, (FULONG)0, (FULONG)0 },
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
							
							DEBUG("[CommServiceRemote] Adding service to answer '%s'\n", lsrv->GetName() );
							
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
						DEBUG("[CommServiceRemote] Adding service to message\n");
						
						FFree( tmpnames );
					}
				}
				data += COMM_MSG_HEADER_SIZE;
				*len -= COMM_MSG_HEADER_SIZE;
			}
			
			//
			// system.library calls
			//
			
			else 
				*/
			if( df->df_ID == ID_SLIB )
			{
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
					Http *http = HttpNew( );
					http->http_ParsedPostContent = HashmapNew();
					char temp[ 1024 ];
					char *pathParts[ 1024 ];
					memset( pathParts, 0, 1024*sizeof(char *) );
					
					data += COMM_MSG_HEADER_SIZE;
					df = (DataForm *)data;
					
					if( df->df_ID == ID_AUTH )
					{
						data += COMM_MSG_HEADER_SIZE;
						df = (DataForm *)data;
						
						if( df->df_ID == ID_USER )
						{
							data += COMM_MSG_HEADER_SIZE;
							
							memset( temp, 0, 1024 );
							//strncpy( temp, data, df->df_Size );
							memcpy( temp, data, df->df_Size );
							
							data += df->df_Size;
							df = (DataForm *)data;

							if( df->df_ID == ID_PSWD )
							{
								data += COMM_MSG_HEADER_SIZE;
								
								memset( temp, 0, 1024 );
								//strncpy( temp, data, df->df_Size );
								memcpy( temp, data, df->df_Size );
								
								data += df->df_Size;
								df = (DataForm *)data;
							}
						}
						else if( df->df_ID == ID_APID )
						{
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
						DEBUG("--------%20s\n", data );
						
						pathParts[ 0 ] = NULL;
						int part = 1;
						for( i=1; i < df->df_Size ; i++ )
						{
							if( data[ i ] == '/' )
							{
								pathParts[ part ] = (char *) &(data[ i+1 ]);

								part++;
								data[ i ] = 0;
							}
						}
						//memset( temp, 0, 1024 );
						//strncpy( temp, data, df->df_Size );
						
						data += df->df_Size;
						df = (DataForm *)data;
					}
					
					if( df->df_ID == ID_PARM )
					{
						int size = df->df_Size;
						
						data += COMM_MSG_HEADER_SIZE;
						df = (DataForm *)data;
						
						while( size > 1 )
						{
							data += COMM_MSG_HEADER_SIZE;

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
										DEBUG("[CommServiceRemote] Message size %d  - parameter size %ld\n", parsize, df->df_Size );
										break;
									}
								}
								
								if( attr != NULL && val != NULL )
								{
									char *param = NULL;
									if( ( param = FCalloc( parsize+1, sizeof(char) ) ) != NULL )
									{
										memcpy( param, val, parsize );
										param[ parsize ] = 0;
										DEBUG("[CommServiceRemote] Mem allocated for data %p\n",  param );
									}
									//char *param = StringDuplicateN( val, parsize );
									if( HashmapPut( http->http_ParsedPostContent, StringDuplicate( attr ), param ) == MAP_OK )
									{
										DEBUG("[CommServiceRemote] New values passed to POST - %s - %.10s -\n", attr, val );
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
					
					http->http_Socket = socket;
					http->http_RequestSource = HTTP_SOURCE_FC;
					http->http_ResponseID = responseID;
					DEBUG2("-----------------------------Calling SYSBASE via CommuncationService: %s\n\n", (pathParts[ 1 ]) );
					
					SystemBase *lsysbase = (SystemBase *) serv->csr_SB;
					if( lsysbase != NULL )
					{
						int respcode = 0;
						Http *response = lsysbase->SysWebRequest( lsysbase, &(pathParts[ 1 ]), &http, NULL, &respcode );
						if( response != NULL )
						{
							*isStream = response->http_Stream;
							MsgItem tags[] = {
								{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
								{ ID_FRID, (FULONG)responseID , MSG_INTEGER_VALUE },
								{ ID_RESP, (FULONG)response->http_SizeOfContent+1, (FULONG)response->http_Content },
								//{ MSG_GROUP_END, 0,  0 },
								{ TAG_DONE, TAG_DONE, TAG_DONE }
							};
							
							actDataForm = DataFormNew( tags );
							
							DEBUG("[CommServiceRemote] Messsage received from systembase, responseid %lu\n", actDataForm[ 1 ].df_Size );
							
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
		}
	}
	else
	{
		FERROR("ID is not correct, message was not procesed\n");
	}
	
	DEBUG("[CommServiceRemote] End MSG!\n");
	
	return actDataForm;
}

/**
 * Communication Remote Server thread
 *
 * @param ptr pointer to FThread structure
 * @return 0 when function will end without errors, otherwise error number
 */
int CommServiceRemoteThreadServer( FThread *ptr )
{
	CommServiceRemote *service = (CommServiceRemote *)ptr->t_Data;
	
	DEBUG("[CommServiceRemote]  Start\n");
	SystemBase *lsysbase = (SystemBase *)service->csr_SB;
	
	service->csr_Socket = SocketNew( lsysbase, service->csr_secured, service->csr_port, SOCKET_TYPE_SERVER );
	
	if( service->csr_Socket != NULL )
	{
		service->csr_Socket->VerifyPeer = VerifyPeer;
		#ifdef USE_SELECT
		SocketSetBlocking( service->csr_Socket, TRUE );
		#else
		SocketSetBlocking( service->csr_Socket, FALSE );
		#endif
		if( SocketListen( service->csr_Socket ) != 0 )
		{
			SocketDelete( service->csr_Socket );
			FERROR("[CommServiceRemote]  Cannot listen on socket!\n");
			return -1;
		}
		
		DEBUG("[CommServiceRemote] \t\tCommServiceThreadServer\n");
		
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
			
			DEBUG("[CommServiceRemote] Before select, maxd %d\n", maxd );
			
			int activity = select( maxd+1, &readfds, NULL, NULL, NULL );
			
			DEBUG("[CommServiceRemote] After select\n");
			
			if( ( activity < 0 ) && ( errno != EINTR ) )
			{
				FERROR("Select error\n");
			}
			
			if( FD_ISSET( socket->fd, &readfds ) )
			{
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
					//INFO("C1DATA READ %d\n", (int)count );
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
						
						CommFCConnection *con = CommServiceAddConnection( service, incomming, lfcm->fcm_ID, NULL, SERVICE_CONNECTION_INCOMING );
						
						incomming->s_Data = con;
						
						if( con != NULL )
						{
							con->cfcc_Data = service;
							con->cfcc_Thread = ThreadNew( CommServiceThreadConnection, con, TRUE, NULL );
							
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
						FERROR("[CommServiceRemote] FDerror!\n");
						
						FConnection *loccon = NULL;
						loccon = sock->s_Data;

						// Remove event
						epoll_ctl( service->csr_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );

						SocketDelete( sock );
						sock = NULL;

						DEBUG("[CommServiceRemote] socket closed\n");
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
						DEBUG("[CommServiceRemote] Wait for message on socket\n");
						
						//SocketSetBlocking( sock, TRUE );
						
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
							
							DEBUG2("[CommServiceRemote] PROCESSING RECEIVED CALL, DATA READ %d\n", (int)count );
							int dcount = count;
							DataForm *df = (DataForm *)bs->bs_Buffer;
							
							// checking if its FRIEND message
							
							int j = 0;
							if( df->df_ID == ID_FCRE && count > 24 )
							{
								char *id = (char *)&(df[ 2 ].df_ID);

								//DEBUG2("[CommServiceRemote] ID POS 2 %lu ID_RESP %lu ID_QUERY %lu   ID %c %c %c %c\n", df[ 2 ].df_ID, ID_RESP, ID_QUER, id[0], id[1], id[2], id[3] );
								
								if( df[ 2 ].df_ID == ID_QUER )
								{
									// checking if its a request or response
									//if( count >= (ssize_t)df->df_Size )
									
									// we received whole data
									// Process data
									DataForm *recvDataForm = NULL;
									FBOOL isStream = FALSE;
									
									DEBUG("[CommServiceRemote] All data received, processing bytes %d-------------------------------------------PROCESSING ANSWER\n", dcount );
									
									recvDataForm = ParseMessageCSR( service, sock, (FBYTE *)bs->bs_Buffer, (int *)&dcount, &isStream );
									
									DEBUG2("[CommServiceRemote] Data processed-----------------------------------------\n");
									
									// return information
									if( recvDataForm != NULL )
									{
										DEBUG2("[CommServiceRemote] Data received-----------------------------------------%lu\n", recvDataForm->df_Size);

										int wrote = 0;
										
										if( isStream == FALSE )
										{
											wrote = SocketWrite( sock, (char *)recvDataForm, (FLONG)recvDataForm->df_Size );
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
										
										DEBUG2("[CommServiceRemote] Service, send message to socket, size %lu\n", tmpfrm->df_Size );
										
										SocketWrite( sock, (char *)tmpfrm, (FLONG)tmpfrm->df_Size );
										
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

								if( tempBuffer != NULL )
								{
									FFree( tempBuffer );
									tempBuffer = NULL;
								}
							}
						}
						SocketDelete( sock );
					}
				}//end for through events
			} //end while

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
			events = NULL;
		}
		
		// Close epoll file descriptor
		
		shutdown( service->csr_Epollfd, SHUT_RDWR );
		close( service->csr_Epollfd );
		
		#endif
		
		SocketDelete( service->csr_Socket );
	}
	else
	{
		FERROR("[CommServiceRemote] Cannot open socket for communcation thread!\n");
	}
	
	DEBUG("[CommServiceRemote] CommunicationService End\n");
	
	ptr->t_Launched = FALSE;
	
	return 0;
}

/**
 * Send message via Communication Service UNIMPLEMENTED
 *
 * @param s pointer to CommServiceRemote
 * @param address internet address as string
 * @param port port number on which message will be send
 * @return DataForm with reponse structure when message will be parsed without errors, otherwise NULL
 */
DataForm *CommServiceRemoteSendMsg( CommServiceRemote *s __attribute__((unused)), char *address __attribute__((unused)), int port __attribute__((unused)))
{
	return NULL;
}

