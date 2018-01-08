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
*  USB C interface
*
*  @author PS (Pawel Stefanski)
*  @date created 18/01/2017
*/

//
//
//

#include <windows.h>
#include <cstring>
#include "USBInterface.h"
#include <cstring>
#include "atlstr.h"

#define U2EC_STATE_DISCONNECT 0
#define U2EC_STATE_WAITING 1
#define U2EC_STATE_CONNECTED 2
#define U2EC_STATE_CONNECTED_FROM_RDP 3

BOOL(WINAPI *ServerCreateEnumUsbDev) (PVOID *ppContext);

BOOL(WINAPI *ServerRemoveEnumUsbDev) (PVOID pContext);

BOOL(WINAPI *ServerGetUsbDevFromHub) (PVOID pContext, PVOID pHubContext, int iIndex, PVOID *ppDevContext);

BOOL(WINAPI *ServerUsbDevIsHub) (PVOID pContext, PVOID pDevContext);

BOOL(WINAPI *ServerUsbDevIsShared) (PVOID pContext, PVOID pDevContext);

BOOL(WINAPI *ServerUsbDevIsConnected) (PVOID pContext, PVOID pDevContext);

BOOL(WINAPI *ServerGetUsbDevName) (PVOID pContext, PVOID pDevContext, VARIANT *strName);

BOOL(WINAPI *ServerShareUsbDev) (PVOID pContext, PVOID pDevContext, VARIANT varNetSettings, VARIANT strDescription, BOOL bAuth, VARIANT strPassword, BOOL bCrypt, BOOL bCompress);

BOOL(WINAPI *ServerUnshareUsbDev) (PVOID pContext, PVOID pDevContext);

BOOL(WINAPI *ServerGetUsbDevStatus) (PVOID pContext, PVOID pDevContext, LONG *piState, VARIANT *strHostConnected);

BOOL(WINAPI *ServerGetSharedUsbDevNetSettings) (PVOID pContext, PVOID pDevContext, VARIANT *strParam);

BOOL(WINAPI *ServerGetSharedUsbDevIsCrypt) (PVOID pContext, PVOID pDevContext, BOOL *bCrypt);

BOOL(WINAPI *ServerGetSharedUsbDevRequiresAuth) (PVOID pContext, PVOID pDevContext, BOOL *bAuth);

void(WINAPI *SetCallBackOnChangeDevList) (FNOnChangeDevList pFunc);

BOOL(WINAPI *ClientEnumAvailRemoteDevOnServer) (VARIANT szServer, PVOID *ppFindContext);

BOOL(WINAPI *ClientEnumAvailRemoteDev) (PVOID *ppFindContext);

BOOL(WINAPI *ClientRemoveEnumOfRemoteDev) (PVOID pFindContext);

BOOL(WINAPI *ClientGetRemoteDevNetSettings) (PVOID pFindContext, long iIndex, VARIANT *NetSettings);

BOOL(WINAPI *ClientGetRemoteDevName) (PVOID pFindContext, long iIndex, VARIANT *strName);

BOOL(WINAPI *ClientAddRemoteDevManually) (VARIANT szNetSettings);

BOOL(WINAPI *ClientAddRemoteDev) (PVOID pClientContext, long iIndex);

BOOL(WINAPI *ClientStartRemoteDev) (PVOID pClientContext, long iIndex, BOOL bAutoReconnect, VARIANT strPassword);

BOOL(WINAPI *ClientStopRemoteDev) (PVOID pClientContext, long iIndex);

BOOL(WINAPI *ClientRemoveRemoteDev) (PVOID pClientContext, long iIndex);

BOOL(WINAPI *ClientGetStateRemoteDev) (PVOID pClientContext, long iIndex, LONG *piState, VARIANT *RemoteHost);

BOOL(WINAPI *ClientTrafficRemoteDevIsEncrypted) (PVOID pClientContext, long iIndex, BOOL *bCrypt);

BOOL(WINAPI *ClientRemoteDevRequiresAuth) (PVOID pClientContext, long iIndex, BOOL *bAuth);

BOOL(WINAPI *ClientGetStateSharedDevice)  (PVOID pClientContext, long iIndex, LONG *piState, VARIANT *RemoteHost);

