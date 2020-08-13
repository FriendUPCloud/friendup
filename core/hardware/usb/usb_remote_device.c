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
 *  USB Remote Device
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#include "usb_remote_device.h"

/**
 * Create USB remote device
 *
 * @return return new USBRemoteDevice structure when success, otherwise NULL
 */
USBRemoteDevice *USBRemoteDeviceNew( )
{
	USBRemoteDevice *dev = NULL;
	if( ( dev = FCalloc( 1, sizeof(USBRemoteDevice) ) ) != NULL )
	{
		dev->usbrd_ID = (FUQUAD)dev;
	}
	return dev;
}

/**
 * Init USB remote device
 *
 * @param d usb remote device pointer
 */
void USBRemoteDeviceInit( USBRemoteDevice *d )
{
	
}

/**
 * Delete USB Remote device
 *
 * @param dev pointer to USBRemoteDevice
 */
void USBRemoteDeviceDelete( USBRemoteDevice *dev )
{
	if( dev != NULL )
	{
		if( dev->usbrd_Name != NULL )
		{
			FFree( dev->usbrd_Name );
		}
		if( dev->usbrd_Login != NULL )
		{
			FFree( dev->usbrd_Login );
		}
		if( dev->usbrd_Password != NULL )
		{
			FFree( dev->usbrd_Password );
		}
		if( dev->usbrd_NetworkAddress != NULL )
		{
			FFree( dev->usbrd_NetworkAddress );
		}
		FFree( dev );
	}
}


