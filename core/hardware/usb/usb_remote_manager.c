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
		UserUSBRemoteDevices *dev = usbm->usbrm_UserDevices;
		while (dev != NULL)
		{
			UserUSBRemoteDevices *remd = dev;
			dev = (UserUSBRemoteDevices *)dev->node.mln_Succ;

			UserUSBRemoteDeviceDelete( remd );
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
USBRemoteDevice *USBRemoteManagerCreatePort( USBRemoteManager *usbm, char *username, int *error )
{
	USBRemoteDevices *retdev = NULL;
	UserUSBRemoteDevice *actdev = NULL;
	*error = 0;
	
	if( usbm != NULL && username != NULL )
	{
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbrd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBRemoteDevices *)actdev->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
		}
		// try to find devices attached to user
		
		// device found
		if( actdev != NULL )
		{
			int i;
			*error = 1;	// all ports used
			for( i=0 ; i < MAX_REMOTE_USB_DEVICES_PER_USER ; i++ )
			{
				if( actdev->uusbrd_Devices[ i ] == NULL )
				{
					*error = 0;	// we found empty place
					break;
				}
			}
		}
		else
		{
			// username, windows user name, internet address
			actdev = UserUSBRemoteDeviceNew( username, NULL, NULL );
			if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
			{
				// add user devices to list
				actdev->node.mln_Succ = (MinNode *)usbm->usbrm_UserDevices;
				usbm->usbrm_UserDevices = actdev;
				FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
			}
		}
	}
	else
	{
		return NULL;
	}
	return retdev;
}

/**
 * Delete USB port
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
		UserUSBRemoteDevices *actdev = NULL;
		
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbrd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBRemoteDevices *)actdev->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(usbm->usbrm_Mutex ) );
		}
		
		if( actdev != NULL )
		{
			UserUSBRemoteDeviceDeletePort( actdev, id );
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
UserUSBRemoteDevices *USBRemoteManagerGetPorts( USBRemoteManager *usbm, char *username )
{
	UserUSBRemoteDevices *actdev = NULL;
	
	if( usbm != NULL && username != NULL )
	{
		if( ( FRIEND_MUTEX_LOCK( &(usbm->usbrm_Mutex ) ) ) == 0 )
		{
			actdev = usbm->usbrm_UserDevices;
			while( actdev != NULL )
			{
				if( strcmp( actdev->uusbrd_UserName, username ) == 0 )
				{
					// found user devices
					break;
				}
				actdev = (UserUSBRemoteDevices *)actdev->node.mln_Succ;
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
