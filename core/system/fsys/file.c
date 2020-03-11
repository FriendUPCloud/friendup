/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file file.c
 * 
 *  File structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/2016
 */

#include "file.h"
#include <system/user/user_session.h>
#include <system/fsys/device_handling.h>
#include <system/json/jsmn.h>
#include <system/systembase.h>

/**
 * Create new File
 *
 * @return pointer to new File or NULL
 */

File *FileNew()
{
	File *f = NULL;
	
	if( ( f = FCalloc( 1, sizeof(File) ) ) != NULL )
	{
		
	}
	else
	{
		FERROR("Cannot allocate memory for file\n");
	}
	
	return f;
}

/**
 * Delete File from memory
 *
 * @param f pointer to File
 */

void FileDelete( File *f )
{
	DEBUG("Delete file called\n");
	if( f!= NULL )
	{
		if( f->f_Name != NULL )
		{
			FFree( f->f_Name );
		}
		
		if( f->f_Path != NULL)
		{
			FFree( f->f_Path );
		}
		
		/*  THIS IS POINTER ONLY, SHOULD NEVER BE RELEASED HERE
		if( f->f_SessionIDPTR != NULL)
		{
			FFree( f->f_SessionIDPTR );
		}
		*/
		
		if( f->f_Execute != NULL)
		{
			FFree( f->f_Execute );
		}
		
		if( f->f_Config != NULL )
		{
			FFree( f->f_Config );
		}
		
		if( f->f_FSysName != NULL )
		{
			FFree( f->f_FSysName );
		}
		
		if( f->f_DevServer != NULL )
		{
			FFree( f->f_DevServer );
		}
		
		FFree( f );
	}
}

/**
 * Create new Shared File
 *
 * @param path which points to shared resources
 * @param name new name for shared resource
 * @return pointer to FileShared or NULL when error appear
 */

FileShared *FileSharedNew( char *path, char *name )
{
	FileShared *f = NULL;
	
	if( ( f = FCalloc( 1, sizeof(FileShared) ) ) != NULL )
	{
		f->fs_Path = StringDuplicate( path );
		
		f->fs_Name = StringDuplicate( name );
		
		f->fs_Data = ListStringNew();
	}
	else
	{
		FERROR("Cannot allocate memory for FileShared\n");
	}
	
	return f;
}

/**
 * Delete Shared File
 *
 * @param f pointer to FileShared
 */

void FileSharedDelete( FileShared *f )
{
	if( f != NULL )
	{
		if( f->fs_DeviceName != NULL )
		{
			FFree( f->fs_DeviceName );
			f->fs_DeviceName = NULL;
		}

		if( f->fs_DstUsers != NULL )
		{
			FFree( f->fs_DstUsers );
			f->fs_DstUsers = NULL;
		}
	
		if( f->fs_Hash != NULL )
		{
			FFree( f->fs_Hash );
			f->fs_Hash = NULL;
		}

		if( f->fs_Path != NULL )
		{
			FFree( f->fs_Path );
			f->fs_Path = NULL;
		}
		
		if( f->fs_Name != NULL )
		{
			FFree( f->fs_Name );
			f->fs_Name = NULL;
		}
		
		if( f->fs_Data )
		{
			ListStringDelete( f->fs_Data );
		}
		
		FFree( f );
	}
}

/**
 * Delete all FileShared linked list
 *
 * @param f pointer to first FileShared
 */

void FileSharedDeleteAll( FileShared *f )
{
	FileShared *rem = f;
	FileShared *next = f;
	
	while( next != NULL )
	{
		rem = next;
		next = (FileShared *)next->node.mln_Succ;
		
		FileSharedDelete( rem );
	}
}

/**
 * Function which scans local folder and upload it
 *
 * @param dstdev pointer to destination Friend root File
 * @param dst pointer to destination path
 * @param src pointer to source path
 * @return 0 when success, otherwise error number
 */

