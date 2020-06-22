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
 *  File operations
 *
 *  file contain definitions related to File operations
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 07/05/2020
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <core/nodes.h>
#include <util/time.h>
#include <sys/stat.h>
#include <util/buffered_string.h>
#include <dirent.h>
#include <util/string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include "file_operations.h"

/**
 * Function calls other server by using HTTP call
 *
 * @param path path which will be deleted
 * @return number of deleted files
 */
int DeleteDirectory( const char * path )
{
	DIR *d = opendir( path );
	size_t path_len = strlen( path );
	FLONG r = 0;

	if( d )
	{
		struct dirent *p;
		r = 0;

		while( ( p = readdir( d ) ) != NULL )
		{
			char *buf;
			size_t len;
			
			DEBUG("localfs: in directory %s\n", p->d_name );

			/* Skip the names "." and ".." as we don't want to recurse on them. */
			if (!strcmp(p->d_name, ".") || !strcmp(p->d_name, "..") )
			{
				continue;
			}

			len = path_len + strlen(p->d_name) + 2; 
			buf = FCalloc(len , sizeof(char));

			if( buf != NULL )
			{
				struct stat statbuf;
				int plen = strlen( path );

				if( path[ plen-1 ] == '/' )
				{
					snprintf(buf, len, "%s%s", path, p->d_name);
				}
				else
				{
					snprintf(buf, len, "%s/%s", path, p->d_name);
				}
				DEBUG("To delete: %s\n", buf );

				if (!stat(buf, &statbuf))
				{
					if (S_ISDIR(statbuf.st_mode))
					{
						r += DeleteDirectory(buf);
					}
					else
					{
						r += statbuf.st_size;
						if( unlink( buf ) != 0 )
						{
							remove( buf );
						}
					}
				}
				FFree(buf);
			}
		}
		closedir(d);

		rmdir(path);
	}
	else // file
	{
		DEBUG("Remove file %s\n", path );
		
		struct stat statbuf;
		if( !stat( path, &statbuf ) )
		{
			r += statbuf.st_size;
		}
		remove( path );
	}
	return r;
}

