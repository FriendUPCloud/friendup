/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <system/systembase.h>
#include <util/log/log.h>
#include <sys/stat.h>
#include <util/buffered_string.h>
#include <dirent.h>
#include <util/string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <communication/comm_service.h>
#include <communication/comm_service_remote.h>
#include <communication/comm_msg.h>
#include <system/json/jsmn.h>
#include <network/socket.h>

#define SUFFIX "fsys"
#define PREFIX "Remote"

/** @file
 * 
 *  Remote file system
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/06/2016
 */


//
// special structure
//

typedef struct SpecialData
{
	CommServiceRemote				*csr;
	SystemBase 						*sb;
	
	char							*host;
	char 							*id;
	char 							*login;
	char							*passwd;
	char							*devid;
	char 							*privkey;
	char 							fileptr[ 64 ];
	char							enc[ 10 ];
	
	char							*remoteUserName;
	char							*localDevName;
	char							*remoteDevName;
	
	int								idi, 
									logini, 
									passwdi, 
									devidi,
									hosti, 
									remotepathi, 
									fileptri;
	int								enci;

	int								mode;			// read or write
	char 							*tmppath;			// path to temporary file
	char 							*remotepath;		// path to remote file
	int								fileSize;		// temporary file size
	
	FConnection		 				*con;			// remote fs connection
	
	char							*address;	// hold destination server address
	int 							port;			// port
	int								secured;		// is connection secured
}SpecialData;

//
// definition
//

DataForm *SendMessageRFS( SpecialData *sd, DataForm *df );

#define ANSWER_POSITION 3
#define HEADER_POSITION (ANSWER_POSITION*COMM_MSG_HEADER_SIZE)

const char *GetSuffix()
{
	return SUFFIX;
}

const char *GetPrefix()
{
	return PREFIX;
}

//
//
//

void init( struct FHandler *s )
{
	DEBUG("[REMOTEFS] init\n");
}

//
//
//

void deinit( struct FHandler *s )
{
	DEBUG("[REMOTEFS] deinit\n");
}

//
// Login
//

