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
 *  CommunicationService body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/06/2017
 */

#include <core/types.h>
#include "comm_service.h"
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
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <interface/properties_interface.h>
#include <core/friendcore_manager.h>
#include <communication/comm_msg.h>
#include <system/systembase.h>

#define FLAGS S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH
#define MAX_MSG 50

#ifdef USE_SELECT

/**
 * CommunicationService thread responsible for all incomming connections
 *
 * @param ft pointer to CommunicationService FThread structure
 */

int CommServiceThreadConnection( FThread *ptr )
{
	pthread_detach( pthread_self() );
	CommFCConnection *cfccon = (CommFCConnection *)ptr->t_Data;
	Socket *sock = cfccon->cfcc_Socket;
	CommService *service = (CommService *)cfccon->cfcc_Service;
	int count = 0;
	int tempSize = 0;
	
	int pipefds[ 2 ] = {};
	
	pipe2( pipefds, 0 );
	
	cfccon->cfcc_ReadCommPipe = pipefds[ 0 ];
	cfccon->cfcc_WriteCommPipe = pipefds[1];
	
	// make read-end non-blocking
	int flags = fcntl( cfccon->cfcc_ReadCommPipe, F_GETFL, 0 );
	SocketSetBlocking( sock, TRUE );
	
	int maxd = sock->fd;
	if( cfccon->cfcc_ReadCommPipe > maxd )
	{
		maxd = cfccon->cfcc_ReadCommPipe;
	}
	
	fd_set readfds;
	int errors = 0;
	
	while( cfccon->cfcc_Thread->t_Quit != TRUE )
	{
		// We must read whatever data is available completely, as we are running in edge-triggered mode
		// and won't get a notification again for the same data.
		DEBUG("[COMMSERV-s] received message\n");
		
		FD_ZERO( &readfds );
		
		FD_SET( sock->fd, &readfds );
		//FD_SET( service->s_ReadCommPipe, &readfds );
		

		int activity = select( maxd+1, &readfds, NULL, NULL, NULL );
		
		if( ( activity < 0 ) && ( errno != EINTR ) )
		{
			DEBUG("[COMMSERV-s] Select error\n");
			errors++;
			if( errors > 25 )
			{
				break;
			}
		}
		
		if( FD_ISSET( sock->fd, &readfds ) )
		{
			FBYTE *tempBuffer = NULL;
			int tempSize = 0;
			DEBUG("[COMMSERV-s] Message received, reading it\n");
			
			BufString *bs = NULL;
			if( sock != NULL )
			{
				bs = SocketReadPackage( sock );
			}
			else
			{
				FERROR("Sock == NULL!\n");
			}
			
			if( bs != NULL )
			{
				count = (int)bs->bs_Size;
				if( count <= 0 )
				{
					// check if socket is still alive
					int n = 0;
					n = send( sock->fd, "quit", 5, MSG_NOSIGNAL );
					if( n <= 0 )
					{
						FERROR("Socket will be closed\n");
						break;
					}
				}
				
				DEBUG2("[COMMSERV-s] PROCESSING RECEIVED CALL, DATA READ %d\n", (int)count );
				int dcount = count;
				DataForm *df = (DataForm *)bs->bs_Buffer;
				
				// checking if its FRIEND message
				
				int j = 0;
				if( df->df_ID == ID_FCRE && count > 24 )
				{
					/*
					 *					int j=0;
					 *					printf("received from socket----\n");
					 *					char *t = (char *)bs->bs_Buffer;
					 *					for( j; j < (int)bs->bs_Size ; j++ )
					 *					{
					 *						if( ( t[j] >= 'A' && t[j] <= 'Z' ) || (t[j] >= 'a' && t[j] <= 'z') || t[j] >= '1' && t[j] <= '0' )
					 *						{
					 *							printf(" %c ", t[j] );
				}
				else
				{
				printf(" _ " );
				}
				}
				printf("\n");
				*/
					
					char *id = (char *)&(df[ 2 ].df_ID);
					
					//printf("difference  %ld\n", ((int)&df[2] ) - (int)bs->bs_Buffer );
					
					DEBUG2("ID POS 2 %lu ID_RESP %lu ID_QUERY %lu   ID %c %c %c %c\n", df[ 2 ].df_ID, ID_RESP, ID_QUER, id[0], id[1], id[2], id[3] );
					
					if( df[ 2 ].df_ID == ID_RESP )
					{
						DEBUG("[COMMSERV-s] Response received!\n");
						
						CommRequest *cr = service->s_Requests;
						while( cr != NULL )
						{
							DEBUG("[COMMSERV-s] Going through requests %ld find %ld\n", df[ 1 ].df_Size, cr->cr_RequestID );
							if( cr->cr_RequestID == df[ 1 ].df_Size )
							{
								cr->cr_Bs = bs;
								DEBUG("[COMMSERV-s] Message found by id\n");
								FRIEND_MUTEX_LOCK( &(service->s_Mutex) );
								pthread_cond_broadcast( &(service->s_DataReceivedCond) );
								FRIEND_MUTEX_UNLOCK( &(service->s_Mutex) );
								break;
							}
							cr = (CommRequest *) cr->node.mln_Succ;
						}
					}
					else if( df[ 2 ].df_ID == ID_QUER )
					{
						// checking if its a request or response
						//if( count >= (ssize_t)df->df_Size )
						
						// we received whole data
						// Process data
						DataForm *recvDataForm = NULL;
						FBOOL isStream = FALSE;
						
						FERROR("[COMMSERV] All data received, processing bytes %d-------------------------------------------PROCESSING ANSWER\n", dcount );
						
						recvDataForm = ParseMessage( service, sock, (FBYTE *)bs->bs_Buffer, (int *)&dcount, &isStream );
						
						DEBUG2("[COMMSERV] Data processed-----------------------------------------\n");
						
						// return information
						if( recvDataForm != NULL )
						{
							DEBUG2("[COMMSERV] Data received-----------------------------------------%d\n", recvDataForm->df_Size);
							
							int wrote = 0;
							
							if( isStream == FALSE )
							{
								wrote = SocketWrite( sock, (char *)recvDataForm, recvDataForm->df_Size );
							}
							DEBUG2("[COMMSERV] Wrote bytes %d\n", wrote );
							
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
							
							DEBUG2("[COMMSERV] Service, send message to socket, size %d\n", tmpfrm->df_Size );
							
							SocketWrite( sock, (char *)tmpfrm, tmpfrm->df_Size );
							
							DataFormDelete( tmpfrm );
						}
					}
					else if( df[ 2 ].df_ID == ID_FCON )
					{
						INFO("[COMMSERV] New connection was set\n");
						BufStringDelete( bs );
					}
					else
					{
						FERROR("[COMMSERV] Message uknown!\n");
					}
					//}
					
					//BufStringDelete( bs );
					//}	// while
					
					DEBUG2("[COMMSERV]  end while\n");
					
					if( tempBuffer != NULL )
					{
						FFree( tempBuffer );
						tempBuffer = NULL;
					}
				}
			}
			else
			{
				FERROR("Answer is empty\n");
			}
		}
		
		if( FD_ISSET( cfccon->cfcc_ReadCommPipe, &readfds ) )
		{
			// read all bytes from read end of pipe
			char ch;
			int result = 1;
			
			DEBUG2("[COMMSERV] Read from pipe!\n");
			
			while( result > 0 )
			{
				result = read( cfccon->cfcc_ReadCommPipe, &ch, 1 );
				DEBUG2("[COMMSERV] Read from pipe %c\n", ch );
				if( ch == 'q' )
				{
					//goto service_exit;
					cfccon->cfcc_Thread->t_Quit = TRUE;
					DEBUG2("[COMMSERV] Closing!\n");
					break;
				}
			}
			
			if( cfccon->cfcc_Thread->t_Quit == TRUE )
			{
				break;
			}
		}
		
		DEBUG2("[COMMSERV]  end while number two\n");
	}
	
	ptr->t_Launched = FALSE;
	
	pthread_exit( NULL );
	return 0;
}

