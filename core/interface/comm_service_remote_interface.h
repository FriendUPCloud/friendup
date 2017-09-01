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
 *  Communication Service Remote Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 21/02/2017
 */
#ifndef __INTERFACE_COMM_SERVICE_REMOTE_INTERFACE_H__
#define __INTERFACE_COMM_SERVICE_REMOTE_INTERFACE_H__

#include <communication/comm_service_remote.h>

typedef struct CommServiceRemoteInterface
{
	CommServiceRemote				*(*CommServiceRemoteNew)( int port, int secured, void *sb, int maxev );
	void							(*CommServiceRemoteDelete)( CommServiceRemote *s );
	int								(*CommServiceRemoteStart)( CommServiceRemote *s );
	int								(*CommServiceRemoteStop)( CommServiceRemote *s );
	DataForm						*(*CommServiceRemoteSendMsg)( CommServiceRemote *s, char *address, int port );
}CommServiceRemoteInterface;

//
// init function
//

inline void CommServiceRemoteInterfaceInit( CommServiceRemoteInterface *si )
{
	si->CommServiceRemoteNew = CommServiceRemoteNew;
	si->CommServiceRemoteDelete = CommServiceRemoteDelete;
	si->CommServiceRemoteStart = CommServiceRemoteStart;
	si->CommServiceRemoteStop = CommServiceRemoteStop;
	si->CommServiceRemoteSendMsg = CommServiceRemoteSendMsg;
}

#endif
