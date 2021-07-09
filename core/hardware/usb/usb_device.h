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

/*
CREATE TABLE IF NOT EXISTS `FUSBDevice` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `USBID` bigint(32) NOT NULL,
  `State` bigint(16) NOT NULL,
  `Type` bigint(16) NOT NULL,
  `Name` varchar(512) DEFAULT NULL,
  `DeviceName` varchar(512) DEFAULT NULL,
  `UserName` varchar(512) DEFAULT NULL,
  `GuacUserName` varchar(512) DEFAULT NULL,
  `Serial` varchar(32) DEFAULT NULL,
  `IPPort` bigint(16) NOT NULL,
  `Login` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `NetworkAddress` varchar(255) DEFAULT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

//
// USB device
//

typedef struct USBDevice
{
	FUQUAD 						usbd_ID;					// id, internal FC
	FUQUAD						usbd_USBID;				// USBID -> usbovernetwork
	int 						usbd_State;				// connected or disconnected
	int							usbd_Type;					// port or device
	
	char						*usbd_Name;					// port name <nick>_<port>
	char						*usbd_DeviceName;			// mounted device name
	int							usbd_IPPort;				// ip port
	int							usbd_Compressed;			// if connection is using compression
	char						*usbd_Login;				// login and password (if set)
	char						*usbd_Password;
	char						*usbd_NetworkAddress;		// internet address
	char						*usbd_UserName;				// user name to which device belong
	char						*usbd_GuacamoleUserName;	// user name provided by guacamole
	char						*usbd_Serial;				// device serial ID
	time_t						usbd_CreateTime;			// create time timestamp
	
	pthread_mutex_t				usbd_Mutex;		// mutex
	
	MinNode						node;
}USBDevice;

//
//
//

USBDevice *USBDeviceNew( );

//
//
//

void USBDeviceInit( USBDevice *d );

//
//
//

void USBDeviceDelete( USBDevice *dev );

//
//
//

static FULONG USBDeviceDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUSBDevice",       
    SQLT_STRUCTSIZE, sizeof( struct USBDevice ), 
	SQLT_IDINT,   (FULONG)"ID", offsetof( struct USBDevice, usbd_ID ), 
	SQLT_INT,     (FULONG)"USBID", offsetof( struct USBDevice, usbd_USBID ),
	SQLT_INT,     (FULONG)"State", offsetof( struct USBDevice, usbd_State ),
	SQLT_INT,     (FULONG)"Type", offsetof( struct USBDevice, usbd_Type ),
	SQLT_STR,     (FULONG)"Name",       offsetof( struct USBDevice, usbd_Name ),
	SQLT_STR,     (FULONG)"DeviceName",       offsetof( struct USBDevice, usbd_DeviceName ),
	SQLT_INT,     (FULONG)"IPPort", offsetof( struct USBDevice, usbd_IPPort ),
	SQLT_STR,     (FULONG)"Login",   offsetof( struct USBDevice, usbd_Login ),
	SQLT_STR,     (FULONG)"Password",   offsetof( struct USBDevice, usbd_Password ),
	SQLT_STR,     (FULONG)"NetworkAddress",   offsetof( struct USBDevice, usbd_NetworkAddress ),
	SQLT_STR,     (FULONG)"UserName",   offsetof( struct USBDevice, usbd_UserName ),
	SQLT_STR,     (FULONG)"GuacUserName",   offsetof( struct USBDevice, usbd_GuacamoleUserName ),
	SQLT_STR,     (FULONG)"Serial",   offsetof( struct USBDevice, usbd_Serial ),
	SQLT_INT,     (FULONG)"CreateTime", offsetof( struct USBDevice, usbd_CreateTime ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&USBDeviceInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct USBDevice, node ),
	SQLT_END 
};

#endif // __CORE_USB_USB_DEVICE_H__
