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
 *  Time header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

#ifndef __UTIL_TIME_H__
#define __UTIL_TIME_H__

#include <core/types.h>
#include <sys/time.h>

//
//
//

uint64_t GetCurrentTimestamp();

double GetCurrentTimestampD();

#endif // __UTIL_TIME_H__
