/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/


#ifndef __NETWORK_PROTOCOLHTTP_H__
#define __NETWORK_PROTOCOLHTTP_H__

#include <network/socket.h>
#include <util/buffered_string.h>
#include <network/http.h>

//
//
//

Http *ProtocolHttp( Socket *sock, char* data, FQUAD size );

#endif
