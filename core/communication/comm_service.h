/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              * 
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
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
#include <mysql/mysqllibrary.h>
#include <core/thread.h>

//
// Queue data
//

#define PMODE 0655
#define QUEUE_NAME  "/FCComQueue"
#define MAX_SIZE    1024
#define MSG_STOP    "exit"


//#define FRIEND_COMMUNICATION_PORT	6764

//
// Service Type
//
/*
enum {
	SERVICE_TYPE_SERVER = 0,
	SERVICE_TYPE_CLIENT
};
*/
enum {
	SERVICE_CONNECTION_INCOMING = 0,
	SERVICE_CONNECTION_OUTGOING
};

enum {
	SERVICE_STATUS_STOPPED = 0,
	SERVICE_STATUS_CONNECTED,
	SERVICE_STATUS_DISCONNECTED,
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
// Communication 
//

typedef struct CommFCConnection
{
	FUQUAD					ID;
	FBYTE 						cffc_ID[ FRIEND_CORE_MANAGER_ID_SIZE ];			// communication service id
	int							cffc_Type;			//  if Im the client SERVICE_TYPE_CLIENT is set
	
	Socket 						*cfcc_Socket;			// socket to new connection
	int 							cfcc_ConnectionsNumber;
	
	char 						*cfcc_Name;		// SERVER NAMEe (ID)
	char 						*cfcc_Address;	// internet address
	int							cfcc_Port;			// ip port
	
	FBOOL 					cfcc_ConnectionApproved;		// if connection is approved by  admin, flag is set to TRUE
	int							cfcc_Status;								// connection status
	pthread_mutex_t		cfcc_Mutex;
	
	FThread					*cfcc_Thread;
	void							*cfcc_Data;
	void 							*cfcc_Service;			// pointer to communication service
	
	int							cfcc_ReadCommPipe, cfcc_WriteCommPipe;
	
	MinNode					node;
}CommFCConnection;

static FULONG CommFCConnectionDesc[] = { 
    SQLT_TABNAME, (FULONG)"FCommFCConnection",       SQLT_STRUCTSIZE, sizeof( struct CommFCConnection ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct CommFCConnection, ID ),
	SQLT_STR,   (FULONG)"FCID",          offsetof( struct CommFCConnection, cffc_ID ), 
	SQLT_INT,     (FULONG)"Type",        offsetof( struct CommFCConnection, cffc_Type ),
	SQLT_STR,     (FULONG)"Name", offsetof( struct CommFCConnection, cfcc_Name ),
	SQLT_STR,     (FULONG)"Address", offsetof( struct CommFCConnection, cfcc_Address ),
	SQLT_INT,     (FULONG)"Approved",        offsetof( struct CommFCConnection, cfcc_ConnectionApproved ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct CommFCConnection, node ),
	SQLT_END 
};

/*
--
-- Table structure for table `FCommFCConnection`
--

CREATE TABLE IF NOT EXISTS `FCommFCConnection` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `FCID` varchar(255) NOT NULL,
  `Type` bigint(3) NOT NULL,
  `Name` varchar(1024) NOT NULL,
  `Address` varchar(64) NOT NULL,
  `Approved` bigint(3) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
*/

//
// create / delete connection
//

CommFCConnection *CommFCConnectionNew( const char *address, const char *name, int type, void *service );

//
//
//

void CommFCConnectionDelete( CommFCConnection *con );

//
// Communicaton Service
//

typedef struct CommService
{
	Socket									*s_Socket;			// soclet
	int										s_Epollfd;			// EPOLL - file descriptor
	
	FThread								*s_Thread;			// service thread
	
	FILE 									*s_Pipe;			// sending message pipe
	FBYTE									*s_Buffer;
	char 									*s_Name;				// service name
	char 									*s_Address;			// network address
	int 										s_Type;				// type of service, see enum on top of file
	
	int 										s_sendPipe[ 2 ];
	int 										s_recvPipe[ 2 ];
	int 										s_ReadCommPipe, s_WriteCommPipe;
	
	CommAppMsg						s_Cam;				//
	void 										*s_SB;
	
	int										s_MaxEvents;
	int 										s_BufferSize;
	int										s_port;				// Friend Communication Port
	int										s_secured;		// ssl secured
	
	int 										s_IncomingInc;		// incomming connections incremental  value
	
	CommFCConnection				*s_Connections;							///< FCConnections incoming
	int 										s_NumberConnections;
	pthread_mutex_t					s_Mutex;
	
	CommRequest						*s_Requests;
	pthread_cond_t 					s_DataReceivedCond;
	FBOOL									s_Started;			//if thread is started
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

DataForm *CommServiceSendMsgDirect(  CommFCConnection *con, DataForm *df );

//
// Add new connection
//

CommFCConnection *CommServiceAddConnection( CommService *s, Socket *socket, char *addr, char *id, int type );
//CommFCConnection *CommServiceAddConnection( void *sb, Socket *socket, char *addr, char *id, int type );

//
// remove socket or whole connection
//

int CommServiceDelConnection( CommService* s, CommFCConnection *loccon, Socket *sock );

//
//
//

int CommServiceRegisterEvent( CommFCConnection *con, Socket *socket );

//
//
//

int CommServiceUnRegisterEvent( CommFCConnection *con, Socket *socket );

//
//
//

CommFCConnection *ConnectToServer( CommService *s, char *conname );

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

BufString *SendMessageAndWait( CommFCConnection *con, DataForm *df );

//
//
//

int ParseAndExecuteRequest( void *sb, CommFCConnection *con, DataForm *df );

//
// CommService thread
//

int CommServiceThreadServer( FThread *this );

int CommServiceThreadClient( FThread *this );

#endif // __COMMUNICATION_COMM_SERVICE_H__
