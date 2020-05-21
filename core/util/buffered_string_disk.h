/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

//
// buffered string disk
// It is buffered string variation, which save data on disk if there is more then XXXX bytes
//

#ifndef __BUFFERED_STRING_DISK_H__
#define __BUFFERED_STRING_DISK_H__

#include <core/types.h>

#define BUF_STRING_DISK_MAX 1024 * 12
#define BUF_STRING_DISK_MAX_IN_MEM 10*1024*1024

#define BUF_STRING_TEMP_FILE_TEMPLATE "/tmp/Friendup/FriendBufStringDisk_XXXXXXXXXXXXXXXXXX"

//
// BufferString structure
//

typedef struct BufStringDisk
{
	FQUAD			bsd_Size;        // current data size
	FQUAD			bsd_Bufsize;     // buffer size
	char			*bsd_Buffer;      // pointer to buffer
	FQUAD			bsd_BufferIncrements;
	FQUAD			bsd_PreviousIncrement;
	int				bsd_FileHandler;
	char			bsd_FileName[ 128 ];
} BufStringDisk;


/**
 * Creates new buffered string object with a default buffer size
 * @return pointer to BufStringDisk object or NULL on failure
 */
BufStringDisk *BufStringDiskNew(void);

/**
 * Creates new buffered string object with a desired buffer size
 * @param initial_size desired initial size
 * @return pointer to BufStringDisk object
 */
BufStringDisk *BufStringDiskNewSize(unsigned int initial_size);

/**
 * Deallocated a buffered string object and its buffers
 * @param bs pointer to a buffered string object
 */
void BufStringDiskDelete(BufStringDisk *bs);

/**
 * Appends a string to an existing buffered string object.
 * @param bs pointer to BufStringDisk object
 * @param string_to_append string to be appended
 * @return 0 on success, 1 on failure, string in buffer is always null-terminated
 */
unsigned int BufStringDiskAdd(BufStringDisk *bs, const char *string_to_append);

/**
 * Appends a string  with a defined length to an existing buffered string object.
 * @param bs pointer to BufString object
 * @param string_to_append string to be appended
 * @param string_to_append_length how many bytes from the string should be added
 * @return 0 on success, 1 on failure, string in buffer is always null-terminated
 */
unsigned int BufStringDiskAddSize(BufStringDisk *bs, const char *string_to_append, unsigned int string_to_append_length);


/**
 * Read file to buffered string
 * @param path path to file
 * @return BufString object in file inside or NULL when error appear
 */
BufStringDisk *BufStringDiskRead(const char *path );

/**
 * Write buffered string into file
 * @param bs pointer to BufString object
 * @param path path to file
 * @return 0 when success otherwise error number
 */
int BufStringDiskWrite( BufStringDisk *bs, const char *path );

#endif //__BUFFERED_STRING_DISK_H__

