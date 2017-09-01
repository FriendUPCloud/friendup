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

