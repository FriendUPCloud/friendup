/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __NETWORK_HTTP_CLIENT_H__
#define __NETWORK_HTTP_CLIENT_H__

#include <util/buffered_string.h>
#include "http.h"

/*
 
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded
 
grant_type=password&username=johndoe&password=A3ddj3w
 */

typedef struct HttpClient
{
	char					*hc_MainLine;
	char 					*hc_Headers;//[ HTTP_HEADER_END ];
	char					*hc_Content;
	BufString 				*hc_Body;
}HttpClient;

//
//
//

HttpClient *HttpClientNew( FBOOL post, FBOOL http2, char *param, char *headers, char *content );

//
//
//

void HttpClientDelete( HttpClient *htc );

//
//
//

BufString *HttpClientCall( HttpClient *c, char *host, int port, FBOOL secured, FBOOL alwaysTrueCert );


#endif // __NETWORK_HTTP_CLIENT_H__
