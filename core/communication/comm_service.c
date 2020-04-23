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
 *  @date created 14/10/2015
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
#ifndef USE_SELECT
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
#include <util/time.h>
#include <hardware/network.h>

#define FLAGS S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH
#define MAX_MSG 50

void *get_in_addr(const struct sockaddr *sa) {

    if( sa->sa_family == AF_INET) // IPv4 address
        return &(((struct sockaddr_in*)sa)->sin_addr);
    // else IPv6 address
    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

//
// cfg/cores.ini
// [Cores]
// servers=localhost@servername1,192.168.12.1@server2

// we must be sure that task will wait until queue will be ready

pthread_cond_t InitCond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t InitMutex = PTHREAD_MUTEX_INITIALIZER;

void CommServiceSetupOutgoing( CommService *service );

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
	
	if( ( service = FCalloc( 1, sizeof( CommService ) )  ) != NULL )
	{
		service->s_BufferSize = bufsiz;
		service->s_MaxEvents = maxev;
		service->s_port = port;
		service->s_secured = secured;
		
		pipe2( service->s_sendPipe, 0 );
		pipe2( service->s_recvPipe, 0 );
		
		service->s_SB = sb;
		
		pthread_mutex_init( &service->s_Mutex, NULL );
		pthread_cond_init( &service->s_DataReceivedCond, NULL );
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
		
		while( s->s_OutgoingConnectionSet != TRUE )
		{
			sleep( 1 );
		}
		
		pthread_cond_broadcast( &s->s_DataReceivedCond );
		FRIEND_MUTEX_LOCK( &s->s_Mutex );

		CommRequest *cr = s->s_Requests;
		while( cr != NULL )
		{
			cr->cr_Bs = NULL;
			cr->cr_Time = 0;
			
			cr = (CommRequest *) cr->node.mln_Succ;
		}
		
		pthread_cond_broadcast( &s->s_DataReceivedCond );
		
		FRIEND_MUTEX_UNLOCK( &s->s_Mutex );
		
		DEBUG2("[COMMSERV] : Quit set to TRUE, sending signal\n");
		
		while( TRUE )
		{
			char ch = 'q';
			write( s->s_WriteCommPipe, &ch, 1);
			
			if( s->s_Thread->t_Launched == FALSE )
			{
				break;
			}
			DEBUG("sending quit signal\n");
			sleep( 1 );
		}
		DEBUG2("[COMMSERV]  close thread\n");
		
		if( s->s_Thread )
		{
			ThreadDelete( s->s_Thread );
		}
		
		DEBUG2("[COMMSERV] Closing pipes\n");

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
		
		FRIEND_MUTEX_LOCK( &s->s_Mutex );
		SystemBase *lsb = (SystemBase *)s->s_SB;
		FriendCoreManager *fcm = lsb->fcm;
		
		DEBUG("[COMMSERV] Closing connections : Incoming\n");
		// close incoming connections
		
		FConnection *con = s->s_Connections;
		FConnection *rcon = con;
		while( con != NULL )
		{
			rcon = con;
			con = (FConnection *) con->node.mln_Succ;
			
			DEBUG("[COMMSERV] Delete connection\n");
			FConnectionDelete( rcon );
		}
		s->s_Connections = NULL;
		
		FRIEND_MUTEX_UNLOCK( &s->s_Mutex );
		
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

//
//
//


void *ServiceTempThread( void *d )
{
	CommServiceSetupOutgoing( d );
	DEBUG("[ServiceTempThread] pthread quit\n");
	pthread_exit(0);
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
		s->s_Thread = ThreadNew( CommServiceThreadServerSelect, s, TRUE, NULL );
#else
		s->s_Thread = ThreadNew( CommServiceThreadServer, s, TRUE, NULL );
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
		
		pthread_t t;
		pthread_create( &t, NULL, &ServiceTempThread, s );
		pthread_detach( t );
	}
	return 0;
}

/**
 * Stop CommunicationService UNIMPLEMENTED
 *  Function stops CommunicationService thread
 *
 * @param s pointer to CommunicationService
 * @return 0 when service will be stopped without problems, otherwise error number
 */

int CommServiceStop( CommService *s __attribute__((unused)) )
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
 * @param tdata pointer to CommunicationService FThread structure
 */
void ParseCallThread( void *tdata )
{
	FThread *ft = (FThread *)tdata;
	struct FCCommMsg *fcmsg = (struct FCCommMsg *)ft->t_Data;
	
	DataForm *recvDataForm = NULL;
	FBOOL isStream = FALSE;
	int count = fcmsg->fccm_BS->bs_Size;
	
	FERROR("[COMMSERV] All data received, processing bytes %d-------------------------------------------PROCESSING ANSWER\n", count );
	
	if( recvDataForm != NULL )
	{
		int wrote = 0;
		
		if( isStream == FALSE )
		{
			wrote = SocketWrite( fcmsg->fccm_Socket, (char *)recvDataForm, (FLONG)recvDataForm->df_Size );
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
void CommServiceSetupOutgoing( CommService *service )
{
	SystemBase *lsb = (SystemBase *)service->s_SB;
	FriendCoreManager *fcm = lsb->fcm;

	// if ID is different, we must change it in DB
	
	if( fcm->fcm_ClusterMaster != SLIB->fcm->fcm_ClusterID )
	{
		
	}
	
	DEBUG("------------------------------------------\n \
Create outgoing connections\n \
------------------------------------------\n" );
	
	SQLLibrary *lsqllib = SLIB->LibrarySQLGet( SLIB );
	if( lsqllib != NULL )
	{
		// when FC is in cluser there is need to split outgoing and incoming connections
		char data[ 129 ];
		char where[ 256 ];
		memcpy( data, fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
		data[ 128 ] = 0;
		
		//
		// Get information about cluster and connected nodes
		//
	
		snprintf( where, sizeof(where), "FCID='%s'", data );
	
		int entries;
		// reading FC connections
		fcm->fcm_CommService->s_Connections = lsqllib->Load( lsqllib, FConnectionDesc, where, &entries );
		// reading all cluster nodes
		// later we will assign connections to them
		fcm->fcm_ClusterNodes = lsqllib->Load( lsqllib, ClusterNodeDesc, NULL, &entries );
		//if( fcm->fcm_ClusterNodes != NULL )
		{
			// get current node id from DB
			ClusterNode *cnode = fcm->fcm_ClusterNodes;
			while( cnode != NULL )
			{
				if( cnode->cn_FCID != NULL && memcmp( cnode->cn_FCID, data, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 )
				{
					cnode->cn_CurrentNode = TRUE;
					break;
				}
				cnode = (ClusterNode *) cnode->node.mln_Succ;
			}
			
			// current node is not registered, we must register it in DB
			
			DEBUG("Cluster entry found: %p\n", cnode );
			
			if( cnode == NULL )
			{
				ClusterNode *ncn = ClusterNodeNew();
				if( ncn != NULL )
				{
					char buffer[ 32 ];
					memset( buffer, 0, 32 );
					ncn->cn_CurrentNode = TRUE;
			
					if( getPrimaryIp( buffer, 16 ) == 0 )
					{
						ncn->cn_Address = StringDuplicateN( buffer, 16 );
					}
			
					ncn->cn_NodeID = fcm->fcm_ClusterMaster;
					ncn->cn_FCID = StringDuplicateN( data, FRIEND_CORE_MANAGER_ID_SIZE );
			
					lsqllib->Save( lsqllib, ClusterNodeDesc, ncn );
					
					ncn->node.mln_Succ = (MinNode *) fcm->fcm_ClusterNodes;
					fcm->fcm_ClusterNodes = ncn;
					
					DEBUG("Node stored\n");
				}
			}
			
			// create connections between FC nodes
			/*
			cnode = fcm->fcm_ClusterNodes;
			while( cnode != NULL )
			{
				if( memcmp( cnode->cn_FCID, fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE ) != 0 )
				{
					DEBUG(".......................................................Create cluster connection: [%s]\n", cnode->cn_Address );
					Socket *newsock = SocketConnectHost( service->s_SB, service->s_secured, cnode->cn_Address, service->s_port );
					if( newsock != NULL )
					{
						DEBUG("Create cluster FConnection\n");
						FConnection *con = CommServiceAddConnection( service, newsock, NULL, cnode->cn_Address, NULL, SERVER_CONNECTION_OUTGOING, 0 );
						if( con != NULL )
						{
							DEBUG("Connection created, registering\n");
							con->fc_Status = CONNECTION_STATUS_CONNECTED;
							CommServiceRegisterEvent( con, newsock );
						
							con->node.mln_Succ = (MinNode *) fcm->fcm_CommService->s_Connections;
							fcm->fcm_CommService->s_Connections = con;
						}
					}
				}
				cnode = (ClusterNode *) cnode->node.mln_Succ;
			}
			*/
		}
		SLIB->LibrarySQLDrop( SLIB, lsqllib );
		
		//
		// Go through all connections
		//
		
		FBOOL masterFriendFound = FALSE;
		FConnection *loccon = fcm->fcm_CommService->s_Connections;
		while( loccon != NULL )
		{
			loccon->fc_Service = fcm->fcm_CommService;
			
			if( loccon->fc_Type == SERVER_CONNECTION_OUTGOING )
			{
				Socket *newsock = SocketConnectHost( service->s_SB, service->s_secured, loccon->fc_Address, service->s_port );
				if( newsock != NULL )
				{
					DEBUG("[CommServiceSetupOutgoing] Connection reestabilished\n");
					
					if( loccon->fc_Socket != NULL )
					{
						SocketDelete( loccon->fc_Socket );
						loccon->fc_Socket = newsock;
					}
					loccon->fc_Status = CONNECTION_STATUS_CONNECTED;
					
					FConnection *con = CommServiceAddConnection( service, newsock, NULL, loccon->fc_Address, NULL, SERVER_CONNECTION_OUTGOING, 0 );
					if( con != NULL )
					{
						//con->fc_ServerType = SERVER_TYPE_FRIEND_MASTER;
						CommServiceRegisterEvent( con, newsock );
						
						/*
						if( loccon->fc_ServerType == SERVER_TYPE_NODE || loccon->fc_ServerType == SERVER_TYPE_NODE_MASTER )
						{
							// assign connection node
							ClusterNode *cnode = fcm->fcm_ClusterNodes;
							while( cnode != NULL )
							{
								if( cnode->cn_FCID != NULL &&  memcmp( cnode->cn_FCID, con->fc_DestinationFCID, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 )
								{
									cnode->cn_Connection = con;
									break;
								}
								cnode = (ClusterNode *) cnode->node.mln_Succ;
							}
						}
						*/
						//lsqllib->Save( lsqllib, FConnectionDesc, con );
					}
				}
				else
				{
					loccon->fc_Status = CONNECTION_STATUS_DISCONNECTED;
				}
			}
			
			if( loccon->fc_ServerType == SERVER_TYPE_FRIEND_MASTER )
			{
				INFO("FriendMasterServer found\n");
				masterFriendFound = TRUE;
			}
			
			loccon = (FConnection *)loccon->node.mln_Succ;
		}
		
		//
		
		if( masterFriendFound == FALSE )
		{
			DEBUG("[CommServiceSetupOutgoing] trying to setup connection to Friend Master Server: %s\n", SLIB->sl_MasterServer );
			
			Socket *newsock = SocketConnectHost( service->s_SB, service->s_secured, SLIB->sl_MasterServer, service->s_port );
			//if( newsock != NULL ) // master connection must be always avaiable in list
			{
				DEBUG("[CommServiceSetupOutgoing] Connection to Master FriendNode created on port: %d\n", service->s_port);

				FConnection *con = CommServiceAddConnection( service, newsock, "FriendMaster", SLIB->sl_MasterServer, NULL, SERVER_CONNECTION_OUTGOING, 0 );
				if( con != NULL )
				{
					con->fc_ServerType = SERVER_TYPE_FRIEND_MASTER;
					CommServiceRegisterEvent( con, newsock );
					lsqllib->Save( lsqllib, FConnectionDesc, con );
				}
			}
		}
		
		ClusterNode *cnode = fcm->fcm_ClusterNodes;
		while( cnode != NULL )
		{
			// we must create Connections in cluster
			if( cnode->cn_CurrentNode == FALSE && cnode->cn_Connection == NULL ) //&& memcmp( cnode->cn_FCID, fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE ) != 0 )
			{
				DEBUG("[CommServiceSetupOutgoing] -------------------------------------------------- trying to setup node connection: %s - node ID: %lu\n", cnode->cn_Address, cnode->cn_ID );
			
				Socket *newsock = SocketConnectHost( service->s_SB, service->s_secured, cnode->cn_Address, service->s_port );
				//if( newsock != NULL ) // master connection must be always avaiable in list
				{
					DEBUG("[CommServiceSetupOutgoing] Connection to '%s' created on port: %d\n", cnode->cn_Address, service->s_port);

					FConnection *con = CommServiceAddConnection( service, newsock, cnode->cn_Address, cnode->cn_Address, NULL, SERVER_CONNECTION_OUTGOING, 0 );
					if( con != NULL )
					{
						DEBUG("Connection created\n");
						con->fc_ServerType = SERVER_TYPE_NODE;
						CommServiceRegisterEvent( con, newsock );
						
						con->fc_Data = cnode;
					}
					
					cnode->cn_Connection = con;
				}
			}
			cnode = (ClusterNode *) cnode->node.mln_Succ;
		}
	}
	
	DEBUG("[COMMSERV] CommunicationClient start working\n");
	
	service->s_OutgoingConnectionSet = TRUE;
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
	
	service->s_Socket = SocketNew( lsb, service->s_secured, service->s_port, SOCKET_TYPE_SERVER );
	
	if( service->s_Socket != NULL )
	{
		service->s_Socket->VerifyPeer = VerifyPeer;
		SocketSetBlocking( service->s_Socket, FALSE );
		
		if( SocketListen( service->s_Socket ) != 0 )
		{
			SocketDelete( service->s_Socket );
			FERROR("[COMMSERV]  Cannot listen on socket!\n");
			return -1;
		}
		
		DEBUG("[COMMSERV] CommServiceThreadServer\n");
		
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
			
			DEBUG("[COMMSERV] before main loop\n");
			
			service->s_Started = TRUE;
			
			while( service->s_Cam.cam_Quit != TRUE )
			{
				// All incomming network events go through here :)
				// Wait for something to happen on any of the sockets we're listening on
				
				#define EPOLL_TIMEOUT 3000
				
				eventCount = epoll_wait( service->s_Epollfd, events, service->s_MaxEvents, EPOLL_TIMEOUT );
				
				if( eventCount == 0 )
				{
					if( FRIEND_MUTEX_LOCK( &service->s_Mutex ) == 0 )
					{
						pthread_cond_broadcast( &service->s_DataReceivedCond );
						
						FRIEND_MUTEX_UNLOCK( &service->s_Mutex );
					}
					continue;
				}
				
				for( i = 0; i < eventCount; i++ )
				{
					currentEvent = events[i];
					
					Socket *sock = ( Socket *)currentEvent.data.ptr;
					
					if(
						( currentEvent.events & EPOLLERR ) ||
						( currentEvent.events & EPOLLHUP ) ||
						( !( currentEvent.events & EPOLLIN ) ) )
					{
						// An error has occured on this fd, or the socket is not ready for reading (why were we notified then?).

						FERROR("[COMMSERV] FDerror!\n");
						
						FConnection *loccon = NULL;
						if( sock != NULL )
						{
							loccon = sock->s_Data;

							DEBUG("[COMMSERV] remove socket connection %p\n", loccon );
							// Remove event
							epoll_ctl( service->s_Epollfd, EPOLL_CTL_DEL, sock->fd, NULL );
						
							if( loccon != NULL )
							{
								FRIEND_MUTEX_LOCK( &loccon->fc_Mutex );
								/*
								if( 0 == CommServiceDelConnection( service, loccon, sock ) )
								{
									INFO("Socket connection removed\n");
								}
								else
								{
									FERROR("Cannot remove socket connection\n");
								}
								*/
								sock->s_Data = NULL;
								loccon->fc_Socket = NULL;
								loccon->fc_Status = CONNECTION_STATUS_DISCONNECTED;
								
								FRIEND_MUTEX_UNLOCK( &loccon->fc_Mutex );
							}
							//SocketClose( sock );
						}

						//sock = NULL;
						
						//loccon->cfcc_Status = SERVICE_STATUS_DISCONNECTED;
						//connections--;
						DEBUG("[COMMSERV] socket closed\n");
					}

					// Accept incomming connections
					else if( currentEvent.data.fd == service->s_Socket->fd )
					{
						// We have a notification on the listening socket, which means one or more incoming connections.
						while( TRUE )
						{
							FERROR("-=================RECEIVED========================-\n");
							
							Socket *incomming = SocketAccept( service->s_Socket );
							if( incomming == NULL )
							{
								// We have processed all incoming connections.
								if( (errno == EAGAIN ) || ( errno == EWOULDBLOCK) )
								{
									//FERROR("EAGAIN or EWOULDBLOCK\n");
									break;
								}
								// Other error
								FERROR("[COMMSERV] : cannot accept incoming connection\n");
								break;
							}
							//SocketSetBlocking( incomming, TRUE );
							
							DEBUG2("[COMMSERV] Socket Connection Accepted\n");
							
							incomming->s_Timeouts = 5;
							incomming->s_Timeoutu = 0;

							incomming->s_Timeouts = 5;
							incomming->s_Timeoutu = 0;
							
							// used for not persistent connections
							struct epoll_event event;
							
							event.data.fd = incomming->fd;//s->s_Socket->fd;
							event.data.ptr = (void *) incomming;
							event.events = EPOLLIN | EPOLLET; // EPOLLRDHUP
							//event.events = EPOLLIN| EPOLLET | EPOLLRDHUP | EPOLLHUP | EPOLLERR; //all flags are necessary, otherwise epoll may not deliver disconnect events and socket descriptors will leak
							//event.events = EPOLLIN | EPOLLRDHUP | EPOLLET;
							int retval = epoll_ctl( service->s_Epollfd, EPOLL_CTL_ADD, incomming->fd, &event );
							if( retval == -1 )
							{
								FERROR("[CommServiceRemote] EPOLLctrl error\n");
								return 1;
							}
							break;
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
						
						while( result > 0 )
						{
							result = read( service->s_ReadCommPipe, &ch, 1 );
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

						FBYTE *tempBuffer = NULL;
						DEBUG("[COMMSERV] Wait for message on socket\n");

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
							
							DEBUG2("[COMMSERV] Readed from socket %lu\n", (unsigned long)bs->bs_Size );
							
							DataForm *df = (DataForm *)bs->bs_Buffer;
							
							// checking if its FRIEND message

							char incomingFriendCoreID[ FRIEND_CORE_MANAGER_ID_SIZE + 32 ];
							memset( incomingFriendCoreID, 0, FRIEND_CORE_MANAGER_ID_SIZE + 32 );
							
							unsigned int z;
							for( z=0 ; z < bs->bs_Size ; z++ )
								printf("_%c_ ", bs->bs_Buffer[ z ] );
							printf("\n");
							
							int j = 0;
							if( df->df_ID == ID_FCRE && count > 24 )
							{
								//char *id = (char *)&(df[ 2 ].df_ID);
								DEBUG2("COMMSERV] FCRE found\n");
								df++;

								if( df->df_ID == ID_FCID )
								{
									DEBUG("[COMMSERV] ID found\n");
									memcpy( incomingFriendCoreID, ((char *)(df+1)), FRIEND_CORE_MANAGER_ID_SIZE );

									char *ptr = (char *)df;
									DEBUG("[COMMSERV] size %lu\n", df->df_Size );
									ptr += df->df_Size + COMM_MSG_HEADER_SIZE;
									df = (DataForm *)ptr;
								}
								
								if( df->df_ID == ID_FCRI )
								{
									DEBUG("[COMMSERV] Response received!\n");
									
									FRIEND_MUTEX_LOCK( &service->s_Mutex );
									DEBUG("[COMMSERV] lock set\n");
									CommRequest *cr = service->s_Requests;
									while( cr != NULL )
									{
										DEBUG("[COMMSERV] Going through requests %ld find %ld\n", df->df_Size, cr->cr_RequestID );
										if( cr->cr_RequestID == df->df_Size )
										{
											cr->cr_Bs = bs;
											DEBUG("[COMMSERV] Message found by id\n");
											pthread_cond_broadcast( &service->s_DataReceivedCond );
											break;
										}
										cr = (CommRequest *) cr->node.mln_Succ;
									}
									FRIEND_MUTEX_UNLOCK( &service->s_Mutex );
								}
								
								// Another FC is trying to connect
								
								else if( df->df_ID == ID_FCON )
								{
									DataForm *clusterDF = df + 1;
									INFO("[COMMSERV] New connection was set\n");

									// if number 0 is connected then its normal server
									// 1 - node master
									// > 1 sub nodes
									FULONG nodeID = clusterDF->df_Size;
									FULONG newID = 0;
									if( fcm->fcm_ClusterMaster )
									{
										newID = fcm->fcm_NodeIDGenerator++;
									}

									DEBUG2("[COMMSERV] FriendOS connected, name '%s'\n", incomingFriendCoreID );

									//
									// on the end we should accept connection but do not allow to call anything
									// untill admin will accept connection
									//

									FConnection *con = CommServiceAddConnection( service, sock, NULL, NULL, incomingFriendCoreID, SERVER_CONNECTION_INCOMING, nodeID );

									if( con != NULL )
									{
										clusterDF++;
									if( clusterDF->df_ID == ID_FINF )
									{
										int size = clusterDF->df_Size;
										clusterDF++; // sessions
										
										while( size > 0 )
										{
											if( clusterDF->df_ID == ID_CITY )
											{
												if( con->fc_GEOCity != NULL )
												{
													FFree( con->fc_GEOCity );
												}
												con->fc_GEOCity = StringDuplicateN( (char *)(clusterDF+1), clusterDF->df_Size );
												DEBUG("GEOCITY found %s\n", con->fc_GEOCity );
											}
											else if( clusterDF->df_ID == ID_COUN )
											{
												int i;
												int max = clusterDF->df_Size;
												if( max > 9 ) max = 9;
												char *dptr = (char *)(clusterDF+1);
												
												for( i=0 ; i < max; i++ )
												{
													con->fc_GEOCountryCode[ i ] = dptr[ i ];
												}
												
												DEBUG("GEOCOUNTRY found %s\n", con->fc_GEOCountryCode );
											}
											
											size -= (COMM_MSG_HEADER_SIZE + clusterDF->df_Size );
											clusterDF++; // sessions
										}
										/*
										clusterDF++; // geolcation
										
										if( clusterDF->df_ID == ID_FGEO )
										{
											char *dstring = (char *)(clusterDF+1);
											printf("Geo sizeL %lu\n", clusterDF->df_Size );
											dstring[ clusterDF->df_Size-1 ] = 0;
											DEBUG("Found geolocation: [ %s ]\n", dstring );
										}
										*/
									}
										
										sock = con->fc_Socket;
										sock->s_Data = con;
									
										// if we have new connection
										// we should setup same outgoing connection

										char address[ INET6_ADDRSTRLEN ];
										inet_ntop( AF_INET6, &sock->ip, address, INET6_ADDRSTRLEN );

										int err = 0;

										DEBUG("[COMMSERV] Outgoing connection created on port: %d\n", service->s_port);
										//SocketSetBlocking( newcon->cfcc_Socket, TRUE );
										{
											// when connection tag is received we must response with our FriendCoreID 
											
											MsgItem tags[] = {
												{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
												{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
												{ ID_FCOR, (FULONG)0 , MSG_INTEGER_VALUE },
												{ ID_CLID, (FULONG)newID, MSG_INTEGER_VALUE },
												{ TAG_DONE, TAG_DONE, TAG_DONE }
											};
											
											DataForm *dfresp = DataFormNew( tags );
											DEBUG("[COMMSERV] DataForm Created size %lu\n", dfresp->df_Size );
											
											// FC send his own id in response
											int sbytes = SocketWrite( sock, (char *)dfresp, (FLONG)dfresp->df_Size );

											DataFormDelete( dfresp );
											
											INFO("Outgoing connection created\n");
											
											SQLLibrary *lsqllib = SLIB->LibrarySQLGet( SLIB );
											if( lsqllib != NULL )
											{
												char where[ 1024 ];
												snprintf( where, 1024, " FConnection where FCID='%s' AND Type=0", con->fc_FCID );
												//snprintf( where, 1024, " FConnection where FCID='%s' AND DestinationFCID='%s' AND Type=0", con->fc_FCID, con->fc_DestinationFCID );
												int number = lsqllib->NumberOfRecords( lsqllib, FConnectionDesc, where );
												DEBUG("Number of connection found in DB %d\n", number );
												if( number == 0 )
												{
													lsqllib->Save( lsqllib, FConnectionDesc, con );
												}
												SLIB->LibrarySQLDrop( SLIB, lsqllib );
											}
										}
									}
									else
									{
										SocketDelete( sock );
										sock = NULL;
										FERROR( "[COMMSERV] Closing incoming!\n" );
									}
									BufStringDelete( bs );
								}
								else if( df->df_ID == ID_FRID )
								{
									FULONG reqid = df->df_Size;
									
									DEBUG("[COMMSERV] Request socket data ptr %p size %lu\n", sock->s_Data, df->df_Size );
									
									// connection is not assigned to FCConnection, we cannot run commands
									if( sock->s_Data == NULL )
									{
										// when connection tag is received we must response with our FriendCoreID 
										DataForm *responsedf = NULL;

										DEBUG("[COMMSERV] Generate Data Form\n");
										MsgItem tags[] = {
											{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
											{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
											{ ID_FCRI, (FULONG)reqid , MSG_INTEGER_VALUE },
											{ ID_FERR, (FULONG)SERVER_ERROR_CONNOTASSIGNED, MSG_INTEGER_VALUE },
											{ TAG_DONE, TAG_DONE, TAG_DONE }
										};
										responsedf = DataFormNew( tags );

										DEBUG("[COMMSERV] Response idreq %lu\n", reqid );
									
										// FC send his own id in response
										int sbytes = SocketWrite( sock, (char *)responsedf, (FLONG)responsedf->df_Size );

										DEBUG("[COMMSERV] WROTE to sock %d\n", sbytes );
									
										DataFormDelete( responsedf );
									}
									else
									{
										FConnection *fccon = (FConnection *)sock->s_Data;
										
										// Friend cannot run blocked connections
										if( fccon->fc_Status != CONNECTION_STATUS_BLOCKED )
										{
											DataForm *responsedf = ParseAndExecuteRequest( lsb, sock->s_Data, ++df, reqid );
									
											// when connection tag is received we must response with our FriendCoreID 
											if( responsedf == NULL )
											{
												DEBUG("[COMMSERV] Generate Data Form\n");
												MsgItem tags[] = {
													{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
													{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)(FBYTE *)fcm->fcm_ID },
													{ ID_FCRI, (FULONG)reqid , MSG_INTEGER_VALUE },
													{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
													{ TAG_DONE, TAG_DONE, TAG_DONE }
												};
												responsedf = DataFormNew( tags );
											}
									
											DEBUG("[COMMSERV] Response idreq %lu\n", reqid );
									
											// FC send his own id in response
											int sbytes = SocketWrite( sock, (char *)responsedf, (FLONG)responsedf->df_Size );

											DEBUG("[COMMSERV] WROTE to sock %d\n", sbytes );
									
											DataFormDelete( responsedf );
										}
									}
									
									BufStringDelete( bs );
								}
								else
								{
									char eid[ 9 ]; eid[ 8 ] = 0;
									char *t = (char *)df;
									int z;
									for( z=0 ; z < 8 ; z++ )
										eid[ z ] = t[ z ];
									
									FERROR("[COMMSERV] Message uknown: [%s], FCRE found!\n", eid );

									BufStringDelete( bs );
								}

								if( tempBuffer != NULL )
								{
									FFree( tempBuffer );
									tempBuffer = NULL;
								}
							}
							else
							{
								char eid[ 9 ]; eid[ 8 ] = 0;
								char *t = (char *)df;
								int z;
								for( z=0 ; z < 8 ; z++ )
									eid[ z ] = t[ z ];
									
								FERROR("[COMMSERV] Message uknown [%s]!\n", eid );

								BufStringDelete( bs );
							}
						}
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
			
			FFree( events);
			events = NULL;
		}
		DEBUG("[COMMSERV] Close sockets\n");
		
		// Close epoll file descriptor
		
		shutdown( service->s_Epollfd, SHUT_RDWR );
		close( service->s_Epollfd );
		
		SocketDelete( service->s_Socket );
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

int CommServiceRegisterEvent( FConnection *con, Socket *socket )
{
	if( socket == NULL )
	{
		return -1;
	}
	CommService *cserv = (CommService *)con->fc_Service;
	// add event
	//if( type == SERVICE_TYPE_SERVER )
	{
		struct epoll_event event;
		
		event.data.fd = socket->fd;//s->s_Socket->fd;
		event.data.ptr = (void *) socket;
		event.events = EPOLLIN | EPOLLET; //EPOLLRDHUP
		DEBUG("[CommServiceRegisterEvent] cserv ptr %p socket ptr %p\n", cserv, socket );
		int retval = epoll_ctl( cserv->s_Epollfd, EPOLL_CTL_ADD, socket->fd, &event );
		if( retval == -1 )
		{
			Log( FLOG_ERROR, "[CommServiceRegisterEvent] EPOLLctrl error\n");
			
			return 1;
		}
		else
		{
			DEBUG("[CommServiceRegisterEvent] Socket added to events handling sock ptr %p\n", socket);
		}
	}
	return 0;
}

#endif

/**
 * UnRegister CommunicationService event (epoll) UNIMPLEMENTED
 *
 * @param con pointer to FConnection
 * @param socket pointer socket on which communication is working
 * @return 0 when success, otherwise error number
 */
int CommServiceUnRegisterEvent( FConnection *con __attribute__((unused)), Socket *socket __attribute__((unused)))
{
	return 0;
}

/**
 * Add new FC connection
 *
 * @param s pointer to new CommService
 * @param socket pointer socket on which communication is working
 * @param name pointer to user name
 * @param addr pointer to internet address
 * @param recvid received FCID (incoming connections)
 * @param type communication service type (incomming/outgoing)
 * @param cluster 0 - normal connection, 1 - cluster master, > 1 - cluster node
 * @return pointer to new FConnection structure when success, otherwise NULL
 */
FConnection *CommServiceAddConnection( CommService* s, Socket* socket, char *name, char *addr, char *recvid, int type, int cluster )
{
	struct sockaddr_in clientAddr;
	SystemBase *lsb = (SystemBase *)s->s_SB;
	FULONG clusterID = 0;
	FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm;
	
	//FERROR("\n\n\n\n------------------------------------------------\n service %p name %s addr %s recvid %s\n\n\n", s, name, addr, recvid );
	
	char recvfcid[ 256 ];
	memset( recvfcid, 0, sizeof(recvfcid) );
	
	char recvaddr[ 32 ];
	memset( recvaddr, 0, sizeof( recvaddr ) );
	
	// when outgoing connection is created, then message must be send to another FC
	// another FC will send us message of his own FCID
	
	if( type == SERVER_CONNECTION_OUTGOING )
	{
		if( socket != NULL )
		{
			if( !lsb->sl_USM || fcm->fcm_FCI == NULL || fcm->fcm_FCI->fci_City == NULL )
			{
				return NULL;
			}
			char *city = "none";
			char *ccode = "none";
			if( fcm->fcm_FCI != NULL )
			{
				if( fcm->fcm_FCI->fci_City != NULL )
				{
					city = fcm->fcm_FCI->fci_City;
				}
				if( fcm->fcm_FCI->fci_CountryCode[0] != 0 )
				{
					ccode = fcm->fcm_FCI->fci_CountryCode;
				}
			}
			
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, (FULONG)MSG_GROUP_START },
				{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)fcm->fcm_ID },
				{ ID_FCON, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_CLID, (FULONG)cluster, MSG_INTEGER_VALUE },
				{ ID_FINF, (uint64_t)0, (uint64_t)MSG_GROUP_START },
					{ ID_WSES, (uint64_t)lsb->sl_USM->usm_SessionCounter , MSG_INTEGER_VALUE },
					{ ID_COUN, strlen( ccode ) + 1, (FULONG)ccode },
					{ ID_CITY, strlen( city ) + 1, (FULONG)city },
				{ MSG_GROUP_END, 0,  0 },
				{ TAG_DONE, TAG_DONE, TAG_DONE }
			};
			
			DEBUG("Localisation string size %lu\n", strlen( fcm->fcm_FCI->fci_LocalisationJSON ) );
		
			DataForm * df = DataFormNew( tags );
		
			int64_t sbytes = SocketWrite( socket, (char *)df, (FLONG)df->df_Size );
		
			DataFormDelete( df );
		
			BufString *result = SocketReadTillEnd( socket, 0, 15 );
			if( result != NULL )
			{
				if( result->bs_Size > 0 )
				{
					char *resbuf = result->bs_Buffer;
					DataForm *resultDF = (DataForm *)resbuf;
					if( resultDF->df_ID == ID_FCRE )
					{
						char *tmp = (char *)(resultDF+2);
						memcpy( recvfcid, tmp, FRIEND_CORE_MANAGER_ID_SIZE );
					
						resbuf = tmp + FRIEND_CORE_MANAGER_ID_SIZE + COMM_MSG_HEADER_SIZE;
						// get new assigned clusterid
						DataForm *resultDF = (DataForm *)resbuf;
						clusterID = resultDF->df_Size;
					}
				}
				BufStringDelete( result );
			}
		
			if( recvfcid[ 0 ] == 0 )
			{
				FERROR("FCID not provided. Rejecting connection\n");
				return NULL;
			}
		}
	}
	else
	{
		if( recvid == NULL )
		{
			FERROR("FCID not provided. Rejecting connection\n");
			return NULL;
		}
		memcpy( recvfcid, recvid, FRIEND_CORE_MANAGER_ID_SIZE );
	}
	

	DEBUG("[CommServiceAddConnection] Add new FC connection  %s ; socket ptr %p\n", type ? "client" : "server", socket );

	FConnection *cfcn = NULL;
	FConnection *con  = s->s_Connections;
	char locname[ 256 ];

	while( con != NULL )
	{
		// we cannot create same connections (outgoing or incoming)
		if( con->fc_Type == type )
		{
			if( ( con->fc_FCID != NULL && memcmp( fcm->fcm_ID, con->fc_FCID, FRIEND_CORE_MANAGER_ID_SIZE ) == 0) \
				&& (con->fc_DestinationFCID != NULL && memcmp( fcm->fcm_ID, con->fc_FCID, FRIEND_CORE_MANAGER_ID_SIZE ) == 0)  )
			{
				DEBUG("Found same connection type: %d trying to find %d\n", con->fc_Type, type );
				break;
			}
		}
		
		con =  (FConnection *)con->node.mln_Succ;
	}
	DEBUG("[CommServiceAddConnection] FC finding connection end\n");
	
	// if we are getting incoming connection, we must take address from socket
	if( type == SERVER_CONNECTION_INCOMING )
	{
		// get IP from socket
		
		struct sockaddr_in6 serveraddr, clientaddr;
		socklen_t addrlen = sizeof( clientaddr );
		getpeername( socket->fd, (struct sockaddr *)&clientaddr, &addrlen);
		if( inet_ntop( AF_INET6, &clientaddr.sin6_addr, recvaddr, sizeof( recvaddr ) ) ) 
		{
			//DEBUG("Client address is %s\n", locaddr );
			//DEBUG("Client port is %d\n", ntohs(clientaddr.sin6_port));
		}
		else
		{
			strcpy( recvaddr, "Unknown" );
		}
		addr = recvaddr;
		
		if( name == NULL )
		{
			memcpy( locname, fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
			memcpy( &(locname[FRIEND_CORE_MANAGER_ID_SIZE]), "-INC", 4 );
			name = locname;
		}
		
		strcpy( recvfcid, recvid );
		
		DEBUG("[CommServiceAddConnection] Pointer to commservice %p\n", s );
	}
	else // OUTGOING
	{
		if( name == NULL )
		{
			memcpy( locname, fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
			memcpy( &(locname[FRIEND_CORE_MANAGER_ID_SIZE]), "-OUT", 4 );
			name = locname;
		}
	}

	if( con == NULL )
	{
		cfcn = FConnectionNew( addr, name, type, s );
		if( cfcn != NULL )
		{
			//socket->node.mln_Succ = (MinNode *)cfcn->fc_Socket;
			//cfcn->fc_Socket = socket;
			
			//cfcn->fc_ConnectionsNumber++;
		
			if( strlen( recvfcid ) > 0 )
			{
				INFO("[CommServiceAddConnection] INCOMING Connection added addr: %s recvfcid: %s number of connections %d type %d\n", addr, recvfcid, cfcn->fc_ConnectionsNumber, type );
			}
			else
			{
				INFO("[CommServiceAddConnection] INCOMING Connection added addr: %s number of connections %d type %d\n", addr, cfcn->fc_ConnectionsNumber, type );
			}

			cfcn->node.mln_Succ = (MinNode *) s->s_Connections;
			s->s_Connections = cfcn;
		}
		DEBUG("[CommServiceAddConnection] new connection created\n");
	}
	else
	{
		DEBUG("[CommServiceAddConnection] old connection will be used, csock %p\n", con->fc_Socket );
		cfcn = con;
	}
	
	if( cfcn != NULL )
	{
		cfcn->fc_ConnectionsNumber++;
		cfcn->fc_Service = s;
		cfcn->fc_Type = type;
		
		if( cfcn->fc_FCID != NULL )
		{
			FFree( cfcn->fc_FCID );
		}
		cfcn->fc_FCID = StringDuplicateN( fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
		
		if( cfcn->fc_DestinationFCID != NULL )
		{
			FFree( cfcn->fc_DestinationFCID );
			cfcn->fc_DestinationFCID = NULL;
		}
		if( recvfcid[ 0 ] != 0 )
		{
			cfcn->fc_DestinationFCID = StringDuplicate( recvfcid );
		}
		
		if( cfcn->fc_Socket != NULL )
		{
			DEBUG("Closing new socket\n");
			SocketDelete( socket );
			socket = NULL;
		}
		else
		{
			DEBUG("New socket added\n");
			cfcn->fc_Socket = socket;
			if( socket != NULL )
			{
				socket->s_Data = cfcn;
			}
		}
		/*
		if( cfcn->fc_Socket != NULL )
		{
			SocketDelete( socket );
			socket = NULL;
		}
		else
		{
			cfcn->fc_Socket = socket;
			if( socket != NULL )
			{
				socket->s_Data = cfcn;
			}
		}
		*/
		//DEBUG("FCID '%s' DSTFCID '%s'\n", cfcn->fc_FCID, cfcn->fc_DestinationFCID );
		
		if( socket != NULL && socket->s_SSLEnabled == TRUE )
		{
			X509 *cert = NULL;
			cert = SSL_get_peer_certificate( socket->s_Ssl );
			if( cert != NULL )
			{
				char *issuerName = X509_NAME_oneline( X509_get_issuer_name( cert ), 0, 0 );
		
				// looks like FC do not contain CERT connected to this connection, we must store it in DB
			
				char *data;
				unsigned int len = 0;
			
				cfcn->fc_SSLInfo = StringDuplicate( issuerName );
				
				BIO *bio = BIO_new( BIO_s_mem() );
				PEM_write_bio_X509( bio, cert );
				len = BIO_get_mem_data( bio, &data );
			
				cfcn->fc_PEM = StringDuplicateN( data, len );
					
				BIO_free( bio );
				
				if( issuerName != NULL )
				{
					free( issuerName );
				}
			} // if cert  = NULL
		} // SSL
	
		if( cfcn->fc_ClusterID != 1 )
		{
			cfcn->fc_ClusterID = clusterID;
		
			SQLLibrary *sqllib  = lsb->LibrarySQLGet( lsb );
			if( sqllib != NULL )
			{
				//fcm->fcm_ClusterNodes->cn_NodeID = clusterID;
		
				// if ClusterID was changed, we must update it
				char tmpQuery[ 256 ];
				sprintf( tmpQuery, "UPDATE `FClusterNode` SET NodeID='%lu' WHERE ID=%lu", cfcn->fc_ClusterID, cfcn->fc_ID );

				int error = sqllib->QueryWithoutResults( sqllib, tmpQuery );
				DEBUG("CluserID updated: %lu for ID %lu\n", clusterID, cfcn->fc_ClusterID );
		
				lsb->LibrarySQLDrop( lsb, sqllib );
			}
		}
	}
	
	Log( FLOG_INFO, "NodeID assigned: %lu\n", clusterID );

	return cfcn;
}

/**
 * Add new FC connection
 *
 * @param s pointer to new CommService
 * @param addr pointer to internet address
 * @return pointer to new FConnection structure when success, otherwise NULL
 */
FConnection *CommServiceAddConnectionByAddr( CommService* s, char *addr )
{
	struct sockaddr_in clientAddr;

	if( addr == NULL )
	{
		return NULL;
	}
	
	FConnection *cfcn = NULL;
	FConnection *con  = s->s_Connections;

	while( con != NULL )
	{
		if( strcmp( con->fc_Address, addr )  == 0 )
		{
			if( con->fc_Socket != NULL )
			{
				return con;
			}
		}
		con =  (FConnection *)con->node.mln_Succ;
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
 * @param loccon pointer to FConnection which will be removed
 * @param sock pointer socket on which communication is working (if NULL all connections are removed)
 * @return 0 when success, otherwise error number
 */
int CommServiceDelConnection( CommService* s, FConnection *loccon, Socket *sock )
{
	SystemBase *lsb = (SystemBase *)s->s_SB;
	FriendCoreManager *fcm = (FriendCoreManager *)lsb->fcm; //s->s_FCM;
	FConnection *con  = NULL, *prevcon;
	
	DEBUG("[CommServiceDelConnection] Start\n");
	FRIEND_MUTEX_LOCK( &s->s_Mutex );
	//
	// connection is server
	//

	// incomming connections are removed by epoll
	
	con = s->s_Connections;
	prevcon = con;

	while( con != NULL )
	{
		if( con == loccon )
		{
			DEBUG("[COMMSERV] We found connection with CORE\n" );
			break;
		}
		prevcon = con;
		con =  (FConnection *)con->node.mln_Succ;
	}
	
	FRIEND_MUTEX_UNLOCK( &s->s_Mutex );
	
	DEBUG("[COMMSERV] Remove socket connection\n");
	
	if( con != NULL )
	{
		loccon->fc_ConnectionsNumber--;
		
		DEBUG("[COMMSERV] Remove socket connection, number connections: %d\n", loccon->fc_ConnectionsNumber );
		
		// if sock = NULL, then we remove all sockets
		if( sock == NULL )
		{
			Socket *socket = con->fc_Socket;
			Socket *remsocket = socket;
			while( socket != NULL )
			{
				remsocket = socket;
				socket = (Socket *)socket->node.mln_Succ;
				
				con->fc_ConnectionsNumber--;
				
				epoll_ctl( s->s_Epollfd, EPOLL_CTL_DEL, remsocket->fd, NULL );
				DEBUG("[COMMSERV] I want close socket\n");
				SocketDelete( remsocket );
				DEBUG("[COMMSERV] Socket closed\n");
			}
			con->fc_Socket = NULL;
		}
		else
		{
			Socket *c = con->fc_Socket;
			Socket *prev = c;
			while( c != NULL )
			{
				// we store previous socket
				prev = c;
				if( c == sock )
				{
					// we remove socket connection
				
					if( c == con->fc_Socket )
					{
						con->fc_Socket = (Socket *)c->node.mln_Succ;
					}
					else
					{
						prev->node.mln_Succ = c->node.mln_Succ;
					}
				
					con->fc_ConnectionsNumber--;
				
					DEBUG("[COMMSERV] Socket connection removed, connections left %d\n", con->fc_ConnectionsNumber );
					break;
				}
				c = (Socket *)c->node.mln_Succ;
			}
			
			if( c != NULL )
			{
				epoll_ctl( s->s_Epollfd, EPOLL_CTL_DEL, c->fd, NULL );
				SocketDelete( c );
			}
		}
		
		DEBUG("[COMMSERV] Check number of connections\n");
		
		// if thats our last socket, we must set it to NULL and remove connection
		if( con->fc_ConnectionsNumber <= 0 )
		{
			con->fc_Socket = NULL;
			
			if( con ==  s->s_Connections )
			{
				s->s_Connections = (FConnection *)s->s_Connections->node.mln_Succ;
			}
			else
			{
				prevcon->node.mln_Succ = (MinNode *)con->node.mln_Succ;
			}
			FConnectionDelete( con );
		}
		else
		{
			DEBUG("[COMMSERV] Connection is used, cannot be removed\n");
			return -1;
		}
	}

	DEBUG("[COMMSERV] Socket connection removed\n");
	
	return 0;
}

//
//
//

void *InternalPINGThread( void *d )
{
	FConnection *con = (FConnection *)d;
	con->fc_PingInProgress = TRUE;
	
	CommService* s = (CommService *)con->fc_Service;
	//DEBUG("CS %p\n", s );
	SystemBase *lsb = (SystemBase *)s->s_SB;
	//DEBUG("lsb %p\n", lsb );
	FriendCoreManager *fcm = (FriendCoreManager *)lsb->fcm;
	
	//DEBUG("ping loop>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>%p IP [%s]\n", con, con->fc_Address );
	
	uint64_t stime = GetCurrentTimestamp();
	FBOOL badResp = FALSE;
	
	if( con->fc_Socket != NULL )
	{
		MsgItem tags[] = {
			{ ID_FCRE, (uint64_t)0, (uint64_t)MSG_GROUP_START },
			{ ID_FCID, (uint64_t)FRIEND_CORE_MANAGER_ID_SIZE,  (uint64_t)fcm->fcm_ID },
			{ ID_FRID, (uint64_t)0 , MSG_INTEGER_VALUE },
			{ ID_CMMD, (uint64_t)0, MSG_INTEGER_VALUE },
			{ ID_PING, (uint64_t)stime , MSG_INTEGER_VALUE },
			{ ID_FINF, (uint64_t)0, (uint64_t)MSG_GROUP_START },
				{ ID_WSES, (uint64_t)lsb->sl_USM->usm_SessionCounter , MSG_INTEGER_VALUE },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};
	
		DataForm * df = DataFormNew( tags );

		BufString *result = SendMessageAndWait( con, df );
		DataFormDelete( df );
	
		if( result != NULL )
		{
			if( result->bs_Size > 0 )
			{
				/*
				{ ID_FCRE,  (uint64_t)0, (uint64_t)MSG_GROUP_START },
					{ ID_FCID, (uint64_t)FRIEND_CORE_MANAGER_ID_SIZE, (uint64_t)lsb->fcm->fcm_ID },
					{ ID_FCRI, (uint64_t)reqid , MSG_INTEGER_VALUE },
					{ ID_PING, (uint64_t)ptime, MSG_INTEGER_VALUE },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				*/
				char *resbuf = result->bs_Buffer;
				DataForm *resultDF = (DataForm *)resbuf;
				if( resultDF->df_ID == ID_FCRE )
				{
					char *tmp = (char *)(resultDF+3);
				
					resbuf = tmp + FRIEND_CORE_MANAGER_ID_SIZE;// + (3 * COMM_MSG_HEADER_SIZE );
					// get timestamp again!
					DataForm *resultDF = (DataForm *)resbuf;
					if( resultDF->df_ID == ID_PING )
					{
						uint64_t etime = GetCurrentTimestamp();
						stime = resultDF->df_Size;
						con->fc_PINGTime = etime - stime;
					
						con->fc_Status = CONNECTION_STATUS_CONNECTED;
						
						// Get number of sessions
						resultDF += 2;
						
						if( resultDF->df_ID == ID_WSES && con->fc_Data != NULL )
						{
							ClusterNode *cn = (ClusterNode *)con->fc_Data;
							DEBUG("Number of sessions set: %lu\n", resultDF->df_Size );
							cn->cn_UserSessionsCount = resultDF->df_Size;
						}
					}
					else if( resultDF->df_ID == ID_FERR )
					{
						//con->fc_Status = CONNECTION_STATUS_DISCONNECTED;
						FERROR("[CommServicePING] Error returned\n");
					}
					DEBUG("[CommServicePING] received time %lu ID %x -> diff %lu\n", resultDF->df_Size, (unsigned int)resultDF->df_ID, con->fc_PINGTime );
				}
				else
				{
					con->fc_Status = CONNECTION_STATUS_DISCONNECTED;
					DEBUG("[CommServicePING] bad message received\n");
				}
			}
			else
			{
				badResp = TRUE;
			}
			BufStringDelete( result );
		}
		else
		{
			badResp = TRUE;
		}
	}
	
	//DEBUG("bad resp %d\n", badResp );
	
	if( badResp == TRUE )
	{
		con->fc_Status = CONNECTION_STATUS_DISCONNECTED;
		
		// we can try to estabilish outgoing connections
		
		if( con->fc_Type == SERVER_CONNECTION_OUTGOING )
		{
			Socket *newsock = SocketConnectHost( s->s_SB, s->s_secured, con->fc_Address, s->s_port );
			if( newsock != NULL )
			{
				//DEBUG("[CommServicePING] Connection reestabilished\n");
				
				SocketDelete( con->fc_Socket );
				con->fc_Socket = newsock;
				newsock->s_Data = con;
				
				con->fc_Status = CONNECTION_STATUS_CONNECTED;
				
				CommServiceRegisterEvent( con, newsock );
			}
			else
			{
				FERROR("Connection cannot be reestabilished\n");
				con->fc_Status = CONNECTION_STATUS_DISCONNECTED;
			}
		}
		else
		{
			FINFO("Incoming connection lost\n");
			con->fc_Status = CONNECTION_STATUS_DISCONNECTED;
		}
	}
	
	con->fc_PingInProgress = FALSE;
	
	DEBUG("[ServiceTempThread] internal ping thread quit\n");
	//pthread_exit( 0 );
	return NULL;
}

/**
 * Send ping to all connected servers
 *
 * @param s pointer to CommService
 */
void CommServicePING( CommService* s )
{
	if( s == NULL )
	{
		return;
	}
	SystemBase *lsb = (SystemBase *)s->s_SB;
	FriendCoreManager *fcm = (FriendCoreManager *)lsb->fcm; //s->s_FCM;
	
	FRIEND_MUTEX_LOCK( &s->s_Mutex );
	FConnection *con = s->s_Connections;
	FRIEND_MUTEX_UNLOCK( &s->s_Mutex );
	
	while( con != NULL )
	{
		//DEBUG("Send ping\n");
		if( con->fc_PingInProgress == FALSE )
		{
			pthread_t t;
			pthread_create( &t, NULL, &InternalPINGThread, con );
			pthread_detach( t );
		}
		con = (FConnection *)con->node.mln_Succ;
	}
	
	//DEBUG("Mutex released\n");
}
