/* minizip.c
   Version 1.1, February 14h, 2010
   sample part of the MiniZip project

   Copyright (C) 1998-2010 Gilles Vollant
     http://www.winimage.com/zLibDll/minizip.html
   Modifications of Unzip for Zip64
     Copyright (C) 2007-2008 Even Rouault
   Modifications for Zip64 support
     Copyright (C) 2009-2010 Mathias Svensson
     http://result42.com

   This program is distributed under the terms of the same license as zlib.
   See the accompanying LICENSE file for the full text of the license.
*/

#if (!defined(_WIN32)) && (!defined(WIN32)) && (!defined(__APPLE__))
#  ifndef __USE_FILE_OFFSET64
#    define __USE_FILE_OFFSET64
#  endif
#  ifndef __USE_LARGEFILE64
#    define __USE_LARGEFILE64
#  endif
#  ifndef _LARGEFILE64_SOURCE
#    define _LARGEFILE64_SOURCE
#  endif
#  ifndef _FILE_OFFSET_BIT
#    define _FILE_OFFSET_BIT 64
#  endif
#endif

#ifdef __APPLE__
/* In darwin and perhaps other BSD variants off_t is a 64 bit value, hence no need for specific 64 bit functions */
#  define FOPEN_FUNC(filename, mode) fopen(filename, mode)
#  define FTELLO_FUNC(stream) ftello(stream)
#  define FSEEKO_FUNC(stream, offset, origin) fseeko(stream, offset, origin)
#else
#  define FOPEN_FUNC(filename, mode) fopen64(filename, mode)
#  define FTELLO_FUNC(stream) ftello64(stream)
#  define FSEEKO_FUNC(stream, offset, origin) fseeko64(stream, offset, origin)
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <errno.h>
#include <fcntl.h>

#ifdef _WIN32
#  include <direct.h>
#  include <io.h>
#else
#  include <unistd.h>
#  include <utime.h>
#  include <sys/types.h>
#  include <sys/stat.h>
#endif

#include "zip.h"

#ifdef _WIN32
#  define USEWIN32IOAPI
#  include "iowin32.h"
#endif

#define WRITEBUFFERSIZE (16384)
#define MAXFILENAME     (256)

#include <dirent.h>

#include <util/log/log.h>
#include <system/user/user_session.h>
#include <system/systembase.h>

uLong filetime(const char *filename, tm_zip *tmzip, uLong *dostime)
{
    int ret = 0;
#ifdef _WIN32
    FILETIME ftLocal;
    HANDLE hFind;
    WIN32_FIND_DATAA ff32;

    hFind = FindFirstFileA(filename, &ff32);
    if (hFind != INVALID_HANDLE_VALUE)
    {
        FileTimeToLocalFileTime(&(ff32.ftLastWriteTime), &ftLocal);
        FileTimeToDosDateTime(&ftLocal,((LPWORD)dostime)+1,((LPWORD)dostime)+0);
        FindClose(hFind);
        ret = 1;
    }
#else
#if defined unix || defined __APPLE__
    struct stat s = {0};
    struct tm* filedate;
    time_t tm_t = 0;

    if (strcmp(filename,"-") != 0)
    {
        char name[MAXFILENAME+1];
        int len = strlen(filename);
        if (len > MAXFILENAME)
            len = MAXFILENAME;

        strncpy(name, filename, MAXFILENAME - 1);
        name[MAXFILENAME] = 0;

        if (name[len - 1] == '/')
            name[len - 1] = 0;

        /* not all systems allow stat'ing a file with / appended */
        if (stat(name,&s) == 0)
        {
            tm_t = s.st_mtime;
            ret = 1;
        }
    }

    filedate = localtime(&tm_t);

    tmzip->tm_sec  = filedate->tm_sec;
    tmzip->tm_min  = filedate->tm_min;
    tmzip->tm_hour = filedate->tm_hour;
    tmzip->tm_mday = filedate->tm_mday;
    tmzip->tm_mon  = filedate->tm_mon ;
    tmzip->tm_year = filedate->tm_year;
#endif
#endif
    return ret;
}


int is_large_file(const char* filename)
{
    ZPOS64_T pos = 0;
    FILE* pFile = FOPEN_FUNC(filename, "rb");

    if (pFile == NULL)
        return 0;

    FSEEKO_FUNC(pFile, 0, SEEK_END);
    pos = FTELLO_FUNC(pFile);
    fclose(pFile);

    return (pos >= 0xffffffff);
}