int FSRemoteLogin( SpecialData *sd )
{
	int error = 1;
	
	MsgItem tags[] = {
		{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
			{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_QUER, (FULONG)sd->hosti, (FULONG)sd->host  },
			{ ID_SLIB, (FULONG)0, (FULONG)NULL },
			{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
				{ ID_PATH, (FULONG)30, (FULONG)"system.library/login" },
				{ ID_PARM, (FULONG)0, MSG_GROUP_START },
					{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
					{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
					//{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sessionidc },
					{ ID_PRMT, (FULONG) sd->devidi, (FULONG)sd->devid },
					{ ID_PRMT, (FULONG) sd->enci, (FULONG) sd->enc },
					{ ID_PRMT, (FULONG) 18, (FULONG)"appname=Mountlist" },
					{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
					{ MSG_END, MSG_END, MSG_END }
	};

	DataForm *df = DataFormNew( tags );
	
	DEBUG("[FSRemoteLogin] Message will be send\n");
	
	DataForm *recvdf = NULL;
	
	recvdf = SendMessageRFS( sd, df );
	DataFormDelete( df );
	
	DEBUG("[FSRemoteLogin] Response received\n");

	if( recvdf != NULL && recvdf->df_Size > 0 && recvdf->df_ID == ID_FCRE )
	{
		DEBUG2("DATAFORM Received %ld\n", recvdf->df_Size );
	
		unsigned int i=0;
		char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
		unsigned int r;
		jsmn_parser p;
		jsmntok_t t[128]; // We expect no more than 128 tokens 

		jsmn_init(&p);
		r = jsmn_parse(&p, d, (recvdf->df_Size - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE)), t, sizeof(t)/sizeof(t[0]));

		DEBUG1("[FSRemoteLogin] commR %d\n", r );
		// Assume the top-level element is an object 
		if (r > 1 && t[0].type == JSMN_OBJECT) 
		{
			DEBUG1("Found json object : %s\n", d );
			unsigned int i = 0, i1 = 0;
			
			for( i = 0; i < r;  i++ )
			{
				//int len = t[ i ].end-t[ i ].start;
				i1 = i + 1;
				
				if( jsoneq( d, &t[i], "response" ) == 0 ) 
				{
					//int len = t[ i1 ].end-t[ i1 ].start;
				
					if( strncmp( "0", d + t[i1].start, 1 ) != 0 )
					{
						error = 1;
					}
				}
				//sessionid

				if( jsoneq( d, &t[i], "sessionid") == 0 ) 
				{
					int len = t[ i1 ].end-t[ i1 ].start;
					char authidc[ 512 ];
					char *tmpses = StringDuplicateN( d + t[i1].start, len );
					
					memset( authidc, 0, 512 );
					
					int locs = sprintf( authidc, "sessionid=%s", tmpses );
					//int locs = sprintf( authidc, "sessionid=%s", "remote" );
					if( sd->id != NULL )
					{
						FFree( sd->id );
					}
					sd->id = StringDuplicate( authidc );
					sd->idi = locs;
					if( len < 1 )
					{
						error = 2;
					}
					else
					{
						error = 0;
					}
					FFree( tmpses );
					break;
				}
			}
		}
	}
	
	if( recvdf != NULL )
	{
		DataFormDelete( recvdf );
	}
	
	DEBUG("[FSRemoteLogin] end, error %d\n", error );
	
	return error;
}

//
// connect macro
//

DataForm *SendMessageRFS( SpecialData *sd, DataForm *df )
{
	MsgItem tags[] = {
		{ ID_FCRE, (FULONG)0,  (FULONG)NULL },
		{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
		{ TAG_DONE, TAG_DONE, TAG_DONE }
	};

	DEBUG("[SendMessageRFS] message to targetDirect\n");
		
	DataForm *ldf = DataFormNew( tags );
		
	BufString *bs = NULL;
	FBYTE *lsdata = NULL;
	FULONG sockReadSize = 0;

	Socket *newsock = sd->sb->sl_SocketInterface.SocketConnectHost( sd->sb, sd->secured, sd->address, sd->port );
	if( newsock != NULL )
	{
		DEBUG("[SendMessageRFS] Connection created, message will be send: %lu\n", df->df_Size );
		int size = sd->sb->sl_SocketInterface.SocketWrite( newsock, (char *)df, (FLONG)df->df_Size );
		bs = sd->sb->sl_SocketInterface.SocketReadTillEnd( newsock, 0, 15 );
		
		if( bs != NULL )
		{
			DEBUG2("[SendMessageRFS] Received from socket %ld\n", bs->bs_Size );
			lsdata = (FBYTE *)bs->bs_Buffer;
			sockReadSize = bs->bs_Size;
		}
		
		if( lsdata != NULL )
		{
			//DEBUG2("[CommServClient]:Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, df->df_Size, con->cfcc_Name );
			
			DataFormAdd( &ldf, lsdata, sockReadSize );
			
			ldf->df_Size = sockReadSize;
			DEBUG2("[SendMessageRFS] ---------------------Added new server to answer serverdfsize %ld sockreadsize %lu\n", ldf->df_Size, sockReadSize );
			
			DEBUG2("[SendMessageRFS] Message received '%.*s\n", (int)sockReadSize, lsdata );
			
			char *d = (char *)lsdata + (3*COMM_MSG_HEADER_SIZE);
			if( d[ 0 ] == 'f' && d[ 1 ] == 'a' && d[ 2 ] == 'i' && d[ 3 ] ==  'l' )
			{
				//char *tmp = "user session not found"; //22
				char *tmp = "device not found      ";
				
				//{ \"response\": \"%s\", \"code\":\"11\" }
				//if( strcmp( d, "fail<!--separate-->{\"response\":\"user session not found\"}" ) == 0 )
				char *code = strstr( d, "\"code\":");

				if( code != NULL && 0 == strncmp( code, "\"code\":\"11\"", 11 ) )
				{
					d += 33;
					memcpy( d, tmp, 22 );
				}
			}
		}
		else
		{
			DataFormAdd( &ldf, (FBYTE *)"{\"rb\":\"-1\"}", 11 );
		}
		
		if( bs != NULL )
		{
			BufStringDelete( bs );
		}
		
		sd->sb->sl_SocketInterface.SocketDelete( newsock );
		
		DEBUG("[SendMessageRFS] got reponse\n");
		
		return ldf;
	}
	
	DataFormDelete( ldf );
	
	return NULL;
}

//
// send message and try to relogin when call will fail
//

DataForm *SendMessageRFSRelogin( SpecialData *sd, DataForm *df )
{
	MsgItem tags[] = {
		{ ID_FCRE, (FULONG)0,  (FULONG)NULL },
		{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
		{ TAG_DONE, TAG_DONE, TAG_DONE }
	};

	DEBUG("[SendMessageRFSRelogin] message to targetDirect\n");
		
	DataForm *ldf = DataFormNew( tags );
		
	BufString *bs = NULL;
	FBYTE *lsdata = NULL;
	FULONG sockReadSize = 0;

	Socket *newsock = sd->sb->sl_SocketInterface.SocketConnectHost( sd->sb, sd->secured, sd->address, sd->port );
	if( newsock != NULL )
	{
		DEBUG("[SendMessageRFSRelogin] Connection created, message will be send: %lu\n", df->df_Size );
		int size = sd->sb->sl_SocketInterface.SocketWrite( newsock, (char *)df, (FLONG)df->df_Size );
		bs = sd->sb->sl_SocketInterface.SocketReadTillEnd( newsock, 0, 15 );
		
		if( bs != NULL )
		{
			DEBUG2("[SendMessageRFSRelogin] Received from socket %ld\n", bs->bs_Size );
			lsdata = (FBYTE *)bs->bs_Buffer;
			sockReadSize = bs->bs_Size;
		}
		
		if( lsdata != NULL )
		{
			//DEBUG2("[CommServClient]:Received bytes %ld CommunicationServiceClient Sending message size: %d server: %128s\n", sockReadSize, df->df_Size, con->cfcc_Name );
			
			DataFormAdd( &ldf, lsdata, sockReadSize );
			
			ldf->df_Size = sockReadSize;
			DEBUG2("[SendMessageRFSRelogin] ---------------------Added new server to answer serverdfsize %ld sockreadsize %lu\n", ldf->df_Size, sockReadSize );
			
			DEBUG2("[SendMessageRFSRelogin] Message received '%.*s\n", (int)sockReadSize, lsdata );
			
			char *d = (char *)lsdata + (3*COMM_MSG_HEADER_SIZE);
			if( d[ 0 ] == 'f' && d[ 1 ] == 'a' && d[ 2 ] == 'i' && d[ 3 ] ==  'l' )
			{
				//char *tmp = "user session not found"; //22
				char *tmp = "device not found      ";
				
				//{ \"response\": \"%s\", \"code\":\"11\" }
				//if( strcmp( d, "fail<!--separate-->{\"response\":\"user session not found\"}" ) == 0 )
				char *code = strstr( d, "\"code\":");

				if( code != NULL && 0 == strncmp( code, "\"code\":\"11\"", 11 ) )
				{
					int locerr = FSRemoteLogin( sd );

					DEBUG2("[SendMessageRFSRelogin] Relogin error: %d\n", locerr );
					
					if( locerr == 0 )
					{
						if( ldf != NULL )
						{
							DataFormDelete( ldf );
						}
						
						BufStringDelete( bs );
						
						sd->sb->sl_SocketInterface.SocketDelete( newsock );
						
						return SendMessageRFS( sd, df );
					}
				}
			}
		}
		else
		{
			DataFormAdd( &ldf, (FBYTE *)"{\"rb\":\"-1\"}", 11 );
		}
		
		if( bs != NULL )
		{
			BufStringDelete( bs );
		}
		
		sd->sb->sl_SocketInterface.SocketDelete( newsock );
		
		DEBUG("[SendMessageRFSRelogin] got reponse\n");
		
		return ldf;
	}
	
	DataFormDelete( ldf );
	
	return NULL;
}

//
// connect to another FC server
//

FConnection *ConnectToServerRFS( SpecialData *sd, char *conname )
{
	FConnection *con = NULL;
	FConnection *retcon = NULL;
	FBOOL coreConnection = FALSE;
	
	FriendCoreManager *fcm = sd->sb->fcm;
	
	DEBUG("Checking internal connections\n");
	con = fcm->fcm_CommService->s_Connections;
	while( con != NULL )
	{
		DEBUG("Going through connections %128s   vs  %128s\n", conname, con->fc_FCID );
		if( memcmp( conname, con->fc_Name, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 )
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
		DEBUG("Create new socket based on existing connection\n");
		
		int port = fcm->fcm_CommService->s_port;// FRIEND_COMMUNICATION_PORT;
		//con = CommServiceAddConnection( fcm->fcm_CommServiceClient, con->cfcc_Address, address, id, SERVICE_TYPE_CLIENT );
		newsock = sd->sb->sl_SocketInterface.SocketConnectHost( sd->sb, fcm->fcm_CommService->s_secured, con->fc_Address, port );
		
		if( newsock != NULL )
		{
			sd->address = StringDuplicate( con->fc_Address );
			sd->port = port;
		
			retcon = sd->sb->sl_CommServiceInterface.FConnectionNew( con->fc_Address, con->fc_Address, SERVER_CONNECTION_OUTGOING, fcm->fcm_CommService );
			if( retcon != NULL )
			{
				retcon->fc_Socket = newsock;
			}
		}
	}
	
	// connection was not found, its probably ip/internet address
	
	else
	{
		DEBUG("Trying to setup connection with %s\n", conname );
		
		memset( address, 0, sizeof(address) );
		unsigned int i, i1 = 0;
		
		strcpy( address, conname );
		int port = fcm->fcm_CommService->s_port;
		
		for( i = 0 ; i < strlen( address ) ; i++ )
		{
			i1 = i + 1;
			
			if( address[ i ] == ':' )
			{
				address[ i ] = 0;
				if( address[ i1 ] != 0 )
				{
					port = atoi( &address[ i1 ] );
				}
			}
		}
		
		newsock = sd->sb->sl_SocketInterface.SocketConnectHost( sd->sb, fcm->fcm_CommService->s_secured, address, port );
		
		sd->address = StringDuplicate( address );
		sd->port = port;
		
		retcon = sd->sb->sl_CommServiceInterface.FConnectionNew( address, conname, SERVER_CONNECTION_OUTGOING, fcm->fcm_CommService );
		if( retcon != NULL )
		{
			retcon->fc_Socket = newsock;
		}
	}

	if( newsock != NULL )
	{
		int err = 0;
		DEBUG("Outgoing connection created\n");
		{
			DEBUG("Generate Data Form\n");
			DataForm * df = DataFormNew( NULL );
			DEBUG("DataForm Created\n");
			DataFormAdd( &df, (FBYTE *)fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );
			//INFO("Message created name byte %c%c%c%c\n", fcm->fcm_ID[32], fcm->fcm_ID[33], fcm->fcm_ID[34], fcm->fcm_ID[35]	);
		
			int sbytes = sd->sb->sl_SocketInterface.SocketWrite( newsock, (char *)df, (FLONG)df->df_Size );
		
			DEBUG("Message sent %d\n", sbytes );
			DataFormDelete( df );
			
			char id[ FRIEND_CORE_MANAGER_ID_SIZE ];
			unsigned int i;
			
			// if thats our core connection we just copy ID
			
			if( coreConnection == TRUE )
			{
				memcpy( id, con->fc_FCID, FRIEND_CORE_MANAGER_ID_SIZE );
			}
			else
			{
				strcpy( id, address );
			
				for( i = 0; i< FRIEND_CORE_MANAGER_ID_SIZE; i++ )
				{
					if( fcm->fcm_ID[ i ] == 0 )
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
			sd->sb->sl_SocketInterface.SocketDelete( newsock );
		}
	}
	else
	{
		retcon->fc_Service = fcm->fcm_CommService;
	}
	
	return retcon;
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, User *usr, char **mountError )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	SystemBase *sb = NULL;
	char *conname = NULL;
	char *config = NULL;
	char *loginuser = NULL;
	char *loginpasswd = NULL;
//	FULONG id = 0; //not used
	
	if( s == NULL )
	{
		FERROR("Rootfile == NULL\n");
		return NULL;
	}
	
	DEBUG("[RemoteMount] Mounting filesystem!\n");
	
	if( ( dev = FCalloc( 1, sizeof( File ) ) ) != NULL )
	{
		struct TagItem *lptr = ti;
		
		//
		// checking passed arguments
		
		while( lptr->ti_Tag != TAG_DONE )
		{
			switch( lptr->ti_Tag )
			{
				case FSys_Mount_ID:
//					id = (FULONG)lptr->ti_Data; //not used?
					break;
				case FSys_Mount_Path:
					path = (char *)lptr->ti_Data;
					DEBUG("Mount FS path set '%s'\n", path );
					break;
				case FSys_Mount_Server:
					conname = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_Port:
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_SysBase:
					sb = (SystemBase *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginUser:
					loginuser = (char *)lptr->ti_Data;
				break;
				case FSys_Mount_LoginPass:
					loginpasswd = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_Config:
					config = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_UserName:
//					mountingUserName = (char *)lptr->ti_Data; //not used?
					break;
			}
		
			lptr++;
		}

		// Check if we're trying to log in using the sentinel user!
		// Sentinel's drives can always be mounted!
		/*
		DEBUG( "[MountFS] Testing if sentinel can mount %s ( %s==%s )\n", name, conname, fc_sentinel->Hostname );
		
		// Connection name is not always hostname!!
		
		if( fc_sentinel && fc_sentinel && strcmp( conname, fc_sentinel->Hostname ) == 0 && strcmp( fc_sentinel->Username, loginuser ) == 0 )
		{
			loginpasswd = fc_sentinel->UserObject->u_Password;
			DEBUG( "[MountFS] Using sentinel username and password.\n" );
		}
		*/
		//
		
		if( path == NULL )
		{
			FERROR("[ERROR]: Path option not found!\n");
			FFree( dev );
			return NULL;
		}
		
		if( conname == NULL )
		{
			FERROR("[ERROR]: Host option not found!\n");
			FFree( dev );
			return NULL;
		}
		
		// we are trying to open folder/connection
		
		unsigned int pathlen = strlen( path );
		dev->f_Path = FCalloc( pathlen + 10, sizeof(char) );
		strcpy( dev->f_Path, path );
		if( pathlen <=  0 )
		{
			strcat( dev->f_Path, ":" );
		}
		else
		{
			if( path[ pathlen-1 ] != ':' )
			{
				strcat( dev->f_Path, ":" );
			}
		}
		
		DEBUG("[RemoteMount] path is ok '%s'\n", dev->f_Path );
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usr;
		dev->f_Name = StringDuplicate( name );
		dev->f_Type = FType_Directory;
		dev->f_Size = 0;
		
		SpecialData *sd = FCalloc( 1, sizeof( SpecialData ) );
		if( sd != NULL )
		{
			int tr = 20;
			dev->f_SpecialData = sd;
			sd->sb = sb;

			sd->address = StringDuplicate( conname );
			
			FriendCoreManager *fcm = sb->fcm;
			
			while( fcm->fcm_CommServiceRemote == NULL )
			{
				sleep( 1 );
				if( (tr--) <= 0 )
				{
					break;
				}
			}
			
			sd->csr = fcm->fcm_CommServiceRemote;
			if( sd->csr == NULL )
			{
				if( dev->f_Name ){ FFree( dev->f_Name ); }
				if( dev->f_Path ){ FFree( dev->f_Path ); }
				if( sd->address ){ FFree( sd->address ); }
				
				FFree( sd );
				FFree( dev );
				dev = NULL;
				FERROR("Cannot mount device, connection do not exist\n" );
				return NULL;
			}
			sd->secured = fcm->fcm_CommServiceRemote->csr_secured;
			sd->port = sd->csr->csr_port;
			//sd->port = 6503;
			
			if( config != NULL )
			{
				unsigned int i = 0, i1 = 0;
				unsigned int r;
				jsmn_parser p;
				jsmntok_t t[128]; // We expect no more than 128 tokens 

				jsmn_init(&p);
				r = jsmn_parse(&p, config, strlen(config), t, sizeof(t)/sizeof(t[0]));
				if( r > 0 )
				{
					for( i = 0 ;  i < r ; i++ )
					{
						i1 = i + 1;
						if (jsoneq( config, &t[i], "PublicKey") == 0) 
						{
							int len = t[ i1 ].end-t[ i1 ].start;
						
							sd->privkey = StringDuplicateN( config + t[ i1 ].start, len );
						}
					}
				}
			}
			
			sd->host = StringDuplicate( conname );
			
			sd->hosti = strlen( sd->host )+1;
			char usernamec[ 512 ];
			memset( usernamec, 0, 512 );
			sprintf( usernamec, "username=%s", loginuser );
			char passwordc[ 512 ];
			memset( passwordc, 0, 512 );
			sprintf( passwordc, "password=%s", loginpasswd );
			char sessionidc[ 512 ];
			memset( sessionidc, 0, 512 );
			sprintf( sessionidc, "sessionid=%s", "remote" );
			
			
			strcpy( sd->enc, "enc=" );
			if( sd->privkey != NULL )
			{
				strcat( sd->enc, "yes" );
				sd->enci = 8;
			}
			else
			{
				strcat( sd->enc, "no" );
				sd->enci = 7;
			}
			
			sd->logini = strlen( usernamec );
			sd->passwdi = strlen( passwordc );
			sd->idi = strlen( sessionidc );
			sd->login = StringDuplicate( usernamec );
			sd->passwd = StringDuplicate( passwordc );
			sd->devid = StringDuplicate( "deviceid=remote" );
			sd->devidi = strlen( sd->devid );
			
			int error = FSRemoteLogin( sd );

			if( error > 0 )
			{
				FERROR("Message not received or another error appear: %d\n", error );
				
				if( dev->f_SpecialData )
				{
					SpecialData *sdat = (SpecialData *) dev->f_SpecialData;
					if( sdat != NULL )
					{
						if( sdat->host ){ FFree( sdat->host ); }
						if( sdat->login ){ FFree( sdat->login ); }
						if( sdat->passwd ){ FFree( sdat->passwd ); }
						if( sdat->id ){ FFree( sdat->id ); }
						if( sdat->address ){ FFree( sdat->address ); }
						if( sdat->privkey ){ FFree( sdat->privkey );}
						if( sdat->devid ){ FFree( sdat->devid ); }
						if( sdat->tmppath ){ FFree( sdat->tmppath ); }
						if( sdat->remotepath ){ FFree( sdat->remotepath ); }
						if( sdat->remoteUserName ){ FFree( sdat->remoteUserName ); }
						if( sdat->localDevName ){ FFree( sdat->localDevName ); }
						if( sdat->remoteDevName ){ FFree( sdat->remoteDevName ); }
						
						FFree( dev->f_SpecialData );
					}
				}
			
				if( dev->f_Name ){ FFree( dev->f_Name ); }
				if( dev->f_Path ){ FFree( dev->f_Path ); }
				
				FFree( dev );
				dev = NULL;
				FERROR("Cannot mount device, error %d\n", error );
				return NULL;
			}
			else
			{

			}
		}	// sd != NULL
		else
		{
			FERROR("Cannot allocate memory for special data\n");
			FFree( dev );
			return NULL;
		}
	}
	else
	{
		FERROR("Cannot allocate memory for device\n");
		return NULL;
	}
	
	DEBUG("[RemoteMount] mount ok\n");
	
	return dev;
}

//
// Only free device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[RemoteRelease] filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			if( sdat != NULL )
			{
				//( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName );
				sdat->sb->sl_UserManagerInterface.UMRemoveGlobalRemoteDrive( sdat->sb->sl_UM, sdat->remoteUserName, sdat->host, sdat->localDevName, sdat->remoteDevName );
				
				MsgItem tags[] = {
					{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)sdat->hosti, (FULONG)sdat->host  },
					{ ID_SLIB, (FULONG)0, (FULONG)NULL },
					{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)29, (FULONG)"system.library/ufile/release" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
					{ ID_PRMT, (FULONG) sdat->idi,  (FULONG)sdat->id },
					{ ID_PRMT, (FULONG) sdat->devidi, (FULONG)sdat->devid },
					{ ID_PRMT, (FULONG) 18, (FULONG)"appname=Mountlist" },
					{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
					{ MSG_END, MSG_END, MSG_END }
				};
				
				DataForm *df = DataFormNew( tags );
				
				DEBUG("[RemoteUnmount] Message will be send\n");
				
				DataForm *recvdf = NULL;
				
				recvdf = SendMessageRFSRelogin( sdat, df );
				DataFormDelete( df );

				DEBUG("[RemoteUnmount] Response received\n");
				int error = 1;
				
				if( recvdf != NULL && recvdf->df_Size > 0 && recvdf->df_ID == ID_FCRE )
				{

				}
				
				if( recvdf != NULL )
				{
					DataFormDelete( recvdf );
				}
				
				if( sdat->con != NULL )
				{
					sdat->sb->sl_CommServiceInterface.FConnectionDelete( sdat->con );
				}
				
				if( sdat->host ){ FFree( sdat->host ); }
				if( sdat->login ){ FFree( sdat->login ); }
				if( sdat->passwd ){ FFree( sdat->passwd ); }
				if( sdat->id ){ FFree( sdat->id ); }
				if( sdat->address ){ FFree( sdat->address ); }
				if( sdat->privkey ){ FFree( sdat->privkey );}
				if( sdat->devid ){ FFree( sdat->devid ); }
				if( sdat->tmppath ){ FFree( sdat->tmppath ); }
				if( sdat->remotepath ){ FFree( sdat->remotepath ); }
				if( sdat->remoteUserName ){ FFree( sdat->remoteUserName ); }
				if( sdat->localDevName ){ FFree( sdat->localDevName ); }
				if( sdat->remoteDevName ){ FFree( sdat->remoteDevName ); }
				
				FFree( lf->f_SpecialData );
			}
		}
		return 0;
	}
	return -1;
}

//
// Unmount device
//

int UnMount( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("[RemoteUnmount] Release filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			if( sdat != NULL )
			{
				sdat->sb->sl_UserManagerInterface.UMRemoveGlobalRemoteDrive( sdat->sb->sl_UM, sdat->remoteUserName, sdat->host, sdat->localDevName, sdat->remoteDevName );
				//sdat->sb->sl_UserManagerInterface.UMRemoveRemoteUser( sdat->sb->sl_UM, sdat->login, sdat->host );
				
				MsgItem tags[] = {
					{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)sdat->hosti, (FULONG)sdat->host  },
					{ ID_SLIB, (FULONG)0, (FULONG)NULL },
					{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)29, (FULONG)"system.library/ufile/unmount" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
					{ ID_PRMT, (FULONG) sdat->idi,  (FULONG)sdat->id },
					{ ID_PRMT, (FULONG) sdat->devidi, (FULONG)sdat->devid },
					{ ID_PRMT, (FULONG) 18, (FULONG)"appname=Mountlist" },
					{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
					{ MSG_END, MSG_END, MSG_END }
				};
				
				DataForm *df = DataFormNew( tags );
				
				DEBUG("[RemoteUnmount] Message will be send\n");
				
				DataForm *recvdf = NULL;
				
				recvdf = SendMessageRFSRelogin( sdat, df );
				DataFormDelete( df );

				DEBUG("[RemoteUnmount] Response received\n");
				int error = 1;
				
				if( recvdf != NULL && recvdf->df_Size > 0 && recvdf->df_ID == ID_FCRE )
				{

				}
				
				if( recvdf != NULL )
				{
					DataFormDelete( recvdf );
				}
				
				if( sdat->con != NULL )
				{
					sdat->sb->sl_CommServiceInterface.FConnectionDelete( sdat->con );
				}
				
				if( sdat->host ){ FFree( sdat->host ); }
				if( sdat->login ){ FFree( sdat->login ); }
				if( sdat->passwd ){ FFree( sdat->passwd ); }
				if( sdat->id ){ FFree( sdat->id ); }
				if( sdat->address ){ FFree( sdat->address ); }
				if( sdat->privkey ){ FFree( sdat->privkey );}
				if( sdat->devid ){ FFree( sdat->devid ); }
				if( sdat->tmppath ){ FFree( sdat->tmppath ); }
				if( sdat->remotepath ){ FFree( sdat->remotepath ); }
				if( sdat->remoteUserName ){ FFree( sdat->remoteUserName ); }
				if( sdat->localDevName ){ FFree( sdat->localDevName ); }
				if( sdat->remoteDevName ){ FFree( sdat->remoteDevName ); }
				
				FFree( lf->f_SpecialData );
			}
		}
		return 0;
	}
	return -1;
}

//
// connect macro
//

DataForm *SendMessageWithReconnection( SpecialData *sd, DataForm *df )
{
	DataForm *recvdf = NULL;
	
	recvdf = sd->sb->sl_CommServiceInterface.CommServiceSendMsgDirect(  sd->con, df );
	
	if( recvdf == NULL )
	{
		DEBUG("RECVDNULL\n");
	}
	if( recvdf->df_Size == 0 )
	{
		DEBUG("SIZE 0\n");
	}
	if( recvdf->df_ID != ID_FCRE )
	{
		char *e = (char *)recvdf;
		DEBUG("NOT FCRE %c %c %c %c %c\n", e[0],e[1],e[2],e[3],e[4]);
	}
	
	if( recvdf == NULL || recvdf->df_Size == 0 || recvdf->df_ID != ID_FCRE )
	{
		DEBUG("Create new socket\n");
		Socket *newsock = sd->sb->sl_SocketInterface.SocketConnectHost( sd->sb, sd->secured, sd->address, sd->port );
		if( newsock != NULL )
		{
			sd->con->fc_Socket = newsock;
			
			{
				int err = 0;
				DEBUG("Outgoing connection created\n");
				{
					DEBUG("Generate Data Form\n");
					DataForm * df = DataFormNew( NULL );
					DEBUG("DataForm Created\n");
					SystemBase *sb = (SystemBase *)sd->sb;
					FriendCoreManager *fcm = sb->fcm;
					DataFormAdd( &df, (FBYTE *)fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE );

					int sbytes = sd->sb->sl_SocketInterface.SocketWrite( newsock, (char *)df, (FLONG)df->df_Size );
		
					DEBUG("Message sent %d\n", sbytes );
					DataFormDelete( df );
				}
			}
			
			recvdf = sd->sb->sl_CommServiceInterface.CommServiceSendMsgDirect(  sd->con, df );
		}
		else
		{
			FERROR("Cannot setup new connection\n");
		}
	}
	
	return recvdf;
}

//
// Open file
//

void *FileOpen( struct File *s, const char *path, char *mode )
{
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	char smode[ 8 ];
	char *tmpremotepath = NULL;
	
	strcpy( smode, "mode=" );
	
	if( mode[0] == 'r' )
	{
		strcat( smode, "rb" );			// we cannot have streaming currently
													// becaouse we dont know how big file it will be on the end
													// we must be sure also that file exist on server
	}
	else
	{
		strcat( smode, mode );
	}
	
	if( sd != NULL )
	{
		int hostsize = strlen( sd->host ) + 1;
		int plen = strlen( path );
		
		if( ( tmpremotepath = FCalloc( plen + 512, sizeof( char ) ) ) != NULL )
		{
			int doub = 0;
			int i;
			
			for( i=0 ; i < plen ; i++ )
			{
				if( path[ i ] == ':' )
				{
					doub = i+1;
					break;
				}
			}
			
			strcpy( tmpremotepath, "path=" );
		
			if( s->f_Path != NULL )
			{
				strcat( tmpremotepath, s->f_Path );
			}

			if( path != NULL )
			{
				strcat( tmpremotepath, &(path[ doub ]) );
			}
			
			//DEBUG("\nREMOTE FOPEN %s - path %s\n", tmpremotepath, path );

			sd->remotepathi = strlen( tmpremotepath ) + 1;
	
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
					{ ID_SLIB, (FULONG)0, (FULONG)NULL },
					{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
						{ ID_PATH, (FULONG)26, (FULONG)"system.library/ufile/open" },
						{ ID_PARM, (FULONG)0, MSG_GROUP_START },
							{ ID_PRMT, (FULONG) sd->remotepathi, (FULONG)tmpremotepath },
							{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
							{ ID_PRMT, (FULONG) sd->passwdi, (FULONG)sd->passwd },
							{ ID_PRMT, (FULONG) sd->idi, (FULONG)sd->id },
							{ ID_PRMT, (FULONG) 8,  (FULONG)smode },
						{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_END, MSG_END, MSG_END }
			};
			
			DataForm *df = DataFormNew( tags );

			DataForm *recvdf = NULL;
			
			recvdf = SendMessageRFSRelogin( sd, df );
//			recvdf = SendMessageWithReconnection( sd, df );
		
			DEBUG("[RemoteOpen] Response received %p\n", recvdf );
		
			if( recvdf != NULL && recvdf->df_Size > 0 && recvdf->df_ID == ID_FCRE )
			{
				// Write the buffer to the file
				// 48 header
				// 64 ID
				// 1 - 0 on the end
				
				//if( ok<!--separate-->{ "Fileptr" : "0x103d04d0" }
				
				//char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
				int r;
				jsmn_parser p;
				jsmntok_t t[128]; // We expect no more than 128 tokens 
				
				// we must skip part  ok<!--separate-->
				//d += 17;
				char *d = strstr( (((char *)recvdf) + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE)), "-->" )+3;

				jsmn_init(&p);
				//r = jsmn_parse(&p, d, (recvdf->df_Size - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE)), t, sizeof(t)/sizeof(t[0]));
				r = jsmn_parse(&p, d, (recvdf->df_Size - ((ANSWER_POSITION*COMM_MSG_HEADER_SIZE)+17)), t, sizeof(t)/sizeof(t[0]));

				DEBUG1("[RemoteOpen] parse result %d parse string %s\n", r, d );
				// Assume the top-level element is an object 
				if (r > 1 && t[0].type == JSMN_OBJECT) 
				{
					DEBUG1("[RemoteOpen] Found json object\n");
					int i = 0, i1 = 0;
				
					for( i = 0; i < r ; i++ )
					{
						i1 = i + 1;
						if (jsoneq( d, &t[i], "fileptr") == 0) 
						{
							int len = t[ i1 ].end-t[ i1 ].start;
							char pointer[ 255 ];
							memset( pointer, 0, sizeof(pointer ) );
							
							int pointeri = sprintf( pointer, "fptr=%.*s", len, d + t[i1].start );
							DEBUG("[RemoteOpen] POINTER %s\n", pointer );
							
							// Ready the file structure
							File *locfil = NULL;
							if( ( locfil = FCalloc( 1, sizeof( File ) ) ) != NULL )
							{
								locfil->f_Path = StringDuplicate( path );
								locfil->f_RootDevice = s;
								locfil->f_Socket = s->f_Socket;
						
								if( ( locfil->f_SpecialData = FCalloc( 1, sizeof( SpecialData ) ) ) != NULL )
								{
									SpecialData *localsd = (SpecialData *)locfil->f_SpecialData;
									
									if( mode[0] == 'r' )
									{
										localsd->mode = MODE_READ;
										locfil->f_OperationMode = MODE_READ;
									}
									else if( mode[0] == 'w' )
									{
										localsd->mode = MODE_WRITE;
										locfil->f_OperationMode = MODE_WRITE;
									}

									localsd->sb = sd->sb;
									localsd->remotepath = StringDuplicate( path );
									//locfil->f_SessionID = StringDuplicate( s->f_SessionID );
									locfil->f_SessionIDPTR = s->f_SessionIDPTR;
									strcpy( localsd->fileptr, pointer );
									localsd->fileptri = pointeri+1;
					
									DEBUG("[RemoteOpen] FileOpened, memory allocated for reading.\n" );
									
									DataFormDelete( recvdf );
									DataFormDelete( df );
									FFree( tmpremotepath );
								
									return locfil;
								}
				
								// Free this one
								FFree( locfil->f_Path );
								FFree( locfil );
							}
						}
					}
				}
			}
			
			if( recvdf != NULL ) DataFormDelete( recvdf );
			DataFormDelete( df );
			FFree( tmpremotepath );
		}
		
	} // sd != NULL

	return NULL;
}

//
// Close File
//

int FileClose( struct File *root, void *fp )
{	
	int result = -2;
	File *f = (File *)fp;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	
	if( sd != NULL )
	{
		SpecialData *rsd = (SpecialData *)root->f_SpecialData;
		int hostsize = strlen( rsd->host )+1;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)rsd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)27, (FULONG)"system.library/ufile/close" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) sd->fileptri, (FULONG)sd->fileptr },
						{ ID_PRMT, (FULONG) rsd->logini, (FULONG)rsd->login },
						{ ID_PRMT, (FULONG) rsd->passwdi,  (FULONG)rsd->passwd },
						{ ID_PRMT, (FULONG) rsd->idi,  (FULONG)rsd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
			
		DataForm *df = DataFormNew( tags );

		DataForm *recvdf = NULL; 
			
		recvdf = SendMessageRFSRelogin( rsd, df );

		DEBUG("[RemoteClose] Response received %p\n", recvdf );
		
		if( recvdf != NULL && recvdf->df_Size > 0 )
		{
			char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
			
			DEBUG("[RemoteClose] RECEIVED  %10s\n", d );
			result =  recvdf->df_Size  - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
			
			if( strcmp( d, "{\"rb\":\"-1\"}" ) == 0 )
			{
				DataFormDelete( recvdf );
				DataFormDelete( df );
				return -1;
			}
		}
		
		if( recvdf != NULL ) DataFormDelete( recvdf );
		DataFormDelete( df );
		
		if( sd->host != NULL ) FFree( sd->host );
		if( sd->id != NULL ) FFree( sd->id );
		if( sd->login != NULL ) FFree( sd->login );
		if( sd->passwd != NULL ) FFree( sd->passwd );
		if( sd->tmppath != NULL ) FFree( sd->tmppath );
		if( sd->remotepath != NULL ) FFree( sd->remotepath );
			
		FFree( sd );
		
		if( f != NULL )
		{
			//if( f->f_SessionID != NULL ) FFree( f->f_SessionID );
			if( f->f_Path != NULL )
			{
				FFree( f->f_Path );
			}
			FFree( f );
		}
	} // sd != NULL
	
	return result;
}

//
// Read data from file
//

int FileRead( struct File *f, char *buffer, int rsize )
{
	int result = -2;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	
	if( sd != NULL )
	{
		char sizec[ 256 ];
		int sizei = snprintf( sizec, 256, "size=%d", rsize )+1;
		
		File *root = f->f_RootDevice;
		SpecialData *rsd = (SpecialData *)root->f_SpecialData;
		int hostsize = strlen( rsd->host )+1;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)rsd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)26, (FULONG)"system.library/ufile/read" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) sd->fileptri, (FULONG)sd->fileptr },
						{ ID_PRMT, (FULONG) sizei, (FULONG) sizec },
						{ ID_PRMT, (FULONG) rsd->logini, (FULONG)rsd->login },
						{ ID_PRMT, (FULONG) rsd->passwdi,  (FULONG)rsd->passwd },
						{ ID_PRMT, (FULONG) rsd->idi,  (FULONG)rsd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
			
		DataForm *df = DataFormNew( tags );

		DataForm *recvdf = NULL;
		
		recvdf = SendMessageRFSRelogin( rsd, df );

		DEBUG2("Response received %p\n", recvdf );
		
		if( recvdf != NULL && recvdf->df_ID == ID_FCRE &&  recvdf->df_Size > 0 )
		{
			char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
			
			result =  recvdf->df_Size  - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);

			// 1531 - 1483
			
			if( strncmp( d, "{\"rb\":\"-1\"}", 11 ) == 0 )
			{
				DataFormDelete( recvdf );
				DataFormDelete( df );
				return -1;
			}
			
			result = result-1;
			
			if( f->f_Stream == TRUE )
			{
				sd->sb->sl_SocketInterface.SocketWrite( f->f_Socket, d, (FLONG)result );
			}
			else
			{
				memcpy( buffer, d, result );
			}
		}
		
		if( recvdf != NULL ) DataFormDelete( recvdf );
		DataFormDelete( df );
	} // sd != NULL
	
	return result;
}

