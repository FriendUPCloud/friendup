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
 *  json  converter functions definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date created March 2016
 */

#ifndef __JSON_JSON_CONVERTER_H__
#define __JSON_JSON_CONVERTER_H__

#include <core/types.h>
#include <db/sql_defs.h>
#include <util/buffered_string.h>
#include "jsmn.h"

//
//
//

jsmntok_t * JSONTokenise(char *js, unsigned int *entr );

//
//
//

BufString *GetJSONFromStructure( FULONG *desc, void *data );

//
//
//

void *GetStructureFromJSON( FULONG *desc, const char *data );

#endif // __JSON_JSON_CONVERTER_H__
