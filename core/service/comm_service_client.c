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

/*
 * 
 * Communication Service Client
 * 
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
#include <sys/epoll.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include <properties/propertieslibrary.h>
#include <core/friendcore_manager.h>

#include <service/comm_msg.h>

extern pthread_cond_t InitCond;
extern pthread_mutex_t InitMutex;

extern SystemBase *SLIB;

//
// get all data from socket
//

static inline BYTE *readFormFromSocket( Socket_t *s, ULONG *length )
{
	BYTE *retData = NULL;
	char buffer[ MAX_SIZE ];
	int readSize;
	
	readSize = SocketRead( s, buffer, MAX_SIZE, 0 );
	DataForm *ldf = (DataForm *)buffer;
	
	// its our packet
	
	if( ldf->df_ID == ID_FCRE )
	{
		// message is bigger then buffer
		// we must read it all
		
		if( ldf->df_Size > MAX_SIZE )
		{
			unsigned int readedBytes = readSize;
			BufString *bs = BufStringNew();
			BufStringAddSize( bs, buffer, readSize );
			
			// reading bytes till end
			
			while( readedBytes <= ldf->df_Size )
			{
				readSize = SocketRead( s, buffer, MAX_SIZE, 0 );
				BufStringAddSize( bs, buffer, readSize );
				readedBytes += readSize;
			}
			
			FFree( bs );
			*length = bs->bs_Size;
			
			return (BYTE *)bs->bs_Buffer;
		}
		// message fits buffer
		else
		{
			if( ( retData = FCalloc( readSize, sizeof(BYTE) ) ) != NULL )
			{
				memcpy( retData, buffer, readSize );
				*length = readSize;
			}
			else
			{
 				ERROR("Cannot allocate memory for message buffer\n");
			}
		}
	}
	
	return retData;
}

//
// send Message
//

DataForm *CommServiceSendMsg( CommService *s, DataForm *df )
{
	DataForm *retDF = NULL;
	
	DEBUG("CommunicationSendmesage\n");
	if( s && df )
	{
		char buffer[ MAX_SIZE ];
		
		if( df[ 0 ].df_ID == ID_FCRE && df[ 1 ].df_ID == ID_QUER )
		{
			BYTE *targetName = (BYTE *)(df+1);
			targetName += COMM_MSG_HEADER_SIZE;
			
			DEBUG("Message destination %s  size %ld\n", targetName, df[ 1 ].df_Size );
			
			// send message to all servers
			
			if( strncmp( (char *)targetName, "ALL", 3 ) == 0 )
			{
				
				MsgItem tags[] = {
					{ ID_FCRE, 0, NULL },
					{ ID_SVIN, 0, NULL },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				};
			
				DataForm *ldf = DataFormNew( tags );
				
				CommFCConnection *lc = s->s_FCConnections;
				while( lc != NULL )
				{
					//TODO test message , should be removed
					SocketWrite( lc->cfcc_Socket, (char *)df, df->df_Size );//"hello", 5 );
					DEBUG("CommunicationServiceClient Sending message hello\n");
					ULONG sockReadSize = 0;
/*
					MsgItem loctags[] = {
						//{ ID_FCRE, 0, NULL },
						//{ ID_SVIN, 0, NULL },
						{ ID_SNAM, 64*sizeof(BYTE), lc->cfcc_Id },
						{ TAG_DONE, TAG_DONE, TAG_DONE }
					};
			
					INFO("joining messages\n");
					
					DataForm *serverdf = DataFormNew( loctags );
	*/				
					BYTE *lsdata = readFormFromSocket( lc->cfcc_Socket, &sockReadSize );
					
					DataFormAdd( &ldf, lsdata, sockReadSize );
					//DEBUG("Added new server to answer serverdfsize %ld sockreadsize %ld\n", serverdf->df_Size, sockReadSize );
					
					FFree( lsdata );
					
					//DataFormAddForm( &ldf, serverdf );
					
					//DataFormDelete( serverdf );
					
					//sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
					DEBUG("Received information in bytes %ld\n", sockReadSize );
					//int writeSize = write( service->s_recvPipe[ 1 ], buffer, sockReadSize );
			
					//DEBUG("Message received '%s'\n", buffer );
					lc = (CommFCConnection *)lc->node.mln_Succ;
				}
				
				return ldf;
			}
			else	// send message to one target
			{
				// find server and send message
				
				CommFCConnection *lc = s->s_FCConnections;
				while( lc != NULL )
				{
					if( strncmp( (char *)targetName, (char *)lc->cfcc_Id, df[ 1 ].df_Size ) == 0 )
					{
						//TODO test message , should be removed
						SocketWrite( lc->cfcc_Socket, (char  *)df, df->df_Size );//"hello", 5 );
						DEBUG("CommunicationServiceClient Sending message hello\n");
						int sockReadSize = 0;

						sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
						DEBUG("Received information in bytes %d\n", sockReadSize );
						//int writeSize = write( service->s_recvPipe[ 1 ], buffer, sockReadSize );
			
						//DEBUG("Message received '%s'\n", buffer );
					}
					lc = (CommFCConnection *)lc->node.mln_Succ;
				}
			}
		}
		else
		{
			ERROR("Message is broken, cannot send it\n");
		}

		DEBUG("Communication resources free\n");
	}
	
	return retDF;
}