//
// write data to file
//

int FileWrite( struct File *f, char *buffer, int wsize )
{
	int result = -2;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	
	if( sd != NULL )
	{
		char *data;
		
		if( ( data = FCalloc( wsize+10, sizeof(char) ) ) != NULL  )
		{
			strcpy( data, "data=" );
			memcpy( &data[ 5 ], buffer, wsize ); 
			
			char sizec[ 256 ];
			int sizei = snprintf( sizec, 256, "size=%d", wsize )+1;
		
			File *root = f->f_RootDevice;
			SpecialData *rsd = (SpecialData *)root->f_SpecialData;
			int hostsize = strlen( rsd->host )+1;
		
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)hostsize, (FULONG)rsd->host  },
					{ ID_SLIB, (FULONG)0, (FULONG)NULL },
					{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
						{ ID_PATH, (FULONG)27, (FULONG)"system.library/ufile/write" },
						{ ID_PARM, (FULONG)0, MSG_GROUP_START },
							{ ID_PRMT, (FULONG) wsize+6, (FULONG)data },
							{ ID_PRMT, (FULONG) sd->fileptri, (FULONG)sd->fileptr },
							{ ID_PRMT, (FULONG) sizei, (FULONG) sizec },
							{ ID_PRMT, (FULONG) rsd->logini, (FULONG)rsd->login },
							{ ID_PRMT, (FULONG) rsd->passwdi,  (FULONG)rsd->passwd },
							{ ID_PRMT, (FULONG) rsd->idi,  (FULONG)rsd->id },
						{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_END, MSG_END, MSG_END }
			};
			
			DEBUG("[RemoteWrite] bytes %d and message %.10s\n", wsize, data );
			
			DataForm *df = DataFormNew( tags );

			DataForm *recvdf = NULL;
			
			recvdf = SendMessageRFSRelogin( rsd, df );

			DEBUG("[RemoteWrite] Response received %p\n", recvdf );
		
			if( recvdf != NULL && recvdf->df_Size > 0 )
			{
				//int i=0;

				char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
			
				DEBUG("[RemoteWrite] RECEIVED  %s\n", d );
				result =  recvdf->df_Size  - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
				// 1531 - 1483
			
				if( strcmp( d, "{\"rb\":\"-1\"}" ) == 0 )
				{
					DataFormDelete( recvdf );
					DataFormDelete( df );
					return -1;
				}
				else
				{
					unsigned int i=0;
					char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
					int r;
					jsmn_parser p;
					jsmntok_t t[128]; // We expect no more than 128 tokens 

					jsmn_init(&p);
					r = jsmn_parse(&p, d, result, t, sizeof(t)/sizeof(t[0]));

					DEBUG1("[RemoteWrite] commR %d\n", r );
					// Assume the top-level element is an object 
					if (r > 1 && t[0].type == JSMN_OBJECT) 
					{
						DEBUG1("[RemoteWrite] Found json object\n");
						int i = 0, i1 = 0;
				
						for( i = 0; i < r ;  i++ )
						{
							i1 = i + 1;
							if (jsoneq( d, &t[i], "filestored") == 0) 
							{
								int len = t[ i1 ].end-t[ i1 ].start;
								char sizec[ 256 ];
								
								strncpy( sizec, d + t[ i1 ].start, len );
								
								result = atoi( sizec );
							}
						}
					}
				}
			
				DataFormDelete( recvdf );
			}
			
			DataFormDelete( df );
			FFree( data );
		}
		else
		{
			FERROR("[RemoteWrite] Cannot allocate memory for buffer\n");
			return -2;
		}
		
	} // sd != NULL
	
	return result;
}

