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

#include <core/types.h>
#include "comm_service.h"
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
#include <sys/epoll.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include <properties/propertieslibrary.h>
#include <core/friendcore_manager.h>

#include <service/comm_msg.h>

#define FLAGS S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH
#define MAX_MSG 50

//
// cfg/cores.ini
//[Cores]
//servers=localhost,server1,server2

// we must be sure that task will wait until queue will be ready

pthread_cond_t InitCond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t InitMutex = PTHREAD_MUTEX_INITIALIZER;

//
// Creste new service
//

CommService *CommServiceNew( int type, void *fcm, int maxev, int bufsiz  )
{
	CommService *service = NULL;
	DEBUG("CommunicationServiceNew START\n"); 
	
	//if( ( service =  (ServiceAppMsg*)mmap( NULL, sizeof( CommService ), PROT_READ|PROT_WRITE, MAP_SHARED, -1, 0 ) ) != NULL )
	if( ( service = FCalloc( 1, sizeof( CommService ) )  ) != NULL )
	{
		DEBUG("CommunicationService created type %d\n", type );
		service->s_Type = type;
		service->s_BufferSize = bufsiz;
		service->s_MaxEvents = maxev;
		
		//service->s_outMqfd = -1;
		pipe2( service->s_sendPipe, 0 );
		pipe2( service->s_recvPipe, 0 );
		
		service->s_FCM = fcm;
		
		//DEBUG("CommunicationService before mutex creation\n");
	}
	DEBUG("CommunicationServiceNew END\n"); 
	
	return service;
}

//
// delete CommService
//

void CommServiceDelete( CommService *s )
{
	DEBUG("CommunicationServiceDelete\n");
	if( s )
	{
		s->s_Cam.cam_Quit = TRUE;
		
		char ch = 'q';
		write( s->s_WriteCommPipe, &ch, 1);
		
		DEBUG("CommService close thread\n");
		
		if( s->s_Thread )
		{
			ThreadDelete( s->s_Thread );
		}
		
		DEBUG("CommService close MQ\n");
		
		close( s->s_sendPipe[0] );
		close( s->s_sendPipe[1] );
		close( s->s_recvPipe[0] );
		close( s->s_recvPipe[1] );
		
		if( s->s_Buffer )
		{
			FFree( s->s_Buffer );
			s->s_Buffer = NULL;
		}
		FFree( s );
		
		DEBUG("Communication resources free\n");
	}
}

//
// Start CommService
//

int CommServiceStart( CommService *s )
{
	if( s )
	{	
		if( s->s_Type == SERVICE_TYPE_SERVER )
		{
			INFO("Communication service SERVER start\n");
			
			pthread_mutex_init( &InitMutex, NULL );
			
			s->s_Thread = ThreadNew( CommServiceThreadServer, s, TRUE );
		}else{		// SERVICE_TYPE_SEND
			
			INFO("Communication service CLIENT start\n");
			
			s->s_Thread = ThreadNew( CommServiceThreadClient, s, TRUE );
		}
		
		DEBUG("CommServiceStart, pointer to thread %p\n", s->s_Thread );
		
		if( s->s_Thread == NULL )
		{
			ERROR("Cannot start CommunicationThread\n");
		}
	}
	return 0;
}

//
// Stop CommService
//

int CommServiceStop( CommService *s )
{
	return 0;
}

//
// we handle here all messages from connected FC
//

