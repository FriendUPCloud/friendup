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
