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
	/*
	if( qroot->fq_First == NULL )
	{
		qroot->fq_Last = NULL;
	}
	*/
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