/**
 * CommunicationService main thread
 *
 * @param ptr pointer to CommunicationService main thread
 * @return 0 when success, otherwise error number
 */

int CommServiceThreadServerSelect( FThread *ptr )
{
	pthread_detach( pthread_self() );
	CommService *service = (CommService *)ptr->t_Data;
	
	DEBUG("[COMMSERV-s] Start\n");
	SystemBase *lsysbase = (SystemBase *)service->s_SB;
	
	service->s_Socket = SocketOpen( lsysbase, service->s_secured, service->s_port, SOCKET_TYPE_SERVER );
	
	if( service->s_Socket != NULL )
	{
		service->s_Socket->VerifyPeer = VerifyPeer;
		SocketSetBlocking( service->s_Socket, TRUE );

		if( SocketListen( service->s_Socket ) != 0 )
		{
			SocketClose( service->s_Socket );
			FERROR("[COMMSERV]  Cannot listen on socket!\n");
			pthread_exit( NULL );
			return -1;
		}
		
		DEBUG("[COMMSERV-s] CommServiceThreadServer\n");
		
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
		
		service->s_Started = TRUE;
		
		while( service->s_Cam.cam_Quit != TRUE )
		{
			FD_ZERO( &readfds );
			
			FD_SET( socket->fd, &readfds );
			FD_SET( service->s_ReadCommPipe, &readfds );
			
			DEBUG("[COMMSERV-s] Before select, maxd %d\n", maxd );
			
			int activity = select( maxd+1, &readfds, NULL, NULL, NULL );
			
			DEBUG("[COMMSERV-s] After select\n");
			
			if( ( activity < 0 ) && ( errno != EINTR ) )
			{
				FERROR("[COMMSERV-s] Select error\n");
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
					FERROR("[COMMSERV] : cannot accept incoming connection\n");
					break;
				}
				
				if( incomming->protocolCallback == NULL )
					
					DEBUG2("[COMMSERV] Socket Connection Accepted\n");
				
				incomming->s_Timeouts = 5;
				incomming->s_Timeoutu = 0;
				if( SocketSetBlocking( incomming, TRUE ) == -1)
				{
					FERROR("[COMMSERV]SocketSetBlocking\n");
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
					DataForm *df = (DataForm *)buffer;
					
					if( df->df_ID == ID_FCRE )
					{
						FriendCoreManager *lfcm = FCalloc( 1, sizeof( struct FriendCoreManager ) );//FriendCoreManagerNew();
						memcpy( lfcm->fcm_ID, ((FUBYTE *)df)+COMM_MSG_HEADER_SIZE, (FRIEND_CORE_MANAGER_ID_SIZE)*sizeof(FUBYTE) );
						DEBUG2("[COMMSERV] FriendOS connected, name '%128s'\n", lfcm->fcm_ID );
						
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
						FERROR("[COMMSERV] C1Someone was trying to connect to your machine!\n");
					}
				}
				else
				{
					FERROR("[COMMSERV] Cannot read from socket!\n");
					
					continue;
				}
			}
			
			if( FD_ISSET( service->s_ReadCommPipe, &readfds ) )
			{
				// read all bytes from read end of pipe
				char ch;
				int result = 1;
				
				DEBUG2("[COMMSERV] Read from pipe!\n");
				
				while( result > 0 )
				{
					result = read( service->s_ReadCommPipe, &ch, 1 );
					DEBUG2("[COMMSERV] Read from pipe %c\n", ch );
					if( ch == 'q' )
					{
						//goto service_exit;
						service->s_Cam.cam_Quit = TRUE;
						DEBUG2("[COMMSERV] Closing!\n");
						break;
					}
				}
				
				if( service->s_Cam.cam_Quit == TRUE )
				{
					break;
				}
			}
		}	// quit != TRUE
		
		SocketClose( service->s_Socket );
	}
	else
	{
		FERROR("[COMMSERV-s] Cannot open socket for communcation thread!\n");
	}
	
	DEBUG("[COMMSERV-s] CommunicationService End\n");
	
	ptr->t_Launched = FALSE;
	
	pthread_exit( NULL );
	return 0;
}

/**
 * Register new CommunicationService event (epoll)
 *
 * @param con pointer to new CommFCConnection
 * @param socket pointer latest accepted socket
 * @return 0 when success, otherwise error number
 */

int CommServiceRegisterEvent( CommFCConnection *con, Socket *socket )
{
	CommService *cserv = (CommService *)con->cfcc_Service;
	// add event

	con->cfcc_Thread = ThreadNew( CommServiceThreadConnection, con, TRUE, NULL );

	return 0;
}

/**
 * UnRegister CommunicationService event (epoll)
 *
 * @param con pointer to CommFCConnection
 * @param socket pointer socket on which communication is working
 * @return 0 when success, otherwise error number
 */

int CommServiceUnRegisterEvent( CommFCConnection *con, Socket *socket )
{
	return 0;
}

#endif // USE_SELECT
