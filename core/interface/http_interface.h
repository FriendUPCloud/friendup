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
 *  Http Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 02/01/2017
 */
#ifndef __INTERFACE_HTTP_INTERFACE_H__
#define __INTERFACE_HTTP_INTERFACE_H__

#include <network/http.h>

typedef struct HttpInterface
{
	int			(*HttpParseHeader)( Http* http, const char* request, unsigned int length );

	Http		*(*HttpNew)( );

	Http		*(*HttpNewSimple)( unsigned int code, struct TagItem * );

	Http		*(*HttpParseRequest)( const char* request, unsigned int length );
 
	int			(*HttpParsePartialRequest)( Http* http, char* data, unsigned int length );

	void		(*HttpFreeRequest)( Http* http );

	void		(*HttpSetCode)( Http* http, unsigned int code );

	int			(*HttpAddHeader)(Http* http, int id, char* value );

	List		*(*HttpGetHeaderList)( Http* http, const char* name );

	char		*(*HttpGetHeader)( Http* http, const char* name, unsigned int index );

	char		*(*HttpGetSingleHeader)( Http* http, const char* name );

	unsigned int (*HttpNumHeader)( Http* http, const char* name );

	FBOOL		(*HttpHeaderContains)( Http* http, const char* name, const char* value, FBOOL caseSensitive );

	void		(*HttpAddTextContent)( Http* http, char* content );

	void		(*HttpSetContent)( Http*, char* data, unsigned int length );

	char		*(*HttpBuild)( Http* http );

	void		(*HttpFree)( Http* http );

	void		(*HttpTest)();

	HashmapElement *(*HttpGetPOSTParameter)( Http *request,  char *param );

	void		(*HttpWriteAndFree)( Http* http, Socket *sock );

	void		(*HttpWrite)( Http* http, Socket *sock );

	HttpFile 	*(*HttpFileNew)( char *filename, int fnamesize, char *data, QUAD size );

	void		(*HttpFileDelete)( HttpFile *f );
	
}HttpInterface;

//
// init function
//

inline void HttpInterfaceInit( HttpInterface *si )
{
	si->HttpParseHeader = HttpParseHeader;
	si->HttpNew = HttpNew;
	si->HttpNewSimple = HttpNewSimple;
	si->HttpParseRequest = HttpParseRequest;
	si->HttpParsePartialRequest = HttpParsePartialRequest;
	si->HttpFreeRequest = HttpFreeRequest;
	si->HttpSetCode = HttpSetCode;
	si->HttpAddHeader = HttpAddHeader;
	si->HttpGetHeaderList = HttpGetHeaderList;
	si->HttpGetHeader = HttpGetHeader;
	si->HttpGetSingleHeader = HttpGetSingleHeader;
	si->HttpNumHeader = HttpNumHeader;
	si->HttpHeaderContains = HttpHeaderContains;
	si->HttpAddTextContent = HttpAddTextContent;
	si->HttpSetContent = HttpSetContent;
	si->HttpBuild = HttpBuild;
	si->HttpFree = HttpFree;
	si->HttpGetPOSTParameter = HttpGetPOSTParameter;
	si->HttpWriteAndFree = HttpWriteAndFree;
	si->HttpWrite = HttpWrite;
	si->HttpFileNew = HttpFileNew;
	si->HttpFileDelete = HttpFileDelete;
}

#endif