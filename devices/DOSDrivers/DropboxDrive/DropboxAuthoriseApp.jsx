/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

Application.run = function( msg, interface )
{
	// we need HTTPS for a valid redrect URL. We use friendos.com for that now
	var redirecturl = 'https://friendos.com/friendup/dropbox.php';
	
	var w = new View( { title: 'Dropbox Authorisation', width: 640, height: 360 } );
	w.setFlag('allowPopups', true);
	w.setContent('<div style="padding:25px;"><h1>Dropbox authorisation needed</h1><p>To enable FriendUP to access your Dropbox account you need to grant access once. You can revoke that access at any given time in your Dropbox settings</p><a href="javascript:window.open(\'{dropboxurl}&redirect_uri=\' + encodeURIComponent( \''+ redirecturl  + '\' ))" style="display:block; padding:25px; text-align:center; background:rgb(42,105,183); color:#FFF; font-weight:bold; text-transform:uppercase;">Click to go to Dropbox</a></div>');
	
	
}
