/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <system/systembase.h>
#include <util/log/log.h>
#include <sys/stat.h>
#include <util/buffered_string.h>
#include <dirent.h>
#include <util/string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <system/inram/inramfs.h>

#define SUFFIX "fsys"
#define PREFIX "INRAM"

//
// special structure
//

typedef struct SpecialData
{
	INRAMFile *fp;
	INRAMFile * root;
	void *sb;
}SpecialData;


const char *GetSuffix()
{
	return SUFFIX;
}

const char *GetPrefix()
{
	return PREFIX;
}

//
// additional stuff
//


char* StringDup( const char* str )
{
	if( str == NULL)
	{
		//DEBUG("Cannot copy string!\n");
		return NULL;
	}
	
	int len = strlen( str );
	char *res = NULL;
	if( ( res = calloc( len+1, sizeof(char) ) ) != NULL )
	{
		strcpy( res, str );
	}
	
	return res;
}

//
// Get filename from path
//

char *GetFileName( const char *path )
{
	char *p = (char *)path;
	int i = strlen( path );

	for(  ; i >= 0 ; i-- )
	{
		if( path[ i ] == '/' )
		{
			p = (char *)&path[ i+1 ];
			return p;
		}
	}
	
	return p;
}

//
//
//

void init( struct FHandler *s )
{
	DEBUG("[RAMFS] init\n");
}

//
//
//

void deinit( struct FHandler *s )
{
	DEBUG("[RAMFS] deinit\n");
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, User *usr, char **mountError )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	void *sb;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("Mounting RAM filesystem!\n");
	
	if( ( dev = calloc( 1, sizeof( File ) ) ) != NULL )
	{
		struct TagItem *lptr = ti;
		
		//
		// checking passed arguments
		
		while( lptr->ti_Tag != TAG_DONE )
		{
			switch( lptr->ti_Tag )
			{
				case FSys_Mount_Path:
					break;
				case FSys_Mount_Server:
					break;
				case FSys_Mount_Port:
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_SysBase:
					sb = (void *)lptr->ti_Data;
					break;
			}
			lptr++;
		}
		
		SpecialData *srd =  calloc( 1, sizeof( SpecialData ) );
		srd->root = INRAMFileNew( INRAM_ROOT, name, name );
		dev->f_SpecialData = srd;
		srd->sb = sb;
		
		dev->f_FSys = s;
		dev->f_Position = 0;
		dev->f_User = usr;
		dev->f_Name = StringDup( name );
		dev->f_Type = FType_Directory;
		dev->f_Size = 0;
	}
	
	DEBUG("RAMFS mount ok\n");
	
	return dev;
}

//
// Only free device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("Release filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			INRAMFileDeleteAll( sdat->root );
			INRAMFileDelete( sdat->root );
			
			free( lf->f_SpecialData );
		}
		return 0;
	}
	return -1;
}

//
// Unmount device
//

int UnMount( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		DEBUG("Unmount filesystem\n");
		File *lf = (File*)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			INRAMFileDeleteAll( sdat->root );
			INRAMFileDelete( sdat->root );
			
			free( lf->f_SpecialData );
		}
		return 0;
	}
	return -1;
}

//
// Open file
//

