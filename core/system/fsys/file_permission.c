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
 * Body of  file permission
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (31/03/2017)
 */

#include "file_permissions.h"
#include <system/user/user.h>
#include <system/usergroup/user_group.h>

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
