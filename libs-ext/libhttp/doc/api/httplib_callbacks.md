# LibHTTP API Reference

### `struct httplib_callbacks;`

### Fields

| Field | Description |
| :--- | :--- | 
|**`begin_request`**|**`int (*begin_request)( struct httplib_connection * conn );`**|
| |The `begin_request()` callback function is called when LibHTTP has received a new HTTP request. If the callback function does not process the request, it should return 0. In that case LibHTTP will handle the request with the default callback routine. If the callback function returns a value between 1 and 999, LibHTTP does nothing and the callback function should do all the processing, including sending the proper HTTP headers etc. Starting at LibHTTP version 1.7, the function `begin_request()` is called before any authorization is done. If an authorization check is required, `request_handler()` should be used instead. The return value of the callback function is not only used to signal LibHTTP to not further process the request. The returned value is also stored as HTTP status code in the access log. |
|**`connection_close`**|**`void (*connection_close)( const struct httplib_connection *conn );`**|
| |The callback function `connection_close()` is called when LibHTTP is closing a connection. The per-context mutex is locked when the callback function is invoked. The function is primarly useful for noting when a websocket is closing and removing it from any application-maintained list of clients. *Using this callback for websocket connections is deprecated. Use* `httplib_set_websocket_handler()` *instead.*|
|**`end_request`**|**`void (*end_request)( const struct httplib_connection * conn );`**|
| |The callback function `end_request()` is called by LibHTTP when a request has been completely processed. It sends the reply status code which was sent to the client to the application.|
|**`exit_context`**|**`void (*exit_context)( const struct httplib_context *ctx );`**|
| |The callback function `exit_context()` is called by LibHTTP when the server is stopped. It allows the application to do some cleanup on the application side.|
|**`http_error`**|**`int (*http_error)( struct httplib_connection *conn, int status );`**|
| |The callback function `http_error()` is called by LibHTTP just before an HTTP error is to be sent to the client. The function allows the application to send a custom error page. The status code of the error is provided as a parameter. If the application sends their own error page, it must return 1 to signal LibHTTP that no further processing is needed. If the returned value is 0, LibHTTP will send a built-in error page to the client.|
|**`init_context`**|**`void (*init_context)( const struct httplib_context *ctx );`**|
| |The callback function `init_context()` is called after the LibHTTP server has been started and initialized, but before any requests are served. This allowes the application to perform some initialization activities before the first requests are handled.|
|**`init_ssl`**|**`int (*init_ssl)( void *ssl_context, void *user_data );`**|
| |The callback function `init_ssl()` is called when LibHTTP initializes the SSL library. The parameter `user_data` contains a pointer to the data which was provided to `httplib_start()` when the server was started. The callback function can return 0 to signal that LibHTTP should setup the SSL certificate. With a return value of 1 the callback function signals LibHTTP that the certificate has already been setup and no further processing is necessary. The value -1 should be returned when the SSL initialization fails.|
|**`init_thread`**|**`void (*init_thread)( const struct httplib_context *ctx, int thread_type );`**|
| |The callback function `init_thread()` is called when a new thread is created by LibHTTP. The `thread_type` parameter indicates which type of thread has been created. following thread types are recognized:|
| |**0** - The master thread is created |
| |**1** - A worker thread which handles client connections has been created|
| |**2** - An internal helper thread (timer thread) has been created|
|**`log_access`**|**`int (*log_access)( const struct httplib_connection *conn, const char *message );`**|
| |The callback function `log_access()` is called when LibHTTP is about to log a message. If the callback function returns 0, LibHTTP will use the default internal access log routines to log the access. If a non-zero value is returned, LibHTTP assumes that access logging has already been done and no further action is performed.|
|**`log_message`**|**`int (*log_message)( const struct httplib_context *ctx, const struct httplib_connection *conn, const char *message );`**|
| |The callback function `log_message()` is called when LibHTTP is about to log a message. If the callback function returns 0, LibHTTP will use the default internal log routines to log the message. If a non-zero value is returned LibHTTP assumes that logging has already been done and no further action is performed. The `ctx` parameter will always have a value, but the `conn` parameter may be `NULL` in cases where an error is generated in a part of the system which is not directly handling connections.|
|**`open_file`**|**`const char *(*open_file)( const struct httplib_connection *conn, const char *path, size_t *data_len );`**|
| |The callback function `open_file()` is called when a file is to be opened by LibHTTP. The callback can return a pointer to a memory location and set the memory block size in the variable pointed to by `data_len` to signal LibHTTP that the file should not be loaded from disk, but that instead a stored version in memory should be used. If the callback function returns NULL, LibHTTP will open the file from disk. This callback allows caching to be implemented at the application side, or to serve specific files from static memory instead of from disk.|

### Description

Much of the functionality in the LibHTTP library is provided through callback functions. The application registers their own processing functions with the LibHTTP library and when an event happens, the appropriate callback function is called. In this way an application is able to have their processing code right at the heart of the webserver, without the need to change the code of the webserver itself. A number of callback functions are registered when the LibHTTP subsystem is started. Other may be added or changed at runtime with helper functions.

A pointer to a `httplib_callbacks` structure is passed as parameter to the [`httplib_start()`](httplib_start.md) function to provide links to callback functions which the webserver will call at specific events. If a specific callback function is not supplied, LibHTTP will fallback to default internal callback routines. Callback functions give the application detailed control over how specific events should be handled.

### See Also

* [`httplib_start();`](httplib_start.md)
* [`httplib_stop();`](httplib_stop.md)
