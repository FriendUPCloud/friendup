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
//#define WS_PROTOCOL_BUFFER_SIZE 8192
#define WSREQ_ID_SIZE 128

//
//
//

typedef struct WebsocketReq
{
	struct MinNode 					node;
	char							wr_ID[ (WSREQ_ID_SIZE*2) ];
	int								wr_Chunks;		// number of chunks
	int								wr_ChunkSize;	// one chunk size
	int								wr_Total;		// total number of chunks
	int								wr_TotalSize;	// size of all chunks (total*chunksize)
	char							*wr_Message;	// encoded data from chunks (if chunksize == totalsize == 0 message is in data)
	int								wr_MessageSize;	// meessage size
	time_t							wr_CreatedTime;
	int								wr_IsBroken;	// if package is broken, flag is set to 1
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