int FileUploadFileOrDirectoryRec( Http *request, File *dstdev, const char *dst, const char *src, int *files, int numberFiles )
{
	FHandler *fsys = dstdev->f_FSys;
	struct stat statbuf;
	if( stat( src, &statbuf ) != 0 )
	{
		return 1;
	}
	
	DEBUG("[FileUploadFileOrDirectoryRec] dst %s <- src %s start\n", dst, src );
	
	if( S_ISDIR( statbuf.st_mode ) )
	{
		DIR *dp = NULL;
		struct dirent *dptr;
		
		DEBUG("[FileUploadFileOrDirectoryRec] found directory\n");
		
		if( ( dp = opendir( src ) ) != NULL )
		{
			char *newsrc = NULL;
			char *newdst = NULL;
			
			newsrc = FCalloc( 512 + strlen( src ), sizeof(char) );
			newdst = FCalloc( 512 + strlen( dst ), sizeof(char) );
			
			DEBUG("[FileUploadFileOrDirectoryRec] found directory 1\n");
			
			if( newsrc != NULL && newdst != NULL )
			{
				while( ( dptr = readdir( dp ) ) != NULL )
				{
					if( strcmp( dptr->d_name, "." ) == 0 || strcmp( dptr->d_name, ".." ) == 0 )
					{
						continue;
					}
					
					strcpy( newsrc, src );
					strcat( newsrc, "/" );
					strcat( newsrc, dptr->d_name );
					
					strcpy( newdst, dst );
					if( dst[ strlen(dst)-1 ] != ':' )
					{
						strcat( newdst, "/" );
					}
					strcat( newdst, dptr->d_name );
					
					if( stat( newsrc, &statbuf ) == 0 )
					{
						if( S_ISDIR( statbuf.st_mode ) )
						{
							//DEBUG("\n\nCREATE DIR %s\n", newdst );
							fsys->MakeDir( dstdev, newdst );
							//if( fsys->MakeDir( dstdev, newdst ) != 0 )
							{
								if( FileUploadFileOrDirectoryRec( request, dstdev, newdst, newsrc, files, numberFiles ) != 0 )
								{
									DEBUG("[FileUploadFileOrDirectoryRec] fail!\n");
								}
							}
						}
						else
						{
							// copy file
							
							LocFile *lf = LocFileNew( (char *) newsrc, FILE_READ_NOW );
							if( lf != NULL )
							{
								File *fp = (File *)fsys->FileOpen( dstdev, newdst, "wb" );
								if( fp != NULL )
								{
									int stored = fsys->FileWrite( fp, lf->lf_Buffer, lf->lf_FileSize );
									dstdev->f_BytesStored += stored;
									fsys->FileClose( dstdev, fp );
								}
								else
								{
									FERROR("Cannot open file to store %s\n", dst );
								}
								
								LocFileDelete( lf );
							}
							else
							{
								DEBUG("[FileUploadFileOrDirectoryRec] Cannot read localfile %s\n", src );
							}
							
							// update progress
							
							(*files)++;
							
							if( request != NULL )
							{
								int namelen = strlen( newdst );
								char message[ 1024 ];
								SystemBase *sb = (SystemBase *)request->h_SB;
								
								char *fname = (char *)newdst;
								if( namelen > 255 )
								{
									fname = (char *)newdst+(namelen - 255);
								}
								
								int per = (int)( (float)(*files)/(float)numberFiles * 100.0f );
								
								DEBUG("[FileUploadFileOrDirectoryRec] UPLOAD Percentage %d count %d current %d fname %s\n", per, numberFiles, (*files), fname );
								
								//int size = snprintf( message, sizeof(message), "\"action\":\"copy\",\"filename\":\"%s\",\"progress\":%d", fname, per );

								//sb->SendProcessMessage( request, message, size );
							}
						}
					}
					else
					{
						FERROR("Stat fail on file: %s\n", newsrc );
					}
				}
			}
			if( newsrc != NULL )
			{
				FFree( newsrc );
			}
			if( newdst != NULL )
			{
				FFree( newdst );
			}
			closedir( dp );
		}
	}
	else
	{
		// copy file
		
		LocFile *lf = LocFileNew( (char *) src, FILE_READ_NOW );
		if( lf != NULL )
		{
			File *fp = (File *)fsys->FileOpen( dstdev, dst, "wb" );
			if( fp != NULL )
			{
				int stored = fsys->FileWrite( fp, lf->lf_Buffer, lf->lf_FileSize );
				dstdev->f_BytesStored += stored;
				fsys->FileClose( dstdev, fp );
			}
			else
			{
				FERROR("Cannot open file to store %s\n", dst );
			}
			
			LocFileDelete( lf );
		}
		else
		{
			DEBUG("[FileUploadFileOrDirectoryRec] Cannot read localfile %s\n", src );
		}
		
		// update progress
		
		(*files)++;
		
		if( request != NULL )
		{
			int namelen = strlen( dst );
			char message[ 1024 ];
			SystemBase *sb = (SystemBase *)request->h_SB;
			
			char *fname = (char *)dst;
			if( namelen > 255 )
			{
				fname = (char *) dst+(namelen - 255);
			}
			
			int per = (int)( (float)(*files)/(float)numberFiles * 100.0f );
			
			DEBUG("[FileUploadFileOrDirectoryRec] UPLOAD Percentage %d count %d current %d fname %s\n", per, numberFiles, (*files), fname );
			
			int size = snprintf( message, sizeof(message), "\"action\":\"copy\",\"filename\":\"%s\",\"progress\":%d", fname, per );
			
			SendProcessMessage( request, message, size );
		}
	}
	
	return 0;
}

