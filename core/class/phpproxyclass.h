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
 *  Core PHP classes definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @author JMN (John Michael Nilsen)
 *  @date pushed 06/02/2015
 */
#ifndef __CLASS_PHPPROXYCLASS_H__
#define __CLASS_PHPPROXYCLASS_H__

#include <core/types.h>
#include <class/class.h>
#include <util/hooks.h>

#define FC_PHPProxyClass     "PHPProxyClass"			///< name id of "PHP" classes

/**
 * Definition of a process
 */
struct FUIPProcess
{
	FULONG MethodID;
	FULONG data;
};

#define FM_PHPProxy_Dummy		0x00000200				///< base index of enum
#define FM_PHPProxy_Process		(FM_PHPProxy_Dummy+1)	///< run proxy

#define FA_PHPProxy_Dummy			0x00002000			///< base index of enum
#define FA_PHPProxy_Parameters	(FA_PHPProxy_Dummy+1)	///< parameters
#define FA_PHPProxy_Results		(FA_PHPProxy_Dummy+2)	///< results

FULONG phpproxyDispatcher( struct Class *c, Object *o, struct Msg *m );


#endif //__CLASS_PHPPROXYCLASS_H__
