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

#include <stdio.h>
#include <stdlib.h>
#include <core/library.h>
#include <system/dictionary/dictionary.h>
#include <mysql/mysqllibrary.h>

//
// load dictionary
//

Dictionary * DictionaryNew(struct MYSQLLibrary *mysqllib )
{
	if( mysqllib == NULL )
	{
		ERROR("Mysql.library was not opened\n");
		return NULL;
	}
	int entries;
	
	return mysqllib->Load( mysqllib, DictionaryDesc, NULL, &entries );
}

//
// remove dictionary from memory
//

void DictionaryDelete(Dictionary* d)
{
	DEBUG("Remove dictionary from memory\n");
	while( d != NULL )
	{
		Dictionary *temp = d;
		d = (Dictionary *)d->node.mln_Succ;
		
		if( temp->d_Lang )
		{
			free( temp->d_Lang );
			free( temp->d_Name );
		}
	}
}
