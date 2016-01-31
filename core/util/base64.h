

#ifndef __UTIL_BASE64_H__
#define __UTIL_BASE64_H__

char* Base64Encode( const unsigned char* data, int length );

char* Base64Decode( const unsigned char* data, int length, int *finalLength );

#endif
