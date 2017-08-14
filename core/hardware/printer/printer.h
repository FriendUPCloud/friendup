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
 *  Function releated to printers
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 02/02/2017
 */

#ifndef __CORE_HARDWARE_PRINTER_PRINTER_H__
#define __CORE_HARDWARE_PRINTER_PRINTER_H__

#include <core/types.h>
#include <core/nodes.h>

typedef struct FPrinter
{
	FULONG			fp_ID;
	char					*fp_Name;
	char					*fp_Manufacturer;
	char					*fp_HardwareID;
	MinNode			node;
}FPrinter;

//
//
//

FPrinter *PrinterNew( const char *name );

//
//
//

void PrinterDelete( FPrinter *pp );

//
//
//

FPrinter *PrinterDeleteAll( FPrinter *pp );

#endif // __CORE_HARDWARE_PRINTER_PRINTER_H__