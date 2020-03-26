/* miniunz.c
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
#  include <sys/stat.h>
#  include <unistd.h>
#  include <utime.h>
#endif

#include <string.h>
#include <limits.h>     /* PATH_MAX */
#include <sys/stat.h>   /* mkdir(2) */
#include <errno.h>

int mkdir_p(const char *path)
{
    /* Adapted from http://stackoverflow.com/a/2336245/119527 */
    const size_t len = strlen(path);
    char _path[PATH_MAX];
    char *p; 

    errno = 0;

    /* Copy string so its mutable */
    if (len > sizeof(_path)-1) {
        errno = ENAMETOOLONG;
        return -1; 
    }   
    strcpy(_path, path);

    /* Iterate the string */
    for (p = _path + 1; *p; p++) {
        if (*p == '/') {
            /* Temporarily truncate */
            *p = '\0';

            if (mkdir(_path, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH) != 0) {
                if (errno != EEXIST)
                    return -1; 
            }

            *p = '/';
        }
    }   

    if (mkdir(_path, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH) != 0) {
        if (errno != EEXIST)
            return -1; 
    }   

    return 0;
}

//#  define MKDIR(d) mkdir(d, 0777)
//#  define MKDIR(d) mkdir(d, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH)
#ifdef _WIN32
#  define MKDIR(d) _mkdir(d)
#  define CHDIR(d) _chdir(d)
#else
#  define MKDIR(d) mkdir_p(d)
#  define CHDIR(d) chdir(d)
#endif

#include "unzip.h"

#define WRITEBUFFERSIZE (8192)
#define MAXFILENAME     (256)

#ifdef _WIN32
#  define USEWIN32IOAPI
#  include "iowin32.h"
#endif

#include <util/log/log.h>
#include <util/buffered_string.h>
#include <system/user/user_session.h>
#include <system/systembase.h>
#include <network/http.h>

int CountFilesInArchiveZip( const char *zipfilename, const char *password, int *count );