void *FileOpen( struct File *s, const char *path, char *mode )
{
	int spath = strlen( path );
	char *tmppath = FCalloc( spath+10, sizeof(char) );
	memcpy( tmppath, path, spath );
	
	File *locfil = NULL;
	DEBUG("File open\n");
	
	SpecialData *srd  = (SpecialData *)s->f_SpecialData;
	int error = 0;
	
	// we are takeing filename from path, path will be used to make directories only
	char *nameptr = (char *)path;
	int i;
	for( i=spath ; i >= 0 ; i-- )
	{
		if( path[ i ] == '/' )
		{
			nameptr = (char *)&path[i+1];
			tmppath[ i ] = 0;
			break;
		}
	}
	
	DEBUG("File open 1  path %s  tmppath %s  nameptr %s\n", path, tmppath, nameptr );
    
	INRAMFile *directory = NULL;
	
	if( strcmp( path, nameptr ) != 0 )
	{
		directory = INRAMFileMakedirPath( srd->root, tmppath, &error );
	}
	else
	{
		directory = srd->root;
	}
	
	if( directory != NULL )
	{
		DEBUG("Directory where file will be create/exist %s\n", directory->nf_Name );
		
		INRAMFile *nf = NULL;
		
		nf = INRAMFileGetChildByName( directory, nameptr );
		// read
		DEBUG("\nINRAM opened file for %s\n\n", mode );
		
		if( mode[ 0 ] == 'r' )
		{
			if( nf == NULL )
			{
				free( tmppath );
				FERROR("Cannot open file %s\n", path );
				return NULL;
			}
			nf->nf_Offset = 0;
		}
		else	// write
		{
			if( nf == NULL )
			{
				nf = INRAMFileNew( INRAM_FILE, tmppath, nameptr );
				if( INRAMFileAddChild( directory, nf ) == 0 )
				{
					
				}
			}
			else
			{
				
			}
		}
		
		// Ready the file structure
		if( ( locfil = calloc( sizeof( File ), 1 ) ) != NULL )
		{
			locfil->f_Path = StringDup( path );
			DEBUG("Fileopen, path duplicated %s\n", path );
			
			locfil->f_SpecialData = calloc( 1, sizeof( SpecialData ) );
			SpecialData *sd = (SpecialData *)locfil->f_SpecialData;
		
			if( sd )
			{
				sd->fp = nf;
			}
			DEBUG("\nOffset set to %ld\n\n", nf->nf_Offset );
			
			DEBUG("File open, descriptor returned\n");
			
			return locfil;
		}
	}

	FFree( tmppath );
	DEBUG("File open end\n");

	return NULL;
}

//
// Close File
//

int FileClose( struct File *s, void *fp )
{	
	if( fp != NULL )
	{
		int close = 0;
		
		File *lfp = ( File *)fp;
		
		if( lfp->f_SpecialData )
		{
			SpecialData *sd = ( SpecialData *)lfp->f_SpecialData;
			//close = fclose( ( FILE *)sd->fp );
			free( lfp->f_SpecialData );
		}
		
		if( lfp->f_Path ) free( lfp->f_Path );
		if( lfp->f_Buffer ) free( lfp->f_Buffer );
		free( lfp );
		
		DEBUG( "FileClose: Closing file pointer.\n" );
		
		return close;
	}
	
	return - 1;
}

//
// Read data from file
//

int FileRead( struct File *f, char *buffer, int rsize )
{
	int result = -2;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd != NULL )
	{
		FULONG readsize = sd->fp->nf_Data->bs_Size - sd->fp->nf_Offset;
		if( rsize < (int)readsize )
		{
			readsize = rsize;
		}
		//DEBUG(" readsize %d bssize %lld offset %d\n", readsize, sd->fp->nf_Data->bs_Size, sd->fp->nf_Offset );
		
		memcpy( buffer, &(sd->fp->nf_Data->bs_Buffer[ (long)sd->fp->nf_Offset ] ), readsize ); 
		result = (int) readsize;
		sd->fp->nf_Offset += readsize;
	}
	DEBUG("File read %d\n", result );
	
	if( result <= 0 ) return -1;
	return result;
}

//
// write data to file
//

int FileWrite( struct File *f, char *buffer, int wsize )
{
	int result = -1;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd )
	{
		DEBUG("File write %s\n", buffer );
		result = BufStringAddSize( sd->fp->nf_Data, buffer, wsize );
		 sd->fp->nf_Offset += result;
	}
	return wsize;
}

//
// seek
//

int FileSeek( struct File *s, int pos )
{
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	if( sd != NULL )
	{
		sd->fp->nf_Offset += pos;
		return pos;
	}
	return -1;
}

//
// make directory in local file system
//

int MakeDir( struct File *s, const char *path )
{
	INFO("MakeDir %s!\n", path );
	int error = 0;
	
	SpecialData *srd  = (SpecialData *)s->f_SpecialData;
	INRAMFile *directory = INRAMFileMakedirPath( srd->root, (char *)path, &error );
	if( directory != NULL )
	{
		DEBUG("Directory found\n");
		return -1;
	}
	
	return 0;
}

