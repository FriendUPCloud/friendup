
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
 * file contain function definitions related to fkeys
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#ifndef __SECURITY_FKEY_MANAGER_H__
#define __SECURITY_FKEY_MANAGER_H__

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "fkey.h"
#include <system/user/user.h>

//
//
//

typedef struct FKeyManager
{
	FKey			*km_Keys;
	void			*km_SB;
}FKeyManager;

//
//
//

FKeyManager *FKeyManagerNew( void *sb );

//
//
//

void FKeyManagerDelete( FKeyManager *km );

//
//
//

FKey *FKeyManagerGetByName( FKeyManager *km, char *kname );

//
//
//

FKey *FKeyManagerGetByID( FKeyManager *km, FULONG id );

//
//
//

int FKeyManagerAssignKeyToDrive( FKeyManager *fkm, File *rootf );

//
//
//

int FKeyManagerUpdateKeyByID( FKeyManager *km, FULONG id );

#endif //__SECURITY_FKEY_MANAGER_H__
