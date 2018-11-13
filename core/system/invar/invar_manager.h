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
#include <db/sqllib.h>
#include <stddef.h>
#include "invar.h"
#include "invar_manager_web.h"

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
