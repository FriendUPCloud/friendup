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
 *  Shared Memory header
 *
 * file contain definition of functions related shared memory in Friend Core
 *
 *  @author HT (Hogne Titlestad)
 *  @date created 2023
 */

#ifndef __SHM_SHARED_MEMORY_H__
#define __SHM_SHARED_MEMORY_H__

#include <sys/mman.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Set up a shared memory space
int CreateSharedMemory();

// Attach shared memory
int AttachSharedMemory();

// Disconnect from shared memory and free up
void DetachSharedMemory( void *shm_ptr );

// Write to shared memory
void WriteSharedMemory( const SharedData *data );

// Read from shared memory
void ReadSharedMemory( SharedData *data );

#endif