//
// seek
//

int FileSeek( struct File *s, int pos )
{
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	if( sd )
	{
		//return fseek( (FILE *)sd->fp, pos, SEEK_SET );
	}
	return -1;
}

//
// GetDiskInfo
//

int GetDiskInfo( struct File *s, int64_t *used, int64_t *size )
{
	*used = 0;
	*size = 0;
	
	int result = -2;
	File *root = s;
	SpecialData *rsd = (SpecialData *)root->f_SpecialData;
	int hostsize = strlen( rsd->host )+1;
	
	MsgItem tags[] = {
		{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
			{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_QUER, (FULONG)hostsize, (FULONG)rsd->host  },
			{ ID_SLIB, (FULONG)0, (FULONG)NULL },
			{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
				{ ID_PATH, (FULONG)27, (FULONG)"system.library/file/diskinfo" },
				{ ID_PARM, (FULONG)0, MSG_GROUP_START },
					{ ID_PRMT, (FULONG) rsd->logini, (FULONG)rsd->login },
					{ ID_PRMT, (FULONG) rsd->passwdi,  (FULONG)rsd->passwd },
					{ ID_PRMT, (FULONG) rsd->idi,  (FULONG)rsd->id },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
		{ MSG_GROUP_END, 0,  0 },
		{ MSG_END, MSG_END, MSG_END }
	};

	DataForm *df = DataFormNew( tags );

	DataForm *recvdf = NULL;
	
	recvdf = SendMessageRFSRelogin( rsd, df );

	DEBUG("[RemoteWrite] Response received %p\n", recvdf );
	
	if( recvdf != NULL && recvdf->df_Size > 0 )
	{
		char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
		
		DEBUG("[RemoteWrite] RECEIVED  %.10s\n", d );
		result =  recvdf->df_Size  - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
		unsigned int i=0;
		d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
		int r;
		jsmn_parser p;
		jsmntok_t t[128]; // We expect no more than 128 tokens 
		
		jsmn_init(&p);
		r = jsmn_parse(&p, d, result, t, sizeof(t)/sizeof(t[0]));

		DEBUG1("[RemoteWrite] commR %d\n", r );
		// Assume the top-level element is an object 
		if (r > 1 && t[0].type == JSMN_OBJECT) 
		{
			char *end;
			DEBUG1("[RemoteWrite] Found json object\n");
			int i = 0, i1 = 0;
			
			for( i = 0; i < r ;  i++ )
			{
				i1 = i + 1;
				if( jsoneq( d, &t[i], "disksize") == 0 ) 
				{
					int len = t[ i1 ].end-t[ i1 ].start;
					char sizec[ 256 ];
					
					strncpy( sizec, d + t[ i1 ].start, len );
					
					*size = strtoll( sizec, &end, 0 );
				}
				else if( jsoneq( d, &t[i], "storedbytes") == 0 ) 
				{
					int len = t[ i1 ].end-t[ i1 ].start;
					char sizec[ 256 ];
					
					strncpy( sizec, d + t[ i1 ].start, len );
					
					*used = strtoll( sizec, &end, 0 );
				}
			}
		}
		DataFormDelete( recvdf );
	}
	
	DataFormDelete( df );
	
	return 0;
}

//
// make directory in local file system
//

int MakeDir( struct File *s, const char *path )
{
	INFO("[RemoteMakedir] start!\n");
	int error = 0;

	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}

		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}

		DEBUG2("[RemoteMakedir] REMOTE PATH %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)28, (FULONG)"system.library/file/makedir" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) commi, (FULONG)comm },
						{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
						{ ID_PRMT, (FULONG) sd->passwdi, (FULONG) sd->passwd },
						{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG("[RemoteMakedir] Message will be send\n");

		DataForm *recvdf = NULL;

		recvdf = SendMessageRFSRelogin( sd, df );

		DEBUG("[RemoteMakedir] Response received\n");
		
		if( recvdf != NULL)
		{
			unsigned int i=0;
			char *d = (char *)recvdf;
			error = 0;
		}
		else
		{
			error = 1;
		}
		
		DataFormDelete( df );
		DataFormDelete( recvdf );
		
		FFree( comm );
	}
	DEBUG("[RemoteMakedir] END\n");
	
	return error;
}

//
// Delete
//

FLONG Delete( struct File *s, const char *path )
{
	DEBUG("[RemoteDelete] Delete!\n");

	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}

		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}

		DEBUG2("[RemoteDelete] REMOTE PATH %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)27, (FULONG)"system.library/file/delete" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) commi, (FULONG)comm },
						{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
						{ ID_PRMT, (FULONG) sd->passwdi, (FULONG) sd->passwd },
						{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG("[RemoteDelete] Message will be send\n");

		DataForm *recvdf = NULL;
			
		recvdf = SendMessageRFSRelogin( sd, df );
		
		DEBUG("[RemoteDelete] Response received\n");
		
		if( recvdf != NULL)
		{
			unsigned int i=0;
			char *d = (char *)recvdf;
			
			//sprintf( tmp, "ok<!--separate-->{\"response\":\"%d\"}", bytes );

		}
		
		DataFormDelete( df );
		DataFormDelete( recvdf );
		
		FFree( comm );
	}
	DEBUG("[RemoteDelete] END\n");

	return 0;
}

//
// Rename
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("[RemoteRename] start!\n");
	char *newname = NULL;
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	int error = 0;
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}

		if( path != NULL )
		{
			strcat( comm, path );
		}

		DEBUG2("[RemoteRename] REMOTE PATH %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		DEBUG("sb %p fcm \n", sd->sb );
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		char newname[ 512 ];
		int newnamesize = sprintf(  newname, "newname=%s",  nname ) + 1;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)27, (FULONG)"system.library/file/rename" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) commi, (FULONG)comm },
						{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
						{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
						{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sd->id },
						{ ID_PRMT, (FULONG) newnamesize, (FULONG)newname },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
		
		
		DEBUG("[RemoteRename] Before creating DataForm  comm %s login %s  pass %s session %s passsize %d\n", comm, sd->login, sd->passwd, sd->id, sd->passwdi );

		DataForm *df = DataFormNew( tags );
		
		DEBUG("[RemoteRename] Message will be send\n");

		DataForm *recvdf = NULL;
		
		recvdf = SendMessageRFSRelogin( sd, df );

		if( recvdf != NULL)
		{
			DEBUG2("[RemoteRename] DATAFORM Received %ld\n", recvdf->df_Size );
			
			unsigned int i=0;
			char *d = (char *)recvdf;

			//BufStringAddSize( bs, &d[ HEADER_POSITION ], recvdf->df_Size - (HEADER_POSITION) );
		}
		
		DataFormDelete( recvdf );
		DataFormDelete( df );
		
		FFree( comm );
	}
	DEBUG("[RemoteRename] rename END\n");
	
	return error;
}