DataForm *ParseMessage( CommService *serv, BYTE *data, int *len )
{
	DataForm *df = (DataForm *)data;
	DataForm *actDataForm = NULL;
	
	if( *len <= 0 )
	{
		DEBUG("No more data provided, quit!\n");
		return NULL;
	}
	
	switch( df->df_ID )
	{
		case ID_FCRE:
			DEBUG("MAIN HEADER\n");
			actDataForm = DataFormNew( NULL );
			data += COMM_MSG_HEADER_SIZE;
			*len -= COMM_MSG_HEADER_SIZE;
			
			break;
			
		case ID_QUER:	// data query
			//TODO
			DEBUG("QUERY FOUND %ld\n", df->df_Size );
			FriendCoreManager *fcm = (FriendCoreManager *) serv->s_FCM;
			
			MsgItem tags[] = {
				{ ID_RESP, (ULONG)64, (ULONG)fcm->fcm_ID },
				{ TAG_DONE, TAG_DONE, TAG_DONE }
			};
			
			actDataForm = DataFormNew( tags );
			
			data += df->df_Size;
			*len -= df->df_Size;
			
			break;
			
		case ID_SVIN:
			DEBUG("SERVICES INFORMATION\n");
			{
				FriendCoreManager *fcm = (FriendCoreManager *) serv->s_FCM;
				Service *lsrv = fcm->fcm_ServiceManager->sm_Services;
				ULONG size = 0;
				
				// getting size of names for a buffer
				
				while( lsrv != NULL )
				{
					size += strlen( lsrv->GetName() ) + 1 + COMM_MSG_HEADER_SIZE;
					lsrv = (Service *)lsrv->node.mln_Succ;
				}
				
				// we create buffer now and put names into it
				
				if( size > 0 )
				{
					BYTE *tmpnames = FCalloc( size, sizeof( char ) );
					if( tmpnames != NULL )
					{
						MsgItem tags[] = {
							{ ID_SVIN, 0, NULL },
							{ TAG_DONE, TAG_DONE, TAG_DONE }
						};
			
						actDataForm = DataFormNew( tags );
						
						BYTE *nameptr = tmpnames;
						ID snameinfo = ID_SNAM;
						ULONG snamesize = 0;
						
						lsrv = fcm->fcm_ServiceManager->sm_Services;
						while( lsrv != NULL )
						{
							snamesize = strlen( lsrv->GetName() ) + 1;
							int copyStringSize = snamesize;
							snamesize += COMM_MSG_HEADER_SIZE;
							
							DEBUG("Adding service to answer '%s'\n", lsrv->GetName() );
							
							memcpy( nameptr, &snameinfo, sizeof(ULONG) );
							nameptr += sizeof(ULONG);
							memcpy( nameptr, &snamesize, sizeof(ULONG) );
							nameptr += sizeof(ULONG);
							memcpy( nameptr, lsrv->GetName(), copyStringSize );
							nameptr += copyStringSize;
							
							//size += strlen( lsrv->GetName() ) + 9;
							lsrv = (Service *)lsrv->node.mln_Succ;
						}
						
						DataFormAdd( &actDataForm, tmpnames, size );
						//DEBUG("Adding service to message\n");
						
					}
				}
				data += COMM_MSG_HEADER_SIZE;
				*len -= COMM_MSG_HEADER_SIZE;
			}
			break;
			
		case ID_RPOK:
			DEBUG("RESPONSE OK\n");
			break;
		case ID_RPKO:
			DEBUG("RESPONSE NOT OK\n");
			break;
		case ID_CMND:
			DEBUG("COMMAND CALLED\n");
			break;
		default:
		{
			//DEBUG("MESSAGE NOT RECOGNIZED!\n");
			char id[ 5 ];
			memcpy( id, df, 4 * sizeof(char) );
			id[ 4 ] = 0;
			//ULONG size = df->df_Size;
			//strncpy( id, (char *)df->df_ID, 4 );
			
			DEBUG("MESSAGE NOT FOUND ID %s SIZE %d   ID '%c'%c'%c'%c'\n", id, *len, id[0], id[1], id[2], id[3] );
		}
	}
	
	DEBUG("---------------------->%ld\n", actDataForm->df_Size );
	
	if( actDataForm != NULL )
	{
		DataForm *tmp = ParseMessage( serv, data, len );
		if( tmp != NULL )
		{
			//DEBUG("PARSE MESSAGE RETURNED FORM\n");
			DataFormAddForm( &actDataForm, tmp );
			DataFormDelete( tmp );
		}
	}
	
	return actDataForm;
}

//
// Service Thread
//