/**
 * Function which scans local folder and upload it (Start function)
 *
 * @param us pointer to UserSession
 * @param dst pointer to destination path
 * @param src pointer to source path
 * @return 0 when success, otherwise error number
 */

int FileUploadFileOrDirectory( Http *request, void *us, const char *dst, const char *src, int numberFiles )
{
	UserSession *loggedSession = (UserSession *)us;
	File *actDev = NULL;
	char devname[ 256 ];
	memset( devname, '\0', sizeof(devname) );
	
	DEBUG("[FileUploadFileOrDirectory] start\n");
	
	// getting devname from destination path
	
	unsigned int i;
	for( i=0 ; i < strlen( dst ); i++ )
	{
		if( dst[ i ] == ':' )
		{
			dst += i+1;	// remove device name from dst path
			break;
		}
		devname[ i ] = dst[ i ]; // fill device name
	}
	
	int files = 0;
	if( ( actDev = GetRootDeviceByName( loggedSession->us_User, devname ) ) != NULL )
	{
		DEBUG("[FileUploadFileOrDirectory] file uplload rec started\n");
		
		actDev->f_Operations++;
		FileUploadFileOrDirectoryRec( request, actDev, dst, src, &files, numberFiles );
		actDev->f_Operations--;
	}
	else
	{
		return 1;
	}
	
	DEBUG("[FileUploadFileOrDirectory] end\n");
	
	return 0;
}

/**
 * Function which scans Friend folder and download it
 *
 * @param srcdev pointer to source Friend root File
 * @param dst pointer to destination path
 * @param src pointer to source path
 * @param cutPos point to place from which source path should be readed
 * @param fod file or directory flag. When you know if you want to process file or directory place values 1 for File and 2 for Directory
 * @return 0 when success, otherwise error number
 */

