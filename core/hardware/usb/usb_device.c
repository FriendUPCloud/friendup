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
 *  USB devices manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2017
 */

#include "usb_device.h"

//
//
//

USBDevice *USBDeviceNew( )
{
	USBDevice *dev = NULL;
	if( ( dev = FCalloc( 1, sizeof(USBDevice) ) ) != NULL )
	{
		dev->usbd_ID = (FUQUAD)dev;
	}
	return dev;
}

//
//
//

void USBDeviceDelete( USBDevice *dev )
{
	if( dev != NULL )
	{
		if( dev->usbd_Name != NULL )
		{
			FFree( dev->usbd_Name );
		}
		if( dev->usbd_NetworkAddress != NULL )
		{
			FFree( dev->usbd_NetworkAddress );
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
		if (dev->usbd_LockUser != NULL)
		{
			return TRUE;
		}
	}
	return FALSE;
}

