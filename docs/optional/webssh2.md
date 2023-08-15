Introduction
============

In order to manage a Linux server, SSHy is used in Friend OS to give the user
convenient shell access.

Installing WebSSH2
------------------

1) Run the SSHy install script, and either make sure the destination folder is
   writable, or use "sudo" when running the install script. This script is
   located in scripts/installers/install_SSHy.sh
   Make sure to run the installer from the friendup folder path like this:
    
   ```
     cd friendup/
     bash scripts/installers/install_webssh2.sh
   ```

2) Create a virtual host for SSHy's HTML component and also websocket proxy. 
   This is required in order to make a seamless integration of the app into 
   Friend OS. Example content:
   
   <VirtualHost *:80>
		ServerName sshy.devserver.com
		DocumentRoot /var/www/sshy/SSHy-master
		<Directory /var/www/sshy/SSHy-master>
		    Options Indexes FollowSymLinks
		    AllowOverride ALL
		</Directory>
	</VirtualHost>

	Use *:443 instead of *:80 if you are running it on HTTPS.
	
3) You now need to set up wsProxy. This is a requirement in order for SSHy to be
   able to reach a SSH server via websockets instead of raw sockets (which sadly
   aren't available to HTML5 developers).



