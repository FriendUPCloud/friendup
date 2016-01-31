/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/*
 * 
 * 
 * 
 * 
 * 
*/

#ifndef __SYSTEM_COMMAND_H__
#define __SYSTEM_COMMAND_H__

#include <sys/types.h>
#include <unistd.h>
#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>

FILE * CommandRun( char *command, char *type, int *pid );

int CommandClose( FILE * fp, unsigned int pid );

#endif // __SYSTEM_COMMAND_H__

