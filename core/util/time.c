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
 *  Time body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */
#include <core/types.h>
#include <sys/time.h>
#include "time.h"

/**
 * Return current time in miliseconds
 *
 * @return time in miliseconds
 */
uint64_t GetCurrentTimestamp()
{
    struct timeval te; 
    gettimeofday(&te, NULL); // get current time
    uint64_t milliseconds = te.tv_sec*1000LL + te.tv_usec/1000; // caculate milliseconds

    return milliseconds;
}
