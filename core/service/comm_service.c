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
 *  CommunicationService body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

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
#ifndef USE_SELECT
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

pthread_cond_t InitCond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t InitMutex = PTHREAD_MUTEX_INITIALIZER;

inline void CommServiceSetupOutgoing( CommService *service );

/**
 * Create CommunicationService
 *
 * @param port internet port on which service will work
 * @param secured 1 when connection must be secured, otherwise 0
 * @param sb pointer to SystemBase
 * @param maxev maximum number of handled events (by epoll)
 * @param bufsiz internal service buffer size
 * @return pointer to new CommunicationService when success, otherwise NULL
 */

CommService *CommServiceNew( int port, int secured, void *sb, int maxev, int bufsiz  )
{
	CommService *service = NULL;
	DEBUG2("[COMMSERV] CommunicationServiceNew START\n"); 
	
	//if( ( service =  (ServiceAppMsg*)mmap( NULL, sizeof( CommService ), PROT_READ|PROT_WRITE, MAP_SHARED, -1, 0 ) ) != NULL )
	if( ( service = FCalloc( 1, sizeof( CommService ) )  ) != NULL )
	{
		DEBUG2("[COMMSERV] CommunicationService created type \n" );
		//service->s_Type = type;
		service->s_BufferSize = bufsiz;
		service->s_MaxEvents = maxev;
		service->s_port = port;
		service->s_secured = secured;
		
		//service->s_outMqfd = -1;
		pipe2( service->s_sendPipe, 0 );
		pipe2( service->s_recvPipe, 0 );
		
		service->s_SB = sb;
		
		pthread_mutex_init( &service->s_Mutex, NULL );
		pthread_cond_init( &service->s_DataReceivedCond, NULL );
		//DEBUG("CommunicationService before mutex creation\n");
	}
	else
	{
		Log( FLOG_ERROR, "Cannot allocate memory for communication service\n");
	}
	DEBUG2("[COMMSERV] CommunicationServiceNew END\n"); 
	
	return service;
}

/**
 * Delete CommunicationService
 *
 * @param s pointer to CommunicationService which will be removed
 */

