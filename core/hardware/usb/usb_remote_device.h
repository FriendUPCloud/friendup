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
 *  Function releated to remote usb devices
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#ifndef __CORE_USB_REMOTE_USB_DEVICE_H__
#define __CORE_USB_REMOTE_USB_DEVICE_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/user/user_session.h>

enum{
	USB_REMOTE_DEVICE_PORT = 0,
	USB_REMOTE_DEVICE
};

enum{
	USB_REMOTE_DEVICE_STATE_DISCONNECTED = 0,
	USB_REMOTE_DEVICE_STATE_CONNECTED
};

#define MAX_REMOTE_USB_DEVICES_PER_USER 5

//
// Remote USB devices
//

typedef struct USBRemoteDevice
{
	FUQUAD 						usbrd_ID;					// id, internal FC
	FUQUAD						usbrd_USBID;				// USBID -> usbovernetwork
	int 						usbrd_State;					// connected or disconnected
	int							usbrd_Type;					// port or device
	
	char						*usbrd_Name;
	int							usbrd_IPPort;				// ip port
	char						*usbrd_Login;				// login and password (if set)
	char						*usbrd_Password;
	char						*usbrd_NetworkAddress;		// internet address
	
	pthread_mutex_t				usbrd_Mutex;		// mutex
	
	MinNode						node;
}USBRemoteDevice;

//
//
//

USBRemoteDevice *USBRemoteDeviceNew( );

//
//
//

void USBRemoteDeviceDelete( USBRemoteDevice *dev );

#endif // __CORE_USB_REMOTE_USB_DEVICE_H__
