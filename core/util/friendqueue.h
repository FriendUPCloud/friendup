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
 *  FriendQueue
 *
 * file contain definitions related to FriendQueue
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23/07/2018
 */

#ifndef __UTIL_FRIENDQUEUE_H__
#define __UTIL_FRIENDQUEUE_H__

#include <core/nodes.h>
#include <util/time.h>

typedef struct FQEntry
{
	MinNode			node;
	unsigned char	*fq_Data;		// 
	char			*fq_RequestID;	// request ID
	int				fq_Size;		// size of message
	int				fq_Priority;	// message priority
	time_t			fq_Timestamp;	// message timestamp
#ifdef __PERF_MEAS
	double			fq_stime;		// time used to check how much time take to sent it
#endif
}FQEntry;

typedef struct FQueue
{
	FQEntry			*fq_First;
	FQEntry			*fq_Last;
}FQueue;

/**
 * Init FriendQueue
 *
 * @param qroot pointer to main FQueue structure
 */

#define FQInit( qroot ) (qroot)->fq_First = NULL; (qroot)->fq_Last = NULL

/**
 * DeInit FriendQueue
 *
 * @param qroot pointer to main FQueue structure
 */
#define FQDeInit( qroot ) (qroot)->fq_First = NULL

/**
 * DeInit FriendQueue and release resources
 *
 * @param qroot pointer to main FQueue structure
 */
#define FQDeInitFree( qroot ) { FQEntry *q = (qroot)->fq_First; while( q != NULL ){ void *r = q; FFree( q->fq_Data ); q = (FQEntry *)q->node.mln_Succ; FFree( r ); } (qroot)->fq_First = NULL; (qroot)->fq_Last = NULL; }

/**
 * Push data into FQueue structure in FILO mode
 *
 * @param qroot pointer to main FQueue structure
 * @param q poitner to data which will be placed in FriendQueue
 */
#define FQPushFILO( qroot, q ) q->mln_Succ = (MinNode *)(qroot)->fq_First; (qroot)->fq_First = q;

/**
 * Push data into FQueue structure in FIFO mode
 *
 * @param qroot pointer to main FQueue structure
 * @param q poitner to data which will be placed in FriendQueue
 */

#ifdef __PERF_MEAS
#define FQPushFIFO( qroot, q ) if( (qroot)->fq_First == NULL ){ (qroot)->fq_First = q; (qroot)->fq_Last = q; }else{ (qroot)->fq_Last->node.mln_Succ = (MinNode *)q; (qroot)->fq_Last = q; q->fq_stime = GetCurrentTimestampD(); } 
#else
#define FQPushFIFO( qroot, q ) if( (qroot)->fq_First == NULL ){ (qroot)->fq_First = q; (qroot)->fq_Last = q; }else{ (qroot)->fq_Last->node.mln_Succ = (MinNode *)q; (qroot)->fq_Last = q; } 
#endif

#define FQPushWithPriority( qroot, q ){ \
if( (qroot)->fq_First == NULL ){ (qroot)->fq_First = q; (qroot)->fq_Last = q; } \
else if( ((FQEntry *)(qroot)->fq_First)->fq_Priority > q->fq_Priority ){ q->node.mln_Succ = (MinNode *)(qroot)->fq_First; (qroot)->fq_First = q; } \
else{ FQEntry *fe = (qroot)->fq_First; while( fe != NULL ){ FQEntry *nfe = (FQEntry *)fe->node.mln_Succ; if( nfe == NULL ){ fe->node.mln_Succ = (MinNode *)q; (qroot)->fq_Last = q; break; } if( nfe->fq_Priority >= q->fq_Priority ){ fe->node.mln_Succ = (MinNode *)q; break; } fe = (FQEntry *)fe->node.mln_Succ; } } \
}

FQEntry *FQPop( FQueue *qroot );

FQEntry *FQGet( FQueue *qroot );

FQEntry *FQDeleteLast( FQueue *qroot );

FBOOL FQIsEmpty( FQueue *qroot );

#endif // __UTIL_FRIENDQUEUE_H__
