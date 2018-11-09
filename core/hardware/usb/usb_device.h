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
 *  Function releated to hardware
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2017
 */

#ifndef __CORE_USB_USB_DEVICE_H__
#define __CORE_USB_USB_DEVICE_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/user/user_session.h>

enum{
	USB_DEVICE_PORT = 0,
	USB_DEVICE
};

enum{
	USB_DEVICE_STATE_DISCONNECTED = 0,
	USB_DEVICE_STATE_CONNECTED
};


typedef struct USBDevice
{
	FUQUAD 						usbd_ID;					// id, internal FC
	FUQUAD						usbd_USBID;				// USBID -> usbovernetwork
	int 						usbd_State;					// connected or disconnected
	int							usbd_Type;					// port or device
	UserSession					*usbd_LockUser;				// if != NULL, device is locked by user session
	char						*usbd_NetworkAddress;		// internet address
	int							usbd_IPPort;				// ip port
	char						*usbd_Name;
	MinNode						node;
}USBDevice;

//
//
//

USBDevice *USBDeviceNew( );

//
//
//

void USBDeviceDelete( USBDevice *dev );

//
//
//

FBOOL USBDeviceIsLocked(USBDevice *dev);

#endif // __CORE_USB_USB_DEVICE_H__