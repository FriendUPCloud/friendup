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
 *  Function releated to user usb devices
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#ifndef __CORE_USER_USB_USB_DEVICE_H__
#define __CORE_USER_USB_USB_DEVICE_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/user/user_session.h>
#include "usb_device.h"

//
//
//

typedef struct UserUSBDevices
{
	char						*uusbd_UserName;			// user name
	char						*uusbd_RemoteUserName;		// user name used by remote device
	USBDevice					*uusbd_Devices;
	pthread_mutex_t				uusbd_Mutex;
	MinNode						node;
}UserUSBDevices;

//
//
//

UserUSBDevices *UserUSBDevicesNew( char *username, char *realName );

//
//
//

void UserUSBDevicesDelete( UserUSBDevices *dev );

//
//
//

int UserUSBDevicesAddPort( UserUSBDevices *udev, USBDevice *dev );

//
//
//

int UserUSBDevicesDeletePort( UserUSBDevices *dev, int port );

#endif // __CORE_USB_USB_DEVICE_H__