//
//
//

CommFCConnection *CommFCConnectionNew( const char *add, const char *name )
{
	CommFCConnection *newcon;
	
	if( ( newcon = calloc( 1, sizeof( CommFCConnection ) ) ) != NULL )
	{
		int addlen = strlen( add );
		int namlen = strlen( name );
		
		newcon->cfcc_Address = calloc( addlen+1 , sizeof( char ) );
		newcon->cfcc_Name = calloc( namlen+1, sizeof( char ) );
		
		strcpy( newcon->cfcc_Address, add );
		strcpy( newcon->cfcc_Name, name );
	}
	return newcon;
}

void CommFCConnectionDelete( CommFCConnection *con )
{
	if( con != NULL )
	{
		if( con->cfcc_Address ) free( con->cfcc_Address );
		if( con->cfcc_Name ) free( con->cfcc_Name );
		
		free( con );
	}
}

//
// Service Thread
//

int CommServiceThreadClient( FThread *ptr )
{
	CommService *service = (CommService *)ptr->t_Data;
	
	DEBUG("CommunicationServiceSend Start\n");
	
	struct mq_attr attr;
	char buffer[ MAX_SIZE + 1 ];
/*
	// initialize the queue attributes 
	attr.mq_flags		= 0;
	attr.mq_maxmsg		= MAX_MSG;
	attr.mq_msgsize		= MAX_SIZE;
	attr.mq_curmsgs		= 0;

	DEBUG("QUEUE Before Created SERVER\n");
	// create the message queue 
	mode_t mode  = FLAGS;
	
	
	mode_t omask;
	omask = umask( 0 );
	service->s_inMqfd = mq_open( QUEUE_NAME, (O_CREAT | O_RDONLY), mode, &attr );
	umask( omask );
	
	DEBUG("QUEUE Created SERVER\n");
	*/
	pthread_mutex_lock( &InitMutex ); 
	pthread_cond_signal( &InitCond );    
	pthread_mutex_unlock( &InitMutex );  
	
	//
	// atm we only read FC connections
	//
	
	struct PropertiesLibrary *plib = NULL;
	char *servers = NULL;
	Props *prop = NULL;
	
	if( ( plib = (struct PropertiesLibrary *)LibraryOpen( SLIB, "properties.library", 0 ) ) != NULL )
	{
		char coresPath[ 1024 ];
		sprintf( coresPath, "%s/cfg/cfg.ini", getenv( "FRIEND_HOME" ) );
		
		prop = plib->Open( coresPath  );
		if( prop != NULL)
		{
			DEBUG("[Userlibrary] reading login\n");
			servers = plib->ReadString( prop, "Cores:servers", "" );
			DEBUG("[Userlibrary] servers %s\n", servers );
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
			CommFCConnection *newcon;
			
			char *address = NULL;
			char *name = NULL;
			
			char *pos = strchr( token, SERVER_NAME_SPLIT_SING );
			if( pos != NULL )
			{
				*pos = 0;
				address = token;
				name = ++pos;
				
			}else{
				address = token;
				name = token;
			}
			
			DEBUG("New connection found address : %s name : %s\n", address, name );
				
			//TODO
				
			if( ( newcon = CommFCConnectionNew( address, name ) ) != NULL )
			{
				DEBUG("Outgoing connection mem allocated\n");
				
				newcon->cfcc_Socket = SocketOpen( FRIEND_COMMUNICATION_PORT, SOCKET_TYPE_CLIENT );
				
				DEBUG("Outgoing connection created\n");
				
				if( SocketConnect( newcon->cfcc_Socket, address ) == 0 )
				{
					DEBUG("Connection setup with server : %s\n", token );
					if( service->s_FCConnections == NULL )
					{
						service->s_FCConnections = newcon;
					}
					else
					{	// we already have connections, we must add them to the end of list
						CommFCConnection *lc = service->s_FCConnections;
						while( lc->node.mln_Succ != NULL )
						{
							lc = (CommFCConnection *)lc->node.mln_Succ;
						}
						lc->node.mln_Succ = (MinNode *) newcon;
					}
					
					//
					// sockets connected, we create now special message where we sent ID of our host
					//
					
					DEBUG("Generate Data Form\n");
					DataForm * df = DataFormNew( NULL );
					DEBUG("DataForm Created\n");
					FriendCoreManager *fcm = (FriendCoreManager *) service->s_FCM;
					DataFormAdd( &df, (BYTE *)fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
					//INFO("Message created name byte %c%c%c%c\n", fcm->fcm_ID[32], fcm->fcm_ID[33], fcm->fcm_ID[34], fcm->fcm_ID[35]	);
					
					SocketWrite( newcon->cfcc_Socket, (char *)df, df->df_Size );
					
					DEBUG("Message sent\n");
					DataFormDelete( df );
					
				}
				else
				{
					close( newcon->cfcc_Socket->fd );
					FFree( newcon->cfcc_Socket );
					FFree( newcon );
					ERROR("Cannot setup socket connection!\n");
				}
			}
				
			DEBUG( " %s\n", token );
			
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
	DEBUG("CommunicationServiceClient start\n");
	
	//
	// we should ask for information from connection
	//
	
	// messages get and pass to destination
	
	//int queueFd = mq_ msgqToFd( service->s_inMqfd );
	
	struct timeval tv;
	fd_set writeToServ;
	fd_set readFromServ;
	
	ULONG idMax = 0;
	if( service->s_sendPipe[ 0 ] > idMax ) idMax = service->s_sendPipe[ 0 ];
	if( service->s_sendPipe[ 1 ] > idMax ) idMax = service->s_sendPipe[ 1 ];
	if( service->s_recvPipe[ 0 ] > idMax ) idMax = service->s_recvPipe[ 0 ];
	if( service->s_recvPipe[ 1 ] > idMax ) idMax = service->s_recvPipe[ 1 ];
	
	{
		CommFCConnection *lc = service->s_FCConnections;
		while( lc != NULL )
		{
			if( lc->cfcc_Socket > idMax )
			{
				idMax = lc->cfcc_Socket->fd;
			}
			lc = (CommFCConnection *)lc->node.mln_Succ;
		}
	}
	
	DEBUG("IDMAX SET TO %ld\n", idMax );
	/*
	if( service->s_inMqfd != -1 )
	{*/
		while( service->s_Cam.cam_Quit != 1 )
		{
			FD_ZERO( &writeToServ );
			FD_ZERO( &readFromServ );
			FD_SET( service->s_sendPipe[ 0 ] , &writeToServ );
			//FD_SET( lc->cfcc_Socket , &readFromServ );
			
			tv.tv_sec = 0;
			tv.tv_usec = 10000000;

			//ret = 0;

			int ret = select( idMax+1, &writeToServ, NULL, NULL, &tv );
			
			// handle message
			
			if( ret > 0 )
			{
				int rets = read( service->s_sendPipe[ 0 ], buffer, MAX_SIZE );
				//ERROR("DATAREADED! %d\n", rets );
				
				buffer[ rets ] = '\0';
				//TODO
				// we should read from QUEUE, check destination server and send message
				//
/*
				CommFCConnection *lc = service->s_FCConnections;
				while( lc != NULL )
				{
					//TODO test message , should be removed
					SocketWrite( lc->cfcc_Socket, buffer, rets );//"hello", 5 );
					DEBUG("CommunicationServiceClient Sending message hello\n");
					int sockReadSize = 0;
					
					sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
					int writeSize = write( service->s_recvPipe[ 1 ], buffer, sockReadSize );
					
					DEBUG("Message received '%s'\n", buffer );
					lc = (CommFCConnection *)lc->node.mln_Succ;
				}*/
				
				}else{
				
				}
			//usleep( 10000000 );
			//DEBUG("CommunicationServiceClient Thread at work %d\n", ret );
		
			ssize_t bytes_read;

			// receive the message 
			//bytes_read = mq_receive( service->s_inMqfd, buffer, MAX_SIZE, NULL );
			//CHECK(bytes_read >= 0);
			/*
			*/
		}
		/*
	}else{
		ERROR("Cannot create QUEUE!\n");
	}*/
	
	DEBUG("CommunicationService close\n");
	
	CommFCConnection *lc = service->s_FCConnections;
	CommFCConnection *rlc = service->s_FCConnections;
	while( lc != NULL )
	{
		rlc = lc;
		lc = (CommFCConnection *) lc->node.mln_Succ;
		
		DEBUG("Closing output connection\n");
		
		SocketClose( rlc->cfcc_Socket );

		CommFCConnectionDelete( rlc );
	}
	
		// closing queue
		
	//mq_close( service->s_inMqfd );
		
	//mq_unlink( QUEUE_NAME );
	
	return 0;
}
