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

#include <properties/propertieslibrary.h>
#include <core/friendcore_manager.h>

#include <service/comm_msg.h>
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
		FERROR("Service is equal to NULL!\n");
		return NULL;
	}
	DEBUG("SendMessageAndWait alloc memory\n");
	CommRequest *cr = FCalloc( 1, sizeof( CommRequest ) );
	if( cr != NULL )
	{
		cr->cr_Time = time( NULL );
		cr->cr_RequestID = (FULONG)cr;
		cr->cr_Df = df;
		
		DataForm *rid= (DataForm *)(((char *)df) + (6*sizeof(FULONG)) + df[ 1 ].df_Size);
		rid->df_Size = (FULONG)cr;		// pointer is our request id
		DEBUG2("Request ID set to %ld\n", rid->df_Size );
	}
	else
	{
		return NULL;
	}
	
	DEBUG("SendMessageAndWait before lock\n");
	if( pthread_mutex_lock( &serv->s_Mutex ) == 0 )
	{
		DEBUG("SendMessageAndWait add entry to list\n");
		if( serv->s_Requests == NULL )
		{
			serv->s_Requests = cr;
		}
		else
		{
			DEBUG("Pointer %x\n", serv->s_Requests );
			serv->s_Requests->node.mln_Pred = (MinNode *)cr;
			cr->node.mln_Succ = (MinNode *)serv->s_Requests;
			serv->s_Requests = cr;
		}
		pthread_mutex_unlock( &serv->s_Mutex );
	}
	else
	{
		FFree( cr ); return NULL;
	}
	
	DEBUG("Before sending message lock\n");
	
	if( pthread_mutex_lock( &con->cfcc_Mutex ) == 0 )
	{
		DEBUG("mutex locked\n");
		SocketSetBlocking( con->cfcc_Socket, TRUE );
	
		// send request
		int size = SocketWrite( con->cfcc_Socket, (char *)df, df->df_Size );
		pthread_mutex_unlock( &con->cfcc_Mutex );
	}
	else
	{
		FFree( cr ); return NULL;
	}
	
	// wait for answer
	
	FBOOL quit = FALSE;
	while( quit != TRUE )
	{
		DEBUG("SendMessageAndWait waiting for condition\n");
		if( pthread_mutex_lock( &serv->s_Mutex ) == 0 )
		{
			DEBUG("SendMessageAndWait Setup condition\n");
			pthread_cond_wait( &serv->s_DataReceivedCond, &serv->s_Mutex );
			pthread_mutex_unlock( &serv->s_Mutex );
			DEBUG("Setup condition DONE!\n");
		}
		else break;

		DEBUG( "Condition met, now going on\n!" );
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
			DEBUG("SendMessageAndWait message : time %d  cr_bs ptr %p\n", ( acttime - cr->cr_Time ), cr->cr_Bs );
			bs = cr->cr_Bs;
			quit = TRUE;

			if( pthread_mutex_lock( &serv->s_Mutex ) == 0 )
			{
				DEBUG("Remove Socket entry from list\n");
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
	
	DEBUG( "[SendMessageAndWait] Done with sending, returning\n" );
	
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
	
	DEBUG("[CommServClient]: CommunicationSendmesage FCRE size %ld QUERY size  %ld\n", df[0].df_Size, df[1].df_Size );
	if( s && df )
	{
		char buffer[ MAX_SIZE ];
		
		if( (df[ 0 ].df_ID == (FULONG)(ID_FCRE) ) && (df[ 2 ].df_ID == (FULONG)(ID_QUER) ) )
		{
			FBYTE *targetName = (FBYTE *)(df+1);
			targetName += COMM_MSG_HEADER_SIZE;
			
			DEBUG2("[CommServClient]: Message destination %s  size %ld\n", targetName, df[ 0 ].df_Size );
			
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
				
				DEBUG("[CommServClient]: pointer to connections %p\n", lc );
				
				while( lc != NULL )
				{
					BufString *bs = SendMessageAndWait( lc, df );
					FULONG sockReadSize = 0;
					/*
					SocketSetBlocking( lc->cfcc_Socket, TRUE );
					
					//TODO test message , should be removed
					int size = SocketWrite( lc->cfcc_Socket, (char *)df, df->df_Size );//"hello", 5 );
					FULONG sockReadSize = 0;
					DEBUG2("[CommServClient]: wrote to socket %d\n", size );
					
					BufString *bs = SocketReadTillEnd(  lc->cfcc_Socket, 0, 15 ); 
					//BYTE *lsdata = ReadFormFromSocket( lc->cfcc_Socket, &sockReadSize, 30000 );
					*/
					
					if( bs != NULL )
					{
						FBYTE *lsdata = (FBYTE *)bs->bs_Buffer;
						sockReadSize = bs->bs_Size;
					
						if( lsdata != NULL )
						{
							DEBUG2("[CommServClient]:Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, df->df_Size, lc->cfcc_Name );

							MsgItem loctags[] = {
								{ ID_SNAM,  (FULONG)(FRIEND_CORE_MANAGER_ID_SIZE*sizeof(FBYTE)),  (FULONG)lc->cffc_ID },
								{ TAG_DONE, TAG_DONE, TAG_DONE }
							};
			
							//INFO("joining messages\n");
					
							DataForm *serverdf = DataFormNew( loctags );
					
							DataFormAdd( &ldf, lsdata, sockReadSize );
							DEBUG2("[CommServClient]: ---------------------Added new server to answer serverdfsize %ld sockreadsize %ld\n", serverdf->df_Size, sockReadSize );
					
							DataFormAddForm( &ldf, serverdf );
					
							DataFormDelete( serverdf );
						}
						//DEBUG("ldf size!!!!\n\n\n\n\n\n\n\n\n\nSIZE %lld\n\n\n\n\n %d\n\n\n\n\n", bs->bs_Size, ldf->df_Size );
						BufStringDelete( bs );
					}
					
					//sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
					DEBUG2("[CommServClient]: -Received information in bytes %ld\n", sockReadSize );
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
				
				DEBUG("Send message to target\n");
			
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
						/*
						DEBUG("Before sending message lock\n");
						pthread_mutex_lock( &lc->cfcc_Mutex );
						DEBUG("mutex locked\n");
						SocketSetBlocking( lc->cfcc_Socket, TRUE );
						
						//TODO test message , should be removed
						int size = SocketWrite( lc->cfcc_Socket, (char *)df, df->df_Size );//"hello", 5 );
						FULONG sockReadSize = 0;
						DEBUG2("[CommServClient]: wrote to socket %d\n", size );
					
						BufString *bs = SocketReadTillEnd(  lc->cfcc_Socket, 0, 15 ); 
						BYTE *lsdata = NULL;
						
						pthread_mutex_unlock( &lc->cfcc_Mutex );*/
						
						if( bs != NULL )
						{
							DEBUG2("Received from socket %llu\n", bs->bs_Size );
							lsdata = (FBYTE *)bs->bs_Buffer;
							sockReadSize = bs->bs_Size;
						}

						if( lsdata != NULL )
						{
							DEBUG2("[CommServClient]:Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, df->df_Size, lc->cfcc_Name );
					
							DataFormAdd( &ldf, lsdata, sockReadSize );
							
							ldf->df_Size = sockReadSize;
							DEBUG2("[CommServClient]: ---------------------Added new server to answer serverdfsize %ld sockreadsize %lu\n", ldf->df_Size, sockReadSize );
					
							DEBUG2("Message received '%.*s\n", sockReadSize, lsdata );
						}
						else
						{
							DEBUG("End of file added\n");
							DataFormAdd( &ldf, (FBYTE *)"{\"rb\":\"-1\"}", 11 );
							DEBUG2("[CommServClient]: -endof serverdfsize %ld sockreadsize %lu\n", ldf->df_Size, sockReadSize );
						}
						
						if( bs != NULL )
						{
							//DEBUG2("ldf size!!!!\n\n\n\n\n\n\n\n\n\nSIZE %lld\n\n\n\n\n %d\n\n\n\n\n", bs->bs_Size, ldf->df_Size );
							BufStringDelete( bs );
						}
						
						//sockReadSize = SocketRead( lc->cfcc_Socket, buffer, MAX_SIZE, 0 );
						DEBUG2("[CommServClient]: -Received information in bytes %ld\n", sockReadSize );
						//int writeSize = write( service->s_recvPipe[ 1 ], buffer, sockReadSize );
						break;
					}
					
					DEBUG("Next message\n");
				
					lc = (CommFCConnection *)lc->node.mln_Succ;
				}
				DEBUG2("Message returned %d\n", ldf->df_Size );
				return ldf;
			}
		}
		else
		{
			FERROR("Message is broken, cannot send it\n");
		}

		DEBUG("Communication resources free\n");
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
		
	DEBUG("[CommServiceSendMsgDirect] Send message to targetDirect\n");
			
	DataForm *ldf = DataFormNew( tags );
	
	BufString *bs = NULL;
	FBYTE *lsdata = NULL;
	FULONG sockReadSize = 0;
	
	bs = SendMessageAndWait( con, df );
	
	if( bs != NULL )
	{
		DEBUG2("Received from socket %llu\n", bs->bs_Size );
		lsdata = (FBYTE *)bs->bs_Buffer;
		sockReadSize = bs->bs_Size;
	}

	if( lsdata != NULL )
	{
		DEBUG2("[CommServiceSendMsgDirect]:Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, df->df_Size, con->cfcc_Name );
		
		DataFormAdd( &ldf, lsdata, sockReadSize );
		
		ldf->df_Size = sockReadSize;
		DEBUG2("[CommServiceSendMsgDirect]: ---------------------Added new server to answer serverdfsize %ld sockreadsize %ld\n", ldf->df_Size, sockReadSize );
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
			//con->cfcc_Socket = NULL;
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
	DEBUG("-->%x\n", lsb );
	FriendCoreManager *fcm = lsb->fcm;
	
	DEBUG("Checking internal connections\n");
	con = fcm->fcm_CommService->s_Connections;
	while( con != NULL )
	{
		DEBUG("Going through connections %128s   vs  %128s\n", conname, con->cffc_ID );
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
		DEBUG("Connection found\n");
		return con;
	}
	
	// connection was not found, its probably ip/internet address
	
	else
	{
		DEBUG("Trying to setup connection with %s\n", conname );
		
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
		DEBUG("Outgoing connection created\n");
		{
			MsgItem tags[] = {
				{ ID_FCRE,  (FULONG)0, (FULONG)NULL },
				{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)fcm->fcm_ID },
				{ ID_FCON, (FULONG)0 , MSG_INTEGER_VALUE },
				{ TAG_DONE, TAG_DONE, TAG_DONE }
			};
			
			DEBUG("Generate Data Form\n");
			//DataForm * df = DataFormNew( NULL );
			DataForm * df = DataFormNew( tags );
			DEBUG("DataForm Created %ld\n", df->df_Size );
			//DataFormAdd( &df, (FBYTE *)fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
			//INFO("Message created name byte %c%c%c%c\n", fcm->fcm_ID[32], fcm->fcm_ID[33], fcm->fcm_ID[34], fcm->fcm_ID[35]	);
			
			int sbytes = SocketWrite( newsock, (char *)df, df->df_Size );
			
			DEBUG("Message sent %d\n", sbytes );
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

/**
 * CommunicationService clients thread
 *
 * @param ptr pointer to CommunicationService Thread
 * @return 0 when success, otherwise error number
 */
int CommServiceThreadClient( FThread *ptr )
{
	CommService *service = (CommService *)ptr->t_Data;
	
	usleep( 1000000 );
	
	DEBUG("CommunicationServiceSend Start\n");
	
	struct mq_attr attr;
	char buffer[ MAX_SIZE + 1 ];

	pthread_mutex_lock( &InitMutex ); 
	pthread_cond_signal( &InitCond );    
	pthread_mutex_unlock( &InitMutex );  
	
	//
	// atm we only read FC connections
	//
	
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
			
			char *address = NULL;
			char *name = NULL;
			char *ipport = NULL;
			int port = service->s_port;

			char *pos = strchr( token, SERVER_NAME_SPLIT_SIGN );
			if( pos != NULL )
			{
				*pos = 0;
				address = token;
				name = ++pos;
				
			}else{
				address = token;
				name = token;
			}
			
			// now split address:port
			
			pos = strchr( address, SERVER_PORT_SPLIT_SIGN );
			if( pos != NULL )
			{
				*pos = 0;
				ipport = ++pos;
				port = atoi( ipport );
			}
			
			DEBUG2("New connection found address : %s name : %s\n", address, name );
			
			Socket *newsock;
			
			newsock = SocketConnectHost( service->s_SB, service->s_secured, address, port );
			//newcon->cfcc_Socket = SocketOpen( service->s_secured, service->s_port, SOCKET_TYPE_CLIENT );
			if( newsock != NULL )
			{
				DEBUG2("Incoming and outgoing connection set\n");
				int err = 0;
				DEBUG("Outgoing connection created on port: %d\n", service->s_port);
				//SocketSetBlocking( newcon->cfcc_Socket, TRUE );
				{
					SystemBase *lsb = (SystemBase *)service->s_SB;
					
					FriendCoreManager *fcm = (FriendCoreManager *) lsb->fcm; //service->s_FCM;
					
					MsgItem tags[] = {
						{ ID_FCRE,  (FULONG)0, (FULONG)NULL },
						{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)fcm->fcm_ID },
						{ ID_FCON, (FULONG)0 , MSG_INTEGER_VALUE },
						{ TAG_DONE, TAG_DONE, TAG_DONE }
					};
					
					DEBUG("Generate Data Form\n");
					DataForm * df = DataFormNew( tags );
					DEBUG("DataForm Created\n");
					
					DEBUG("DataForm created, pointer to fcm %p  sb ptr %p\n", fcm, lsb );

					//DataFormAdd( &df, (FBYTE *)fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
				
					int sbytes = SocketWrite( newsock, (char *)df, df->df_Size );
				
					DEBUG("Message sent %d\n", sbytes );
					DataFormDelete( df );
					
					CommFCConnection *con = CommServiceAddConnection( service, newsock, address, name, SERVICE_CONNECTION_OUTGOING );
				}
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
	
	//
	// we should ask for information from connection
	//
	
	// messages get and pass to destination
	
	//int queueFd = mq_ msgqToFd( service->s_inMqfd );
	
	struct timeval tv;
	fd_set writeToServ;
	fd_set readFromServ;
	
	FLONG idMax = 0;
	if( service->s_sendPipe[ 0 ] > idMax ) idMax = service->s_sendPipe[ 0 ];
	if( service->s_sendPipe[ 1 ] > idMax ) idMax = service->s_sendPipe[ 1 ];
	if( service->s_recvPipe[ 0 ] > idMax ) idMax = service->s_recvPipe[ 0 ];
	if( service->s_recvPipe[ 1 ] > idMax ) idMax = service->s_recvPipe[ 1 ];
	
	{
		//FriendCoreManager *fcm = (FriendCoreManager *)service->s_FCM;
		CommFCConnection *lc = service->s_Connections;
		while( lc != NULL )
		{
			if( lc->cfcc_Socket->fd > idMax )
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

			//DEBUG("Communication client: waiting for message\n");
			int ret = select( idMax+1, &writeToServ, NULL, NULL, &tv );
			
			// handle message
			
			if( ret > 0 )
			{
				int rets = read( service->s_sendPipe[ 0 ], buffer, MAX_SIZE );
				DEBUG("DATAREADED! %d\n", rets );
				
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
		}
	
	DEBUG("CommunicationService close\n");

	ptr->t_Launched = FALSE;

	
	return 0;
}