// Calculate the CRC32 of a file, because to encrypt a file, we need known the CRC32 of the file before 
int get_file_crc(const char* filenameinzip, void *buf, unsigned long size_buf, unsigned long* result_crc)
{
    FILE *fin = NULL;
    unsigned long calculate_crc = 0;
    unsigned long size_read = 0;
    int err = ZIP_OK;

    fin = FOPEN_FUNC(filenameinzip,"rb");
    if (fin == NULL)
        err = ZIP_ERRNO;
    else
    {
        do
        {
            size_read = (int)fread(buf,1,size_buf,fin);

            if ((size_read < size_buf) && (feof(fin) == 0))
            {
                err = ZIP_ERRNO;
            }

            if (size_read > 0)
                calculate_crc = crc32(calculate_crc,buf,size_read);
        }
        while ((err == ZIP_OK) && (size_read > 0));
    }

    if (fin)
        fclose(fin);

    *result_crc = calculate_crc;
    return err;
}

//
//
//

int PackFileToZIP( FILE *zf, const char *filenameinzip, int cutfilename, char *password, int opt_compress_level )
{
	void* buf = NULL;
	int size_buf = WRITEBUFFERSIZE;
	
	 buf = (void*)malloc(size_buf);
	 if (buf == NULL)
	{
		FERROR("Error allocating memory\n");
		return ZIP_INTERNALERROR;
	}

	FILE *fin = NULL;
	int size_read = 0;
	const char *savefilenameinzip;
	zip_fileinfo zi = {0};
	unsigned long crcFile = 0;
	int zip64 = 0;
	int err = 0;
	
	// Get information about the file on disk so we can store it in zip 
	filetime(filenameinzip, &zi.tmz_date, &zi.dosDate);
	
	if ((password != NULL) )//&& (err == ZIP_OK))
	{
		err = get_file_crc(filenameinzip, buf, size_buf, &crcFile);
	}
	
	zip64 = is_large_file(filenameinzip);

	// Construct the filename that our file will be stored in the zip as.
	//   The path name saved, should not include a leading slash.
	//   If it did, windows/xp and dynazip couldn't read the zip file. 

	savefilenameinzip = filenameinzip;
	//savefilenameinzip += cutfilename;
	while (savefilenameinzip[0] == '\\' || savefilenameinzip[0] == '/')
	{
		savefilenameinzip++;
	}

	// Should the file be stored with any path info at all? 
	/*
		if (opt_exclude_path)
        {
            const char *tmpptr = NULL;
            const char *lastslash = 0;

            for (tmpptr = savefilenameinzip; *tmpptr; tmpptr++)
            {
                if (*tmpptr == '\\' || *tmpptr == '/')
                    lastslash = tmpptr;
            }

            if (lastslash != NULL)
                savefilenameinzip = lastslash + 1; // base filename follows last slash. 
        }*/

	// Add to zip file 
	err = zipOpenNewFileInZip3_64(zf, &savefilenameinzip[cutfilename], &zi,
			NULL, 0, NULL, 0, NULL /* comment*/,
			(opt_compress_level != 0) ? Z_DEFLATED : 0,
			opt_compress_level,0,
			-MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY,
			password, crcFile, zip64);

	if (err != ZIP_OK)
	{
		DEBUG("error in opening %s in zipfile (%d)\n", filenameinzip, err);
	}
	else
	{
		fin = FOPEN_FUNC(filenameinzip, "rb");
		if (fin == NULL)
		{
			err = ZIP_ERRNO;
			DEBUG("error in opening %s for reading\n", filenameinzip);
			}
	}

	if (err == ZIP_OK)
	{
		// Read contents of file and write it to zip 
		do
		{
			size_read = (int)fread(buf, 1, size_buf, fin);
			if ( (size_read < size_buf) && (feof(fin) == 0) )
			{
				FERROR("error in reading %s\n",filenameinzip);
				err = ZIP_ERRNO;
			}
			
			if (size_read > 0)
			{
				err = zipWriteInFileInZip(zf, buf, size_read);
				if (err < 0)
				{
					FERROR("error in writing %s in the zipfile (%d)\n", filenameinzip, err);
				}
			}
		}
		while ((err == ZIP_OK) && (size_read > 0));
	}
    
	if (fin)
	{
		fclose(fin);
	}
	
	if (err < 0)
	{
		err = ZIP_ERRNO;
	}
	else
	{
		err = zipCloseFileInZip(zf);
		if (err != ZIP_OK)
		{
			FERROR("error in closing %s in the zipfile (%d)\n", filenameinzip, err);
		}
	}
	
	free(buf);
	
	return err;
}

//
//
//

