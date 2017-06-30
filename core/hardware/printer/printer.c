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

#include "printer.h"
#include <util/string.h>

//
//
//

FPrinter *PrinterNew( const char *name )
{
	FPrinter *fp = NULL;
	if( ( fp = FCalloc( 1, sizeof(FPrinter) ) ) != NULL )
	{
		fp->fp_Name = StringDuplicate( name );
	}
	else
	{
		FERROR("Cannot allocate memory for FPrinter\n");
	}
	return fp;
}

//
//
//

void PrinterDelete( FPrinter *pp )
{
	if( pp != NULL )
	{
		if( pp->fp_HardwareID  != NULL )
		{
			FFree( pp->fp_HardwareID );
		}
		
		if( pp->fp_Manufacturer  != NULL )
		{
			FFree( pp->fp_Manufacturer );
		}
		
		if( pp->fp_Name  != NULL )
		{
			FFree( pp->fp_Name );
		}
	}
}

//
//
//

FPrinter *PrinterDeleteAll( FPrinter *pp )
{
	FPrinter *loc = pp;
	FPrinter *rem = pp;
	
	while( loc != NULL )
	{
		rem =  loc;
		loc = (FPrinter *)loc->node.mln_Succ;
		
		PrinterDelete( rem );
	}
	return NULL;
}
