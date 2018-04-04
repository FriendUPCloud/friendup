/* Copyright (c) 2013-2014 the Civetweb developers
 * Copyright (c) 2013 No Face Press, LLC
 * License http://opensource.org/licenses/mit-license.php MIT License
 */

// Simple example program on how to use Embedded C++ interface.

#include "CivetServer.h"

#ifdef _WIN32
#include <Windows.h>
#else
#include <unistd.h>
#endif

#define DOCUMENT_ROOT "."
#define PORT "8081"
#define EXAMPLE_URI "/example"
#define EXIT_URI "/exit"
bool exitNow = false;

class ExampleHandler : public CivetHandler
{
  public:
	bool
	handleGet(CivetServer *server, struct httplib_connection *conn)
	{
		httplib_printf(conn,
		          "HTTP/1.1 200 OK\r\nContent-Type: "
		          "text/html\r\nConnection: close\r\n\r\n");
		httplib_printf(conn, "<html><body>\r\n");
		httplib_printf(conn,
		          "<h2>This is an example text from a C++ handler</h2>\r\n");
		httplib_printf(conn,
		          "<p>To see a page from the A handler <a "
		          "href=\"a\">click here</a></p>\r\n");
		httplib_printf(conn,
		          "<p>To see a page from the A handler with a parameter "
		          "<a href=\"a?param=1\">click here</a></p>\r\n");
		httplib_printf(conn,
		          "<p>To see a page from the A/B handler <a "
		          "href=\"a/b\">click here</a></p>\r\n");
		httplib_printf(conn,
		          "<p>To see a page from the *.foo handler <a "
		          "href=\"xy.foo\">click here</a></p>\r\n");
		httplib_printf(conn,
		          "<p>To exit <a href=\"%s\">click here</a></p>\r\n",
		          EXIT_URI);
		httplib_printf(conn, "</body></html>\r\n");
		return true;
	}
};

class ExitHandler : public CivetHandler
{
  public:
	bool
	handleGet(CivetServer *server, struct httplib_connection *conn)
	{
		httplib_printf(conn,
		          "HTTP/1.1 200 OK\r\nContent-Type: "
		          "text/plain\r\nConnection: close\r\n\r\n");
		httplib_printf(conn, "Bye!\n");
		exitNow = true;
		return true;
	}
};

class AHandler : public CivetHandler
{
  private:
	bool
	handleAll(const char *method,
	          CivetServer *server,
	          struct httplib_connection *conn)
	{
		std::string s = "";
		httplib_printf(conn,
		          "HTTP/1.1 200 OK\r\nContent-Type: "
		          "text/html\r\nConnection: close\r\n\r\n");
		httplib_printf(conn, "<html><body>");
		httplib_printf(conn, "<h2>This is the A handler for \"%s\" !</h2>", method);
		if (CivetServer::getParam(conn, "param", s)) {
			httplib_printf(conn, "<p>param set to %s</p>", s.c_str());
		} else {
			httplib_printf(conn, "<p>param not set</p>");
		}
		httplib_printf(conn, "</body></html>\n");
		return true;
	}

  public:
	bool
	handleGet(CivetServer *server, struct httplib_connection *conn)
	{
		return handleAll("GET", server, conn);
	}
	bool
	handlePost(CivetServer *server, struct httplib_connection *conn)
	{
		return handleAll("POST", server, conn);
	}
};

class ABHandler : public CivetHandler
{
  public:
	bool
	handleGet(CivetServer *server, struct httplib_connection *conn)
	{
		httplib_printf(conn,
		          "HTTP/1.1 200 OK\r\nContent-Type: "
		          "text/html\r\nConnection: close\r\n\r\n");
		httplib_printf(conn, "<html><body>");
		httplib_printf(conn, "<h2>This is the AB handler!!!</h2>");
		httplib_printf(conn, "</body></html>\n");
		return true;
	}
};