BOOL(WINAPI *ClientEnumRemoteDevOverRdp) (PVOID *ppFindContext);

BOOL(WINAPI *ServerDisconnectRemoteDev) (PVOID pContext, PVOID pDevContext);

BOOL(WINAPI *ClientTrafficRemoteDevIsCompressed) (PVOID pClientContext, long iIndex, BOOL *bCompress);

BOOL(WINAPI *ServerGetSharedUsbDevIsCompressed) (PVOID pContext, PVOID pDevContext, BOOL *bCompress);

//
//
//

int CLibInit()
{
	HMODULE lib = LoadLibrary(L"u2ec64.dll");

	if (lib != NULL)
	{
		ServerCreateEnumUsbDev = (BOOL(WINAPI *)(void**))GetProcAddress(lib, "ServerCreateEnumUsbDev");
		ServerRemoveEnumUsbDev = (BOOL(WINAPI *)(PVOID))GetProcAddress(lib, "ServerRemoveEnumUsbDev");
		ServerGetUsbDevFromHub = (BOOL(WINAPI *)(PVOID, PVOID, int, void**))GetProcAddress(lib, "ServerGetUsbDevFromHub");
		ServerUsbDevIsHub = (BOOL(WINAPI *)(PVOID, PVOID))GetProcAddress(lib, "ServerUsbDevIsHub");
		ServerUsbDevIsShared = (BOOL(WINAPI *)(PVOID, PVOID))GetProcAddress(lib, "ServerUsbDevIsShared");
		ServerUsbDevIsConnected = (BOOL(WINAPI *)(PVOID, PVOID))GetProcAddress(lib, "ServerUsbDevIsConnected");
		ServerGetUsbDevName = (BOOL(WINAPI *)(PVOID, PVOID, VARIANT*))GetProcAddress(lib, "ServerGetUsbDevName");
		ServerShareUsbDev = (BOOL(WINAPI *)(PVOID, PVOID, VARIANT, VARIANT, BOOL, VARIANT, BOOL, BOOL))GetProcAddress(lib, "ServerShareUsbDev");
		ServerUnshareUsbDev = (BOOL(WINAPI *)(PVOID, PVOID))GetProcAddress(lib, "ServerUnshareUsbDev");
		ServerGetUsbDevStatus = (BOOL(WINAPI *)(PVOID, PVOID, LONG*, VARIANT*))GetProcAddress(lib, "ServerGetUsbDevStatus");
		ServerGetSharedUsbDevNetSettings = (BOOL(WINAPI *)(PVOID, PVOID, VARIANT*))GetProcAddress(lib, "ServerGetSharedUsbDevNetSettings");
		ServerGetSharedUsbDevIsCrypt = (BOOL(WINAPI *)(PVOID, PVOID, BOOL*))GetProcAddress(lib, "ServerGetSharedUsbDevIsCrypt");
		ServerGetSharedUsbDevRequiresAuth = (BOOL(WINAPI *)(PVOID, PVOID, BOOL*))GetProcAddress(lib, "ServerGetSharedUsbDevRequiresAuth");
		SetCallBackOnChangeDevList = (void(WINAPI *)(FNOnChangeDevList))GetProcAddress(lib, "SetCallBackOnChangeDevList");
		ClientEnumAvailRemoteDevOnServer = (BOOL(WINAPI *)(VARIANT, void**))GetProcAddress(lib, "ClientEnumAvailRemoteDevOnServer");
		ClientEnumAvailRemoteDev = (BOOL(WINAPI *)(void**))GetProcAddress(lib, "ClientEnumAvailRemoteDev");
		ClientRemoveEnumOfRemoteDev = (BOOL(WINAPI *)(PVOID))GetProcAddress(lib, "ClientRemoveEnumOfRemoteDev");
		ClientGetRemoteDevNetSettings = (BOOL(WINAPI *)(PVOID, long int, VARIANT*))GetProcAddress(lib, "ClientGetRemoteDevNetSettings");
		ClientGetRemoteDevName = (BOOL(WINAPI *)(PVOID, long int, VARIANT*))GetProcAddress(lib, "ClientGetRemoteDevName");
		ClientAddRemoteDevManually = (BOOL(WINAPI *)(VARIANT))GetProcAddress(lib, "ClientAddRemoteDevManually");
		ClientAddRemoteDev = (BOOL(WINAPI *)(PVOID, long int))GetProcAddress(lib, "ClientAddRemoteDev");
		ClientStartRemoteDev = (BOOL(WINAPI *)(PVOID, long int, BOOL, VARIANT))GetProcAddress(lib, "ClientStartRemoteDev");
		ClientStopRemoteDev = (BOOL(WINAPI *)(PVOID, long int))GetProcAddress(lib, "ClientStopRemoteDev");
		ClientRemoveRemoteDev = (BOOL(WINAPI *)(PVOID, long int))GetProcAddress(lib, "ClientRemoveRemoteDev");
		ClientGetStateRemoteDev = (BOOL(WINAPI *)(PVOID, long int, LONG*, VARIANT*))GetProcAddress(lib, "ClientGetStateRemoteDev");
		ClientTrafficRemoteDevIsEncrypted = (BOOL(WINAPI *)(PVOID, long int, BOOL*))GetProcAddress(lib, "ClientTrafficRemoteDevIsEncrypted");
		ClientRemoteDevRequiresAuth = (BOOL(WINAPI *)(PVOID, long int, BOOL*))GetProcAddress(lib, "ClientRemoteDevRequiresAuth");
		ClientGetStateSharedDevice = (BOOL(WINAPI *)(PVOID, long int, LONG*, VARIANT*))GetProcAddress(lib, "ClientGetStateSharedDevice");
		ClientEnumRemoteDevOverRdp = (BOOL(WINAPI *)(void**))GetProcAddress(lib, "ClientEnumRemoteDevOverRdp");
		ServerDisconnectRemoteDev = (BOOL(WINAPI *)(PVOID, PVOID))GetProcAddress(lib, "ServerDisconnectRemoteDev");
		ClientTrafficRemoteDevIsCompressed = (BOOL(WINAPI *)(PVOID, long int, BOOL*))GetProcAddress(lib, "ClientTrafficRemoteDevIsCompressed");
		ServerGetSharedUsbDevIsCompressed = (BOOL(WINAPI *)(PVOID, PVOID, BOOL*))GetProcAddress(lib, "ServerGetSharedUsbDevIsCompressed");
	}
	else
	{
		return -1;
	}
	return 0;
}

