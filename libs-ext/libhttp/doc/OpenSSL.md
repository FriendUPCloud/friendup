Adding OpenSSL Support
=====

LibHTTP supports *HTTPS* connections using the OpenSSL transport layer
security (TLS) library. OpenSSL is a free, open source library (see
http://www.openssl.org/).


Getting Started
----

- Install OpenSSL on your system. There are OpenSSL install packages for all
  major Linux distributions as well as a setup for Windows.
- The default build configuration of the LibHTTP web server will load the
  required OpenSSL libraries, if a HTTPS certificate has been configured.


LibHTTP Configuration
----

The configuration file must contain an https port, identified by a letter 's'
attached to the port number.
To serve http and https from their standard ports use the following line in
the configuration file 'libhttp.conf':
<pre>
  listening_ports 80, 443s
</pre>
To serve only https use:
<pre>
  listening_ports 443s
</pre>

Furthermore the SSL certificate file must be set:
<pre>
  ssl_certificate d:\libhttp\certificate\server.pem
</pre>


Creating a self signed certificate
----

OpenSSL provides a command line interface, that can be used to create the
certificate file required by LibHTTP (server.pem).

One can use the following steps in Windows (in Linux replace "copy" by "cp"
and "type" by "cat"):

<pre>
  openssl genrsa -des3 -out server.key 1024

  openssl req -new -key server.key -out server.csr

  copy server.key server.key.orig

  openssl rsa -in server.key.orig -out server.key

  openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.crt

  copy server.crt server.pem

  type server.key >> server.pem
</pre>

The server.pem file created must contain a 'CERTIFICATE' section as well as a
'RSA PRIVATE KEY' section. It should look like this (x represents BASE64
encoded data):

<pre>
-----BEGIN CERTIFICATE-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END CERTIFICATE-----
-----BEGIN RSA PRIVATE KEY-----
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END RSA PRIVATE KEY-----
</pre>


Including a certificate from a certificate authority
----

LibHTTP requires one certificate file in PEM format.
If you got multiple files from your certificate authority,
you need to copy their content together into one file.
Make sure the file has one section BEGIN RSA PRIVATE KEY /
END RSA PRIVATE KEY, and at least one section
BEGIN CERTIFICATE / END CERTIFICATE.
In case you received a file with a section
BEGIN PRIVATE KEY / END PRIVATE KEY,
you may get a suitable file by adding the letters RSA manually.

Set the "ssl_certificate" configuration parameter to the
file name (including path) of the resulting *.pem file.

The file must look like the file in the section
"Creating a self signed certificate", but it will have several
BEGIN CERTIFICATE / END CERTIFICATE sections.


Common Problems
----

In case the OpenSSL configuration is not set up correctly, the server will not
start. Configure an error log file in 'libhttp.conf' to get more information:
<pre>
  error_log_file error.log
</pre>

Check the content of 'error.log':

<pre>
load_dll: cannot load libeay32.*/libcrypto.*/ssleay32.*/libssl.*
</pre>
This error message means, the SSL library has not been installed (correctly).
For Windows you might use the pre-built binaries. A link is available at the
OpenSSL project home page (http://www.openssl.org/related/binaries.html).
Choose the windows system folder as installation directory - this is the
default location.

<pre>
set_ssl_option: cannot open server.pem: error:PEM routines:*:PEM_read_bio:no start line
set_ssl_option: cannot open server.pem: error:PEM routines:*:PEM_read_bio:bad end line
</pre>
These error messages indicate, that the format of the ssl_certificate file does
not match the expectations of the SSL library. The PEM file must contain both,
a 'CERTIFICATE' and a 'RSA PRIVATE KEY' section. It should be a strict ASCII
file without byte-order marks.
The instructions above may be used to create a valid ssl_certificate file.


