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

#include <interface/properties_interface.h>
#include <core/friendcore_manager.h>

#include <communication/comm_msg.h>
#include <system/systembase.h>

extern pthread_cond_t InitCond;
extern pthread_mutex_t InitMutex;

extern SystemBase *SLIB;

/**
 * Send message via CommunicationService and wait+read response
 *
 * @param con pointer to FConnection to which message will be send
 * @param df pointer message which will be send
 * @return pointer to new BufString structure when success, otherwise NULL
 */

BufString *SendMessageAndWait( FConnection *con, DataForm *df )
{
	BufString *bs = NULL;
	FLONG writebytes = 0;
	
	CommService *serv = (CommService *)con->fc_Service;
	if( serv == NULL || con->fc_Socket == NULL )
	{
		FERROR("[SendMessageAndWait] Service [%p] or socket [%p] is equal to NULL!\n", con, con->fc_Socket );
		return NULL;
	}

	CommRequest *cr = FCalloc( 1, sizeof( CommRequest ) );
	if( cr != NULL )
	{
		cr->cr_Time = time( NULL );
		cr->cr_RequestID = (FULONG)cr;
		cr->cr_Df = df;
		
		char *ridbytes = (char *) df;
		ridbytes += COMM_MSG_HEADER_SIZE;
		DataForm *rid = (DataForm *)ridbytes;
		if( rid->df_ID == ID_FCID )
		{
			int size = COMM_MSG_HEADER_SIZE + FRIEND_CORE_MANAGER_ID_SIZE;
			ridbytes += size;
		}
		rid = (DataForm *)ridbytes;
		rid->df_Size = (FULONG)cr;		// pointer is our request id
	}
	else
	{
		FERROR("Cannot allocate memory for request!\n");
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &serv->s_Mutex ) == 0 )
	{
		if( serv->s_Requests == NULL )
		{
			serv->s_Requests = cr;
		}
		else
		{
			serv->s_Requests->node.mln_Pred = (MinNode *)cr;
			cr->node.mln_Succ = (MinNode *)serv->s_Requests;
			serv->s_Requests = cr;
		}
		FRIEND_MUTEX_UNLOCK( &serv->s_Mutex );
	}
	else
	{
		FERROR("Cannot lock mutex!\n");
		FFree( cr ); 
		return NULL;
	}

	//int blocked = con->fc_Socket->s_Blocked;
	
	if( FRIEND_MUTEX_LOCK( &con->fc_Mutex ) == 0 )
	{
		if( con->fc_Status != CONNECTION_STATUS_DISCONNECTED )
		{
			DEBUG("[SendMessageAndWait] mutex locked, msg size to send %lu\n", (FLONG)df->df_Size );
			//SocketSetBlocking( con->fc_Socket, TRUE );
	
			// send request
			writebytes = SocketWrite( con->fc_Socket, (char *)df, (FLONG)df->df_Size );
		}
		else
		{
			FRIEND_MUTEX_UNLOCK( &con->fc_Mutex );
			return NULL;
		}
		FRIEND_MUTEX_UNLOCK( &con->fc_Mutex );
	}
	else
	{
		FFree( cr ); 
		return NULL;
	}
	
	if( writebytes < 1 )
	{
		DEBUG("[SendMessageAndWait] Cannot write message\n");
		FFree( cr ); 
		return NULL;
	}
	
	// wait for answer
	
	FBOOL quit = FALSE;
	while( quit != TRUE )
	{
		if( FRIEND_MUTEX_LOCK( &serv->s_Mutex ) == 0 )
		{
			pthread_cond_wait( &serv->s_DataReceivedCond, &serv->s_Mutex );
			FRIEND_MUTEX_UNLOCK( &serv->s_Mutex );
		}
		else break;

		time_t acttime = time( NULL );
		if( ( acttime - cr->cr_Time ) > 10 || cr->cr_Bs != NULL )
		{
			// remove entry from list
			DEBUG("[SendMessageAndWait] SendMessageAndWait message : time %lu  cr_bs ptr %p\n", (unsigned long)( acttime - cr->cr_Time ), cr->cr_Bs );
			bs = cr->cr_Bs;
			quit = TRUE;

			if( FRIEND_MUTEX_LOCK( &serv->s_Mutex ) == 0 )
			{
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
				FRIEND_MUTEX_UNLOCK( &serv->s_Mutex );
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
	
	DEBUG("[CommServiceSendMsg] CommunicationSendmesage FCRE size %ld QUERY size  %ld\n", df[0].df_Size, df[1].df_Size );
	if( s && df )
	{
		//char buffer[ MAX_SIZE ];
		
		if( (df[ 0 ].df_ID == (FULONG)(ID_FCRE) ) && (df[ 2 ].df_ID == (FULONG)(ID_QUER) ) )
		{
			FBYTE *targetName = (FBYTE *)(df+1);
			targetName += COMM_MSG_HEADER_SIZE;
			
			DEBUG2("[CommServiceSendMsg] Message destination %s  size %ld\n", targetName, df[ 0 ].df_Size );
			
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
				FConnection *lc = s->s_Connections;
				
				DEBUG("[CommServiceSendMsg] pointer to connections %p\n", lc );
				
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
							DEBUG2("[CommServiceSendMsg]:Received bytes %ld CommunicationServiceClient Sending message size: %lu server: %128s\n", sockReadSize, df->df_Size, lc->fc_Name );

							MsgItem loctags[] = {
								{ ID_SNAM,  (FULONG)(FRIEND_CORE_MANAGER_ID_SIZE*sizeof(FBYTE)),  (FULONG)lc->fc_ID },
								{ TAG_DONE, TAG_DONE, TAG_DONE }
							};
			
							DataForm *serverdf = DataFormNew( loctags );
					
							DataFormAdd( &ldf, lsdata, sockReadSize );
							DEBUG2("[CommServiceSendMsg] Added new server to answer serverdfsize %ld sockreadsize %ld\n", serverdf->df_Size, sockReadSize );
					
							DataFormAddForm( &ldf, serverdf );
					
							DataFormDelete( serverdf );
						}
						BufStringDelete( bs );
					}
					
					DEBUG2("[CommServiceSendMsg] Received information in bytes %ld\n", sockReadSize );
					lc = (FConnection *)lc->node.mln_Succ;
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
				
				DEBUG("[CommServiceSendMsg] Send message to target\n");
			
				DataForm *ldf = DataFormNew( tags );
				
				FConnection *lc = s->s_Connections;
				while( lc != NULL )
				{
					if( strncmp( (char *)targetName, (char *)lc->fc_Name, df[ 1 ].df_Size ) == 0 )
					{
						BufString *bs = SendMessageAndWait( lc, df );
						FBYTE *lsdata = NULL;
						FULONG sockReadSize = 0;
						
						if( bs != NULL )
						{
							DEBUG2("[CommServiceSendMsg] Received from socket %lu\n", (unsigned long)bs->bs_Size );
							lsdata = (FBYTE *)bs->bs_Buffer;
							sockReadSize = bs->bs_Size;
						}

						if( lsdata != NULL )
						{
							DEBUG2("[CommServiceSendMsg] Received bytes %ld CommunicationServiceClient Sending message size: %lu server: %128s\n", sockReadSize, (unsigned long)df->df_Size, lc->fc_Name );
					
							DataFormAdd( &ldf, lsdata, sockReadSize );
							
							ldf->df_Size = sockReadSize;
							DEBUG2("[CommServiceSendMsg]  ---------------------Added new server to answer serverdfsize %ld sockreadsize %lu\n", ldf->df_Size, sockReadSize );
						}
						else
						{
							DataFormAdd( &ldf, (FBYTE *)"{\"rb\":\"-1\"}", 11 );
							DEBUG2("[CommServiceSendMsg] endof serverdfsize %lu sockreadsize %lu\n", ldf->df_Size, sockReadSize );
						}
						
						if( bs != NULL )
						{
							BufStringDelete( bs );
						}
						
						DEBUG2("[CommServiceSendMsg] Received information in bytes %ld\n", sockReadSize );
						break;
					}

					lc = (FConnection *)lc->node.mln_Succ;
				}
				DEBUG2("[CommServiceSendMsg] Message returned %lu\n", ldf->df_Size );
				return ldf;
			}
		}
		else
		{
			FERROR("[CommServiceSendMsg] Message is broken, cannot send it\n");
		}

		DEBUG("[CommServiceSendMsg] resources free\n");
	}
	return retDF;
}

