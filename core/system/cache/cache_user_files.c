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
 * Cache User Files body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include "cache_user_files.h"

/**
 * create new CacheUserFiles
 * 
 * @param usr pointer to User structure
 * @return pointer to new CacheUserFiles when success, otherwise NULL
 */
CacheUserFiles *CacheUserFilesNew( void *usr )
{
	CacheUserFiles *cuf = FCalloc( 1, sizeof(CacheUserFiles) );
	if( cuf != NULL )
	{
		cuf->cuf_Usr = usr;
		cuf->cuf_MaxCacheSize = 5000000;	// 5000000 bytes/ 5MB
	}
	return cuf;
}

/**
 * delete CacheUserFiles
 * 
 * @param cuf pointer to CacheUserFiles structure which will be deleted
 */
void CacheUserFilesDelete( CacheUserFiles *cuf )
{
	if( cuf != NULL )
	{
		LocFile *lf = cuf->cuf_File;
		while( lf != NULL )
		{
			LocFile *rf = lf;
			lf = (LocFile *)lf->node.mln_Succ;
			
			LocFileDelete( rf );
		}
		
		FFree( cuf );
	}
}

/**
 * delete whole list of CacheUserFiles
 * 
 * @param cuf pointer to CacheUserFiles list which will be deleted
 */
void CacheUserFilesDeleteAll( CacheUserFiles *cuf )
{
	while( cuf != NULL )
	{
		CacheUserFiles * dcuf = cuf;
		cuf = (CacheUserFiles *)cuf->node.mln_Succ;
		
		LocFile *lf = dcuf->cuf_File;
		while( lf != NULL )
		{
			LocFile *rf = lf;
			lf = (LocFile *)lf->node.mln_Succ;
			
			LocFileDelete( rf );
		}
		
		FFree( dcuf );
	}
}

/**
 * add File to CacheUserFiles
 * 
 * @param cuf pointer to CacheUserFiles structure
 * @param lf pointer to LocFile which will be stored inside cache list
 * @return 0 when success, otherwise error number
 */
int CacheUserFilesAddFile( CacheUserFiles *cuf, LocFile *lf )
{
	if( (cuf->cuf_CacheSize + lf->lf_FileSize) > cuf->cuf_MaxCacheSize )
	{
		FERROR("Cannot add file to cache, cache is FULL\n");
		return 1;
	}
	
	lf->node.mln_Succ = (MinNode *)cuf->cuf_File;
	cuf->cuf_File = lf;
	
	return 0;
}
