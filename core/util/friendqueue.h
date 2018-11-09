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

typedef struct FQEntry
{
	MinNode			node;
	unsigned char	*fq_Data;	// 
	int				fq_Size;	// this should be removed
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
#define FQDeInitFree( qroot ) { FQEntry *q = (qroot)->fq_First; while( q != NULL ){ void *r = q; FFree( q->fq_Data ); q = (FQEntry *)q->node.mln_Succ; FFree( r ); } }

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
#define FQPushFIFO( qroot, q ) if( (qroot)->fq_First == NULL ){ (qroot)->fq_First = q; (qroot)->fq_Last = q; }else{ (qroot)->fq_Last->node.mln_Succ = (MinNode *)q; (qroot)->fq_Last = q; } printf("Added: %d\n", q->fq_Size );

FQEntry *FQPop( FQueue *qroot );

FQEntry *FQGet( FQueue *qroot );

FQEntry *FQDeleteLast( FQueue *qroot );

FBOOL FQIsEmpty( FQueue *qroot );

#endif // __UTIL_FRIENDQUEUE_H__
