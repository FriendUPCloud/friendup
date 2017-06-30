/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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