/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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

