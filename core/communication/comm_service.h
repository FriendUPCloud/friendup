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
 *  Communication Service structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

#ifndef __COMMUNICATION_COMM_SERVICE_H__
#define __COMMUNICATION_COMM_SERVICE_H__

#include <core/types.h>
#include <core/thread.h>
#include <stdio.h>
#include <core/nodes.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/ioctl.h>
#include <network/socket.h>
#include <mqueue.h>
#include <errno.h>
#include <sys/types.h>
#include "comm_msg.h"
#include <db/sqllib.h>
#include <core/thread.h>
#include <security/connection_info.h>

//
// Queue data
//

#define PMODE 0655
#define QUEUE_NAME  "/FCComQueue"
#define MAX_SIZE    1024
#define MSG_STOP    "exit"

//
// Service Type
//

enum {	//cfcc_Type
	SERVER_CONNECTION_INCOMING = 0,
	SERVER_CONNECTION_OUTGOING
};

enum {
	SERVICE_STATUS_STOPPED = 0,
	SERVICE_STATUS_CONNECTED,
	SERVICE_STATUS_DISCONNECTED,
};

enum { //cfcc_ServerType
	SERVER_TYPE_OTHER = 0,
	SERVER_TYPE_NODE,
	SERVER_TYPE_NODE_MASTER,
	SERVER_TYPE_FRIEND_MASTER
};

#define CONNECTION_ACCESS_NONE	0
#define CONNECTION_ACCESS_READ	2
#define CONNECTION_ACCESS_WRITE	4

// Connection status

#define CONNECTION_STATUS_NONE			0
#define CONNECTION_STATUS_CONNECTING	1
#define CONNECTION_STATUS_CONNECTED		2
#define CONNECTION_STATUS_DISCONNECTED	3
#define CONNECTION_STATUS_REJECTED		4
#define CONNECTION_STATUS_BLOCKED		5

enum {
	SERVER_ERROR_NO = 0,
	SERVER_ERROR_CONNOTASSIGNED		// connection not assigned
};

#define SERVER_SPLIT_SIGN	","
#define SERVER_NAME_SPLIT_SIGN	'@'
#define SERVER_PORT_SPLIT_SIGN ':'

//
// Message structure
//

typedef struct CommAppMsg
{
	int			cam_Quit;
	int 		cam_State;		// status of service
}CommAppMsg;

//
// communcation request
//

typedef struct CommRequest
{
	DataForm						*cr_Df;
	BufString						*cr_Bs;
	time_t 							cr_Time;
	FULONG							cr_RequestID;
	MinNode 						node;
}CommRequest;

//
// user access
//

typedef struct UserAccess
{
	MinNode							ua_Node;
}UserAccess;

//
// group access
//

typedef struct UserGroupAccess
{
	MinNode							uga_Node;
}UserGroupAccess;

//
// Communication 
//

typedef struct FConnection
{
	MinNode						node;
	FULONG						fc_ID;
	char 						*fc_FCID;			// communication service id
	char						*fc_DestinationFCID;
	int							fc_Type;			//  if Im the client SERVICE_TYPE_CLIENT is set
	int							fc_ServerType;	// server type
	char 						*fc_Name;		// SERVER NAMEe (ID)
	char 						*fc_Address;	// internet address
	FBOOL 						fc_ConnectionApproved;		// if connection is approved by  admin, flag is set to TRUE
	char						*fc_SSLInfo;
	struct tm					fc_DateCreated;
	char						*fc_PEM;
	FULONG						fc_ClusterID;		// 0 - normal connection, 1 - cluster master, > 1 - cluster node
	int							fc_Status;			// connection status
	FBOOL						fc_PingInProgress;	// ping in progress
	
	Socket 						*fc_Socket;			// socket to new connection
	int 						fc_ConnectionsNumber;
	int							fc_Port;			// ip port
	
	// access
	UserAccess					*fc_UserAccess;
	UserGroupAccess				*fc_UserGroupAccess;

	uint64_t					fc_PINGTime;
	char						*fc_GEOTimeZone; // Europe, North America, etc.
	char						fc_GEOCountryCode[ 16 ]; // Country
	char						*fc_GEOCity;
	
	pthread_mutex_t				fc_Mutex;
	FThread						*fc_Thread;
	void						*fc_Data;				// pointer to user data
	void 						*fc_Service;			// pointer to communication service
	
	int							fc_ReadCommPipe, fc_WriteCommPipe;
}FConnection;

