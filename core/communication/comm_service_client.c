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
 *  CommunicationServiceClient body
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
#ifdef USE_SELECT

#else
#include <sys/epoll.h>
#endif
#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include <properties/propertieslibrary.h>
#include <core/friendcore_manager.h>

#include <communication/comm_msg.h>
#include <system/systembase.h>

extern pthread_cond_t InitCond;
extern pthread_mutex_t InitMutex;

extern SystemBase *SLIB;

/**
 * Send message via CommunicationService and wait+read response
 *
 * @param con pointer to CommFCConnection to which message will be send
 * @param df pointer message which will be send
 * @return pointer to new BufString structure when success, otherwise NULL
 */

BufString *SendMessageAndWait( CommFCConnection *con, DataForm *df )
{
	BufString *bs = NULL;
	
	CommService *serv = (CommService *)con->cfcc_Service;
	if( serv == NULL )
	{
		FERROR("[SendMessageAndWait] Service is equal to NULL!\n");
		return NULL;
	}
	DEBUG("[SendMessageAndWait] SendMessageAndWait alloc memory\n");
	CommRequest *cr = FCalloc( 1, sizeof( CommRequest ) );
	if( cr != NULL )
	{
		cr->cr_Time = time( NULL );
		cr->cr_RequestID = (FULONG)cr;
		cr->cr_Df = df;
		
		char *ridbytes = (char *) df;// (DataForm *)(((char *)df) + (6*sizeof(FULONG)) + df[ 1 ].df_Size);
		ridbytes += COMM_MSG_HEADER_SIZE;
		DataForm *rid = (DataForm *)ridbytes;
		if( rid->df_ID == ID_FCID )
		{
			DEBUG("[SendMessageAndWait]  found fcid, tag size %lu\n", rid->df_Size );
			int size = COMM_MSG_HEADER_SIZE + FRIEND_CORE_MANAGER_ID_SIZE;
			ridbytes += size;
		}
		rid = (DataForm *)ridbytes;
		rid->df_Size = (FULONG)cr;		// pointer is our request id
		DEBUG2("[SendMessageAndWait] Request ID set to %lu base %lu\n", rid->df_Size, cr->cr_RequestID );
	}
	else
	{
		FERROR("Cannot allocate memory for request!\n");
		return NULL;
	}
	
	DEBUG("[SendMessageAndWait] SendMessageAndWait before lock\n");
	if( pthread_mutex_lock( &serv->s_Mutex ) == 0 )
	{
		DEBUG("[SendMessageAndWait] SendMessageAndWait add entry to list\n");
		if( serv->s_Requests == NULL )
		{
			serv->s_Requests = cr;
		}
		else
		{
			DEBUG("[SendMessageAndWait] Pointer %p\n", serv->s_Requests );
			serv->s_Requests->node.mln_Pred = (MinNode *)cr;
			cr->node.mln_Succ = (MinNode *)serv->s_Requests;
			serv->s_Requests = cr;
		}
		pthread_mutex_unlock( &serv->s_Mutex );
	}
	else
	{
		FERROR("Cannot lock mutex!\n");
		FFree( cr ); 
		return NULL;
	}
	
	DEBUG("[SendMessageAndWait] Before sending message lock\n");
	
	if( pthread_mutex_lock( &con->cfcc_Mutex ) == 0 )
	{
		DEBUG("[SendMessageAndWait] mutex locked\n");
		SocketSetBlocking( con->cfcc_Socket, TRUE );
	
		// send request
		int size = SocketWrite( con->cfcc_Socket, (char *)df, (FQUAD)df->df_Size );
		pthread_mutex_unlock( &con->cfcc_Mutex );
	}
	else
	{
		FFree( cr ); 
		return NULL;
	}
	
	// wait for answer
	
	FBOOL quit = FALSE;
	while( quit != TRUE )
	{
		DEBUG("[SendMessageAndWait] SendMessageAndWait waiting for condition\n");
		if( pthread_mutex_lock( &serv->s_Mutex ) == 0 )
		{
			DEBUG("[SendMessageAndWait] SendMessageAndWait Setup condition\n");
			pthread_cond_wait( &serv->s_DataReceivedCond, &serv->s_Mutex );
			pthread_mutex_unlock( &serv->s_Mutex );
		}
		else break;

		DEBUG( "[SendMessageAndWait] Condition met, now going on\n!" );
		time_t acttime = time( NULL );
		if( ( acttime - cr->cr_Time ) > 10 || cr->cr_Bs != NULL )
		{
		/*
			FERROR("Message was not received, timeout!\n");
			break;
		}
		else
		{
			*/
			// remove entry from list
			DEBUG("[SendMessageAndWait] SendMessageAndWait message : time %lu  cr_bs ptr %p\n", (unsigned long)( acttime - cr->cr_Time ), cr->cr_Bs );
			bs = cr->cr_Bs;
			quit = TRUE;

			if( pthread_mutex_lock( &serv->s_Mutex ) == 0 )
			{
				DEBUG("[SendMessageAndWait] Remove Socket entry from list\n");
				if( cr == serv->s_Requests )
				{
					CommRequest *next = (CommRequest *)serv->s_Requests->node.mln_Succ;
					if( next != NULL )
					{
						next->node.mln_Pred = (MinNode *)NULL;
						serv->s_Requests = next;
					}
					else
					{
						serv->s_Requests = NULL;
					}
				}
				else
				{
					CommRequest *next = (CommRequest *)cr->node.mln_Succ;
					CommRequest *prev = (CommRequest *)cr->node.mln_Pred;
					if( next != NULL )
					{
						prev->node.mln_Pred = (MinNode *)prev;
						prev->node.mln_Succ = (MinNode *)next;
					}
					else
					{
						if( prev != NULL )
						{
							prev->node.mln_Succ = (MinNode *)NULL;
						}
					}
				}
				if( cr != NULL )
				{
					FFree( cr );
					cr = NULL;
				}
				pthread_mutex_unlock( &serv->s_Mutex );
			}
			break;
		}
	}
	
	DEBUG( "[SendMessageAndWait] SendMessageAndWait Done with sending, returning\n" );
	
	return bs;
}

