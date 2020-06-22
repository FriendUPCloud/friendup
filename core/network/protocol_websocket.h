/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __NETWORK_PROTOCOL_WEBSOCKET_H__
#define __NETWORK_PROTOCOL_WEBSOCKET_H__

#include <core/types.h>
#include <libxml2/libxml/tree.h>
#include <libxml2/libxml/parser.h>
#include <util/log/log.h>
#include <network/http.h>

#include <system/systembase.h>

#include <libwebsockets.h>
#include <core/thread.h>
#include <time.h>

#include <network/user_session_websocket.h>

//
//
//

Http *HandleWebDav( void *lsb, Http *req, char *data, int len );

//
//
//

int FC_Callback( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, ssize_t len );

//
//
//

int WebsocketWrite( UserSession *cl, unsigned char *msgptr, int msglen, int type );


#endif // __NETWORK_PROTOCOL_WEBDAV_H__