static FULONG FConnectionDesc[] = {
    SQLT_TABNAME, (FULONG)"FConnection",
    SQLT_STRUCTSIZE, sizeof( struct FConnection ),
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct FConnection, fc_ID ),
	SQLT_STR,     (FULONG)"FCID",          offsetof( struct FConnection, fc_FCID ),
	SQLT_STR,     (FULONG)"DestinationFCID",    offsetof( struct FConnection, fc_DestinationFCID ),
	SQLT_INT,     (FULONG)"Type",        offsetof( struct FConnection, fc_Type ),
	SQLT_INT,     (FULONG)"ServerType",        offsetof( struct FConnection, fc_ServerType ),
	SQLT_STR,     (FULONG)"Name", offsetof( struct FConnection, fc_Name ),
	SQLT_STR,     (FULONG)"Address", offsetof( struct FConnection, fc_Address ),
	SQLT_INT,     (FULONG)"Approved",        offsetof( struct FConnection, fc_ConnectionApproved ),
	SQLT_STR,     (FULONG)"SSLInfo", offsetof( struct FConnection, fc_SSLInfo ),
	SQLT_DATETIME,(FULONG)"DateCreated", offsetof( struct FConnection, fc_DateCreated ),
	SQLT_STR,     (FULONG)"PEM", offsetof( struct FConnection, fc_PEM ),
	SQLT_INT,     (FULONG)"ClusterID", offsetof( struct FConnection, fc_ClusterID ),
	SQLT_INT,     (FULONG)"Status", offsetof( struct FConnection, fc_Status ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct FConnection, node ),
	SQLT_END
};

/*
--
-- Table structure for table `FConnection`
--

CREATE TABLE IF NOT EXISTS `FConnection` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FCID` varchar(255) NOT NULL,
  `DestinationFCID` varchar(128),
  `Type` bigint(3) NOT NULL,
  `ServerType` bigint(3) NOT NULL,
  `Name` varchar(1024) NOT NULL,
  `Address` varchar(64) NOT NULL,
  `Approved` bigint(3) NOT NULL,
  `SSLInfo` varchar(255),
  `DateCreated` datetime NOT NULL,
  `PEM` text,
  `ClusterID` smallint(2),
  `Status` smallint(2),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
*/

//
// create / delete connection
//

FConnection *FConnectionNew( const char *address, const char *name, int type, void *service );

//
//
//

void FConnectionDelete( FConnection *con );

//
// Communicaton Service
//

typedef struct CommService
{
	Socket							*s_Socket;			// soclet
	int								s_Epollfd;			// EPOLL - file descriptor
	
	FThread							*s_Thread;			// service thread
	
	FILE 							*s_Pipe;			// sending message pipe
	FBYTE							*s_Buffer;
	char 							*s_Name;				// service name
	char 							*s_Address;			// network address
	int 							s_Type;				// type of service, see enum on top of file
	
	int 							s_sendPipe[ 2 ];
	int 							s_recvPipe[ 2 ];
	int 							s_ReadCommPipe, s_WriteCommPipe;
	
	CommAppMsg						s_Cam;				//
	void 							*s_SB;
	
	int								s_MaxEvents;
	int 							s_BufferSize;
	int								s_port;				// Friend Communication Port
	int								s_secured;		// ssl secured
	
	int 							s_IncomingInc;		// incomming connections incremental  value
	
	FConnection						*s_Connections;							///< FCConnections incoming
	int 							s_NumberConnections;
	pthread_mutex_t					s_Mutex;
	
	CommRequest						*s_Requests;
	pthread_cond_t 					s_DataReceivedCond;
	FBOOL							s_Started;			//if thread is started
	FBOOL							s_OutgoingConnectionSet; // if outgoing connections are not set, FC cannot quit
}CommService;

//
// create new CommService
//

CommService *CommServiceNew( int port, int secured, void *sb, int maxev, int bufsiz );

//
// delete CommService
//

void CommServiceDelete( CommService *s );

//
// start CommService
//

int CommServiceStart( CommService *s );

//
// stop CommService
//

int CommServiceStop( CommService *s );

//
// send message
//

DataForm *CommServiceSendMsg( CommService *s, DataForm *df );

//
// send message directly to connection
//

DataForm *CommServiceSendMsgDirect(  FConnection *con, DataForm *df );

//
// Add new connection
//

FConnection *CommServiceAddConnection( CommService *s, Socket *socket, char *name, char *addr, char *recvid, int type, int cluster );

//
// remove socket or whole connection
//

int CommServiceDelConnection( CommService* s, FConnection *loccon, Socket *sock );

//
//
//

int CommServiceRegisterEvent( FConnection *con, Socket *socket );

//
//
//

int CommServiceUnRegisterEvent( FConnection *con, Socket *socket );

//
//
//

FConnection *ConnectToServer( CommService *s, char *conname );

//
//
//

DataForm *ParseMessage( CommService *serv, Socket *socket, FBYTE *data, int *len,  FBOOL *isStream );

//
//
//

int CommServiceThreadServer( FThread *ptr );

//
//
//

int CommServiceThreadServerSelect( FThread *ptr );

//
//
//

BufString *SendMessageAndWait( FConnection *con, DataForm *df );

//
//
//

DataForm *ParseAndExecuteRequest( void *sb, FConnection *con, DataForm *df, FULONG reqid );

//
// PING service
//

void CommServicePING( CommService* s );

//
// CommService thread
//

int CommServiceThreadServer( FThread *this );

int CommServiceThreadClient( FThread *this );

#endif // __COMMUNICATION_COMM_SERVICE_H__
