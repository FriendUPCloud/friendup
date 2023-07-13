#About the 3rdparty folder

PDFJS
-----

In order for PDFs to be available on any platform, we are using Mozilla's PDF.js
implementation in JavaScript. This one has some options that does not align with
FriendOS  being a browser  based operating system.  Therefore, we  have done the
following modifications:

 * We have removed the "open file" button in the viewer.html file, by disabling
   the block with button ID "secondaryOpenFile"