//
// Copy file from source to destination
//

int Copy( struct File *s, const char *dst, const char *src )
{
	return  0;
}

//
// Execute file
//

#define BUFFER_SIZE 1024

char *Execute( struct File *s, const char *path, const char *args )
{
	DEBUG("[RemoteExecute] start\n");
/*
	FULONG res = 0;
	char command[ BUFFER_SIZE ];
	char *temp = NULL;
	char *result = NULL;
    unsigned long size = 0;

	//
	//
	// we are calling native application and read output from it
	//
	//
	
	
	//void pclose( FILE *f );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = calloc( strlen( s->f_Path ) + strlen(path), sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		strcat( comm, &(path[ doub+2 ]) );

		sprintf( command, "%s %s", comm, args );

		FILE* pipe = popen( command, "r");
		if( !pipe )
		{
			return 0;
		}

		char buffer[ BUFFER_SIZE ];
    
		while( !feof( pipe ) ) 
		{
			char *gptr;

			if( ( gptr = fgets( buffer, BUFFER_SIZE, pipe ) ) != NULL )
			{
				size = strlen( buffer );
				//DEBUG("inside buffer '%s' size %d\n", buffer, size );

				if( result == NULL )
				{
					if( ( result = calloc( size+1, sizeof(char) ) ) != NULL ){
						memcpy( result, buffer, size );
						result[ size ] = 0;

						res += size;
                    //DEBUG("SYS: copy %d  res %d\n", size, res );
					}
					else
					{
						printf("Cannot alloc mem result.\n");
					}
				}
				else
				{
					//DEBUG("TEMP res size %d %s\n", res, temp );
					if( ( temp = calloc( res+1, sizeof(char) ) ) != NULL )
					{
						memcpy( temp, result, res );
						//DEBUG("Data copy %s\n", temp );
						if( result != NULL ){ free( result ); result = NULL; }
						//DEBUG("before result calloc\n");
						if( ( result = calloc( res+size+1, sizeof(char) ) ) != NULL )
						{
							memcpy( result, temp, res );
							memcpy( &(result[ res ]), buffer, size );

							//DEBUG("res %d size %d result %s\n", res, size, result );
							res += size;
						}

						free( temp );
						temp = NULL;
					}
				}
				//res += (FULONG)size;
			}
		}
		pclose( pipe );
	}
	else
	{
		return NULL;
	}

	return result;
	*/
	return NULL;
}