// conversion

void VariantToString(VARIANT& vr, CString& string) {
	VARIANT vrd; vrd.vt = VT_EMPTY;
	switch (vr.vt)
	{
	case VT_BOOL:
		string.Format(_T("%ld"), (long)vr.iVal);
		break;
	case VT_I2:
		string.Format(_T("%ld"), (long)vr.iVal);
		break;
	case VT_I4:
		string.Format(_T("%ld"), (long)vr.lVal);
		break;
	case VT_R4:
		string.Format(_T("%lf"), (double)vr.fltVal);
		break;
	case VT_R8:
		string.Format(_T("%lf"), (double)vr.dblVal);
		break;
	case VT_BSTR:
		string = vr.bstrVal;
		break;
	case VT_UI1 | VT_ARRAY:
		//SafeArrayToString(vr.parray, string, false, ',');
		break;
	default:
		if (VariantChangeType(&vrd, &vr, 0, VT_BSTR) == S_OK)
			string = vrd.bstrVal;
		else
			string.Empty();
		VariantClear(&vrd);
	}
}

inline wchar_t *GetWC(const char *c)
{
	size_t cSize = strlen(c) + 1;
	wchar_t* wc = new wchar_t[cSize];
	if (wc != NULL)
	{
		size_t outsize = 0;
		//mbstowcs(wc, c, cSize);
		mbstowcs_s(&outsize, wc, cSize, c, cSize - 1);
	}

	return wc;
}

VARIANT CharToVariant(const char *c)
{
	VARIANT var;
	var.vt = VT_BSTR;
	wchar_t *tempwc = GetWC( c );
	if (tempwc != NULL)
	{
		var.bstrVal = SysAllocString(tempwc);
		delete tempwc;
	}

	return var;
}

#define MAX_LENGTH 512

