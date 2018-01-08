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
 * Body of  file permission
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (31/03/2017)
 */

#include "file_permissions.h"
#include <system/user/user.h>
#include <system/user/user_group.h>

/**
 * Function creates FilePermission structure
 *
 * @return new FilePermission structure when success, otherwise NULL
 */
FilePermission *FilePermissionNew()
{
	FilePermission *fp = NULL;
	
	if( ( fp = FCalloc( 1, sizeof(FilePermission) ) ) != NULL )
	{
		
	}
	
	return fp;
}

/**
 * Function delete FilePermission structure
 *
 * @param fp pointer to FilePermission structure which will be deleted
 */
void FilePermissionDelete( FilePermission *fp )
{
	if( fp != NULL )
	{
		// groups
		UGAccessEl *ug = fp->fp_GroupAccess;
		UGAccessEl *rug = ug;
		while( ug != NULL )
		{
			rug = ug;
			ug = (UGAccessEl *)ug->node.mln_Succ;
			
			FFree( rug );
		}
		fp->fp_GroupAccess = NULL;
		
		// users
		/*
		UAccessEl *ua = fp->fp_UserAccess;
		UAccessEl *rua = ua;
		while( ug != NULL )
		{
			rua = ua;
			ua = (UAccessEl *)ua->node.mln_Succ;
			
			FFree( rua );
		}
		fp->fp_UserAccess = NULL;
		*/
		
		if( fp->fp_Path != NULL )
		{
			FFree( fp->fp_Path );
		}
		FFree( fp );
	}
}
