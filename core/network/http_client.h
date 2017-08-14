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
	char							*hc_MainLine;
	char 						*hc_Headers[ HTTP_HEADER_END ];
	BufString 				*hc_Body;
}HttpClient;

//
//
//

HttpClient *HttpClientNew( FBOOL post, char *param );

//
//
//

void HttpClientFree( HttpClient *htc );


#endif // __NETWORK_HTTP_CLIENT_H__