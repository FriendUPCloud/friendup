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
 * @author MN
 * @date 

 */

#include <core/types.h>
#include <openssl/md5.h>

#include <string.h>
#include "digcalc.h"

//
//
//

void CvtHex( HASH Bin, HASHHEX Hex )
{
	unsigned short i;
	unsigned char j;

	for (i = 0; i < HASHLEN; i++)
	{
		j = (Bin[i] >> 4) & 0xf;
		if (j <= 9)
			Hex[i*2] = (j + '0');
		else
			Hex[i*2] = (j + 'a' - 10);
		
		j = Bin[i] & 0xf;
		
		if (j <= 9)
			Hex[i*2+1] = (j + '0');
		else
			Hex[i*2+1] = (j + 'a' - 10);
	}
	Hex[HASHHEXLEN] = '\0';
};

//
// calculate H(A1) as per spec 
//

void DigestCalcHA1(
	char * pszAlg,
	char * pszUserName,
	char * pszRealm,
	char * pszPassword,
	char * pszNonce,
	char * pszCNonce,
	HASHHEX SessionKey
	)
	{
	MD5_CTX Md5Ctx;
	HASH HA1;

	MD5_Init(&Md5Ctx);
	MD5_Update(&Md5Ctx, pszUserName, (size_t)strlen(pszUserName));
	MD5_Update(&Md5Ctx, ":", 1);
	MD5_Update(&Md5Ctx, pszRealm, strlen(pszRealm));
	MD5_Update(&Md5Ctx, ":", 1);
	MD5_Update(&Md5Ctx, pszPassword, strlen(pszPassword));
	MD5_Final((unsigned char *)HA1, &Md5Ctx);
	if ( strcmp(pszAlg, "md5-sess") == 0) 
	{
		MD5_Init(&Md5Ctx);
		MD5_Update(&Md5Ctx, HA1, HASHLEN);
		MD5_Update(&Md5Ctx, ":", 1);
		MD5_Update(&Md5Ctx, pszNonce, strlen(pszNonce));
		MD5_Update(&Md5Ctx, ":", 1);
		MD5_Update(&Md5Ctx, pszCNonce, strlen(pszCNonce));
		MD5_Final((unsigned char *)HA1, &Md5Ctx);
	};
	CvtHex(HA1, SessionKey);
};

//
// calculate request-digest/response-digest as per HTTP Digest spec
//

void DigestCalcResponse(
	HASHHEX HA1,           /* H(A1) */
	char * pszNonce,       /* nonce from server */
	char * pszNonceCount,  /* 8 hex digits */
	char * pszCNonce,      /* client nonce */
	char * pszQop,         /* qop-value: "", "auth", "auth-int" */
	char * pszMethod,      /* method from the request */
	char * pszDigestUri,   /* requested URL */
	HASHHEX HEntity,       /* H(entity body) if qop="auth-int" */
	HASHHEX Response      /* request-digest or response-digest */
	)
{
	MD5_CTX Md5Ctx;
	HASH HA2;
	HASH RespHash;
	HASHHEX HA2Hex;

// calculate H(A2)
	MD5_Init(&Md5Ctx);
	MD5_Update(&Md5Ctx, pszMethod, strlen(pszMethod));
	MD5_Update(&Md5Ctx, ":", 1);
	MD5_Update(&Md5Ctx, pszDigestUri, strlen(pszDigestUri));

	if (strcmp(pszQop, "auth-int") == 0) 
	{
		MD5_Update(&Md5Ctx, ":", 1);
		MD5_Update(&Md5Ctx, HEntity, HASHHEXLEN);
	};
	MD5_Final((unsigned char *)HA2, &Md5Ctx);
	CvtHex(HA2, HA2Hex);

// calculate response
	MD5_Init(&Md5Ctx);
	MD5_Update(&Md5Ctx, HA1, HASHHEXLEN);
	MD5_Update(&Md5Ctx, ":", 1);
	MD5_Update(&Md5Ctx, pszNonce, strlen(pszNonce));
	MD5_Update(&Md5Ctx, ":", 1);
	if (*pszQop) 
	{
		MD5_Update(&Md5Ctx, pszNonceCount, strlen(pszNonceCount));
		MD5_Update(&Md5Ctx, ":", 1);
		MD5_Update(&Md5Ctx, pszCNonce, strlen(pszCNonce));
		MD5_Update(&Md5Ctx, ":", 1);
		MD5_Update(&Md5Ctx, pszQop, strlen(pszQop));
		MD5_Update(&Md5Ctx, ":", 1);
	};
	MD5_Update(&Md5Ctx, HA2Hex, HASHHEXLEN);
	MD5_Final((unsigned char *) RespHash, &Md5Ctx);
	CvtHex(RespHash, Response);
};