//
// GetDiskInfo
//

int GetDiskInfo( struct File *s, int64_t *used, int64_t *size )
{
	*used = 0;
	*size = 0;
	return 0;
}

//
// Delete
//

FLONG Delete( struct File *s, const char *path )
{
	DEBUG("Delete!\n");
	FLONG deleted = 0;
	
	int error = 0;
	SpecialData *srd = (SpecialData *) s->f_SpecialData;
	INRAMFile *dir =INRAMFileGetLastPath( srd->root,path, &error );
	if( dir != NULL )
	{
		INRAMFile *pdir = dir->nf_Parent;
		
		DEBUG("Delete parent ptr %p %s\n", pdir, pdir->nf_Name );
		if( pdir != NULL )
		{
			dir = INRAMFileRemoveChild( pdir, dir );
			deleted += INRAMFileDeleteAll( dir );
			if( dir->nf_Type != INRAM_ROOT )
			{
				deleted += INRAMFileDelete( dir );
			}
			DEBUG("Delete entries deleted\n");
		}
		else
		{
			FERROR("Parent entry is null\n");
			return -1;
		}
	}
	else
	{
		FERROR("Path not found %s\n", path );
		return -2;
	}
	DEBUG("Delete END\n");
	
	return deleted;
}

//
// Rename
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("Rename!\n");
	int res = 0;
	
	int error = 0;
	SpecialData *srd = (SpecialData *) s->f_SpecialData;
	INRAMFile *dir =INRAMFileGetLastPath( srd->root, path, &error );
	if( dir != NULL )
	{
		free( dir->nf_Name );
		free( dir->nf_Path );
		dir->nf_Name = StringDup( nname );
		
		int len = strlen( path );
		char *temp = calloc( len+512, sizeof(char) );
		if( temp != NULL )
		{
			int i = len;
			strcpy( temp, path );
			
			for( ; i >= 0 ; i-- )
			{
				if( temp[ i ] == '/' )
				{
					temp[ i+1 ] =  0;
				}
			}
			
			strcat( temp, nname );
			
			dir->nf_Path = temp;
		}
		else
		{
			FERROR("Cannot allocate memory\n");
		}
	}
	
	return res;
}


//
// Copy file from source to destination
//

int Copy( struct File *s, const char *dst, const char *src )
{
	DEBUG("Copy!\n");

	int error = 0;

	
	return error;
}

//
// Execute file
//

#define BUFFER_SIZE 1024

FILE *popen( const char *c, const char *r );

char *Execute( struct File *s, const char *path, const char *args )
{
	DEBUG("SYS mod run\n");


	return NULL;
}

//
// Fill buffer with data from stat
//

void FillStat( BufString *bs, INRAMFile *nf, File *d, const char *path )
{
	char tmp[ 1024 ];
	/*
	int rootSize = 0;
	if( d->f_Path != NULL )
	{
		rootSize = strlen( d->f_Path );
	}
	*/
	int pathSize = strlen( path );
	
	//DEBUG("FILLSTAT path '%s' rootpath '%s'  %d\n", path, d->f_Path, path[ strlen( d->f_Path ) ] );
			
	BufStringAdd( bs, "{" );
	snprintf( tmp, 1023, " \"Filename\":\"%s\",",nf->nf_Name );
	BufStringAdd( bs, tmp );
	
	//DEBUG( "FILLSTAT filename set\n");
	/*
	if( rootSize != pathSize )
	{
		if( nf->nf_Type == INRAM_DIR )
		{
			sprintf( tmp, "\"Path\":\"%s:%s/\",", d->f_Name, &path[ strlen( d->f_Path ) ] );
		}
		else
		{
			sprintf( tmp, "\"Path\":\"%s:%s\",", d->f_Name, &path[ strlen( d->f_Path ) ] );
		}
	}
	else
		*/
	{
		sprintf( tmp, "\"Path\":\"%s\",", path );//d->f_Name );
		BufStringAdd( bs, tmp );
	}
	
	//DEBUG( "FILLSTAT fullname set\n");

	if( nf->nf_Type == INRAM_DIR )
	{
		BufStringAdd( bs,  "\"Filesize\":\"0\", " );
		BufStringAdd( bs,  "\"MetaType\":\"Directory\",\"Type\":\"Directory\" }" );
	}
	else
	{
		sprintf( tmp, "\"Filesize\": %ld,", nf->nf_Data->bs_Size );
		BufStringAdd( bs, tmp );
		BufStringAdd( bs, "\"MetaType\":\"File\",\"Type\":\"File\" }" );
	}
	
	//DEBUG( "FILLSTAT END\n");
}

