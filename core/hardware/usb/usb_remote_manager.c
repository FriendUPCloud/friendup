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
 *  USB remote devices manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#include "usb_remote_manager.h"
#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/systembase.h>
#include <system/json/json_converter.h>


/**
 * Create USBRemoteManager
 *
 * @return return new USBRemoteManager structure when success, otherwise NULL
 */

USBRemoteManager *USBRemoteManagerNew()
{
	USBRemoteManager *man = NULL;
	if ((man = FCalloc(1, sizeof(USBRemoteManager))) != NULL)
	{
		pthread_mutex_init( &(man->usbrm_Mutex), NULL );

		DEBUG("[USBRemoteManagerNew] default values initalized\n");
	}
	else
	{
		//FERROR("Cannot allocate memory for USBManager\n");
	}
	return man;
}

/**
 * Delete USBRemoteManager
 *
 * @param usbm pointer to USBRemoteManager which will be deleted
 */
void USBRemoteManagerDelete( USBRemoteManager *usbm )
{
	if( usbm != NULL )
	{
		UserUSBDevices *dev = usbm->usbrm_UserDevices;
		while (dev != NULL)
		{
			UserUSBDevices *remd = dev;
			dev = (UserUSBDevices *)dev->node.mln_Succ;

			UserUSBDevicesDelete( remd );
		}

		pthread_mutex_destroy( &(usbm->usbrm_Mutex) );
	}
}

/**
 * Create USB port
 *
 * @param usbm pointer to USBRemoteManager
 * @param username name of user to which new port will be attached
 * @param error pointer to integer value where error number will be stored
 * @return return pointer to USBRemoteDevice structure when success, otherwise NULL
 */
UserUSBDevices *USBRemoteManagerCreatePort( USBRemoteManager *usbm, char *username, int *error )
{
	UserUSBDevices *actdev = NULL;
	*error = 0;
	
	DEBUG("[USBRemoteManagerCreatePort] username: %s\n", username );
	
	if( usbm != NULL && username != NULL )
	{
		DEBUG("[USBRemoteManagerCreatePort] first lock\n");
		
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			DEBUG("[USBRemoteManagerCreatePort] Trying to find user\n");
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBDevices *)actdev->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
			
			DEBUG("[USBRemoteManagerCreatePort] unlock\n");
		}
		// try to find devices attached to user
		
		DEBUG("[USBRemoteManagerCreatePort] User to which device will be mounted found: %p\n", actdev );
		// device found
		if( actdev == NULL )
		{
			// username, windows user name, internet address
			DEBUG("[USBRemoteManagerCreatePort] Create new user devices\n");
			actdev = UserUSBDevicesNew( username, NULL );
			DEBUG("[USBRemoteManagerCreatePort] device created: %p\n", actdev );
			if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
			{
				// add user devices to list
				actdev->node.mln_Succ = (MinNode *)usbm->usbrm_UserDevices;
				usbm->usbrm_UserDevices = actdev;
				FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
			}
		}
		DEBUG("[USBRemoteManagerCreatePort] actdev pointer: %p\n", actdev );
	}
	else
	{
		return NULL;
	}
	return actdev;
}

/**
 * Delete USB port by ID
 *
 * @param usbm pointer to USBRemoteManager
 * @param username user to which device belong
 * @param id of device which will be deleted
 * @return return 0 when success, otherwise error number is returned
 */
int USBRemoteManagerDeletePort( USBRemoteManager *usbm, char *username, FULONG id )
{
	if( usbm != NULL && username != NULL )
	{
		UserUSBDevices *actdev = NULL;
		
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBDevices *)actdev->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
		}
		
		if( actdev != NULL )
		{
			UserUSBDevicesDeletePort( actdev, id );
		}
	}
	else
	{
		return 1;
	}
	return 0;
}

/**
 * Delete USB port (by port number)
 *
 * @param usbm pointer to USBRemoteManager
 * @param username user to which device belong
 * @param port usb port number
 * @return return 0 when success, otherwise error number is returned
 */
int USBRemoteManagerDeletePortByPort( USBRemoteManager *usbm, char *username, FULONG port )
{
	if( usbm != NULL && username != NULL )
	{
		UserUSBDevices *actdev = NULL;
		
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBDevices *)actdev->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
		}
		
		if( actdev != NULL )
		{
			UserUSBDevicesDeletePort( actdev, port );
		}
	}
	else
	{
		return 1;
	}
	return 0;
}

/**
 * Get user devices
 *
 * @param usbm pointer to USBRemoteManager
 * @param username user to which device belong
 * @return return pointer to UserUSBRemoteDevices when success, otherwise NULL
 */
UserUSBDevices *USBRemoteManagerGetPorts( USBRemoteManager *usbm, char *username )
{
	UserUSBDevices *actdev = NULL;
	
	if( usbm != NULL && username != NULL )
	{
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBDevices *)actdev->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
		}
	}
	else
	{
		return NULL;
	}
	return actdev;
}
