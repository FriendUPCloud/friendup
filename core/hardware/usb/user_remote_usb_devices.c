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
 *  User USB remote manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#include "user_remote_usb_devices.h"
#include "usb_remote_device.h"
#include <core/types.h>
#include <mutex/mutex_manager.h>

/**
 * Create USB remote devices
 *
 * @param username user name to which devices are attached
 * @param remoteName remote user name to which devices are attached on destination server
 * @return return new UserUSBRemoteDevices structure when success, otherwise NULL
 */
UserUSBRemoteDevices *UserUSBRemoteDevicesNew( char *username, char *remoteName )
{
	UserUSBRemoteDevices *udev = NULL;
	if( ( udev = FCalloc( 1, sizeof(UserUSBRemoteDevices) ) ) != NULL )
	{
		udev->uusbrd_UserName = StringDuplicate( username );
		udev->uusbrd_RemoteUserName = StringDuplicate( remoteName );
		
		pthread_mutex_init( &(udev->uusbrd_Mutex), NULL );
	}
	return udev;
}

/**
 * Delete User USB Remote devices
 *
 * @param udev pointer to UserUSBRemoteDevices
 */
void UserUSBRemoteDevicesDelete( UserUSBRemoteDevices *udev )
{
	if( udev != NULL )
	{
		int i;
		USBRemoteDevice *actDev = udev->uusbrd_Devices;
		USBRemoteDevice *remDev = udev->uusbrd_Devices;
		
		while( actDev != NULL )
		{
			remDev = actDev;
			actDev = (USBRemoteDevice *)actDev->node.mln_Succ;
			
			USBRemoteDeviceDelete( remDev );
		}
		
		pthread_mutex_destroy( &(udev->uusbrd_Mutex) );
		
		if( udev->uusbrd_UserName != NULL )
		{
			FFree( udev->uusbrd_UserName );
		}
		if( udev->uusbrd_RemoteUserName != NULL )
		{
			FFree( udev->uusbrd_RemoteUserName );
		}
		
		FFree( udev );
	}
}

/**
 * Add device to user list
 * 
 * @param udev pointer to UserUSBRemoteDevices
 * @param dev device which will be added to user list
 * @return 0 when success, otherwise error number
 */
int UserUSBRemoteDevicesAddPort( UserUSBRemoteDevices *udev, USBRemoteDevice *dev )
{
	if( udev != NULL )
	{
		DEBUG("[UserUSBRemoteDevicesAddPort] delete devices by port\n");
		if( FRIEND_MUTEX_LOCK( &(udev->uusbrd_Mutex ) ) == 0 )
		{
			dev->node.mln_Succ = (MinNode *) udev->uusbrd_Devices;
			udev->uusbrd_Devices = dev;
			FRIEND_MUTEX_UNLOCK( &(udev->uusbrd_Mutex ) );
		}
		
		DEBUG("[UserUSBRemoteDevicesAddPort] delete devices by port, end\n");
	}
	return 0;
}


/**
 * Delete USB port by Port
 * 
 * @param udev pointer to UserUSBRemoteDevices
 * @param port ip device port
 * @return 0 when success, otherwise error number
 */
int UserUSBRemoteDevicesDeletePort( UserUSBRemoteDevices *udev, int port )
{
	if( udev != NULL )
	{
		DEBUG("[UserUSBRemoteDevicesDeletePort] delete devices by port\n");
		USBRemoteDevice *actDev = udev->uusbrd_Devices;
		USBRemoteDevice *remDev = udev->uusbrd_Devices;
		
		if( FRIEND_MUTEX_LOCK( &(udev->uusbrd_Mutex ) ) == 0 )
		{
			if( udev->uusbrd_Devices != NULL && udev->uusbrd_Devices->usbrd_IPPort == port )
			{
				udev->uusbrd_Devices = (USBRemoteDevice *)udev->uusbrd_Devices->node.mln_Succ;
				USBRemoteDeviceDelete( remDev );
				DEBUG("[UserUSBRemoteDevicesDeletePort] removed first device\n");
			}
			else
			{
				USBRemoteDevice *prevDev = udev->uusbrd_Devices;
			
				while( actDev != NULL )
				{
					prevDev = actDev;
					actDev = (USBRemoteDevice *)actDev->node.mln_Succ;
			
					if( actDev != NULL && actDev->usbrd_IPPort == port )
					{
						DEBUG("[UserUSBRemoteDevicesDeletePort] delete devices by port, next position\n");
						prevDev->node.mln_Succ = actDev->node.mln_Succ;
						USBRemoteDeviceDelete( actDev );
					}
				}
			}
			FRIEND_MUTEX_UNLOCK( &(udev->uusbrd_Mutex ) );
		}
		DEBUG("[UserUSBRemoteDevicesDeletePort] delete devices by port, end\n");
	}
	return 0;
}