//
// Get information about last file changes (seconds from 1970)
//

FLONG GetChangeTimestamp( struct File *s, const char *path )
{
	return (FLONG)0;
}

//
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("[INRAM] Info!\n");
	
	BufString *bs = BufStringNew();

	BufStringAdd( bs, "ok<!--separate-->");
	
	DEBUG("Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	int error = 0;
	SpecialData *srd = (SpecialData *) s->f_SpecialData;
	INRAMFile *dir =INRAMFileGetLastPath( srd->root, path, &error );
		
	if( dir != NULL )
	{
		FillStat( bs, dir, s, path );
	}
	else
	{
		DEBUG("[INRAM] file stat FAIL %s\n", path );
		SpecialData *locsd = (SpecialData *)s->f_SpecialData;
		SystemBase *l = (SystemBase *)locsd->sb;
		
		int globlen = strlen( path ) + 512;
		char *buffer = FMalloc( globlen );
		int size = 0;
		if( buffer != NULL )
		{
			size = snprintf( buffer, globlen, "{ \"response\": \"%s\", \"code\":\"%d\",\"path\":\"%s\" }", l->sl_Dictionary->d_Msg[DICT_FILE_OR_DIRECTORY_DO_NOT_EXIST] , DICT_FILE_OR_DIRECTORY_DO_NOT_EXIST, path );
			
			BufStringAddSize( bs, buffer, size );
			FFree( buffer );
		}
		//BufStringAdd( bs, "{ \"response\": \"File or directory do not exist\"}" );
	}
	
	DEBUG("[INRAM] Info END\n");
	
	return bs;
}

//
// Call a library
//

BufString *Call( File *s, const char *path, Http *request )
{
	DEBUG("Info!\n");
	BufString *bs = BufStringNew();
	BufStringAdd( bs, "fail<!--separate-->");	
	DEBUG("Info END\n");
	return bs;
}

//
// return content of directory
//
	
BufString *Dir( File *s, const char *path )
{
	BufString *bs = BufStringNew();
	DEBUG("Dir!\n");
	
	int error = 0;
	// user is trying to get access to not his directory
	SpecialData *srd = (SpecialData *) s->f_SpecialData;
	INRAMFile *dir =INRAMFileGetLastPath( srd->root, path, &error );
	DEBUG("Path received, pointer to: %p   path %s!\n", dir, path );
	
	if( dir != NULL )
	{
		int pos = 0;
		
		BufStringAdd( bs, "ok<!--separate-->");
		BufStringAdd( bs, "[" );
		INRAMFile *f = dir->nf_Children;
		
		// temporary solution, must be fixed
		char tempString[ 4096 ];
		int plen = strlen( path ) - 1;
		
		DEBUG("going through children\n");
		
		while ( f != NULL )
		{
			if( plen > 0 && path[ plen ] == '/' )
			{
				sprintf( tempString, "%s:%s%s",s->f_Name,  path, f->nf_Name );
			}
			else
			{
				sprintf( tempString, "%s:%s/%s",s->f_Name,  path, f->nf_Name );
			}
			
			if( pos != 0 )
			{
				BufStringAdd( bs, "," );
			}
			FillStat( bs, f, s, tempString );
			pos++;
			DEBUG("Dir/PAth added %s\n", tempString );
			
			f = (INRAMFile *) f->node.mln_Succ;
		}
		BufStringAdd( bs, "]" );
	}
	else
	{
		//BufStringAdd( bs, "fail<!--separate-->Could not open directory.");
		int pos = 0;
		
		BufStringAdd( bs, "ok<!--separate-->");
		BufStringAdd( bs, "[]" );
	}
	DEBUG("Dir END %s\n", bs->bs_Buffer);
	
	return bs;
}


