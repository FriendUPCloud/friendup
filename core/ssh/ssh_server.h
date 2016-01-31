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

#ifndef __SSH_SSH_SERVER_H__
#define __SSH_SSH_SERVER_H__

#include <stdio.h>
#include <stdlib.h>
#include <core/types.h>
#include <core/thread.h>
#include <network/socket.h>
//#include <network/sshsocket.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>

#include <libssh/libssh.h>
#include <system/systembase.h>
#include <user/userlibrary.h>

typedef struct SSHServer
{
	FThread 		*sshs_Thread;
	char				*sshs_FriendHome;
	char 			*sshs_RSAKeyHome;
	char				*sshs_DSAKeyHome;

	BOOL 			sshs_Quit;
	//SSHSocket		*sshs_Socket;		// socket
	//int 			sshs_Epollfd;		// EPOLL - file descriptor
}SSHServer;

//
// SSH session for user
//

typedef struct SSHSession		// single session structure
{
	int					sshs_Authenticated;		// is user authenticated
	int 					sshs_Tries;				// check user login times
	int 					sshs_Error;				// error
	ssh_channel 		sshs_Chan;				// session channel
	ssh_session 		sshs_Session;			// session
	User 				*sshs_Usr;				// logged user
	char 				*sshs_DispText;			// display text for user
	char 				*sshs_Path;				// user path
	BOOL 				sshs_Quit;				// session quit
}SSHSession;


#define SSH_SERVER_PORT	"6505"

//
//
//

SSHServer *SSHServerNew();

void SSHServerDelete( SSHServer *ts );

int SSHThread( void *data );

#endif //__SSH_SSH_SERVER_H__