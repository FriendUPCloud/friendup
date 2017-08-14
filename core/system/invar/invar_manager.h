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
 *  INVARManager definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created March 2016
 */

//
//
// INVARManager
// Network Only Memory Manager
//

#ifndef __SYSTEM_INRAM_INRAM_MANAGER_H__
#define __SYSTEM_INRAM_INRAM_MANAGER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <mysql/mysqllibrary.h>
#include <stddef.h>
#include "invar.h"

typedef struct INVARManager 
{
	INVARGroup 			*nm_Groups;
}INVARManager;

//
//
//

INVARManager *INVARManagerNew( );

//
// release manager
//

void INVARManagerDelete( INVARManager *d );

//
//
//

int INVARManagerAddGroup( INVARManager *nm, INVARGroup *ng );

//
//
//

void INVARManagerDeleteGroup( INVARManager *nm, FULONG id );

//
//
//

int INVARManagerAddEntry( INVARManager *nm, FULONG grid, INVAREntry *ne );

//
//
//

void INVARManagerDeleteEntry( INVARManager *nm, FULONG grid, FULONG enid );

//
//
//

INVARGroup *INVARManagerGetGroupByPtr( INVARManager *nm, FULONG ptr ); 

//
//
//

INVAREntry *INVARManagerGetEntryByPtr( INVARManager *nm, FULONG ptr ); 

//
//
//

Http *INVARManagerWebRequest( void *m, char **urlpath, Http* request );

#endif // __SYSTEM_INRAM_INRAM_MANAGER_H__
