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

#include "fsys_activity.h"
#include <system/systembase.h>

/**
 * Load FilesystemActivity table
 *
 * @param l pointer to systembase
 * @param act pointer to Filesystem Activity structure
 * @param id FilesystemID
 * @return success (0) or fail value (not equal to 0)
 */
int LoadFilesystemActivityDB( void *sb, FilesystemActivity *act, FULONG id )
{
	SystemBase *l = (SystemBase *)sb;
	
	int errRet = 0;
	
	MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 256 ];

		snprintf( temptext, sizeof(temptext), "SELECT `ID`,`FilesystemID`,`StoredBytesLeft`,`ReadedBytesLeft` FROM `FilesystemActivity` WHERE `ID` = '%lu'", id );
		MYSQL_RES *res = sqllib->Query( sqllib, temptext );
		if( res != NULL )
		{
			MYSQL_ROW row;
			int j = 0;

			while( ( row = sqllib->FetchRow( sqllib, res ) ) )
			{
				if( row[ 0 ] != NULL )
				{
					char *end;
					act->fsa_ID = strtoul( (char *)row[ 0 ],  &end, 0 );
				}
				if( row[ 1 ] != NULL )
				{
					char *end;
					act->fsa_FilesystemID = strtoul( (char *)row[ 1 ],  &end, 0 );
				}
				if( row[ 2 ] != NULL )
				{
					char *end;
					act->fsa_StoredBytesLeft = strtoul( (char *)row[ 2 ],  &end, 0 );
				}
				if( row[ 3 ] != NULL )
				{
					char *end;
					act->fsa_ReadedBytesLeft = strtoul( (char *)row[ 3 ],  &end, 0 );
				}
			}
			sqllib->FreeResult( sqllib, res );
		}

		l->LibraryMYSQLDrop( l, sqllib );
	}
	else
	{
		return 2;
	}
	
	return errRet;
}

/**
 * Update FilesystemActivity table
 *
 * @param l pointer to systembase
 * @param act pointer to Filesystem Activity structure
 * @return success (0) or fail value (not equal to 0)
 */
int UpdateFilesystemActivityDB( void *sb, FilesystemActivity *act )
{
	SystemBase *l = (SystemBase *)sb;
	
	int errRet = 0;
	
	MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
	if( sqllib != NULL )
	{
		char temptext[ 256 ];

		snprintf( temptext, sizeof(temptext), "UPDATE `FilesystemActivity` SET `StoredBytesLeft`='%lld',`ReadedBytesLeft`='%lld' WHERE `ID` = '%lu'", act->fsa_StoredBytesLeft, act->fsa_ReadedBytesLeft, act->fsa_ID );
		sqllib->QueryWithoutResults( sqllib, temptext );

		l->LibraryMYSQLDrop( l, sqllib );
	}
	else
	{
		return 2;
	}
	
	return errRet;
}
