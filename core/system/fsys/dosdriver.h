/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              * 
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

#ifndef __SYSTEM_FSYS_DOSDRIVER_H__
#define __SYSTEM_FSYS_DOSDRIVER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/fsys/fsys.h>
#include <system/systembase.h>

typedef struct DOSDriver{
	MinNode 						node;
	FHandler						*dd_Handler;
	char								*dd_Name;
	char								*dd_Type;
}DOSDriver;

//int RescanDOSDrivers( void *l );

#endif // __SYSTEM_FSYS_DOSDRIVER_H__
