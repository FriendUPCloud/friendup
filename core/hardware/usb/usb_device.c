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
 *  USB Device
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#include "usb_device.h"

/**
 * Create USB device
 *
 * @return return new USBDevice structure when success, otherwise NULL
 */
USBDevice *USBDeviceNew( )
{
	USBDevice *dev = NULL;
	if( ( dev = FCalloc( 1, sizeof(USBDevice) ) ) != NULL )
	{
		dev->usbd_ID = (FUQUAD)dev;
		dev->usbd_CreateTime = time( NULL );
	}
	return dev;
}

/**
 * Init USB device
 *
 * @param d usb device pointer
 */
void USBDeviceInit( USBDevice *d )
{
	
}

/**
 * Delete USB device
 *
 * @param dev pointer to USBDevice
 */
void USBDeviceDelete( USBDevice *dev )
{
	DEBUG("[USBDeviceDelete] release USBDevice resources\n");
	if( dev != NULL )
	{
		if( dev->usbd_Name != NULL )
		{
			FFree( dev->usbd_Name );
		}
		if( dev->usbd_Login != NULL )
		{
			FFree( dev->usbd_Login );
		}
		if( dev->usbd_Password != NULL )
		{
			FFree( dev->usbd_Password );
		}
		if( dev->usbd_NetworkAddress != NULL )
		{
			FFree( dev->usbd_NetworkAddress );
		}
		if( dev->usbd_UserName != NULL )
		{
			FFree( dev->usbd_UserName );
		}
		if( dev->usbd_GuacamoleUserName != NULL )
		{
			FFree( dev->usbd_GuacamoleUserName );
		}
		if( dev->usbd_Serial != NULL )
		{
			FFree( dev->usbd_Serial );
		}
		FFree( dev );
	}
}

//
//
//

FBOOL USBDeviceIsLocked(USBDevice *dev)
{
	if (dev != NULL)
	{
        /*
		if (dev->usbd_LockUser != NULL)
		{
			return TRUE;
		}
		*/
	}
	return FALSE;
}