int PackDirectory( FILE *zipf, char *path, int cutfilename, char *password, int opt_compress_level, Http *request, int *fileNumber, int numberOfFiles )
{
	char *newpath = calloc( strlen(path) + 512, sizeof(char) );
	if( newpath == NULL )
	{
		FERROR("Cannot allocate memory for directory path\n");
		return -1;
	}
	DIR *d;
	struct dirent *dir;
	int entry = 0;
	
	d = opendir( path );
	if( d != NULL )
	{
		while( (dir = readdir(d)) != NULL )
		{
			if( strcmp( dir->d_name, "." ) == 0 || strcmp( dir->d_name, ".." ) == 0 )
			{
				continue;
			}
			
			strcpy( newpath, path );
			strcat( newpath, "/" );
			strcat( newpath, dir->d_name );
			
			int status;
			struct stat st_buf;

			status = stat (newpath, &st_buf);
			if ( status != 0 ) 
			{
				FERROR ("Error, errno = %d\n", errno );
				return 1;
			}
/*
			if (S_ISREG (st_buf.st_mode)) 
			{
				DEBUG ("%s is a regular file.\n", newpath );
				
				PackFileToZIP( zipf, newpath, password, opt_compress_level );
			}*/
			if (S_ISDIR (st_buf.st_mode) ) 
			{
				DEBUG ("%s is a directory.\n", newpath );
				
				PackDirectory( zipf, newpath, cutfilename, password, opt_compress_level, request, fileNumber, numberOfFiles );
				entry++;
			}
			else
			{
				DEBUG ("%s is a regular file.\n", newpath );
				
				PackFileToZIP( zipf, newpath, cutfilename, password, opt_compress_level );
				
				(*fileNumber)++;
				entry++;
				
				if( request != NULL )
				{
					SystemBase *sb = (SystemBase *)request->http_SB;
					char *filename = newpath;
					int newpathlen = strlen( newpath );
					if( newpathlen > 255 )
					{
						filename = newpath + (newpathlen-255);
					}
					
					char message[ 1024 ];
					
					int per = (int)( (float)(*fileNumber)/(float)numberOfFiles * 100.0f );

					int size = snprintf( message, sizeof(message), "\"action\":\"compress\",\"filename\":\"%s\",\"progress\":%d", filename, per );
					
					sb->SendProcessMessage( request, message, size );
				}
			}
		}
		closedir(d);
	}
	
	// create empty directory
	
	if( entry == 0 )
	{
		// function below should create empty folder in zip file
		
		const char *savefilenameinzip = path;
		zip_fileinfo zi = {0};
		unsigned long crcFile = 0;
		int zip64 = 0;
		int err = 0;

		//savefilenameinzip += cutfilename;
		while (savefilenameinzip[0] == '\\' || savefilenameinzip[0] == '/')
		{
			savefilenameinzip++;
		}

		int newsize = strlen( &savefilenameinzip[cutfilename] );
		if( newsize > 0 )
		{
			char *newname = FMalloc( newsize+2 );
			strcpy( newname, &savefilenameinzip[cutfilename] );
			strcat( newname, "/" );
		
			// Add to zip file 
			err = zipOpenNewDirectoryInZip3_64(zipf, newname, &zi,
				NULL, 0, NULL, 0, NULL ,
				(opt_compress_level != 0) ? Z_DEFLATED : 0,
				opt_compress_level,0,
				-MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY,
				password, crcFile, zip64);

			if (err != ZIP_OK)
			{
				err = ZIP_ERRNO;
			}
		
			FFree( newname );
		}
		
	}
	
	free( newpath );
	return 0;
}

//
//
//

int PackZip( char *zipfilename, char *compresspath, int cutfilename, char *password, Http *request, int numberOfFiles )
{
    zipFile zf = NULL;
#ifdef USEWIN32IOAPI
    zlib_filefunc64_def ffunc = {0};
#endif
	//char *zipfilename = NULL;
	//int zipfilenamearg = 0;
	int errclose = 0;
	int err = 0;
	int i = 0;
	int opt_overwrite = APPEND_STATUS_CREATE;
	int opt_compress_level = Z_DEFAULT_COMPRESSION;
	int opt_exclude_path = 0;

//	opt_overwrite = APPEND_STATUS_CREATEAFTER;

	zf = zipOpen64( zipfilename, opt_overwrite );

	if (zf == NULL)
	{
		FERROR("error creating %s\n", zipfilename);
		err = ZIP_ERRNO;
		return -1;
	}
	else
	{
	}
	
	int status;
	struct stat st_buf;
	
	status = stat (compresspath, &st_buf);
	if ( status != 0 ) 
	{
		FERROR ("Error, errno = %d\n", errno );
		return 1;
	}

	if (S_ISREG (st_buf.st_mode)) 
	{
		err = PackFileToZIP( zf, compresspath, cutfilename, password, opt_compress_level );
	}
	else if (S_ISDIR (st_buf.st_mode) ) 
	{
		DEBUG ("%s is a directory.\n", compresspath );
		
		int compressedFiles = 0;
		
		err = PackDirectory( zf, compresspath, cutfilename, password, opt_compress_level, request, &compressedFiles, numberOfFiles );
		
		err = compressedFiles;
	}

	errclose = zipClose(zf, NULL);
	if (errclose != ZIP_OK)
	{
		FERROR("error in closing %s (%d)\n", zipfilename, errclose);
	}
	
	return err;
}
