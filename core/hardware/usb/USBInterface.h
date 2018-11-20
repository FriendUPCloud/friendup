/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
//#include <cstring>

#define U2EC_STATE_DISCONNECT 0
#define U2EC_STATE_WAITING 1
#define U2EC_STATE_CONNECTED 2
#define U2EC_STATE_CONNECTED_FROM_RDP 3

#ifndef FBOOL
#define FBOOL int
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 1
#endif

//#ifdef U2EC_EXPORTS
//#define FUNC_API __declspec(dllexport)
//#else
#define FUNC_API __declspec(dllimport)
//#endif

typedef void(__stdcall *FNOnChangeDevList) ();
extern FNOnChangeDevList pOnChangeDevList;

#ifdef __cplusplus
extern "C"
{
#endif
	 FUNC_API int CLibInit();

	 FUNC_API FBOOL CServerCreateEnumUsbDev(void **con);

	 FUNC_API FBOOL CServerRemoveEnumUsbDev(void *con);

	 FUNC_API FBOOL CServerGetUsbDevFromHub(void *con, void *hcon, int index, void** devcon);

	 FUNC_API FBOOL CServerUsbDevIsHub(void *con, void *hcon);

	 FUNC_API FBOOL CServerUsbDevIsShared(void *con, void *hcon);

	 FUNC_API FBOOL CServerUsbDevIsConnected(void *con, void *hcon);

	 FUNC_API FBOOL CServerGetUsbDevName(void *con, void *hcon, char **string);

	 FUNC_API FBOOL CServerShareUsbDev(void *pcont, void *devcont, char *netset, char *desc, FBOOL auth, char *pass, FBOOL crypt, FBOOL compress);

	 FUNC_API FBOOL CServerUnshareUsbDev(void *pContext, void *pDevContext);

	 FUNC_API FBOOL CServerGetUsbDevStatus(void *pContext, void *pDevContext, long *piState, char **strHostConnected);

	 FUNC_API FBOOL CServerGetSharedUsbDevNetSettings(void *pContext, void *pDevContext, char **strParam);

	 FUNC_API FBOOL CServerGetSharedUsbDevIsCrypt(void *pContext, void *pDevContext, FBOOL *bCrypt);

	 FUNC_API FBOOL CServerGetSharedUsbDevRequiresAuth(void *pContext, void *pDevContext, FBOOL *bAuth);

	 FUNC_API void CSetCallBackOnChangeDevList(FNOnChangeDevList pFunc);

	 FUNC_API FBOOL CClientEnumAvailRemoteDevOnServer(char *szServer, void **ppFindContext);

	 FUNC_API FBOOL CClientEnumAvailRemoteDev(void **ppFindContext);

	 FUNC_API FBOOL CClientRemoveEnumOfRemoteDev(void *pFindContext);

	 FUNC_API FBOOL CClientGetRemoteDevNetSettings(void *pFindContext, long iIndex, char **NetSettings);

	 FUNC_API FBOOL CClientGetRemoteDevName(void *pFindContext, long iIndex, char **strName);

	 FUNC_API FBOOL CClientAddRemoteDevManually(char *szNetSettings);

	 FUNC_API FBOOL CClientAddRemoteDev(void *pClientContext, long iIndex);

	 FUNC_API FBOOL CClientStartRemoteDev(void * pClientContext, long iIndex, FBOOL bAutoReconnect, char *strPassword);

	 FUNC_API FBOOL CClientStopRemoteDev(void *pClientContext, long iIndex);

	 FUNC_API FBOOL CClientRemoveRemoteDev(void *pClientContext, long iIndex);

	 FUNC_API FBOOL CClientGetStateRemoteDev(void *pClientContext, long iIndex, long *piState, char **RemoteHost);

	 FUNC_API FBOOL CClientTrafficRemoteDevIsEncrypted(void *pClientContext, long iIndex, FBOOL *bCrypt);

	 FUNC_API FBOOL CClientRemoteDevRequiresAuth(void *pClientContext, long iIndex, FBOOL *bAuth);

	 FUNC_API FBOOL CClientGetStateSharedDevice(void *pClientContext, long iIndex, long *piState, char **RemoteHost);

	 FUNC_API FBOOL CClientEnumRemoteDevOverRdp(void **ppFindContext);

	 FUNC_API FBOOL CServerDisconnectRemoteDev(void *pContext, void *pDevContext);

	 FUNC_API FBOOL CClientTrafficRemoteDevIsCompressed(void *pClientContext, long iIndex, FBOOL *bCompress);

	 FUNC_API FBOOL CServerGetSharedUsbDevIsCompressed(void *pContext, void *pDevContext, FBOOL *bCompress);
#ifdef __cplusplus
	}
#endif
