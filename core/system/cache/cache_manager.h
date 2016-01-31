/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __FILE_CACHE_MANAGER_H__
#define __FILE_CACHE_MANAGER_H__

#include <core/types.h>
#include <network/file.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

//
//
//

typedef struct CacheFileGroup
{
	int				cg_EntryId;			// first char
	LocFile			*cg_File;				// poitner to file structure
}CacheFileGroup;

//
//
//

typedef struct CacheManager
{
	UQUAD			cm_CacheSize;
	UQUAD 			cm_CacheMax;
	
	CacheFileGroup		cm_CacheFileGroup[ 256 ];
}CacheManager;

//
//
//

CacheManager *CacheManagerNew( ULONG size );

void CacheManagerDelete( CacheManager *cm );

void CacheManagerClearCache( CacheManager *cm );

int CacheManagerFilePut( CacheManager *cm, LocFile *lf );

LocFile *CacheManagerFileGet( CacheManager *cm, char *path );

#endif //__FILE_CACHE_MANAGER_H__
