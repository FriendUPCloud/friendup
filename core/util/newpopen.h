/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h> 

enum 
{
	NPOPEN_INPUT = 0,
	NPOPEN_CONSOLE,
	NPOPEN_ERROR,
	NOPEN_MAX
};

typedef struct NPOpenFD{
	pid_t			npo_PID;
	int				np_FD[ NOPEN_MAX ];
}NPOpenFD;

int newpopen(const char *cmd, NPOpenFD *po );

int newpclose( NPOpenFD *po );

