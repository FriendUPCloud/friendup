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
 *  Admin Manager header
 *
 * 
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __CORE_SYSTEM_ADMIN_ADMIN_MANAGER_H__
#define __CORE_SYSTEM_ADMIN_ADMIN_MANAGER_H__

#include <network/socket.h>
#include <system/systembase.h>

//
//
//

int VerifyPeer( int ok, X509_STORE_CTX* ctx );

#endif // __CORE_SYSTEM_ADMIN_ADMIN_MANAGER_H__