/**
 * Send message via CommunicationService to provided receipient
 *
 * @param con pointer to FConnection to which message will be send
 * @param df pointer message which will be send
 * @return pointer to new DataForm structure when success, otherwise NULL
 */
DataForm *CommServiceSendMsgDirect( FConnection *con, DataForm *df )
{
	MsgItem tags[] = {
		{ ID_FCRE, (FULONG)0,  (FULONG)MSG_GROUP_START },
		{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
		{ TAG_DONE, TAG_DONE, TAG_DONE }
	};
		
	DEBUG("[CommServiceSendMsgDirect] Send message to targetDirect\n");
			
	DataForm *ldf = DataFormNew( tags );
	
	BufString *bs = NULL;
	FBYTE *lsdata = NULL;
	FULONG sockReadSize = 0;
	
	bs = SendMessageAndWait( con, df );
	
	if( bs != NULL )
	{
		DEBUG2("[CommServiceSendMsgDirect] Received from socket %lu\n", (unsigned long)bs->bs_Size );
		lsdata = (FBYTE *)bs->bs_Buffer;
		sockReadSize = bs->bs_Size;
	}

	if( lsdata != NULL )
	{
		DEBUG2("[CommServiceSendMsgDirect] Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, (int) df->df_Size, con->fc_Name );
		
		DataFormAdd( &ldf, lsdata, sockReadSize );
		
		ldf->df_Size = sockReadSize;
		DEBUG2("[CommServiceSendMsgDirect] Added new server to answer serverdfsize %ld sockreadsize %ld\n", ldf->df_Size, sockReadSize );
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
 * Create new FConnection
 *
 * @param add pointer to char table with internet address
 * @param name name of created connection
 * @return pointer to new FConnection structure when success, otherwise NULL
 */
FConnection *FConnectionNew( const char *add, const char *name, int type, void *service )
{
	FConnection *newcon;
	
	if( add == NULL )
	{
		return NULL;
	}
	
	if( ( newcon = FCalloc( 1, sizeof( FConnection ) ) ) != NULL )
	{
		int addlen = strlen( add );

		newcon->fc_Address = FCalloc( addlen+1 , sizeof( char ) );
		newcon->fc_Name = StringDuplicate( (char *) name );
		
		strcpy( newcon->fc_Address, add );
		strcpy( newcon->fc_Name, name );
		
		newcon->fc_Type  = type;
		newcon->fc_Service = service;
		
		pthread_mutex_init( &newcon->fc_Mutex, NULL );
		
		newcon->fc_Status = SERVICE_STATUS_CONNECTED;
	}
	return newcon;
}

/**
 * Delete FConnection
 *
 * @param con pointer to FConnection which will be deleted
 */
void FConnectionDelete( FConnection *con )
{
	if( con != NULL )
	{
		// we cannot delete FCommuncation when its doing PING
		
		while( TRUE )
		{
			if( con->fc_PingInProgress == FALSE )
			{
				break;
			}
			sleep( 1 );
		}
		
		pthread_mutex_destroy( &con->fc_Mutex );
		
		if( con->fc_Address ) FFree( con->fc_Address );
		if( con->fc_Name ) FFree( con->fc_Name );
		if( con->fc_FCID ) FFree( con->fc_FCID );
		
		if( con->fc_DestinationFCID != NULL )
		{
			FFree( con->fc_DestinationFCID );
		}

		if( con->fc_SSLInfo != NULL )
		{
			FFree( con->fc_SSLInfo );
		}
		if( con->fc_PEM != NULL )
		{
			FFree( con->fc_PEM );
		}
		
		if( con->fc_Socket != NULL )
		{
			SocketDelete( con->fc_Socket );
			con->fc_Socket = NULL;
		}
		
		if( con->fc_Thread != NULL )
		{
			ThreadDelete( con->fc_Thread );
			con->fc_Thread = NULL;
		}
		
		FFree( con );
	}
}

/**
 * Connect to server function
 *
 * @param s pointer to service to which new connection will be added
 * @param conname name of connection to which communication will be set (FCID or host name)
 * @return pointer to new FConnection structure when success, otherwise NULL
 */
FConnection *ConnectToServer( CommService *s, char *conname )
{
	FConnection *con = NULL;
	FConnection *retcon = NULL;
	FBOOL coreConnection = FALSE;
	SystemBase *lsb = (SystemBase *)SLIB;
	FriendCoreManager *fcm = lsb->fcm;
	
	DEBUG("[CommServClient] Checking internal connections\n");
	con = fcm->fcm_CommService->s_Connections;
	while( con != NULL )
	{
		DEBUG("[CommServClient] Going through connections %128s   vs  %128s\n", conname, con->fc_FCID );
		if( memcmp( conname, con->fc_Name, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 || strcmp( conname, con->fc_Address ) == 0 )
		{
			coreConnection = TRUE;
			break;
		}
		con = (FConnection *) con->node.mln_Succ;
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
			retcon = FConnectionNew( address, conname, SERVER_CONNECTION_OUTGOING, s );
			if( retcon != NULL )
			{
				retcon->fc_Port = port;
				retcon->fc_Socket = newsock;
			}
		}
	}
	
	if( newsock != NULL )
	{
		DEBUG("[CommServClient] Outgoing connection created\n");
		{
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, (FULONG)NULL },
				{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)fcm->fcm_ID },
				{ ID_FCON, (FULONG)0 , MSG_INTEGER_VALUE },
				{ TAG_DONE, TAG_DONE, TAG_DONE }
			};
			
			DataForm * df = DataFormNew( tags );

			SocketWrite( newsock, (char *)df, (FLONG)df->df_Size );
			
			DataFormDelete( df );
			
			char id[ FRIEND_CORE_MANAGER_ID_SIZE ];
			int i;
			
			// if thats our core connection we just copy ID
			
			if( coreConnection == TRUE )
			{
				memcpy( id, con->fc_FCID, FRIEND_CORE_MANAGER_ID_SIZE );
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
			SocketDelete( newsock );
		}
	}
	else
	{
		retcon->fc_Service = fcm->fcm_CommService;
	}
	return retcon;
}

