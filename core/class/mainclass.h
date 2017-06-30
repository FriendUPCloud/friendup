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
 *  Core MAIN classes definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @author JMN (John Michael Nilsen)
 *  @date created 6 Feb 2015
 */

#ifndef __CLASS_MAINCLASS_H__
#define __CLASS_MAINCLASS_H__

#include <core/types.h>
#include <class/class.h>

#ifndef DOXYGEN
#define METH_Dummy			0x00005000// unused now
#define METH_TEST			(METH_Dummy+1)
#endif

#define FA_Main_Dummy		0x00005000          ///< base of message enum
#define FA_Main_SetValue	(FUIA_Dummy+1)      ///< sets a value

FULONG mainDispatcher( struct Class *c, Object *o, struct Msg *m );


#endif //__ROOTCLASS_H__
