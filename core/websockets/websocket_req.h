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
 *  WebSocket request definition
 *
 * file contain all functitons related to websocket requests
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 16/08/2017
 */

#ifndef __WEBSOCKETS_WEBSOCKET_REQ_H__
#define __WEBSOCKETS_WEBSOCKET_REQ_H__

#include <core/types.h>
#include <core/nodes.h>
#include <libwebsockets.h>

//#define WS_PROTOCOL_BUFFER_SIZE 0xffff
#define WS_PROTOCOL_BUFFER_SIZE 65535
//#define WS_PROTOCOL_BUFFER_SIZE 10048
//#define WS_PROTOCOL_BUFFER_SIZE 4096
#define WSREQ_ID_SIZE 128

//
//
//

typedef struct WebsocketReq
{
	struct MinNode 					node;
	char							wr_ID[ WSREQ_ID_SIZE ];
	int								wr_Chunks;		// number of chunks
	int								wr_ChunkSize;	// one chunk size
	int								wr_Total;		// total number of chunks
	int								wr_TotalSize;	// size of all chunks (total*chunksize)
	char							*wr_Message;	// encoded data from chunks (if chunksize == totalsize == 0 message is in data)
	int								wr_MessageSize;	// meessage size
	time_t							wr_CreatedTime;
}WebsocketReq;

//
//
//

WebsocketReq *WebsocketReqNew( char *id, int chunk, int total, char *data, int datasize );

//
//
//

WebsocketReq *WebsocketReqRawNew( char *data, int datasize );

//
//
//

void WebsocketReqDelete( WebsocketReq *wr );

//
//
//

void WebsocketReqDeleteAll( WebsocketReq *wr );

//
//
//

WebsocketReq *WebsocketReqAddChunk( WebsocketReq *req, int chunk, char *data, int datasize );

#endif // __WEBSOCKETS_WEBSOCKET_REQ_H__

