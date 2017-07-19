/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
**©****************************************************************************/
/**
 * @file
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
