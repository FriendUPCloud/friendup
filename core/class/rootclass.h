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
 *  Core ROOT class definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @author JMN (John Michael Nilsen)
 *  @date pushed 6/02/2015
 */

#ifndef __CLASS_ROOTCLASS_H__
#define __CLASS_ROOTCLASS_H__

#include <core/types.h>
#include <class/class.h>
#include <util/hooks.h>

#define METH_Dummy				0xF0000100			///< base index for enum
#define FM_Root_Test			(METH_Dummy+1)		///< test message

#define FA_Dummy				0x00001000			///< base index for parameters
#define FA_SetValue				(FA_Dummy+1)		///< example parameter

FULONG rootDispatcher( struct Class *c, Object *o, struct Msg *m );


#endif //__ROOTCLASS_H__

