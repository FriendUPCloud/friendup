/* Copyright (c) 2015-2016 the Civetweb developers
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
 */

#ifdef _MSC_VER
#ifndef _CRT_SECURE_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS
#endif
#endif

#include <stdlib.h>
#include <stdio.h>

#include "public_func.h"
#include <civetweb.h>

/* This unit test file uses the excellent Check unit testing library.
 * The API documentation is available here:
 * http://check.sourceforge.net/doc/check_html/index.html
 */

START_TEST(test_httplib_version)
{
	const char *ver = httplib_version();
	unsigned major = 0, minor = 0;
	unsigned feature_files, feature_https, feature_cgi, feature_ipv6,
	    feature_websocket, feature_lua, feature_duktape, feature_caching;
	unsigned expect_files = 0, expect_https = 0, expect_cgi = 0,
	         expect_ipv6 = 0, expect_websocket = 0, expect_lua = 0,
	         expect_duktape = 0, expect_caching = 0;
	int ret;

	ck_assert(ver != NULL);
	ck_assert_str_eq(ver, CIVETWEB_VERSION);

	/* check structure of version string */
	ret = sscanf(ver, "%u.%u", &major, &minor);
	ck_assert_int_eq(ret, 2);
	ck_assert_uint_ge(major, 1);
	if (major == 1) {
		ck_assert_uint_ge(minor, 8); /* current version is 1.8 */
	}

	/* check feature */
	feature_files = httplib_check_feature(1);
	feature_https = httplib_check_feature(2);
	feature_cgi = httplib_check_feature(4);
	feature_ipv6 = httplib_check_feature(8);
	feature_websocket = httplib_check_feature(16);
	feature_lua = httplib_check_feature(32);
	feature_duktape = httplib_check_feature(64);
	feature_caching = httplib_check_feature(128);

#if !defined(NO_FILES)
	expect_files = 1;
#endif
#if !defined(NO_SSL)
	expect_https = 1;
#endif
#if !defined(NO_CGI)
	expect_cgi = 1;
#endif
#if defined(USE_IPV6)
	expect_ipv6 = 1;
#endif
#if defined(USE_WEBSOCKET)
	expect_websocket = 1;
#endif
#if defined(USE_LUA)
	expect_lua = 1;
#endif
#if defined(USE_DUKTAPE)
	expect_duktape = 1;
#endif
#if !defined(NO_CACHING)
	expect_caching = 1;
#endif

	ck_assert_uint_eq(expect_files, !!feature_files);
	ck_assert_uint_eq(expect_https, !!feature_https);
	ck_assert_uint_eq(expect_cgi, !!feature_cgi);
	ck_assert_uint_eq(expect_ipv6, !!feature_ipv6);
	ck_assert_uint_eq(expect_websocket, !!feature_websocket);
	ck_assert_uint_eq(expect_lua, !!feature_lua);
	ck_assert_uint_eq(expect_duktape, !!feature_duktape);
	ck_assert_uint_eq(expect_caching, !!feature_caching);
}
END_TEST


START_TEST(test_httplib_get_valid_options)
{
	int i;
	const struct httplib_option *default_options = httplib_get_valid_options();

	ck_assert(default_options != NULL);

	for (i = 0; default_options[i].name != NULL; i++) {
		ck_assert(default_options[i].name != NULL);
		ck_assert(strlen(default_options[i].name) > 0);
		ck_assert(((int)default_options[i].type) > 0);
	}

	ck_assert(i > 0);
}
END_TEST


START_TEST(test_httplib_get_builtin_mime_type)
{
	ck_assert_str_eq(httplib_get_builtin_mime_type("x.txt"), "text/plain");
	ck_assert_str_eq(httplib_get_builtin_mime_type("x.html"), "text/html");
	ck_assert_str_eq(httplib_get_builtin_mime_type("x.HTML"), "text/html");
	ck_assert_str_eq(httplib_get_builtin_mime_type("x.hTmL"), "text/html");
	ck_assert_str_eq(httplib_get_builtin_mime_type("/abc/def/ghi.htm"), "text/html");
	ck_assert_str_eq(httplib_get_builtin_mime_type("x.unknown_extention_xyz"), "text/plain");
}
END_TEST


