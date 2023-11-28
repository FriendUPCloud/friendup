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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/ipc.h>
#include <fcntl.h>
#include <semaphore.h>

#define SHM_NAME "/friendos_shared_memory"
#define SHM_SIZE 4096

typedef struct {
    // Define your shared data structure here
    // For example:
    // int someData;
    // char someString[256];
} SharedData;

typedef struct {
    sem_t semaphore;  // Semaphore for signaling
    SharedData data;  // Shared data structure
} SharedMemory;

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

