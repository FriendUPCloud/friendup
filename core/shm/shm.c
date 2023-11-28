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
 *  Shared Memory Body
 *
 * file contain definition of functions related shared memory in Friend Core
 *
 *  @author HT (Hogne Titlestad)
 *  @date created 2023
 */

#include <shm/shm.h>

int CreateSharedMemory()
{
    int shm_fd = shm_open( SHM_NAME, O_CREAT | O_RDWR, 0666 );
    
    if( shm_fd == -1 )
    {
        perror( "shm_open" );
        exit(EXIT_FAILURE);
    }

    if( ftruncate( shm_fd, SHM_SIZE ) == -1 )
    {
        perror( "ftruncate" );
        exit( EXIT_FAILURE );
    }

    return shm_fd;
}

int AttachSharedMemory()
{
    int shm_fd = shm_open( SHM_NAME, O_RDWR, 0666 );
    
    if( shm_fd == -1 )
    {
        perror( "shm_open" );
        exit( EXIT_FAILURE );
    }

    return shm_fd;
}

void DetachSharedMemory( void *shm_ptr )
{
    if( shmdt( shm_ptr ) == -1 )
    {
        perror( "shmdt" );
        exit( EXIT_FAILURE );
    }
}

void WriteSharedMemory( const SharedData *data )
{
    int shm_fd = CreateSharedMemory();
    void *shm_ptr = mmap( 0, SHM_SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0 );
    if( shm_ptr == MAP_FAILED )
    {
        perror( "mmap" );
        exit( EXIT_FAILURE );
    }

    memcpy( shm_ptr, data, sizeof( SharedData ) );

    DetachSharedMemory( shm_ptr );
    close( shm_fd );
}

void ReadSharedMemory( SharedData *data )
{
    int shm_fd = AttachSharedMemory();
    void *shm_ptr = mmap( 0, SHM_SIZE, PROT_READ, MAP_SHARED, shm_fd, 0 );
    if( shm_ptr == MAP_FAILED )
    {
        perror( "mmap" );
        exit( EXIT_FAILURE );
    }

    memcpy( data, shm_ptr, sizeof( SharedData ) );

    DetachSharedMemory( shm_ptr );
    close(shm_fd);
}

