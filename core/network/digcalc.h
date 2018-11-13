/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __NETWORK_DIGCALC_H__
#define __NETWORK_DIGCALC_H__

#define HASHLEN 16
typedef char HASH[HASHLEN];
#define HASHHEXLEN 32
typedef char HASHHEX[HASHHEXLEN+1];
#define IN
#define OUT

/* calculate H(A1) as per HTTP Digest spec */
void DigestCalcHA1(
     char * pszAlg,
     char * pszUserName,
     char * pszRealm,
     char * pszPassword,
     char * pszNonce,
     char * pszCNonce,
    HASHHEX SessionKey
);

/* calculate request-digest/response-digest as per HTTP Digest spec */
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
);

#endif // __NETWORK_DIGCALC_H__
