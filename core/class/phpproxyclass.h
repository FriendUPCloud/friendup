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
