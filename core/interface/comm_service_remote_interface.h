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

static inline void CommServiceRemoteInterfaceInit( CommServiceRemoteInterface *si )
{
	si->CommServiceRemoteNew = CommServiceRemoteNew;
	si->CommServiceRemoteDelete = CommServiceRemoteDelete;
	si->CommServiceRemoteStart = CommServiceRemoteStart;
	si->CommServiceRemoteStop = CommServiceRemoteStop;
	si->CommServiceRemoteSendMsg = CommServiceRemoteSendMsg;
}

#endif