char *VariantToChar(VARIANT var)
{
	char *string = NULL;

	CString strName;

	VariantToString(var, strName);
	//CString strFromBstr = (const char*)(V_BSTR(&var));

	TCHAR   tmpchar[MAX_PATH];
	_tcscpy_s(tmpchar, strName.GetBuffer(MAX_PATH));
	long size = wcslen(tmpchar) + 1;

	if ( size > 1 && ((string = (char *)calloc(size, sizeof(char))) != NULL ) )
	{
		size_t i;
		wcstombs_s(&i, string, (size_t)MAX_PATH, tmpchar, (size_t)MAX_PATH);
	}
	return string;
}

char *CComVariantToChar(CComVariant &var)
{
	char *string = NULL;

	CString strName = var;
	TCHAR   tmpchar[MAX_LENGTH];
	_tcscpy_s(tmpchar, strName.GetBuffer(MAX_LENGTH));
	long size = wcslen(tmpchar) + 1;

	if (size > 1 && ((string = (char *)calloc(size, sizeof(char))) != NULL))
	{
		size_t i;
		wcstombs_s(&i, string, (size_t)size, tmpchar, (size_t)MAX_LENGTH);
	}
	return string;
}

//
//
//

extern "C" FBOOL CServerCreateEnumUsbDev(void **con)
{
	PVOID pv;
	FBOOL ret = (FBOOL)ServerCreateEnumUsbDev(&pv);
	*con = pv;
	return ret;
}

extern "C" FBOOL CServerRemoveEnumUsbDev(void *con)
{
	PVOID *pv = (PVOID *)con;
	return (FBOOL)ServerRemoveEnumUsbDev(pv);
}

extern "C" FBOOL CServerGetUsbDevFromHub(void *con, void *hcon, int index, void** devcon)
{
	PVOID pv = (PVOID)con;
	PVOID hpv = (PVOID)hcon;
	LPVOID DevHandle = NULL;
	FBOOL retval = (FBOOL)ServerGetUsbDevFromHub(pv, hpv, index, &DevHandle);
	*devcon = DevHandle;
	printf("devcon set to %x\n", DevHandle);
	return retval;
}

extern "C" FBOOL CServerUsbDevIsHub(void *con, void *hcon)
{
	PVOID *pv = (PVOID *)con;
	PVOID *hpv = (PVOID *)hcon;
	return (FBOOL)ServerUsbDevIsHub(pv, hpv);
}

extern "C" FBOOL CServerUsbDevIsShared(void *con, void *hcon)
{
	PVOID *pv = (PVOID *)con;
	PVOID *hpv = (PVOID *)hcon;
	return (FBOOL)ServerUsbDevIsShared(pv, hpv);
}

extern "C" FBOOL CServerUsbDevIsConnected(void *con, void *hcon)
{
	PVOID *pv = (PVOID *)con;
	PVOID *hpv = (PVOID *)hcon;
	return (FBOOL)ServerUsbDevIsConnected(pv, hpv);
}

extern "C" FBOOL CServerGetUsbDevName(void *con, void *hcon, char **string)
{
	VARIANT strvar;
	PVOID *pv = (PVOID *)con;
	PVOID *hpv = (PVOID *)hcon;
	CString strVar;

	CComVariant ccomname;
	FBOOL resp = (FBOOL)ServerGetUsbDevName(pv, hpv, &ccomname);
	*string = CComVariantToChar(ccomname);

	return resp;
}

extern "C" FBOOL CServerShareUsbDev(void *pcont, void *devcont, char *netset, char *desc, FBOOL auth, char *pass, FBOOL crypt, FBOOL compress)
{
	PVOID pContext = (PVOID)pcont;
	PVOID pDevContext = (PVOID)devcont;
	
	CComVariant netvar = CComVariant(netset);
	CComVariant descvar = CComVariant(desc);
	CComVariant passvar = CComVariant(pass);

	return (FBOOL) ServerShareUsbDev( pcont, devcont, netvar, descvar, (BOOL) auth, passvar, (BOOL) crypt, (BOOL) compress);
}

extern "C" FBOOL CServerUnshareUsbDev(void *pcont, void *devcont)
{
	PVOID pContext = (PVOID)pcont;
	PVOID pDevContext = (PVOID)devcont;

	return (FBOOL)ServerUnshareUsbDev(pContext, pDevContext);
}

