/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __NETWORK_PROTOCOL_WEBDAV_H__
#define __NETWORK_PROTOCOL_WEBDAV_H__

#include <core/types.h>
#include <libxml2/libxml/tree.h>
#include <libxml2/libxml/parser.h>
#include <util/log/log.h>
#include <network/http.h>

#include <system/systembase.h>

//
//
//

Http *HandleWebDav( void *lsb, Http *req, char *data, int len );

#endif // __NETWORK_PROTOCOL_WEBDAV_H__