void change_file_date(const char *filename, uLong dosdate, tm_unz tmu_date)
{
#ifdef _WIN32
    HANDLE hFile;
    FILETIME ftm, ftLocal, ftCreate, ftLastAcc, ftLastWrite;

    hFile = CreateFileA(filename, GENERIC_READ | GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
    if (hFile != INVALID_HANDLE_VALUE)
    {
        GetFileTime(hFile, &ftCreate, &ftLastAcc, &ftLastWrite);
        DosDateTimeToFileTime((WORD)(dosdate>>16),(WORD)dosdate, &ftLocal);
        LocalFileTimeToFileTime(&ftLocal, &ftm);
        SetFileTime(hFile, &ftm, &ftLastAcc, &ftm);
        CloseHandle(hFile);
    }
#else
#if defined unix || defined __APPLE__
    struct utimbuf ut;
    struct tm newdate;

    newdate.tm_sec = tmu_date.tm_sec;
    newdate.tm_min = tmu_date.tm_min;
    newdate.tm_hour = tmu_date.tm_hour;
    newdate.tm_mday = tmu_date.tm_mday;
    newdate.tm_mon = tmu_date.tm_mon;
    if (tmu_date.tm_year > 1900)
        newdate.tm_year = tmu_date.tm_year - 1900;
    else
        newdate.tm_year = tmu_date.tm_year ;
    newdate.tm_isdst = -1;

    ut.actime = ut.modtime = mktime(&newdate);
    utime(filename,&ut);
#endif
#endif
}

//
//
//

int makedir(const char *newdir)
{
    char *buffer = NULL;
    char *p = NULL;
    int len = (int)strlen(newdir);

    if (len <= 0)
        return 0;

    buffer = (char*)malloc(len+1);
    if (buffer == NULL)
    {
        printf("Error allocating memory\n");
        return UNZ_INTERNALERROR;
    }

    strcpy(buffer, newdir);

    if (buffer[len-1] == '/')
        buffer[len-1] = 0;

    if (MKDIR(buffer) == 0)
    {
        free(buffer);
        return 1;
    }

    p = buffer + 1;
    while (1)
    {
        char hold;
        while(*p && *p != '\\' && *p != '/')
            p++;
        hold = *p;
        *p = 0;

        if ((MKDIR(buffer) == -1) && (errno == ENOENT))
        {
            printf("couldn't create directory %s (%d)\n", buffer, errno);
            free(buffer);
            return 0;
        }

        if (hold == 0)
            break;

        *p++ = hold;
    }

    free(buffer);
    return 1;
}

//
//
//

void display_zpos64(ZPOS64_T n, int size_char)
{
    /* To avoid compatibility problem we do here the conversion */
    char number[21] = {0};
    int offset = 19;
    int pos_string = 19;
    int size_display_string = 19;

    while (1)
    {
        number[offset] = (char)((n%10) + '0');
        if (number[offset] != '0')
            pos_string = offset;
        n /= 10;
        if (offset == 0)
            break;
        offset--;
    }

    size_display_string -= pos_string;
    while (size_char-- > size_display_string)
        printf(" ");
    printf("%s",&number[pos_string]);
}

//
//
//

int do_list( unzFile uf, BufString *bs )
{
    int err = unzGoToFirstFile(uf);
    if (err != UNZ_OK)
    {
        DEBUG("error %d with zipfile in unzGoToFirstFile\n", err);
        return 1;
    }

    BufStringAdd( bs, "  Length  Method     Size Ratio   Date    Time   CRC-32     Name\n");
	BufStringAdd( bs, "  ------  ------     ---- -----   ----    ----   ------     ----\n");

    do
    {
        char filename_inzip[256] = {0};
        unz_file_info64 file_info = {0};
        uLong ratio = 0;
        const char *string_method = NULL;
        char charCrypt = ' ';

        err = unzGetCurrentFileInfo64(uf, &file_info, filename_inzip, sizeof(filename_inzip), NULL, 0, NULL, 0);
        if (err != UNZ_OK)
        {
            printf("error %d with zipfile in unzGetCurrentFileInfo\n", err);
            break;
        }

        if (file_info.uncompressed_size > 0)
            ratio = (uLong)((file_info.compressed_size*100) / file_info.uncompressed_size);

        /* Display a '*' if the file is encrypted */
        if ((file_info.flag & 1) != 0)
            charCrypt = '*';

        if (file_info.compression_method == 0)
            string_method = "Stored";
        else if (file_info.compression_method == Z_DEFLATED)
        {
            uInt iLevel = (uInt)((file_info.flag & 0x6) / 2);
            if (iLevel == 0)
              string_method = "Defl:N";
            else if (iLevel == 1)
              string_method = "Defl:X";
            else if ((iLevel == 2) || (iLevel == 3))
              string_method = "Defl:F"; /* 2:fast , 3 : extra fast*/
        }
        else if (file_info.compression_method == Z_BZIP2ED)
        {
            string_method = "BZip2 ";
        }
        else
            string_method = "Unkn. ";

		char buffer[ 1024 ];
		
        display_zpos64(file_info.uncompressed_size, 7);
        int size = snprintf( buffer, sizeof(buffer), "  %6s%c", string_method, charCrypt);
		BufStringAddSize( bs, buffer, size );
		
        display_zpos64(file_info.compressed_size, 7);
		size = snprintf( buffer, sizeof(buffer)," %3lu%%  %2.2lu-%2.2lu-%2.2lu  %2.2lu:%2.2lu  %8.8lx   %s\n", ratio,
                (uLong)file_info.tmu_date.tm_mon + 1, (uLong)file_info.tmu_date.tm_mday,
                (uLong)file_info.tmu_date.tm_year % 100,
                (uLong)file_info.tmu_date.tm_hour, (uLong)file_info.tmu_date.tm_min,
                (uLong)file_info.crc, filename_inzip);
		
		BufStringAddSize( bs, buffer, size );

        err = unzGoToNextFile(uf);
    }
    while (err == UNZ_OK);

    if (err != UNZ_END_OF_LIST_OF_FILE && err != UNZ_OK) {
        FERROR("error %d with zipfile in unzGoToNextFile\n", err);
        return err;
    }

    return 0;
}


//
//
//

int count_list(unzFile uf, int *entries )
{
	*entries = 0;
	
	int err = unzGoToFirstFile(uf);
	if (err != UNZ_OK)
	{
		FERROR("error %d with zipfile in unzGoToFirstFile\n", err);
		return 1;
	}
	
	DEBUG("Count list\n");
	
	do
	{
		(*entries)++;
		//DEBUG("next entry %d\n", (*entries) );
		
		err = unzGoToNextFile(uf);
	}
	while (err == UNZ_OK);
	
	if (err != UNZ_END_OF_LIST_OF_FILE && err != UNZ_OK) {
		FERROR("error %d with zipfile in unzGoToNextFile\n", err);
		return err;
	}
	
	return 0;
}

int check_file_exists(const char* filename);

//
//
//

int do_extract_currentfile(unzFile uf, const char *directory,  int opt_extract_without_path, int* popt_overwrite, const char *password)
{
    unz_file_info64 file_info = {0};
    FILE* fout = NULL;
    void* buf = NULL;
    uInt size_buf = WRITEBUFFERSIZE;
    int err = UNZ_OK;
    int errclose = UNZ_OK;
    int skip = 0;
    char filename_inzip[4096] = {0};
    char* filename_withoutpath = NULL;
    char* write_filename = NULL;
    char* p = NULL;
	
	char *dstname = NULL;

    err = unzGetCurrentFileInfo64(uf, &file_info, filename_inzip, sizeof(filename_inzip), NULL, 0, NULL, 0);
    if (err != UNZ_OK)
    {
        printf("error %d with zipfile in unzGetCurrentFileInfo\n",err);
        return err;
    }

    dstname = malloc( strlen(directory)+strlen(filename_inzip) +128 ); //+64

    p = filename_withoutpath = filename_inzip;
    while (*p != 0)
    {
        if ((*p == '/') || (*p == '\\'))
            filename_withoutpath = p+1;
        p++;
    }

    /* If zip entry is a directory then create it on disk */
    if (*filename_withoutpath == 0)
    {
        if (opt_extract_without_path == 0)
        {
			strcpy( dstname, directory );
			strcat( dstname, "/" );
			
			int len = strlen(filename_inzip )-1;

			if( filename_inzip[ len ] != '/' )
			{
				strcat( dstname, filename_inzip );
			}
			else
			{
				filename_inzip[ len ] = 0;
				strcat( dstname, filename_inzip );
			}

			int e = MKDIR(dstname);

            //MKDIR(filename_inzip);
			//printf("ERROR: makedir %s\n", dstname );
        }
        free( dstname );
        return err;
    }

    buf = (void*)malloc(size_buf);
    if (buf == NULL)
    {
        printf("Error allocating memory\n");
		free( dstname );
        return UNZ_INTERNALERROR;
    }

    err = unzOpenCurrentFilePassword(uf, password);
    if (err != UNZ_OK)
	{
        printf("error %d with zipfile in unzOpenCurrentFilePassword\n", err);
	}

    if (opt_extract_without_path)
	{
        //write_filename = filename_withoutpath;
		
		strcpy( dstname, directory );
		strcat( dstname, "/" );
		strcat( dstname, filename_withoutpath );
		write_filename = dstname;
	}
    else
	{
       // write_filename = filename_inzip;
		
		strcpy( dstname, directory );
		strcat( dstname, "/" );
		strcat( dstname, filename_inzip );
		write_filename = dstname;
	}
	
	printf("write_filename %s\n", write_filename );

    /* Determine if the file should be overwritten or not and ask the user if needed */
    if ((err == UNZ_OK) && (*popt_overwrite == 0) && (check_file_exists(write_filename)))
    {
		*popt_overwrite = 1;
		/*
        char rep = 0;
        do
        {
            char answer[128];
            printf("The file %s exists. Overwrite ? [y]es, [n]o, [A]ll: ", write_filename);
            if (scanf("%1s", answer) != 1)
                exit(EXIT_FAILURE);
            rep = answer[0];
            if ((rep >= 'a') && (rep <= 'z'))
                rep -= 0x20;
        }
        while ((rep != 'Y') && (rep != 'N') && (rep != 'A'));

        if (rep == 'N')
            skip = 1;
        if (rep == 'A')
            *popt_overwrite = 1;
		*/
    }

    /* Create the file on disk so we can unzip to it */
    if ((skip == 0) && (err == UNZ_OK))
    {
		//printf("open file: %s\n", write_filename );
		
        fout = FOPEN_FUNC(write_filename, "wb");
        /* Some zips don't contain directory alone before file */
        if ((fout == NULL) && (opt_extract_without_path == 0) &&
            (filename_withoutpath != (char*)filename_inzip))
        {
			int slashPosition = strlen( write_filename ) - strlen( filename_withoutpath );
			printf("Slash position %d\n", slashPosition );
			
			char c = write_filename[ slashPosition ];
			write_filename[ slashPosition ] = 0;
			
			printf("filename_withoutpath--------------%s  write_filename : %s  - %c\n", filename_withoutpath, write_filename, c );
			
            makedir(write_filename);
			write_filename[ slashPosition ] = c;
			
			printf("--=====again open %s\n", write_filename );
            fout = FOPEN_FUNC(write_filename, "wb");
        }
        if (fout == NULL)
		{
            printf("error opening %s\n", write_filename);
		}
    }

    /* Read from the zip, unzip to buffer, and write to disk */
    if (fout != NULL)
    {
        //printf(" extracting: %s\n", write_filename);

        do
        {
            err = unzReadCurrentFile(uf, buf, size_buf);
            if (err < 0)
            {
                printf("error %d with zipfile in unzReadCurrentFile\n", err);
                break;
            }
            if (err == 0)
                break;
            if (fwrite(buf, err, 1, fout) != 1)
            {
                printf("error %d in writing extracted file\n", errno);
                err = UNZ_ERRNO;
                break;
            }
        }
        while (err > 0);

        if (fout)
            fclose(fout);

        /* Set the time of the file that has been unzipped */
        if (err == 0)
            change_file_date(write_filename,file_info.dosDate, file_info.tmu_date);
    }

    errclose = unzCloseCurrentFile(uf);
    if (errclose != UNZ_OK)
        printf("error %d with zipfile in unzCloseCurrentFile\n", errclose);

    free(buf);
	free( dstname );
    return err;
}

//
// return number of extracted files
//

int do_extract_all(unzFile uf, const char *directory, int opt_extract_without_path, int opt_overwrite, const char *password, Http *request, int count )
{
	DEBUG("Do extract all\n");
	
	int err = unzGoToFirstFile(uf);
	if (err != UNZ_OK)
	{
		DEBUG("error %d with zipfile in unzGoToFirstFile\n", err);
		return -1;
	}
	
	int curfile = 0;

	do
	{
		err = do_extract_currentfile(uf, directory, opt_extract_without_path, &opt_overwrite, password);
		if (err != UNZ_OK)
		{
			break;
		}

		if( request != NULL )
		{
			curfile++;
			
			SystemBase *sb = (SystemBase *) request->http_SB;
			
			char message[ 1024 ];
			
			int per = (int)( (float)curfile/(float)count * 100.0f );
			
			unz_file_info64 file_info = {0};
			char filename_inzip[256] = {0};
			
			err = unzGetCurrentFileInfo64(uf, &file_info, filename_inzip, sizeof(filename_inzip), NULL, 0, NULL, 0);
			
			DEBUG("Percentage %d count %d current %d fname %s\n", per, count, curfile, filename_inzip );
			
			if (err != UNZ_OK)
			{
				FERROR("error %d with zipfile in unzGetCurrentFileInfo\n",err);
			}
			else
			{
				int size = snprintf( message, sizeof(message), "\"action\":\"decompress\",\"filename\":\"%s\",\"progress\":%d", filename_inzip, per );
				
				DEBUG(" sbptr %p  request ptr %p usersession %p\n", sb, request, request->http_UserSession );
				
				sb->SendProcessMessage( request, message, size );
			}
		}
		
		err = unzGoToNextFile(uf);
	}
	while (err == UNZ_OK);

	if (err != UNZ_END_OF_LIST_OF_FILE)
	{
		DEBUG("error %d with zipfile in unzGoToNextFile\n", err);
		return -1;
	}
	return curfile;
}

//
//
//

int do_extract_onefile(unzFile uf, const char *directory, const char* filename, int opt_extract_without_path, int opt_overwrite,
    const char* password)
{
    if (unzLocateFile(uf, filename, NULL) != UNZ_OK)
    {
        printf("file %s not found in the zipfile\n", filename);
        return 2;
    }
    if (do_extract_currentfile(uf, directory, opt_extract_without_path, &opt_overwrite, password) == UNZ_OK)
        return 0;
    return 1;
}

//
// unpack file to directory
//

int UnpackZip( const char *zipfilename, const char *dirname, const char *password, Http *request )
{
    //const char *zipfilename = NULL;
    const char *filename_to_extract = NULL;
    //const char *password = NULL;
    int i = 0;
    int ret = 0;
    int opt_do_list = 0;
    int opt_do_extract = 1;
    int opt_do_extract_withoutpath = 0;
    int opt_overwrite = 0;
    int opt_extractdir = 1;		// default 0
    //const char *dirname = NULL;
    unzFile uf = NULL;
	
	DEBUG("UnpackZIP called\n");

    // Open zip file 
    if (zipfilename != NULL)
    {
#ifdef USEWIN32IOAPI
        zlib_filefunc64_def ffunc;
        fill_win32_filefunc64A(&ffunc);
        uf = unzOpen2_64(zipfilename, &ffunc);
#else
        uf = unzOpen64(zipfilename);
#endif
    }

    if (uf == NULL)
    {
        DEBUG("Cannot open %s\n", zipfilename);
        return 1;
    }

    DEBUG("%s opened\n", zipfilename);

    /* Process command line options */
    /*
	if (opt_do_list == 1)
    {
		BufString *bs = BufStringNew();
		if( bs != NULL )
		{
			ret = do_list(uf, bs );
			BufStringDelete( bs );
		}
    }
    else if (opt_do_extract == 1)
    {*/
		/*
        if (opt_extractdir && CHDIR(dirname))
        {
            printf("Error changing into %s, aborting\n", dirname);
            exit(-1);
        }
        */
		
		int count = 0;
		
		CountFilesInArchiveZip( zipfilename, password, &count );

        if (filename_to_extract == NULL)
		{
			ret = do_extract_all(uf, dirname, opt_do_extract_withoutpath, opt_overwrite, password, request, count );
		}
        else
		{
            ret = do_extract_onefile(uf, dirname, filename_to_extract, opt_do_extract_withoutpath, opt_overwrite, password);
		}
    //}

    unzClose(uf);
    return ret;
}

//
// list zip archive
//

BufString *ListZip( const char *zipfilename, const char *password )
{
	const char *filename_to_extract = NULL;
	int i = 0;
	int ret = 0;
	int opt_do_list = 0;
	int opt_do_extract = 1;
	int opt_do_extract_withoutpath = 0;
	int opt_overwrite = 0;
	int opt_extractdir = 1;		// default 0
	unzFile uf = NULL;
	
	DEBUG("List called\n");

	// Open zip file 
	if (zipfilename != NULL)
	{
		#ifdef USEWIN32IOAPI
		zlib_filefunc64_def ffunc;
		fill_win32_filefunc64A(&ffunc);
		uf = unzOpen2_64(zipfilename, &ffunc);
		#else
		uf = unzOpen64(zipfilename);
		#endif
	}
	
	if (uf == NULL)
	{
		DEBUG("Cannot open %s\n", zipfilename);
		return NULL;
	}
	
	BufString *bs = BufStringNew();
	if( bs != NULL )
	{
		DEBUG("%s opened\n", zipfilename);
	
		// Process command line options 
		if (opt_do_list == 1)
		{
			ret = do_list( uf, bs );
		}
	}

	unzClose(uf);
	return bs;
}


//
// count zip archive files
//

int CountFilesInArchiveZip( const char *zipfilename, const char *password, int *count )
{
	const char *filename_to_extract = NULL;
	int i = 0;
	int ret = 0;
	int opt_do_list = 0;
	int opt_do_extract = 1;
	int opt_do_extract_withoutpath = 0;
	int opt_overwrite = 0;
	int opt_extractdir = 1;		// default 0
	unzFile uf = NULL;
	
	DEBUG("List called\n");
	
	// Open zip file 
	if (zipfilename != NULL)
	{
		#ifdef USEWIN32IOAPI
		zlib_filefunc64_def ffunc;
		fill_win32_filefunc64A(&ffunc);
		uf = unzOpen2_64(zipfilename, &ffunc);
		#else
		uf = unzOpen64(zipfilename);
		#endif
	}
	
	if (uf == NULL)
	{
		DEBUG("Cannot open %s\n", zipfilename);
		return 1;
	}
	
	DEBUG("%s opened\n", zipfilename);
	
	/* Process command line options */
	//if (opt_do_list == 1)
	{
		ret = count_list( uf, count );
	}
	
	unzClose(uf);
	return ret;
}