extern "C" FBOOL CServerGetUsbDevStatus(void *pcont, void *devcont, long *piState, char **strHostConnected)
{
	PVOID pContext = (PVOID)pcont;
	PVOID pDevContext = (PVOID)devcont;
	CComVariant var;

	FBOOL ret = (FBOOL)ServerGetUsbDevStatus(pContext, pDevContext, piState, &var);
	*strHostConnected = CComVariantToChar(var);

	return ret;
}

extern "C" FBOOL CServerGetSharedUsbDevNetSettings(void *pcont, void *devcont, char **strParam)
{
	PVOID pContext = (PVOID)pcont;
	PVOID pDevContext = (PVOID)devcont;

	CComVariant name;

	FBOOL ret = (FBOOL)ServerGetSharedUsbDevNetSettings(pContext, pDevContext, &name);
	*strParam = CComVariantToChar(name);
	return ret;
}

extern "C" FBOOL CServerGetSharedUsbDevIsCrypt(void *pcont, void *devcont, FBOOL *bCrypt)
{
	BOOL crypt;
	PVOID pContext = (PVOID)pcont;
	PVOID pDevContext = (PVOID)devcont;
	FBOOL ret = (FBOOL)ServerGetSharedUsbDevIsCrypt(pContext, pDevContext, &crypt);
	*bCrypt = (FBOOL)crypt;
	return ret;
}

extern "C" FBOOL CServerGetSharedUsbDevRequiresAuth(void *pcont, void *devcont, FBOOL *bAuth)
{
	BOOL auth;
	PVOID pContext = (PVOID)pcont;
	PVOID pDevContext = (PVOID)devcont;
	FBOOL ret = (FBOOL)ServerGetSharedUsbDevIsCrypt(pContext, pDevContext, &auth);
	*bAuth = (FBOOL)auth;
	return TRUE;
}

extern "C" void CSetCallBackOnChangeDevList(FNOnChangeDevList pFunc)
{
	SetCallBackOnChangeDevList(pFunc);
}

extern "C" FBOOL CClientEnumAvailRemoteDevOnServer(char *server, void **ppFindContext)
{
	VARIANT szServer;
	LPVOID findCont = 0;
	FBOOL ret = (FBOOL)ClientEnumAvailRemoteDevOnServer(CComVariant(server), &findCont);
	*ppFindContext = findCont;
	return ret;
}

extern "C" FBOOL CClientEnumAvailRemoteDev(void **globFindContext)
{
	PVOID ppFindContext;
	FBOOL ret = (FBOOL)ClientEnumAvailRemoteDev(&ppFindContext);
	*globFindContext = ppFindContext;
	return ret;
}

extern "C" FBOOL CClientRemoveEnumOfRemoteDev(void *pgFindContextPar)
{
	PVOID pFindContext = (PVOID)pgFindContextPar;
	return	(FBOOL)ClientRemoveEnumOfRemoteDev(pFindContext);
}

extern "C" FBOOL CClientGetRemoteDevNetSettings(void *pFindContext, long iIndex, char **NetSettings)
{
	PVOID pContext = (PVOID)pFindContext;
	CComVariant var;
	FBOOL ret = (FBOOL)ClientGetRemoteDevNetSettings(pContext, iIndex, &var);
	*NetSettings = CComVariantToChar(var);

	return ret;
}

extern "C" FBOOL CClientGetRemoteDevName(void *pFindContext, long iIndex, char **strName)
{
	PVOID pContext = (PVOID)pFindContext;
	CComVariant var;
	FBOOL ret = (FBOOL)ClientGetRemoteDevName(pContext, iIndex, &var);
	*strName = CComVariantToChar(var);

	return ret;
}

extern "C" FBOOL CClientAddRemoteDevManually( char *szNetSettings)
{
	printf("before char to varian %s\n", szNetSettings);
	VARIANT var = CharToVariant( szNetSettings );
	printf("varian created, ClientAddRemoteDevManually pointer %x\n", ClientAddRemoteDevManually );
	return (FBOOL)ClientAddRemoteDevManually(var);
}

