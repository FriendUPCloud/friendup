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
 *  User USB manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#include "user_usb_devices.h"
#include "usb_device.h"
#include <core/types.h>
#include <mutex/mutex_manager.h>

/**
 * Create USB remote devices
 *
 * @param username user name to which devices are attached
 * @param remoteName remote user name to which devices are attached on destination server
 * @return return new UserUSBDevices structure when success, otherwise NULL
 */
UserUSBDevices *UserUSBDevicesNew( char *username, char *remoteName )
{
	UserUSBDevices *udev = NULL;
	if( ( udev = FCalloc( 1, sizeof(UserUSBDevices) ) ) != NULL )
	{
		udev->uusbd_UserName = StringDuplicate( username );
		udev->uusbd_RemoteUserName = StringDuplicate( remoteName );
		
		pthread_mutex_init( &(udev->uusbd_Mutex), NULL );
	}
	return udev;
}

/**
 * Delete User USB devices
 *
 * @param udev pointer to UserUSBDevices
 */
void UserUSBDevicesDelete( UserUSBDevices *udev )
{
	if( udev != NULL )
	{
		int i;
		USBDevice *actDev = udev->uusbd_Devices;
		USBDevice *remDev = udev->uusbd_Devices;
		
		while( actDev != NULL )
		{
			remDev = actDev;
			actDev = (USBDevice *)actDev->node.mln_Succ;
			
			USBDeviceDelete( remDev );
		}
		
		pthread_mutex_destroy( &(udev->uusbd_Mutex) );
		
		if( udev->uusbd_UserName != NULL )
		{
			FFree( udev->uusbd_UserName );
		}
		if( udev->uusbd_RemoteUserName != NULL )
		{
			FFree( udev->uusbd_RemoteUserName );
		}
		
		FFree( udev );
	}
}

/**
 * Add device to user list
 * 
 * @param udev pointer to UserUSBDevices
 * @param dev device which will be added to user list
 * @return 0 when success, otherwise error number
 */
int UserUSBDevicesAddPort( UserUSBDevices *udev, USBDevice *dev )
{
	if( udev != NULL )
	{
		DEBUG("[UserUSBRemoteDevicesAddPort] add devices by port\n");
		if( FRIEND_MUTEX_LOCK( &(udev->uusbd_Mutex ) ) == 0 )
		{
			dev->node.mln_Succ = (MinNode *) udev->uusbd_Devices;
			udev->uusbd_Devices = dev;
			FRIEND_MUTEX_UNLOCK( &(udev->uusbd_Mutex ) );
		}
		
		DEBUG("[UserUSBRemoteDevicesAddPort] add devices by port, end\n");
	}
	return 0;
}


/**
 * Delete USB port by Port
 * 
 * @param udev pointer to UserUSBDevices
 * @param port ip device port
 * @return 0 when success, otherwise error number
 */
int UserUSBDevicesDeletePort( UserUSBDevices *udev, int port )
{
	if( udev != NULL )
	{
		DEBUG("[UserUSBRemoteDevicesDeletePort] delete devices by port\n");
		USBDevice *actDev = udev->uusbd_Devices;
		USBDevice *remDev = udev->uusbd_Devices;
		
		if( FRIEND_MUTEX_LOCK( &(udev->uusbd_Mutex ) ) == 0 )
		{
			if( udev->uusbd_Devices != NULL && udev->uusbd_Devices->usbd_IPPort == port )
			{
				udev->uusbd_Devices = (USBDevice *)udev->uusbd_Devices->node.mln_Succ;
				USBDeviceDelete( remDev );
				DEBUG("[UserUSBRemoteDevicesDeletePort] removed first device\n");
			}
			else
			{
				USBDevice *prevDev = udev->uusbd_Devices;
			
				while( actDev != NULL )
				{
					prevDev = actDev;
					actDev = (USBDevice *)actDev->node.mln_Succ;
			
					if( actDev != NULL && actDev->usbd_IPPort == port )
					{
						DEBUG("[UserUSBRemoteDevicesDeletePort] delete devices by port, next position\n");
						prevDev->node.mln_Succ = actDev->node.mln_Succ;
						USBDeviceDelete( actDev );
					}
				}
			}
			FRIEND_MUTEX_UNLOCK( &(udev->uusbd_Mutex ) );
		}
		DEBUG("[UserUSBRemoteDevicesDeletePort] delete devices by port, end\n");
	}
	return 0;
}
