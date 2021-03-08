/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __SYSTEM_MONITOR_MANAGER_H__
#define __SYSTEM_MONITOR_MANAGER_H__

#include <unistd.h>
#include <netinet/in.h>
#include <string.h>
#include <signal.h>
#include <fcntl.h>
#include <network/http.h>

//
//
//

typedef struct SystemMonitorManager
{
	void				*smm_SB;
	char				*smm_Key;			// key used to check authorization
	time_t				smm_TimeDiffAlarm;	// this set range from which alarm is set (response code)
	pthread_mutex_t		smm_Mutex;
	time_t				smm_PresenceTimestamp;		// last presence connection timestamp
}SystemMonitorManager;


//
//
//

SystemMonitorManager *SystemMonitorManagerNew( void *sb );

//
//
//

void SystemMonitorManagerDelete( SystemMonitorManager *smm );

//
//
//

Http *SystemMonitorManagerWEB( SystemMonitorManager *smm, char *function, Http *req );

#endif // __SYSTEM_MONITOR_MANAGER_H__

