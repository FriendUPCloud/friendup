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
 * file contain function definitions related to websocket request manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 16/08/2017
 */

#ifndef __WEBSOCKETS_WEBSOCKET_REQ_MANAGER_H__
#define __WEBSOCKETS_WEBSOCKET_REQ_MANAGER_H__

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "websocket_req.h"

//
//
//

typedef struct WebsocketReqManager
{
	WebsocketReq	*wrm_WRWaiting;	//chunked requests, they must be completed before they will go to queue
	WebsocketReq	*wrm_WRQueue;		//FIFO queue
	WebsocketReq	*wrm_WRLastInQueue;	// last entry in queue
	int				wrm_WSRNumber;
	pthread_mutex_t	wrm_Mutex;
}WebsocketReqManager;

//
//
//

WebsocketReqManager *WebsocketReqManagerNew( );

//
//
//

void WebsocketReqManagerDelete( WebsocketReqManager *cm );

//
//
//

WebsocketReq *WebsocketReqManagerPutChunk( WebsocketReqManager *cm, char *id, int chunk, int total, char *data, int datasize );

//
//
//

WebsocketReq *WebsocketReqManagerPutRawData( WebsocketReqManager *cm, char *data, int datasize );

//
//
//

WebsocketReq *WebsocketReqManagerGetFromQueue( WebsocketReqManager *cm );

#endif //__WEBSOCKETS_WEBSOCKET_REQ_MANAGER_H__

