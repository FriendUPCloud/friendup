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
 *  INRAM Filesystem body
 * Network Only Memory FileSystem
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include "inramfs.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <util/string.h>

/**
 * Function create INRAMFile
 *
 * @param type type of INRAM entry INRAM_ROOT, INRAM_FILE, INRAM_DIR
 * @param path full path to entry
 * @param name name of entry
 * @return new INRAMFile structure when success, otherwise  NULL
 */

INRAMFile *INRAMFileNew( int type, char *path, char *name )
{
	INRAMFile *nf;
	
	if( ( nf = FCalloc( 1, sizeof( INRAMFile ) ) ) != NULL )
	{
		nf->nf_Type = type;
		nf->nf_Name = StringDuplicate( name );
		if( path != NULL )
		{
			nf->nf_Path = StringDuplicate( path );
		}
		
		if( type == INRAM_FILE )
		{
			DEBUG("File created\n");
			nf->nf_Data = BufStringNewSize( 64 );
		}
		else
		{
			DEBUG("Directory created\n");
		}
	}
	else
	{
		FERROR("Cannot allocate memory for INRAMFile\n");
	}
	return nf;
}

/**
 * Delete INRamFile
 *
 * @param nf pointer to INRAMFile structure which will be deleted
 */

FLONG INRAMFileDelete( INRAMFile *nf )
{
	FLONG deleted = 0;
	if( nf != NULL )
	{
		if( nf->nf_Type == INRAM_FILE )
		{
			if( nf->nf_Data != NULL )
			{
				deleted = nf->nf_Data->bs_Size;
				BufStringDelete( nf->nf_Data );
			}
		}
		
		if( nf->nf_Path )
		{
			FFree( nf->nf_Path );
		}
		if( nf->nf_Name )
		{
			FFree( nf->nf_Name );
		}
		FFree( nf );
	}
	return deleted;
}

/**
 * Add child to INRAMFile entry
 *
 * @param root pointer to INRAMFile to which added entry will be assigned as child
 * @param toadd pointer to INRAMFile which will be added to root
 * @return 0 when success, otherwise error number
 */
int INRAMFileAddChild( INRAMFile *root, INRAMFile *toadd )
{
	if( root != NULL && toadd != NULL )
	{
		toadd->node.mln_Succ = (MinNode *) root->nf_Children;
		root->nf_Children = toadd;
		toadd->nf_Parent = root;
	}
	else
	{
		return 1;
	}
	
	return 0;
}

/**
 * Get INRAMFile by name
 *
 * @param root pointer to INRAMFile where entry will be searched
 * @param name name of entry which will be used to search entry
 * @return pointer to INRAMFile when success, otherwise NULL
 */
