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
