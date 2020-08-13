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
 *  SSH server definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __SSH_SSH_SERVER_H__
#define __SSH_SSH_SERVER_H__

#include <stdio.h>
#include <stdlib.h>
#include <core/types.h>
#include <core/thread.h>
#include <network/socket.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>


#ifdef ENABLE_SSH
#include <libssh/libssh.h>
#endif
#include <system/systembase.h>
#include <system/auth/authmodule.h>

typedef struct SSHServer
{
	FThread 			*sshs_Thread;
	char				*sshs_FriendHome;
	char 				*sshs_RSAKeyHome;
	char				*sshs_DSAKeyHome;

	FBOOL 				sshs_Quit;
	void				*sshs_SB;
	//SSHSocket		*sshs_Socket;		// socket
	//int 			sshs_Epollfd;		// EPOLL - file descriptor
}SSHServer;

//
// SSH session for user
//

typedef struct SSHSession		// single session structure
{
	int						sshs_Authenticated;		// is user authenticated
	int 					sshs_Tries;				// check user login times
	int 					sshs_Error;				// error
#ifdef ENABLE_SSH
	ssh_channel 			sshs_Chan;				// session channel
	ssh_session 			sshs_Session;			// session
#endif
	User 					*sshs_Usr;				// logged user
	char 					*sshs_DispText;			// display text for user
	char 					*sshs_Path;				// user path
	FBOOL 					sshs_Quit;				// session quit
	void					*sshs_SB;			//SystemBase
}SSHSession;


#define SSH_SERVER_PORT	"6505"

//
//
//

SSHServer *SSHServerNew( void *sb, char *rsaKey, char *dsaKey );

//
//
//

void SSHServerDelete( SSHServer *ts );

//
//
//

int SSHThread( FThread *ptr );

#endif //__SSH_SSH_SERVER_H__