START_TEST(test_httplib_strncasecmp)
{
	ck_assert(httplib_strncasecmp("abc", "abc", 3) == 0);
	ck_assert(httplib_strncasecmp("abc", "abcd", 3) == 0);
	ck_assert(httplib_strncasecmp("abc", "abcd", 4) != 0);
	ck_assert(httplib_strncasecmp("a", "A", 1) == 0);

	ck_assert(httplib_strncasecmp("A", "B", 1) < 0);
	ck_assert(httplib_strncasecmp("A", "b", 1) < 0);
	ck_assert(httplib_strncasecmp("a", "B", 1) < 0);
	ck_assert(httplib_strncasecmp("a", "b", 1) < 0);
	ck_assert(httplib_strncasecmp("b", "A", 1) > 0);
	ck_assert(httplib_strncasecmp("B", "A", 1) > 0);
	ck_assert(httplib_strncasecmp("b", "a", 1) > 0);
	ck_assert(httplib_strncasecmp("B", "a", 1) > 0);

	ck_assert(httplib_strncasecmp("xAx", "xBx", 3) < 0);
	ck_assert(httplib_strncasecmp("xAx", "xbx", 3) < 0);
	ck_assert(httplib_strncasecmp("xax", "xBx", 3) < 0);
	ck_assert(httplib_strncasecmp("xax", "xbx", 3) < 0);
	ck_assert(httplib_strncasecmp("xbx", "xAx", 3) > 0);
	ck_assert(httplib_strncasecmp("xBx", "xAx", 3) > 0);
	ck_assert(httplib_strncasecmp("xbx", "xax", 3) > 0);
	ck_assert(httplib_strncasecmp("xBx", "xax", 3) > 0);
}
END_TEST


