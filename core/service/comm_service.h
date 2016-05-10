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

#ifndef __SERVICE_COMM_SERVICE_H__
#define __SERVICE_COMM_SERVICE_H__

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
//#include <sys/epoll.h>
#include <errno.h>
#include <sys/types.h>
#include "comm_msg.h"

//
// Queue data
//

#define PMODE 0655
#define QUEUE_NAME  "/FCComQueue"
#define MAX_SIZE    1024
#define MSG_STOP    "exit"


#define FRIEND_COMMUNICATION_PORT	6100

//
// Service Type
//

enum {
	SERVICE_TYPE_SERVER = 0,
	SERVICE_TYPE_CLIENT
};

#define SERVER_SPLIT_SIGN	","
#define SERVER_NAME_SPLIT_SING	'@'

//
// Message structure
//

typedef struct CommAppMsg
{
	int			cam_Quit;
	int 		cam_State;		// status of service
}CommAppMsg;

//
// Communication 
//

typedef struct CommFCConnection
{
	MinNode node;
	
	BYTE 				cffc_ID[ 32 ];			// communication service id
	
	QUAD 				cfcc_Id;
	Socket 			*cfcc_Socket;			// socket to new connection
	
	char 				*cfcc_Name;
	char 				*cfcc_Address;
}CommFCConnection;

CommFCConnection *CommFCConnectionNew( const char *add, const char *name );

void CommFCConnectionDelete( CommFCConnection *con );

//
// Communicaton Service
//

typedef struct CommService
{
	Socket						*s_Socket;			// soclet
	int 								s_Epollfd;			// EPOLL - file descriptor
	
	FThread 						*s_Thread;			// service thread
	
	FILE 							*s_Pipe;			// sending message pipe
	BYTE							*s_Buffer;
	char 							*s_Name;				// service name
	char 							*s_Address;			// network address
	int 								s_Type;				// type of service, see enum on top of file
	
	int 								s_sendPipe[ 2 ];
	int 								s_recvPipe[ 2 ];
	int 								s_ReadCommPipe, s_WriteCommPipe;
	
	CommFCConnection 	*s_FCConnections;	// FCConnections
	CommAppMsg				s_Cam;				//
	void 								*s_FCM;				// FriendCoreManager
	
	int								s_MaxEvents;
	int 								s_BufferSize;
}CommService;

//
// create new CommService
//

CommService *CommServiceNew( int enumType, void *fcm, int maxev, int bufsiz );

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
// CommService thread
//

int CommServiceThreadServer( FThread *this );

int CommServiceThreadClient( FThread *this );

#endif // __SERVICE_COMM_SERVICE_H__