int FileDownloadFileOrDirectoryRec( Http *request, File *srcdev, const char *dst, const char *src, int cutPos, int fod, int *numberFiles )
{
	FHandler *fsys = srcdev->f_FSys;
	char *fname = NULL;
	int fnamesize = 0;
	int oldfod = fod;
	BufString *bs = NULL;
	
	DEBUG("[FileDownloadFileOrDirectoryRec]  start fod %d   dst: %s\n", fod, dst );
	
	if( fod <= 0 )
	{
		bs = fsys->Info( srcdev, src );
		if( bs != NULL )
		{
			//DEBUG("[FileDownloadFileOrDirectoryRec] Info result %s\n", bs->bs_Buffer );
		
			//ok<!--separate-->{"Type":"File","MetaType":"File","Path":"Home:aaaaa","Filesize":"5","Filename":"aaaaa","DateCreated":"2016-10-19 16:54:53","DateModified":"2016-10-19 16:54:53"}
			if( strncmp( "ok<!--separate-->", bs->bs_Buffer, 17 ) == 0 )
			{
				int i, i1;
				int r;
				jsmn_parser p;
				jsmntok_t t[128]; // We expect no more than 128 tokens 
			
				jsmn_init(&p);
				char *buffer = &bs->bs_Buffer[ 17 ];
			
				r = jsmn_parse(&p, buffer, bs->bs_Size - 17, t, sizeof(t)/sizeof(t[0]));
				if (r < 0) 
				{
					FERROR("Failed to parse JSON: %d\n", r);
					BufStringDelete( bs );
					return 1;
				}
			
				// Filename, Path, Filesize, DateModified, MetaType, Type (File/Directory)
				
				char *isdir = NULL;
			
				for( i = 0; i < r ; i++ )
				{
					i1 = i + 1;
					if (jsoneq( buffer, &t[ i ], "Type") == 0) 
					{
						if( strncmp( "Directory",  buffer + t[ i1 ].start, t[ i1 ].end-t[ i1 ].start ) == 0 )
						{
							isdir = buffer + t[ i1 ].start;
						}
					}
					else if (jsoneq( buffer, &t[ i ], "Filename") == 0) 
					{
						fname = buffer + t[ i1 ].start;
						fnamesize = t[ i1 ].end-t[ i1 ].start;
					}
				}
			
				// is directory
			
				if( isdir != NULL )
				{
					fod = 2;
				}
			
				// is file
			
				else
				{
					fod = 1;
				}
			}
		}
	}
	
	//
	//
	
	// is directory
	
	if( fod == 2 )
	{
		BufString *bsdir = fsys->Dir( srcdev, src );
		char *newsrc = NULL;
		char *newdst = NULL;
		
		newsrc = FCalloc( 512 + strlen( src ), sizeof(char) );
		newdst = FCalloc( 512 + strlen( dst ), sizeof(char) );
		
		DEBUG("[FileDownloadFileOrDirectoryRec] found directory 1\n");
		
		mkdir( dst, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
		
		if( bsdir != NULL && newsrc != NULL && newdst != NULL )
		{
			//DEBUG("[FileDownloadFileOrDirectoryRec] Received %s for path %s\n", bsdir->bs_Buffer, src );
			if( strncmp( "ok<!--separate-->", bsdir->bs_Buffer, 17 ) == 0 )
			{
				int i;
				int r;
				jsmn_parser p;
				
				// assume we will have not more then 1024 entries
				jsmntok_t *t;
				
				// 1024 multiplied by 18 = 18432
				if( ( t = FCalloc( 18432, sizeof( jsmntok_t ) ) ) != NULL )
				{
					jsmn_init(&p);
					char *buffer = &bsdir->bs_Buffer[ 17 ];

					unsigned int entr = 0;
					jsmntok_t *tokens = JSONTokenise( buffer, &entr );
					
					// find all File objects
					
					size_t object_tokens = 0;
					size_t i, j;
					
					if( tokens != NULL )
					{
						for ( i = 0; i < entr; i++ )
						{
							jsmntok_t *t = &tokens[ i ];
						
							if( t->type == JSMN_ARRAY )
							{
								int objsize = t->size;
								int z;
								t++;
								i++;
							
								for( z = 0; z < objsize ; z++ )
								{
									int elements = t->size;
									char *locname = NULL;
									char *loctype = NULL;
								
									int x;
									t++;
									i++;
									for( x = 0; x < elements ; x++ )
									{
										jsmntok_t *valt = t + 1;
									
										if( strncmp( "Filename",  buffer + t->start, t->end-t->start ) == 0 )
										{
											locname = StringDuplicateN( buffer + valt->start, valt->end-valt->start );
										}
										else if( strncmp( "Type",  buffer + t->start, t->end-t->start ) == 0 )
										{
											loctype = StringDuplicateN( buffer + valt->start, valt->end-valt->start );
										}

										t += 2;
									}
								
									if( locname != NULL && loctype != NULL )
									{
										int srclen = strlen( src );
										
										//DEBUG("SRC %s\n", src );
										
										strcpy( newsrc, src );
										if( src[ srclen-1 ] != '/' && src[ srclen-1 ] != ':' )
										{
											strcat( newsrc, "/" );
										}
										//DEBUG("NSRC %s\n", newsrc );
										strcat( newsrc, locname );
										//DEBUG("NSRC1 %s\n", newsrc );
									
										int dstlen = strlen( dst );
										strcpy( newdst, dst );
										//DEBUG("NDST %s\n", newdst );
										if( dst[ dstlen-1 ] != '/' && dst[ dstlen-1 ] != ':' )
										{
											strcat( newdst, "/" );
										}
										//DEBUG("NDST1 %s\n", newdst );
										
										/*
										if( strlen( &src[ cutPos ] ) > 1 )
										{
											strcat( newdst, &src[ cutPos ] );
										}
										*/
										//DEBUG("NDST2 %s\n", newdst );
										
										mkdir( newdst, 0777 );
										
										strcat( newdst, locname );
										//DEBUG("--------------------------newdst : %s\n ---------------- locname: %s\nsrc+cut : %s\n dst : %s\n", newdst, locname, &src[ cutPos ], dst );

										if( strcmp( "File", loctype ) == 0 )
										{
											// copy file to local storage
										
											FILE *storefile = NULL;
										
											if( ( storefile = fopen( newdst, "wb" ) ) != NULL )
											{
												char dbuf[ 32768 ];
												
												//DEBUG("\n\n\n\n--->STOREFILE srcdev  : %s changed: %s NEWDST %s\n\n", src, &src[ cutPos ], newdst );
											
												File *srcfp = (File *)fsys->FileOpen( srcdev, newsrc, "rb" );
												if( srcfp != NULL )
												{
													int rcnt = 0;
												
													while( ( rcnt = fsys->FileRead( srcfp, dbuf, 32768 ) ) != -1 )
													{
														fwrite( dbuf, 1, rcnt, storefile );
													}
													fsys->FileClose( srcdev, srcfp );
												}
												else
												{
													FERROR("Cannot open file to store %s\n", dst );
												}
												fclose( storefile );
											}
											
											(*numberFiles)++;
											
											if( request != NULL )
											{
												int namelen = strlen( dst );
												char message[ 1024 ];
												SystemBase *sb = (SystemBase *)request->h_SB;
												
												char *fname = (char *)dst;
												if( namelen > 255 )
												{
													fname = (char *) dst+(namelen - 255);
												}

												int size = snprintf( message, sizeof(message), "\"action\":\"copy\",\"filename\":\"%s\",\"progress\":null", fname );

												sb->SendProcessMessage( request, message, size );
											}
										}
										else
										{
											strcat( newsrc, "/" );
											
											mkdir( newdst, 0777 );
											
											//DEBUG("Directory will be downloaded  newdst %s newsrc %s\n\n\n", newdst, newsrc );
											FileDownloadFileOrDirectoryRec( request, srcdev, newdst, newsrc, cutPos, 2, numberFiles );
										}
									}
								
									i += SHIFT_LEFT( elements, 2);
									if( locname != NULL )
									{
										FFree( locname );
									}
									if( loctype != NULL )
									{
										FFree( loctype );
									}
								}
							}
							DEBUG("[FileDownloadFileOrDirectoryRec] type %d size %d\n", t->type, t->size );
						}
						FFree( tokens );
					}
					
					FFree( t );
				}	// t calloc
			}
			if( bsdir != NULL )
			{
				BufStringDelete( bsdir );
			}
			if( newsrc != NULL )
			{
				FFree( newsrc );
			}
			if( newdst != NULL )
			{
				FFree( newdst );
			}
		}
	}
	
	// is file
	
	else if( fod == 1 )
	{
		DEBUG("[FileDownloadFileOrDirectoryRec] File will be downloaded on start: %s\n", dst );
		// copy file to local storage
		
		FILE *storefile = NULL;
		
		char *newdst = FCalloc( 512 + strlen( dst ), sizeof(char) );
		if( newdst != NULL )
		{
			strcpy( newdst, dst );
			if( fname != NULL )
			{
				char *nname = StringDuplicateN( fname, fnamesize );
				if( nname != NULL )
				{
					if( oldfod != -1 )
					{
						strcat( newdst, nname );
					}
					FFree( nname );
				}
			}
			
			//DEBUG("\n\n\nsrcdev  : %s changed: %s NEWDST %s\n\n", src, &src[ cutPos ], newdst );

			if( ( storefile = fopen( newdst, "wb" ) ) != NULL )
			{
				// 1024 mul 32 = 32768
				char dbuf[ 32768 ];

				File *srcfp = (File *)fsys->FileOpen( srcdev, src, "rb" );
				if( srcfp != NULL )
				{
					int rcnt = 0;

					while( ( rcnt = fsys->FileRead( srcfp, dbuf, 32768 ) ) != -1 )
					{
						fwrite( dbuf, 1, rcnt, storefile );
					}
					fsys->FileClose( srcdev, srcfp );
				}
				else
				{
					FERROR("Cannot open file to store %s\n", dst );
				}
				fclose( storefile );
				
				(*numberFiles)++;
				
				if( request != NULL )
				{
					int namelen = strlen( dst );
					char message[ 1024 ];
					SystemBase *sb = (SystemBase *)request->h_SB;
					
					char *fname = (char *)dst;
					if( namelen > 255 )
					{
						fname = (char *) dst+(namelen - 255);
					}
					
					int size = snprintf( message, sizeof(message), "\"action\":\"copy\",\"filename\":\"%s\",\"progress\":null", fname );
					
					sb->SendProcessMessage( request, message, size );
				}
			}
			FFree( newdst );
		}
	}
	
	if( bs != NULL )
	{
		BufStringDelete( bs );
	}
	
	DEBUG("[FileDownloadFileOrDirectoryRec] end\n");
	
	return 0;
}

/**
 * Function which scans Friend folder and download it (Start function)
 *
 * @param request pointer to http request
 * @param us pointer to UserSession
 * @param basepath path from which files are downloaded
 * @param dst pointer to destination path
 * @param src pointer to source path
 * @return 0 when success, otherwise error number
 */

int FileDownloadFilesOrFolder( Http *request, void *us, const char *basepath, const char *dst, char *src, int *numberFiles )
{
	UserSession *loggedSession = (UserSession *)us;
	File *actDev = NULL;
	char devname[ 256 ];
	memset( devname, '\0', sizeof(devname) );
	int basePos = strlen( basepath );
	
	DEBUG("[FileDownloadFilesOrFolder] start\n");
	
	// getting devname from destination path
	
	unsigned int i;
	*numberFiles = 0;
	
	for( i=0 ; i < strlen( src ); i++ )
	{
		if( src[ i ] == ':' )
		{
			basePos -= (i+1);
			break;
		}
		devname[ i ] = src[ i ];
	}
	
	//DEBUG("[FileDownloadFilesOrFolder] getdevbyname\n");
	
	DEBUG("\n============================================================\n\n\n dst: %s\nsrc: %s\nbasepath: %s\nbasepos: %d\n\n\n\n\n", dst, src, basepath, basePos );
	
	if( ( actDev = GetRootDeviceByName( loggedSession->us_User, devname ) ) != NULL )
	{
		actDev->f_Operations++;
		
		char *lfile = src;
		int lastslash = 0;
		unsigned int length = strlen( src )-1;
		int locbpath = strlen( basepath );
		
		for( i=1 ; i < length ; i++ )
		{
			if( src[ i ] == ':' || src[ i ] == '/' )
			{
				if( src[ i+1 ] != ';' )
				{
					lastslash = i;
				}
			}
			else if( src[ i ] == ';' )
			{
				unsigned int j;
				src[ i ] = 0;
				
				for( j = 0 ; j < strlen( lfile ) ; j++ )
				{
					if( lfile[ j ] == ':' )
					{
						break;
					}
				}
				DEBUG("[FileDownloadFilesOrFolder] download\n");
				
				char *tmpdst = FCalloc( strlen( dst ) + 512, sizeof( char ) );
				if( tmpdst != NULL )
				{
					strcpy( tmpdst, dst );
					strcat( tmpdst, &src[ lastslash+1 ] );
					
					DEBUG("\n\n\nCOPY------------>TMPDST %s   dst %s\n\n\n", tmpdst, &lfile[ j+1 ] );

					FileDownloadFileOrDirectoryRec( request, actDev, tmpdst, &lfile[ j+1 ], basePos, -1, numberFiles );
					FFree( tmpdst );
				}
				lfile = &src[ i+1 ];
				
				lastslash = i;
			}
		}
		
		{
			int coma = 0;
			int end = 0;
			int j;
			int flen = strlen( lfile )-1;
			for( j = 1 ; j < flen ; j++ )
			{
				if( lfile[ j ] == ':' )
				{
					coma = j;
					end = j;
				}
				else if( lfile[ j ] == '/' )
				{
					end = j;
				}
			}
			
			char *tmpdst = FCalloc( strlen( dst ) + 512, sizeof( char ) );
			if( tmpdst != NULL )
			{
				strcpy( tmpdst, dst );
				strcat( tmpdst, &lfile[ end+1 ] );
				
				DEBUG("============= dst %s\n========= tmpdst %s\n", &lfile[ end+1 ], tmpdst );
				
				actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
				FileDownloadFileOrDirectoryRec( request, actDev, tmpdst, &lfile[ coma+1 ], basePos, -1, numberFiles );
				FFree( tmpdst );
			}
		}
		
		actDev->f_Operations--;
	}
	else
	{
		return 1;
	}
	
	DEBUG("[FileDownloadFilesOrFolder] end\n");
	DEBUG("============================================================================\n");
	
	return 0;
}

/**
 * Function which scans Friend files and delete them
 *
 * @param srcdev pointer to source Friend root File
 * @param src pointer to source path
 * @param fod file or directory flag. When you know if you want to process file or directory place values 1 for File and 2 for Directory
 * @return 0 when success, otherwise error number
 */

int FileOrDirectoryDeleteRec( Http *request, File *srcdev, const char *src, int fod, int *numberFiles )
{
	FHandler *fsys = srcdev->f_FSys;
	char *fname = NULL;
	int fnamesize = 0;
	int oldfod = fod;
	BufString *bs = NULL;
	
	DEBUG("[FileOrDirectoryDeleteRec]  start fod %d  - srcpath '%s'\n", fod, src );
	
	if( fod <= 0 )
	{
		bs = fsys->Info( srcdev, src );
		if( bs != NULL )
		{
			DEBUG("[FileOrDirectoryDeleteRec] Info result %s\n", bs->bs_Buffer );

			if( strncmp( "ok<!--separate-->", bs->bs_Buffer, 17 ) == 0 )
			{
				int i, i1;
				int r;
				jsmn_parser p;
				jsmntok_t t[128]; // We expect no more than 128 tokens 
			
				jsmn_init(&p);
				char *buffer = &bs->bs_Buffer[ 17 ];
			
				r = jsmn_parse(&p, buffer, bs->bs_Size - 17, t, sizeof(t)/sizeof(t[0]));
				if (r < 0) 
				{
					FERROR("Failed to parse JSON: %d\n", r);
					BufStringDelete( bs );
					return 1;
				}
			
				// Filename, Path, Filesize, DateModified, MetaType, Type (File/Directory)
				
				char *isdir = NULL;
			
				for( i = 0; i < r ; i++ )
				{
					i1 = i + 1;
					if (jsoneq( buffer, &t[ i ], "Type") == 0) 
					{
						if( strncmp( "Directory",  buffer + t[ i1 ].start, t[ i1 ].end-t[ i1 ].start ) == 0 )
						{
							isdir = buffer + t[ i1 ].start;
						}
					}
					else if (jsoneq( buffer, &t[ i ], "Filename") == 0) 
					{
						fname = buffer + t[ i1 ].start;
						fnamesize = t[ i1 ].end-t[ i1 ].start;
					}
				}
			
				// is directory
			
				if( isdir != NULL )
				{
					fod = 2;
				}
			
				// is file
			
				else
				{
					fod = 1;
				}
			}
		}
	}
	
	//
	//
	
	// is directory
	
	if( fod == 2 )
	{
		BufString *bsdir = fsys->Dir( srcdev, src );
		char *newsrc = NULL;
		
		newsrc = FCalloc( 512 + strlen( src ), sizeof(char) );
		
		DEBUG("[FileOrDirectoryDeleteRec] found directory 1\n");
		
		if( bsdir != NULL && newsrc != NULL )
		{
			DEBUG("[FileOrDirectoryDeleteRec] Received %s for path %s\n", bsdir->bs_Buffer, src );
			if( strncmp( "ok<!--separate-->", bsdir->bs_Buffer, 17 ) == 0 )
			{
				int i;
				int r;
				jsmn_parser p;
				
				// assume we will have not more then 1024 entries
				jsmntok_t *t;
				
				// 1024 multiplied by 18 = 18432
				if( ( t = FCalloc( 18432, sizeof( jsmntok_t ) ) ) != NULL )
				{
					jsmn_init(&p);
					char *buffer = &bsdir->bs_Buffer[ 17 ];

					unsigned int entr = 0;
					jsmntok_t *tokens = JSONTokenise( buffer, &entr );
					
					// find all File objects
					
					size_t object_tokens = 0;
					size_t i, j;
					
					if( tokens != NULL )
					{
						for ( i = 0; i < entr; i++ )
						{
							jsmntok_t *t = &tokens[ i ];
						
							if( t->type == JSMN_ARRAY )
							{
								int objsize = t->size;
								int z;
								t++;
								i++;
							
								for( z = 0; z < objsize ; z++ )
								{
									int elements = t->size;
									char *locname = NULL;
									char *loctype = NULL;
								
									int x;
									t++;
									i++;
									for( x = 0; x < elements ; x++ )
									{
										jsmntok_t *valt = t + 1;
									
										if( strncmp( "Filename",  buffer + t->start, t->end-t->start ) == 0 )
										{
											locname = StringDuplicateN( buffer + valt->start, valt->end-valt->start );
										}
										else if( strncmp( "Type",  buffer + t->start, t->end-t->start ) == 0 )
										{
											loctype = StringDuplicateN( buffer + valt->start, valt->end-valt->start );
										}

										t += 2;
									}
								
									if( locname != NULL && loctype != NULL )
									{
										int srclen = strlen( src );
										strcpy( newsrc, src );
										if( src[ srclen-1 ] != '/' && src[ srclen-1 ] != ':' )
										{
											strcat( newsrc, "/" );
										}
										strcat( newsrc, locname );

										if( strcmp( "File", loctype ) == 0 )
										{
											fsys->Delete( srcdev, newsrc );
											
											(*numberFiles)++;
										}
										else
										{
											strcat( newsrc, "/" );
											
											//DEBUG("Directory will be deleted  newdst %s newsrc %s\n\n\n", newdst, newsrc );
											FileOrDirectoryDeleteRec( request, srcdev, newsrc, 2, numberFiles );
										}
									}
								
									i += SHIFT_LEFT( elements, 2 );
									if( locname != NULL )
									{
										FFree( locname );
									}
									if( loctype != NULL )
									{
										FFree( loctype );
									}
								}
							}
							DEBUG("[FileOrDirectoryDeleteRec] type %d size %d\n", t->type, t->size );
						}
						FFree( tokens );
					}
					
					FFree( t );
				}	// t calloc
			}
			if( bsdir != NULL )
			{
				BufStringDelete( bsdir );
			}
			if( newsrc != NULL )
			{
				FFree( newsrc );
			}
		}
	}
	
	// is file
	
	else if( fod == 1 )
	{
		DEBUG("[FileOrDirectoryDeleteRec] File will be deleted on start: %s\n", src );
		// copy file to local storage
		fsys->Delete( srcdev, src );
	}
	
	if( bs != NULL )
	{
		BufStringDelete( bs );
	}
	
	DEBUG("[FileOrDirectoryDeleteRec] end\n");
	
	return 0;
}