/**
 * Send message via CommunicationService to provided receipients
 *
 * @param s pointer to CommService
 * @param df pointer message which will be send
 * @return pointer to new DataForm structure when success, otherwise NULL
 */

DataForm *CommServiceSendMsg( CommService *s, DataForm *df )
{
	DataForm *retDF = NULL;
	
	DEBUG("[CommServClient] CommunicationSendmesage FCRE size %ld QUERY size  %ld\n", df[0].df_Size, df[1].df_Size );
	if( s && df )
	{
		char buffer[ MAX_SIZE ];
		
		if( (df[ 0 ].df_ID == (FULONG)(ID_FCRE) ) && (df[ 2 ].df_ID == (FULONG)(ID_QUER) ) )
		{
			FBYTE *targetName = (FBYTE *)(df+1);
			targetName += COMM_MSG_HEADER_SIZE;
			
			DEBUG2("[CommServClient] Message destination %s  size %ld\n", targetName, df[ 0 ].df_Size );
			
			// send message to all servers
			
			if( strncmp( (char *)targetName, "ALL", 3 ) == 0 )
			{
				MsgItem tags[] = {
					{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_MSER,  (FULONG)0,  (FULONG)NULL },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				};
			
				DataForm *ldf = DataFormNew( tags );
				
				//FriendCoreManager *fcm = (FriendCoreManager *)s->s_FCM;
				CommFCConnection *lc = s->s_Connections;
				
				DEBUG("[CommServClient] pointer to connections %p\n", lc );
				
				while( lc != NULL )
				{
					BufString *bs = SendMessageAndWait( lc, df );
					FULONG sockReadSize = 0;
					
					if( bs != NULL )
					{
						FBYTE *lsdata = (FBYTE *)bs->bs_Buffer;
						sockReadSize = bs->bs_Size;
					
						if( lsdata != NULL )
						{
							DEBUG2("[CommServClient]:Received bytes %ld CommunicationServiceClient Sending message size: %lu server: %128s\n", sockReadSize, df->df_Size, lc->cfcc_Name );

							MsgItem loctags[] = {
								{ ID_SNAM,  (FULONG)(FRIEND_CORE_MANAGER_ID_SIZE*sizeof(FBYTE)),  (FULONG)lc->cffc_ID },
								{ TAG_DONE, TAG_DONE, TAG_DONE }
							};
			
							//INFO("joining messages\n");
					
							DataForm *serverdf = DataFormNew( loctags );
					
							DataFormAdd( &ldf, lsdata, sockReadSize );
							DEBUG2("[CommServClient] ---------------------Added new server to answer serverdfsize %ld sockreadsize %ld\n", serverdf->df_Size, sockReadSize );
					
							DataFormAddForm( &ldf, serverdf );
					
							DataFormDelete( serverdf );
						}
						//DEBUG("ldf size!!!!\n\n\n\n\n\n\n\n\n\nSIZE %lld\n\n\n\n\n %d\n\n\n\n\n", bs->bs_Size, ldf->df_Size );
						BufStringDelete( bs );
					}
					
					//sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
					DEBUG2("[CommServClient] Received information in bytes %ld\n", sockReadSize );
					//int writeSize = write( service->s_recvPipe[ 1 ], buffer, sockReadSize );
			
					//DEBUG("Message received '%s'\n", buffer );
					lc = (CommFCConnection *)lc->node.mln_Succ;
				}
				
				return ldf;
			}
			else	// send message to one target
			{
				MsgItem tags[] = {
					{ ID_FCRE, (FULONG)0,  (FULONG)MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				};
				
				DEBUG("[CommServClient] Send message to target\n");
			
				DataForm *ldf = DataFormNew( tags );
				
				CommFCConnection *lc = s->s_Connections;
				while( lc != NULL )
				{
					//DEBUG2("Checking receipients  target %s fromlist %s  size %ld  \n", (char *)targetName, (char *)lc->cfcc_Name, df[ 1 ].df_Size );
					
					if( strncmp( (char *)targetName, (char *)lc->cfcc_Name, df[ 1 ].df_Size ) == 0 )
					{
						BufString *bs = SendMessageAndWait( lc, df );
						FBYTE *lsdata = NULL;
						FULONG sockReadSize = 0;
						
						if( bs != NULL )
						{
							DEBUG2("[CommServClient] Received from socket %lu\n", (unsigned long)bs->bs_Size );
							lsdata = (FBYTE *)bs->bs_Buffer;
							sockReadSize = bs->bs_Size;
						}

						if( lsdata != NULL )
						{
							DEBUG2("[CommServClient] Received bytes %ld CommunicationServiceClient Sending message size: %lu server: %128s\n", sockReadSize, (unsigned long)df->df_Size, lc->cfcc_Name );
					
							DataFormAdd( &ldf, lsdata, sockReadSize );
							
							ldf->df_Size = sockReadSize;
							DEBUG2("[CommServClient]  ---------------------Added new server to answer serverdfsize %ld sockreadsize %lu\n", ldf->df_Size, sockReadSize );
						}
						else
						{
							DEBUG("End of file added\n");
							DataFormAdd( &ldf, (FBYTE *)"{\"rb\":\"-1\"}", 11 );
							DEBUG2("[CommServClient] endof serverdfsize %lu sockreadsize %lu\n", ldf->df_Size, sockReadSize );
						}
						
						if( bs != NULL )
						{
							//DEBUG2("ldf size!!!!\n\n\n\n\n\n\n\n\n\nSIZE %lld\n\n\n\n\n %d\n\n\n\n\n", bs->bs_Size, ldf->df_Size );
							BufStringDelete( bs );
						}
						
						//sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
						DEBUG2("[CommServClient] Received information in bytes %ld\n", sockReadSize );
						//int writeSize = write( service->s_recvPipe[ 1 ], buffer, sockReadSize );
						break;
					}

					lc = (CommFCConnection *)lc->node.mln_Succ;
				}
				DEBUG2("[CommServClient] Message returned %lu\n", ldf->df_Size );
				return ldf;
			}
		}
		else
		{
			FERROR("Message is broken, cannot send it\n");
		}

		DEBUG("[CommServClient] resources free\n");
	}
	
	return retDF;
}

/**
 * Send message via CommunicationService to provided receipient
 *
 * @param con pointer to CommFCConnection to which message will be send
 * @param df pointer message which will be send
 * @return pointer to new DataForm structure when success, otherwise NULL
 */
DataForm *CommServiceSendMsgDirect( CommFCConnection *con, DataForm *df )
{
	MsgItem tags[] = {
		{ ID_FCRE, (FULONG)0,  (FULONG)MSG_GROUP_START },
		{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
		{ TAG_DONE, TAG_DONE, TAG_DONE }
	};
		
	DEBUG("[CommServClient] Send message to targetDirect\n");
			
	DataForm *ldf = DataFormNew( tags );
	
	BufString *bs = NULL;
	FBYTE *lsdata = NULL;
	FULONG sockReadSize = 0;
	
	bs = SendMessageAndWait( con, df );
	
	if( bs != NULL )
	{
		DEBUG2("[CommServClient] Received from socket %lu\n", (unsigned long)bs->bs_Size );
		lsdata = (FBYTE *)bs->bs_Buffer;
		sockReadSize = bs->bs_Size;
	}

	if( lsdata != NULL )
	{
		DEBUG2("[CommServClient] Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, (int) df->df_Size, con->cfcc_Name );
		
		DataFormAdd( &ldf, lsdata, sockReadSize );
		
		ldf->df_Size = sockReadSize;
		DEBUG2("[CommServClient] ---------------------Added new server to answer serverdfsize %ld sockreadsize %ld\n", ldf->df_Size, sockReadSize );
	}
	else
	{
		DataFormAdd( &ldf, (FBYTE *)"{\"rb\":\"-1\"}", 11 );
	}
	
	if( bs != NULL )
	{
		BufStringDelete( bs );
	}
	
	return ldf;
}

/**
 * Create new CommFCConnection
 *
 * @param add pointer to char table with internet address
 * @param name name of created connection
 * @return pointer to new CommFCConnection structure when success, otherwise NULL
 */
CommFCConnection *CommFCConnectionNew( const char *add, const char *name, int type, void *service )
{
	CommFCConnection *newcon;
	
	if( ( newcon = FCalloc( 1, sizeof( CommFCConnection ) ) ) != NULL )
	{
		int addlen = strlen( add );
		int namlen = strlen( name );
		
		newcon->cfcc_Address = FCalloc( addlen+1 , sizeof( char ) );
		newcon->cfcc_Name = FCalloc( namlen+1, sizeof( char ) );
		
		newcon->cfcc_Name = FCalloc( FRIEND_CORE_MANAGER_ID_SIZE+1, sizeof( char ) );
		memcpy( newcon->cfcc_Name, name, FRIEND_CORE_MANAGER_ID_SIZE );
		
		strcpy( newcon->cfcc_Address, add );
		//strcpy( newcon->cfcc_Name, name );
		
		newcon->cffc_Type  = type;
		newcon->cfcc_Service = service;
		
		pthread_mutex_init( &newcon->cfcc_Mutex, NULL );
		
		newcon->cfcc_Status = SERVICE_STATUS_CONNECTED;
	}
	return newcon;
}

/**
 * Delete CommFCConnection
 *
 * @param con pointer to CommFCConnection which will be deleted
 */
void CommFCConnectionDelete( CommFCConnection *con )
{
	if( con != NULL )
	{
		pthread_mutex_destroy( &con->cfcc_Mutex );
		
		if( con->cfcc_Address ) FFree( con->cfcc_Address );
		if( con->cfcc_Name ) FFree( con->cfcc_Name );
		
		if( con->cfcc_Socket != NULL )
		{
			SocketClose( con->cfcc_Socket );
			con->cfcc_Socket = NULL;
		}
		
		if( con->cfcc_Thread != NULL )
		{
			ThreadDelete( con->cfcc_Thread );
			con->cfcc_Thread = NULL;
		}
		
		FFree( con );
	}
}

/**
 * Connect to server function
 *
 * @param s pointer to service to which new connection will be added
 * @param conname name of connection to which communication will be set (FCID or host name)
 * @return pointer to new CommFCConnection structure when success, otherwise NULL
 */
CommFCConnection *ConnectToServer( CommService *s, char *conname )
{
	CommFCConnection *con = NULL;
	CommFCConnection *retcon = NULL;
	FBOOL coreConnection = FALSE;
	SystemBase *lsb = (SystemBase *)SLIB;
	FriendCoreManager *fcm = lsb->fcm;
	
	DEBUG("[CommServClient] Checking internal connections\n");
	con = fcm->fcm_CommService->s_Connections;
	while( con != NULL )
	{
		DEBUG("[CommServClient] Going through connections %128s   vs  %128s\n", conname, con->cffc_ID );
		if( memcmp( conname, con->cfcc_Name, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 || strcmp( conname, con->cfcc_Address ) == 0 )
		{
			coreConnection = TRUE;
			break;
		}
		con = (CommFCConnection *) con->node.mln_Succ;
	}
	
	Socket *newsock = NULL;
	char address[ 512 ];
	
	// connection was found, we must make copy of it
	
	if( con != NULL )
	{
		DEBUG("[CommServClient] Connection found\n");
		return con;
	}
	
	// connection was not found, its probably ip/internet address
	
	else
	{
		DEBUG("[CommServClient] Trying to setup connection with %s\n", conname );
		
		memset( address, 0, sizeof(address) );
		unsigned int i;
		
		strcpy( address, conname );
		int port = fcm->fcm_CommService->s_port;
		
		for( i=0 ; i < strlen( address ) ; i++ )
		{
			if( address[ i ] == ':' )
			{
				address[ i ] = 0;
				if( address[ i+1 ] != 0 )
				{
					port = atoi( &address[ i+1 ] );
				}
			}
		}
		
		newsock = SocketConnectHost( s->s_SB, fcm->fcm_CommService->s_secured, address, port );
		
		if( newsock != NULL )
		{
			retcon = CommFCConnectionNew( address, conname, SERVICE_CONNECTION_OUTGOING, s );
			if( retcon != NULL )
			{
				retcon->cfcc_Port = port;
				retcon->cfcc_Socket = newsock;
			}
		}
	}
	
	if( newsock != NULL )
	{
		int err = 0;
		DEBUG("[CommServClient] Outgoing connection created\n");
		{
			MsgItem tags[] = {
				{ ID_FCRE,  (FULONG)0, (FULONG)NULL },
				{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)fcm->fcm_ID },
				{ ID_FCON, (FULONG)0 , MSG_INTEGER_VALUE },
				{ TAG_DONE, TAG_DONE, TAG_DONE }
			};
			
			DataForm * df = DataFormNew( tags );

			int sbytes = SocketWrite( newsock, (char *)df, (FQUAD)df->df_Size );
			
			DEBUG("[CommServClient] Message sent %d\n", sbytes );
			DataFormDelete( df );
			
			char id[ FRIEND_CORE_MANAGER_ID_SIZE ];
			int i;
			
			// if thats our core connection we just copy ID
			
			if( coreConnection == TRUE )
			{
				memcpy( id, con->cffc_ID, FRIEND_CORE_MANAGER_ID_SIZE );
			}
			else
			{
				strcpy( id, address );
				
				for( i=0 ; i<FRIEND_CORE_MANAGER_ID_SIZE; i++ )
				{
					if( fcm->fcm_ID [i ] == 0 )
					{
						fcm->fcm_ID[ i ] = '0';
					}
				}
			}
		}
	}
	
	if( retcon == NULL )
	{
		if( newsock != NULL )
		{
			SocketClose( newsock );
		}
	}
	else
	{
		retcon->cfcc_Service = fcm->fcm_CommService;
	}
	
	return retcon;
}