INRAMFile *INRAMFileGetChildByName( INRAMFile *root, char *name )
{
	INRAMFile *f = root->nf_Children;
	DEBUG("INRAMFileGetChildByName\n");
	
	while( f != NULL )
	{
		INRAMFile *ret = NULL;
		if( strcmp( f->nf_Name, name ) == 0 )
		{
			DEBUG("Found name %s\n", name );
			return f;
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	return NULL;
}

/**
 * Remove INRAMFile entry from structure
 *
 * @param root pointer to INRAMFile from which entry will be removed
 * @param rem pointer to INRAMFile which will be removed from root
 * @return pointer to Entry removed from root if it was found, otherwise NULL
 */
INRAMFile *INRAMFileRemoveChild( INRAMFile *root, INRAMFile *rem )
{
	INRAMFile *f = root->nf_Children;
	DEBUG("Remove child\n");
	
	while( f != NULL )
	{
		if( f == rem )
		{
			// remove entry from list and return
			
			if( f == root->nf_Children )
			{
				root->nf_Children = (INRAMFile *)root->nf_Children->node.mln_Succ;
				if( root->nf_Children != NULL )
				{
					root->nf_Children->node.mln_Pred = NULL;
				}
				DEBUG(" entry removed\n");
			}
			else if( f->node.mln_Succ == NULL )
			{
				INRAMFile *nf = (INRAMFile *)f->node.mln_Pred;
				nf->node.mln_Succ = NULL;
			}
			else
			{
				INRAMFile *next = (INRAMFile *) f->node.mln_Succ;
				INRAMFile *prev = (INRAMFile *) f->node.mln_Pred;
				next->node.mln_Pred = (MinNode *)prev;
				prev->node.mln_Succ = (MinNode *)next;
			}
			
			return f;
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	return NULL;
}

/**
 * Remove INRAMFile entry from structure (recursive way)
 *
 * @param root pointer to INRAMFile from which entry will be removed
 * @param rem pointer to INRAMFile which will be removed from root
 * @return pointer to Entry removed from root if it was found, otherwise NULL
 */
INRAMFile *INRAMFileRemove( INRAMFile *root, INRAMFile *rem )
{
	INRAMFile *f = root->nf_Children;
	
	while( f != NULL )
	{
		INRAMFile *ret = NULL;
		if( f->nf_Type == INRAM_DIR )
		{
			if( ( ret = INRAMFileRemove( f, rem ) ) != NULL )
			{
				return ret;
			}
		}
		
		if( f== rem )
		{
			// remove entry from list and return
			
			if( f == root->nf_Children )
			{
				root->nf_Children = (INRAMFile *)root->nf_Children->node.mln_Succ;
				root->nf_Children->node.mln_Pred = NULL;
			}
			else if( f->node.mln_Succ == NULL )
			{
				INRAMFile *nf = (INRAMFile *)f->node.mln_Pred;
				nf->node.mln_Succ = NULL;
			}
			else
			{
				INRAMFile *next = (INRAMFile *) f->node.mln_Succ;
				INRAMFile *prev = (INRAMFile *) f->node.mln_Pred;
				next->node.mln_Pred = (MinNode *)prev;
				prev->node.mln_Succ = (MinNode *)next;
			}
			
			return f;
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	return NULL;
}

/**
 * Remove INRAMFile child entry from structure by path
 *
 * @param root pointer to INRAMFile from which entry will be removed
 * @param path path name which will be used to find entry
 * @return pointer to Entry removed from root if it was found, otherwise NULL
 */
INRAMFile *INRAMFileRemoveChildByPath( INRAMFile *root, char *path )
{
	INRAMFile *f = root->nf_Children;
	
	while( f != NULL )
	{
		if( strcmp( path, f->nf_Path ) == 0 )
		{
			// remove entry from list and return
			
			if( f == root->nf_Children )
			{
				root->nf_Children = (INRAMFile *)root->nf_Children->node.mln_Succ;
				root->nf_Children->node.mln_Pred = NULL;
			}
			else if( f->node.mln_Succ == NULL )
			{
				INRAMFile *nf = (INRAMFile *)f->node.mln_Pred;
				nf->node.mln_Succ = NULL;
			}
			else
			{
				INRAMFile *next = (INRAMFile *) f->node.mln_Succ;
				INRAMFile *prev = (INRAMFile *) f->node.mln_Pred;
				next->node.mln_Pred = (MinNode *)prev;
				prev->node.mln_Succ = (MinNode *)next;
			}
			
			return f;
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	return NULL;
}

/**
 * Remove INRAMFile entry from structure (recursive way)
 *
 * @param root pointer to INRAMFile from which entry will be removed
 * @param path path name which will be used to find entry
 * @return pointer to Entry removed from root if it was found, otherwise NULL
 */
INRAMFile *INRAMFileRemoveByPath( INRAMFile *root, char *path )
{
	INRAMFile *f = root->nf_Children;
	
	while( f != NULL )
	{
		INRAMFile *ret = NULL;
		if( f->nf_Type == INRAM_DIR )
		{
			if( ( ret = INRAMFileRemoveByPath( f, path ) ) != NULL )
			{
				return ret;
			}
		}
		
		if( strcmp( path, f->nf_Path ) == 0 )
		{
			// remove entry from list and return
			
			if( f == root->nf_Children )
			{
				root->nf_Children = (INRAMFile *)root->nf_Children->node.mln_Succ;
				root->nf_Children->node.mln_Pred = NULL;
			}
			else if( f->node.mln_Succ == NULL )
			{
				INRAMFile *nf = (INRAMFile *)f->node.mln_Pred;
				nf->node.mln_Succ = NULL;
			}
			else
			{
				INRAMFile *next = (INRAMFile *) f->node.mln_Succ;
				INRAMFile *prev = (INRAMFile *) f->node.mln_Pred;
				next->node.mln_Pred = (MinNode *)prev;
				prev->node.mln_Succ = (MinNode *)next;
			}
			
			return f;
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	return NULL;
}

/**
 * Delete all INRAMFile entries
 *
 * @param root pointer to INRAMFile from which entry will be removed
 */
FLONG INRAMFileDeleteAll( INRAMFile *root )
{
	FLONG deleted = 0;
	INRAMFile *f = root->nf_Children;
	
	while( f != NULL )
	{
		INRAMFile *del = f;
		if( f->nf_Type == INRAM_DIR )
		{
			deleted += INRAMFileDeleteAll( f );
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
		
		deleted += INRAMFileDelete( del );
	}
	return deleted;
}

/**
 * Find last INRAMFile entry by path
 *
 * if file will be returned then file exist
 * if directory then
 *
 * @param root pointer to INRAMFile root file where entry will be searched
 * @param path path name which will be used to find entry
 * @param error pointer to integer where error number will be returned
 * @return pointer to Entry if it was found, otherwise NULL
 */
INRAMFile *INRAMFileGetLastPath( INRAMFile *root, const char *path, int *error )
{
	int pathlen = strlen( path );
	//
	// path is NULL return error
	if( path == NULL )
	{
		DEBUG("Path is NULL\n");
		*error = INRAM_ERROR_PATH_DEFAULT;
		return root;
	}
	 
	// directory is empty return error
	if( pathlen < 1 )
	{
		DEBUG("Path < 1\n");
		*error = INRAM_ERROR_PATH_DO_NOT_EXIST;
		return root;
	}
	
	// going through path
	//DEBUG("\n\n\n\nChecking path %s\n", path );
	INRAMFile *f = root->nf_Children;
	int i;
	for( i=0 ; i < pathlen; i++ )
	{
		if( path[ i ] == '/' )
		{
			i++;
			break;
		}
	}
	
	int entryFound = 0;
	
	while( f != NULL )
	{
		DEBUG("Going through children: %s\n", f->nf_Name );
		
		// we found something what could be our target
		
		if( strncmp( f->nf_Name, path, i-1 ) == 0 )
		{
			DEBUG("File name found %s\n", path );
			if( f->nf_Type == INRAM_DIR )
			{
				// if name is equal then we found our entry (directory)
				
				if( strcmp( f->nf_Name, path ) == 0 )
				{
					*error = INRAM_ERROR_DIRECTORY_FOUND;
					return f;
				}
				
				// it was not our directory, checking children
				
				INRAMFile *ret = INRAMFileGetLastPath( f, &(path[ i ] ), error );
				if( ret != NULL )
				{
					DEBUG("Found entry, return\n");
					return ret;
				}
				
				// got a problem, return
				
				if( *error != 0 )
				{
					return NULL;
				}
			}
			else
			{
				if( strcmp( f->nf_Name, path ) == 0 )
				{
					*error = INRAM_ERROR_FILE_FOUND;
					DEBUG("File found, name: %s\n", f->nf_Name );
					return f;
				}
			}
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	
	DEBUG("Check path %d %d %s\n", i, pathlen, path );
	if( i != pathlen )
	{
		*error = INRAM_ERROR_PATH_WRONG;
	}
	/*for( ;i < pathlen; i++ )
	{
		if( path[ i ] == '/' )
		{
			*error = INRAM_ERROR_PATH_WRONG;
			break;
		}
	}*/
	
	return NULL;
}

/**
 * Make directory/subdirectories if needed
 *
 * @param root pointer to INRAMFile structure where directory will be created as child
 * @param path path which will be used to create directories
 * @param error pointer to integer where error number will be returned
 * @return pointer to new INRAMFile structure when success, otherwise NULL
 */
INRAMFile *INRAMFileMakedirPath( INRAMFile *root, char *path, int *error )
{
		int pathlen = strlen( path );
	//
	// path is NULL return error
	if( path == NULL )
	{
		DEBUG("INRAMFileMakedirPath Path is NULL\n");
		*error = INRAM_ERROR_PATH_DEFAULT;
		return root;
	}
	 
	// directory is empty return error
	if( pathlen < 1 )
	{
		DEBUG("INRAMFileMakedirPath Path < 1\n");
		*error = INRAM_ERROR_PATH_DO_NOT_EXIST;
		return NULL;
	}
	
	// going through path
	DEBUG("Checking path\n");
	INRAMFile *f = root->nf_Children;
	int i;
	for( i=0 ; i < pathlen; i++ )
	{
		if( path[ i ] == '/' )
		{
			i++;
			break;
		}
	}
	
	int entryFound = 0;
	
	while( f != NULL )
	{
		DEBUG("Going through children: %s\n", f->nf_Name );
		
		// we found something what could be our target
		
		if( strncmp( f->nf_Name, path, i-1 ) == 0 )
		{
			DEBUG("File name found %s\n", path );
			if( f->nf_Type == INRAM_DIR )
			{
				// if name is equal then we found our entry (directory)
				
				if( strcmp( f->nf_Name, path ) == 0 )
				{
					*error = INRAM_ERROR_DIRECTORY_FOUND;
					return f;
				}
				
				// it was not our directory, checking children
				
				INRAMFile *ret = INRAMFileMakedirPath( f, &(path[ i ] ), error );
				if( ret != NULL )
				{
					DEBUG("Found entry, return\n");
					return ret;
				}
				
				// got a problem, return
				
				if( *error != 0 )
				{
					return NULL;
				}
			}
		}
		
		f = (INRAMFile *)f->node.mln_Succ;
	}
	
	DEBUG("Check path %d %d %s\n", i, pathlen, path );
	if( i != pathlen )
	{
		char *npath = FCalloc( pathlen+10, sizeof(char) );
		if( npath != NULL )
		{
			strncpy( npath, path, pathlen );
			strcat( npath, "/" );
			int oldpos = i = 0;
			for( ; i < pathlen+1 ; i++ )
			{
				if( npath[ i ] == '/' || npath[ i ] == 0 )
				{
					npath[ i ] = 0;
					DEBUG("founded i %d len %d path %s\n", i, pathlen, &npath[ oldpos ] );
					INRAMFile *nd = INRAMFileNew( INRAM_DIR, NULL, &npath[ oldpos ] );
				
					INRAMFileAddChild( root, nd );
					INRAMFile *oldnd = nd->nf_Parent;
					DEBUG("---parent %s\n", oldnd->nf_Name );
				
					root = nd;
				
					oldpos = i+1;
					//break;
				}
			}
			FFree( npath );
		}
	}
	else
	{
		char *npath = FCalloc( pathlen+10, sizeof(char) );
		if( npath != NULL )
		{
			strncpy( npath, path, pathlen );
			strcat( npath, "/" );
		
			DEBUG("One directory created\n");
			INRAMFile *nd = INRAMFileNew( INRAM_DIR, npath, path );
				
			INRAMFileAddChild( root, nd );
			
			FFree( npath );
		}
	}
	
	return root;
}
