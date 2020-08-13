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

//#define MAX_REMOTE_USB_DEVICES_PER_USER 5

/*
CREATE TABLE IF NOT EXISTS `FUSBRemoteDevice` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `USBID` bigint(32) NOT NULL,
  `State` bigint(16) NOT NULL,
  `Type` bigint(16) NOT NULL,
  `Name` varchar(512) DEFAULT NULL,
  `IPPort` bigint(16) NOT NULL,
  `Login` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `NetworkAddress` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

//
// Remote USB devices
//

typedef struct USBRemoteDevice
{
	FUQUAD 						usbrd_ID;					// id, internal FC
	FUQUAD						usbrd_USBID;				// USBID -> usbovernetwork
	int 						usbrd_State;				// connected or disconnected
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

void USBRemoteDeviceInit( USBRemoteDevice *d );

//
//
//

void USBRemoteDeviceDelete( USBRemoteDevice *dev );

//
//
//

static FULONG USBRemoteDeviceDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUSBRemoteDevice",       
    SQLT_STRUCTSIZE, sizeof( struct USBRemoteDevice ), 
	SQLT_IDINT,   (FULONG)"ID", offsetof( struct USBRemoteDevice, usbrd_ID ), 
	SQLT_INT,     (FULONG)"USBID", offsetof( struct USBRemoteDevice, usbrd_USBID ),
	SQLT_INT,     (FULONG)"State", offsetof( struct USBRemoteDevice, usbrd_State ),
	SQLT_INT,     (FULONG)"Type", offsetof( struct USBRemoteDevice, usbrd_Type ),
	SQLT_STR,     (FULONG)"Name",       offsetof( struct USBRemoteDevice, usbrd_Name ),
	SQLT_INT,     (FULONG)"IPPort", offsetof( struct USBRemoteDevice, usbrd_IPPort ),
	SQLT_STR,     (FULONG)"Login",   offsetof( struct USBRemoteDevice, usbrd_Login ),
	SQLT_STR,     (FULONG)"Password",   offsetof( struct USBRemoteDevice, usbrd_Password ),
	SQLT_STR,     (FULONG)"NetworkAddress",   offsetof( struct USBRemoteDevice, usbrd_NetworkAddress ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&USBRemoteDeviceInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct USBRemoteDevice, node ),
	SQLT_END 
};

#endif // __CORE_USB_REMOTE_USB_DEVICE_H__