//
// Get information about last file changes (seconds from 1970)
//

FLONG GetChangeTimestamp( struct File *s, const char *path )
{
	FLONG rettime = 0;
	
	DEBUG("[RemoteGetChangeTimestamp] start!\n");
	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}

	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}

		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}

		DEBUG2("[RemoteGetChangeTimestamp] REMOTE PATH: %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		
		DEBUG2("[RemoteGetChangeTimestamp] Send message to  %s\n", sd->host );
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)sizeof(FULONG) , 0 },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)34, (FULONG)"system.library/file/getmodifydate" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) commi, (FULONG)comm },
						{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
						{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
						{ ID_PRMT, (FULONG)  sd->idi,  (FULONG)sd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
		
		DataForm *recvdf = NULL;
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG("[RemoteGetChangeTimestamp] Message will be send\n");
			
		recvdf = SendMessageRFSRelogin( sd, df );
		
		if( recvdf != NULL && recvdf->df_Size > 0 && recvdf->df_ID == ID_FCRE )
		{
			DEBUG2("[RemoteGetChangeTimestamp] DATAFORM Received %ld\n", recvdf->df_Size );
			
			unsigned int i=0;
			char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
			unsigned int r;
			jsmn_parser p;
			jsmntok_t t[128]; // We expect no more than 128 tokens 

			jsmn_init(&p);
			r = jsmn_parse(&p, d, (recvdf->df_Size - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE)), t, sizeof(t)/sizeof(t[0]));

			DEBUG1("[RemoteGetChangeTimestamp] commR %d msg %s\n", r, d );
			if (r > 1 && t[0].type == JSMN_OBJECT) 
			{
				DEBUG1("[RemoteGetChangeTimestamp] Found json object : %s\n", d );
				unsigned int i = 0, i1 = 0;
				
				for( i = 0; i < r;  i++ )
				{
					i1 = i + 1;

					if( jsoneq( d, &t[i], "modifytime" ) == 0 ) 
					{
						char *modtimestr = StringDuplicateN( d + t[i1].start, t[i1].end-t[i1].start );
						if( modtimestr != NULL )
						{
							char *next;
							rettime = (FULONG)strtol( modtimestr, &next, 0);
							DEBUG1("[RemoteGetChangeTimestamp] Modify date : %ld\n", rettime );
							
							FFree( modtimestr );
						}
					}
				}
			}
		}
		
		DataFormDelete( recvdf );
		DataFormDelete( df );
		
		FFree( comm );
	}
	DEBUG("[RemoteGetChangeTimestamp] END\n");

	return (FLONG)rettime;
}

