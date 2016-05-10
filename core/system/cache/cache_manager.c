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

#include "cache_manager.h"


CacheManager *CacheManagerNew( ULONG size )
{
	DEBUG( "[CacheManagerNew] Setting up cache manager.\n" );
	CacheManager *cm = FCalloc( 1, sizeof( CacheManager ) );
	if( cm != NULL )
	{
		int i = 0;
		cm->cm_CacheMax = size;
		
		for( i = 0; i < 256; i++ )
		{
			cm->cm_CacheFileGroup[ i ].cg_EntryId = i;
			cm->cm_CacheFileGroup[ i ].cg_File = NULL;
		}
	}
	else
	{
		ERROR("Cannot allocate memory for CacheManager\n");
	}
	return cm;
}

//
//
//

void CacheManagerDelete( CacheManager *cm )
{
	if( cm != NULL )
	{
		int i = 0;
		
		for( ; i < 256; i++ )
		{
			LocFile *lf = cm->cm_CacheFileGroup[ i ].cg_File;
			while( lf != NULL )
			{
				LocFile *rf = lf;
				lf = (LocFile *)lf->node.mln_Succ;
				LocFileFree( rf );
			}
		}
	}
	
	//INFO("\n\n\n\n=======================CACHE REMOVED\n");
	
	FFree( cm );
}

//
//
//

void CacheManagerClearCache( CacheManager *cm )
{
	if( cm != NULL )
	{
		int i = 0;
		
		for( ; i < 256; i++ )
		{
			LocFile *lf = cm->cm_CacheFileGroup[ i ].cg_File;
			while( lf != NULL )
			{
				LocFile *rf = lf;
				lf = (LocFile *)lf->node.mln_Succ;
				
				LocFileFree( rf );
			}
			
			cm->cm_CacheFileGroup[ i ].cg_File = NULL;
		}
	}
}

// we need task which will check if file was or not used too often

//
//
//

int CacheManagerFilePut( CacheManager *cm, LocFile *lf )
{
	if( cm != NULL )
	{
		INFO(" cache size %lld file size %lld cache max %lld\n",  cm->cm_CacheSize ,(QUAD)lf->filesize, (QUAD)cm->cm_CacheMax );
		if( (cm->cm_CacheSize + lf->filesize) > cm->cm_CacheMax )
		{
			ERROR("Cannot add file to cache, cache is FULL\n");
			return 1;
		}
		else
		{
			int id = lf->lf_Filename[ 0 ];		//we sort data by name
			if( id < 0 && id > 255 )
			{
				id = 0;
			}
			if( cm->cm_CacheFileGroup[ id ].cg_File == NULL )
			{
				cm->cm_CacheFileGroup[ id ].cg_File = lf;
			}
			else
			{
				lf->node.mln_Succ = (MinNode *)cm->cm_CacheFileGroup[ id ].cg_File;
				cm->cm_CacheFileGroup[ id ].cg_File = lf;
			}
			
			lf->lf_FileUsed++;
			
			cm->cm_CacheSize += lf->filesize;
		}
	}
	return 0;
}

inline char *GetFileNamePtr( char *path, int len )
{
	int i = len;
	while( i != 0 )
	{
		if( path[ i ] == '/' )
		{
			return &path[ i+1 ];
		}
		i--;
	}
	return path;
}

//
//
//

LocFile *CacheManagerFileGet( CacheManager *cm, char *path )
{
	LocFile *ret = NULL;
	
	if( cm != NULL )
	{
		char *fname = GetFileNamePtr( path, strlen(path ) );
		int id = fname[ 0 ];
		if( id < 0 && id > 255 )
		{
			id = 0;
		}
		LocFile *lf = cm->cm_CacheFileGroup[ id ].cg_File;
		
		while( lf != NULL )
		{
			if( strcmp( lf->lf_Path, path ) == 0 )
			{
				lf->lf_FileUsed++;
				//INFO("File found in cache : %s\n", lf->lf_Path );
				return lf;
			}
			
			lf = (LocFile *)lf->node.mln_Succ;
		}
	}
	
	return ret;
}

