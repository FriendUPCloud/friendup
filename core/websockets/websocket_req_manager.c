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
 * file contain functions related to websocket request manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 16/08/2017
 */

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "websocket_req.h"
#include "websocket_req_manager.h"
#include <util/string.h>

/**
 * Create new WebsocketReqManager structure
 *
 * @return pointer to new WebsocketReqManager when success, otherwise NULL
 */
WebsocketReqManager *WebsocketReqManagerNew( )
{
	WebsocketReqManager *wrm;
	
	if( ( wrm = FCalloc( 1, sizeof(WebsocketReqManager) ) ) != NULL )
	{
		pthread_mutex_init( &(wrm->wrm_Mutex), NULL );
	}
	
	return wrm;
}

/**
 * Delete WebsocketReqManager structure
 *
 * @param wrm to WebsocketReqManager which will be deleted
 */
void WebsocketReqManagerDelete( WebsocketReqManager *wrm )
{
	if( wrm != NULL )
	{
		pthread_mutex_lock( &(wrm->wrm_Mutex) );
		WebsocketReqDeleteAll( wrm->wrm_WRWaiting );
		WebsocketReqDeleteAll( wrm->wrm_WRQueue );
		pthread_mutex_unlock( &(wrm->wrm_Mutex) );
		
		pthread_mutex_destroy( &(wrm->wrm_Mutex) );
		
		FFree( wrm );
	}
}

/**
 * Put chunk of message to stack
 *
 * @param wrm to WebsocketReqManager
 * @param id message id
 * @param chunk chunk number
 * @param total total number of chunks
 * @param data part of message as string
 * @param datasize size of provided message
 * @return WebsocketReq new structure when success, otherwise NULL
 */
WebsocketReq *WebsocketReqManagerPutChunk( WebsocketReqManager *wrm, char *id, int chunk, int total, char *data, int datasize )
{
	if( wrm != NULL )
	{
		// we must find first if request with provided ID exist
		pthread_mutex_lock( &(wrm->wrm_Mutex) );
		WebsocketReq *req = wrm->wrm_WRWaiting;
		WebsocketReq *prevreq = NULL;
		while( req != NULL )
		{
			if( strcmp( id, req->wr_ID ) == 0 )
			{
				break;
			}
			prevreq = req;
			req = (WebsocketReq *)req->node.mln_Succ;
		}
		pthread_mutex_unlock( &(wrm->wrm_Mutex) );
		
		DEBUG("[WebsocketReqPutData] req pointer %p chunk %d/%d , datasize %d\n", req, chunk, total, datasize );
		
		// request exist, we are adding new part to it
		if( req != NULL )
		{
			WebsocketReq *oreq = WebsocketReqAddChunk( req, chunk, data, datasize );
			DEBUG("[WebsocketReqPutData] pointer to last chunk %p\n", oreq );
			if( oreq != NULL )
			{
				pthread_mutex_lock( &(wrm->wrm_Mutex) );
				// chunks were connected to one message
				// message is removed from Waiting messages
				if( oreq == wrm->wrm_WRWaiting )
				{
					wrm->wrm_WRWaiting = (WebsocketReq *)oreq->node.mln_Succ;
				}
				else
				{
					prevreq->node.mln_Succ = oreq->node.mln_Succ;
				}
				
				/*
				// IN CURRENT SOLUTION AFTER WHOLE MESSAGE IS COLLECTED IT IS PASSED AGAIN TO CALLBACK
				// add to queue, to last place
				if( wrm->wrm_WRLastInQueue != NULL )
				{
					wrm->wrm_WRLastInQueue->node.mln_Succ = (MinNode *)oreq;
				}
				else
				{
					wrm->wrm_WRQueue = oreq;
				}
				wrm->wrm_WRLastInQueue = oreq;
				*/
				pthread_mutex_unlock( &(wrm->wrm_Mutex) );
				
				DEBUG("[WebsocketReqPutData] Request message %s  \n\n%d\n", req->wr_Message, req->wr_MessageSize );
				
				return oreq;
			}
		}
		else // request was not send to FC before, we must create it
		{
			WebsocketReq *nreq = WebsocketReqNew( id, chunk, total, data, datasize );
			
			pthread_mutex_lock( &(wrm->wrm_Mutex) );
			
			// We must remove old WebsocketReqests
			time_t currTime = time( NULL );
			
			WebsocketReq *newlist = NULL;
			WebsocketReq *newlast = NULL;
			
			WebsocketReq *prev = wrm->wrm_WRWaiting;
			
			while( prev != NULL )
			{
				WebsocketReq *next = (WebsocketReq *) prev->node.mln_Succ;
				
				// 300 = 5 minutes
				if( (currTime - prev->wr_CreatedTime) > 300 )
				{
					WebsocketReqDelete( prev );
				}
				else
				{
					if( newlist == NULL )
					{
						newlist = prev;
						newlast = newlist;
					}
					else
					{
						newlast->node.mln_Succ = (MinNode *)prev;
						newlast = prev;
					}
				}
				prev = next;
			}
			
			wrm->wrm_WRWaiting = newlist;
			
			nreq->node.mln_Succ = (MinNode *)wrm->wrm_WRWaiting;
			wrm->wrm_WRWaiting = nreq;
			pthread_mutex_unlock( &(wrm->wrm_Mutex) );
		}
	}
	return NULL;
}

/**
 * Put message to stack
 *
 * @param wrm to WebsocketReqManager
 * @param data part of message as string
 * @param datasize size of provided message
 * @return WebsocketReq new structure when success, otherwise NULL
 */
WebsocketReq *WebsocketReqManagerPutRawData( WebsocketReqManager *wrm, char *data, int datasize )
{
	if( wrm != NULL )
	{
		WebsocketReq *oreq = WebsocketReqRawNew( data, datasize );
		DEBUG("[WebsocketReqPutRawData] pointer to last chunk %p\n", oreq );
		if( oreq != NULL )
		{
			pthread_mutex_lock( &(wrm->wrm_Mutex) );
			
			// add to queue, to last place
			if( wrm->wrm_WRLastInQueue != NULL )
			{
				wrm->wrm_WRLastInQueue->node.mln_Succ = (MinNode *)oreq;
			}
			else
			{
				wrm->wrm_WRQueue = oreq;
			}
			wrm->wrm_WRLastInQueue = oreq;
			
			pthread_mutex_unlock( &(wrm->wrm_Mutex) );
		}
		return oreq;
	}
	return NULL;
}

/**
 * Get message from queue
 *
 * @param wrm to WebsocketReqManager
 */
WebsocketReq *WebsocketReqManagerGetFromQueue( WebsocketReqManager *wrm )
{
	WebsocketReq *req = NULL;
	if( wrm != NULL )
	{
		pthread_mutex_lock( &(wrm->wrm_Mutex) );
		
		req = wrm->wrm_WRQueue;
		if( req != NULL )
		{
			if( req->node.mln_Succ == NULL )
			{
				wrm->wrm_WRQueue = NULL;
				wrm->wrm_WRLastInQueue = NULL;
			}
			else
			{
				wrm->wrm_WRQueue = (WebsocketReq *)req->node.mln_Succ;
			}
		}
		
		pthread_mutex_unlock( &(wrm->wrm_Mutex) );
	}
	return req;
}
