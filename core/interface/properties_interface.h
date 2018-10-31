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
#ifndef __INTERFACE_PROPERTIES_INTERFACE_H__
#define __INTERFACE_PROPERTIES_INTERFACE_H__

#include <config/properties.h>
#include <config/iniparser.h>

typedef struct PropertiesInterface
{
	Props                *(*Open)( const char *name );
	// close property file
	void                 (*Close)( Props *p );
	// get string from property file
	char                 *(*ReadString)( Props *p, char *name, char *def );
	//
	char				*(*ReadStringNCS)( Props *p, char *name, char *def );
	//
	char				*(*ReadStringNCSUpper)( Props *p, char *name, char *def );
	// read integer from property file
	int                  (*ReadInt)( Props *p, const char *name, int def );
	//
	int                  (*ReadIntNCS)( Props *p, const char *name, int def );
	// read double variable from property file
	double               (*ReadDouble)( Props *p, const char *name, double def );
	// read bool variable from property file
	int                  (*ReadBool)( Props *p, const char *name, int def );
	// get configuration directory
	const char           *(*GetConfigDirectory)( );
}PropertiesInterface;

//
// init function
//

static inline void PropertiesInterfaceInit( PropertiesInterface *si )
{
	si->Open = PropertiesOpen;
	si->Close = PropertiesClose;
	si->ReadString = ReadString;
	si->ReadStringNCS = ReadStringNCS;
	si->ReadStringNCSUpper = ReadStringNCSUpper;
	si->ReadInt = ReadInt;
	si->ReadIntNCS = ReadIntNCS;
	si->ReadDouble = ReadDouble;
	si->ReadBool = ReadBool;
	si->GetConfigDirectory = GetConfigDirectory;
}

#endif // __INTERFACE_PROPERTIES_INTERFACE_H__

