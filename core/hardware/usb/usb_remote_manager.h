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
 *  USB Remote devices manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#ifndef __HARDWARE_USB_REMOTE_USB_MANAGER_H__
#define __HARDWARE_USB_REMOTE_USB_MANAGER_H__

#include <core/types.h>
#include "usb_device.h"
#include <network/http.h>
#include "user_remote_usb_devices.h"

//
// USB Remote Manager
//

typedef struct USBRemoteManager
{
	UserUSBRemoteDevices 		*usbrm_UserDevices;		// USB Devices / this is list

	pthread_mutex_t				usbrm_Mutex;		// mutex

}USBRemoteManager;

//
//
//

USBRemoteManager *USBRemoteManagerNew();

//
//
//

void USBRemoteManagerDelete( USBRemoteManager *usbm );

//
//
//

USBRemoteDevice *USBRemoteManagerCreatePort( USBRemoteManager *usbm, char *username, int *error );

//
//
//

int USBRemoteManagerDeletePort( USBRemoteManager *usbm, char *username, FULONG id );

//
//
//

UserUSBRemoteDevices *USBRemoteManagerGetPorts( USBRemoteManager *usbm, char *username );

#endif // __HARDWARE_USB_USB_MANAGER_H__