//
// Call a library
//
// TODO: Finish it!

BufString *Call( File *f, const char *path, char *args )
{
	DEBUG("[RemoteCall] start!\n");
	BufString *bs = BufStringNew();
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	
	if( sd != NULL )
	{
		File *root = f->f_RootDevice;
		SpecialData *rsd = (SpecialData *)root->f_SpecialData;
		int hostsize = strlen( rsd->host ) + 1;
		
		char *pathp = NULL;
		char *argsp = NULL;
		
		int pathi = strlen( path ) + 1;
		int argsi = strlen( args ) + 1;
		
		pathp = FCalloc( pathi + 30, sizeof(char) );
		argsp = FCalloc( argsi + 30, sizeof(char) );
		
		DataForm *df = NULL;
		
		if( pathp != NULL && argsp != NULL )
		{
			strcpy( pathp, "path=" );
			strcpy( argsp, "args=" );
			strcat( pathp, path );
			strcat( argsp, args );
			
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)hostsize, (FULONG)rsd->host  },
					{ ID_SLIB, (FULONG)0, (FULONG)NULL },
					{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
						{ ID_PATH, (FULONG)26, (FULONG)"system.library/ufile/call" },
						{ ID_PARM, (FULONG)0, MSG_GROUP_START },
							{ ID_PRMT, (FULONG) pathi, (FULONG)pathp },
							{ ID_PRMT, (FULONG) argsi, (FULONG)argsp },
							{ ID_PRMT, (FULONG) rsd->logini, (FULONG)rsd->login },
							{ ID_PRMT, (FULONG) rsd->passwdi,  (FULONG)rsd->passwd },
							{ ID_PRMT, (FULONG) rsd->idi,  (FULONG)rsd->id },
						{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_END, MSG_END, MSG_END }
			};
			df = DataFormNew( tags );
		}
		else
		{
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)hostsize, (FULONG)rsd->host  },
					{ ID_SLIB, (FULONG)0, (FULONG)NULL },
					{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
						{ ID_PATH, (FULONG)26, (FULONG)"system.library/ufile/call" },
						{ ID_PARM, (FULONG)0, MSG_GROUP_START },
							{ ID_PRMT, (FULONG) rsd->logini, (FULONG)rsd->login },
							{ ID_PRMT, (FULONG) rsd->passwdi,  (FULONG)rsd->passwd },
							{ ID_PRMT, (FULONG) rsd->idi,  (FULONG)rsd->id },
						{ MSG_GROUP_END, 0,  0 },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_END, MSG_END, MSG_END }
			};
			df = DataFormNew( tags );
		}

		DataForm *recvdf = NULL;

		recvdf = SendMessageRFSRelogin( sd, df );

		DEBUG("[RemoteCall] Response received %p\n", recvdf );
		
		if( recvdf != NULL && recvdf->df_Size > 0 )
		{
			char *d = (char *)recvdf + (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);
			
			DEBUG("[RemoteCall] RECEIVED  %10s\n", d );
			int result =  recvdf->df_Size  - (ANSWER_POSITION*COMM_MSG_HEADER_SIZE);

			BufStringAddSize( bs, d, result );
			
			DataFormDelete( recvdf );
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->{\"result\":\"reponse message is not FC message\"}" );
		}
			
		DataFormDelete( df );
		
		if( pathp != NULL ) FFree( pathp );
		if( argsp != NULL ) FFree( argsp );
	} // sd != NULL
	return bs;
}


