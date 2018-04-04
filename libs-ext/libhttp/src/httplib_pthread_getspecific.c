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

/*
 * void *httplib_pthread_getspecific( pthread_key_t key );
 *
 * Thei platform independent function httplib_pthread_getspecific() returns
 * data registered for a specific thread with a call to the function
 * httplib_pthread_setspecific(). If no data could be found the value NULL is
 * returned.
 *
 * If supported by the platform, the function is implemented as a wrapper
 * around the pthread_getspecific() function. On other platforms equivalent
 * code for that system is used.
 */

void *httplib_pthread_getspecific( pthread_key_t key ) {

#if defined(_WIN32)

	return TlsGetValue( key );

#else  /* _WIN32 */

	return pthread_getspecific( key );

#endif  /* _WIN32 */

}  /* httplib_pthread_getspecific */