extern "C" FBOOL CClientAddRemoteDev( void *pClientContext, long iIndex)
{
	PVOID pContext = (PVOID)pClientContext;
	return (FBOOL)ClientAddRemoteDev( pContext, iIndex);
}

extern "C" FBOOL CClientStartRemoteDev(void * pClientContext, long iIndex, FBOOL bAutoReconnect, char *strPassword)
{
	PVOID pContext = (PVOID)pClientContext;
	return (FBOOL)ClientStartRemoteDev(pContext, iIndex, (BOOL)bAutoReconnect,  CComVariant(strPassword));
}

extern "C" FBOOL CClientStopRemoteDev(void *pClientContext, long iIndex)
{
	PVOID pContext = (PVOID)pClientContext;
	return (FBOOL)ClientStopRemoteDev(pContext, iIndex);
}

extern "C" FBOOL CClientRemoveRemoteDev(void *pClientContext, long iIndex)
{
	PVOID pContext = (PVOID)pClientContext;
	return (FBOOL)ClientRemoveRemoteDev( pContext, iIndex);
}

extern "C" FBOOL CClientGetStateRemoteDev( void *pClientContext, long iIndex, long *piState, char **RemoteHost)
{
	PVOID pContext = (PVOID)pClientContext;
	LONG state = 0;
	CComVariant var;
	FBOOL ret = (FBOOL)ClientGetStateRemoteDev( pContext, iIndex, &state, &var);
	*piState = state;
	*RemoteHost = CComVariantToChar(var);
	return ret;
}

extern "C" FBOOL CClientTrafficRemoteDevIsEncrypted(void *pClientContext, long iIndex, FBOOL *bCrypt)
{
	PVOID pContext = (PVOID)pClientContext;
	BOOL crypt = FALSE;
	FBOOL ret = (FBOOL)ClientTrafficRemoteDevIsEncrypted( pContext, iIndex, &crypt);
	*bCrypt = (FBOOL)crypt;
	return TRUE;
}

extern "C" FBOOL CClientRemoteDevRequiresAuth(void *pClientContext, long iIndex, FBOOL *bAuth)
{
	PVOID pContext = (PVOID)pClientContext;
	BOOL auth = FALSE;
	FBOOL ret = (FBOOL)ClientRemoteDevRequiresAuth( pContext, iIndex, &auth);
	*bAuth = (FBOOL)auth;
	return ret;
}

extern "C" FBOOL CClientGetStateSharedDevice( void *pClientContext, long iIndex, long *piState, char **RemoteHost)
{
	PVOID pContext = (PVOID)pClientContext;
	long state = 0;
	CComVariant var;
	FBOOL ret = (FBOOL)ClientGetStateSharedDevice( pContext, iIndex, &state, &var);
	*piState = (long)state;
	*RemoteHost = CComVariantToChar(var);
	return ret;
}

extern "C" FBOOL CClientEnumRemoteDevOverRdp(void **ppFindContext)
{
	return (FBOOL)ClientEnumRemoteDevOverRdp(ppFindContext);
}

extern "C" FBOOL CServerDisconnectRemoteDev(void *plContext, void *plDevContext)
{
	PVOID pContext = (PVOID)plContext;
	PVOID pDevContext = (PVOID)plDevContext;
	return (FBOOL)ServerDisconnectRemoteDev( pContext, pDevContext);
	return TRUE;
}

extern "C" FBOOL CClientTrafficRemoteDevIsCompressed(void *pClientContext, long iIndex, FBOOL *bCompress)
{
	PVOID pContext = (PVOID)pClientContext;
	BOOL comp = FALSE;
	FBOOL ret = (FBOOL)ClientTrafficRemoteDevIsCompressed(pContext, iIndex, &comp);
	*bCompress = (FBOOL)comp;
	return ret;
}

extern "C" FBOOL CServerGetSharedUsbDevIsCompressed(void *plContext, void *lpDevContext, FBOOL *bCompress)
{
	PVOID pContext = (PVOID)plContext;
	PVOID pDevContext = (PVOID)lpDevContext;
	BOOL comp = FALSE;
	FBOOL ret = (FBOOL)ServerGetSharedUsbDevIsCompressed(pContext, pDevContext, &comp);
	*bCompress = (FBOOL)comp;
	return ret;
}