int CommServiceThreadServer( FThread *ptr )
{
	//return 0;
	CommService *service = (CommService *)ptr->t_Data;
	
	DEBUG("CommunicationServiceReceive Start\n");
	
	service->s_Socket = SocketOpen( FALSE, FRIEND_COMMUNICATION_PORT, SOCKET_TYPE_SERVER );
	
	if( service->s_Socket != NULL )
	{
		SocketSetBlocking( service->s_Socket, FALSE );
		if( !SocketListen( service->s_Socket ) )
		{
			SocketClose( service->s_Socket );
			ERROR("CommunicationService Cannot listen on socket!\n");
			return -1;
		}
		
		// Create epoll
		service->s_Epollfd = epoll_create1( 0 );
		if( service->s_Epollfd == -1 )
		{
			ERROR( "CommunicationService poll_create\n" );
			return -1;
		}

		// Register for events
		struct epoll_event event;
		memset( &event, 0, sizeof( event ) );
		event.data.fd = service->s_Socket->fd;
		event.events = EPOLLIN | EPOLLET;
		
		if( epoll_ctl( service->s_Epollfd, EPOLL_CTL_ADD, service->s_Socket->fd, &event ) == -1 )
		{
			ERROR( "CommunicationService epoll_ctl" );
			return -1;
		}

		{
			unsigned int connections = 0;
			int eventCount;
			int retval;
			int i;
			struct epoll_event event;
			struct epoll_event currentEvent;
			struct epoll_event* events = (struct epoll_event*) FCalloc( service->s_MaxEvents, sizeof event );
			ssize_t count;
			Socket_t* incomming = NULL;
			Socket_t* sock = NULL;
			char buffer[ service->s_BufferSize ];
			
			// add communication ReadCommPipe
			
			int pipefds[2] = {};
			struct epoll_event piev = { 0 };
			
			pipe2( pipefds, 0 );
			
			service->s_ReadCommPipe = pipefds[ 0 ];
			service->s_WriteCommPipe = pipefds[1];

			// make read-end non-blocking
			int flags = fcntl( service->s_ReadCommPipe, F_GETFL, 0 );
			fcntl( service->s_WriteCommPipe, F_SETFL, flags|O_NONBLOCK );

			// add the read end to the epoll
			piev.events = EPOLLIN;
			piev.data.fd = service->s_ReadCommPipe;
			epoll_ctl( service->s_Epollfd, EPOLL_CTL_ADD, service->s_ReadCommPipe, &piev );
			
			DEBUG("CommunicationService, before main loop\n");
			
			while( service && service->s_Cam.cam_Quit != TRUE )
			{
				//usleep( 10000000 );
				//DEBUG("CommunicationService Thread at work\n");

				// All incomming network events go through here :)
				// Wait for something to happen on any of the sockets we're listening on
				eventCount = epoll_wait( service->s_Epollfd, events, service->s_MaxEvents, -1 );

				for( i = 0; i < eventCount; i++ )
				{
					currentEvent = events[i];
					sock = (Socket_t*) currentEvent.data.ptr;
					
					DEBUG("Event count\n");
					
					if(
						( currentEvent.events & EPOLLERR ) ||
						( currentEvent.events & EPOLLHUP ) ||
						( !( currentEvent.events & EPOLLIN ) ) )
					{
						// An error has occured on this fd, or the socket is not ready for reading (why were we notified then?).
						// TODO: Proper error logging
						SocketClose( sock );
						connections--;
					}
					// Normal shutdown (Shutdown can happen here, or during the read loop)
					else if( currentEvent.events & EPOLLRDHUP )
					{
						SocketClose( sock );
						connections--;
					}
					// Accept incomming connections
					else if( currentEvent.data.fd == service->s_Socket->fd )
					{
						// We have a notification on the listening socket, which means one or more incoming connections.
						while( TRUE )
						{
							//ERROR
							//TODO
							// FIX!
							incomming = SocketAccept( service->s_Socket );
							if( incomming == NULL )
							{
								// We have processed all incoming connections.
								if( (errno == EAGAIN ) || ( errno == EWOULDBLOCK) )
								{
									break;
								}
								// Other error
								ERROR("accept\n");
								break;
							}
							
							DEBUG("Connection Accepted\n");

							if( SocketSetBlocking( incomming, FALSE ) == -1)
							{
								ERROR("[COMMSERV]SocketSetBlocking\n");
								SocketClose( incomming );
								continue;
							}

							// Set the default protocol callback
							incomming->protocolCallback = &ParseMessage;

							//
							// we must check first if its FC communication
							//
							
							//SocketSetBlocking( incomming, FALSE ); 
							//INFO("BEFDATAREADED\n");
							count = SocketRead( incomming, (char *)&buffer, service->s_BufferSize, 0 );
							// count = read( sock->fd, &buffer, BUFFER_READ_SIZE );
							if( count > 0 )
							{
								//INFO("C1DATA READED %d\n", (int)count );
								DataForm *df = (DataForm *)buffer;
								
								if( df->df_ID == ID_FCRE )
								{
									FriendCoreManager *lfcm = FriendCoreManagerNew();
									memcpy( lfcm->fcm_ID, ((UBYTE *)df)+COMM_MSG_HEADER_SIZE, FRIEND_CORE_MANAGER_ID_SIZE*sizeof(UBYTE) );
									INFO("C1FriendOS connected, name '%64s'\n", lfcm->fcm_ID );
									//INFO("Message created name byte %c%c%c%c\n", lfcm->fcm_ID[32], lfcm->fcm_ID[33], lfcm->fcm_ID[34], lfcm->fcm_ID[35]	);
									
									incomming->s_Data = lfcm;
								}
								else
								{
									ERROR("C1Someone was trying to connected to your machine!\n");
								}
							}
							else
							{
								ERROR("Cannot read from socket!\n");
								//FriendCoreManagerDelete( incomming->s_Data );
								SocketClose( incomming );
								//exit(0);
								
								continue;
							}
							// Add instance reference
							//incomming->instance = instance;

							// Register for read events, disconnection events and enable edge triggered behavior
							event.data.ptr = incomming;
							event.events = EPOLLIN | EPOLLRDHUP | EPOLLET;
							retval = epoll_ctl( service->s_Epollfd, EPOLL_CTL_ADD, incomming->fd, &event );
							if( retval == -1 )
							{
								ERROR("EPOLLctrl error\n");
								
								SocketClose( service->s_Socket );
								abort();
							}
							
							connections++;
						}
						
						//
						// checking internal pipe
						//
						
					}
					else if( currentEvent.data.fd == service->s_ReadCommPipe )
					{

						// read all bytes from read end of pipe
						char ch;
						int result = 1;
						
						DEBUG("Read from pipe!\n");
						
						while( result > 0 )
						{
							result = read( service->s_ReadCommPipe, &ch, 1 );
							DEBUG("Read from pipe %c\n", ch );
							if( ch == 'q' )
							{
								//goto service_exit;
								service->s_Cam.cam_Quit = TRUE;
								DEBUG("Closing!\n");
								break;
							}
						}
						
						if( service->s_Cam.cam_Quit == TRUE )
						{
							break;
						}
					}
					else
					{
						// We must read whatever data is available completely, as we are running in edge-triggered mode
						// and won't get a notification again for the same data.
						//DEBUG("[COMMSERV]: received message\n");
						BYTE *tempBuffer = NULL;
						int tempSize = 0;
						
						while( 1 )
						{
							// Read the socket data into the buffer associated with the ring buffer entry.
							// Set the entry's fd field to the current socket fd.
							count = SocketRead( sock, (char *)&buffer, service->s_BufferSize, 0 );
							//count = read( sock->fd, &buffer, BUFFER_READ_SIZE );
							//DEBUG("[COMMSERV]: got message from socket %d\n", (int)count );

							if( count == -1 )
							{
								// EAGAIN or EWOULDBLOCK means we have no more data that can be read.
								// Everything else is a real error.
								if( !( errno == EAGAIN || errno == EWOULDBLOCK ) )
								{
									DEBUG( "[COMMSERV] closing socket" );
									//FriendCoreManagerDelete( sock->s_Data );
									SocketClose( sock );
									connections--;
								}
								break;
							}
							else if( count == 0 )
							{
								// Technically we don't need to handle this here, since we wait for EPOLLRDHUP. We handle it just to be sure.
								DEBUG( "[COMMSERV] closing socket 2" );
								//FriendCoreManagerDelete( sock->s_Data );
								SocketClose( sock );
								connections--;
								break;
							}
							
							//
							// Data from socket arrived, we call function to handle commands
							//
							
							else if( sock->protocolCallback )
							{
								//DEBUG( "[COMMSERV] processing socket with a callback: %s\n", buffer );
								
								DEBUG("DATA READED %d\n", (int)count );
								int dcount = count;
								DataForm *df = (DataForm *)buffer;
								
								// checking if its FRIEND message
								
								if( df->df_ID == ID_FCRE )
								{
									if( count >= (ssize_t)df->df_Size )
									{	// we received whole data
										// Process data
										DataForm *recvDataForm = NULL;
										
										ERROR("All data received, processing bytes %d-------------------------------------------PROCESSING ANSWER\n", dcount );
										if( tempBuffer == NULL )
										{
											// we ar passing submessage
											recvDataForm = sock->protocolCallback( service, buffer, (int)&dcount );//&(buffer[ COMM_MSG_HEADER_SIZE ]), (int)count );
										}
										else
										{
											dcount = tempSize;
											recvDataForm = sock->protocolCallback( service, (char *)tempBuffer, (int)&dcount );//(char *)&(tempBuffer[ COMM_MSG_HEADER_SIZE ]), (int)tempSize );
											
											free( tempBuffer );
											tempBuffer = NULL;
											tempSize = 0;
										}
										DEBUG("Data processed-----------------------------------------\n");
										
										// return information
										if( recvDataForm != NULL )
										{
											SocketWrite( sock, (char *)recvDataForm, recvDataForm->df_Size );
											
											// remove data form
											DataFormDelete( recvDataForm );
										}else{
											// prepare asnwer
											// everything goes well - no response
											
											DataForm *tmpfrm = DataFormNew( NULL );
											
											BYTE tdata[ 20 ];
											ULONG *tdatau = (ULONG *)tdata;
											tdatau[ 0 ] = ID_RPOK;
											tdatau[ 1 ] = 20;
											strcpy( (char *)&tdata[ 8 ], "No response" );
											DataFormAdd( &tmpfrm, tdata, 20 );
											
											SocketWrite( sock, (char *)tmpfrm, tmpfrm->df_Size );
											
											DataFormDelete( tmpfrm );
										}
									}
									else	// we must receive whole message
									{
										if( tempBuffer == NULL )
										{
											tempBuffer = FCalloc( count, sizeof( BYTE ) );
											memcpy( tempBuffer, buffer, count*sizeof(BYTE) );
											tempSize = count;
										}else{
											BYTE *tmp = FCalloc( tempSize+count, sizeof(BYTE) );
											if( tmp != NULL )
											{
												memcpy( tmp, tempBuffer, tempSize*sizeof(BYTE) );
												memcpy( &tmp[ tempSize ], buffer, count*sizeof(BYTE) );
												
												FFree( tempBuffer );
												tempBuffer = tmp;
												tempSize += count;
											}
										}
									}
								}
								else
								{
									ERROR("Someone was trying to connected to your machine!\n");
								}
							}
						}	// while
						
						if( tempBuffer != NULL )
						{
							FFree( tempBuffer );
							tempBuffer = NULL;
						}
					}
					//DEBUG("end2\n");
				}
				//DEBUG("end1\n");
			}
			
			DEBUG("Closing internal pipes\n");
			
			close( pipefds[0] );
			close( pipefds[1] );

			// TODO: Free open sockets here
			DEBUG( "[COMMSERV] Freeing all events" );
			FFree( events);
			DEBUG( "[COMMSERV] Done freeing events" );
			events = NULL;
		}
		DEBUG("Close sockets\n");
		
		SocketClose( service->s_Socket );
	}
	else
	{
		ERROR("Cannot open socket for communcation thread!\n");
	}
	
	DEBUG("CommunicationService End\n");

	return 0;
}


