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

#ifndef __HARDWARE_USB_USB_MANAGER_H__
#define __HARDWARE_USB_USB_MANAGER_H__

#include <core/types.h>
#include "usb_device.h"
#include <network/http.h>

#ifdef _WIN32
typedef void(__stdcall *FNOnChangeDevList) ();
extern FNOnChangeDevList pOnChangeDevList;
#endif

typedef struct USBManager
{
	int							usbm_MinIPPort;		// minimal ip port number
	int							usbm_MaxIPPort;		// maximum ip port number
	int							usbm_IPPort;		// ip port index
	int							usbm_Port;			// internal port index
	int							usbm_MaxPort;		// maximum ports value
	
	USBDevice 					*usbm_Devices;		// USB Devices / this is list
	USBDevice					**usbm_Ports;		// USB Ports -> callbacks / this is table
	
	void						*usbm_Client;		// LPVOID - usb client devices
	void						*usbm_Server;		// LPVOID - usb server devices
	
	void 						*usbm_LibPtr;

	int(*CLibInit)();

	FBOOL(*CServerCreateEnumUsbDev)(void **con);

	FBOOL(*CServerRemoveEnumUsbDev)(void *con);

	FBOOL(*CServerGetUsbDevFromHub)(void *con, void *hcon, int index, void** devcon);

	FBOOL(*CServerUsbDevIsHub)(void *con, void *hcon);

	FBOOL(*CServerUsbDevIsShared)(void *con, void *hcon);

	FBOOL(*CServerUsbDevIsConnected)(void *con, void *hcon);

	FBOOL(*CServerGetUsbDevName)(void *con, void *hcon, char **string);

	FBOOL(*CServerShareUsbDev)(void *pcont, void *devcont, char *netset, char *desc, FBOOL auth, char *pass, FBOOL crypt, FBOOL compress);

	FBOOL(*CServerUnshareUsbDev)(void *pContext, void *pDevContext);

	FBOOL(*CServerGetUsbDevStatus)(void *pContext, void *pDevContext, long *piState, char **strHostConnected);

	FBOOL(*CServerGetSharedUsbDevNetSettings)(void *pContext, void *pDevContext, char **strParam);

	FBOOL(*CServerGetSharedUsbDevIsCrypt)(void *pContext, void *pDevContext, FBOOL *bCrypt);

	FBOOL(*CServerGetSharedUsbDevRequiresAuth)(void *pContext, void *pDevContext, FBOOL *bAuth);

#ifdef _WIN32
	void(*CSetCallBackOnChangeDevList)(FNOnChangeDevList pFunc);
#else
	void(*CSetCallBackOnChangeDevList)(void * pFunc);
#endif

	FBOOL(*CClientEnumAvailRemoteDevOnServer)(char *szServer, void **ppFindContext);

	FBOOL(*CClientEnumAvailRemoteDev)(void **ppFindContext);

	FBOOL(*CClientRemoveEnumOfRemoteDev)(void *pFindContext);

	FBOOL(*CClientGetRemoteDevNetSettings)(void *pFindContext, long iIndex, char **NetSettings);

	FBOOL(*CClientGetRemoteDevName)(void *pFindContext, long iIndex, char **strName);

	FBOOL(*CClientAddRemoteDevManually)(char *szNetSettings);

	FBOOL(*CClientAddRemoteDev)(void *pClientContext, long iIndex);

	FBOOL(*CClientStartRemoteDev)(void * pClientContext, long iIndex, FBOOL bAutoReconnect, char *strPassword);

	FBOOL(*CClientStopRemoteDev)(void *pClientContext, long iIndex);

	FBOOL(*CClientRemoveRemoteDev)(void *pClientContext, long iIndex);

	FBOOL(*CClientGetStateRemoteDev)(void *pClientContext, long iIndex, long *piState, char **RemoteHost);

	FBOOL(*CClientTrafficRemoteDevIsEncrypted)(void *pClientContext, long iIndex, FBOOL *bCrypt);

	FBOOL(*CClientRemoteDevRequiresAuth)(void *pClientContext, long iIndex, FBOOL *bAuth);

	FBOOL(*CClientGetStateSharedDevice)(void *pClientContext, long iIndex, long *piState, char **RemoteHost);

	FBOOL(*CClientEnumRemoteDevOverRdp)(void **ppFindContext);

	FBOOL(*CServerDisconnectRemoteDev)(void *pContext, void *pDevContext);

	FBOOL(*CClientTrafficRemoteDevIsCompressed)(void *pClientContext, long iIndex, FBOOL *bCompress);

	FBOOL(*CServerGetSharedUsbDevIsCompressed)(void *pContext, void *pDevContext, FBOOL *bCompress);
}USBManager;

//
//
//

USBManager *USBManagerNew();

//
//
//

void USBManagerDelete( USBManager *usbm );

//
//
//

int USBManagerCreatePorts( USBManager *usbm, FBOOL connected );

//
//
//

void USBManagerDeletePorts( USBManager *usbm );

//
//
//

USBDevice *USBManagerLockPort( USBManager *usbm, UserSession *session );

//
//
//

int USBManagerUnLockPort( USBManager *usbm, USBDevice *dev );

//
//
//

USBDevice *USBManagerGetDeviceByID(USBManager *usbm, FUQUAD id );

//
//
//

int USBManagerCreateDevice( USBManager *usbm, FBOOL connected );

//
//
//

void USBManagerDeleteDevice( USBManager *usbm, FUQUAD id );

//
//
//

void USBManagerDeviceChange();

//
//
//

void USBManagerGetAllCreatedPorts( USBManager *usbm );

//
//
//

int USBManagerAddNewPort(USBManager *usbm, char *port);

#endif // __HARDWARE_USB_USB_MANAGER_H__