START_TEST(test_httplib_get_cookie)
{
	char buf[32];
	int ret;
	const char *longcookie = "key1=1; key2=2; key3; key4=4; key5=; key6; "
	                         "key7=this+is+it; key8=8; key9";

	/* invalid result buffer */
	ret = httplib_get_cookie("", "notfound", NULL, 999);
	ck_assert_int_eq(ret, -2);

	/* zero size result buffer */
	ret = httplib_get_cookie("", "notfound", buf, 0);
	ck_assert_int_eq(ret, -2);

	/* too small result buffer */
	ret = httplib_get_cookie("key=toooooooooolong", "key", buf, 4);
	ck_assert_int_eq(ret, -3);

	/* key not found in string */
	ret = httplib_get_cookie("", "notfound", buf, sizeof(buf));
	ck_assert_int_eq(ret, -1);

	ret = httplib_get_cookie(longcookie, "notfound", buf, sizeof(buf));
	ck_assert_int_eq(ret, -1);

	/* key not found in string */
	ret = httplib_get_cookie("key1=1; key2=2; key3=3", "notfound", buf, sizeof(buf));
	ck_assert_int_eq(ret, -1);

	/* keys are found as first, middle and last key */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_cookie("key1=1; key2=2; key3=3", "key1", buf, sizeof(buf));
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("1", buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_get_cookie("key1=1; key2=2; key3=3", "key2", buf, sizeof(buf));
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("2", buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_get_cookie("key1=1; key2=2; key3=3", "key3", buf, sizeof(buf));
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("3", buf);

	/* longer value in the middle of a longer string */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_cookie(longcookie, "key7", buf, sizeof(buf));
	ck_assert_int_eq(ret, 10);
	ck_assert_str_eq("this+is+it", buf);

	/* key with = but without value in the middle of a longer string */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_cookie(longcookie, "key5", buf, sizeof(buf));
	ck_assert_int_eq(ret, 0);
	ck_assert_str_eq("", buf);

	/* key without = and without value in the middle of a longer string */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_cookie(longcookie, "key6", buf, sizeof(buf));
	ck_assert_int_eq(ret, -1);
	/* TODO: httplib_get_cookie and httplib_get_var(2) should have the same behavior */
}
END_TEST


START_TEST(test_httplib_get_var)
{
	char buf[32];
	int ret;
	const char *shortquery = "key1=1&key2=2&key3=3";
	const char *longquery = "key1=1&key2=2&key3&key4=4&key5=&key6&"
	                        "key7=this+is+it&key8=8&key9&&key10=&&"
	                        "key7=that+is+it&key12=12";

	/* invalid result buffer */
	ret = httplib_get_var2("", 0, "notfound", NULL, 999, 0);
	ck_assert_int_eq(ret, -2);

	/* zero size result buffer */
	ret = httplib_get_var2("", 0, "notfound", buf, 0, 0);
	ck_assert_int_eq(ret, -2);

	/* too small result buffer */
	ret = httplib_get_var2("key=toooooooooolong", 19, "key", buf, 4, 0);
	/* ck_assert_int_eq(ret, -3);
	   --> TODO: httplib_get_cookie returns -3, httplib_get_var -2. This should be
	   unified. */
	ck_assert(ret < 0);

	/* key not found in string */
	ret = httplib_get_var2("", 0, "notfound", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, -1);

	ret = httplib_get_var2( longquery, strlen(longquery), "notfound", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, -1);

	/* key not found in string */
	ret = httplib_get_var2(
	    shortquery, strlen(shortquery), "notfound", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, -1);

	/* key not found in string */
	ret = httplib_get_var2("key1=1&key2=2&key3=3&notfound=here",
	                  strlen(shortquery),
	                  "notfound",
	                  buf,
	                  sizeof(buf),
	                  0);
	ck_assert_int_eq(ret, -1);

	/* key not found in string */
	ret = httplib_get_var2(
	    shortquery, strlen(shortquery), "key1", buf, sizeof(buf), 1);
	ck_assert_int_eq(ret, -1);

	/* keys are found as first, middle and last key */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_var2(
	    shortquery, strlen(shortquery), "key1", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("1", buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_get_var2(
	    shortquery, strlen(shortquery), "key2", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("2", buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_get_var2(
	    shortquery, strlen(shortquery), "key3", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("3", buf);

	/* httplib_get_var call httplib_get_var2 with last argument 0 */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_var(shortquery, strlen(shortquery), "key1", buf, sizeof(buf));
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq("1", buf);

	/* longer value in the middle of a longer string */
	memset(buf, 77, sizeof(buf));
	ret = httplib_get_var2(longquery, strlen(longquery), "key7", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 10);
	ck_assert_str_eq("this is it", buf);

	/* longer value in the middle of a longer string - seccond occurance of key
	 */
	memset(buf, 77, sizeof(buf));
	ret =
	    httplib_get_var2(longquery, strlen(longquery), "key7", buf, sizeof(buf), 1);
	ck_assert_int_eq(ret, 10);
	ck_assert_str_eq("that is it", buf);

	/* key with = but without value in the middle of a longer string */
	memset(buf, 77, sizeof(buf));
	ret =
	    httplib_get_var2(longquery, strlen(longquery), "key5", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 0);
	ck_assert_str_eq(buf, "");

	/* key without = and without value in the middle of a longer string */
	memset(buf, 77, sizeof(buf));
	ret =
	    httplib_get_var2(longquery, strlen(longquery), "key6", buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, -1);
	ck_assert_str_eq(buf, "");
	/* TODO: this is the same situation as with httplib_get_value */
}
END_TEST


START_TEST(test_httplib_md5)
{
	char buf[33];
	char *ret;
	const char *long_str =
	    "_123456789A123456789B123456789C123456789D123456789E123456789F123456789"
	    "G123456789H123456789I123456789J123456789K123456789L123456789M123456789"
	    "N123456789O123456789P123456789Q123456789R123456789S123456789T123456789"
	    "U123456789V123456789W123456789X123456789Y123456789Z";

	memset(buf, 77, sizeof(buf));
	ret = httplib_md5(buf, NULL);
	ck_assert_str_eq(buf, "d41d8cd98f00b204e9800998ecf8427e");
	ck_assert_str_eq(ret, "d41d8cd98f00b204e9800998ecf8427e");
	ck_assert_ptr_eq(ret, buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_md5(buf, "The quick brown fox jumps over the lazy dog.", NULL);
	ck_assert_str_eq(buf, "e4d909c290d0fb1ca068ffaddf22cbd0");
	ck_assert_str_eq(ret, "e4d909c290d0fb1ca068ffaddf22cbd0");
	ck_assert_ptr_eq(ret, buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_md5(buf, "", "The qu", "ick bro", "", "wn fox ju", "m", "ps over the la", "", "", "zy dog.", "", NULL);
	ck_assert_str_eq(buf, "e4d909c290d0fb1ca068ffaddf22cbd0");
	ck_assert_str_eq(ret, "e4d909c290d0fb1ca068ffaddf22cbd0");
	ck_assert_ptr_eq(ret, buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_md5(buf, long_str, NULL);
	ck_assert_str_eq(buf, "1cb13cf9f16427807f081b2138241f08");
	ck_assert_str_eq(ret, "1cb13cf9f16427807f081b2138241f08");
	ck_assert_ptr_eq(ret, buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_md5(buf, long_str + 1, NULL);
	ck_assert_str_eq(buf, "cf62d3264334154f5779d3694cc5093f");
	ck_assert_str_eq(ret, "cf62d3264334154f5779d3694cc5093f");
	ck_assert_ptr_eq(ret, buf);
}
END_TEST


START_TEST(test_httplib_url_encode)
{
	char buf[20];
	int ret;

	memset(buf, 77, sizeof(buf));
	ret = httplib_url_encode("abc", buf, sizeof(buf));
	ck_assert_int_eq(3, ret);
	ck_assert_str_eq("abc", buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_url_encode("a%b/c&d.e", buf, sizeof(buf));
	ck_assert_int_eq(15, ret);
	ck_assert_str_eq("a%25b%2fc%26d.e", buf);

	memset(buf, 77, sizeof(buf));
	ret = httplib_url_encode("%%%", buf, 4);
	ck_assert_int_eq(-1, ret);
	ck_assert_str_eq("%25", buf);
}
END_TEST


START_TEST(test_httplib_url_decode)
{
	char buf[20];
	int ret;

	ret = httplib_url_decode("abc", 3, buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 3);
	ck_assert_str_eq(buf, "abc");

	ret = httplib_url_decode("abcdef", 3, buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 3);
	ck_assert_str_eq(buf, "abc");

	ret = httplib_url_decode("x+y", 3, buf, sizeof(buf), 0);
	ck_assert_int_eq(ret, 3);
	ck_assert_str_eq(buf, "x+y");

	ret = httplib_url_decode("x+y", 3, buf, sizeof(buf), 1);
	ck_assert_int_eq(ret, 3);
	ck_assert_str_eq(buf, "x y");

	ret = httplib_url_decode("%25", 3, buf, sizeof(buf), 1);
	ck_assert_int_eq(ret, 1);
	ck_assert_str_eq(buf, "%");
}
END_TEST


START_TEST(test_httplib_get_response_code_text)
{
	int i;
	size_t j, len;
	const char *resp;

	for (i = 100; i < 600; i++) {
		resp = httplib_get_response_code_text(NULL, i);
		ck_assert_ptr_ne(resp, NULL);
		len = strlen(resp);
		ck_assert_uint_gt(len, 1);
		ck_assert_uint_lt(len, 32);
		for (j = 0; j < len; j++) {
			if (resp[j] == ' ') {
				/* space is valid */
			} else if (resp[j] == '-') {
				/* hyphen is valid */
			} else if (resp[j] >= 'A' && resp[j] <= 'Z') {
				/* A-Z is valid */
			} else if (resp[j] >= 'a' && resp[j] <= 'z') {
				/* a-z is valid */
			} else {
				ck_abort_msg("Found letter %c (%02xh) in %s",
				             resp[j],
				             resp[j],
				             resp);
			}
		}
	}
}
END_TEST


Suite *
make_public_func_suite(void)
{
	Suite *const suite = suite_create("PublicFunc");

	TCase *const tcase_version = tcase_create("Version");
	TCase *const tcase_get_valid_options = tcase_create("Options");
	TCase *const tcase_get_builtin_mime_type = tcase_create("MIME types");
	TCase *const tcase_strncasecmp = tcase_create("strcasecmp");
	TCase *const tcase_urlencodingdecoding =
	    tcase_create("URL encoding decoding");
	TCase *const tcase_cookies = tcase_create("Cookies and variables");
	TCase *const tcase_md5 = tcase_create("MD5");
	TCase *const tcase_aux = tcase_create("Aux functions");

	tcase_add_test(tcase_version, test_httplib_version);
	tcase_set_timeout(tcase_version, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_version);

	tcase_add_test(tcase_get_valid_options, test_httplib_get_valid_options);
	tcase_set_timeout(tcase_get_valid_options, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_get_valid_options);

	tcase_add_test(tcase_get_builtin_mime_type, test_httplib_get_builtin_mime_type);
	tcase_set_timeout(tcase_get_builtin_mime_type, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_get_builtin_mime_type);

	tcase_add_test(tcase_strncasecmp, test_httplib_strncasecmp);
	tcase_set_timeout(tcase_strncasecmp, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_strncasecmp);

	tcase_add_test(tcase_urlencodingdecoding, test_httplib_url_encode);
	tcase_add_test(tcase_urlencodingdecoding, test_httplib_url_decode);
	tcase_set_timeout(tcase_urlencodingdecoding, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_urlencodingdecoding);

	tcase_add_test(tcase_cookies, test_httplib_get_cookie);
	tcase_add_test(tcase_cookies, test_httplib_get_var);
	tcase_set_timeout(tcase_cookies, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_cookies);

	tcase_add_test(tcase_md5, test_httplib_md5);
	tcase_set_timeout(tcase_md5, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_md5);

	tcase_add_test(tcase_aux, test_httplib_get_response_code_text);
	tcase_set_timeout(tcase_aux, civetweb_min_test_timeout);
	suite_add_tcase(suite, tcase_aux);

	return suite;
}
