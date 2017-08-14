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