void CommServiceDelete( CommService *s )
{
	DEBUG2("[COMMSERV] CommunicationServiceDelete\n");
	if( s != NULL )
	{
		s->s_Cam.cam_Quit = TRUE;
		
		pthread_mutex_lock( &s->s_Mutex );

		CommRequest *cr = s->s_Requests;
		while( cr != NULL )
		{
			//DEBUG("Going through requests %ld find %ld\n", df[ 1 ].df_Size, cr->cr_RequestID );
			//DEBUG( "[CommServiceDelete] Setting requests to null before broadcasting.\n" );
			cr->cr_Bs = NULL;
			cr->cr_Time = 0;
			
			cr = (CommRequest *) cr->node.mln_Succ;
		}
		
		pthread_cond_broadcast( &s->s_DataReceivedCond );
		
		pthread_mutex_unlock( &s->s_Mutex );
		
		DEBUG2("[COMMSERV] : Quit set to TRUE, sending signal\n");
		
		char ch = 'q';
		write( s->s_WriteCommPipe, &ch, 1);
		
		DEBUG2("[COMMSERV]  close thread\n");
		
		if( s->s_Thread )
		{
			ThreadDelete( s->s_Thread );
		}
		
		DEBUG2("[COMMSERV]  closeing pipes\n");

		if( close(  s->s_sendPipe[0]  ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
			
		if( close( s->s_sendPipe[1] ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
			
		if( close( s->s_recvPipe[0] ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
			
		if( close( s->s_recvPipe[1] ) != 0 )
		{
			Log( FLOG_ERROR,"Cannot close pipe\n");
		}
		
		pthread_mutex_lock( &s->s_Mutex );
		SystemBase *lsb = (SystemBase *)s->s_SB;
		FriendCoreManager *fcm = lsb->fcm;//s->s_FCM;
		
		DEBUG("Closing connections : Incoming\n");
		// close incoming connections
		
		CommFCConnection *con = s->s_Connections;
		CommFCConnection *rcon = con;
		while( con != NULL )
		{
			rcon = con;
			con = (CommFCConnection *) con->node.mln_Succ;
			DEBUG("Delete connection\n");
			CommFCConnectionDelete( rcon );
		}
		s->s_Connections = NULL;
		
		pthread_mutex_unlock( &s->s_Mutex );
		
		DEBUG2("[COMMSERV] : pipes closed\n");
		
		pthread_mutex_destroy( &s->s_Mutex );
		pthread_cond_destroy( &s->s_DataReceivedCond );
		
		if( s->s_Buffer )
		{
			FFree( s->s_Buffer );
			s->s_Buffer = NULL;
		}
		FFree( s );
		
		Log( FLOG_ERROR,"[COMMSERV] Communication service closed\n");
	}
}

/**
 * Start CommunicationService
 *  Function is launching CommunicationService thread
 *
 * @param s pointer to CommunicationService
 * @return 0 when service will be launched without problems, otherwise error number
 */

int CommServiceStart( CommService *s )
{
	if( s )
	{
		Log( FLOG_INFO, "[COMMSERV] Communication service SERVER start\n");

		pthread_mutex_init( &InitMutex, NULL );

#ifdef USE_SELECT
		s->s_Thread = ThreadNew( CommServiceThreadServerSelect, s, TRUE );
#else
		s->s_Thread = ThreadNew( CommServiceThreadServer, s, TRUE );
#endif

		DEBUG("[COMMSERV] CommServiceStart, pointer to thread %p\n", s->s_Thread );
		
		if( s->s_Thread == NULL )
		{
			FERROR("[COMMSERV] Cannot start CommunicationThread\n");
		}
		
		// wait till server will start
		
		while( s->s_Started != TRUE )
		{
			usleep( 2000 );
		}
			CommServiceSetupOutgoing( s );
	}
	return 0;
}

/**
 * Stop CommunicationService
 *  Function stops CommunicationService thread
 *
 * @param s pointer to CommunicationService
 * @return 0 when service will be stopped without problems, otherwise error number
 */

int CommServiceStop( CommService *s )
{
	return 0;
}

//
// internal thread structure
//

struct FCCommMsg
{
	CommService			*fccm_Service;
	Socket						*fccm_Socket;
	BufString					*fccm_BS;
};

/**
 * Receive and send Service messages
 *
 * @param ft pointer to CommunicationService FThread structure
 */

void ParseCallThread( FThread *ft )
{
	struct FCCommMsg *fcmsg = (struct FCCommMsg *)ft->t_Data;
	
	DataForm *recvDataForm = NULL;
	FBOOL isStream = FALSE;
	int count = fcmsg->fccm_BS->bs_Size;
	
	FERROR("[COMMSERV] All data received, processing bytes %d-------------------------------------------PROCESSING ANSWER\n", count );
	
	recvDataForm = ParseMessage( fcmsg->fccm_Service, fcmsg->fccm_Socket, (FBYTE *)fcmsg->fccm_BS->bs_Buffer, (int *)&count, &isStream );
	
	if( recvDataForm != NULL )
	{
		DEBUG2("[COMMSERV] Data received-----------------------------------------%d\n", recvDataForm->df_Size);
		
		int wrote = 0;
		
		if( isStream == FALSE )
		{
			wrote = SocketWrite( fcmsg->fccm_Socket, (char *)recvDataForm, recvDataForm->df_Size );
		}
		DEBUG2("[COMMSERV] Wrote bytes %d\n", wrote );
		
		// remove data form
		DataFormDelete( recvDataForm );
		BufStringDelete( fcmsg->fccm_BS );
	}
	ft->t_Launched = FALSE;
}

/**
 * Function read configuration and setup outgoing connections
 *
 * @param service pointer to CommunicationService
 */

inline void CommServiceSetupOutgoing( CommService *service )
{
	//                                           *
	// atm we only read FC connections
	//
	
	FERROR("Outgoing\n\n\n\n");
	
	struct PropertiesLibrary *plib = NULL;
	char *servers = NULL;
	Props *prop = NULL;
	
	// teporary
	//usleep( 1000 );
	
	if( ( plib = (struct PropertiesLibrary *)LibraryOpen( SLIB, "properties.library", 0 ) ) != NULL )
	{
		char coresPath[ 1024 ];
		sprintf( coresPath, "%s/cfg/cfg.ini", getenv( "FRIEND_HOME" ) );
		
		prop = plib->Open( coresPath  );
		if( prop != NULL)
		{
			DEBUG("reading login\n");
			servers = plib->ReadString( prop, "Cores:servers", "" );
			DEBUG("servers %s\n", servers );
		}
		//DEBUG("PROPERTIES LIBRARY OPENED, poitner to props %p!   %s  %s  %s  %s  %d\n", prop, login, pass, host, dbname, port );
	}
	
	if( servers != NULL )
	{
		char *token;
		
		DEBUG("Server list found %s\n", servers );
		
		// get the first token 
		token = strtok( servers, SERVER_SPLIT_SIGN );
		// walk through other tokens 
		while( token != NULL ) 
		{
			CommFCConnection *newcon = NULL;
			
			char *address = token;
			char *ipport = NULL;
			int port = service->s_port;
			
			// now split address:port
			
			char *pos = strchr( address, SERVER_PORT_SPLIT_SIGN );
			if( pos != NULL )
			{
				*pos = 0;
				ipport = ++pos;
				port = atoi( ipport );
			}
			
			DEBUG2("New connection found address : %s \n", address );
			
			Socket *newsock;
			
			newsock = SocketConnectHost( service->s_SB, service->s_secured, address, port );
			//newcon->cfcc_Socket = SocketOpen( service->s_secured, service->s_port, SOCKET_TYPE_CLIENT );
			if( newsock != NULL )
			{
				DEBUG2("Incoming and outgoing connection set\n");
				int err = 0;
				DEBUG("Outgoing connection created on port: %d\n", service->s_port);

				CommFCConnection *con = CommServiceAddConnection( service, newsock, address, NULL, SERVICE_CONNECTION_OUTGOING );
			}
			else
			{
				CommFCConnectionDelete( newcon );
				FERROR("Cannot open socket\n");
			}
			DEBUG( "TOKEN %s\n", token );
			
			token = strtok( NULL, "," );
		}
		
		DEBUG("All tokens passed\n");
		
	}
	else
	{	// servers == NULL
	}
	
	if( plib != NULL && prop != NULL )
	{
		plib->Close( prop );
	}
	
	if( plib != NULL )
	{
		LibraryClose( (struct Library *)plib );
	}
	DEBUG("CommunicationClient start working\n");
}

/**
 * CommunicationService main thread
 *
 * @param ptr pointer to CommunicationService main thread
 * @return 0 when success, otherwise error number
 */

int CommServiceThreadServer( FThread *ptr )
{
	CommService *service = (CommService *)ptr->t_Data;
	
	DEBUG("[COMMSERV]  Start\n");
	SystemBase *lsb = (SystemBase *)service->s_SB;
	
	service->s_Socket = SocketOpen( lsb, service->s_secured, service->s_port, SOCKET_TYPE_SERVER );
	
	if( service->s_Socket != NULL )
	{
		SocketSetBlocking( service->s_Socket, FALSE );
		
		if( SocketListen( service->s_Socket ) != 0 )
		{
			SocketClose( service->s_Socket );
			FERROR("[COMMSERV]  Cannot listen on socket!\n");
			return -1;
		}
		
		DEBUG("\n\nCommServiceThreadServer\n\n\n");
		
		// Create epoll
		service->s_Epollfd = epoll_create1( 0 );
		if( service->s_Epollfd == -1 )
		{
			FERROR( "[COMMSERV]  poll_create\n" );
			return -1;
		}

		// Register for events
		struct epoll_event mevent;
		memset( &mevent, 0, sizeof( mevent ) );
		mevent.data.fd = service->s_Socket->fd;
		mevent.events = EPOLLIN | EPOLLET;
		
		FriendCoreManager *fcm = (FriendCoreManager *)lsb->fcm; 
		
		if( epoll_ctl( service->s_Epollfd, EPOLL_CTL_ADD, service->s_Socket->fd, &mevent ) == -1 )
		{
			FERROR( "[COMMSERV]  epoll_ctl" );
			return -1;
		}

		{
			int eventCount;
			int retval;
			int i;
			
			struct epoll_event currentEvent;
			struct epoll_event* events = (struct epoll_event*) FCalloc( service->s_MaxEvents, sizeof( struct epoll_event ) );
			ssize_t count;
			//Socket* incomming = NULL;

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
			
			DEBUG("[COMMSERV] , before main loop\n");
			
			service->s_Started = TRUE;
			
			while( service->s_Cam.cam_Quit != TRUE )
			{
				//usleep( 10000000 );
				//DEBUG("[COMMSERV] Thread at work, waiting\n");
				
				// All incomming network events go through here :)
				// Wait for something to happen on any of the sockets we're listening on
				
				#define EPOLL_TIMEOUT 3000
				
				eventCount = epoll_wait( service->s_Epollfd, events, service->s_MaxEvents, EPOLL_TIMEOUT );
				
				//DEBUG("event count %d\n", eventCount );
				
				if( eventCount == 0 )
				{
					//DEBUG( "[CommServiceThreadServer] Timeout broadcast\n" );
					if( pthread_mutex_lock( &service->s_Mutex ) == 0 )
					{
						//DEBUG( "[CommServiceThreadServer] Locked mutex and broadcasting condition!\n" );
						pthread_cond_broadcast( &service->s_DataReceivedCond );
						
						pthread_mutex_unlock( &service->s_Mutex );
					}
					continue;
				}
				
				for( i = 0; i < eventCount; i++ )
				{
					currentEvent = events[i];
					
					Socket *sock = ( Socket *)currentEvent.data.ptr;
					
					DEBUG("[COMMSERV] Event count\n");
					
					if(
						( currentEvent.events & EPOLLERR ) ||
						( currentEvent.events & EPOLLHUP ) ||
						( !( currentEvent.events & EPOLLIN ) ) )
					{
						// An error has occured on this fd, or the socket is not ready for reading (why were we notified then?).
						// TODO: Proper error logging
						FERROR("[COMMSERV] FDerror!\n");
						
						CommFCConnection *loccon = NULL;
						loccon = sock->s_Data;

						// Remove event
						epoll_ctl( service->s_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );
						
						if( 0 == CommServiceDelConnection( service, loccon, sock ) )
						{
							INFO("Socket connection removed\n");
						}
						else
						{
							FERROR("Cannot remove socket connection\n");
						}

						SocketClose( sock );
						sock = NULL;
						
						//loccon->cfcc_Status = SERVICE_STATUS_DISCONNECTED;
						//connections--;
						DEBUG("CommService: socket closed\n");
					}

					// Accept incomming connections
					else if( currentEvent.data.fd == service->s_Socket->fd )
					{
						// We have a notification on the listening socket, which means one or more incoming connections.
						while( TRUE )
						{
							//FERROR
							//TODO
							// FIX!
							//SocketSetBlocking( incomming, TRUE );

							FERROR("-=================RECEIVED========================-\n");
							
							Socket *incomming = SocketAccept( service->s_Socket );
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
							
							DEBUG2("[COMMSERV] Socket Connection Accepted\n");
							
							incomming->s_Timeouts = 5;
							incomming->s_Timeoutu = 0;
							//
							 //							if( SocketSetBlocking( incomming, TRUE ) == -1)
							 //							{
							 //								FERROR("[COMMSERV]SocketSetBlocking\n");
							 //								SocketClose( incomming );
							 //								continue;
							 					// Set the default protocol callback
							incomming->protocolCallback = (void* (*)( Socket_t* sock, char* bytes, unsigned int size ))&ParseMessage;

							
							incomming->s_Timeouts = 5;
							incomming->s_Timeoutu = 0;
							
							// used for not persistent connections
							struct epoll_event event;
							
							event.data.fd = incomming->fd;//s->s_Socket->fd;
							event.data.ptr = (void *) incomming;
							event.events = EPOLLIN | EPOLLRDHUP | EPOLLET;
							int retval = epoll_ctl( service->s_Epollfd, EPOLL_CTL_ADD, incomming->fd, &event );
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
					else if( currentEvent.data.fd == service->s_ReadCommPipe )
					{
						// read all bytes from read end of pipe
						char ch;
						int result = 1;
						
						DEBUG2("[COMMSERV] Hogne Read from pipe!\n");
						
						while( result > 0 )
						{
							result = read( service->s_ReadCommPipe, &ch, 1 );
							DEBUG2("[COMMSERV] Hogne Read from pipe %c\n", ch );
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
					else
					{
						// Remove event // not persistent connection
						//epoll_ctl( service->s_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );
						
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
							
							DEBUG2("Readed from socket %lu\n", bs->bs_Size );
							
							int z = 0;
							for( z=0 ; z < bs->bs_Size ; z++ ) printf(" %c ", bs->bs_Buffer[ z ] );
							printf("\n");
							
							//DEBUG( "[COMMSERV] processing socket with a callback: %s\n", buffer );
							
							DEBUG2("\n\n\n\n\n\n\n[COMMSERV] PROCESSING RECEIVED CALL, DATA READED %d\n", (int)count );
							int dcount = count;
							DataForm *df = (DataForm *)bs->bs_Buffer;
							
							// checking if its FRIEND message
							char *friendCoreID = NULL;
							
							int j = 0;
							if( df->df_ID == ID_FCRE && count > 24 )
							{
								//char *id = (char *)&(df[ 2 ].df_ID);
								//DEBUG2("ID POS 2 %lu ID_RESP %lu ID_FRID %lu ID_QUERY %lu   ID %c %c %c %c\n", df[ 2 ].df_ID, ID_RESP, ID_FRID, ID_QUER, id[0], id[1], id[2], id[3] );
								df++;
								//df =(DataForm *)(((char *)df) + (6*sizeof(FULONG)) + df[ 1 ].df_Size);;
								
								if( df->df_ID == ID_FCID )
								{
									friendCoreID = ((char *)(df+1));
									DEBUG("pointer move %d - %d\n",df->df_Size,  df->df_Size + (sizeof(FULONG)));
									char *ptr = (char *)df;
									ptr += df->df_Size + (3*sizeof(FULONG) );
									df = (DataForm *)ptr;
									
									//int i;
									//for( i=0 ; i < 32 ; i++ )
									//{
									//	printf("- %c\n", ptr[ i ] );
									//}
								}
								
								DEBUG("Check resp %lu  -  %lu\n", df->df_ID, ID_RESP );
								
								if( df->df_ID == ID_RESP )
								{
									DEBUG("Response received!\n");
									
									pthread_mutex_lock( &service->s_Mutex );
									CommRequest *cr = service->s_Requests;
									while( cr != NULL )
									{
										DEBUG("Going through requests %ld find %ld\n", df->df_Size, cr->cr_RequestID );
										if( cr->cr_RequestID == df->df_Size )
										{
											cr->cr_Bs = bs;
											DEBUG("Message found by id\n");
											pthread_cond_broadcast( &service->s_DataReceivedCond );
											break;
										}
										cr = (CommRequest *) cr->node.mln_Succ;
									}
									pthread_mutex_unlock( &service->s_Mutex );
								}
								else if( df->df_ID == ID_QUER  )
								{
									// checking if its a request or response

									// we received whole data
									// Process data
									struct FCCommMsg *commsg;
									if( ( commsg = FCalloc( 1, sizeof( struct FCCommMsg ) ) ) != NULL )
									{
										commsg->fccm_BS = bs;
										commsg->fccm_Service = service;
										commsg->fccm_Socket = sock;
										
										WorkerManagerRun( lsb->fcm->fcm_FriendCores->fci_WorkerManager, ParseCallThread, commsg );
									}
								}
								else if( df->df_ID == ID_FCON )
								{
									INFO("[COMMSERV] New connection was set\n");

									FriendCoreManager *lfcm = FCalloc( 1, sizeof( struct FriendCoreManager ) );//FriendCoreManagerNew();

									DEBUG2("[COMMSERV] FriendOS connected, name '%128s'\n", friendCoreID );

									//
									// on the end we should accept connection but do not allow to call anything
									// untill admin will accept connection
									//

									CommFCConnection *con = CommServiceAddConnection( service, sock, NULL, friendCoreID, SERVICE_CONNECTION_INCOMING );

									sock->s_Data = con;
									
									if( con != NULL )
									{
										// if we have new connection
										// we should setup same outgoing connection

										DEBUG("Finding address\n");
										char address[ INET6_ADDRSTRLEN ];
										inet_ntop( AF_INET6, &sock->ip, address, INET6_ADDRSTRLEN );

										int err = 0;

										DEBUG("Outgoing connection created on port: %d\n", service->s_port);
										//SocketSetBlocking( newcon->cfcc_Socket, TRUE );
										{
											// when connection tag is received we must response with our FriendCoreID 
											
											DEBUG("Generate Data Form\n");
											MsgItem tags[] = {
												{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
												{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
												{ ID_FCOR, (FULONG)0 , MSG_INTEGER_VALUE },
												{ TAG_DONE, TAG_DONE, TAG_DONE }
											};
											
											DataForm *dfresp = DataFormNew( tags );
											DEBUG("DataForm Created size %d\n", dfresp->df_Size );
											
											// FC send his own id in response
											int sbytes = SocketWrite( sock, (char *)dfresp, dfresp->df_Size );

											DataFormDelete( dfresp );
											
											FERROR("-=====================OUTGOING CREATED====================-\n");
										}
										
										FFree( lfcm );
										lfcm = NULL;
									}
									else
									{
										FFree( lfcm );
										lfcm = NULL;
										SocketClose( sock );
										FERROR( "[COMMSERV] Closing incoming!\n" );
									}
									BufStringDelete( bs );
									
								}
								else if( df->df_ID == ID_FRID )
								{
									DEBUG("Received request (id)\n");
									FULONG reqid = df->df_Size;
									
									DEBUG("Request id  data %lu size %lu\n", df->df_Data, df->df_Size );
									
									int error = ParseAndExecuteRequest( lsb, sock->s_Data, ++df );
									
									// when connection tag is received we must response with our FriendCoreID 
									
									DEBUG("RESPONSE Generate Data Form\n");
									MsgItem tags[] = {
										{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
										{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
										{ ID_RESP, (FULONG)reqid , MSG_INTEGER_VALUE },
										{ ID_CMMD, (FULONG)error, MSG_INTEGER_VALUE },
										{ TAG_DONE, TAG_DONE, TAG_DONE }
									};
									
									DataForm *responsedf = DataFormNew( tags );
									DEBUG("RESPONSE %d\n", responsedf->df_Size );
									
									// FC send his own id in response
									int sbytes = SocketWrite( sock, (char *)responsedf, responsedf->df_Size );
									
									//char *ptr = (char *)responsedf;
									//int i;
									//for( i=0 ; i < 32 ; i++ )
									//{
									//	printf("- %c\n", ptr[ i ] );
									//}
									
									DEBUG("WROTE to sock %d\n", sbytes );
									
									DataFormDelete( responsedf );
								}
								else
								{
									FERROR("[COMMSERV] Message uknown!\n");
									BufStringDelete( bs );
								}
								
								DEBUG2("[COMMSERV]  end while\n");
								
								if( tempBuffer != NULL )
								{
									FFree( tempBuffer );
									tempBuffer = NULL;
								}
							}
							else
							{
								FERROR("[COMMSERV] Message uknown!\n");
								BufStringDelete( bs );
							}
							DEBUG("[COMMSERV]  : end2\n");
						}
						DEBUG("[COMMSERV]  : end1\n");
					}
				}//end for through events
			} //end while
			
			DEBUG("[COMMSERV]  : Closing internal pipes\n");
			
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
			DEBUG( "[COMMSERV] Done freeing events" );
			events = NULL;
		}
		DEBUG("[COMMSERV] Close sockets\n");
		
		// Close epoll file descriptor
		
		shutdown( service->s_Epollfd, SHUT_RDWR );
		close( service->s_Epollfd );
		
		SocketClose( service->s_Socket );
	}
	else
	{
		FERROR("[COMMSERV] Cannot open socket for communcation thread!\n");
	}
	
	DEBUG("[COMMSERV] CommunicationService End\n");
	
	ptr->t_Launched = FALSE;
	
	return 0;
}

#ifndef USE_SELECT

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
	//if( type == SERVICE_TYPE_SERVER )
	{
		struct epoll_event event;
		
		event.data.fd = socket->fd;//s->s_Socket->fd;
		event.data.ptr = (void *) socket;
		event.events = EPOLLIN | EPOLLRDHUP | EPOLLET;
		int retval = epoll_ctl( cserv->s_Epollfd, EPOLL_CTL_ADD, socket->fd, &event );
		if( retval == -1 )
		{
			FERROR("[COMMSERV] EPOLLctrl error\n");
			
			//SocketClose( service->s_Socket );
			//abort();
			return 1;
		}
		else
		{
			DEBUG("Socket added to events handling sock ptr %p\n", socket);
		}
	}
	return 0;
}

#endif

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

/**
 * Add new FC connection
 *
 * @param s pointer to new CommService
 * @param socket pointer socket on which communication is working
 * @param addr pointer to internet address
 * @param id pointer to FC id
 * @param type communication service type (incomming/outgoing)
 * @return pointer to new CommFCConnection structure when success, otherwise NULL
 */

CommFCConnection *CommServiceAddConnection( CommService* s, Socket* socket, char *addr, char *id, int type )
{
	struct sockaddr_in clientAddr;
	
	/*
	if( addr != NULL && strstr( addr, "127.0.0.1"  ) != NULL )
	{
		FERROR("Cannot add 127.0.0.1 address\n");
		return NULL;
	}
	*/
	
	char lid[ 256 ];
	memset( lid, 0, sizeof(lid) );
	
	char locaddr[ 32 ];
	memset( locaddr, 0, sizeof( locaddr ) );
	
	// when outgoing connection is created, then message must be send to another FC
	// another FC will send us message of his own FCID
	
	if( type == SERVICE_CONNECTION_OUTGOING )
	{
		SystemBase *lsb = (SystemBase *)s->s_SB;
		
		FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;
		
		MsgItem tags[] = {
			{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
			{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)fcm->fcm_ID },
			{ ID_FCON, (FULONG)0 , MSG_INTEGER_VALUE },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};
		
		DEBUG("Generate Data Form\n");
		DataForm * df = DataFormNew( tags );
		DEBUG("DataForm Created  %ld\n", df->df_Size );
		
		int sbytes = SocketWrite( socket, (char *)df, df->df_Size );
		
		DEBUG("Message sent %d\n", sbytes );
		DataFormDelete( df );
		
		BufString *result = SocketReadTillEnd( socket, 0, 15 );
		if( result != NULL )
		{
			if( result->bs_Size > 0 )
			{
				DataForm *resultDF = (DataForm *)result->bs_Buffer;
				if( resultDF->df_ID == ID_FCRE )
				{
					char *tmp = (char *)(resultDF+2);
					memcpy( lid, tmp, FRIEND_CORE_MANAGER_ID_SIZE );
					id = lid;
				}
			}
		
			BufStringDelete( result );
		}
	}
	
	if( id == NULL )
	{
		FERROR("ID not provided. Rejecting connection\n");
		return NULL;
	}

	DEBUG("Add new FC connection  %s ; socket ptr %p\n", type ? "client" : "server", socket );

	CommFCConnection *cfcn = NULL;
	CommFCConnection *con  = s->s_Connections;

	while( con != NULL )
	{
		if( addr != NULL && con->cfcc_Address != NULL && strcmp( con->cfcc_Address, addr )  == 0 )
		{
			DEBUG("We found connection with CORE %s\n",  id  );
			break;
		}
		
		if( id != NULL && con->cfcc_Name != NULL && strcmp( con->cfcc_Address, id )  == 0 )
		{
			DEBUG("We found connection with CORE %s\n",  id  );
			break;
		}
		
		con =  (CommFCConnection *)con->node.mln_Succ;
	}
	DEBUG("FC finding connection end\n");
	
	// if we are getting incoming connection, we must take address from socket
	if( type == SERVICE_CONNECTION_INCOMING )
	{
		socklen_t clientAddrSize = sizeof( clientAddr );
		int res = getpeername( socket->fd, (struct sockaddr *)&clientAddr, &clientAddrSize );
		
		strcpy( locaddr, "error" );
	
		if( res == 0 )
		{
			strcpy( locaddr, (char *)inet_ntoa( clientAddr.sin_addr ) );
		}
		addr = locaddr;

		DEBUG("Pointer to commservice %p\n", s );
	}

	if( con == NULL )
	{
		cfcn = CommFCConnectionNew( addr, id, type, s );
		if( cfcn != NULL )
		{
			socket->node.mln_Succ = (MinNode *)cfcn->cfcc_Socket;
			cfcn->cfcc_Socket = socket;
			
			cfcn->cfcc_ConnectionsNumber++;
		
			INFO("INCOMING Connection added %s %s number of connections %d type %d\n", addr, id, cfcn->cfcc_ConnectionsNumber, type );

			cfcn->node.mln_Succ = (MinNode *) s->s_Connections;
			s->s_Connections = cfcn;
		}
		DEBUG("new connection created\n");
	}
	else
	{
		DEBUG("old connection will be used\n");
		cfcn = con;
	}
	/*
	if( cfcn != NULL )
	{
		socket->node.mln_Succ = (MinNode *)cfcn->cfcc_Socket;
		cfcn->cfcc_Service = s;
		cfcn->cfcc_Socket = socket;
		
		cfcn->cfcc_ConnectionsNumber++;
	
		DEBUG("INCOMING Connection added %s %s number of connections %d\n", addr, id, cfcn->cfcc_ConnectionsNumber );
		
		return cfcn;
	}
*/
	//FERROR("Cannot  add new connection\n");
	return cfcn;
}

/**
 * Add new FC connection
 *
 * @param s pointer to new CommService
 * @param socket pointer socket on which communication is working
 * @param addr pointer to internet address
 * @param id pointer to FC id
 * @param type communication service type (incomming/outgoing)
 * @return pointer to new CommFCConnection structure when success, otherwise NULL
 */

CommFCConnection *CommServiceAddConnectionByAddr( CommService* s, char *addr )
{
	struct sockaddr_in clientAddr;

	//DEBUG("Add new FC connection  %s ; socket ptr %p\n", type ? "client" : "server", socket );
	
	if( addr == NULL )
	{
		return NULL;
	}
	
	CommFCConnection *cfcn = NULL;
	CommFCConnection *con  = s->s_Connections;

	while( con != NULL )
	{
		if( strcmp( con->cfcc_Address, addr )  == 0 )
		{
			if( con->cfcc_Socket != NULL )
			{
				return con;
			}
		}
		con =  (CommFCConnection *)con->node.mln_Succ;
	}
	
	Socket *newsock = SocketConnectHost( s->s_SB, s->s_secured, addr, s->s_port );
	if( newsock == NULL )
	{
		FERROR("Cannot setup connection with host: %s\n", addr );
		return NULL;
	}
	char id[ 256 ];
	memset( id, 0, sizeof(id) );
	
	BufString *result = SocketReadTillEnd( newsock, 0, 15 );
	if( result != NULL )
	{
		if( result->bs_Size > 0 )
		{
			DataForm *resultDF = (DataForm *)result->bs_Buffer;
			memcpy( id, &(result->bs_Buffer[ 73 ]), FRIEND_CORE_MANAGER_ID_SIZE );
		}
		
		BufStringDelete( result );
	}

	FERROR("Cannot  add new connection\n");
	return NULL;
}

/**
 * Remove FC connection
 *
 * @param s pointer to CommService
 * @param loccon pointer to CommFCConnection which will be removed
 * @param socket pointer socket on which communication is working
 * @return 0 when success, otherwise error number
 */

int CommServiceDelConnection( CommService* s, CommFCConnection *loccon, Socket *sock )
{
	SystemBase *lsb = (SystemBase *)s->s_SB;
	FriendCoreManager *fcm = (FriendCoreManager *)lsb->fcm; //s->s_FCM;
	CommFCConnection *con  = NULL;
	
	pthread_mutex_lock( &s->s_Mutex );
	//
	// connection is server
	//

	// incomming connections are removed by epoll
	
	con = s->s_Connections;
	while( con != NULL )
	{
		if( con == loccon )
		{
			DEBUG("We found connection with CORE\n" );
			break;
		}
		con =  (CommFCConnection *)con->node.mln_Succ;
	}
			
	DEBUG("Remove socket connection\n");
	
	if( con != NULL )
	{
		loccon->cfcc_ConnectionsNumber--;
		
		Socket *c = con->cfcc_Socket;
		Socket *prev = c;
		while( c != NULL )
		{
			// we store previous socket
			prev = c;
			if( c == sock )
			{
				// we remove socket connection
				
				if( c == con->cfcc_Socket )
				{
					con->cfcc_Socket = (Socket *)c->node.mln_Succ;
				}
				else
				{
					prev->node.mln_Succ = c->node.mln_Succ;
				}
				
				con->cfcc_ConnectionsNumber--;
				
				DEBUG("Socket connection removed, connections left %d\n", con->cfcc_ConnectionsNumber );
				break;
			}
			c = (Socket *)c->node.mln_Succ;
		}
		
		// if thats our last socket, we must set it to NULL
		if( con->cfcc_ConnectionsNumber == 0 )
		{
			con->cfcc_Socket = NULL;
		}
	}

	DEBUG("Socket connection removed\n");
	
	pthread_mutex_unlock( &s->s_Mutex );
	
	return 0;
}


