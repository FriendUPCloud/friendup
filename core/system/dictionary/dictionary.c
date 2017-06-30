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

/**
 * @file
 *
 * Body of  dictionary
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#include <stdio.h>
#include <stdlib.h>
#include <core/library.h>
#include <system/dictionary/dictionary.h>
#include <mysql/mysqllibrary.h>

/**
 * Create new Dictionary
 *
 * @param mysqllib pointer to opened mysql.library
 * @return pointer to new Dictionary structure, otherwise NULL
 */
Dictionary * DictionaryNew(struct MYSQLLibrary *mysqllib )
{
	if( mysqllib == NULL )
	{
		FERROR("[DictionaryNew] Mysql.library was not opened\n");
		return NULL;
	}
	int entries;
	
	return mysqllib->Load( mysqllib, DictionaryDesc, NULL, &entries );
}

/**
 * Delete Dictionary
 *
 * @param d pointer to Dictionary structure which will be deleted
 */
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
