# LibHTTP API Reference

### `httplib_read( conn, buf, len );`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
|**`conn`**|`struct httplib_connection *`| A pointer referencing the connection |
|**`buf`**|`void *`| A pointer to the location where the received data can be stored |
|**`len`**|`size_t`| The maximum number of bytes to be stored in the buffer |

### Return Value

| Type | Description |
| :--- | :--- |
|`int`| The number of read bytes, or a status indication |

### Description

The function `httplib_read()` receives data over an existing connection. The data is handled as binary and is stored in a buffer whose address has been provided as a parameter. The function returns the number of read bytes when successful, the value **0** when the connection has been closed by peer and a negative value when no more data could be read from the connection.

### See Also

* [`httplib_printf();`](httplib_printf.md)
* [`httplib_write();`](httplib_write.md)
