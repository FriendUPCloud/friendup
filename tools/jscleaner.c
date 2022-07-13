
#include <stdio.h>
#include <stdlib.h>
#include <dirent.h>
#include <errno.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>

int debug = 0;

//
//
//

static unsigned GetFileSize( char * fileName)
{
	struct stat sb;
	if( stat( fileName, & sb) != 0 )
	{
		fprintf (stderr, "'stat' failed for '%s': %s.\n",
                 fileName, strerror (errno));
		return -1;
	}
	return sb.st_size;
}

//
//
//

static char *ReadFile( char * fileName, int *fileLen )
{
	unsigned s;
	char *contents;
	FILE * f;
	size_t bytes_read;
	int status;

	s = GetFileSize( fileName );
	contents = malloc (s + 1);
	if( !contents )
	{
		fprintf (stderr, "Not enough memory.\n");
		return NULL;
	}
	
	*fileLen = s;

	f = fopen (fileName, "r");
	if( !f )
	{
		fprintf (stderr, "Could not open '%s': %s.\n", fileName, strerror (errno));
		return NULL;
	}
	bytes_read = fread (contents, sizeof (unsigned char), s, f);
	if( bytes_read != s )
	{
		fprintf (stderr, "Short read of '%s': expected %d bytes "
                 "but got %d: %s.\n", fileName, s, bytes_read,
                 strerror (errno));
		return NULL;
	}
	status = fclose (f);
	if( status != 0 )
	{
        fprintf (stderr, "Error closing '%s': %s.\n", fileName,
                 strerror (errno));
		return NULL;
	}
	return contents;
}

//
//
//

void FilterFile( char *fname )
{
	char *file;
	int fileLen = 0;
	
	if( ( file = ReadFile( fname, &fileLen ) ) != NULL )
	{
		FILE * fp = fopen( fname, "wb" );
	//if( ( file = ReadFile( "test.js", &fileLen ) ) != NULL )
	//{
	//	FILE * fp = fopen( "testout.js", "wb" );
		if( fp != NULL )
		{
			char *dataptr = file;
			char *lastPosition = file;
			
			if( debug == 1 )
			{
				printf("Input and output files opened\n");
			}
			
			while( (dataptr = strstr( dataptr, "console.log(" ) ) != NULL )
			{
				int copyLen = dataptr - lastPosition;
				int inQuotes = 0;
				int prevCharBackslasah = 0;
				char *origDataptr = dataptr;
				
				// move to end of console log
				int countBraces = 1;
				dataptr += 12;
				
				if( debug == 1 )
				{
					printf("Found console.log, file %p dataptr %p\n", file, dataptr );
				}
				
				while( *dataptr != 0 )
				{
					if( *dataptr == '\'' && prevCharBackslasah == 0 )
					{
						if( inQuotes == 0 )
						{
							inQuotes = 1;
						}
						else
						{
							inQuotes = 0;
						}
					}
					else if( *dataptr == '(' )
					{
						countBraces++;
					}
					else if( *dataptr == ')' )
					{
						countBraces--;
						
						if( countBraces <= 0 )
						{
							break;
						}
					}
					
					if( *dataptr == '\\' )
					{
						prevCharBackslasah = 1;
					}
					else
					{
						prevCharBackslasah = 0;
					}
					
					if( debug == 1 )
					{
						printf("Inside. inQuotes %d countBraces %d prevCharBackslasah %d\n", inQuotes, countBraces, prevCharBackslasah );
					}
					dataptr++;
				}
				
				// else console
				char *els = origDataptr-5;
				int foundElse = 0;
				if( strncmp( els, "else", 4 ) == 0 )
				{
					foundElse = 1;
				}
				
				// if    console.log( ); -> remove
				// if    console.log( ) -> do not remove   and if there is   else before
				
				if( *(dataptr+1) == ';' && foundElse == 0 )
				{
					fwrite( lastPosition, 1, copyLen, fp );
					dataptr += 2;
					
					lastPosition = dataptr;
				}
				else
				{
					dataptr += 1;
					copyLen = dataptr - lastPosition;
					fwrite( lastPosition, 1, copyLen, fp );
					
					lastPosition = dataptr;
				}
			
			}
			
			int copyLen = (file + fileLen) - lastPosition;
			fwrite( lastPosition, 1, copyLen, fp );
			
			fclose( fp );
		}
		free( file );
	}
}

//
//
//

void FilterDirectory( char *path )
{
	int slashOnTheEnd = 0;
	if( path == NULL )
	{
		return;
	}
	
	if( path[ strlen( path )-1 ] == '/' )
	{
		slashOnTheEnd = 1;
	}
	
	DIR * d = opendir( path ); // open the path
	if(d==NULL) return; // if was not able, return
	struct dirent * dir; // for the directory entries
	
	while ((dir = readdir(d)) != NULL) // if we were able to read somehting from the directory
	{
		char d_path[10280]; // here I am using sprintf which is safer than strcat
		
		if(dir-> d_type != DT_DIR) // if the type is not directory just print it with blue color
		{
			// only js files
			int nameLen = strlen( dir->d_name );
			if( dir->d_name[ nameLen-3 ] == '.' && dir->d_name[ nameLen-2 ] == 'j' && dir->d_name[ nameLen-1 ] == 's' )
			{
				if( slashOnTheEnd == 0 )
				{
					sprintf(d_path, "%s/%s", path, dir->d_name);
				}
				else
				{
					sprintf(d_path, "%s%s", path, dir->d_name);
				}
				printf("%s\n", d_path );
			
				FilterFile( d_path );
			}
		}
		else
		if(dir -> d_type == DT_DIR && strcmp(dir->d_name,".")!=0 && strcmp(dir->d_name,"..")!=0 ) // if it is a directory
		{
			printf("Going into directory: %s\n", dir->d_name); // print its name in green
			
			if( slashOnTheEnd == 0 )
			{
				sprintf(d_path, "%s/%s", path, dir->d_name);
			}
			else
			{
				sprintf(d_path, "%s%s", path, dir->d_name);
			}
			FilterDirectory( d_path ); // recall with the new path
		}
	}
    closedir(d); // finally close the directory
}

//
//
//

int main( int argc, char **argv )
{
	char *directory = NULL;
	int i;
	
	for( i=0 ; i < argc ; i++ )
	{
		if( strcmp( argv[ i ], "-dir" ) == 0 )
		{
			directory = argv[ i+1 ];
		}
		else if( strcmp( argv[ i ], "-debug" ) == 0 )
		{
			debug = 1;
		}
	}
	
	if( directory != NULL )
	{
		FilterDirectory( directory );
	}
	else
	{
		printf("Parameter -dir is missing\n");
	}

	return 0;
}

