# LibHTTP API Reference

### `httplib_handle_form_request( conn, fdh );`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
|**`conn`**|`struct httplib_connection *`|The connection on which form data must be processed|
|**`fdh`**|`struct httplib_form_data_handler`|Structure with callback functions to to the heavy work|

### Return Value

| Type | Description |
| :--- | :--- |
|`int`|The number of fields processed, or an error code|

### Description

The function `httplib_handle_form_request()` processes form data on a connection. The function uses callback functions for the heavy lifting which are passed to the function as fields in a [`struct httplib_form_data_handler`](httplib_form_data_handler.md) structure. The number of processed fields is returned by the function, or a negative value when an error occured. I nthe situation where some fields are processed successfully (for example file downloads) and an error occurs later in the form processing, the function still returns a negative value. It is the responsibility of the calling party to do the necessary cleanup. The calling party should also do the cleanup of any files which are created, but not required anymore later.

### See Also

* [`struct httplib_form_data_handler;`](httplib_form_data_handler.md)
