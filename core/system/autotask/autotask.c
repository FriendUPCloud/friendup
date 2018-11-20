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
 *  Auto task
 *
 * Threads started with FC
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "autotask.h"
#include <system/systembase.h>
#include <linux/prctl.h>
#include <sys/prctl.h>

/**
 * Create new Autotask
 *
 * @param command command which will be executed
 * @param arguments used by command 
 * @return new Autotask structure when success, otherwise NULL
 */
Autotask *AutotaskNew( char *command, char *arguments )
{
	Autotask *at;
	if( ( at = FCalloc( 1, sizeof( Autotask ) ) ) != NULL )
	{
		at->at_Command = StringDuplicate( command );
		at->at_Arguments = StringDuplicate( arguments );
		
		char *args[ 3 ];
		args[ 0 ] = at->at_Command;
		args[ 1 ] = at->at_Arguments;
		args[ 2 ] = NULL;
		
		prctl(PR_SET_PDEATHSIG, SIGKILL);
		
		int pid = fork();
		if( pid == 0 )
		{
			Autotask *lat = at;

			lat->at_Launched = TRUE;
			
			int val = execv( at->at_Command, args );
			//int val = execv( "friend_process", args );
			DEBUG("[AutotaskNew] Autostart command returned %d\n", val );
			
			lat->at_Launched = FALSE;
		}
		else if( pid < 0 )
		{
			FERROR("Cannot launch script: %s %s\n", at->at_Command, at->at_Arguments );
		}
		else
		{
			INFO("Command launched: %s %s: pid %d\n", at->at_Command, at->at_Arguments, pid );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for user\n");
	}
	
	return at;
}

/**
 * Delete Autotask
 *
 * @return new User structure when success, otherwise NULL
 */
void AutotaskDelete( Autotask *at )
{
	if( at != NULL )
	{
		if( at->at_Command != NULL )
		{
			FFree( at->at_Command );
		}
		
		if( at->at_Arguments != NULL )
		{
			FFree( at->at_Arguments );
		}
		
		if( at->at_Name != NULL )
		{
			FFree( at->at_Name );
		}
		
		if( at->at_PID >= 0 )
		{
			while( at->at_Launched != FALSE )
			{
				kill( at->at_PID, SIGTERM );
			}
		}
		
		FFree( at );
	}
}
