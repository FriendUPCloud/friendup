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
 *  Function releated to user remote usb devices
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#ifndef __CORE_USER_USB_REMOTE_USB_DEVICE_H__
#define __CORE_USER_USB_REMOTE_USB_DEVICE_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/user/user_session.h>
#include "usb_remote_device.h"

//#define MAX_REMOTE_USB_DEVICES_PER_USER 5

//
//
//

typedef struct UserUSBRemoteDevices
{
	char						*uusbrd_UserName;			// user name
	char						*uusbrd_RemoteUserName;		// user name used by remote device
	USBRemoteDevice				*uusbrd_Devices;
	pthread_mutex_t				uusbrd_Mutex;
	MinNode						node;
}UserUSBRemoteDevices;

//
//
//

UserUSBRemoteDevices *UserUSBRemoteDevicesNew( char *username, char *realName );

//
//
//

void UserUSBRemoteDevicesDelete( UserUSBRemoteDevices *dev );

//
//
//

int UserUSBRemoteDevicesAddPort( UserUSBRemoteDevices *udev, USBRemoteDevice *dev );

//
//
//

int UserUSBRemoteDevicesDeletePort( UserUSBRemoteDevices *dev, int port );

#endif // __CORE_USB_REMOTE_USB_DEVICE_H__
