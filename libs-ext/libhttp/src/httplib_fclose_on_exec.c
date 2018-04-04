/* 
 * Copyright (c) 2016 Lammert Bies
 * Copyright (c) 2013-2016 the Civetweb developers
 * Copyright (c) 2004-2013 Sergey Lyubka
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * ============
 * Release: 2.0
 */

#include "httplib_main.h"

void XX_httplib_fclose_on_exec( struct lh_ctx_t *ctx, struct file *filep, struct lh_con_t *conn ) {

	if ( ctx == NULL  ||  filep == NULL  ||  filep->fp == NULL ) return;

#ifdef _WIN32
	UNUSED_PARAMETER(conn);
#else

	char error_string[ERROR_STRING_LEN];

	if ( fcntl( fileno( filep->fp ), F_SETFD, FD_CLOEXEC) != 0 ) {

		if ( conn != NULL ) httplib_cry( LH_DEBUG_ERROR, ctx, conn, "%s: fcntl(F_SETFD FD_CLOEXEC) failed: %s", __func__, httplib_error_string( ERRNO, error_string, ERROR_STRING_LEN ) );
	}
#endif

}  /* XX_httplib_fclose_on_exec */