class FooHandler : public CivetHandler
{
  public:
	bool
	handleGet(CivetServer *server, struct httplib_connection *conn)
	{
		/* Handler may access the request info using httplib_get_request_info */
		const struct httplib_request_info *req_info = httplib_get_request_info(conn);

		httplib_printf(conn,
		          "HTTP/1.1 200 OK\r\nContent-Type: "
		          "text/html\r\nConnection: close\r\n\r\n");

		httplib_printf(conn, "<html><body>\n");
		httplib_printf(conn, "<h2>This is the Foo GET handler!!!</h2>\n");
		httplib_printf(conn,
		          "<p>The request was:<br><pre>%s %s HTTP/%s</pre></p>\n",
		          req_info->request_method,
		          req_info->uri,
		          req_info->http_version);
		httplib_printf(conn, "</body></html>\n");

		return true;
	}
	bool
	handlePost(CivetServer *server, struct httplib_connection *conn)
	{
		/* Handler may access the request info using httplib_get_request_info */
		const struct httplib_request_info *req_info = httplib_get_request_info(conn);
		int64_t rlen;
		int64_t wlen;
		int64_t nlen = 0;
		int64_t tlen = req_info->content_length;
		char buf[1024];

		httplib_printf(conn,
		          "HTTP/1.1 200 OK\r\nContent-Type: "
		          "text/html\r\nConnection: close\r\n\r\n");

		httplib_printf(conn, "<html><body>\n");
		httplib_printf(conn, "<h2>This is the Foo POST handler!!!</h2>\n");
		httplib_printf(conn,
		          "<p>The request was:<br><pre>%s %s HTTP/%s</pre></p>\n",
		          req_info->request_method,
		          req_info->uri,
		          req_info->http_version);
		httplib_printf(conn, "<p>Content Length: %li</p>\n", (long)tlen);
		httplib_printf(conn, "<pre>\n");

		while (nlen < tlen) {
			rlen = tlen - nlen;
			if (rlen > sizeof(buf)) {
				rlen = sizeof(buf);
			}
			rlen = httplib_read(conn, buf, (size_t)rlen);
			if (rlen <= 0) break;
			wlen = httplib_write(conn, buf, (size_t)rlen);
			if (rlen != rlen) break;
			nlen += wlen;
		}

		httplib_printf(conn, "\n</pre>\n");
		httplib_printf(conn, "</body></html>\n");

		return true;
	}

    #define fopen_recursive fopen

    bool
        handlePut(CivetServer *server, struct httplib_connection *conn)
    {
        /* Handler may access the request info using httplib_get_request_info */
        const struct httplib_request_info *req_info = httplib_get_request_info(conn);
        int64_t rlen;
	int64_t wlen;
        int64_t nlen = 0;
        int64_t tlen = req_info->content_length;
        FILE * f;
        char buf[1024];
        int fail = 0;

#ifdef _WIN32
        _snprintf(buf, sizeof(buf), "D:\\somewhere\\%s\\%s", req_info->remote_user, req_info->local_uri);
        buf[sizeof(buf)-1] = 0; /* TODO: check overflow */
        f = fopen_recursive(buf, "wb");
#else
        snprintf(buf, sizeof(buf), "~/somewhere/%s/%s", req_info->remote_user, req_info->local_uri);
        buf[sizeof(buf)-1] = 0; /* TODO: check overflow */
        f = fopen_recursive(buf, "w");
#endif

        if (!f) {
            fail = 1;
        } else {
            while (nlen < tlen) {
                rlen = tlen - nlen;
                if (rlen > sizeof(buf)) {
                    rlen = sizeof(buf);
                }
                rlen = httplib_read(conn, buf, (size_t)rlen);
                if (rlen <= 0) {
                    fail = 1;
                    break;
                }
                wlen = fwrite(buf, 1, (size_t)rlen, f);
                if (rlen != rlen) {
                    fail = 1;
                    break;
                }
                nlen += wlen;
            }
            fclose(f);
        }

        if (fail) {
            httplib_printf(conn,
                "HTTP/1.1 409 Conflict\r\n"
                "Content-Type: text/plain\r\n"
                "Connection: close\r\n\r\n");
        } else {
            httplib_printf(conn,
                "HTTP/1.1 201 Created\r\n"
                "Content-Type: text/plain\r\n"
                "Connection: close\r\n\r\n");
        }

        return true;
    }
};


int
main(int argc, char *argv[])
{
	const char *options[] = {
	    "document_root", DOCUMENT_ROOT, "listening_ports", PORT, 0};
    
    std::vector<std::string> cpp_options;
    for (int i=0; i<(sizeof(options)/sizeof(options[0])-1); i++) {
        cpp_options.push_back(options[i]);
    }

	// CivetServer server(options); // <-- C style start
    CivetServer server(cpp_options); // <-- C++ style start

	ExampleHandler h_ex;
	server.addHandler(EXAMPLE_URI, h_ex);

	ExitHandler h_exit;
	server.addHandler(EXIT_URI, h_exit);

	AHandler h_a;
	server.addHandler("/a", h_a);

	ABHandler h_ab;
	server.addHandler("/a/b", h_ab);

	FooHandler h_foo;
	server.addHandler("", h_foo);

	printf("Browse files at http://localhost:%s/\n", PORT);
	printf("Run example at http://localhost:%s%s\n", PORT, EXAMPLE_URI);
	printf("Exit at http://localhost:%s%s\n", PORT, EXIT_URI);

	while (!exitNow) {
#ifdef _WIN32
		Sleep(1000);
#else
		sleep(1);
#endif
	}

	printf("Bye!\n");

	return 0;
}
