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
 * file contain body related to FriendQueue
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23/07/2018
 */
#include "friendqueue.h"

/**
 * Pop data from FQueue structure
 *
 * @param qroot pointer to main FQueue structure
 * @return pointer to data from from FriendQueue, pointer will be removed from queue
 */
FQEntry *FQPop( FQueue *qroot )
{ 
	if( qroot->fq_First == NULL )
	{
		return NULL;
	}
	FQEntry *ret = qroot->fq_First;

	qroot->fq_First = (FQEntry *) qroot->fq_First->node.mln_Succ;
	if( qroot->fq_First == NULL )
	{
		qroot->fq_Last = NULL;
	}
	
	return ret;
};

/**
 * Get data from FQueue structure
 *
 * @param qroot pointer to main FQueue structure
 * @return pointer to data from from FriendQueue
 */
FQEntry *FQGet( FQueue *qroot )
{
	if( qroot->fq_First == NULL )
	{
		return NULL;
	}
	FQEntry *ret = qroot->fq_First;

	return ret;
}

/**
 * Remove last entry from FQueue structure
 *
 * @param qroot pointer to main FQueue structure
 * @return pointer to data which was removed from queue
 */
FQEntry *FQRemoveLast( FQueue *qroot )
{
	if( qroot->fq_First == NULL )
	{
		return NULL;
	}

	FQEntry *ret = qroot->fq_First;
	qroot->fq_First = (FQEntry *) qroot->fq_First->node.mln_Succ;

	return ret;
}

/**
 * Check if FQueue is empty
 *
 * @param qroot pointer to main FQueue structure
 * @return TRUE when queue is empty, otherwise FALSE
 */
FBOOL FQIsEmpty( FQueue *qroot )
{
	if( qroot->fq_First == NULL )
	{
		return TRUE;
	}
	return FALSE;
}