//
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("[RemoteInfo] Info!\n");
	
	BufString *bs = BufStringNew();
	
	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}

		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}

		DEBUG2("[RemoteInfo] REMOTE PATH: %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		
		DEBUG2("[RemoteInfo] Send message to  %s\n", sd->host );
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)sizeof(FULONG) , 0 },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)25, (FULONG)"system.library/file/info" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) commi, (FULONG)comm },
						{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
						{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
						{ ID_PRMT, (FULONG)  sd->idi,  (FULONG)sd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
		
		DataForm *recvdf = NULL;
		
		DataForm *df = DataFormNew( tags );
		
		recvdf = SendMessageRFSRelogin( sd, df );

		DEBUG("[RemoteInfo] Response received\n");
		
		if( recvdf != NULL && recvdf->df_Size > 0 && recvdf->df_ID == ID_FCRE )
		{
			unsigned int i=0;
			char *d = (char *)recvdf;

			BufStringAddSize( bs, &d[ HEADER_POSITION ], recvdf->df_Size - (HEADER_POSITION) );
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->");	
		}
		
		DataFormDelete( recvdf );
		DataFormDelete( df );
		
		FFree( comm );
	}
	DEBUG("[RemoteInfo] END\n");
	
	return bs;
}

//
// return content of directory
//
	
BufString *Dir( File *s, const char *path )
{
	BufString *bs = BufStringNew();
	
	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	DEBUG("[RemoteDir] rspath %d!\n", rspath );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}

		if( path != NULL )
		{
			strcat( comm, path ); 
		}

		DEBUG2("[RemoteDir] REMOTE PATH %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		
		MsgItem tags[] = {
			{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
					{ ID_PATH, (FULONG)24, (FULONG)"system.library/file/dir" },
					{ ID_PARM, (FULONG)0, MSG_GROUP_START },
						{ ID_PRMT, (FULONG) commi, (FULONG)comm },
						{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
						{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
						{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sd->id },
					{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
			{ MSG_GROUP_END, 0,  0 },
			{ MSG_END, MSG_END, MSG_END }
		};
		
		DEBUG("[RemoteDir] Before creating DataForm  comm %s login %s  pass %s session %s passsize %d\n", comm, sd->login, sd->passwd, sd->id, sd->passwdi );

		DataForm *df = DataFormNew( tags );
		
		DataForm *recvdf = NULL;
			
		recvdf = SendMessageRFSRelogin( sd, df );

		if( recvdf != NULL && recvdf->df_ID == ID_FCRE )
		{
			char *d = (char *)recvdf;
			
			DEBUG("[RemoteDir] Bytes received %ld\n", recvdf->df_Size );

			if( recvdf->df_Size > 0 )
			{
				BufStringAddSize( bs, &d[ HEADER_POSITION ], recvdf->df_Size - (HEADER_POSITION) );
			}
			else
			{
				BufStringAdd( bs, "fail<!--separate-->{\"result\":\"received buffer is empty\"}" );
			}
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->{\"result\":\"reponse message is not FC message\"}" );
		}
		
		DataFormDelete( recvdf );
		DataFormDelete( df );
		
		FFree( comm );
	}
	DEBUG("[RemoteDir] END\n");

	return bs;
}

//
// Get metadata
//

char *InfoGet( struct File *s, const char *path, const char *key )
{
	BufString *bs = BufStringNew();
	
	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	DEBUG("[RemoteInfoGet] rspath %d!\n", rspath );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}
		
		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}
		
		DEBUG2("[RemoteInfoGet] REMOTE PATH %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		int keyparami = strlen( key );
		char *keyparam = FCalloc( keyparami+5 , sizeof(char) );
		if( keyparam != NULL )
		{
			keyparami = sprintf(  keyparam, "key=%s",  key ) + 1;
		
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
				{ ID_PATH, (FULONG)24, (FULONG)"system.library/file/infoget" },
				{ ID_PARM, (FULONG)0, MSG_GROUP_START },
				{ ID_PRMT, (FULONG) commi, (FULONG)comm },
				{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
				{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
				{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sd->id },
				{ ID_PRMT, (FULONG) keyparami,  (FULONG)keyparam },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_END, MSG_END, MSG_END }
			};
			
			DataForm *df = DataFormNew( tags );
		
			DEBUG("[RemoteInfoGet] Message will be send\n");
		
			DataForm *recvdf = NULL;
		
			recvdf = SendMessageRFSRelogin( sd, df );

			DEBUG("[RemoteInfoGet] Response received\n");
		
			if( recvdf != NULL && recvdf->df_ID == ID_FCRE )
			{
				char *d = (char *)recvdf;
			
				DEBUG("[RemoteInfoGet] Bytes received %ld\n", recvdf->df_Size );
			
				if( recvdf->df_Size > 0 )
				{
					BufStringAddSize( bs, &d[ HEADER_POSITION ], recvdf->df_Size - (HEADER_POSITION) );
				}
			}
			
			DataFormDelete( recvdf );
			DataFormDelete( df );
			FFree( keyparam );
		}
		
		FFree( comm );
	}
	DEBUG("[RemoteInfoGet] END\n");
	
	char *retstring = bs->bs_Buffer;
	bs->bs_Buffer = NULL;
	BufStringDelete( bs );
	
	return retstring;
}

//
// set metadata
//

int InfoSet( File *s, const char *path, const char *key, const char *value )
{
	BufString *bs = BufStringNew();
	
	int rspath = 0;
	if( s->f_Path != NULL )
	{
		rspath = strlen( s->f_Path );
	}
	
	DEBUG("[RemoteInfoSet] InfoGet rspath %d!\n", rspath );
	
	int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	
	if( ( comm = FCalloc( rspath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, "path=" );
		if( s->f_Path != NULL )
		{
			strcat( comm, s->f_Path );
		}
		
		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}
		
		DEBUG2("[RemoteInfoSet] REMOTE PATH %s\n", comm );
		
		SpecialData *sd = (SpecialData *) s->f_SpecialData;
		FriendCoreManager *fcm = sd->sb->fcm;
		sd->csr = fcm->fcm_CommServiceRemote;
		
		int hostsize = strlen( sd->host )+1;
		int commi = strlen( comm )+1;
		
		int keyparami = strlen( key );
		int valparami = strlen( value );
		char *keyparam = FCalloc( keyparami+5 , sizeof(char) );
		char *valparam = FCalloc( valparami+7 , sizeof(char) );
		
		if( keyparam != NULL && valparam != NULL )
		{
			keyparami = sprintf(  keyparam, "key=%s",  key ) + 1;
			valparami = sprintf(  valparam, "value=%s",  key ) + 1;
		
			MsgItem tags[] = {
				{ ID_FCRE, (FULONG)0, MSG_GROUP_START },
				{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
				{ ID_QUER, (FULONG)hostsize, (FULONG)sd->host  },
				{ ID_SLIB, (FULONG)0, (FULONG)NULL },
				{ ID_HTTP, (FULONG)0, MSG_GROUP_START },
				{ ID_PATH, (FULONG)24, (FULONG)"system.library/file/infoset" },
				{ ID_PARM, (FULONG)0, MSG_GROUP_START },
				{ ID_PRMT, (FULONG) commi, (FULONG)comm },
				{ ID_PRMT, (FULONG) sd->logini, (FULONG)sd->login },
				{ ID_PRMT, (FULONG) sd->passwdi,  (FULONG)sd->passwd },
				{ ID_PRMT, (FULONG) sd->idi,  (FULONG)sd->id },
				{ ID_PRMT, (FULONG) keyparami,  (FULONG)keyparam },
				{ ID_PRMT, (FULONG) valparami,  (FULONG)valparam },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_GROUP_END, 0,  0 },
				{ MSG_END, MSG_END, MSG_END }
			};

			DataForm *df = DataFormNew( tags );
		
			DEBUG("[RemoteInfoSet] Message will be send\n");
		
			DataForm *recvdf = NULL;
		
			recvdf = SendMessageRFSRelogin( sd, df );

			DEBUG("[RemoteInfoSet] Response received\n");
		
			if( recvdf != NULL && recvdf->df_ID == ID_FCRE )
			{
				unsigned int i=0;
				char *d = (char *)recvdf;
			
				DEBUG("[RemoteInfoSet] Bytes received %ld\n", recvdf->df_Size );
			
				if( recvdf->df_Size > 0 )
				{
					BufStringAddSize( bs, &d[ HEADER_POSITION ], recvdf->df_Size - (HEADER_POSITION) );
				}
			}
		
			DataFormDelete( recvdf );
			DataFormDelete( df );
		}
		
		if( keyparam != NULL )
		{
			FFree( keyparam );
		}
		
		if( valparam != NULL )
		{
			FFree( valparam );
		}
		
		FFree( comm );
	}
	DEBUG("[RemoteInfoSet] END\n");
	
	BufStringDelete( bs );
	
	return 0;
}


